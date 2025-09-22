import express from "express";
import ai, { modelName } from "../lib/gemini.js";

const router = express.Router();

/** POST /api/chat/once  -> { text } */
router.post("/once", async (req, res) => {
  try {
    const { prompt = "", system } = req.body || {};
    const contents = system
      ? [{ role: "user", parts: [{ text: `${system}\n\n${prompt}` }]}]
      : [{ role: "user", parts: [{ text: prompt }]}];

    const resp = await ai.models.generateContent({
      model: modelName,
      contents,
    });

    res.json({ text: resp.text || "" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/chat/stream -> text/event-stream */
router.post("/stream", async (req, res) => {
  try {
    const { messages = [], system } = req.body || {};

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Map pesan frontend ke format contents SDK (role: 'user' | 'model')
    const contents = [
      ...(system ? [{ role: "user", parts: [{ text: system }]}] : []),
      ...messages.map(m => ({
        role: m.role === "assistant" ? "model" : m.role,
        parts: [{ text: m.content }],
      })),
    ];

    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents,
    });

    for await (const chunk of stream) {
      const text = chunk?.text || "";
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (e) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

export default router;
