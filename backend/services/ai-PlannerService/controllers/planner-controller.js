import { runPlanFromPrompt } from '../LangGraph/planGraph.js'
import { analyzePlanPrompt } from '../core/intentGuard.js' 
import { llmAnalyzePlanPrompt } from '../core/llmIntentClient.js'

export async function createPlan(req, res) {
  try {
    const { prompt, countHint, workspaceId, createdBy } = req.body || {}
    if (!prompt || !workspaceId) {
      return res.status(400).json({ message: 'prompt and workspaceId are required' })
    }
    if (!createdBy) {
      return res.status(400).json({ message: 'createdBy is required' })
    }

    const gate = await analyzePlanPrompt(prompt)

    if (!gate.ok) {
      return res.json({
        requiresClarification: true,
        message:
          gate.message ||
          'I need a bit more detail before I can generate a reliable project plan.',
        questions: gate.questions || [],
        suggestions: gate.suggestions || [],
      })
    }

    const out = await runPlanFromPrompt({ prompt, countHint, workspaceId, createdBy })
    res.json({
      message: 'Plan generated and orchestration started',
      correlationId: out.correlationId,
      plan: out.plan,
      requiresClarification: false,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'failed to plan', error: e.message })
  }
}

