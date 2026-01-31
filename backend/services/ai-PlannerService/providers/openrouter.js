import fetch from "node-fetch";

const BASE = "https://openrouter.ai/api/v1/chat/completions";
const TIMEOUT = Number(process.env.LLM_TIMEOUT_MS || 60000);

function stripFences(s = "") {
  return s
    .replace(/```json\s*([\s\S]*?)```/gi, "$1")
    .replace(/```\s*([\s\S]*?)```/gi, "$1")
    .trim();
}
function safeParseJSON(txt) {
  try { return JSON.parse(txt); } catch { return null; }
}
function salvageJSON(text = "") {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  let candidate = text.slice(start, end + 1)
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
  try { return JSON.parse(candidate); } catch { return null; }
}

// read SSE for native fetch or node-fetch
async function readSSE(res, onData) {
  const isWhatwg = res.body && typeof res.body.getReader === "function";
  if (isWhatwg) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) onData(line);
    }
    if (buf) onData(buf);
    return;
  }
  await new Promise((resolve, reject) => {
    res.body.setEncoding("utf8");
    res.body.on("data", chunk => {
      const lines = String(chunk).split("\n");
      for (const line of lines) onData(line);
    });
    res.body.on("end", resolve);
    res.body.on("error", reject);
  });
}

async function callOpenRouter({ model, messages, stream }) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY missing");

  const headers = {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  };
  if (process.env.OPENROUTER_HTTP_REFERER) headers["HTTP-Referer"] = process.env.OPENROUTER_HTTP_REFERER;
  if (process.env.OPENROUTER_X_TITLE) headers["X-Title"] = process.env.OPENROUTER_X_TITLE;

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), TIMEOUT);
  try {
    const res = await fetch(BASE, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.2, stream }),
      signal: ac.signal
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const err = new Error(`OpenRouter ${res.status} ${txt}`);
      err.status = res.status;
      throw err;
    }
    return res;
  } finally {
    clearTimeout(to);
  }
}

export async function runOpenRouterJSON({ system, user, model, onStart, onToken, onDone }) {
  const messages = [
    { role: "system", content: `${system}\nALWAYS return strict valid JSON only.` },
    { role: "user", content: user }
  ];
  onStart?.();

  try {
    const res = await callOpenRouter({ model, messages, stream: true });
    let full = "";
    await readSSE(res, line => {
      const t = line.trim();
      if (!t.startsWith("data:")) return;
      const payload = t.slice(5).trim();
      if (!payload || payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content ?? "";
        if (delta) { full += delta; onToken?.(delta); }
      } catch {}
    });

    const clean = stripFences(full);
    let parsed = safeParseJSON(clean) || salvageJSON(clean);
    if (!parsed) throw new Error("model did not return valid JSON");
    onDone?.(parsed);
    return parsed;
  } catch (e) {
    if (e.name === "AbortError" || /aborted|valid JSON/i.test(e.message)) {
      const res2 = await callOpenRouter({ model, messages, stream: false });
      const data = await res2.json();
      const content = data?.choices?.[0]?.message?.content ?? "";
      const clean2 = stripFences(content);
      let parsed2 = safeParseJSON(clean2) || salvageJSON(clean2);
      if (!parsed2) {
        const err = new Error("model did not return valid JSON");
        err.status = 502;
        throw err;
      }
      onDone?.(parsed2);
      return parsed2;
    }
    throw e;
  }
}
