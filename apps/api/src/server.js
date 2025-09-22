import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_, res) => res.send("OK"));
app.use("/api/chat", chatRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API server on http://localhost:${port}`));
