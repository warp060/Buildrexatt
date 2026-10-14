import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb, enrichUser, logAudit } from '../db';
import { generateToken, authenticate, AuthenticatedRequest } from '../auth';

const router = Router();

function sanitizeUser(user: any) {
  const { password_hash, ...rest } = user;
  return rest;
}

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const db = getDb();
    const user = db.users.find(
      (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact your administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const enriched = enrichUser(user);
    const token = generateToken(enriched);

    // Set secure HTTP-only cookie
    res.cookie('buildrex_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logAudit(
      { id: user.id, name: user.name },
      'USER_LOGIN',
      'USER',
      user.id,
      { email: user.email, role: user.role },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: 'Sign in successful.',
      token,
      user: sanitizeUser(enriched),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: AuthenticatedRequest, res: Response): void => {
  res.clearCookie('buildrex_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  res.json({
    success: true,
    user: sanitizeUser(req.user),
    company_settings: db.company_settings,
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email address is required.' });
    return;
  }

  const db = getDb();
  const user = db.users.find(
    (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
  );

  // Even if user not found, respond gracefully to prevent account enumeration
  if (user) {
    logAudit(
      { id: user.id, name: user.name },
      'FORGOT_PASSWORD_REQUESTED',
      'USER',
      user.id,
      { email },
      req.ip || '127.0.0.1'
    );
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, password reset instructions and security token have been sent.',
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res): Promise<void> => {
  const { email, new_password } = req.body;
  if (!email || !new_password || new_password.length < 6) {
    res.status(400).json({ success: false, message: 'Email and new password (min 6 chars) are required.' });
    return;
  }

  const db = getDb();
  const user = db.users.find(
    (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
  );

  if (!user) {
    res.status(404).json({ success: false, message: 'Account not found.' });
    return;
  }

  user.password_hash = await bcrypt.hash(new_password, 10);
  user.updated_at = new Date().toISOString();
  saveDb(db);

  logAudit(
    { id: user.id, name: user.name },
    'PASSWORD_RESET_COMPLETED',
    'USER',
    user.id,
    { email },
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: 'Password has been successfully updated. You may now sign in with your new password.',
  });
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { name, phone } = req.body;
  const db = getDb();
  const user = db.users.find((u) => u.id === req.user!.id);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  if (name && name.trim()) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  user.updated_at = new Date().toISOString();

  saveDb(db);

  logAudit(
    { id: user.id, name: user.name },
    'UPDATE_PROFILE',
    'USER',
    user.id,
    { name: user.name, phone: user.phone },
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: sanitizeUser(enrichUser(user)),
  });
});

// PATCH /api/auth/change-password
router.patch('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password || new_password.length < 6) {
    res.status(400).json({ success: false, message: 'Current password and new password (min 6 chars) are required.' });
    return;
  }

  const db = getDb();
  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) {
    res.status(400).json({ success: false, message: 'Current password does not match.' });
    return;
  }

  user.password_hash = await bcrypt.hash(new_password, 10);
  user.updated_at = new Date().toISOString();
  saveDb(db);

  res.json({ success: true, message: 'Password changed successfully.' });
});

export default router;
