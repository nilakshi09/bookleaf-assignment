# Project Write-Up — BookLeaf Support Hub

> **Design Philosophy**: The user interface is inspired by BookLeaf Publishing's official public website, incorporating their signature coral (`#F2687A`), soft blush (`#FFF5F6`), and ink (`#1B1E26`) palette. It presents a clean, modern publishing experience with clear visual hierarchy, accessible typography, and intuitive two-way communication.

---

### 1. What I Prioritised

- **Sub-Second Ticket Creation & Non-Blocking Asynchronous Triage**:  
  Authors should never sit waiting for an LLM API to respond before receiving ticket confirmation. When an author submits a query, the server immediately persists it with defaults and returns an HTTP 201 response in under 100ms. AI classification and initial draft generation run in a detached background worker and push updates live via Socket.IO.

- **Policy-Grounded AI with Race-Condition Safety**:  
  Instead of generating generic boilerplate, the AI drafts are grounded in BookLeaf's actual publishing policies and the author's live book data (sales figures, unpaid royalties, publishing milestones). To prevent race conditions where a late background draft overwrites an active conversation, drafts are saved using conditional atomic updates (`$size` and `status` checks) — any stale draft is safely discarded. Additionally, previewing an alternate status in the admin UI creates an in-memory prompt copy and never mutates the saved ticket in the database.

- **System Resilience & Dual-Layer Fallbacks**:  
  AI APIs can experience transient slowdowns, regional queuing, or free-tier rate limits. All LLM operations are guarded by a 12-second timeout. If Gemini is unavailable, an intelligent rule-based heuristic classifies the ticket with `aiStatus: 'failed'`, and the admin interface displays a transparent note explaining that rules were used and prompting review.

- **Hardened Real-Time WebSocket Security**:  
  Socket connections authenticate via JWT during the WebSocket handshake (`io.use`). Rooms are assigned strictly by the server (`userId` and `'admins'`), completely eliminating client-side room tampering. Private internal notes, AI drafts, and internal flags are scrubbed before reaching authors, and administrative events (`ticket:classified`, `ticket:read`) are emitted exclusively to the `admins` room.

- **Defensive Input Validation & Proxy Trust**:  
  Query filters (`status`, `category`, `priority`) are strictly whitelisted against valid values, date filters are validated and parsed to Indian Standard Time (IST, UTC+5:30) boundaries, and Express is configured with `app.set('trust proxy', 1)` so rate limiters identify real client IPs behind cloud reverse proxies like Render.

---

### 2. Trade-Offs I Made

- **Atomic Conditional Updates vs. Heavyweight Distributed Locks**:  
  To solve the background draft race condition, I used MongoDB's native atomic `findOneAndUpdate` with `{ status: startStatus, replies: { $size: startReplyCount } }`. This discarded stale drafts cleanly in a single database operation without introducing Redis, Redlock, or message queue brokers, keeping the application simple, explainable, and dependency-free.

- **Embedded Subdocuments for Replies & Internal Notes**:  
  Replies and internal notes are stored directly inside the `Ticket` document in MongoDB. This guarantees atomic updates, simplifies data management, and avoids multi-table joins. For an enterprise handling thousands of replies per ticket, migrating message bodies to a separate collection would be the next step.

- **Lightweight Document-Level Read Badges**:  
  I used simple `unreadByAdmin` and `unreadByAuthor` flags on the ticket itself rather than a complex per-admin read receipts table. This keeps the data model lean and perfectly serves a focused support team.

- **Handshake-Level Socket Authentication**:  
  Instead of allowing clients to send custom "join" messages, authentication happens once during the WebSocket handshake using the verified JWT. This prevents any author from joining administrative broadcast channels.

- **Gemini Flash-Lite Model**:  
  I chose Google Gemini Flash-Lite because it provides high instruction-following adherence, rapid response times, and near-zero operational costs for customer support triage.

---

### 3. How I'd Evolve This in Production

- **Dedicated Message Queue for Background AI**:  
  Under heavy concurrent load, queueing classification and draft generation tasks in a Redis-backed worker (such as BullMQ) would provide retries with exponential backoff and fine-grained concurrency control.

- **Personalized Per-Admin Read Receipts**:  
  Track `lastReadAt` timestamps per admin user ID to offer personalized unread indicators in larger support organizations.

- **Cloud Image & File Storage (AWS S3 / Cloudinary)**:  
  Connect presigned upload URLs so authors reporting printing or binding defects can upload high-resolution photos of damaged copies directly to S3.

- **Instant FAQ & Self-Help Suggestions**:  
  As authors type their ticket subject, display instant answers from BookLeaf's knowledge base to resolve common queries without submitting a ticket.

- **Author Satisfaction Rating (CSAT)**:  
  Upon ticket resolution, invite authors to rate their support experience (1–5 stars) with quick feedback tags to measure service quality over time.

- **Omnichannel Email & SMS Notifications**:  
  Integrate transactional email providers (e.g. Resend or SendGrid) to notify authors when an admin posts a reply, with magic links straight into the ticket conversation.
