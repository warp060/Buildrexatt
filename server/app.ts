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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database lazy initialization singleton
let dbInitPromise: Promise<any> | null = null;

export function ensureDbInitialized() {
  if (!dbInitPromise) {
    // Immediately ensure local database is loaded synchronously into memory
    getDb();
    dbInitPromise = initDatabase().catch((err: any) => {
      console.warn('[Database] Auto-init fallback warning:', err?.message);
      return { engine: 'json', message: err?.message };
    });
  }
  return dbInitPromise;
}

// Kick off initialization immediately
ensureDbInitialized();

// Middleware to ensure DB has a chance to initialize without hanging requests
app.use(async (req, res, next) => {
  try {
    await Promise.race([
      ensureDbInitialized(),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch {
    // Proceed with local store
  }
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
app.use('/api/work-updates', workUpdatesRoutes);
app.use('/api/leave-requests', leaveAndCorrectionsRoutes);
app.use('/api', leaveAndCorrectionsRoutes); // For /api/attendance/correction-requests
app.use('/api/admin', adminRoutes);
app.use('/api', adminRoutes); // For /api/departments, /api/notifications
app.use('/api/ai', aiRoutes);
app.use('/api/sync', syncRoutes);

// Duplicate mounts without /api prefix to handle serverless rewrites seamlessly
app.use('/auth', authRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/work-updates', workUpdatesRoutes);
app.use('/leave-requests', leaveAndCorrectionsRoutes);
app.use('/admin', adminRoutes);
app.use('/ai', aiRoutes);
app.use('/sync', syncRoutes);

// Global API error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    message: err?.message || 'An unexpected internal error occurred on the server.',
  });
});

export default app;
