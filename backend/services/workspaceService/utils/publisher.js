// NEW: simple helper to publish events with logging
export async function publishEvent(ch, ex, type, message) {
  const evt = { type, ...message }
  ch.publish(ex, type, Buffer.from(JSON.stringify(evt)), {
    contentType: 'application/json',
    persistent: true
  })
  console.log('[events->%s] %s %s', ex, type, JSON.stringify(evt))
}
