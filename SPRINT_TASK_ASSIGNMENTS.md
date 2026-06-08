# Smart Quiz Platform — Sprint Task Assignments

Team: Dan, Thái, Sơn, Quốc, Hải
Structure: 3 sprints, each person keeps a consistent "lane" across sprints to build depth, while Hải owns integration/QA every sprint so the other four can build in parallel without blocking each other.

Lanes:
- **Dan** — Backend (core infra → learning-content backend → analytics/admin backend)
- **Thái** — Backend (profiles/classes → study-sets/exams backend → payments backend)
- **Sơn** — Frontend (auth/profile UI → teacher authoring UI → analytics/upgrade UI)
- **Quốc** — Frontend (classes/dashboard UI → learner practice/exam UI → admin/public UI)
- **Hải** — Full-stack integration & QA (Supabase wiring, contract testing, end-to-end flows, cleanup)

---

## SPRINT 1 — Foundation: Auth, Profiles, Classes

Goal: get login, roles, profiles, and the teacher↔class↔learner relationship working end-to-end, since every later feature depends on it.

### Dan — Backend: Auth & Core Infrastructure
1. `server/src/config/env.js` — Centralizes and validates `process.env` so the rest of the app never touches it directly. *Use case: app boots safely and fails fast if Supabase keys are missing.*
2. `server/src/middlewares/auth.middleware.js` — `requireAuth`: verifies the Supabase JWT from the `Authorization` header and attaches `req.user`. *Use case: protects any endpoint that needs a logged-in user (e.g. "GET /api/profiles/me").*
3. `server/src/middlewares/role.middleware.js` — `requireRole(...roles)`: checks `req.user`'s role. *Use case: restricts teacher-only actions like creating a class, or admin-only actions like suspending a user.*
4. `server/src/middlewares/error.middleware.js` + `validate.middleware.js` — centralized error handler/404 handler, and Zod-based request validation. *Use case: consistent `{ ok:false, error }` responses and rejecting malformed registration/login payloads before they hit the database.*
5. `server/src/features/auth/auth.dao.js` — wraps Supabase auth calls (`signUp`, `signInWithPassword`, `signOut`, password reset) plus profile creation via the admin client. *Use case: the data layer behind every authentication action.*
6. `server/src/features/auth/auth.service.js` — `register` (creates auth user + profile with default `learner` role), `login`, `logout`, `requestPasswordReset`, `resetPassword`, `getCurrentProfile`. *Use case: the business logic for the whole registration → login → forgot/reset password journey.*
7. `server/src/features/auth/auth.controller.js` — thin HTTP handlers wrapping the service in try/catch with `ok()`/`fail()`. *Use case: turns service results into HTTP responses.*
8. `server/src/features/auth/auth.routes.js` — `POST /register, /login, /logout, /forgot-password, /reset-password`, `GET /me`. *Use case: implements the entire "Authentication" section of the URL map (`/login`, `/register`, `/forgot-password`, `/reset-password`).*

### Thái — Backend: Profiles & Classes
1. `server/src/models/profile.model.js`, `class.model.js`, `join-request.model.js` — table-name constants, role/status enums, and JSDoc typedefs for these three ERD entities. *Use case: a single shared source of truth other features (auth, analytics, admin) import from.*
2. `server/src/features/profiles/profiles.dao.js` → `.service.js` → `.controller.js` → `.routes.js` (in that order — DAO first so the service has something to call) — `GET/PATCH /api/profiles/me`, `GET /api/profiles/:username`. *Use case: powers `/profile`, `/profile/edit`, and public `/users/:username` pages.*
3. `server/src/features/classes/classes.dao.js` → `.service.js` → `.controller.js` → `.routes.js` — `listMyClasses` (the "teacher views/manages created classes" feature), `createClass` (generates invite code), `updateClass`/`deleteClass` (ownership-checked), `listMembers`, `requestToJoin`, `resolveJoinRequest`. *Use case: powers the entire teacher "Classes" section (`/teacher/classes`, `/teacher/classes/create`, `/teacher/classes/:id/members`, `/invite`) and the learner "join class" flow (`/learner/classes/join`).*

### Sơn — Frontend: Auth & Profile UI
1. `client/src/services/auth.service.js` — thin wrapper calling `/api/auth/*` via the shared `api` axios instance. *Use case: every auth page calls through here instead of hitting axios directly.*
2. `client/src/hooks/use-auth.js` — tracks the current Supabase session + matching app profile (role, username) via `onAuthStateChange`. *Use case: lets any component check `isAuthenticated`/`role` to gate UI (e.g. show "Teacher Dashboard" link only for teachers).*
3. `client/src/app/login/page.jsx`, `register/page.jsx`, `forgot-password/page.jsx`, `reset-password/page.jsx` — build out the forms (currently stubs) using `authService` + `useAuth`. *Use case: the full sign-up → sign-in → password recovery journey from the URL map's "Authentication" section.*
4. `client/src/services/profile.service.js` — wraps `/api/profiles/*`. *Use case: backs the profile pages below.*
5. `client/src/app/profile/page.jsx`, `edit/page.jsx`, `change-password/page.jsx`, `notifications/page.jsx` — build out the profile view, edit form, password change, and notification settings (currently stubs). *Use case: the "Profile" section of the URL map — every logged-in user manages their account here.*

### Quốc — Frontend: Classes & Dashboards
1. `client/src/services/classes.service.js` — wraps `/api/classes/*` (list/create/update/remove/members/join/resolve). *Use case: single place the class UI talks to the backend.*
2. `client/src/hooks/use-classes.js` — loads the current teacher's classes with loading/error state and a `reload()` function. *Use case: backs the "My Classes" list with automatic refresh after create/edit/delete.*
3. `client/src/app/teacher/classes/page.jsx`, `create/page.jsx`, `[id]/page.jsx`, `members/page.jsx`, `invite/page.jsx` — build out class list, creation form, detail view, member roster, and invite-code screen (currently stubs). *Use case: THE key teacher feature — "view/manage created classes" from your original requirement.*
4. `client/src/app/learner/classes/page.jsx`, `join/page.jsx`, `[id]/page.jsx` — build out the learner's class list, "join by invite code" form, and class detail view. *Use case: lets learners join a teacher's class and see what's inside it.*
5. `client/src/app/teacher/dashboard/page.jsx`, `learner/dashboard/page.jsx` — build out the landing dashboards each role sees after login. *Use case: the first screen each role lands on — summarizes classes, recent activity, quick links.*

### Hải — Integration, Supabase Wiring & QA
1. `server/src/features/health/*` — verify `getSupabaseHealth` correctly reports connection status (using `supabase.auth.getSession()`, not a table query). *Use case: a `/health/supabase` endpoint the team can hit to confirm the backend ↔ Supabase link is alive.*
2. `server/src/routes/index.js` — confirm every Sprint 1 router (health, auth, profiles, classes) is mounted with the right prefix. *Use case: prevents "404 Not Found" surprises when frontend devs start integrating.*
3. `server/src/utils/async-handler.js`, `api-response.js`, `pagination.js`, `logger.js` — review/finish these shared helpers others depend on. *Use case: keeps every controller's error handling and response shape consistent.*
4. `client/src/utils/supabase/{client,server,middleware}.js` + `client/src/middleware.js` — verify session refresh works across server/client components. *Use case: prevents users from getting logged out unexpectedly when navigating.*
5. Write a Postman/Thunder Client collection (or simple test script) covering register → login → get/update profile → create class → join class → resolve join request. *Use case: a repeatable smoke test the whole team runs before each demo, catching integration breaks early.*

---

## SPRINT 2 — Core Learning: Question Banks, Study Sets, Exams

Goal: deliver the actual learning loop — teachers author content, learners practice and take exams. Depends on Sprint 1's auth + classes.

### Dan — Backend: Question Banks & AI
1. `server/src/models/question-bank.model.js`, `question.model.js` (with `QuestionType` enum), `answer-option.model.js`. *Use case: shared shapes for every quiz-content feature (also read by study-sets and exams).*
2. `server/src/features/question-banks/question-banks.dao.js` → `.service.js` → `.controller.js` → `.routes.js` — CRUD on banks plus `listQuestions/addQuestion/updateQuestion` with teacher-ownership checks. *Use case: powers `/teacher/question-banks` create/edit/manage and the nested "questions" sub-routes (`add`, `import`, `preview`, `[qid]/edit`).*
3. `server/src/features/ai/ai.service.js` — Gemini API wrapper for `explainAnswer` and `generateQuestions`, logging every call to `ai_interactions`. *Use case: backs the "Generate Questions with AI" page (`/teacher/question-banks/:id/generate`) and answer explanations shown to learners after a quiz.*

### Thái — Backend: Study Sets & Exams
1. `server/src/models/study-set.model.js` (with `StudySetVisibility` enum), `practice-session.model.js`, `learner-answer.model.js`, `exam.model.js`, `exam-attempt.model.js` (with `ExamAttemptStatus` enum). *Use case: shared shapes for the practice and exam-taking flows.*
2. `server/src/features/study-sets/study-sets.dao.js` → `.service.js` → `.controller.js` → `.routes.js` — CRUD on sets plus `startSession/submitAnswer/completeSession/getSessionResults`. *Use case: powers both teacher set-creation (`/teacher/study-sets`) and learner practice (`/learner/study-sets/:id/flashcards`, `/quiz`, `/quiz/result`).*
3. `server/src/features/exams/exams.dao.js` → `.service.js` → `.controller.js` → `.routes.js` — CRUD on exams plus `startAttempt/submitAnswer/submitAttempt/getAttemptResults`. *Use case: powers teacher exam creation/monitoring (`/teacher/exams`) and the learner exam-taking flow (`/learner/exams/:id/take`, `/result`).*

### Sơn — Frontend: Teacher Authoring UI
1. `client/src/services/question-banks.service.js`, then build out `client/src/app/teacher/question-banks/page.jsx`, `create/page.jsx`, `[id]/page.jsx`, `edit/page.jsx`, `generate/page.jsx`, and the `questions/{add, import, import/errors, preview, [qid]/edit}` pages. *Use case: the complete teacher workflow for building a question bank — manually, via AI generation, or via bulk import.*
2. `client/src/services/study-sets.service.js` + `hooks/use-study-sets.js`, then build out `client/src/app/teacher/study-sets/page.jsx`, `create/page.jsx`, `[id]/page.jsx`, `assign/page.jsx`. *Use case: teachers create study sets from a question bank and assign them to a class.*
3. `client/src/services/exams.service.js` + `hooks/use-exams.js`, then build out `client/src/app/teacher/exams/page.jsx`, `create/page.jsx`, `[id]/page.jsx`, `settings/page.jsx`, `monitor/page.jsx`. *Use case: teachers schedule timed exams and watch attempts come in live.*

### Quốc — Frontend: Learner Practice & Exam UI
1. `client/src/app/learner/study-sets/page.jsx`, `[id]/page.jsx`, `flashcards/page.jsx`, `quiz/page.jsx`, `quiz/result/page.jsx` — build out the practice flow using `studySetsService` + `useStudySets`. *Use case: the core "study and self-test" experience learners use daily.*
2. `client/src/app/learner/exams/page.jsx`, `[id]/page.jsx`, `take/page.jsx`, `result/page.jsx` — build out the timed exam-taking flow using `examsService` + `useExams`. *Use case: learners see upcoming exams, take them under time pressure, and review results.*
3. `client/src/app/study-sets/[id]/page.jsx`, `flashcards/page.jsx` (public versions) and `client/src/app/search/page.jsx`. *Use case: lets anyone browse and try public study sets without logging in — a discovery/acquisition feature.*

### Hải — Integration, End-to-End Testing & Shared Components
1. Smoke-test question-bank CRUD and AI generation (`/teacher/question-banks/:id/generate`) against `ai.service.js`. *Use case: confirms the Gemini integration returns usable output and gets logged correctly.*
2. End-to-end test the practice loop: create set → start session → submit answers → complete → fetch results. *Use case: this chain touches four files across two layers — easy to break silently.*
3. End-to-end test the exam loop: create exam → start attempt → submit answers → submit attempt → fetch results. *Use case: same reasoning — the highest-value flow in the app needs the most coverage.*
4. Cross-check each frontend `*.service.js` call against the matching backend route (URL, method, payload shape). *Use case: catches the classic "frontend calls `/api/examns`, backend mounted `/api/exams`" class of bugs.*
5. Extract repeated UI (question cards, timers, score displays) into `components/question-banks`, `components/study-sets`, `components/exams`. *Use case: keeps Sơn and Quốc's pages visually consistent and reduces duplicate code.*

---

## SPRINT 3 — Analytics, Payments, Admin & Launch Polish

Goal: round out the platform with reporting, monetization, and admin oversight, then harden everything for launch. Depends on data generated in Sprint 2 (attempts, sessions).

### Dan — Backend: Analytics & Admin
1. `server/src/models/report.model.js`. *Use case: shape for storing generated performance reports.*
2. `server/src/features/analytics/analytics.dao.js` → `.service.js` → `.controller.js` → `.routes.js` — `generateClassReport` (teacher) and `generateLearnerReport` (learner), aggregating exam/practice data. *Use case: powers `/teacher/analytics` (class performance) and `/learner/progress` (personal progress).*
3. `server/src/features/admin/admin.dao.js` → `.service.js` → `.controller.js` → `.routes.js` — user management (list/suspend/reinstate), class & payment oversight, premium-plan CRUD. *Use case: powers the entire `/admin/*` section — the platform's control room.*

### Thái — Backend: Payments & Subscriptions
1. `server/src/models/payment.model.js` (with `PaymentStatus` enum), `premium-plan.model.js`, `ai-interaction.model.js`. *Use case: shapes for subscription billing and AI usage auditing.*
2. `server/src/features/payments/payment-gateway.service.js` — normalized wrapper around the Stripe/VNPAY provider (`createCheckoutSession`, `parseWebhookEvent`). *Use case: isolates provider-specific quirks so the rest of the feature stays provider-agnostic.*
3. `server/src/features/payments/payments.dao.js` → `.service.js` → `.controller.js` → `.routes.js` — `listPlans`, `startCheckout`, `handleWebhook`. *Use case: powers `/upgrade` (start checkout), `/upgrade/result` (status), and the provider's server-to-server webhook callback.*

### Sơn — Frontend: Analytics, Progress & Upgrade UI
1. `client/src/services/analytics.service.js`, then build out `client/src/app/learner/progress/page.jsx` and `client/src/app/teacher/analytics/page.jsx`, `export/page.jsx`. *Use case: learners see their growth over time; teachers see how their classes are performing and can export the data.*
2. `client/src/services/payments.service.js`, then build out `client/src/app/upgrade/page.jsx`, `result/page.jsx`, and `client/src/app/plans/page.jsx`. *Use case: the monetization funnel — browse plans, check out, see the payment result.*

### Quốc — Frontend: Admin & Public/Error Pages
1. `client/src/app/admin/dashboard/page.jsx`, `users/page.jsx`, `users/[id]/page.jsx`. *Use case: admins get a platform overview and can drill into/manage individual users.*
2. `client/src/app/admin/resources/page.jsx`, `system-status/page.jsx`. *Use case: admins manage premium plans/platform resources and monitor system health.*
3. `client/src/app/users/[username]/page.jsx` (public profile page). *Use case: lets anyone view a teacher's or learner's public profile — supports discovery and credibility.*
4. `client/src/app/403/page.jsx`, `not-found.jsx`. *Use case: friendly error states instead of blank/broken screens when users hit access limits or bad URLs.*

### Hải — Final Integration, Regression Testing & Launch Prep
1. End-to-end test the payment flow: list plans → start checkout → simulate webhook → verify payment status updates. *Use case: money-related flows must be airtight before launch — this is the highest-risk area.*
2. End-to-end test analytics report generation for both teacher and learner views, checking the numbers match raw attempt/session data. *Use case: wrong analytics erode trust fast — verify the math, not just that the page loads.*
3. End-to-end test admin actions: suspend/reinstate a user, oversee classes and payments, manage premium plans. *Use case: confirms the platform's safety controls actually work.*
4. Run full regression across all three sprints' user journeys (learner: register → join class → practice → exam → progress; teacher: register → create class → author content → assign → analyze; admin: oversee → moderate). *Use case: catches regressions introduced by later sprints touching shared code.*
5. Clean up the orphaned duplicate health files (`server/src/controllers/health.controller.js`, `server/src/routes/health.routes.js`) and assemble a deployment checklist (env vars, Supabase RLS policies, build steps). *Use case: leaves the codebase tidy and the team confident before going live.*
