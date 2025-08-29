import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat.js";

const app = express();

app.use(cors({
    origin: "*"
}));

app.use(express.json());

app.use("/api/chat", chatRouter);

export default app;