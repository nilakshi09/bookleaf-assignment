# Project Write-Up — BookLeaf Support Hub

## What I prioritised

- **Authors never wait on the model.** Ticket create returns at once with default category and priority. Classification and the first draft run afterwards. Atomic updates on `aiStatus: 'pending'` and reply count stop a late Gemini result from overwriting an admin edit or a live thread.
- **Drafts stay inside policy and real book data.** The prompt gets one category section, one example, stage text from status and last-reply direction, and actual sales and royalty figures. The model must not invent dates, amounts, or promises. If Gemini is unset, times out, or hits free-tier quota, classification uses regex and drafts use templates.
- **Live updates without leaking staff fields.** Socket.IO checks the JWT at handshake. The server assigns personal and admin rooms. Authors get tickets with notes, AI drafts, and admin unread flags removed.
- **A small security baseline.** Tokens last 24 hours, admin routes check role, authors only see their own tickets, login and draft routes are rate-limited, and the process will not start unless `JWT_SECRET` is set.

## Trade-offs I made

- **Replies and notes sit on the ticket document.** One read returns the whole conversation. That is fine for short publishing tickets; it would fail if threads approached MongoDB’s 16 MB limit.
- **WebSocket instead of polling.** Staff see new tickets, classification, and replies immediately, at the cost of a persistent connection per client. There is no Redis adapter, so this is a single-process setup.
- **Gemini on the free tier.** Demo cost is zero until the daily quota is used. After that, classify and draft calls use the fallbacks above.
- **No automated tests and no email.** Time went into triage, drafting, and live sync. There are no test files. Authors are not emailed when staff reply or change status.

## How I'd evolve this into production

- **A real job queue.** Replace the fire-and-forget background task with a worker so classification and drafting retry after a crash instead of disappearing.
- **Tests and a paid quota.** Unit tests for fallbacks and the atomic guards, plus API tests in CI, would catch regressions a demo will miss. Leaving the Gemini free tier would make those calls predictable under load.
- **Email, then file uploads.** A transactional provider should mail authors on staff replies and status changes. Print-quality drafts ask for photos, but there is still no upload path.
- **Session and scale work.** Move the JWT out of `localStorage` into an httpOnly cookie, add refresh tokens, replace the single `unreadByAdmin` flag with per-admin read state, and add a Socket.IO Redis adapter if more than one process is needed.
