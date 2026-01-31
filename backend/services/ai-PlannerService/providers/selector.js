// ai-PlannerService/providers/selector.js
import { runOpenRouterJSON } from "./openrouter.js";

const ENV_CANDIDATES = (process.env.OPENROUTER_MODEL_CANDIDATES || "")
  .split(",").map(s => s.trim()).filter(Boolean);

  function getEnvCandidates() {
  const raw = process.env.OPENROUTER_MODEL_CANDIDATES || "";
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}
// const DEFAULT_CANDIDATES = [
//   "qwen/qwen-2.5-72b-instruct:free",
//   "meta-llama/llama-3.1-8b-instruct:free",
//   "mistralai/mistral-7b-instruct:free",
//   "deepseek/deepseek-r1:free",
//   "deepseek/deepseek-chat-v3-0324:free"
// ];
const DEFAULT_CANDIDATES = [
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "qwen/qwen3-coder:free",
  "tngtech/deepseek-r1t2-chimera:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];


const RETRIES_PER_MODEL = Number(process.env.LLM_RETRIES || 2);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// function candidates() {
//   const list = ENV_CANDIDATES.length ? ENV_CANDIDATES : DEFAULT_CANDIDATES;
//   return shuffle(list);
// }
function candidates() {
  const envList = getEnvCandidates();
  const list = envList.length ? envList : DEFAULT_CANDIDATES;
  return shuffle(list);
}

/**
 * Run an LLM and coerce JSON.
 * options:
 *   temperature default 0.9
 *   top_p default 0.95
 *   presence_penalty default 0.1
 *   frequency_penalty default 0.2
 *   seed null for non-deterministic
 */
export async function runJSONSmart({ system, user, options = {} }) {
  const {
    temperature = 0.9,
    top_p = 0.95,
    presence_penalty = 0.1,
    frequency_penalty = 0.2,
    seed = null
  } = options;

  const list = candidates();
  const errors = [];

  for (const model of list) {
    for (let attempt = 1; attempt <= RETRIES_PER_MODEL; attempt++) {
      const tag = `[${new Date().toLocaleTimeString()}]`;
      try {
        console.log(`${tag} trying model ${model} attempt ${attempt}`);
        const out = await runOpenRouterJSON({
          system,
          user,
          model,
          temperature,
          top_p,
          presence_penalty,
          frequency_penalty,
          seed,
          onStart: () => console.log(`${tag} ${model} start`),
          onToken: t => process.stdout.write(t),
          onDone: () => console.log(`\n${tag} ${model} done`)
        });
        return out;
      } catch (e) {
        console.log(`${tag} ${model} error ${e.status || ""} ${e.message}`);
        errors.push(`${model}#${attempt}: ${e.status || "?"} ${e.message}`);
        const status = Number(e.status || 0);
        if (status === 429 || status === 503 || status === 502) {
          await sleep(800 * attempt);
          continue;
        }
        break;
      }
    }
  }

  const err = new Error(`all OpenRouter candidates failed`);
  err.cause = errors;
  throw err;
}


export async function runJSONSmartIntent({ system, user, options = {} }) {
  // const intentModels = [
  //   "meta-llama/llama-3.1-8b-instruct",
  //   "mistralai/mistral-7b-instruct",
  // ];
  // const intentModels = [
  //   "meta-llama/llama-3.2-3b-instruct:free",
  //   "google/gemma-3-4b-it:free",
  //   "qwen/qwen3-4b:free",
  // ];

  const intentModels = candidates();

  const {
    temperature = 0.1,
    top_p = 0.9,
    presence_penalty = 0,
    frequency_penalty = 0,
    seed = null,
  } = options || {};

  const errors = [];

  for (const model of intentModels) {
    for (let attempt = 1; attempt <= RETRIES_PER_MODEL; attempt++) {
      const tag = `[intent ${new Date().toLocaleTimeString()}]`;
      try {
        console.log(`${tag} trying intent model ${model} attempt ${attempt}`);
        const out = await runOpenRouterJSON({
          system,
          user,
          model,
          temperature,
          top_p,
          presence_penalty,
          frequency_penalty,
          seed,
          onStart: () =>
            console.log(`${tag} ${model} start`),
          onToken: () => {},
          onDone: () =>
            console.log(`${tag} ${model} done`),
        });
        return out;
      } catch (e) {
        console.log(
          `${tag} ${model} error ${e.status || ""} ${e.message}`
        );
        errors.push(
          `${model}#${attempt}: ${e.status || "?"} ${e.message}`
        );
        const status = Number(e.status || 0);
        if (status === 429 || status === 503 || status === 502) {
          await sleep(500 * attempt);
          continue;
        }
        break;
      }
    }
  }

  console.log(
    "[runJSONSmartIntent] all intent models failed, falling back"
  );
  return null; // let caller fall back to heuristic
}



















// import { runOpenRouterJSON } from "./openrouter.js";

// const ENV_CANDIDATES = (process.env.OPENROUTER_MODEL_CANDIDATES || "")
//   .split(",").map(s => s.trim()).filter(Boolean);

// const DEFAULT_CANDIDATES = [
//   "qwen/qwen-2.5-72b-instruct:free",
//   "meta-llama/llama-3.1-8b-instruct:free",
//   "mistralai/mistral-7b-instruct:free",
//   "deepseek/deepseek-r1:free",
//   "deepseek/deepseek-chat-v3-0324:free"
// ];

// const RETRIES_PER_MODEL = Number(process.env.LLM_RETRIES || 2);
// const sleep = ms => new Promise(r => setTimeout(r, ms));

// function candidates() {
//   return ENV_CANDIDATES.length ? ENV_CANDIDATES : DEFAULT_CANDIDATES;
// }

// export async function runJSONSmart({ system, user }) {
//   const list = candidates();
//   const errors = [];

//   for (const model of list) {
//     for (let attempt = 1; attempt <= RETRIES_PER_MODEL; attempt++) {
//       const tag = `[${new Date().toLocaleTimeString()}]`;
//       try {
//         console.log(`${tag} trying model ${model} attempt ${attempt}`);
//         const out = await runOpenRouterJSON({
//           system,
//           user,
//           model,
//           onStart: () => console.log(`${tag} ${model} start`),
//           onToken: t => process.stdout.write(t),
//           onDone: () => console.log(`\n${tag} ${model} done`)
//         });
//         return out;
//       } catch (e) {
//         console.log(`${tag} ${model} error ${e.status || ""} ${e.message}`);
//         errors.push(`${model}#${attempt}: ${e.status || "?"} ${e.message}`);
//         const status = Number(e.status || 0);
//         if (status === 429 || status === 503 || status === 502) {
//           await sleep(800 * attempt);
//           continue;
//         }
//         break;
//       }
//     }
//   }

//   const err = new Error(`all OpenRouter candidates failed`);
//   err.cause = errors;
//   throw err;
// }
