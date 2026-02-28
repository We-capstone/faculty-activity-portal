import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY;

const groq = groqApiKey
  ? new Groq({
      apiKey: groqApiKey,
    })
  : null;

export async function generateSQL(prompt, user) {
  if (!groq) {
    throw new Error("GROQ_API_KEY is missing. Set it in backend/.env.");
  }

  const systemPrompt = `
You are an AI system that converts natural language into SAFE PostgreSQL SELECT queries.

=====================
DATABASE SCHEMA
=====================

profiles(id, full_name, role, designation, department)

journal_publications(journal_id, profile_id, title, journal_name, publication_date, journal_quartile)

conference_publications(conference_id, profile_id, title, conference_name, conference_date)

patents(patent_id, profile_id, patent_title, patent_status, filed_date, granted_date)

research_funding(funding_id, profile_id, project_title, funding_agency, amount, start_date, end_date)

=====================
ACCESS CONTROL
=====================

USER ROLE: ${user.role}
USER ID: ${user.id}
USER DEPARTMENT: ${user.department}

FACULTY CAN ACCESS ONLY:

- Their own records
- Their department data

ADMIN can access everything.

=====================
SECURITY RULES
=====================

1. ONLY generate ONE SQL SELECT query
2. NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE
3. ALWAYS join with profiles when filtering
4. FACULTY queries MUST include:

(
 profiles.id = '${user.id}'
 OR profiles.department = '${user.department}'
)

=====================
DENIAL RULE
=====================

If FACULTY asks for institute-wide data
or other faculty data outside their department

Return exactly:

ACCESS NOT ALLOWED

(No SQL)

=====================
OUTPUT RULE
=====================

If allowed → return SQL
If not → return ACCESS NOT ALLOWED

No explanation.
No markdown.
No semicolon.
`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0
  });

  return completion.choices[0].message.content
    .replace(/```sql|```/g, '')
    .replace(/;/g, '')
    .trim();
}
