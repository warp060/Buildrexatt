import app, { ensureDbInitialized } from './app';

export default async function handler(req: any, res: any) {
  try {
    await ensureDbInitialized();
  } catch (err: any) {
    console.warn('[Serverless] Database initialization notice:', err?.message);
  }

  return new Promise<void>((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('close', () => resolve());
    res.on('error', (err: any) => reject(err));
    app(req, res);
  });
}
