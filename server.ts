import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth';
import attendanceRoutes from './server/routes/attendance';
import workUpdatesRoutes from './server/routes/workUpdates';
import leaveAndCorrectionsRoutes from './server/routes/leaveAndCorrections';
import adminRoutes from './server/routes/admin';
import aiRoutes from './server/routes/ai';
import syncRoutes from './server/routes/googleSheetSync';
import { getDb, initDatabase, isTiDBConnected } from './server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize DB: TiDB Cloud if configured, or local JSON fallback
  await initDatabase();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/work-updates', workUpdatesRoutes);
  app.use('/api/leave-requests', leaveAndCorrectionsRoutes);
  app.use('/api', leaveAndCorrectionsRoutes); // For /api/attendance/correction-requests
  app.use('/api/admin', adminRoutes);
  app.use('/api', adminRoutes); // For /api/departments, /api/notifications
  app.use('/api/ai', aiRoutes);
  app.use('/api/sync', syncRoutes);

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'BUILDREX Smart Attendance & Work Management System',
      database: isTiDBConnected() ? 'tidb_cloud' : 'json_store',
      timestamp: new Date().toISOString(),
    });
  });

  // Global API error handler
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'An unexpected internal error occurred on the server.',
    });
  });

  // Frontend integration: Vite middleware in development or static dist in production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BUILDREX server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
