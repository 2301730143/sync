# SyncMind AI — AI Project Coordinator

Turn unstructured team conversations (WhatsApp, Discord, Slack, Teams, or plain
notes) into a structured project workspace: tasks, owners, deadlines,
priorities, decisions, a Kanban board, a timeline, workload analytics, and
AI-generated risk insights.

Built for college teams, hackathon squads, final-year project groups, and
small dev/startup teams who already decided who's doing what — it's just
buried in a chat thread.

---

## 1. Architecture

This is a **real microservices split**, not a monolith in disguise — two
independently-runnable backend services, each with its own database schema,
own `package.json`, own port, and no direct DB coupling between them.

```
                         React Frontend (frontend/)
                                    │
                ┌───────────────────┴───────────────────┐
                │                                        │
                ▼                                        ▼
        Login / Register                     Upload Conversation / Kanban
                │                                        │
                ▼                                        ▼
   Authentication Service (MS1)                Project & AI Service
   backend/auth-service — :5001                backend/project-service — :5002
                │                                        │
                ▼                                        ▼
       PostgreSQL/SQLite                        PostgreSQL/SQLite
        (Users table)                    (Projects, Tasks, Conversations,
                                           Insights, Notifications, ...)
                                                          │
                                                          ▼
                                                    Gemini API
```

**How the two services talk to each other: they mostly don't.**
- `auth-service` issues a JWT on register/login containing `{ sub, name, email }`.
- `project-service` verifies that JWT **locally** using a shared `JWT_SECRET`
  — no network call back to auth-service on every request. It trusts the
  `name`/`email` claims (e.g. to add a project creator as the first
  `ProjectMember` without a lookup).
- `project-service` keeps its own **denormalized copy** of member names/emails
  on `ProjectMember` (set when a member is added) so it can send
  notifications without querying a `Users` table it doesn't own.

This is the standard JWT-based microservice boundary: loose coupling, no
shared database, one shared secret. The tradeoff (documented in code
comments) is that if a user renames their account, already-issued JWTs and
already-added `ProjectMember` rows keep the old name until token refresh /
manual re-add — acceptable for this MVP's scope.

### Full working flow
```
Register/Login → Create Project → Add Team → Import Conversation
→ AI Analyze → Review & Edit Extracted Tasks → Confirm
→ Tasks Generated → Kanban → Timeline → Workload Analytics → AI Insights
```

---

## 2. Folder structure

```
syncmind-ai/
├── frontend/                        # React + Vite
│   ├── src/
│   │   ├── components/              common/ dashboard/ kanban/ tasks/
│   │   ├── pages/                   Landing, Login, Register, Dashboard,
│   │   │                            ProjectOverview, Kanban, Tasks, Timeline,
│   │   │                            Team, Insights, Conversations, Settings
│   │   ├── layouts/                 AppLayout, AuthLayout, ProjectLayout
│   │   ├── context/                 AuthContext, ProjectContext
│   │   ├── services/                api.js (single axios client — see below),
│   │   │                            authService, projectService
│   │   └── utils/                   format.js, taskMeta.js
│   └── vite.config.js               dev proxy: routes /api/auth/* → :5001,
│                                     everything else under /api/* → :5002
│
└── backend/
    ├── auth-service/                 MS1 — Authentication Microservice
    │   ├── prisma/schema.prisma      owns User ONLY
    │   └── src/
    │       ├── controllers/           authController (register/login/profile)
    │       ├── routes/                 authRoutes
    │       └── middleware/            requireAuth (issues + verifies JWTs)
    │
    └── project-service/              Project & AI Service
        ├── prisma/schema.prisma       Project, ProjectMember, Conversation,
        │                              AIAnalysis, Task, TaskDependency,
        │                              Decision, AIInsight, Notification,
        │                              ActivityLog — NO User model
        └── src/
            ├── controllers/           project, member, conversation, ai,
            │                          task, insight, notification
            ├── services/               geminiService (AI + mock mode),
            │                           conversationParser (AI → DB),
            │                           projectInsightService (rule engine),
            │                           workloadAnalyzer, emailService,
            │                           notificationService
            └── middleware/            requireAuth (verifies JWT locally,
                                        no call back to auth-service)
```

---

## 3. Tech stack

| Layer      | Choice |
|------------|--------|
| Frontend   | React 18, Vite, Tailwind CSS, React Router, Axios, `@hello-pangea/dnd`, FullCalendar, Recharts, `react-hot-toast` |
| Backend    | Node.js, Express, REST — **two independent services** |
| Database   | SQLite (dev) / PostgreSQL via Supabase (prod), Prisma ORM — separate schema per service |
| AI         | Google Gemini API (`@google/generative-ai`), with mock fallback |
| Auth       | JWT (`jsonwebtoken`), verified locally by both services off one shared secret; `bcryptjs` password hashing (auth-service only) |
| Email      | Nodemailer (SMTP), with console-log mock fallback |
| Validation | Zod on every request body and every AI response |

---

## 4. Getting started

### Prerequisites
- Node.js 18+, npm

### 4.1 — Authentication service (MS1)
```bash
cd backend/auth-service
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed              # creates demo@syncmind.ai / password123
npm run dev                      # http://localhost:5001
```

### 4.2 — Project & AI service
```bash
cd backend/project-service
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed              # creates a demo project owned by the demo user above — run auth-service's seed FIRST
npm run dev                      # http://localhost:5002
```
**Important:** the two `JWT_SECRET` values in `backend/auth-service/.env` and
`backend/project-service/.env` **must be identical** — that shared secret is
the entire trust boundary between the two services. `.env.example` in both
folders has a comment reminding you of this.

### 4.3 — Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                      # http://localhost:5173
```
Vite proxies `/api/auth/*` → `:5001` and everything else under `/api/*` →
`:5002` in dev (see `frontend/vite.config.js`), so the frontend talks to one
`/api` path and never needs to know which service actually handles which
route.

### Run all three
Three terminals: `auth-service`, `project-service`, `frontend`, each with
`npm run dev`. Then open http://localhost:5173.

---

## 5. Database setup (SQLite → Supabase)

Both services default to **SQLite** for zero-setup local dev — each with its
own schema, each pointed at its own `dev.db` file (or the same Postgres
instance in production, using **separate schemas/tables** — services never
share tables, only the same physical Postgres server if you choose to run
them there for convenience).

To move either service to Supabase Postgres:
1. In that service's `prisma/schema.prisma`, change `provider = "sqlite"` to
   `provider = "postgresql"`.
2. Set `DATABASE_URL` in that service's `.env` to your Supabase connection string.
3. Run `npx prisma migrate deploy` (or `migrate dev` in development).

No model changes are required — every field type used is compatible with
both providers. Do this independently for each service; they don't need to
share a database, and in a real deployment usually shouldn't.

---

## 6. Gemini AI setup

Set in `backend/project-service/.env` only (auth-service never touches AI):
```
GEMINI_API_KEY=your-key-from-https://aistudio.google.com/apikey
```
Restart project-service. `GET http://localhost:5002/health` reports
`aiMockMode: false` once a key is active.

**Without a key**, conversation import and the full review → confirm →
Kanban flow all work end-to-end using clearly-labeled sample extraction data.

**Prompt injection defense**: the Gemini system instruction explicitly states
that imported conversation text is untrusted data, never instructions, and
every AI response is parsed and validated against a Zod schema before
anything touches the database.

---

## 7. Email notification setup

Set in `backend/project-service/.env`:
```
SMTP_HOST=... SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... EMAIL_FROM="SyncMind AI <notifications@syncmind.ai>"
```
Any standard SMTP provider works (Gmail App Password, SendGrid, Mailgun,
Resend's SMTP endpoint, Amazon SES). Without `SMTP_HOST` set, emails are
logged to the project-service console instead of sent.

Notifications fire for: AI-generated tasks ready for review, a new team
member joining, and project health dropping to `NEEDS_ATTENTION`/`AT_RISK`
(debounced — only sent when health actually worsens). **Known limitation of
the service split:** the per-account "email notifications off" toggle (in
Settings) is stored on `User` in auth-service, but project-service — which
actually sends the emails — has no access to that table. Right now
project-service emails everyone with an email on file regardless of that
toggle. Closing this gap cleanly needs either (a) a small internal
auth-service endpoint project-service can call to check the flag, or (b)
denormalizing the preference onto `ProjectMember` the same way name/email
already are. Neither is implemented yet — flagged here rather than silently
ignored.

---

## 8. Development commands

Run inside **each** service folder (`backend/auth-service`,
`backend/project-service`) and `frontend` respectively:
```bash
npm run dev              # nodemon (backend) / vite (frontend)
npm start                 # production start (backend)
npm run build              # frontend production build
npm run prisma:generate    # backend only
npm run prisma:migrate     # backend only
npm run prisma:studio      # backend only — visual DB browser
npm run prisma:seed        # backend only
npm test                   # Jest + Supertest (backend)
npm run lint                # frontend only
```

---

## 9. Production builds — verified in this environment

- `npm install` — clean, all three packages (auth-service, project-service, frontend)
- Full Vite production build — **zero errors**
- Both backend services syntax-checked file-by-file — **clean**
- `npx prisma generate` could **not** be run in the sandbox this was built in
  — it downloads its query-engine binary from `binaries.prisma.sh`, which
  that sandbox's network allowlist doesn't include. Run it as your first
  local step in both `auth-service` and `project-service` (§4) and everything
  downstream works.

---

## 10. Deployment

- **Frontend → Vercel.** Since the frontend now talks to two backend hosts in
  production, add rewrites in `vercel.json`:
  ```json
  {
    "rewrites": [
      { "source": "/api/auth/:path*", "destination": "https://your-auth-service.onrender.com/:path*" },
      { "source": "/api/:path*", "destination": "https://your-project-service.onrender.com/:path*" }
    ]
  }
  ```
- **auth-service → Render.** Build: `npm install && npx prisma generate`. Start: `npm start`.
- **project-service → Render.** Same build/start. Make sure `JWT_SECRET`
  matches auth-service's exactly.
- **Database → Supabase**, one instance is fine for both services (§5) — just
  keep their tables logically separate (they already are, by schema design).

---

## 11. Security basics implemented

- Passwords hashed with bcrypt (cost factor 12) in auth-service only — project-service never sees a password
- JWT verified independently by each service off one shared secret; auth-service re-validates against its own DB on `/profile`, project-service trusts the signed claims (documented tradeoff, §1)
- `helmet` secure headers, `cors` locked to `CLIENT_URL`, gzip `compression` — both services
- Rate limiting: general API, stricter on auth-service's register/login, stricter still on AI analysis
- Every request body validated with Zod before touching either database
- Centralized error handler in both services: no stack traces, DB errors, or API keys ever reach the client in production
- Imported conversation text is capped in size and always treated as data, never instructions, by the AI layer
- Removing a member unassigns their tasks rather than cascading a destructive delete

---

## 12. Known MVP limitations

- Per-user "email notifications off" preference isn't enforced by project-service — see §7
- Push notifications are out of scope; email + in-app notifications are implemented
- `.txt` and pasted text are the supported import formats
- Adding a member by email doesn't auto-link them to an existing account (that lookup would require a network call to auth-service, deliberately not implemented for MVP scope — see `memberController.js` comment)
- No real-time multiplayer sync (Kanban updates via REST, not websockets)
- `npx prisma generate` / `migrate` were not run inside the build sandbox (§9) — run them as your first local step, once per service

---

## 13. Quick start (copy/paste, three terminals)

```bash
# Terminal 1 — auth-service
cd backend/auth-service
cp .env.example .env
npm install && npx prisma generate && npx prisma migrate dev --name init
npm run prisma:seed
npm run dev

# Terminal 2 — project-service (run AFTER auth-service's seed)
cd backend/project-service
cp .env.example .env
npm install && npx prisma generate && npx prisma migrate dev --name init
npm run prisma:seed
npm run dev

# Terminal 3 — frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```
Then open http://localhost:5173 and log in with `demo@syncmind.ai` /
`password123`, or register a new account.
