// llm/selector.js
// multi-provider, multi-model router with automatic fallback
import { runOpenRouterJSON } from "./openrouter.js";
import { runOllamaJSON } from "./ollama.js";

// default provider order: OpenRouter primary, Ollama fallback
const PRIMARY = (process.env.LLM_PROVIDER || "openrouter").toLowerCase();

// comma separated list lets you control order from env at runtime
// examples:
//   deepseek/deepseek-r1:free,deepseek/deepseek-v3:free
const ENV_CANDIDATES = (process.env.OPENROUTER_MODEL_CANDIDATES || "").split(",").map(s => s.trim()).filter(Boolean);

// sensible builtins for your planner use case
const BUILTIN_CANDIDATES = [
  "deepseek/deepseek-r1:free",   // strong reasoning and planning
  "deepseek/deepseek-v3:free"    // fast generalist
];

function openrouterCandidates() {
  return ENV_CANDIDATES.length ? ENV_CANDIDATES : BUILTIN_CANDIDATES;
}

async function tryOpenRouterAll({ system, user }) {
  const errors = [];
  for (const m of openrouterCandidates()) {
    try {
      return await runOpenRouterJSON({ system, user, model: m });
    } catch (e) {
      // retry next model if rate limited or provider hiccup
      errors.push(`${m}: ${e.status || ""} ${e.message}`);
    }
  }
  const err = new Error(`OpenRouter candidates exhausted`);
  err.cause = errors;
  throw err;
}

export async function runJSONSmart({ system, user }) {
  if (PRIMARY === "openrouter") {
    try {
      return await tryOpenRouterAll({ system, user });
    } catch {
      // last resort local fallback if available
      return await runOllamaJSON({ system, user });
    }
  }

  if (PRIMARY === "ollama") {
    try {
      return await runOllamaJSON({ system, user });
    } catch {
      return await tryOpenRouterAll({ system, user });
    }
  }

  throw new Error(`Unknown LLM_PROVIDER ${PRIMARY}`);
}
