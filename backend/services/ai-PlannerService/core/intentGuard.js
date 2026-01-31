// ai-PlannerService/core/intentGuard.js

// CHANGE: integrate LLM-based intent where available, with safe heuristic fallback.

import { llmAnalyzePlanPrompt, llmAnalyzeTaskPrompt } from './llmIntentClient.js'

// helpers
function normalize(text = '') {
  return String(text || '').trim()
}

function wordsOf(text) {
  return normalize(text).split(/\s+/).filter(Boolean)
}

function isGreeting(text) {
  const t = text.toLowerCase()
  return /^(hi|hello|hey|yo|salam|aslam|assalam|assalamu)/.test(t)
}

function isThanks(text) {
  const t = text.toLowerCase()
  return /(thank(s| you)|shukriya|bohot shukria)/.test(t)
}

function isDirectTaskRequest(prompt) {
  const p = String(prompt || '').toLowerCase().trim()

  if (!p) return false

  // “generate/create/make/list ... task(s) for ...”
  if (/\b(generate|create|make|list)\b[^.]*\btask(s)?\b[^.]*\bfor\b/.test(p)) {
    return true
  }

  // “task(s) for jwt auth / json web token / etc” even with typos
  if (/^\s*task(s)?\s+for\b/.test(p)) {
    return true
  }

  return false
}

function isDirectPlanRequest(prompt) {
  const p = String(prompt || '').toLowerCase().trim()
  if (!p) return false

  // Examples:
  // "create project plan for ecommerce app"
  // "plan saas project management tool"
  // "generate roadmap for mobile banking application"
  if (/\b(plan|design|outline|roadmap|strategy)\b[^.\n]*\b(project|product|app|application|system|platform|tool)\b/.test(p)) {
    return true
  }

  // "project plan for ..." / "product plan for ..."
  if (/\b(project|product)\s+plan\b/.test(p)) {
    return true
  }

  return false
}

function includesAny(text, arr) {
  const t = text.toLowerCase()
  return arr.some((w) => t.includes(w.toLowerCase()))
}

function countIncludes(text, arr) {
  const t = text.toLowerCase()
  return arr.filter((w) => t.includes(w.toLowerCase())).length
}

/* ---------------------------------- PLAN ---------------------------------- */

function heuristicPlan(prompt) {
  const lower = prompt.toLowerCase()
  const words = wordsOf(prompt)
  const len = words.length

  const genericPmPhrases = [
    'project management tool',
    'project management app',
    'project management software',
    'saas project management tool',
    'saas tool',
    'saas product',
    'management system',
  ]

  const detailSignals = [
    'kanban',
    'scrum',
    'sprint',
    'backlog',
    'gantt',
    'roadmap',
    'epic',
    'subtasks',
    'dependencies',
    'time tracking',
    'billing',
    'invoice',
    'subscription',
    'multi-tenant',
    'roles',
    'permissions',
    'rbac',
    'client portal',
    'workspace',
    'webhook',
    'integration',
    'slack',
    'github',
    'gitlab',
    'jira',
    'notion',
    'analytics',
    'reports',
    'reporting',
    'audit log',
    'notifications',
    'okr',
    'okrs',
  ]

  const genericHit = includesAny(lower, genericPmPhrases)
  const detailCount = countIncludes(lower, detailSignals)

  if (genericHit && detailCount === 0 && len <= 40) {
    return {
      ok: false,
      message:
        `You said: “${prompt}”. This is a good start, but before I create a full project plan I need more detail.`,
      questions: [
        'Do you prefer Kanban, Scrum, simple to-do, or a mix?',
        'Is this multi-tenant (multiple companies) or single company?',
        'Do you need client-facing workspaces or only internal teams?',
        'Which modules do you need: projects, boards, tasks, files, time tracking, billing, reporting?',
        'Any integrations you already know you want?',
      ],
      suggestions: [
        'It should be a multi-tenant SaaS for startups with projects, Kanban boards, sprints, client spaces, time tracking, reporting, and Stripe billing.',
        'We are building an agency-focused PM tool with client portals, approvals, file sharing, invoicing, and team tasks.',
      ],
    }
  }

  if (detailCount >= 2 && len >= 25) {
    return { ok: true }
  }

  if (len >= 60) {
    return { ok: true }
  }

  return {
    ok: false,
    message:
      `I am not fully confident I understand your plan from: “${prompt}”. Tell me the product type, target users, and main modules so I can design a reliable project plan.`,
    questions: [
      'What is the main product or system?',
      'Who are the key user roles?',
      'List the main modules/screens you want (5 to 10 is enough).',
      'Any important technical or business constraints?',
    ],
    suggestions: [
      'Plan a multi-tenant SaaS PM tool for startups with organizations, projects, boards, sprints, client workspaces, time tracking, and invoices.',
      'Plan an internal admin dashboard for monitoring microservices with logs, metrics, alerts, and RBAC.',
    ],
  }
}

// CHANGE: async, used by planner-controller
export async function analyzePlanPrompt(rawPrompt) {
  const prompt = normalize(rawPrompt)

  if (!prompt) {
    return {
      ok: false,
      message:
        'Tell me what you want to build. Include product type, target users, and the main modules.',
      questions: [
        'What type of product or platform is this?',
        'Who are the primary users?',
        'What core modules or features do you already know you need?',
      ],
    }
  }

  if (isGreeting(prompt) || isThanks(prompt)) {
    return {
      ok: false,
      message:
        `You said: “${prompt}”. I can design full project structures for you, but I need to know what you are building and for whom.`,
      questions: [
        'What kind of product or system do you have in mind?',
        'Who will use it day to day?',
        'Name a few key modules or workflows.',
      ],
    }
  }


  if (isGreeting(prompt) || isThanks(prompt)) {
    return { ok: true }
  }


  // Try LLM first
  const llm = await llmAnalyzePlanPrompt(prompt).catch(() => null)

  if (llm && typeof llm.ready === 'boolean') {
    if (llm.ready) {
      return { ok: true }
    }
    return {
      ok: false,
      message:
        llm.reason ||
        'I need a bit more detail before I can generate a reliable project plan.',
      questions: llm.missing || [],
      suggestions: llm.suggestions || [],
    }
  }

  // Fallback: heuristic
  return heuristicPlan(prompt)
}

/* ---------------------------------- TASKS ---------------------------------- */

function heuristicTasks(prompt) {
  const lower = prompt.toLowerCase()
  const words = wordsOf(prompt)
  const len = words.length

  if (len < 6) {
    return {
      ok: false,
      message:
        `You said: “${prompt}”. This is too short. Describe the feature/module/sprint so I can create meaningful tasks.`,
      suggestions: [
        'Generate tasks for implementing email verification and password reset.',
        'Generate tasks for improving API error handling and logging.',
      ],
    }
  }

  const taskWords = [
    'task',
    'tasks',
    'ticket',
    'tickets',
    'issue',
    'issues',
    'story',
    'stories',
    'sprint',
    'backlog',
    'board',
    'feature',
    'bug',
    'bugs',
    'fix',
    'epic',
  ]

  const actionSignals = [
    'implement',
    'integrate',
    'setup',
    'configure',
    'refactor',
    'optimize',
    'migrate',
    'add',
    'create',
    'improve',
    'harden',
    'secure',
    'test',
    'design',
  ]

  const hasTaskWords = includesAny(lower, taskWords)
  const hasActions = includesAny(lower, actionSignals)

  if ((hasTaskWords || lower.includes('generate tasks')) && hasActions) {
    return { ok: true }
  }

  if (len >= 30 && (hasTaskWords || hasActions)) {
    return { ok: true }
  }

  return {
    ok: false,
    message:
      `I am not fully sure what tasks you want from: “${prompt}”. Tell me which feature, module, bug group, or sprint you are planning so I can generate focused tasks.`,
    suggestions: [
      'Generate tasks for implementing project-based permissions and roles.',
      'Generate tasks for cleaning up and documenting the public API.',
      'Generate tasks for frontend performance optimization and code splitting.',
    ],
  }
}

// CHANGE: async, used by task-agent-controller
export async function analyzeTaskPrompt(rawPrompt) {
  const prompt = normalize(rawPrompt)
  const lower = prompt.toLowerCase()

  if (!prompt) {
    return {
      ok: false,
      message:
        'Tell me what kind of work you want tasks for. Mention the feature, module, bugset, or sprint goal for this board.',
      suggestions: [
        'Generate tasks for implementing JWT auth and refresh tokens.',
        'Generate tasks for integrating Stripe payments.',
        'Generate tasks for refactoring the UI components to the new design system.',
      ],
    }
  }

  if (isGreeting(prompt) || isThanks(prompt)) {
    return {
      ok: false,
      message:
        `You said: “${prompt}”. I am here to create tasks for you, but I need a real objective like a feature, bug list, or sprint goal for this board.`,
      suggestions: [
        'Generate tasks for implementing role-based access control.',
        'Generate tasks for stabilizing production for the next release.',
      ],
    }
  }

  if (
    lower.includes('how to describe') ||
    lower.includes('how should i describe') ||
    lower.includes('how can i describe')
  ) {
    return {
      ok: false,
      message:
        'Describe your work like this so I can generate strong tasks:',
      questions: [
        'What is the main feature or module? (for example: JWT auth, billing, dashboard)',
        'What is the goal or outcome? (for example: users can reset password, clients can see invoices)',
        'Any constraints? (deadline, priority, tech stack, security or performance requirements)',
        'Is this new work, refactor, bugfixes, or a sprint plan?',
      ],
      suggestions: [
        'Generate tasks for adding JWT-based authentication with refresh tokens, login, signup, and forgot password.',
        'Generate tasks for improving page load performance on the dashboard below 2 seconds.',
      ],
    }
  }

  if (isDirectTaskRequest(prompt) && wordsOf(prompt).length >= 5) {
    return { ok: true }
  }

  // Try LLM first
  const llm = await llmAnalyzeTaskPrompt(prompt).catch(() => null)

  if (llm && typeof llm.ready === 'boolean') {
    if (llm.ready) {
      return { ok: true }
    }
    return {
      ok: false,
      message:
        llm.reason ||
        'I need a clearer description before generating tasks.',
      questions: llm.missing || [],
      suggestions: llm.suggestions || [],
    }
  }

  // Fallback: heuristic
  return heuristicTasks(prompt)
}
