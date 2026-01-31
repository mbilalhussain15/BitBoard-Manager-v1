import amqplib from 'amqplib'
import Project from '../models/project.js'
import Workspace from '../models/workspace.js'
import { publishEvent } from '../utils/publisher.js'
import { buildActorMember } from '../utils/actor.js';

export async function startProjectConsumer(
  amqpUrl,
  commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
  eventsEx = process.env.EVENTS_EX || 'bitboard.events'
) {
  const conn = await amqplib.connect(amqpUrl)
  const ch = await conn.createChannel()
  await ch.assertExchange(commandsEx, 'topic', { durable: true })
  await ch.assertExchange(eventsEx, 'topic', { durable: true })

  const q = await ch.assertQueue('project-commands.q', { durable: true })
  await ch.bindQueue(q.queue, commandsEx, 'project.create.request')

  ch.consume(q.queue, async msg => {
    try {
      const body = JSON.parse(msg.content.toString())

      // robust extraction from both places
      const topLevelCreatedBy = body.createdBy
      const payload = body.payload || {}
      const createdBy = payload.createdBy || topLevelCreatedBy|| payload.createdBy || payload.userId;

      const workspaceId = body.workspaceId || payload.workspaceId
      const title = payload.title
      const description = payload.description || ''
      

      if (!workspaceId) throw new Error('workspaceId missing')
      if (!createdBy) throw new Error('createdBy missing')
      if (!title) throw new Error('title missing')

      const ws = await Workspace.findById(workspaceId)
      if (!ws) throw new Error('workspace not found')

      const createdByUserId =
        body.createdBy ||
        payload.createdBy ||
        payload.userId ||
        topLevelCreatedBy


      const actorMember = await buildActorMember(createdByUserId, 'contributor');
      const inputMembers = Array.isArray(payload.members) ? payload.members : []
      const finalMembers = inputMembers.length ? inputMembers : (actorMember ? [actorMember] : [])
      const createdByUserViewId = actorMember ? actorMember.user : undefined

      const proj = await Project.create({
        title,
        description,
        workspace: workspaceId,
        members: finalMembers,
        createdBy: createdByUserViewId
      })

      await publishEvent(ch, eventsEx, 'project.created', {
        correlationId: body.correlationId,
        payload: { projectId: proj._id.toString(), title }
      })
    } catch (e) {
      try {
        const body = JSON.parse(msg.content.toString())
        await publishEvent(ch, eventsEx, 'project.create.failed', {
          correlationId: body.correlationId,
          payload: { reason: e.message }
        })
      } catch {}
    } finally {
      ch.ack(msg)
    }
  })
}

















// import amqplib from 'amqplib'
// import Project from '../models/project.js'
// import Workspace from '../models/workspace.js'
// import { publishEvent } from '../utils/publisher.js'

// export async function startProjectConsumer(
//   amqpUrl,
//   commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
//   eventsEx = process.env.EVENTS_EX || 'bitboard.events'
// ) {
//   const conn = await amqplib.connect(amqpUrl)
//   const ch = await conn.createChannel()

//   await ch.assertExchange(commandsEx, 'topic', { durable: true })
//   await ch.assertExchange(eventsEx, 'topic', { durable: true })

//   const q = await ch.assertQueue('project-commands.q', { durable: true })
//   await ch.bindQueue(q.queue, commandsEx, 'project.create.request')

//   ch.consume(q.queue, async msg => {
//     try {
//       const body = JSON.parse(msg.content.toString())
//       const { workspaceId } = body
//       const { title, description } = body.payload || {}

//       const ws = await Workspace.findById(workspaceId)
//       if (!ws) throw new Error('workspace not found')

//       const proj = await Project.create({ title, description, workspace: workspaceId, createdBy })
//       await publishEvent(ch, eventsEx, 'project.created', {
//         correlationId: body.correlationId,
//         payload: { projectId: proj._id.toString(), title }
//       })
//     } catch (e) {
//       try {
//         const body = JSON.parse(msg.content.toString())
//         await publishEvent(ch, eventsEx, 'project.create.failed', {
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
// import Project from '../models/project.js'
// import Workspace from '../models/workspace.js'
// import { publishEvent } from '../utils/publisher.js'

// export async function startProjectConsumer(
//   amqpUrl,
//   commandsEx = process.env.COMMANDS_EX || 'bitboard.commands',
//   eventsEx = process.env.EVENTS_EX || 'bitboard.events'
// ) {
//   const conn = await amqplib.connect(amqpUrl)
//   const ch = await conn.createChannel()
//   await ch.assertExchange(commandsEx, 'topic', { durable: true })
//   await ch.assertExchange(eventsEx, 'topic', { durable: true })

//   // NEW: dedicated queue for project commands
//   const q = await ch.assertQueue('workspace.project.commands', { durable: true })
//   await ch.bindQueue(q.queue, commandsEx, 'project.create.request')
//   console.log('[bind] workspace.project.commands ->', commandsEx, 'key=project.create.request')

//   await ch.consume(q.queue, async msg => {
//     if (!msg) return
//     const bodyStr = msg.content.toString()
//     console.log('[consume] project.create.request', bodyStr)
//     try {
//       const { correlationId, initiatorUserId, payload } = JSON.parse(bodyStr)
//       const { workspaceId, title, description } = payload

//       // NEW: idempotent by (workspaceId + title)
//       let project = await Project.findOne({ workspace: workspaceId, title })

//       if (!project) {
//         // CHANGED: resolve createdBy because schema requires it
//         let createdBy = initiatorUserId
//         if (!createdBy) {
//           const ws = await Workspace.findById(workspaceId).lean()
//           if (!ws) throw new Error('workspace_not_found')
//           createdBy = ws.owner // schema compatible
//         }

//         // CHANGED: do not set status here, schema has enum and default
//         project = await Project.create({
//           title,
//           description: description || '',
//           workspace: workspaceId,
//           createdBy
//         })
//       }

//       await publishEvent(ch, eventsEx, 'project.created', {
//         correlationId,
//         payload: { projectId: String(project._id), title, workspaceId }
//       })
//     } catch (e) {
//       console.error('project.create error', e.message)
//       try {
//         const body = JSON.parse(bodyStr)
//         await publishEvent(ch, eventsEx, 'project.create.failed', {
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
// import Project from '../models/project.js'   // path adjust to your repo
// import { publishEvent } from '../utils/publisher.js'

// export async function startProjectConsumer(amqpUrl, commandsEx = 'bitboard.commands', eventsEx = 'bitboard.events') {
//   const conn = await amqplib.connect(amqpUrl)
//   const ch = await conn.createChannel()
//   await ch.assertExchange(commandsEx, 'topic', { durable: true })
//   await ch.assertExchange(eventsEx, 'topic', { durable: true })
//   const q = await ch.assertQueue('workspace.project.commands', { durable: true })
//   await ch.bindQueue(q.queue, commandsEx, 'project.create.request')

//   await ch.consume(q.queue, async (msg) => {
//     if (!msg) return
//     try {
//       const body = JSON.parse(msg.content.toString())
//       const { correlationId, payload } = body
//       const { workspaceId, title, description } = payload

//       // optional idempotencyKey unique on workspace+title
//       const existing = await Project.findOne({ workspace: workspaceId, title })
//       if (existing) {
//         await publishEvent(ch, eventsEx, 'project.created', { correlationId, payload: { projectId: existing._id.toString(), title, workspaceId } })
//         ch.ack(msg)
//         return
//       }

//       const created = await Project.create(
//         { 
//           workspace: workspaceId, 
//           title, 
//           description: description || '', 
//           status: 'active' 
//         }
//       )
//       await publishEvent(ch, eventsEx, 'project.created', { correlationId, payload: { projectId: created._id.toString(), title, workspaceId } })
//       ch.ack(msg)
//     } catch (e) {
//       try {
//         const body = JSON.parse(msg.content.toString())
//         await publishEvent(ch, eventsEx, 'project.create.failed', { correlationId: body.correlationId, payload: { reason: e.message } })
//       } catch {}
//       ch.ack(msg)
//     }
//   })
// }
