import { v4 as uuidv4 } from 'uuid'
import Plan from '../models/plannerModel.js'
import { plannerSystem, plannerUser } from '../core/prompt.js'
import { runJSONSmart } from '../providers/selector.js'
import { initStateForCorrelation, startPlan } from '../orchestrator/orchestrator.js'

export async function runPlanFromPrompt({ prompt, countHint, workspaceId, createdBy }) {
  const system = plannerSystem
  const user = plannerUser(prompt, countHint)

  const planJSON = await runJSONSmart({ system, user })

  const correlationId = uuidv4()
  const doc = await Plan.create({
    correlationId,
    workspaceId,
    createdBy,
    plan: planJSON
  })

  await initStateForCorrelation(doc)
  await startPlan(doc)

  return { correlationId, plan: planJSON }
}

