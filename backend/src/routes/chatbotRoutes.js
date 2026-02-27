import express from "express";
import { handleChatbotQuery } from "../services/chatbotService.js";
import { chatbotAuth } from "../middleware/chatbotAuth.js";

const router = express.Router();

router.post("/ask", chatbotAuth, async (req, res) => {
  try {
    if (!req.body.question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log("User:", req.user);
    console.log("Question:", req.body.question);

    const response = await handleChatbotQuery(req.user, req.body.question);

    console.log("Response to frontend:", response);
    res.json(response);

  } catch (err) {
    console.error("Error in /ask route:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;