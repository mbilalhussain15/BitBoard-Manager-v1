import fetch from 'node-fetch'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b-instruct'

function stripCodeFences(s) {
  if (!s) return ''
  // remove ```json ... ``` or ``` ... ```
  return s.replace(/```json\s*([\s\S]*?)```/gi, '$1')
          .replace(/```\s*([\s\S]*?)```/gi, '$1')
          .trim()
}

function tryParseJSON(txt) {
  try {
    return JSON.parse(txt)
  } catch {
    // best-effort: grab first { and last }
    const first = txt.indexOf('{')
    const last = txt.lastIndexOf('}')
    if (first !== -1 && last !== -1 && last > first) {
      const slice = txt.slice(first, last + 1)
      return JSON.parse(slice)
    }
    throw new Error('LLM did not return valid JSON: ' + txt.slice(0, 200))
  }
}

/**
 * Low-level chat that returns parsed JSON.
 * Kept for compatibility with your existing code.
 */
export async function chatJSON(model, system, user) {
  const r = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      options: { temperature: 0.2 }
    })
  })

  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`ollama chat failed ${r.status}: ${t}`)
  }

  const j = await r.json()
  const content = j?.message?.content || ''
  const clean = stripCodeFences(content)
  return tryParseJSON(clean)
}

/**
 * High-level helper used by planGraph.js
 * usage: const obj = await runOllamaJSON({ system, user, model })
 */
export async function runOllamaJSON({ system, user, model = DEFAULT_MODEL }) {
  return chatJSON(model, system, user)
}
