import { Router, Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth';
import { getDb, enrichWorkUpdate, getTodayStr } from '../db';
import {
  getAiStatus,
  setGeminiApiKey,
  polishWorkReport,
  generateDailyExecutiveDigest,
  generateSupervisorFeedback,
} from '../services/gemini';

const router = Router();

// GET /api/ai/status
router.get('/status', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    success: true,
    status: getAiStatus(),
  });
});

// POST /api/ai/set-key (Admin or developer mode)
router.post('/set-key', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(400).json({ success: false, message: 'Valid apiKey string is required.' });
    return;
  }

  await setGeminiApiKey(apiKey);
  res.json({
    success: true,
    message: 'Gemini API key updated successfully.',
    status: getAiStatus(),
  });
});

// POST /api/ai/polish-report
router.post('/polish-report', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { project_details, tasks_completed, accomplishments, blockers, next_day_plan } = req.body;

    if (!project_details && !tasks_completed) {
      res.status(400).json({
        success: false,
        message: 'Please provide at least a project focus or tasks completed to polish.',
      });
      return;
    }

    const result = await polishWorkReport({
      project_details: project_details || '',
      tasks_completed: tasks_completed || '',
      accomplishments,
      blockers,
      next_day_plan,
      user_name: req.user?.name,
      role: req.user?.role,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('AI Polish error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to polish work report.',
    });
  }
});

// POST /api/ai/executive-digest (Admin only)
router.post('/executive-digest', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const targetDate = req.body.date || getTodayStr();

    // Fetch reports for date
    let reports = db.work_updates
      .filter((w) => w.work_date === targetDate && w.status !== 'draft')
      .map(enrichWorkUpdate);

    // If no reports found on today, grab recent submitted reports as fallback demo context
    if (reports.length === 0) {
      reports = db.work_updates
        .filter((w) => w.status !== 'draft')
        .slice(0, 10)
        .map(enrichWorkUpdate);
    }

    const result = await generateDailyExecutiveDigest(reports, targetDate);

    res.json({
      success: true,
      digest: result,
    });
  } catch (err: any) {
    console.error('AI Digest error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate executive digest.',
    });
  }
});

// POST /api/ai/supervisor-feedback (Admin only)
router.post('/supervisor-feedback', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { report_id } = req.body;
    const db = getDb();

    let targetReport = db.work_updates.find((w) => w.id === report_id);
    if (!targetReport && req.body.report) {
      targetReport = req.body.report;
    }

    if (!targetReport) {
      res.status(404).json({ success: false, message: 'Target work report not found.' });
      return;
    }

    const enriched = enrichWorkUpdate(targetReport);
    const result = await generateSupervisorFeedback(enriched);

    res.json({
      success: true,
      feedback: result,
    });
  } catch (err: any) {
    console.error('AI Feedback error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate supervisor feedback.',
    });
  }
});

export default router;
