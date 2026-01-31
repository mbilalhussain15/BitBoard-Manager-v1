import { setupServer, connectDB, commonMiddleware } from '../../sharedConfig.js';
import routes from './routes/index.js';

const app = setupServer();


await connectDB().catch(err => {
  console.error("DB Connection Error:", err);
  process.exit(1);
});

app.use("/api-v1", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

app.get('/', (req, res) => {
  res.json({ message: "Comment Service is Running" });
});

app.use('/api-v1', routes);

commonMiddleware(app);

const PORT = process.env.PORT_COMMENT_SERVICE || 5003;
app.listen(PORT, () => console.log(`Comment Service on ${PORT}`));

