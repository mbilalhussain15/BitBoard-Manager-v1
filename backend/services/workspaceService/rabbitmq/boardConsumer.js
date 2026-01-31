// workspaceService/rabbitmq/boardConsumer.js

import amqplib from 'amqplib'
import mongoose from 'mongoose'
import { ProjectBoards } from '../models/boardModel.js'
import { publishEvent } from '../utils/publisher.js'
import { buildActorMember } from '../utils/actor.js'

const ENTERPRISE_COLUMNS = [
  'Backlog',
  'Todo',
  'In Progress',
  'In Review',
  'Testing',
  'Done',
  'Cancelled'
]

function normalizeColumns(inputCols) {
  const cols = Array.isArray(inputCols) ? inputCols : []
  const names = cols
    .map(c => {
      if (typeof c === 'string') return c.trim()
      return c?.columnName?.trim?.() || c?.name?.trim?.() || c?.title?.trim?.() || null
    })
  const final = names.filter(Boolean)
  const use = final.length ? final : ENTERPRISE_COLUMNS
  return use.map(n => ({ columnName: n, tasks: [] }))
}

export async function startBoardConsumer(
  amqUrl,
  commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
  eventsEx = process.env.EVENTS_EX || 'bitboard.events'
) {
  const conn = await amqplib.connect(amqUrl)
  const ch = await conn.createChannel()

  await ch.assertExchange(commandsEx, 'topic', { durable: true })
  await ch.assertExchange(eventsEx, 'topic', { durable: true })

  const q = await ch.assertQueue('board-commands.q', { durable: true })
  await ch.bindQueue(q.queue, commandsEx, 'board.create.request')

  ch.consume(q.queue, async msg => {
    try {
      if (!msg) return
      const body = JSON.parse(msg.content.toString())
      const correlationId = body.correlationId

      const projectId = body.projectId || body.payload?.projectId
      const payload = body.payload || {}
      const title = payload.title || body.title
      const inputCols = Array.isArray(payload.columns) ? payload.columns : []

      if (!projectId) throw new Error('projectId missing')
      if (!title) throw new Error('title missing')

      await ProjectBoards.findOneAndUpdate(
        { projectId },
        { $setOnInsert: { projectId, boards: [] } },
        { upsert: true, new: true }
      )

      const columns = normalizeColumns(inputCols)

      const createdByUserId = body.createdBy || payload.createdBy || payload.userId
      const actorMember = await buildActorMember(createdByUserId, 'contributor')

      const newBoard = {
        boardName: title,
        projectId: projectId,
        columns
      }
      if (actorMember) {
        newBoard.members = [actorMember]
        newBoard.defaultAssignees = [actorMember]
        newBoard.defaultReporter = actorMember
      }

      const pushRes = await ProjectBoards.updateOne(
        { projectId, 'boards.boardName': { $ne: title } },
        { $push: { boards: newBoard } }
      )

      const holder = await ProjectBoards.findOne(
        { projectId },
        { boards: 1 }
      ).lean()

      const board = holder?.boards?.find(b => b.boardName === title)
      if (!board) throw new Error('board not found after upsert')

      await publishEvent(ch, eventsEx, 'board.created', {
        correlationId,
        payload: { projectId, boardId: String(board._id), title }
      })
    } catch (e) {
      try {
        const bodySafe = JSON.parse(msg.content.toString())
        await publishEvent(ch, eventsEx, 'board.create.failed', {
          correlationId: bodySafe.correlationId,
          payload: { reason: e.message }
        })
      } catch {}
    } finally {
      ch.ack(msg)
    }
  })
}























// import amqplib from 'amqplib'
// import { ProjectBoards } from '../models/boardModel.js'
// import { publishEvent } from '../utils/publisher.js'
// import { buildActorMember } from '../utils/actor.js'

// export async function startBoardConsumer(
//   amqUrl,
//   commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
//   eventsEx = process.env.EVENTS_EX || 'bitboard.events'
// ) {
//   const conn = await amqplib.connect(amqUrl)
//   const ch = await conn.createChannel()

//   await ch.assertExchange(commandsEx, 'topic', { durable: true })
//   await ch.assertExchange(eventsEx, 'topic', { durable: true })

//   // dedicated, durable queue
//   const q = await ch.assertQueue('board-commands.q', { durable: true })
//   await ch.bindQueue(q.queue, commandsEx, 'board.create.request')

//   ch.consume(q.queue, async msg => {
//     try {
//       if (!msg) return
//       const body = JSON.parse(msg.content.toString())
//       const correlationId = body.correlationId

//       const projectId = body.projectId || body.payload?.projectId
//       const payload = body.payload || {}
//       const title = payload.title || body.title
//       const inputCols = Array.isArray(payload.columns) ? payload.columns : []

//       if (!projectId) throw new Error('projectId missing')
//       if (!title) throw new Error('title missing')

//       // 1) Atomically ensure holder exists. This prevents E11000 on projectId.
//       await ProjectBoards.findOneAndUpdate(
//         { projectId },
//         { $setOnInsert: { projectId, boards: [] } },
//         { upsert: true, new: true }
//       )

//       // 2) Build columns once
//       const columns = inputCols.length > 0
//         ? inputCols.map(c => ({ columnName: c.columnName || c.name || 'Todo', tasks: [] }))
//         : [
//             { columnName: 'Backlog', tasks: [] },
//             { columnName: 'Todo', tasks: [] },
//             { columnName: 'In Progress', tasks: [] },
//             { columnName: 'Review', tasks: [] },
//             { columnName: 'Done', tasks: [] }
//           ]

//       // 3) Default board membership from actor
//       const createdByUserId =
//         body.createdBy || payload.createdBy || payload.userId
//       const actorMember = await buildActorMember(createdByUserId, 'contributor')

//       const newBoard = {
//         boardName: title,
//         projectId: projectId,
//         columns
//       }
//       if (actorMember) {
//         newBoard.members = [actorMember]
//         newBoard.defaultAssignees = [actorMember]
//         newBoard.defaultReporter = actorMember
//       }

//       // 4) Idempotent push. Only push if a board with same name is not present.
//       //    This is atomic at the document level, so two concurrent creates will not duplicate.
//       const pushRes = await ProjectBoards.updateOne(
//         { projectId, 'boards.boardName': { $ne: title } },
//         { $push: { boards: newBoard } }
//       )

//       // 5) Fetch the board id to emit event, whether it was newly created or already existed.
//       const holder = await ProjectBoards.findOne(
//         { projectId },
//         { boards: 1 }
//       ).lean()

//       const board = holder?.boards?.find(b => b.boardName === title)
//       if (!board) throw new Error('board not found after upsert')

//       await publishEvent(ch, eventsEx, 'board.created', {
//         correlationId,
//         payload: { projectId, boardId: String(board._id), title }
//       })
//     } catch (e) {
//       try {
//         const bodySafe = JSON.parse(msg.content.toString())
//         await publishEvent(ch, eventsEx, 'board.create.failed', {
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
// import { buildActorMember } from '../utils/actor.js';

// export async function startBoardConsumer(
//   amqUrl,
//   commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
//   eventsEx = process.env.EVENTS_EX || 'bitboard.events'
// ) {
//   const conn = await amqplib.connect(amqUrl)
//   const ch = await conn.createChannel()

//   await ch.assertExchange(commandsEx, 'topic', { durable: true })
//   await ch.assertExchange(eventsEx, 'topic', { durable: true })

//   const q = await ch.assertQueue('board-commands.q', { durable: true })
//   await ch.bindQueue(q.queue, commandsEx, 'board.create.request')

//   ch.consume(q.queue, async msg => {
//     try {
//       if (!msg) return
//       const body = JSON.parse(msg.content.toString())
//       const correlationId = body.correlationId

//       const projectId = body.projectId || (body.payload && body.payload.projectId)
//       const payload = body.payload || {}
//       const title = payload.title || body.title
//       const inputCols = Array.isArray(payload.columns) ? payload.columns : []

//       if (!projectId) throw new Error('projectId missing')
//       if (!title) throw new Error('title missing')

//       let doc = await ProjectBoards.findOne({ projectId })
//       if (!doc) {
//         doc = await ProjectBoards.create({ projectId, boards: [] })
//       }

//       const exists = doc.boards.find(b => b.boardName === title)
//       if (exists) {
//         await publishEvent(ch, eventsEx, 'board.created', {
//           correlationId,
//           payload: { projectId, boardId: exists._id.toString(), title }
//         })
//         return
//       }

//       const columns = inputCols.length > 0
//         ? inputCols.map(c => ({ columnName: c.columnName || c.name || 'Todo', tasks: [] }))
//         : [
//             { columnName: 'Backlog', tasks: [] },
//             { columnName: 'Todo', tasks: [] },
//             { columnName: 'In Progress', tasks: [] },
//             { columnName: 'Review', tasks: [] },
//             { columnName: 'Done', tasks: [] }
//           ]

//        const createdByUserId = body.createdBy || payload.createdBy || payload.userId;
//       const actorMember = await buildActorMember(createdByUserId, "contributor");

//       const newBoard = {
//         boardName: title,
//         projectId: projectId,
//         columns
//       }
//       if (actorMember) {
//         newBoard.members = [actorMember]; // CHANGE: added default board member
//         newBoard.defaultAssignees = [actorMember]; // CHANGE: helpful defaults for tasks
//         newBoard.defaultReporter = actorMember; // CHANGE: helpful defaults for tasks
//       }

//       if (!newBoard.projectId) throw new Error('computed board.projectId missing')

//       doc.boards.push(newBoard)
//       await doc.save()

//       const savedBoard = doc.boards[doc.boards.length - 1]
//       await publishEvent(ch, eventsEx, 'board.created', {
//         correlationId,
//         payload: { projectId, boardId: savedBoard._id.toString(), title }
//       })
//     } catch (e) {
//       try {
//         const bodySafe = JSON.parse(msg.content.toString())
//         await publishEvent(ch, eventsEx, 'board.create.failed', {
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
// import Project from '../models/project.js'
// import { ProjectBoards } from '../models/boardModel.js'
// import { publishEvent } from '../utils/publisher.js'

// export async function startBoardConsumer(
//   amqpUrl,
//   commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
//   eventsEx = process.env.EVENTS_EX || 'bitboard.events'
// ) {
//   const conn = await amqplib.connect(amqpUrl)
//   const ch = await conn.createChannel()
//   await ch.assertExchange(commandsEx, 'topic', { durable: true })
//   await ch.assertExchange(eventsEx, 'topic', { durable: true })

//   // NEW: dedicated queue for board commands
//   const q = await ch.assertQueue('workspace.board.commands', { durable: true })
//   await ch.bindQueue(q.queue, commandsEx, 'board.create.request')
//   console.log('[bind] workspace.board.commands ->', commandsEx, 'key=board.create.request')

//   await ch.consume(q.queue, async msg => {
//     if (!msg) return
//     const bodyStr = msg.content.toString()
//     console.log('[consume] board.create.request', bodyStr)
//     try {
//       const { correlationId, payload } = JSON.parse(bodyStr)
//       const { workspaceId, projectId, title, columns = [], projectTitle } = payload

//       // CHANGED: ensure this project belongs to workspace
//       const project = await Project.findOne({ _id: projectId, workspace: workspaceId })
//       if (!project) throw new Error('project_not_found')

//       // CHANGED: single holder doc, same pattern as your controllers
//       let holder = await ProjectBoards.findOne()
//       if (!holder) holder = await ProjectBoards.create({ boards: [] })

//       // idempotent by (projectId + boardName)
//       let board = holder.boards.find(
//         b => String(b.projectId) === String(projectId) && b.boardName === title
//       )
//       if (!board) {
//         // CHANGED: columns use columnName per schema
//         const cols = (columns.length ? columns : ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'])
//           .map(c => ({ columnName: c, tasks: [] }))
//         holder.boards.push({ boardName: title, columns: cols, projectId })
//         await holder.save()
//         board = holder.boards.find(
//           b => String(b.projectId) === String(projectId) && b.boardName === title
//         )
//       }

//       await publishEvent(ch, eventsEx, 'board.created', {
//         correlationId,
//         payload: { boardId: String(board._id), title, projectId, projectTitle: projectTitle || project.title }
//       })
//     } catch (e) {
//       console.error('board.create error', e.message)
//       try {
//         const body = JSON.parse(bodyStr)
//         await publishEvent(ch, eventsEx, 'board.create.failed', {
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
// import Project from '../models/project.js'
// import { publishEvent } from '../utils/publisher.js'

// export async function startBoardConsumer(amqpUrl, commandsEx = 'bitboard.commands', eventsEx = 'bitboard.events') {
//   const conn = await amqplib.connect(amqpUrl)
//   const ch = await conn.createChannel()
//   await ch.assertExchange(commandsEx, 'topic', { durable: true })
//   await ch.assertExchange(eventsEx, 'topic', { durable: true })
//   const q = await ch.assertQueue('workspace.board.commands', { durable: true })
//   await ch.bindQueue(q.queue, commandsEx, 'board.create.request')

//   await ch.consume(q.queue, async (msg) => {
//     if (!msg) return
//     try {
//       const body = JSON.parse(msg.content.toString())
//       const { correlationId, payload } = body
//       const { workspaceId, projectId, title, columns } = payload

//       const project = await Project.findOne({ _id: projectId, workspace: workspaceId })
//       if (!project) throw new Error('project_not_found')

//       let pb = await ProjectBoards.findOne({ projectId })
//       if (!pb) pb = await ProjectBoards.create({ projectId, boards: [] })

//       const exists = pb.boards.find(b => b.title === title)
//       if (exists) {
//         await publishEvent(ch, eventsEx, 'board.created', { correlationId, payload: { boardId: exists._id.toString(), title, projectId, projectTitle: project.title } })
//         ch.ack(msg)
//         return
//       }

//       const newBoard = { title, columns: (columns && columns.length ? columns : ['Backlog','Todo','In Progress','Review','Done']).map(name => ({ name, tasks: [] })) }
//       pb.boards.push(newBoard)
//       await pb.save()
//       const savedBoard = pb.boards[pb.boards.length - 1]

//       await publishEvent(ch, eventsEx, 'board.created', { correlationId, payload: { boardId: savedBoard._id.toString(), title, projectId, projectTitle: project.title } })
//       ch.ack(msg)
//     } catch (e) {
//       try {
//         const body = JSON.parse(msg.content.toString())
//         await publishEvent(ch, eventsEx, 'board.create.failed', { correlationId: body.correlationId, payload: { reason: e.message } })
//       } catch {}
//       ch.ack(msg)
//     }
//   })
// }
