# BookLeaf Support Hub — Author Support & Communication Portal

A full-stack author support and ticket triage platform built for BookLeaf Publishing. Features non-blocking ticket creation with background AI triage, real-time bidirectional WebSocket synchronization, automated category classification, and policy-grounded reply drafting powered by Google Gemini.

> **UI Inspiration**: Styled after BookLeaf Publishing's official public website — coral (`#F2687A`), blush (`#FFF5F6`), and ink (`#1B1E26`) palette with modern card layouts, high-contrast status pills, and accessible typography.

---

## Live Demo

| | URL |
|---|---|
| **Frontend** | https://bookleaf-assignment-one.vercel.app |
| **Backend API** | https://bookleaf-assignment-kasg.onrender.com |
| **Health check** | https://bookleaf-assignment-kasg.onrender.com/api/health |

> **Note**: The backend runs on Render's free tier. The first request after a period of inactivity can take **30–50 seconds** while the instance cold-starts.

### Test Credentials (from `server/seed.js`)

| Role | Name | Email | Password | Notable data |
|---|---|---|---|---|
| **Admin** | BookLeaf Admin | `admin@bookleaf.com` | `admin123` | Full queue access, ticket assignment |
| **Author** | Priya Sharma | `priya.sharma@email.com` | `author123` | 2 published books with royalties; has a missing-royalty ticket |
| **Author** | Rohit Kapoor | `rohit.kapoor@email.com` | `author123` | 2 published books; has an in-progress barcode ticket |
| **Author** | Sneha Kulkarni | `sneha.kulkarni@email.com` | `author123` | 2 published books + 1 book **in production** (null MRP, null publication date) |
| **Author** | Vikram Joshi | `vikram.joshi@email.com` | `author123` | 2 published books; has an Amazon availability ticket |
| **Author** | Kavita Deshmukh | `kavita.deshmukh@email.com` | `author123` | 1 published book + 1 book **in production** (Raising Roots, In Production – Typesetting, null MRP); pending royalty ₹850 **below the ₹1,000 threshold** |
| **Author** | Ananya Reddy | `ananya.reddy@email.com` | `author123` | 1 published book — **zero payout** history (lastPayoutDate: null, pendingRoyalty: ₹2,546) |

Additional authors in seed: Meera Nair, Arjun Malhotra, Farhan Sheikh, Diya Chatterjee (all use `author123`).

---

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Quick Start & Local Setup](#quick-start--local-setup)
3. [Environment Variables](#environment-variables)
4. [Seeded Data & Edge Cases](#seeded-data--edge-cases)
5. [Ticket Lifecycle & Non-Blocking Triage](#ticket-lifecycle--non-blocking-triage)
6. [AI Integration — Model Choice](#ai-integration--model-choice)
7. [AI Integration — Prompt Strategy](#ai-integration--prompt-strategy)
8. [AI Integration — Cost Management](#ai-integration--cost-management)
9. [AI Integration — Error Handling & Fallbacks](#ai-integration--error-handling--fallbacks)
10. [Security & Access Control](#security--access-control)
11. [Real-Time WebSocket Architecture](#real-time-websocket-architecture)
12. [REST API Documentation](#rest-api-documentation)
13. [Deployment Guide (Render & Vercel)](#deployment-guide-render--vercel)
14. [Known Limitations & Future Work](#known-limitations--future-work)

---

## Architecture Decisions

| Decision | Rationale | Trade-off |
|---|---|---|
| **MongoDB with embedded replies and internal notes** | Each ticket is a single document containing its `replies[]` and `internalNotes[]` arrays. Reads are atomic — one query returns the full conversation without cross-collection joins. | A ticket with a very large number of replies would grow the document toward the 16 MB BSON limit. For a publishing support desk this is not a concern; at higher volumes the arrays could be moved to separate collections. |
| **Socket.IO instead of polling** | Admins see new tickets, AI classification results, and replies the instant they happen, without the latency or wasted requests of interval polling. | Adds a persistent WebSocket connection per client. Acceptable for a support tool with a small concurrent user count; a high-scale system would add a Redis adapter for multi-process broadcast. |
| **Layered server structure** | `routes/ → middleware/ → controllers/ → services/ → models/` keeps concerns separated. AI logic lives entirely in `aiService.js`; the knowledge base in `knowledgeBase.js`; socket emission in `socketService.js`. Swapping the model or provider requires changes in a single file. | Adds indirection compared to flat handler files, but improves readability and testability. |
| **Server-assigned Socket.IO rooms** | On connection the server places the user in their personal room `userId` (and `'admins'` if admin). Clients never request room joins, preventing room spoofing. | — |
| **Non-blocking background AI triage** | The HTTP 201 response is returned to the author immediately with default category/priority. AI classification and draft generation run in a detached async IIFE. Updates are applied atomically so admin overrides are never clobbered. | If AI is fast, there is a brief moment where the admin sees default values before the classified values arrive via WebSocket. |
| **Document-level read flags** | Simple `unreadByAdmin` and `unreadByAuthor` booleans on the ticket keep the data model lean rather than a per-admin read-receipts table. | Does not support per-admin read status in multi-admin teams. |

---

## Quick Start & Local Setup

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local instance or MongoDB Atlas)

### 1. Backend

```bash
cd server

npm install

# Copy and fill in environment variables (see table below)
cp .env.example .env

# Seed the database (creates 1 admin, 10 authors, 18 books, 6 tickets)
npm run seed

# Start the server (port 5000 by default)
npm start        # or: npm run dev  (uses nodemon)
```

### 2. Frontend

```bash
cd client

npm install

cp .env.example .env

npm run dev      # Vite dev server on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | HTTP server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/bookleaf` |
| `JWT_SECRET` | **Required.** Secret used to sign and verify JWTs. The server will not start if this is unset. | `<random-strong-secret>` |
| `CLIENT_URL` | Allowed CORS origin for the frontend | `http://localhost:5173` |
| `GEMINI_API_KEY` | Google Gemini API key | `<your-gemini-api-key>` |
| `AI_MODEL` | Gemini model name | `gemini-2.0-flash-lite` |

### Client (`client/.env`)

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_URL` | Base URL for backend REST API | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Base URL for Socket.IO connection | `http://localhost:5000` |

---

## Seeded Data & Edge Cases

`npm run seed` reads from `server/data/bookleaf_sample_data.json` and creates:

| Entity | Count | Details |
|---|---|---|
| Users | 11 | 1 admin + 10 authors |
| Books | 18 | Across 10 authors; various statuses, royalty states, and platforms |
| Tickets | 6 | Across 6 categories; mixed statuses; 2 tickets have existing replies |

### Edge cases covered in seed data

| Case | Book / Author | What happens |
|---|---|---|
| **Book in production** (null MRP, null pub date) | *Midnight in Mysore* (Sneha Kulkarni) — `In Production - Cover Design`; *Raising Roots* (Kavita Deshmukh) — `In Production - Typesetting` | No sales data exists. MRP, `author_royalty_per_copy`, `publication_date`, and `print_partner` are all null. When the AI drafts a reply for ticket #5 (about Raising Roots), the prompt receives null/zero values. |
| **Zero payout history** | *Between Two Temples* (Ananya Reddy) — `lastPayoutDate: null`, `royalty_paid: 0`, `pendingRoyalty: 2546` | Pending amount (₹2,546) exceeds the ₹1,000 threshold. No payout has ever been issued. |
| **Pending royalty below ₹1,000 threshold** | *The Nagpur Notebooks* (Kavita Deshmukh) — `pendingRoyalty: 850` | Below the ₹1,000 minimum payout threshold defined in the knowledge base. Payout would roll over to the next quarter. |
| **Zero pending (fully paid out)** | *The Saffron Diaries* (Priya), *The Last Monsoon* (Vikram), *Cardamom & Chaos* (Meera), *Ghazal of the Forgotten* (Farhan) | `royalty_pending: 0` — all earned royalties have been disbursed. |
| **Ticket already resolved** | Ticket #6 (Diya Chatterjee, "Update book description on Amazon") — `status: 'Resolved'` | Has an admin reply and an author confirmation reply. Demonstrates the resolved state. |
| **Ticket in progress with reply and internal note** | Ticket #2 (Rohit Kapoor, "Barcode on paperback points to wrong title") — `status: 'In Progress'` | Has 1 admin reply and 1 internal note. Shows a mid-investigation ticket. |

> **Note**: The knowledge base (in `server/services/knowledgeBase.js`) states a **₹1,000 minimum payout threshold** and **quarterly payout schedule** (disbursed within 45 days after quarter end). These values are hardcoded policy text given to the AI for grounding, not enforced by application logic.

---

## Ticket Lifecycle & Non-Blocking Triage

1. **Immediate ticket creation**: When an author submits a ticket, the server persists it immediately with defaults (`category: 'General Inquiry'`, `priority: 'Medium'`, `aiStatus: 'pending'`) and returns an HTTP 201 response. The author never waits for the AI.

2. **Admin notification**: `emitTicketUpdated` pushes the new ticket to the `'admins'` room immediately.

3. **Detached background AI triage**: A detached async IIFE runs after the response is sent:
   - Calls `classifyTicket(subject, description)` to determine category and priority.
   - Applies the result via `findOneAndUpdate({ _id, aiStatus: 'pending' }, ...)` — this atomic guard ensures that if an admin manually overrides the category or priority in the meantime, the AI result is discarded.
   - Emits `ticket:classified` (admins only) and `ticket:updated` (admins + author).
   - Generates an initial AI draft via `draftReply()`, falling back to `generatePolicyFallbackDraft()`.
   - Saves the draft atomically only if `status` and `replies` count have not changed (`replies: { $size: startReplyCount }`), preventing a slow draft from overwriting an active conversation.

4. **Read indicators**: `unreadByAdmin` is set to `true` when an author creates a ticket or replies. It is reset to `false` when an admin opens the ticket. `unreadByAuthor` is set to `true` when an admin replies or changes status. It is reset to `false` when the author views the ticket. These flags synchronize across clients in real time via WebSocket.

---

## AI Integration — Model Choice

The application uses **Google Gemini `gemini-2.0-flash-lite`** (configurable via the `AI_MODEL` environment variable).

**Why this model:**
- Available on Google's free tier, which keeps demo cost at zero until the daily quota is reached.
- Completes background classification and draft generation within the 12-second timeout used in `aiService.js`.
- Supports `responseMimeType: 'application/json'` with `responseSchema` for structured classification output.
- The Gemini provider call is isolated in `server/services/aiService.js`, so switching to a different model or provider requires changes in only that file.

---

## AI Integration — Prompt Strategy

Drafting and classification prompts are built in `aiService.js`, with policy text and stage instructions coming from `knowledgeBase.js`.

- **Ticket payload isolation**: Classification and draft prompts place subject, description, and (for drafts) category, priority, and status inside `<ticket>` tags in the user prompt, separate from the system instruction. Rewrite prompts wrap the existing reply in `<reply>` tags and instruct the model to treat that content as text to edit, not as instructions.
- **JSON classification**: `classifyTicket` sets `responseMimeType: 'application/json'` and a `responseSchema` that constrains `category` and `priority` to the allowed enums. Output is then normalized against those lists.
- **Category-scoped knowledge**: `getKnowledgeForCategory` sends the company overview, tone policy, the matching category section, and one reference example for that category — not all six category sections.
- **Stage-aware drafting**: `getStageGuidance` selects instructions from ticket status (`Open`, `In Progress`, `Resolved`, `Closed`) and, when the last reply is from the author, uses author-follow-up guidance instead of a first-response or in-progress script.
- **Factual grounding**: When a book is attached, the draft prompt includes title, ISBN, status, publication date, copies sold, royalty earned/paid/pending, and platforms. The system instruction requires using only actual book and policy data and forbids inventing dates, amounts, or promises.
- **Tone**: The knowledge-base tone block tells the model to acknowledge the author's concern first, cite specific numbers and stages, own BookLeaf's mistakes without deflection, give an explicit timeline, and end with a clear next step.

---

## AI Integration — Cost Management

All AI calls go through `aiService.js`. Three distinct call types exist: classification, draft generation, and draft rewrite.

### Classification call (`classifyTicket`)

| What is sent | What is avoided |
|---|---|
| System instruction listing the 6 categories and 4 priorities with short descriptions (~200 words) | No knowledge base content — classification uses only the system instruction and ticket text |
| Ticket subject and description wrapped in `<ticket>` XML tags | No book details, no author data, no conversation history |
| `temperature: 0.1` for deterministic output | — |
| `maxOutputTokens: 1000` with `responseMimeType: 'application/json'` and `responseSchema` enum constraints | — |

### Draft reply call (`draftReply`)

| What is sent | What is avoided |
|---|---|
| **Category-scoped knowledge base**: company overview + tone policy + one matching category section + one reference example — not all 6 sections | The other 5 category sections |
| **Stage guidance** selected by ticket status and last reply direction (Open / In Progress / Author Replied / Resolved / Closed) | — |
| Ticket subject, description, category, priority, status | — |
| Author first and full name | No author email, phone, city, or account details |
| Book details when attached: title, ISBN, status, publication date, copies sold, royalty earned/paid/pending, platforms | No book data from other authors |
| Last 2 conversation replies for context | Older reply history beyond the last 2 |
| `temperature: 0.2`, `maxOutputTokens: 1000` | — |

### Draft rewrite call (`rewriteReply`)

| What is sent | What is avoided |
|---|---|
| The draft text to rewrite wrapped in `<reply>` XML tags | No ticket, book, or author context |
| One mode instruction (Polish / Shorter / More empathetic / More formal) | — |
| `temperature: 0.2`, `maxOutputTokens: 1000` | — |

### Other cost controls

- **12-second timeout** (`AI_TIMEOUT_MS = 12000` in `config/constants.js`): all AI calls are wrapped in `Promise.race` with a timeout rejection. Prevents hanging requests.
- **Draft storage vs regeneration**: the initial background draft is stored on the ticket as `aiDraft`. Manual draft generation (`POST /api/admin/tickets/:id/draft`) always calls Gemini again (or the policy fallback) rather than returning the stored draft. Previewing a different status still calls Gemini but does not write that preview onto the ticket.
- **Fallback avoids API calls entirely**: when classification fails, `classifyFallback` uses keyword/regex matching (no API call). When draft generation fails, `generatePolicyFallbackDraft` returns a deterministic policy-grounded template (no API call).
- **Rate limiting on AI endpoints**: `aiDraftLimiter` limits draft and rewrite requests to 60 per 15 minutes per IP, protecting against accidental API quota exhaustion.
- **AI calls skipped when no API key**: if `GEMINI_API_KEY` is unset, empty, or still the placeholder value, `getGeminiClient()` returns `null` and every AI call falls back immediately without making any network request.

---

## AI Integration — Error Handling & Fallbacks

### Timeout

Every AI call is wrapped in `withTimeout(promise, 12000)`. If the call does not resolve within 12 seconds, it rejects with `"AI request timed out after 12 seconds"`.

### Classification fallback (`classifyFallback`)

When `classifyTicket` fails for any reason (timeout, network error, Gemini quota exhaustion, empty response, JSON parse error), the function catches the error and calls `classifyFallback(subject, description)`:

- Scans subject + description with category-specific regex patterns and returns `{ category, priority, aiStatus: 'done' }`.
- The caller overrides `aiStatus` to `'failed'` so staff can see that the classification was rule-based.
- Priority is context-sensitive: e.g., a royalty ticket about "missing money" is classified as Critical, while a "how is royalty calculated" question is Medium.

### Draft fallback (`generatePolicyFallbackDraft`)

When `draftReply` fails, it returns a deterministic, category-specific policy-grounded template — no AI call. Templates are personalized with the author's first name and book title, include concrete next steps and timelines from the knowledge base, and vary by ticket status (Open, Resolved, Closed).

### `aiStatus` values on tickets

| Value | Meaning |
|---|---|
| `pending` | Ticket just created; background AI classification has not completed yet |
| `done` | AI classified the ticket (or fallback classification completed) and draft is ready |
| `failed` | AI was attempted but failed; keyword-based classification was used; the admin UI shows a notice prompting staff review |

**Tickets are always created regardless of AI availability.** The AI step never blocks ticket creation. When `aiStatus === 'failed'`, the admin dashboard can display a notice like: *"AI was unavailable, so this category and priority were set by rules. Please check them."* Admins can always reclassify tickets manually and write replies without AI assistance.

> **Note**: The Gemini free tier has daily request limits. When the quota is exhausted, all subsequent classification calls fall back to keyword matching and draft calls return the deterministic policy template. The `aiDraftLimiter` rate limiter (60 req / 15 min) also helps slow down usage before hitting the provider quota.

---

## Security & Access Control

1. **JWT Authentication**: Tokens are signed with `JWT_SECRET`, expire after 24 hours, and carry `{ id, role, name, email }`. The `verifyToken` middleware reads the token from the `Authorization: Bearer` header.

2. **Role-based access**: The `requireRole(['admin'])` middleware checks `req.user.role` and returns `403` otherwise. Applied at the router level to all admin routes.

3. **Ownership checks**: Author endpoints verify `author: req.user.id` in queries to prevent cross-author access. Violations return `404` (the ticket is treated as not found for that author).

4. **Socket.IO handshake auth**: The server verifies the JWT during the Socket.IO connection handshake (`io.use` middleware). Invalid or missing tokens cause the connection to be refused.

5. **Server-assigned rooms**: Rooms (`userId`, `'admins'`) are assigned by the server on connection. There is no client-initiated room join mechanism.

6. **Author data sanitization**: `sanitizeTicketForAuthor()` strips `internalNotes`, `aiDraft`, and `unreadByAdmin` from every ticket payload sent to an author — both via REST (`getMyTickets`, `createTicket`, `addAuthorReply`) and via WebSocket (`emitToAuthor`).

7. **Rate limiting**: `authLimiter` limits login attempts to 20 per 15 minutes. `aiDraftLimiter` limits AI draft/rewrite to 60 per 15 minutes. Both use `express-rate-limit` with `standardHeaders`.

8. **Reverse proxy trust**: `app.set('trust proxy', 1)` enables accurate client IP resolution behind cloud reverse proxies (Render) so rate limiters identify real client IPs.

9. **Input validation**: `validateLoginPayload` enforces string type checks on email and password to defend against MongoDB query selector injection. `validateQueueFilters` validates `status`, `category`, `priority`, and `date` against strict whitelists (`ALLOWED_STATUSES`, `ALLOWED_CATEGORIES`, `ALLOWED_PRIORITIES`) and parses date to IST (UTC+5:30) day boundaries. `validateTicketUpdate` validates status/category/priority against whitelists and verifies `assignedTo` is an active admin.

10. **Helmet**: `helmet()` middleware sets secure HTTP headers.

11. **Client-side token storage**: JWTs are stored in `localStorage` on the client. The Axios response interceptor clears the token, disconnects the socket, and redirects to `/login` on any `401` response (except login itself).

---

## Real-Time WebSocket Architecture

Socket.IO connections authenticate via the JWT token passed in `socket.handshake.auth.token`. On connection the server assigns rooms automatically: `socket.user.id.toString()` for every user, plus `'admins'` for admin-role users.

| Event Name | Target Room | Payload | Sanitized for author? |
|---|---|---|---|
| `ticket:updated` | `'admins'` | Full ticket (includes `internalNotes`, `aiDraft`, `unreadByAdmin`) | No |
| `ticket:updated` | `authorId` (personal room) | Ticket with `internalNotes`, `aiDraft`, `unreadByAdmin` removed | **Yes** |
| `ticket:classified` | `'admins'` only | Full ticket after AI classification | N/A — authors never receive |
| `ticket:read` | `'admins'` | `{ ticketId }` | N/A |
| `ticket:read` | `authorId` | `{ ticketId }` | N/A |

---

## REST API Documentation

All endpoints return JSON. Authentication is via `Authorization: Bearer <token>` header unless noted otherwise.

### Standard Error Response

```json
{
  "message": "Description of the error",
  "stack": "..."
}
```

The `stack` field is included **only** when `NODE_ENV === 'development'`.

Common error status codes: `400` (validation / bad request), `401` (not authenticated), `403` (forbidden / wrong role), `404` (not found), `429` (rate limited), `500` (server error).

### Health

| Method | Path | Auth | Description | Success |
|---|---|---|---|---|
| GET | `/health` | None | Public health check | `200 { status: "ok", timestamp }` |
| GET | `/api/health` | None | Public health check (aliased) | `200 { status: "ok", timestamp }` |

### Auth (`/api/auth`)

| Method | Path | Auth | Middleware | Request Body | Success | Errors |
|---|---|---|---|---|---|---|
| POST | `/api/auth/login` | None | `authLimiter`, `validateLoginPayload` | `{ email, password }` | `200 { token, user: { id, name, email, role, phone, city } }` | `400` invalid payload; `401` wrong credentials; `429` rate limited |
| GET | `/api/auth/me` | Bearer | `verifyToken` | — | `200 <User>` (password excluded) | `401`; `404` user not found |

### Author Endpoints (`/api`)

All routes require `verifyToken`.

| Method | Path | Middleware | Request Body / Params | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/books` | — | — | `200 [Book]` — author's own books, sorted by title | `401` |
| POST | `/api/tickets` | — | `{ subject, description, bookId? }` | `201 <sanitized Ticket>` — immediate response; AI triage runs in background | `400` missing fields or book not owned; `401` |
| GET | `/api/tickets/mine` | — | — | `200 [sanitized Ticket]` — author's own tickets, sorted by updatedAt desc | `401` |
| POST | `/api/tickets/:id/replies` | — | `{ message }` | `200 <sanitized Ticket>` — also triggers background AI draft refresh | `400` empty message or ticket closed; `404` |
| POST | `/api/tickets/:id/read` | — | — | `200 { message: 'ok' }` — sets `unreadByAuthor: false` | `401` |

### Admin Endpoints (`/api/admin`)

All routes require `verifyToken` + `requireRole(['admin'])`.

| Method | Path | Middleware | Request Body / Query | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/admin/tickets` | `validateQueueFilters` | `?status=&category=&priority=&assignedTo=&date=` | `200 [Ticket]` — sorted by urgency (Critical→High→Medium→Low), oldest first; Resolved/Closed at bottom | `400` invalid filter; `403` |
| GET | `/api/admin/tickets/:id` | — | `:id` | `200 <Ticket>` — full ticket with populated replies, notes, book, author, assignee | `403`; `404` |
| POST | `/api/admin/tickets/:id/read` | — | — | `200 { message: 'ok' }` — sets `unreadByAdmin: false`, emits `ticket:read` | `403` |
| PATCH | `/api/admin/tickets/:id` | `validateTicketUpdate` | `{ status?, category?, priority?, assignedTo? }` | `200 <Ticket>` — if status changes to `Closed`, auto-appends a closing reply | `400` invalid values; `403`; `404` |
| POST | `/api/admin/tickets/:id/draft` | `aiDraftLimiter` | `{ status? }` (optional status override for preview) | `200 { aiDraft, aiStatus }` — preview status generates draft in-memory without mutating DB ticket | `403`; `404`; `429` |
| POST | `/api/admin/tickets/:id/rewrite` | `aiDraftLimiter` | `{ text, mode }` — mode: `Polish`, `Shorter`, `More empathetic`, `More formal` | `200 { rewrittenText }` | `400` missing text/mode; `403`; `429` |
| POST | `/api/admin/tickets/:id/reply` | — | `{ message, markResolved?, markClosed? }` | `200 <Ticket>` — optionally changes status to Resolved or Closed | `400` empty message or ticket closed; `403`; `404` |
| POST | `/api/admin/tickets/:id/notes` | — | `{ text }` | `200 <Ticket>` — adds internal note (never visible to authors) | `400` empty text; `403`; `404` |

---

## Deployment Guide (Render & Vercel)

### 1. Database (MongoDB Atlas)

- Create a free-tier cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
- Under Network Access, whitelist `0.0.0.0/0` for cloud deployments.
- Copy the connection string.

### 2. Backend (Render)

1. Create a **Web Service** pointing to the `server/` directory.
2. **Build Command**: `npm install`
3. **Start Command**: `node index.js`
4. **Environment Variables**:

| Variable | Value |
|---|---|
| `PORT` | `5000` |
| `MONGODB_URI` | `<Atlas connection string>` |
| `JWT_SECRET` | `<strong random secret>` (**required**) |
| `GEMINI_API_KEY` | `<your Gemini API key>` |
| `AI_MODEL` | `gemini-2.0-flash-lite` |
| `CLIENT_URL` | `<your Vercel URL, no trailing slash>` |

### 3. Frontend (Vercel)

1. Import the repository on [Vercel](https://vercel.com). Set **Root Directory** to `client`.
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<your-render-backend>.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://<your-render-backend>.onrender.com` |

---

## Known Limitations & Future Work

1. **Gemini free-tier daily quota**: The free tier has a daily request limit. When exhausted, all AI calls fall back to keyword classification and deterministic draft templates until the quota resets. A paid API plan would remove this limit.

2. **Render free-tier cold start**: The backend sleeps after inactivity. The first request can take 30–50 seconds. A paid Render plan or a keep-alive cron job would eliminate this.

3. **No automated tests**: The repository contains no test files, test scripts, or testing dependencies. Adding unit tests for `aiService.js` (especially fallback logic and the atomic update guards) and integration tests for the API endpoints would be the immediate next step.

4. **No email notifications**: Authors are not notified by email when an admin replies or changes ticket status. Integrating a transactional email service (e.g., SendGrid or Resend) is a natural addition.

5. **No refresh-token flow**: JWTs expire after 24 hours with no refresh mechanism. The user is silently logged out on the next API call and redirected to the login page.

6. **JWT stored in `localStorage`**: Exposes the token to XSS attacks. An `httpOnly` cookie would be more secure.

7. **No registration endpoint**: The API only has login — accounts are seeded. A registration endpoint could be added if self-serve onboarding is needed.

8. **File attachments are schema-only**: The `Ticket` model does not include an `attachments` field, and there is no file upload endpoint or storage backend. The AI draft for printing quality tickets asks authors to "reply with 2-3 photos," but no file upload mechanism exists to fulfill this.

9. **Rewrite has no fallback**: Unlike `classifyTicket` and `draftReply`, the `rewriteReply` function throws an error when the Gemini client is unavailable or the response is empty — it does not fall back to returning the original text.
