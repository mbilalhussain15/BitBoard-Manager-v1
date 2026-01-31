import amqplib from "amqplib";

const EXCHANGE = process.env.RABBITMQ_EXCHANGE || "user.events";
let conn, channel;

export async function initRabbit() {
  const url = process.env.RABBITMQ_URL || "amqp://localhost";
  conn = await amqplib.connect(url, { heartbeat: 30 });
  conn.on("close", () => console.error("RMQ conn closed"));
  conn.on("error", (e) => console.error("RMQ conn error:", e?.message));

  channel = await conn.createConfirmChannel();           // ← confirm channel
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  console.log("✅ RabbitMQ publisher ready");
}

export async function publishUser(routingKey, payload) {
  if (!channel) throw new Error("RMQ channel not ready");
  channel.publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true, contentType: "application/json" }
  );
  await channel.waitForConfirms();                       // ← publish durability
}
