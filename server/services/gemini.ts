import { GoogleGenAI } from '@google/genai';
import { WorkUpdate } from '../types';
import fs from 'fs';
import path from 'path';

export interface PolishedReportResult {
  tasks_completed: string;
  project_details: string;
  accomplishments: string;
  blockers: string;
  next_day_plan: string;
  summary: string;
  polish_notes: string;
  is_simulated: boolean;
  model: string;
}

export interface BlockerRadarItem {
  id: string;
  severity: 'critical' | 'moderate' | 'low';
  department: string;
  reporter: string;
  role: string;
  blocker: string;
  impact: string;
  action_plan: string;
}

export interface DepartmentMomentum {
  department: string;
  active_members: number;
  total_hours: number;
  key_achievements: string[];
  status: 'on_track' | 'blocked' | 'needs_attention';
}

export interface ExecutiveDigestResult {
  date: string;
  total_reports: number;
  total_hours: number;
  executive_summary: string;
  key_highlights: string[];
  blocker_radar: BlockerRadarItem[];
  department_momentum: DepartmentMomentum[];
  suggested_leadership_actions: string[];
  is_simulated: boolean;
  model: string;
  generated_at: string;
}

export interface SupervisorFeedbackResult {
  suggested_comment: string;
  sentiment: 'positive' | 'constructive' | 'needs_urgent_followup';
  key_deliverables_noted: string[];
  recommended_status: 'reviewed' | 'needs_revision';
  coaching_tip: string;
  is_simulated: boolean;
  model: string;
}

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''
    ? process.env.GEMINI_API_KEY.trim()
    : null;
}

export function getAiStatus(): { hasApiKey: boolean; model: string; mode: 'live' | 'simulated' } {
  const key = getApiKey();
  return {
    hasApiKey: Boolean(key),
    model: key ? 'gemini-2.5-flash' : 'buildrex-heuristic-ai-v1',
    mode: key ? 'live' : 'simulated',
  };
}

export async function setGeminiApiKey(newKey: string): Promise<boolean> {
  process.env.GEMINI_API_KEY = newKey.trim();

  // Try updating .env file if it exists
  const envPath = path.resolve(process.cwd(), '.env');
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }
    if (envContent.includes('GEMINI_API_KEY=')) {
      envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${newKey.trim()}`);
    } else {
      envContent += `\nGEMINI_API_KEY=${newKey.trim()}\n`;
    }
    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
  } catch (err) {
    console.warn('Could not write GEMINI_API_KEY to .env:', err);
  }

  return true;
}

// -------------------------------------------------------------
// 1. Polish & Enhance Work Update
// -------------------------------------------------------------
export async function polishWorkReport(input: {
  project_details: string;
  tasks_completed: string;
  accomplishments?: string;
  blockers?: string;
  next_day_plan?: string;
  user_name?: string;
  role?: string;
}): Promise<PolishedReportResult> {
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an elite enterprise Engineering & Operations Director at BUILDREX.
A team member (${input.user_name || 'Team Member'}, Role: ${input.role || 'Member'}) drafted their daily work update.
Refactor and polish their notes into crisp, highly professional, impact-oriented phrasing suitable for executive visibility.

INPUT DATA:
- Project / Focus Area: ${input.project_details || 'General Tasks'}
- Tasks Completed: ${input.tasks_completed || 'None'}
- Key Accomplishments: ${input.accomplishments || 'None stated'}
- Blockers / Challenges: ${input.blockers || 'None'}
- Next Day Plan: ${input.next_day_plan || 'None stated'}

CRITICAL INSTRUCTIONS:
- Use strong action verbs (Architected, Engineered, Implemented, Benchmarked, Streamlined, Resolved).
- Tasks should be formatted with clean "- " bullet points.
- If blockers are "none" or empty, format as "None encountered. Sprint execution on track."
- If blockers describe delays or dependencies, articulate the root cause and needed resolution clearly.
- Output ONLY valid JSON in this exact structure without markdown backticks:
{
  "tasks_completed": "...",
  "project_details": "...",
  "accomplishments": "...",
  "blockers": "...",
  "next_day_plan": "...",
  "summary": "...",
  "polish_notes": "..."
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const raw = res.text?.trim() || '';
      const cleanJson = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        tasks_completed: parsed.tasks_completed || input.tasks_completed,
        project_details: parsed.project_details || input.project_details,
        accomplishments: parsed.accomplishments || (input.accomplishments || ''),
        blockers: parsed.blockers || (input.blockers || ''),
        next_day_plan: parsed.next_day_plan || (input.next_day_plan || ''),
        summary: parsed.summary || 'Daily deliverables structured and verified.',
        polish_notes: parsed.polish_notes || 'Polished phrasing with impact-driven action verbs.',
        is_simulated: false,
        model: 'gemini-2.5-flash',
      };
    } catch (err) {
      console.warn('Gemini API call failed, falling back to heuristic engine:', err);
    }
  }

  // Smart Heuristic Engine (Fallback)
  return simulatePolishWorkReport(input);
}

function simulatePolishWorkReport(input: {
  project_details: string;
  tasks_completed: string;
  accomplishments?: string;
  blockers?: string;
  next_day_plan?: string;
}): PolishedReportResult {
  const rawTasks = (input.tasks_completed || '').split('\n').filter((l) => l.trim().length > 0);
  const verbs = ['Engineered', 'Implemented', 'Streamlined', 'Verified', 'Integrated', 'Optimized', 'Refactored'];

  const polishedTasksList = rawTasks.map((line, idx) => {
    let clean = line.replace(/^[-*•\d.]+\s*/, '').trim();
    if (!clean) return '';
    // Capitalize first letter
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    // Check if it already starts with a strong verb
    const firstWord = clean.split(' ')[0].toLowerCase();
    const hasVerb = ['built', 'added', 'fixed', 'created', 'tested', 'updated', 'designed', 'wrote'].includes(firstWord);
    if (!hasVerb && !clean.endsWith('ed')) {
      const verb = verbs[idx % verbs.length];
      return `- ${verb} ${clean.charAt(0).toLowerCase() + clean.slice(1)}`;
    }
    return `- ${clean}`;
  }).filter(Boolean);

  const polishedTasks = polishedTasksList.length > 0 ? polishedTasksList.join('\n') : `- Engineered key components for ${input.project_details}`;

  let polishedAccomplishments = input.accomplishments?.trim() || '';
  if (!polishedAccomplishments) {
    polishedAccomplishments = `Successfully delivered planned milestones with full regression validation for ${input.project_details}.`;
  } else if (!polishedAccomplishments.startsWith('-')) {
    polishedAccomplishments = `• Key Milestone: ${polishedAccomplishments}`;
  }

  let polishedBlockers = input.blockers?.trim() || '';
  if (!polishedBlockers || polishedBlockers.toLowerCase() === 'none' || polishedBlockers.toLowerCase() === 'no') {
    polishedBlockers = 'No active blockers. Execution progressing within sprint timelines.';
  } else {
    polishedBlockers = `⚠️ Identified Dependency / Risk: ${polishedBlockers}`;
  }

  let polishedPlan = input.next_day_plan?.trim() || '';
  if (!polishedPlan) {
    polishedPlan = `- Continue feature delivery and automated testing for ${input.project_details}\n- Conduct peer code review and sync with project lead`;
  } else if (!polishedPlan.includes('-')) {
    polishedPlan = polishedPlan.split('.').filter((s) => s.trim()).map((s) => `- ${s.trim()}`).join('\n');
  }

  return {
    tasks_completed: polishedTasks,
    project_details: input.project_details.trim() || 'Core Engineering Deliverables',
    accomplishments: polishedAccomplishments,
    blockers: polishedBlockers,
    next_day_plan: polishedPlan,
    summary: `Executed ${rawTasks.length || 1} core deliverables across ${input.project_details}.`,
    polish_notes: 'Transformed informal notes into high-impact, audit-ready engineering records.',
    is_simulated: true,
    model: 'buildrex-heuristic-ai-v1',
  };
}

// -------------------------------------------------------------
// 2. Executive Digest & Blocker Radar for Managers
// -------------------------------------------------------------
export async function generateDailyExecutiveDigest(
  reports: WorkUpdate[],
  targetDate: string
): Promise<ExecutiveDigestResult> {
  const apiKey = getApiKey();
  const totalHours = reports.reduce((acc, r) => acc + (r.hours_spent || 0), 0);

  if (reports.length === 0) {
    return {
      date: targetDate,
      total_reports: 0,
      total_hours: 0,
      executive_summary: `No daily work reports were submitted for ${targetDate}. Operations or team standups may be pending.`,
      key_highlights: ['No submissions logged yet for this reporting date.'],
      blocker_radar: [],
      department_momentum: [],
      suggested_leadership_actions: ['Trigger daily standup reminder to department leads.'],
      is_simulated: true,
      model: 'buildrex-heuristic-ai-v1',
      generated_at: new Date().toISOString(),
    };
  }

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are the Chief Technology Officer / COO at BUILDREX reviewing today's (${targetDate}) team submissions.
Synthesize all employee and intern daily reports into an executive briefing and blocker radar.

TEAM REPORTS DATA (${reports.length} total submissions):
${JSON.stringify(
  reports.map((r) => ({
    name: r.user_name,
    code: r.employee_code,
    role: r.role,
    department: r.department_name,
    project: r.project_details,
    tasks: r.tasks_completed,
    accomplishments: r.accomplishments,
    blockers: r.blockers,
    next_plan: r.next_day_plan,
    hours: r.hours_spent,
    status: r.status,
  })),
  null,
  2
)}

CRITICAL INSTRUCTIONS:
- Analyze all blockers and assess risk severity ('critical' | 'moderate' | 'low').
- Aggregate momentum per department.
- Output ONLY valid JSON in this exact structure without markdown backticks:
{
  "executive_summary": "2-3 punchy sentences summarizing overall company progress, velocity, and health.",
  "key_highlights": ["3-5 prominent team wins or milestone deliverables"],
  "blocker_radar": [
    {
      "id": "blocker-1",
      "severity": "critical" or "moderate" or "low",
      "department": "Engineering / Operations / etc",
      "reporter": "Person name",
      "role": "intern or employee",
      "blocker": "Summary of blocker",
      "impact": "What is delayed or at risk",
      "action_plan": "Concrete recommendation for management to intervene and unblock"
    }
  ],
  "department_momentum": [
    {
      "department": "Department Name",
      "active_members": 2,
      "total_hours": 16.0,
      "key_achievements": ["achievement 1", "achievement 2"],
      "status": "on_track" or "blocked" or "needs_attention"
    }
  ],
  "suggested_leadership_actions": [
    "Action 1 for tomorrow morning",
    "Action 2",
    "Action 3"
  ]
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const raw = res.text?.trim() || '';
      const cleanJson = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        date: targetDate,
        total_reports: reports.length,
        total_hours: totalHours,
        executive_summary: parsed.executive_summary || `Team delivered across ${reports.length} workstreams on ${targetDate}.`,
        key_highlights: parsed.key_highlights || [],
        blocker_radar: (parsed.blocker_radar || []).map((b: any, idx: number) => ({
          ...b,
          id: b.id || `blocker-${idx + 1}`,
        })),
        department_momentum: parsed.department_momentum || [],
        suggested_leadership_actions: parsed.suggested_leadership_actions || [],
        is_simulated: false,
        model: 'gemini-2.5-flash',
        generated_at: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('Gemini Executive Digest call failed, falling back to heuristic engine:', err);
    }
  }

  // Heuristic Simulation Engine
  return simulateDailyExecutiveDigest(reports, targetDate);
}

function simulateDailyExecutiveDigest(reports: WorkUpdate[], targetDate: string): ExecutiveDigestResult {
  const totalHours = reports.reduce((acc, r) => acc + (r.hours_spent || 0), 0);

  // Group by department
  const deptMap: Record<string, { members: Set<string>; hours: number; achievements: string[]; hasBlocker: boolean }> = {};
  const blockerRadar: BlockerRadarItem[] = [];
  const keyHighlights: string[] = [];

  reports.forEach((r, idx) => {
    const dept = r.department_name || 'General Operations';
    if (!deptMap[dept]) {
      deptMap[dept] = { members: new Set(), hours: 0, achievements: [], hasBlocker: false };
    }
    deptMap[dept].members.add(r.user_name || r.user_id);
    deptMap[dept].hours += r.hours_spent || 0;

    if (r.accomplishments && r.accomplishments.trim() && r.accomplishments.toLowerCase() !== 'none') {
      const cleanAcc = r.accomplishments.replace(/^[-*•\s]+/, '').trim();
      keyHighlights.push(`${r.user_name} (${dept}): ${cleanAcc}`);
      deptMap[dept].achievements.push(cleanAcc);
    } else if (r.project_details) {
      keyHighlights.push(`${r.user_name} delivered milestones on ${r.project_details}`);
    }

    // Inspect blockers
    if (r.blockers && r.blockers.trim() && !['none', 'nil', 'no', 'none encountered', 'n/a'].includes(r.blockers.trim().toLowerCase())) {
      deptMap[dept].hasBlocker = true;
      const lower = r.blockers.toLowerCase();
      let severity: 'critical' | 'moderate' | 'low' = 'moderate';
      if (lower.includes('blocked') || lower.includes('crash') || lower.includes('broken') || lower.includes('permission') || lower.includes('credentials')) {
        severity = 'critical';
      } else if (lower.includes('minor') || lower.includes('slow') || lower.includes('waiting')) {
        severity = 'low';
      }

      blockerRadar.push({
        id: `blocker-${idx + 1}`,
        severity,
        department: dept,
        reporter: r.user_name || 'Team Member',
        role: r.role || 'employee',
        blocker: r.blockers,
        impact: `Sprint velocity for ${r.project_details} is constrained until resolved.`,
        action_plan: `Supervisor should sync with ${r.user_name} and review access/credentials dependency.`,
      });
    }
  });

  const departmentMomentum: DepartmentMomentum[] = Object.entries(deptMap).map(([dept, val]) => ({
    department: dept,
    active_members: val.members.size,
    total_hours: val.hours,
    key_achievements: val.achievements.slice(0, 3),
    status: val.hasBlocker ? (blockerRadar.some((b) => b.department === dept && b.severity === 'critical') ? 'blocked' : 'needs_attention') : 'on_track',
  }));

  const criticalCount = blockerRadar.filter((b) => b.severity === 'critical').length;
  const executiveSummary = `On ${targetDate}, ${reports.length} team members logged ${totalHours.toFixed(1)} dedicated hours across ${Object.keys(deptMap).length} departments. ${
    criticalCount > 0
      ? `Notice: ${criticalCount} high-priority roadblock requires immediate supervisory clearance.`
      : 'Overall team output remains stable with steady sprint delivery across all active projects.'
  }`;

  const suggestedActions: string[] = [
    criticalCount > 0
      ? `Conduct an unblocking sync for ${blockerRadar[0]?.reporter} regarding: "${blockerRadar[0]?.blocker.slice(0, 60)}..."`
      : 'Review and sign off on pending intern daily work submissions before end of day.',
    'Acknowledge standout deliverables from today\'s high-impact contributors.',
    'Align cross-department dependencies during tomorrow morning\'s 9:30 AM standup.',
  ];

  return {
    date: targetDate,
    total_reports: reports.length,
    total_hours: totalHours,
    executive_summary: executiveSummary,
    key_highlights: keyHighlights.slice(0, 5),
    blocker_radar: blockerRadar,
    department_momentum: departmentMomentum,
    suggested_leadership_actions: suggestedActions,
    is_simulated: true,
    model: 'buildrex-heuristic-ai-v1',
    generated_at: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// 3. Supervisor Feedback & Review Assistant
// -------------------------------------------------------------
export async function generateSupervisorFeedback(report: WorkUpdate): Promise<SupervisorFeedbackResult> {
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a supportive, high-standards senior engineering mentor & supervisor at BUILDREX.
Review this daily work update submitted by ${report.user_name || 'an intern'} (Role: ${report.role}, Department: ${report.department_name}).

WORK UPDATE:
- Project: ${report.project_details}
- Tasks Completed: ${report.tasks_completed}
- Accomplishments: ${report.accomplishments || 'None stated'}
- Blockers: ${report.blockers || 'None'}
- Next Day Plan: ${report.next_day_plan || 'None'}
- Hours: ${report.hours_spent}h

CRITICAL INSTRUCTIONS:
- Generate a thoughtful, constructive, encouraging supervisor review comment (2-3 sentences).
- If blockers exist, provide actionable mentoring guidance or reassurance that leadership will help.
- Output ONLY valid JSON in this exact structure without markdown backticks:
{
  "suggested_comment": "...",
  "sentiment": "positive" or "constructive" or "needs_urgent_followup",
  "key_deliverables_noted": ["deliverable 1", "deliverable 2"],
  "recommended_status": "reviewed" or "needs_revision",
  "coaching_tip": "One concise mentoring tip for their career growth"
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const raw = res.text?.trim() || '';
      const cleanJson = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        suggested_comment: parsed.suggested_comment || 'Great progress on today\'s deliverables. Approved.',
        sentiment: parsed.sentiment || 'positive',
        key_deliverables_noted: parsed.key_deliverables_noted || [report.project_details],
        recommended_status: parsed.recommended_status || 'reviewed',
        coaching_tip: parsed.coaching_tip || 'Keep breaking down complex tasks into smaller verifiable PRs.',
        is_simulated: false,
        model: 'gemini-2.5-flash',
      };
    } catch (err) {
      console.warn('Gemini Supervisor Feedback call failed, falling back to heuristic engine:', err);
    }
  }

  // Heuristic Simulation Engine
  const hasBlocker = report.blockers && !['none', 'nil', 'no'].includes(report.blockers.toLowerCase().trim());
  const firstName = (report.user_name || 'team member').split(' ')[0];

  let comment = '';
  let tip = '';

  if (hasBlocker) {
    comment = `Solid momentum on ${report.project_details}, ${firstName}. I noted the blocker regarding "${report.blockers.slice(0, 50)}...". I will follow up with the platform team first thing tomorrow to get this unblocked for you.`;
    tip = 'When blocked by 3rd-party dependencies, document the exact error codes or ticket numbers in the comments.';
  } else {
    comment = `Excellent work today, ${firstName}. The tasks on ${report.project_details} are clear, well-structured, and demonstrate strong adherence to engineering standards. Keep up the great velocity!`;
    tip = 'Consider writing a quick architecture note or sharing your learnings with other interns in Slack.';
  }

  return {
    suggested_comment: comment,
    sentiment: hasBlocker ? 'constructive' : 'positive',
    key_deliverables_noted: [report.project_details],
    recommended_status: 'reviewed',
    coaching_tip: tip,
    is_simulated: true,
    model: 'buildrex-heuristic-ai-v1',
  };
}
