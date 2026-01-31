// workspaceService/rabbitmq/taskConsumer.js

import amqplib from 'amqplib'
import mongoose from 'mongoose'
import { ProjectBoards } from '../models/boardModel.js'
import { publishEvent } from '../utils/publisher.js'
import UserView from '../models/user-view.js'

const ROUTING_KEY = 'task.bulkcreate.request'

async function resolveUserViewId(anyId) {
  if (!anyId) return null
  let uv = await UserView.findOne({ _id: anyId }, { _id: 1 }).lean()
  if (uv?._id) return new mongoose.Types.ObjectId(String(uv._id))
  uv = await UserView.findOne({ userId: anyId }, { _id: 1 }).lean()
  if (uv?._id) return new mongoose.Types.ObjectId(String(uv._id))
  if (typeof anyId === 'object' && anyId?.user) {
    return new mongoose.Types.ObjectId(String(anyId.user))
  }
  try {
    return new mongoose.Types.ObjectId(String(anyId))
  } catch {
    return null
  }
}

async function toUserViewIdArray(arr) {
  if (!Array.isArray(arr)) return []
  const out = []
  for (const a of arr) {
    const id = await resolveUserViewId(a)
    if (id) out.push(id)
  }
  return out
}

/**
 * Concurrency-safe task insertion using atomic update with arrayFilters.
 */
async function insertTasksIntoBoard({ projectId, boardId, tasks, createdBy, columnName }) {
  const pb = await ProjectBoards.findOne(
    { projectId, 'boards._id': boardId },
    { 'boards.$': 1 }
  )
  if (!pb || !pb.boards?.length) throw new Error('board_not_found')

  const board = pb.boards[0]
  if (!Array.isArray(board.columns) || board.columns.length === 0) {
    throw new Error('board_has_no_columns')
  }

  let targetCol = board.columns[0]
  if (columnName) {
    const byName = board.columns.find(
      c => (c?.columnName || '').toLowerCase() === String(columnName).toLowerCase()
    )
    if (byName) targetCol = byName
  }

  const createdByUv = await resolveUserViewId(createdBy)

  const mappedTasks = []
  for (const t of tasks || []) {
    const title = (t?.title || t?.taskName || '').trim()
    if (!title) continue

    // column override
    let colId = targetCol._id
    if (t?.columnId) {
      const byId = board.columns.find(c => String(c._id) === String(t.columnId))
      if (byId) colId = byId._id
    } else if (t?.columnName) {
      const byNm = board.columns.find(
        c => (c?.columnName || '').toLowerCase() === String(t.columnName).toLowerCase()
      )
      if (byNm) colId = byNm._id
    }

    // reporter first with fallback to createdBy
    const reporterUv =
      await toUserViewIdArray((t?.reporter && t.reporter.length) ? t.reporter : (createdByUv ? [createdByUv] : []))

    // CHANGED: make assignee follow reporter when not explicitly provided
    // 1) if task has assignee(s) → use them
    // 2) else use reporterUv
    // 3) else fallback to createdByUv if still empty
    let assigneesUv = await toUserViewIdArray(t?.assignee || t?.assignees || [])
    if (!assigneesUv.length) assigneesUv = reporterUv
    if (!assigneesUv.length && createdByUv) assigneesUv = [createdByUv]   // CHANGED

    mappedTasks.push({
      _colId: colId,
      taskName: title,
      taskDescription: t?.description || t?.taskDescription || '',
      status: (board.columns.find(c => String(c._id) === String(colId))?.columnName) || 'Backlog',
      assignee: assigneesUv,   // CHANGED: now aligned with reporter defaulting
      reporter: reporterUv,
      priority: t?.priority || t?.priorityLevel || 'medium',
      dueDate: t?.dueDate ? new Date(t.dueDate) : null,
      attachments: Array.isArray(t?.attachments) ? t.attachments : [],
      subtasks: Array.isArray(t?.subtasks) ? t.subtasks : []
    })
  }

  if (mappedTasks.length === 0) {
    return { createdCount: 0, createdIds: [], columnId: String(targetCol._id), columnName: targetCol.columnName }
  }

  // group by column and push atomically
  const byColumn = new Map()
  for (const t of mappedTasks) {
    const key = String(t._colId)
    if (!byColumn.has(key)) byColumn.set(key, [])
    byColumn.get(key).push(t)
  }

  let total = 0
  const createdIds = []

  for (const [colIdStr, tasksForCol] of byColumn.entries()) {
    tasksForCol.forEach(t => { delete t._colId })

    const res = await ProjectBoards.updateOne(
      { projectId },
      {
        $push: {
          'boards.$[b].columns.$[c].tasks': { $each: tasksForCol }
        }
      },
      {
        arrayFilters: [
          { 'b._id': new mongoose.Types.ObjectId(String(boardId)) },
          { 'c._id': new mongoose.Types.ObjectId(colIdStr) }
        ]
      }
    )

    if (res.modifiedCount === 0) {
      throw new Error('update_no_match_board_or_column')
    }

    total += tasksForCol.length
  }

  return {
    createdCount: total,
    createdIds,
    columnId: String(targetCol._id),
    columnName: targetCol.columnName
  }
}

export async function startTaskConsumer(
  amqUrl,
  commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
  eventsEx = process.env.EVENTS_EX || 'bitboard.events'
) {
  const conn = await amqplib.connect(amqUrl)
  const ch = await conn.createChannel()

  await ch.assertExchange(commandsEx, 'topic', { durable: true })
  await ch.assertExchange(eventsEx, 'topic', { durable: true })

  const { queue } = await ch.assertQueue('', { exclusive: true, durable: false })
  await ch.bindQueue(queue, commandsEx, ROUTING_KEY)

  ch.consume(queue, async (msg) => {
    if (!msg) return
    try {
      const body = JSON.parse(msg.content.toString())

      const projectId = body?.projectId || body?.payload?.projectId
      const boardId   = body?.boardId   || body?.payload?.boardId
      const createdBy = body?.createdBy || body?.payload?.createdBy
      const column    = body?.column    || body?.payload?.column || body?.payload?.columnName
      const tasks     = body?.tasks     || body?.payload?.tasks || []

      if (!projectId || !boardId) throw new Error('projectId_or_boardId_missing')

      const result = await insertTasksIntoBoard({ projectId, boardId, tasks, createdBy, columnName: column })

      await publishEvent(ch, eventsEx, 'task.bulkcreated', {
        type: 'task.bulkcreated',
        correlationId: body?.correlationId,
        payload: {
          projectId,
          boardId,
          column: result.columnName,
          count: result.createdCount,
          taskIds: result.createdIds
        }
      })

      ch.ack(msg)
    } catch (e) {
      try {
        const body = JSON.parse(msg.content.toString())
        await publishEvent(ch, eventsEx, 'task.bulkcreate.failed', {
          type: 'task.bulkcreate.failed',
          correlationId: body?.correlationId,
          payload: { reason: e?.message || String(e) }
        })
      } catch {}
      ch.ack(msg)
    }
  })
}


























// import amqplib from 'amqplib'
// import mongoose from 'mongoose'
// import { ProjectBoards } from '../models/boardModel.js'
// import { publishEvent } from '../utils/publisher.js'
// import UserView from '../models/user-view.js'

// const ROUTING_KEY = 'task.bulkcreate.request'

// // resolve a single id to UserView._id
// async function resolveUserViewId(anyId) {
//   if (!anyId) return null
//   // try as userView _id
//   let uv = await UserView.findOne({ _id: anyId }, { _id: 1 }).lean()
//   if (uv) return new mongoose.Types.ObjectId(String(uv._id))
//   // try as userId
//   uv = await UserView.findOne({ userId: anyId }, { _id: 1 }).lean()
//   if (uv) return new mongoose.Types.ObjectId(String(uv._id))
//   // try from object shape { user: <id> }
//   if (typeof anyId === 'object' && anyId.user) {
//     return new mongoose.Types.ObjectId(String(anyId.user))
//   }
//   // fallback: trust it is an ObjectId-like value
//   return new mongoose.Types.ObjectId(String(anyId))
// }

// // normalize array to UserView._id[]
// async function toUserViewIdArray(input) {
//   if (!input) return []
//   const arr = Array.isArray(input) ? input : [input]
//   const out = []
//   for (const v of arr) {
//     const oid = await resolveUserViewId(v)
//     if (oid) out.push(oid)
//   }
//   return out
// }

// // Persist tasks into first column (Backlog) and set status to that column name
// async function insertTasksIntoBoard({ projectId, boardId, tasks, createdBy }) {
//   const holder = await ProjectBoards.findOne({ projectId })
//   if (!holder) throw new Error('ProjectBoards not found for project')

//   const board = holder.boards?.find(b => String(b._id) === String(boardId))
//   if (!board) throw new Error('Board not found')

//   if (!Array.isArray(board.columns) || board.columns.length === 0) {
//     throw new Error('Board has no columns')
//   }

//   const firstColumn = board.columns[0]
//   let createdCount = 0
//   const createdIds = []

//   // resolve createdBy to UserView id once
//   const createdByUv = createdBy ? await resolveUserViewId(createdBy) : null

//   for (const t of tasks || []) {
//     const title = t.title?.trim()
//     if (!title) continue

//     // Always place in first column for now
//     const targetCol = firstColumn

//     // prefer payload-provided assignees/reporters, else default to actor
//     const assigneesUv = await toUserViewIdArray(
//       (t.assignees && t.assignees.length) ? t.assignees : (createdByUv ? [createdByUv] : [])
//     )
//     const reporterUv = await toUserViewIdArray(
//       (t.reporter && t.reporter.length) ? t.reporter : (createdByUv ? [createdByUv] : [])
//     )

//     const doc = {
//       taskName: title,
//       taskDescription: t.description || '',
//       status: targetCol?.columnName || 'Backlog',
//       // IMPORTANT: these are arrays of UserView ObjectIds
//       assignee: assigneesUv,
//       reporter: reporterUv,
//       priority: t.priority || 'medium',
//       dueDate: t.dueDate ? new Date(t.dueDate) : null,
//       attachments: Array.isArray(t.attachments) ? t.attachments : [],
//     }

//     targetCol.tasks.push(doc)
//     const newId = targetCol.tasks[targetCol.tasks.length - 1]?._id
//     if (newId) createdIds.push(String(newId))
//     createdCount++
//   }

//   await holder.save()
//   return { createdCount, createdIds, columnId: String(firstColumn._id) }
// }

// export async function startTaskConsumer(
//   amqUrl,
//   commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
//   eventsEx = process.env.EVENTS_EX || 'bitboard.events'
// ) {
//   async function connectAndConsume() {
//     const conn = await amqplib.connect(amqUrl)
//     const ch = await conn.createChannel()

//     await ch.assertExchange(commandsEx, 'topic', { durable: true })
//     await ch.assertExchange(eventsEx, 'topic', { durable: true })

//     const { queue } = await ch.assertQueue('', { exclusive: true, durable: false })
//     await ch.bindQueue(queue, commandsEx, ROUTING_KEY)

//     ch.consume(queue, async (msg) => {
//       if (!msg) return
//       try {
//         const body = JSON.parse(msg.content.toString())

//         const projectId = body.projectId || body.payload?.projectId
//         const boardId   = body.boardId   || body.payload?.boardId
//         const createdBy = body.createdBy || body.payload?.createdBy
//         const tasks     = body.tasks     || body.payload?.tasks || []

//         if (!projectId || !boardId) throw new Error('projectId/boardId missing')

//         const result = await insertTasksIntoBoard({ projectId, boardId, tasks, createdBy })
//         await publishEvent(ch, eventsEx, 'task.bulkcreated', {
//           type: 'task.bulkcreated',
//           correlationId: body.correlationId,
//           payload: {
//             projectId,
//             boardId,
//             columnId: result.columnId,
//             count: result.createdCount,
//             taskIds: result.createdIds
//           }
//         })
//         ch.ack(msg)
//       } catch (e) {
//         try {
//           const body = JSON.parse(msg.content.toString())
//           await publishEvent(ch, eventsEx, 'task.bulkcreate.failed', {
//             type: 'task.bulkcreate.failed',
//             correlationId: body?.correlationId,
//             payload: { reason: e?.message || String(e) }
//           })
//         } catch {}
//         ch.ack(msg)
//       }
//     })

//     // don’t crash on ECONNRESET
//     conn.on('error', () => {})
//     conn.on('close', async () => {
//       setTimeout(() => connectAndConsume().catch(()=>{}), 2000)
//     })
//     return { conn, ch }
//   }

//   return await connectAndConsume()
// }




























// // workspaceService/rabbitmq/taskConsumer.js
// // Complete file (rewritten).
// // Fixes:
// // 1) Assignee and reporter are stored as ObjectId[] not objects
// // 2) Sab new tasks first column (Backlog) me jayenge
// // 3) status required field ko column name pe set kar rahe
// // 4) RMQ auto-reconnect taake ECONNRESET pe service crash na ho
// // 5) task.bulkcreated / task.bulkcreate.failed events emit

// import amqplib from 'amqplib'
// import mongoose from 'mongoose'
// import { ProjectBoards } from '../models/boardModel.js'
// import { publishEvent } from '../utils/publisher.js'

// const ROUTING_KEY = 'task.bulkcreate.request'

// // Helper: normalize incoming member field into ObjectId[]
// function normalizeIdArray(input) {
//   if (!input) return []
//   const arr = Array.isArray(input) ? input : [input]
//   const out = []
//   for (const v of arr) {
//     if (!v) continue
//     // accept { user: <id> } or raw id
//     const id = typeof v === 'object' && v.user ? v.user : v
//     try {
//       out.push(new mongoose.Types.ObjectId(String(id)))
//     } catch {}
//   }
//   return out
// }

// // Persist tasks into first column unless overridden later
// async function insertTasksIntoBoard({ projectId, boardId, tasks, createdBy }) {
//   const holder = await ProjectBoards.findOne({ projectId })
//   if (!holder) throw new Error('ProjectBoards not found for project')

//   const board = holder.boards?.find(b => String(b._id) === String(boardId))
//   if (!board) throw new Error('Board not found')

//   if (!Array.isArray(board.columns) || board.columns.length === 0) {
//     throw new Error('Board has no columns')
//   }

//   // first column = Backlog
//   const firstColumn = board.columns[0]

//   let createdCount = 0
//   const createdIds = []

//   for (const t of tasks || []) {
//     const title = t.title?.trim()
//     if (!title) continue

//     // Always start in first column (Backlog) as per requirement
//     let targetCol = firstColumn
//     /* If later you want to honor explicit columns, re-enable this block
//     if (t.columnId) {
//       const byId = board.columns.find(c => String(c._id) === String(t.columnId))
//       if (byId) targetCol = byId
//     } else if (t.columnName) {
//       const byName = board.columns.find(c => c?.columnName?.toLowerCase() === String(t.columnName).toLowerCase())
//       if (byName) targetCol = byName
//     }
//     */

//     const doc = {
//       taskName: title,
//       taskDescription: t.description || '',
//       status: targetCol?.columnName || 'Backlog', // ensure required status
//       // IMPORTANT CHANGE: store only ObjectId[]
//       assignee: normalizeIdArray(t.assignees?.length ? t.assignees : (createdBy ? [createdBy] : [])),
//       reporter: normalizeIdArray(t.reporter?.length ? t.reporter : (createdBy ? [createdBy] : [])),
//       priority: t.priority || 'medium',
//       dueDate: t.dueDate ? new Date(t.dueDate) : null,
//       attachments: Array.isArray(t.attachments) ? t.attachments : [],
//     }

//     // push into target column's tasks
//     targetCol.tasks.push(doc)
//     const newId = targetCol.tasks[targetCol.tasks.length - 1]?._id
//     if (newId) createdIds.push(String(newId))
//     createdCount++
//   }

//   await holder.save()
//   return { createdCount, createdIds, columnId: String(firstColumn._id) }
// }

// export async function startTaskConsumer(
//   amqUrl,
//   commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
//   eventsEx = process.env.EVENTS_EX || 'bitboard.events'
// ) {
//   async function connectAndConsume() {
//     const conn = await amqplib.connect(amqUrl)
//     const ch = await conn.createChannel()

//     await ch.assertExchange(commandsEx, 'topic', { durable: true })
//     await ch.assertExchange(eventsEx, 'topic', { durable: true })

//     const { queue } = await ch.assertQueue('', { exclusive: true, durable: false })
//     await ch.bindQueue(queue, commandsEx, ROUTING_KEY)

//     ch.consume(queue, async (msg) => {
//       if (!msg) return
//       try {
//         const body = JSON.parse(msg.content.toString())

//         const projectId = body.projectId || body.payload?.projectId
//         const boardId = body.boardId || body.payload?.boardId
//         const createdBy = body.createdBy || body.payload?.createdBy
//         const tasks = body.tasks || body.payload?.tasks || []

//         if (!projectId || !boardId) throw new Error('projectId/boardId missing')

//         const result = await insertTasksIntoBoard({ projectId, boardId, tasks, createdBy })
//         await publishEvent(ch, eventsEx, 'task.bulkcreated', {
//           type: 'task.bulkcreated',
//           correlationId: body.correlationId,
//           payload: {
//             projectId,
//             boardId,
//             columnId: result.columnId,
//             count: result.createdCount,
//             taskIds: result.createdIds
//           }
//         })
//         ch.ack(msg)
//       } catch (e) {
//         try {
//           const body = JSON.parse(msg.content.toString())
//           await publishEvent(ch, eventsEx, 'task.bulkcreate.failed', {
//             type: 'task.bulkcreate.failed',
//             correlationId: body?.correlationId,
//             payload: { reason: e?.message || String(e) }
//           })
//         } catch {}
//         ch.ack(msg)
//       }
//     })

//     // Prevent crashes on ECONNRESET and auto-reconnect
//     conn.on('error', () => {})
//     conn.on('close', async () => {
//       setTimeout(() => connectAndConsume().catch(()=>{}), 2000)
//     })
//     return { conn, ch }
//   }

//   return await connectAndConsume()
// }
















// import amqplib from 'amqplib'
// import { ProjectBoards } from '../models/boardModel.js'
// import { publishEvent } from '../utils/publisher.js'
// import { buildActorMember } from '../utils/actor.js';


// export async function startTaskConsumer(
//   amqUrl,
//   commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
//   eventsEx = process.env.EVENTS_EX || 'bitboard.events'
// ) {
//   const conn = await amqplib.connect(amqUrl)
//   const ch = await conn.createChannel()

//   await ch.assertExchange(commandsEx, 'topic', { durable: true })
//   await ch.assertExchange(eventsEx, 'topic', { durable: true })

//   const q = await ch.assertQueue('task-commands.q', { durable: true })
//   await ch.bindQueue(q.queue, commandsEx, 'task.bulkcreate.request')

//   ch.consume(q.queue, async msg => {
//     try {
//       if (!msg) return
//       const body = JSON.parse(msg.content.toString())
//       const correlationId = body.correlationId

//       const projectId = body.projectId || (body.payload && body.payload.projectId)
//       const boardId = body.boardId || (body.payload && body.payload.boardId)
//       const payload = body.payload || {}
//       const tasks = Array.isArray(payload.tasks) ? payload.tasks : []

//       const createdByUserId = body.createdBy || payload.createdBy || payload.userId;
//       const actorMember = await buildActorMember(createdByUserId, "contributor");

//       if (!projectId) throw new Error('projectId missing')
//       if (!boardId) throw new Error('boardId missing')
//       if (!Array.isArray(tasks) || tasks.length === 0) throw new Error('tasks empty')

//       const doc = await ProjectBoards.findOne({ projectId })
//       if (!doc) throw new Error('project boards doc not found')

//       const board = doc.boards.id(boardId)
//       if (!board) throw new Error('board not found')

//       const before = board.columns.reduce((acc, c) => acc + c.tasks.length, 0)

//       for (const t of tasks) {
//         const columnName = t.columnName || t.statusColumn || t.status
//         if (!columnName) throw new Error('columnName missing in task')
//         const col = board.columns.find(c => c.columnName === columnName)
//         if (!col) throw new Error(`column not found ${columnName}`)
        
//         const finalAssignee =
//           Array.isArray(t.assignee) && t.assignee.length
//             ? t.assignee
//             : (board.defaultAssignees && board.defaultAssignees.length)
//               ? board.defaultAssignees
//               : actorMember
//                 ? [actorMember]
//                 : [];

//         const finalReporter =
//           t.reporter
//             ? t.reporter
//             : board.defaultReporter
//               ? board.defaultReporter
//               : actorMember || null;

//         col.tasks.push({
//           taskName: t.taskName || t.title,
//           taskDescription: t.taskDescription || t.description || '',
//           status: t.status || 'todo',
//           // assignee: Array.isArray(t.assignee) ? t.assignee : [],
//           // reporter: Array.isArray(t.reporter) ? t.reporter : [],
//           assignee: finalAssignee,
//           reporter: finalReporter,
//           priorityLevel: t.priorityLevel || 'medium',
//           attachments: Array.isArray(t.attachments) ? t.attachments : [],
//           activities: Array.isArray(t.activities) ? t.activities : [],
//           comments: t.comments || '',
//           relatedTaskIDs: Array.isArray(t.relatedTaskIDs) ? t.relatedTaskIDs : [],
//           isTrashed: !!t.isTrashed
//         })
//       }

//       await doc.save()

//       const after = board.columns.reduce((acc, c) => acc + c.tasks.length, 0)
//       const createdCount = Math.max(after - before, 0)

//       await publishEvent(ch, eventsEx, 'task.bulkcreated', {
//         correlationId,
//         payload: { projectId, boardId, createdCount }
//       })
//     } catch (e) {
//       try {
//         const bodySafe = JSON.parse(msg.content.toString())
//         await publishEvent(ch, eventsEx, 'task.bulkcreate.failed', {
//           correlationId: bodySafe.correlationId,
//           payload: { reason: e.message }
//         })
//       } catch {}
//     } finally {
//       ch.ack(msg)
//     }
//   })
// }




























// import amqplib from 'amqplib'
// import { ProjectBoards } from '../models/boardModel.js'
// import { publishEvent } from '../utils/publisher.js'

// export async function startTaskConsumer(
//   amqUrl,
//   commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
//   eventsEx = process.env.EVENTS_EX || 'bitboard.events'
// ) {
//   const conn = await amqplib.connect(amqUrl)
//   const ch = await conn.createChannel()
//   await ch.assertExchange(commandsEx, 'topic', { durable: true })
//   await ch.assertExchange(eventsEx, 'topic', { durable: true })

//   // NEW: dedicated queue for task commands
//   const q = await ch.assertQueue('workspace.task.commands', { durable: true })
//   await ch.bindQueue(q.queue, commandsEx, 'task.bulkcreate.request')
//   console.log('[bind] workspace.task.commands ->', commandsEx, 'key=task.bulkcreate.request')

//   await ch.consume(q.queue, async msg => {
//     if (!msg) return
//     const bodyStr = msg.content.toString()
//     console.log('[consume] task.bulkcreate.request', bodyStr)
//     try {
//       const { correlationId, payload } = JSON.parse(bodyStr)
//       const { projectId, boardId, column, tasks = [] } = payload

//       // CHANGED: locate board inside holder using subdoc id
//       const holder = await ProjectBoards.findOne({ 'boards._id': boardId })
//       if (!holder) throw new Error('project_boards_not_found')

//       const board = holder.boards.id(boardId)
//       if (!board || String(board.projectId) !== String(projectId)) throw new Error('board_not_found')

//       // CHANGED: columns use columnName per schema
//       const col = board.columns.find(c => c.columnName === column) || board.columns[0]
//       if (!col) throw new Error('column_not_found')

//       const before = col.tasks.length

//       // CHANGED: push correct task shape per schema
//       for (const t of tasks) {
//         if (!t?.title) continue
//         col.tasks.push({
//           taskName: t.title,
//           taskDescription: t.description || '',
//           status: col.columnName,
//           subtasks: [],
//           assignee: [],
//           reporter: [],
//           priorityLevel: 'medium',
//           attachments: [],
//           activities: [{ type: 'created', activity: `Task "${t.title}" created`, date: new Date() }],
//           comments: '',
//           relatedTaskIDs: [],
//           isTrashed: false
//         })
//       }

//       await holder.save()

//       const created = col.tasks.length - before
//       const ids = created > 0 ? col.tasks.slice(-created).map(x => String(x._id)) : []

//       await publishEvent(ch, eventsEx, 'task.bulkcreated', {
//         correlationId,
//         payload: { projectId, boardId, column: col.columnName, count: created, taskIds: ids }
//       })
//     } catch (e) {
//       console.error('task.bulkcreate error', e.message)
//       try {
//         const body = JSON.parse(bodyStr)
//         await publishEvent(ch, eventsEx, 'task.bulkcreate.failed', {
//           correlationId: body.correlationId,
//           payload: { reason: e.message }
//         })
//       } catch {}
//     } finally {
//       ch.ack(msg)
//     }
//   })
// }





























// import amqplib from 'amqplib'
// import {ProjectBoards} from '../models/boardModel.js'
// import { publishEvent } from '../utils/publisher.js'

// export async function startTaskConsumer(amqpUrl, commandsEx = 'bitboard.commands', eventsEx = 'bitboard.events') {
//   const conn = await amqplib.connect(amqpUrl)
//   const ch = await conn.createChannel()
//   await ch.assertExchange(commandsEx, 'topic', { durable: true })
//   await ch.assertExchange(eventsEx, 'topic', { durable: true })
//   const q = await ch.assertQueue('workspace.task.commands', { durable: true })
//   await ch.bindQueue(q.queue, commandsEx, 'task.bulkcreate.request')

//   await ch.consume(q.queue, async (msg) => {
//     if (!msg) return
//     try {
//       const body = JSON.parse(msg.content.toString())
//       const { correlationId, payload } = body
//       const { projectId, boardId, column, tasks } = payload

//       const pb = await ProjectBoards.findOne({ projectId })
//       if (!pb) throw new Error('project_boards_not_found')
//       const board = pb.boards.id(boardId)
//       if (!board) throw new Error('board_not_found')
//       const col = board.columns.find(c => c.name === column) || board.columns[0]
//       if (!col) throw new Error('column_not_found')

//       const before = col.tasks.length
//       for (const t of tasks || []) {
//         col.tasks.push({
//           taskName: t.title,
//           description: t.description || '',
//           priority: 'medium',
//           attachments: [],
//           subtasks: [],
//           activities: []
//         })
//       }
//       await pb.save()
//       const after = col.tasks.length
//       const created = after - before
//       const ids = col.tasks.slice(-created).map(x => x._id.toString())

//       await publishEvent(ch, eventsEx, 'task.bulkcreated', { correlationId, payload: { projectId, boardId, column, count: created, taskIds: ids } })
//       ch.ack(msg)
//     } catch (e) {
//       try {
//         const body = JSON.parse(msg.content.toString())
//         await publishEvent(ch, eventsEx, 'task.bulkcreate.failed', { correlationId: body.correlationId, payload: { reason: e.message } })
//       } catch {}
//       ch.ack(msg)
//     }
//   })
// }
