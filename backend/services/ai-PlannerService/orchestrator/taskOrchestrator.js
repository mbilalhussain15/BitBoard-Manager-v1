// ai-PlannerService/orchestrator/taskOrchestrator.js
// dedicated orchestrator for Task Agent flows
// keeps transient status by correlationId

const state = new Map()
// shape state.set(correlationId, { type, at, payload })

export function bindTaskOrchestrator(channel, eventsExchange) {
  // nothing to bind yet, but we keep signature similar to others
  return { channel, eventsExchange }
}

export async function subscribeTaskEvents(channel, eventsExchange) {
  await channel.assertExchange(eventsExchange, 'topic', { durable: true })
  const q = await channel.assertQueue('task-orchestrator.q', { durable: true })
  const keys = ['task.bulkcreated', 'task.autodescribed', 'task.improved', 'task.agent.failed']
  for (const key of keys) {
    await channel.bindQueue(q.queue, eventsExchange, key)
  }

  channel.consume(q.queue, msg => {
    if (!msg) return
    try {
      const rk = msg.fields.routingKey
      const evt = JSON.parse(msg.content.toString())
      const { correlationId, payload } = evt || {}
      if (correlationId) {
        state.set(correlationId, { type: rk, at: new Date().toISOString(), payload })
        // optional expiry cleanup
        setTimeout(() => state.delete(correlationId), 10 * 60 * 1000)
      }
    } catch (e) {
      console.error('taskOrchestrator consume error', e)
    } finally {
      channel.ack(msg)
    }
  })
}

export function getTaskStatus(correlationId) {
  return state.get(correlationId) || null
}
