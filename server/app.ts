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
import { initDatabase, isTiDBConnected } from './db';

dotenv.config();

const app = express();

// Enable CORS and Preflight handling for seamless online & cross-origin deployment
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

// Database lazy initialization singleton for serverless environments (Vercel) & local server
let dbInitPromise: Promise<any> | null = null;

export async function ensureDbInitialized() {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((err) => {
      console.warn('[Database] Auto-init fallback warning:', err.message);
      return { engine: 'json', message: err.message };
    });
  }
  return dbInitPromise;
}

// Middleware to ensure DB is initialized before handling API requests
app.use(async (req, res, next) => {
  try {
    await ensureDbInitialized();
  } catch {
    // Proceed with fallback datastore
  }
  next();
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

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'healthy',
    app: 'BUILDREX Smart Attendance & Work Management System',
    database: isTiDBConnected() ? 'tidb_cloud' : 'json_store',
    timestamp: new Date().toISOString(),
  });
});

// Global API error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected internal error occurred on the server.',
  });
});

export default app;
