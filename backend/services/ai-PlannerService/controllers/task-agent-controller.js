// ai-PlannerService/controllers/task-agent-controller.js
import { runBulkGenerate, runAutoDescribe, runImproveTaskLocal } from '../LangGraph/taskAgentsGraph.js'
import { analyzeTaskPrompt } from '../core/intentGuard.js'
import { llmAnalyzeTaskPrompt } from '../core/llmIntentClient.js'

function must(v, name) {
  if (!v) throw new Error(`${name} is required`)
}

export async function bulkGenerate(req, res) {
  try {
    const { projectId, boardId, prompt, countHint, createdBy, boardSnapshot } = req.body || {}
    must(projectId, 'projectId')
    must(boardId, 'boardId')
    must(prompt, 'prompt')
    must(createdBy, 'createdBy')

  const gate = await analyzeTaskPrompt(prompt)

    if (!gate.ok) {
      return res.json({
        requiresClarification: true,
        message:
          gate.message ||
          'I need a clearer description of the work before generating tasks.',
        questions: gate.questions || [],
        suggestions: gate.suggestions || [],
      })
    }


    const result = await runBulkGenerate({ prompt, countHint, projectId, boardId, createdBy, boardSnapshot })
    res.json({ 
      requiresClarification: false, 
      message: 'bulk task generation queued', 
      ...result 
    })

  } catch (e) {
    console.error(e)
    res.status(400).json({ message: e.message })
  }
}

export async function autoDescribe(req, res) {
  try {
    const { title, boardSnapshot } = req.body || {}
    must(title, 'title')

    const result = await runAutoDescribe({ title, boardSnapshot })
    res.json({ message: 'description generated', ...result })
  } catch (e) {
    console.error(e)
    res.status(400).json({ message: e.message })
  }
}

export async function improve(req, res) {
  try {
    const { title, description, boardSnapshot } = req.body || {}
    must(title, 'title')

    const result = await runImproveTaskLocal({ title, description, boardSnapshot })
    res.json({ message: 'task improved', ...result })
  } catch (e) {
    console.error(e)
    res.status(400).json({ message: e.message })
  }
}
