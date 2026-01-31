// ai-PlannerService/core/llmIntentClient.js

// Intent classifier client using selector's intent-only models.
// Only affects intentGuard, not your main generation flows.

import { runJSONSmartIntent } from "../providers/selector.js";

function normalize(text = "") {
  return String(text || "").trim();
}

function normalizeIntentResult(raw) {
  if (!raw || typeof raw !== "object") return null;

  const ready =
    typeof raw.ready === "boolean"
      ? raw.ready
      : typeof raw.is_ready === "boolean"
      ? raw.is_ready
      : undefined;

  if (typeof ready !== "boolean") return null;

  const reason =
    typeof raw.reason === "string"
      ? raw.reason
      : typeof raw.message === "string"
      ? raw.message
      : "";

  const missing = Array.isArray(raw.missing)
    ? raw.missing
    : Array.isArray(raw.questions)
    ? raw.questions
    : [];

  const suggestions = Array.isArray(raw.suggestions)
    ? raw.suggestions
    : Array.isArray(raw.examples)
    ? raw.examples
    : [];

  return {
    ready,
    reason,
    missing,
    suggestions,
  };
}

// For project planning prompts
export async function llmAnalyzePlanPrompt(rawPrompt) {
  const prompt = normalize(rawPrompt);
  if (!prompt) return null;

  const system = [
    "You are an intent classifier for a project planning assistant.",
    "Decide if the user's message is ready for concrete project/board/task generation.",
    "If it is NOT ready, explain what is missing.",
    "Respond ONLY with strict valid JSON:",
    `{"ready": boolean, "reason": string, "missing": string[], "suggestions": string[]}`,
  ].join(" ");

  const user = `User message:\n${prompt}`;

  try {
    const out = await runJSONSmartIntent({ system, user });
    if (!out) return null;
    const norm = normalizeIntentResult(out);
    if (!norm) {
      console.log(
        "[llmAnalyzePlanPrompt] invalid LLM shape, using heuristics"
      );
      return null;
    }
    return norm;
  } catch (err) {
    console.log(
      "[llmAnalyzePlanPrompt] LLM error, using heuristics:",
      err.message || err
    );
    return null;
  }
}

// For task generation prompts
export async function llmAnalyzeTaskPrompt(rawPrompt) {
  const prompt = normalize(rawPrompt);
  if (!prompt) return null;

  const system = [
    "You are an intent classifier for a task generation assistant.",
    "Decide if the message is a clear request to generate actionable tasks",
    "for a specific feature/module/sprint on this board.",
    "If it is NOT ready, explain what is missing.",
    "Respond ONLY with strict valid JSON:",
    `{"ready": boolean, "reason": string, "missing": string[], "suggestions": string[]}`,
  ].join(" ");

  const user = `User message:\n${prompt}`;

  try {
    const out = await runJSONSmartIntent({ system, user });
    if (!out) return null;
    const norm = normalizeIntentResult(out);
    if (!norm) {
      console.log(
        "[llmAnalyzeTaskPrompt] invalid LLM shape, using heuristics"
      );
      return null;
    }
    return norm;
  } catch (err) {
    console.log(
      "[llmAnalyzeTaskPrompt] LLM error, using heuristics:",
      err.message || err
    );
    return null;
  }
}
























// // ai-PlannerService/core/llmIntentClient.js
// // CHANGE: New file
// // Lightweight client for OpenRouter intent classification.
// // Set OPENROUTER_API_KEY in your environment.

// import fetch from 'node-fetch'

// const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

// // You can swap this to another free-tier model if needed.
// const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free'

// async function callOpenRouter(messages) {
//   if (!OPENROUTER_API_KEY) return null

//   try {
//     const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${OPENROUTER_API_KEY}`,
//       },
//       body: JSON.stringify({
//         model: DEFAULT_MODEL,
//         messages,
//         temperature: 0.1,
//         max_tokens: 300,
//       }),
//     })

//     if (!res.ok) {
//       console.error('OpenRouter status', res.status)
//       return null
//     }

//     const data = await res.json()
//     const content = data?.choices?.[0]?.message?.content?.trim()
//     if (!content) return null

//     // Expect the model to reply with JSON. Extract first {...} block.
//     const start = content.indexOf('{')
//     const end = content.lastIndexOf('}')
//     if (start === -1 || end === -1) {
//       console.error('OpenRouter unexpected response:', content)
//       return null
//     }

//     return JSON.parse(content.slice(start, end + 1))
//   } catch (err) {
//     console.error('OpenRouter error:', err.message)
//     return null
//   }
// }

// export async function llmAnalyzePlanPrompt(prompt) {
//   if (!OPENROUTER_API_KEY) return null

//   const system = `You are an intent classifier for a project planning assistant.
// Decide if the message is ready for concrete project/board/task generation.
// If not, explain what is missing.
// Return ONLY JSON:
// {"ready": boolean, "reason": string, "missing": string[], "suggestions": string[]}`

//   return await callOpenRouter([
//     { role: 'system', content: system },
//     { role: 'user', content: prompt },
//   ])
// }

// export async function llmAnalyzeTaskPrompt(prompt) {
//   if (!OPENROUTER_API_KEY) return null

//   const system = `You are an intent classifier for a task generation assistant.
// Decide if the message is a clear request to generate actionable tasks for a specific feature/module/sprint.
// If not, explain what is missing.
// Return ONLY JSON:
// {"ready": boolean, "reason": string, "missing": string[], "suggestions": string[]}`

//   return await callOpenRouter([
//     { role: 'system', content: system },
//     { role: 'user', content: prompt },
//   ])
// }
