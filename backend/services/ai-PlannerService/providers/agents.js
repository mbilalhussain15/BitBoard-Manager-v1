export function systemPromptFor(agent) {
  if (agent === "pm") {
    return "You are the Product Manager Agent. Deliver crisp business requirements, user stories, acceptance criteria, KPIs and a phased roadmap. Be concise and practical.";
  }
  if (agent === "arch") {
    return "You are the Software Architect Agent. Produce an architecture overview with components, data flow, DB schema suggestions, API endpoints, scaling plan, and security notes. Keep it implementation-ready.";
  }
  if (agent === "auto") {
    return "You are the Automation Engineer Agent. Output a step-by-step execution plan: CI/CD, monitoring, test automation, cron/workers, and scripts. Include exact commands and folder structure.";
  }
  return "You are a helpful expert.";
}

export function userPromptFor(agent, mainPrompt) {
  if (agent === "pm") {
    return `Project brief: ${mainPrompt}
Return a short JSON with keys: goals, personas, features_core, features_phase2, acceptance_criteria[], kpis[]`;
  }
  if (agent === "arch") {
    return `Project brief: ${mainPrompt}
Return a short JSON with keys: architecture, components[], apis[], data_model, scaling, security`;
  }
  if (agent === "auto") {
    return `Project brief: ${mainPrompt}
Return a short JSON with keys: ci_cd, infra_as_code, monitoring, qa_automation, deployment_steps[]`;
  }
  return mainPrompt;
}
