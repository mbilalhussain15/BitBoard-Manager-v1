// ai-PlannerService/orchestrator/orchestrator.js

import Plan from '../models/plannerModel.js'
import { publishCmd } from '../rabbitmq/mq.js'

let _ch = null
let _cmdEx = null

export function bindPublisher(ch, ex) {
  _ch = ch
  _cmdEx = ex
}

// base state ensure
export async function initStateForCorrelation(correlationId) {
  let doc = await Plan.findOne({ correlationId })
  if (!doc) {
    doc = await Plan.create({
      correlationId,
      createdBy: null,
      plan: {},
      workspaceId: null,
      created: { projects: {}, boards: {} },
      meta: {}
    })
  }
  return doc
}

async function getCreatedByForCorrelation(correlationId) {
  const plan = await Plan.findOne({ correlationId })
  return plan?.createdBy || null
}

// enterprise defaults
const ENTERPRISE_COLUMNS = [                 // CHANGED: expanded default set
  'Backlog',
  'Todo',
  'In Progress',
  'In Review',
  'Testing',
  'Done',
  'Cancelled'
]

export async function startPlan({ correlationId, plan, createdBy, workspaceId }) {
  if (!_ch || !_cmdEx) throw new Error('publisher_not_bound')

  await initStateForCorrelation(correlationId)

  await Plan.updateOne(
    { correlationId },
    { $set: { plan, createdBy, workspaceId } },
    { upsert: true }
  )

  const projects = Array.isArray(plan?.projects) ? plan.projects : []
  for (const p of projects) {
    await publishCmd(_ch, _cmdEx, 'project.create.request', {
      correlationId,
      type: 'project.create.request',
      workspaceId,
      createdBy,
      payload: {
        workspaceId,
        title: p.title,
        description: p.description || '',
        meta: p.meta || {}
      }
    })
  }

  return { ok: true, projectsRequested: projects.length }
}

export async function onEvent(evt) {
  if (!evt || !evt.type) return

  await initStateForCorrelation(evt.correlationId)

  if (evt.type === 'project.created') {
    await Plan.updateOne(
      { correlationId: evt.correlationId },
      { $set: { [`created.projects.${evt.payload.title}`]: evt.payload.projectId } }
    )

    const planDoc = await Plan.findOne({ correlationId: evt.correlationId })
    const pr = planDoc?.plan?.projects?.find(p => p.title === evt.payload.title)
    if (!pr) return

    const createdBy = await getCreatedByForCorrelation(evt.correlationId)

    for (const b of (pr.boards || [])) {
      // CHANGED: if plan gives columns use those, else enterprise defaults
      const colsFromPlan = Array.isArray(b.columns) && b.columns.length ? b.columns : ENTERPRISE_COLUMNS // CHANGED

      await publishCmd(_ch, _cmdEx, 'board.create.request', {
        correlationId: evt.correlationId,
        type: 'board.create.request',
        projectId: evt.payload.projectId,
        createdBy,
        payload: {
          projectId: evt.payload.projectId,
          title: b.title,
          columns: colsFromPlan                              // CHANGED
        }
      })
    }
    return
  }

  if (evt.type === 'board.created') {
    await Plan.updateOne(
      { correlationId: evt.correlationId },
      { $set: { [`created.boards.${evt.payload.title}`]: evt.payload.boardId } }
    )

    const planDoc = await Plan.findOne({ correlationId: evt.correlationId })
    const pr = planDoc?.plan?.projects?.[0]
    if (!pr) return

    const b = pr.boards?.find(x => x.title === evt.payload.title)
    if (!b) return

    const tasks = (Array.isArray(b.tasks) ? b.tasks : [])
      .map(t => ({
        title: t?.title || t?.taskName,
        description: t?.description || t?.taskDescription || '',
        priority: t?.priority || 'medium',
        columnName: t?.columnName || 'Backlog',
        assignee: t?.assignee || t?.assignees || [],
        reporter: t?.reporter || [],
        dueDate: t?.dueDate || null,
        attachments: t?.attachments || [],
        subtasks: t?.subtasks || []
      }))
      .filter(t => (t.title || '').trim().length > 0)

    const createdBy = await getCreatedByForCorrelation(evt.correlationId)

    if (tasks.length > 0) {
      await publishCmd(_ch, _cmdEx, 'task.bulkcreate.request', {
        correlationId: evt.correlationId,
        type: 'task.bulkcreate.request',
        projectId: evt.payload.projectId,
        boardId: evt.payload.boardId,
        createdBy,
        payload: {
          projectId: evt.payload.projectId,
          boardId: evt.payload.boardId,
          tasks,
          createdBy
        }
      })
    } else {
      await publishCmd(_ch, _cmdEx, 'plan.commit.request', {
        correlationId: evt.correlationId,
        type: 'plan.commit.request',
        payload: { ok: true }
      })
    }
    return
  }

  if (evt.type === 'task.bulkcreated') {
    await publishCmd(_ch, _cmdEx, 'plan.commit.request', {
      correlationId: evt.correlationId,
      type: 'plan.commit.request',
      payload: { ok: true }
    })
    return
  }
}





























// // ai-PlannerService/ai-PlannerService/orchestrator/orchestrator.js

// import Plan from '../models/plannerModel.js'
// import { publishCmd } from '../rabbitmq/mq.js'

// let _ch = null
// let _cmdEx = null

// // index.js se call hota hai: bindPublisher(channel, COMMANDS_EX)
// export function bindPublisher(ch, ex) {
//   _ch = ch
//   _cmdEx = ex
// }
// async function getCreatedByForCorrelation(correlationId) {
//   const plan = await Plan.findOne({ correlationId });
//   return plan?.createdBy || null;
// }

// /**
//  * Plan document ke basis par orchestration ke expectation counters set karta hai
//  * so we can later verify progress if needed.
//  */
// export async function initStateForCorrelation(doc) {
//   const expected = { projects: 0, boards: 0, tasks: 0 }
//   const titleIndex = { projects: {}, boards: {} }

//   for (const pr of doc.plan?.projects || []) {
//     expected.projects += 1
//     titleIndex.projects[pr.title] = pr
//     for (const b of pr.boards || []) {
//       expected.boards += 1
//       titleIndex.boards[`${pr.title}::${b.title}`] = b
//       expected.tasks += (b.tasks || []).length
//     }
//   }

//   await Plan.updateOne(
//     { _id: doc._id },
//     {
//       $set: {
//         expected,
//         titleIndex,
//         created: { projects: {}, boards: {} } // ids we capture as we go
//       }
//     }
//   )
// }

// /**
//  * Orchestration ka first step: project.create.request publish karo.
//  * yahan createdBy ko **har jagah** bheja jaa raha hai:
//  * 1) top-level par
//  * 2) payload ke andar
//  */
// export async function startPlan(doc) {
//   const first = doc.plan?.projects?.[0]
//   if (!first) return

//   // robust extraction: document me jo bhi field available ho use kar lo
//   const createdBy =
//     doc.createdBy ||
//     doc.initiatorUserId ||
//     doc.userId

//   if (!createdBy) {
//     throw new Error('createdBy not set on plan document')
//   }

//   await publishCmd(_ch, _cmdEx, 'project.create.request', {
//     correlationId: doc.correlationId,
//     type: 'project.create.request',

//     // some consumers top level se bhi padhenge
//     createdBy,
//     workspaceId: doc.workspaceId,

//     // payload ke andar authoritative data
//     payload: {
//       workspaceId: doc.workspaceId,
//       createdBy,
//       title: first.title,
//       description: first.description || ''
//     }
//   })
// }

// /**
//  * Downstream events par react karke next step trigger karta hai.
//  * project.created -> board.create.request
//  * board.created   -> task.bulkcreate.request
//  * task.bulkcreated -> plan.commit.request
//  */
// export async function onEvent(evt) {
//   if (!evt || !evt.type) return

//   // PROJECT CREATED -> create boards
//   if (evt.type === 'project.created') {
//     // project id ko track karo for later reference
  
//     await Plan.updateOne(
//       { correlationId: evt.correlationId },
//       { $set: { [`created.projects.${evt.payload.title}`]: evt.payload.projectId } }
//     )

//     const planDoc = await Plan.findOne({ correlationId: evt.correlationId })
//     const pr = planDoc?.plan?.projects?.find(p => p.title === evt.payload.title)
//     if (!pr) return

//     const createdBy = await getCreatedByForCorrelation(evt.correlationId);
    
//     // columns fixed set; agar custom chahiye ho to prompt/plan se laa kar map kar sakte ho
//     const defaultColumns = ['Backlog', 'Todo', 'In Progress', 'Review', 'Done']

//     for (const b of pr.boards || []) {
//       await publishCmd(_ch, _cmdEx, 'board.create.request', {
//         correlationId: evt.correlationId,
//         type: 'board.create.request',
//         projectId: evt.payload.projectId,
//         createdBy, 
//         // top-level helpful fields
//         projectId: evt.payload.projectId,

//         payload: {
//           projectId: evt.payload.projectId,
//           title: b.title,
//           columns: defaultColumns.map(n => ({ columnName: n, tasks: [] })),
//           createdBy
//         }
//       })
//     }
//     return
//   }

//   // BOARD CREATED -> bulk create tasks
//   if (evt.type === 'board.created') {

//     const createdBy = await getCreatedByForCorrelation(evt.correlationId);

//     await Plan.updateOne(
//       { correlationId: evt.correlationId },
//       { $set: { [`created.boards.${evt.payload.title}`]: evt.payload.boardId } }
//     )

//     const planDoc = await Plan.findOne({ correlationId: evt.correlationId })
//     const pr = planDoc?.plan?.projects?.[0]
//     if (!pr) return

//     const b = pr.boards?.find(x => x.title === evt.payload.title)
//     if (!b) return

//     // LLM plan me tasks[].column aata hai; consumer "columnName" expect karta hai
//     const tasks = (b.tasks || []).map(t => ({
//       title: t.title,
//       description: t.description || '',
//       columnName: t.column
//     }))

//     if (tasks.length > 0) {
//       await publishCmd(_ch, _cmdEx, 'task.bulkcreate.request', {
//         correlationId: evt.correlationId,
//         type: 'task.bulkcreate.request',
//         createdBy,  
//         // helpful top-levels
//         projectId: evt.payload.projectId,
//         boardId: evt.payload.boardId,

//         payload: {
//           projectId: evt.payload.projectId,
//           boardId: evt.payload.boardId,
//           tasks,
//           createdBy,  
//         }
//       })
//     } else {
//       // no tasks -> directly commit plan
//       await publishCmd(_ch, _cmdEx, 'plan.commit.request', {
//         correlationId: evt.correlationId,
//         type: 'plan.commit.request',
//         payload: { ok: true }
//       })
//     }
//     return
//   }

//   // TASKS CREATED -> commit plan
//   if (evt.type === 'task.bulkcreated') {
//     await publishCmd(_ch, _cmdEx, 'plan.commit.request', {
//       correlationId: evt.correlationId,
//       type: 'plan.commit.request',
//       payload: { ok: true }
//     })
//     return
//   }

//   // optional: failures ko log/handle kar lo (retry policy agar chahiye ho to yahan add karna)
//   // if (evt.type?.endsWith('.failed')) { ... }
// }

