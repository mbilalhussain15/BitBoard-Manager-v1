import amqplib from 'amqplib'

let _ch = null
let _cmdEx = null

export async function connectMQ(url) {
  const conn = await amqplib.connect(url)
  const ch = await conn.createChannel()
  _ch = ch
  return { conn, channel: ch }
}

export const exchanges = {
  async ensure(ch, cmdEx, evtEx) {
    _cmdEx = cmdEx
    await ch.assertExchange(cmdEx, 'topic', { durable: true })
    await ch.assertExchange(evtEx, 'topic', { durable: true })
  }
}

export function getChannel() { return _ch }
export function getCmdExchange() { return _cmdEx }

export async function publishCmd(ch, ex, key, message) {
  ch.publish(ex, key, Buffer.from(JSON.stringify(message)), { persistent: true, contentType: 'application/json' })
}

export async function subscribeEvents(ch) {
  const evtEx = process.env.EVENTS_EX
  const q = await ch.assertQueue('', { exclusive: true })
  await ch.bindQueue(q.queue, evtEx, 'project.*')
  await ch.bindQueue(q.queue, evtEx, 'board.*')
  await ch.bindQueue(q.queue, evtEx, 'task.*')
  await ch.bindQueue(q.queue, evtEx, 'plan.commit.*')
  await ch.consume(q.queue, async msg => {
    try {
      const evt = JSON.parse(msg.content.toString())
      const mod = await import('../orchestrator/orchestrator.js')
      await mod.onEvent(evt)
    } finally {
      ch.ack(msg)
    }
  })
}
