import express from "express";
import client, { modelName } from "../lib/gemini.js";

const router = express.Router();

/**
 * POST /api/vision
 * body: { prompt: string, images: [{mimeType, dataBase64}] }
 */
router.post("/", async (req, res) => {
  try {
    const { prompt, images = [] } = req.body || {};
    const model = client.getGenerativeModel({ model: modelName });

    const parts = [
      { text: prompt || "Describe this image." },
      ...images.map(img => ({
        inlineData: { mimeType: img.mimeType, data: img.dataBase64 }
      })),
    ];

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    res.json({ text: result.response?.text() ?? "" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
