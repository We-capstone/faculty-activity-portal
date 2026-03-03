# Faculty Activity Portal

Role-based portal for managing faculty research activities with analytics and admin insights.

## Features

### Faculty
- Login/signup with role-based redirect
- Add and manage activities: journals, conferences, patents, research funding
- View personal dashboard and recent activity summary
- Faculty analytics (department trends, activity mix)
- In-app AI assistant chatbot

### Admin
- Institution dashboard (faculty count, submissions, departments, modules)
- Faculty search with achievement breakdown
- Department analytics (volume, trend, heatmap)
- In-app AI assistant chatbot

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database/Auth/Storage: Supabase
- AI assistant: Groq + SQL guardrails

## Architecture
- `frontend/` -> React UI
- `backend/` -> REST APIs, auth middleware, analytics/chatbot services
- Supabase -> Auth + Postgres + Storage

## Prerequisites
- Node.js 18+
- npm
- Supabase project

## Environment Variables

### Backend (`backend/.env`)
- `PORT=5000`
- `SUPABASE_URL=...`
- `SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `GROQ_API_KEY=...`

### Frontend (`frontend/.env`) (optional)
- `VITE_API_BASE_URL=http://localhost:5000`
- `VITE_API_PREFIX=/api`

## Local Setup

```bash
# backend
cd backend
npm install
npm run dev

# frontend
cd frontend
npm install
npm run dev


Frontend: http://localhost:5173
Backend: http://localhost:5000

Key API Routes
POST /api/faculty/:module
GET /api/faculty/:module
DELETE /api/faculty/:module/:id
GET /api/analytics/stats
GET /api/admin/faculty-achievements
POST /api/chatbot/ask

 ```
## Team
- Ashlesha
- Richa
- Sanika
- Aarya
- Keerthana
