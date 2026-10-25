import app, { ensureDbInitialized } from '../server/app';

export default async function handler(req: any, res: any) {
  try {
    await ensureDbInitialized();
  } catch (err: any) {
    console.warn('[Vercel Serverless] DB init warning:', err?.message);
  }
  return app(req, res);
}
