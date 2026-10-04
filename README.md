# BxStrength — Live Virtual Fitness & Performance Platform

BxStrength (BX) is a live virtual fitness and performance coaching platform built for individuals and athletes seeking structured 1-on-1 coaching, periodized barbell strength training, boxing technique, custom sports nutrition blueprints, and physiotherapy rehab.

---

## 🚀 Technology Stack

- **Frontend Core**: React 18, TypeScript, Vite, TailwindCSS (Vanilla CSS & utility-first styling), Lucide Icons
- **Backend Core**: Node.js, Express, TypeScript, Express-Session, Bcrypt password hashing
- **Database**: PostgreSQL (Hosted on NeonDB) + Local fallback persistence
- **Authentication**: JWT & Cookie Session Auth, Google OAuth (Google Identity Services GSI), OTP Email Verification
- **Email Gateway**: Brevo SMTP (Transactional email templates & real-time alerts)
- **Payment Gateway**: Razorpay Gateway Integration (Multi-currency £ GBP / ₹ INR market support)

---

## 📂 Project Architecture & Folder Structure

```text
BxStrength/
├── src/
│   ├── dashboards/                  # 5 Core Role-Based Dashboards
│   │   ├── admin/                   # 1. Admin Dashboard (Master platform control)
│   │   ├── head-coach/              # 2. Head Coach Dashboard (Coach supervision & QA)
│   │   ├── coach/                   # 3. Coach Dashboard (Assigned client coaching)
│   │   ├── customer-support/        # 4. Customer Support Dashboard (Inquiries & Tickets)
│   │   └── client/                  # 5. Client Dashboard (Personal training portal)
│   │
│   ├── components/                  # Centralized UI Components
│   │   ├── admin/                   # Admin & CRM Management Subcomponents
│   │   ├── auth/                    # Auth Modals (Login, Register, OTP, Forgot Password)
│   │   ├── common/                  # Shared Header, Footer, SeoHead, Faq, TrustBar
│   │   ├── dashboard/               # Client Portal Subviews
│   │   ├── forms/                   # Input Components & Payment Buttons
│   │   ├── modals/                  # Feature Modals & Lightboxes
│   │   ├── support/                 # Customer Support Ticket Command Center
│   │   └── ui/                      # Floating Action Widget, Chatbot, Skeletons, Preloader
│   │
│   ├── services/                    # API Communication & Backend Gateways
│   │   ├── auth/                    # Authentication Service (Google SSO & Session)
│   │   ├── users/                   # User Directory & Role Service
│   │   ├── enquiries/               # CRM Lead & Inquiry Service
│   │   ├── assignments/             # Central Coaching Assignment Engine
│   │   ├── workouts/                # Workout Program Service
│   │   ├── nutrition/               # Nutrition & Diet Plan Service
│   │   ├── subscriptions/           # Subscription & Billing Service
│   │   ├── tickets/                 # Support Tickets & Escalations
│   │   ├── api.ts                   # Master VelocityAPI Interface
│   │   ├── emailService.ts          # Brevo Transactional Email Gateway
│   │   ├── googleAuthService.ts     # Google One-Tap & GSI Script Loader
│   │   └── razorpayService.ts       # Razorpay Checkout SDK Service
│   │
│   ├── context/                     # Global State (AuthContext)
│   ├── hooks/                       # Custom Hooks (useNetworkStatus)
│   ├── routes/                      # Route Constants & Page Navigation
│   ├── types.ts                     # TypeScript Schemas & Data Contracts
│   └── utils/                       # Utility Services (marketService, phoneValidation)
│
├── server.ts                        # Express API Server & PostgreSQL/NeonDB Backend
├── package.json
└── README.md                        # Documentation
```

---

## 🎯 5 Core Dashboard Boundaries & RBAC Architecture

| Dashboard | Role | Key Operational Authority |
| :--- | :--- | :--- |
| **Admin Dashboard** | `admin` | Complete operational control over users, Head Coaches, Coaches, Client accounts, RBAC permissions, audit logs, financial subscriptions, and site settings. |
| **Head Coach Dashboard** | `headcoach`, `head_coach` | Athletic supervision over coaches, central assignment engine (delegating clients/workouts/diets/consultations), and QA approval of workout & diet plans. |
| **Coach Dashboard** | `coach` | Dedicated 1-on-1 coaching workspace for assigned client roster, building custom workout programs & nutrition blueprints, and submitting client feedback. |
| **Customer Support Dashboard** | `customer_support`, `support` | Managing client inquiries, responding to support tickets, SLA monitoring, and escalating high-priority tickets to Head Coach/Admin. |
| **Client Dashboard** | `client` | Personal training portal for viewing active training journey, assigned UK coach details, custom workout plans, nutrition blueprints, bookings, and body metrics. |

---

## 🔄 Core Business Workflows

### 1. Admin → Head Coach → Coach → Client Coaching Flow
1. **Client Registration & Lead Entry**: Client signs up or submits an inquiry/service booking.
2. **Central Assignment**: Head Coach allocates the client athlete to an expert UK Specialist Coach via the Central Assignment Engine.
3. **Program Architecture & QA**: Coach builds a tailored Workout Program or Nutrition Blueprint. The plan is submitted to the Head Coach for approval.
4. **Publish & Sync**: Once approved by Head Coach, the program is published and instantly synced to the Client's Dashboard with live email alerts dispatched via Brevo.

### 2. Customer Support → Head Coach → Coach Enquiry Flow
1. **Client Inquiry / Support Ticket**: Client submits a health query or support request.
2. **Support Desk Handling**: Customer Support reviews ticket priority, responds to inquiries, or escalates complex athletic queries directly to Head Coach or Executive Admin.
3. **Resolution & Real-time Update**: Resolved tickets trigger instant status updates in both the Support Desk and Client Ticket Center.

---

## 🛠 Local Development & Environment Setup

### Environment Variables (.env)
Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@neondb-host/bxstrength
BREVO_API_KEY=xkeysib-...
SENDER_EMAIL=support@bxstrength.co.uk
GOOGLE_CLIENT_ID=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### Installation & Run Commands

```bash
# 1. Install dependencies
npm install

# 2. Run local development server (Vite + Express Backend)
npm run dev:all

# 3. Static type check & linter
npm run lint

# 4. Production build
npm run build
```

---

## 🔒 Security & RBAC Enforcement
- **Password Hashing**: Passwords are cryptographically hashed using `bcrypt` (10 salt rounds).
- **Backend Authorization**: Role checks (`admin`, `head_coach`, `coach`, `customer_support`, `client`) are strictly enforced by Express middleware on backend API endpoints.
- **Account Status Validation**: Deactivated accounts (`status === 'inactive'`) are instantly blocked with a `403 ACCOUNT_DEACTIVATED` payload.



🔍 Architectural Audit (Current vs. 100k Concurrent)
Architectural Area	Current Implementation	100k Concurrent Traffic Impact	High-Scale Solution Required
Backend Server	Single Node.js Express process	Server event loop will lock up; RAM overflow (OOM crash)	Horizontal Auto-Scaling (AWS ECS / GCP Cloud Run / Render Auto-Scale with 5–20 Node replicas behind a Load Balancer)
Database Pool	Standard pg connection pool (~10 connections)	Database connection pool exhaustion (too many clients already)	PgBouncer or Neon Serverless Connection Pooling + Redis Caching for read queries
Idempotency & State	In-memory JS arrays (memoryUsers, memoryTransactions)	Data desynchronization across multi-instance servers	Replace in-memory arrays with Redis Cluster for session, rate-limiting, and idempotency locks
Payments	Razorpay / Cashfree API endpoints	Gateway will hold up, but backend verification might suffer race conditions	Use PostgreSQL ACID transactions (SELECT FOR UPDATE) & Redis idempotency locks on payment webhooks
Static Web App UI	Vite React Single Page Application (SPA)	Easy to serve	CDN Edge Caching (Vercel, Cloudflare, or AWS CloudFront) offloads 90% of web traffic from backend
🚀 5 Key Steps to Scale BxStrength for 1 Lakh (100,000) Concurrent Users
1. CDN Offloading for Frontend (Zero Server Load for UI rendering)
Deploy your compiled Vite frontend (dist/) on Vercel, Cloudflare Pages, or AWS CloudFront.

Result: All 100,000 clients loading the website assets (HTML, JS, CSS, images) hit CDN edge servers worldwide. Your backend API server gets 0 load from asset downloads.
2. Redis Caching & Distributed Rate Limiting
Replace express-rate-limit's in-memory store with Redis (rate-limit-redis).

Cache non-sensitive catalog data (workout plans, nutrition guides, class schedules, public FAQs) in Redis.
Result: 80% of dashboard view requests are served instantly from RAM cache in < 2ms without hitting PostgreSQL.
3. Database Connection Pooling (PgBouncer / Neon Pooling)
For 100k simultaneous users, standard direct database connections will fail.

Use Neon Connection Pooling (transaction mode) or PgBouncer in front of PostgreSQL.
Add database indexes on frequently queried columns (users.email, subscriptions.user_id, enquiries.status).
4. Bulletproof Payment Webhooks & Idempotency
Store Razorpay/Cashfree webhook event IDs in Redis with a 24-hour TTL to ensure double webhooks or network retries never trigger duplicate subscriptions.
Wrap payment verification in SQL transactions:
sql
BEGIN;
SELECT * FROM subscriptions WHERE user_id = $1 FOR UPDATE;
UPDATE subscriptions SET status = 'active' WHERE user_id = $1;
COMMIT;
5. Auto-Scaling Backend Replicas
Run your server.ts across multiple container replicas (e.g. AWS ECS / Docker / GCP Cloud Run) with health checks:

Min Replicas: 2
Max Replicas: 20+ (scaling dynamically on CPU / Memory usage > 70%)