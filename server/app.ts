import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import workUpdatesRoutes from './routes/workUpdates';
import leaveAndCorrectionsRoutes from './routes/leaveAndCorrections';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';
import syncRoutes from './routes/googleSheetSync';
import { getDb, initDatabase, isTiDBConnected } from './db';

dotenv.config();

const app = express();

// Enable CORS and Preflight handling for seamless cross-origin and serverless calls
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Restore original URL if rewritten by Vercel edge
app.use((req, res, next) => {
  const matched = (req.headers['x-matched-path'] || req.headers['x-now-route-matches']) as string;
  if (matched && matched.startsWith('/api')) {
    req.url = matched;
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logger for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[HTTP] ${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Database lazy initialization singleton
let dbInitStarted = false;

export function ensureDbInitialized(): Promise<any> {
  // Ensure local in-memory dataset is available instantly (0ms)
  getDb();

  if (!dbInitStarted) {
    dbInitStarted = true;
    return initDatabase().catch((err: any) => {
      console.warn('[Database] Background init notice:', err?.message);
      return { engine: 'json', message: err?.message };
    });
  }
  return Promise.resolve();
}

// Background trigger without blocking serverless function cold start
app.use((req, res, next) => {
  ensureDbInitialized().catch(() => {});
  next();
});

// Health check endpoints
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'healthy',
    app: 'BUILDREX Smart Attendance & Work Management System',
    database: isTiDBConnected() ? 'tidb_cloud' : 'json_store',
    timestamp: new Date().toISOString(),
  });
});

app.get(['/api', '/api/'], (req, res) => {
  res.json({
    status: 'healthy',
    message: 'BUILDREX API Gateway Operational',
    timestamp: new Date().toISOString(),
  });
});

// API Routes mounted with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', attendanceRoutes); // For /api/admin/attendance endpoints
app.use('/api/work-updates', workUpdatesRoutes);
app.use('/api/leave-requests', leaveAndCorrectionsRoutes);
app.use('/api', leaveAndCorrectionsRoutes); // For /api/attendance/correction-requests
app.use('/api/admin', adminRoutes);
app.use('/api', adminRoutes); // For /api/departments, /api/notifications
app.use('/api/ai', aiRoutes);
app.use('/api/sync', syncRoutes);

// 404 Fallback handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
  });
});

// Global API error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    message: err?.message || 'An unexpected internal error occurred on the server.',
  });
});

export default app;
