// ai-PlannerService/LangGraph/taskAgentsGraph.js
import { v4 as uuidv4 } from 'uuid';
import { runJSONSmart } from '../providers/selector.js';
import { publishCmd } from '../rabbitmq/mq.js';
import {
  bulkTaskSystem, bulkTaskUser,
  autoDescribeSystem, autoDescribeUser,
  improveTaskSystem, improveTaskUser,
  pickStyle
} from '../core/taskAgent.prompts.js';

let _ch = null;
let _cmdEx = null;
export function bindTaskAgentPublisher(ch, cmdEx) {
  _ch = ch;
  _cmdEx = cmdEx;
}
function ensurePub() {
  if (!_ch || !_cmdEx) throw new Error('publisher_not_bound');
}

// Point 1: bulk generate -> DB write via MQ
export async function runBulkGenerate({ prompt, countHint, projectId, boardId, createdBy, boardSnapshot }) {
  const system = bulkTaskSystem;
  const user = bulkTaskUser({ prompt, countHint, boardSnapshot });
  const out = await runJSONSmart({
    system,
    user,
    options: { temperature: 0.85, top_p: 0.95, presence_penalty: 0.05, frequency_penalty: 0.15, seed: null }
  });
  const tasks = Array.isArray(out?.tasks) ? out.tasks : [];
  const correlationId = uuidv4();

  ensurePub();
  await publishCmd(_ch, _cmdEx, 'task.bulkcreate.request', {
    type: 'task.bulkcreate.request',
    at: new Date().toISOString(),
    correlationId,
    payload: {
      projectId,
      boardId,
      createdBy,
      tasks: tasks.map(t => ({
        title: t.title,
        description: t.description,
        column: t.column || 'Backlog'
      }))
    }
  });

  return { correlationId, count: tasks.length, tasksPreview: tasks.slice(0, 3) };
}

// Point 2: only generate description, no DB writes
export async function runAutoDescribe({ title, boardSnapshot }) {
  const system = autoDescribeSystem;
  const user = autoDescribeUser({ title, boardSnapshot, styleHint: pickStyle() });
  const out = await runJSONSmart({
    system,
    user,
    options: { temperature: 0.9, top_p: 0.96, presence_penalty: 0.1, frequency_penalty: 0.2, seed: null }
  });
  return { title, description: out?.description || '' };
}

// Point 3: improve title and description, no DB writes
export async function runImproveTaskLocal({ title, description, boardSnapshot }) {
  const system = improveTaskSystem;
  const user = improveTaskUser({ title, description, boardSnapshot, styleHint: pickStyle() });
  const out = await runJSONSmart({
    system,
    user,
    options: { temperature: 0.95, top_p: 0.97, presence_penalty: 0.15, frequency_penalty: 0.25, seed: null }
  });
  return {
    title: out?.title || title,
    description: out?.description || description
  };
}
