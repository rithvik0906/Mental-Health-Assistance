import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { auth } from "./firebaseAdmin.js";
import { model } from "./gemini.js";

const app = express();

/* ================= MIDDLEWARE ================= */

// Allow requests from GitHub Pages (or allow all during dev)
app.use(
  cors({
    origin: "*", // 🔒 You can later restrict to your GitHub Pages URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

/* ================= HEALTH CHECK ================= */
// Render requires a working root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "✅ Backend is running on Render"
  });
});

/* ================= AI ROUTE ================= */
app.post("/api/ai", async (req, res) => {
  try {
    /* -------- AUTH -------- */
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    await auth.verifyIdToken(token);

    /* -------- VALIDATION -------- */
    const { problem, description, age } = req.body;

    if (!problem || !description) {
      return res.status(400).json({
        error: "Problem and description are required"
      });
    }

    /* -------- PROMPT -------- */
    const prompt = `
User Age: ${age || "Unknown"}
Problem: ${problem}
Description: ${description}

Provide empathetic, supportive mental health guidance.
Do NOT diagnose.
Encourage professional help if distress appears severe.
Keep the response concise and calming.
`;

    /* -------- GEMINI -------- */
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.status(200).json({ response: responseText });

  } catch (error) {
    console.error("❌ AI Error:", error);
    res.status(500).json({
      error: "Failed to process AI request"
    });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
