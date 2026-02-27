import express from "express";
import { handleChatbotQuery } from "../services/chatbotService.js";
import { chatbotAuth } from "../middleware/chatbotAuth.js";

const router = express.Router();

router.post("/ask", chatbotAuth, async (req, res) => {
  try {
    const response = await handleChatbotQuery(req.user, req.body.question);
    res.json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;