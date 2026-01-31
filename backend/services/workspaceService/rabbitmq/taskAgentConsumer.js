// workspaceService/rabbitmq/taskAgentConsumer.js
// Dedicated consumer for AI Task Agent bulk create only

import amqplib from 'amqplib'
import mongoose from 'mongoose'
import { ProjectBoards } from '../models/boardModel.js'
import { publishEvent } from '../utils/publisher.js'
import UserView from '../models/user-view.js'

const ROUTING_KEYS = ['task.bulkcreate.request']

function oid(id) {
  return new mongoose.Types.ObjectId(String(id))
}

function isValidColumn(col) {
  return ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'].includes(col)
}

// ------- user / assignee / reporter helpers (same style as taskConsumer) -------

async function resolveUserViewId(anyId) {
  if (!anyId) return null

  // try as UserView _id
  let uv = await UserView.findOne({ _id: anyId }, { _id: 1 }).lean()
  if (uv?._id) return new mongoose.Types.ObjectId(String(uv._id))

  // try as userId
  uv = await UserView.findOne({ userId: anyId }, { _id: 1 }).lean()
  if (uv?._id) return new mongoose.Types.ObjectId(String(uv._id))

  // try from shape { user: <id> }
  if (typeof anyId === 'object' && anyId?.user) {
    return new mongoose.Types.ObjectId(String(anyId.user))
  }

  // fallback: trust it is ObjectId-like
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

// ------- atomic insert with assignee / reporter mapping -------

async function insertTasksAtomic({ projectId, boardId, column, tasks, createdBy }) {
  const filter = {
    projectId: oid(projectId),
    'boards._id': oid(boardId),
    'boards.columns.columnName': column
  }

  // resolve createdBy once
  const createdByUv = await resolveUserViewId(createdBy)

  const tasksForDb = []

  for (const t of tasks || []) {
    const title = (t?.title || t?.taskName || '').trim()
    if (!title) continue

    // reporter: prefer explicit reporter array, else createdBy
    const reporterUv = await toUserViewIdArray(
      (t?.reporter && t.reporter.length)
        ? t.reporter
        : (createdByUv ? [createdByUv] : [])
    )

    // assignee:
    // 1) explicit assignee/assignees
    // 2) else reporter
    // 3) else createdBy
    let assigneesUv = await toUserViewIdArray(t?.assignee || t?.assignees || [])
    if (!assigneesUv.length) assigneesUv = reporterUv
    if (!assigneesUv.length && createdByUv) assigneesUv = [createdByUv]

    tasksForDb.push({
      taskName: title,
      taskDescription: t?.description || t?.taskDescription || '',
      status: column || 'Backlog',
      assignee: assigneesUv,
      reporter: reporterUv,
      priority: t?.priority || t?.priorityLevel || 'medium',
      dueDate: t?.dueDate ? new Date(t.dueDate) : null,
      attachments: Array.isArray(t?.attachments) ? t.attachments : [],
      subtasks: Array.isArray(t?.subtasks) ? t.subtasks : [],
      activities: Array.isArray(t?.activities) ? t.activities : []
    })
  }

  if (!tasksForDb.length) {
    return { count: 0, taskIds: [] }
  }

  const colPath = 'boards.$[b].columns.$[c].tasks'
  const update = {
    $push: {
      [colPath]: {
        $each: tasksForDb
      }
    }
  }

  const arrayFilters = [
    { 'b._id': oid(boardId) },
    { 'c.columnName': column }
  ]

  const opts = {
    arrayFilters,
    new: true,
    projection: {
      boards: { $elemMatch: { _id: oid(boardId) } }
    }
  }

  const pb = await ProjectBoards.findOneAndUpdate(filter, update, opts)
  if (!pb) throw new Error('Board or column not found')

  const board = pb.boards[0]
  const col = board.columns.find(c => c.columnName === column)
  const created = tasksForDb.length
  const ids = col.tasks.slice(-created).map(x => x._id.toString())
  return { count: created, taskIds: ids }
}

export async function startTaskAgentConsumer() {
  const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672'
  const COMMANDS_EX = process.env.COMMANDS_EX || 'bitboard.commands'
  const EVENTS_EX   = process.env.EVENTS_EX   || 'bitboard.events'

  const conn = await amqplib.connect(AMQP_URL)
  const ch = await conn.createChannel()

  await ch.assertExchange(COMMANDS_EX, 'topic', { durable: true })
  await ch.assertExchange(EVENTS_EX, 'topic', { durable: true })
  await ch.prefetch(20)

  const q = await ch.assertQueue('task-agent-consumer.q', { durable: true })
  for (const key of ROUTING_KEYS) {
    await ch.bindQueue(q.queue, COMMANDS_EX, key)
  }

  console.log('[taskAgentConsumer] waiting on', ROUTING_KEYS.join(', '))

  ch.consume(q.queue, async msg => {
    if (!msg) return
    try {
      const rk = msg.fields.routingKey
      const body = JSON.parse(msg.content.toString())
      const { correlationId, payload } = body || {}

      if (!correlationId) throw new Error('missing correlationId')

      if (rk === 'task.bulkcreate.request') {
        const {
          projectId,
          boardId,
          tasks = [],
          createdBy
        } = payload || {}

        if (!projectId || !boardId || !Array.isArray(tasks) || tasks.length === 0) {
          throw new Error('invalid payload for bulkcreate')
        }

        // group by column name like before,
        // but keep full task objects so assignee/reporter etc stay available
        const grouped = {}
        for (const t of tasks) {
          const rawCol = t?.column || t?.columnName
          const col = isValidColumn(rawCol) ? rawCol : 'Backlog'
          if (!grouped[col]) grouped[col] = []
          grouped[col].push(t)
        }

        const allIds = []
        for (const col of Object.keys(grouped)) {
          const { taskIds } = await insertTasksAtomic({
            projectId,
            boardId,
            column: col,
            tasks: grouped[col],
            createdBy
          })
          allIds.push(...taskIds)
        }

        await publishEvent(ch, EVENTS_EX, 'task.bulkcreated', {
          correlationId,
          payload: { projectId, boardId, count: allIds.length, taskIds: allIds }
        })
        ch.ack(msg)
        return
      }

      ch.ack(msg)
    } catch (e) {
      console.error('taskAgentConsumer error', e)
      try {
        const fallback = JSON.parse(msg.content.toString())
        const correlationId = fallback?.correlationId
        await publishEvent(ch, process.env.EVENTS_EX || 'bitboard.events', 'task.agent.failed', {
          correlationId,
          payload: { reason: e.message }
        })
      } catch {}
      ch.ack(msg)
    }
  })

  const tidy = async () => {
    try { await ch.close() } catch {}
    try { await conn.close() } catch {}
    process.exit(0)
  }
  process.on('SIGINT', tidy)
  process.on('SIGTERM', tidy)
}
































// // workspaceService/rabbitmq/taskAgentConsumer.js
// // Dedicated consumer for AI Task Agent bulk create only

// import amqplib from 'amqplib'
// import mongoose from 'mongoose'
// import { ProjectBoards } from '../models/boardModel.js'
// import { publishEvent } from '../utils/publisher.js'

// const ROUTING_KEYS = ['task.bulkcreate.request']

// function oid(id) {
//   return new mongoose.Types.ObjectId(String(id))
// }

// function isValidColumn(col) {
//   return ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'].includes(col)
// }

// async function insertTasksAtomic({ projectId, boardId, column, tasks }) {
//   const filter = {
//     projectId: oid(projectId),
//     'boards._id': oid(boardId),
//     'boards.columns.columnName': column
//   }

//   const colPath = 'boards.$[b].columns.$[c].tasks'
//   const update = {
//     $push: {
//       [colPath]: {
//         $each: tasks.map(t => ({
//           taskName: t.title,
//           taskDescription: t.description || '',
//           priority: 'medium',
//           attachments: [],
//           subtasks: [],
//           activities: []
//         }))
//       }
//     }
//   }

//   const arrayFilters = [
//     { 'b._id': oid(boardId) },
//     { 'c.columnName': column }
//   ]

//   const opts = { 
//     arrayFilters, 
//     new: true, 
//     // projection: { 'boards.$': 1 }
//     projection: {
//     boards: { $elemMatch: { _id: oid(boardId) } }
//     } 
    
//   }

//   const pb = await ProjectBoards.findOneAndUpdate(filter, update, opts)
//   if (!pb) throw new Error('Board or column not found')

//   const board = pb.boards[0]
//   const col = board.columns.find(c => c.columnName === column)
//   const created = tasks.length
//   const ids = col.tasks.slice(-created).map(x => x._id.toString())
//   return { count: created, taskIds: ids }
// }

// export async function startTaskAgentConsumer() {
//   const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672'
//   const COMMANDS_EX = process.env.COMMANDS_EX || 'bitboard.commands'
//   const EVENTS_EX   = process.env.EVENTS_EX   || 'bitboard.events'

//   const conn = await amqplib.connect(AMQP_URL)
//   const ch = await conn.createChannel()

//   await ch.assertExchange(COMMANDS_EX, 'topic', { durable: true })
//   await ch.assertExchange(EVENTS_EX, 'topic', { durable: true })
//   await ch.prefetch(20)

//   const q = await ch.assertQueue('task-agent-consumer.q', { durable: true })
//   for (const key of ROUTING_KEYS) {
//     await ch.bindQueue(q.queue, COMMANDS_EX, key)
//   }

//   console.log('[taskAgentConsumer] waiting on', ROUTING_KEYS.join(', '))

//   ch.consume(q.queue, async msg => {
//     if (!msg) return
//     try {
//       const rk = msg.fields.routingKey
//       const body = JSON.parse(msg.content.toString())
//       const { correlationId, payload } = body || {}

//       if (!correlationId) throw new Error('missing correlationId')

//       if (rk === 'task.bulkcreate.request') {
//         const { projectId, boardId, tasks = [] } = payload || {}
//         if (!projectId || !boardId || !Array.isArray(tasks) || tasks.length === 0) {
//           throw new Error('invalid payload for bulkcreate')
//         }

//         const grouped = {}
//         for (const t of tasks) {
//           const col = isValidColumn(t.column) ? t.column : 'Backlog'
//           grouped[col] = grouped[col] || []
//           grouped[col].push({ title: t.title, description: t.description })
//         }

//         const allIds = []
//         for (const col of Object.keys(grouped)) {
//           const { taskIds } = await insertTasksAtomic({ projectId, boardId, column: col, tasks: grouped[col] })
//           allIds.push(...taskIds)
//         }

//         await publishEvent(ch, EVENTS_EX, 'task.bulkcreated', {
//           correlationId,
//           payload: { projectId, boardId, count: allIds.length, taskIds: allIds }
//         })
//         ch.ack(msg)
//         return
//       }

//       ch.ack(msg)
//     } catch (e) {
//       console.error('taskAgentConsumer error', e)
//       try {
//         const fallback = JSON.parse(msg.content.toString())
//         const correlationId = fallback?.correlationId
//         await publishEvent(ch, process.env.EVENTS_EX || 'bitboard.events', 'task.agent.failed', {
//           correlationId,
//           payload: { reason: e.message }
//         })
//       } catch {}
//       ch.ack(msg)
//     }
//   })

//   const tidy = async () => {
//     try { await ch.close() } catch {}
//     try { await conn.close() } catch {}
//     process.exit(0)
//   }
//   process.on('SIGINT', tidy)
//   process.on('SIGTERM', tidy)
// }
