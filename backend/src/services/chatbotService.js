import { buildPrompt } from "../prompts/buildPrompt.js";
import { generateSQL } from "./sqlGenerator.js";
import { validateSQL } from "../utils/sqlValidator.js";
import { executeSQL } from "./queryExecutor.js";

export async function handleChatbotQuery(user, question) {

  const prompt = buildPrompt(user, question);

  const sql = await generateSQL(prompt, user);

  console.log("Generated SQL:", sql);

  if (sql.trim() === "ACCESS NOT ALLOWED") {
  return {
    success: false,
    message: "Access not allowed"
  };
  }

  validateSQL(sql);

  

  const result = await executeSQL(sql);
  console.log("Query Result:", result); 

  return {
    sql,
    result
  };
}