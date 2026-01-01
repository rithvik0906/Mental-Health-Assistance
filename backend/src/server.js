import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

import { auth } from "./firebaseAdmin.js";
import { model } from "./gemini.js";

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== HEALTH CHECK (IMPORTANT FOR RENDER) =====
app.get("/", (req, res) => {
  res.json({ status: "✅ Backend is running" });
});

// ===== AI ROUTE =====
app.post("/api/ai", async (req, res) => {
  try {
    // ---- AUTH CHECK ----
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    // ---- INPUT VALIDATION ----
    const { problem, description, age } = req.body;

    if (!problem || !description) {
      return res.status(400).json({ error: "Problem and description required" });
    }

    // ---- PROMPT ----
    const prompt = `
User age: ${age || "Unknown"}
Problem: ${problem}
Description: ${description}

Give empathetic, safe, concise mental health guidance.
Do NOT diagnose.
If severe distress is implied, gently recommend professional help.
`;

    // ---- GEMINI CALL ----
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.json({ response: responseText });

  } catch (err) {
    console.error("❌ AI API error:", err);
    return res.status(500).json({ error: "AI processing failed" });
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Backend running on port ${PORT}`);
});
