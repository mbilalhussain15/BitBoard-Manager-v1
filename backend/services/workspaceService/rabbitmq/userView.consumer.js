import amqplib from "amqplib";
import UserView from "../models/user-view.js";

const EX = process.env.RABBITMQ_EXCHANGE || "user.events";
const Q  = process.env.RABBITMQ_WORKSPACE_QUEUE || "workspace.user_view";
const DLX = `${EX}.dlx`;
const DLQ = `${Q}.dlq`;

export async function startUserViewConsumer() {
  let conn, ch;

  async function connectAndConsume() {
    const url = process.env.RABBITMQ_URL || "amqp://localhost";
    conn = await amqplib.connect(url, { heartbeat: 30 });
    conn.on("error", (e) => console.error("RMQ conn error:", e?.message));
    conn.on("close", () => {
      console.error("RMQ conn closed, reconnecting in 2s...");
      setTimeout(connectAndConsume, 2000);
    });

    ch = await conn.createChannel();
    await ch.assertExchange(EX, "topic", { durable: true });

    // DLQ setup (simple)
    await ch.assertExchange(DLX, "fanout", { durable: true });
    await ch.assertQueue(DLQ, { durable: true });
    await ch.bindQueue(DLQ, DLX, "");

    await ch.assertQueue(Q, {
      durable: true,
      deadLetterExchange: DLX, // failed msgs go to DLQ
    });
    await ch.bindQueue(Q, EX, "user.*");

    await ch.prefetch(parseInt(process.env.RABBITMQ_PREFETCH || "50"), false);

    ch.consume(Q, onMessage, { noAck: false });
    console.log("✅ UserView consumer running");
  }

  async function onMessage(msg) {
    if (!msg) return;
    try {
      const rk = msg.fields.routingKey; // user.created/updated/deleted
      const { userId, name, email, profilePicture } = JSON.parse(msg.content.toString());

      if (rk === "user.created" || rk === "user.updated") {
        await UserView.findOneAndUpdate(
          { userId },
          { name, email, profilePicture, updatedAt: new Date() },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else if (rk === "user.deleted") {
        await UserView.deleteOne({ userId });
      }

      ch.ack(msg);
    } catch (e) {
      console.error("UserView consumer error:", e);
      // send to DLQ (no requeue loop)
      ch.nack(msg, false, false);
    }
  }

  await connectAndConsume();
}
