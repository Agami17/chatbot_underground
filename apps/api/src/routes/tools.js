import express from "express";
import client, { modelName } from "../lib/gemini.js";

const router = express.Router();

/**
 * POST /api/tools
 * contoh “function calling”: model diminta memanggil kalkulator kalau perlu
 */
router.post("/calc", async (req, res) => {
  try {
    const { question } = req.body || {};
    const model = client.getGenerativeModel({
      model: modelName,
      tools: [{
        functionDeclarations: [{
          name: "calc_sum",
          description: "Return sum of numbers",
          parameters: {
            type: "OBJECT",
            properties: { a: { type: "NUMBER" }, b: { type: "NUMBER" } },
            required: ["a","b"]
          }
        }]
      }]
    });

    // Mulai chat
    const chat = model.startChat();
    let result = await chat.sendMessage(question);

    // Jika model minta panggil fungsi:
    const call = result.response?.functionCalls?.[0];
    if (call?.name === "calc_sum") {
      const { a, b } = call.args || {};
      const sum = Number(a) + Number(b);
      // kirim hasil balik ke model
      result = await chat.sendMessage([{ functionResponse: { name: "calc_sum", response: { sum }}}]);
    }

    res.json({ text: result.response?.text() ?? "" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
