import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { makeHttp } from './routes/index.js'
import { connectMQ, subscribeEvents, exchanges } from './rabbitmq/mq.js'
import { bindPublisher } from './orchestrator/orchestrator.js'
import { setupServer, connectDB, commonMiddleware } from '../../sharedConfig.js';
import { bindTaskAgentPublisher } from './LangGraph/taskAgentsGraph.js'
import { bindTaskOrchestrator, subscribeTaskEvents } from './orchestrator/taskOrchestrator.js'

async function main() {
  
  const port = parseInt(process.env.PORT_AI_PLANNER_SERVICE || '5004', 10)
  const corsOrigin = (process.env.CORS_ORIGIN || '').split(',').filter(Boolean)

  const app = setupServer();
  connectDB().catch(err => {
    console.error("DB Connection Error:", err);
    process.exit(1);
  });

  const mq = await connectMQ(process.env.AMQP_URL)
  await exchanges.ensure(mq.channel, process.env.COMMANDS_EX, process.env.EVENTS_EX)

  bindPublisher(mq.channel, process.env.COMMANDS_EX)
  await subscribeEvents(mq.channel)

  bindTaskAgentPublisher(mq.channel, process.env.COMMANDS_EX)
  bindTaskOrchestrator(mq.channel, process.env.EVENTS_EX)
  await subscribeTaskEvents(mq.channel, process.env.EVENTS_EX)

  app.use(cors({ origin: corsOrigin.length ? corsOrigin : true, credentials: true }))
  // app.use(express.json({ limit: '1mb' }))

  makeHttp(app)

  commonMiddleware(app);
  app.listen(port, () => console.log(`ai-planner listening on ${port}`))
}

main().catch(err => {
  console.error('fatal', err)
  process.exit(1)
})














// // backend/services/authService/index.js
// import { setupServer, connectDB, commonMiddleware } from '../../sharedConfig.js';
// import routes from './routes/index.js';


// const app = setupServer();


// connectDB().catch(err => {
//   console.error("DB Connection Error:", err);
//   process.exit(1);
// });

// app.use("/api-ai", (req, res, next) => {
//   res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
//   res.set("Pragma", "no-cache");
//   res.set("Expires", "0");
//   res.set("Surrogate-Control", "no-store");
//   next();
// });


// app.use('/api-ai', routes);

// commonMiddleware(app);

// const PORT = process.env.PORT_Ai_Planner_SERVICE || 5004;
// app.listen(PORT, () => console.log(`Ai Planner Service on ${PORT}`));