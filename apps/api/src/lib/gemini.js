import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

export const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Inisialisasi client SDK baru
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default ai;
