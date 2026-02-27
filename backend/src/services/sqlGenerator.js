import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateSQL(prompt) {

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return response.text()
  .replace(/```sql|```/g, '')
  .replace(/;/g, '')   // <-- ADD THIS
  .trim();
}