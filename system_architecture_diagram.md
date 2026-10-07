# BxStrength Platform - System Architecture & Runtime Diagram

## 🏗️ System Architecture Overview

The **BxStrength Platform** is structured as a full-stack, decoupled Web Application featuring a high-performance React 19 + TypeScript Single Page Application (SPA) on the frontend and an Express.js RESTful API engine on the backend with PostgreSQL data persistence, multi-gateway payment processing (Razorpay & Cashfree), and role-based access control (RBAC).

---

## 📊 Runtime Architecture Diagram (Core Components & Trust Boundaries)

```mermaid
flowchart TD
    %% Trust Boundaries & Zones
    subgraph Client_Zone ["🌐 Client Browser & Public Edge Zone (Untrusted)"]
        SPA["1. React 19 SPA Frontend\n(Vite + TypeScript)"]
        DashModules["2. Modular Dashboards\n(Admin, HeadCoach, Coach, Support, Client)"]
        APIClient["3. API Client Layer\n(VelocityAPI Service & JWT Manager)"]
    end

    subgraph AppServer_Zone ["🛡️ Application Server Zone (Protected Private Network)"]
        ExpressApp["4. Express API Gateway\n(Helmet Security, CORS & Rate Limiter)"]
        AuthSystem["5. Auth & RBAC Subsystem\n(JWT Verification & Bcrypt Hashing)"]
        CRMEngine["6. Operations & CRM Engine\n(User Roster, Tasks, Programs, Enquiries)"]
        PaymentController["7. Payment Controller Engine\n(Razorpay & Cashfree Checkout APIs)"]
        EmailService["8. Email & Notification Dispatcher\n(Nodemailer / Brevo SMTP)"]
    end

    subgraph Data_Zone ["🗄️ Database & Persistence Zone (Encrypted Storage)"]
        PostgresDB[("9. Primary PostgreSQL Database\n(Neon Serverless / pg Pool)")]
        MemStore["10. In-Memory Fallback & Cache Store\n(State Synchronization Cache)"]
    end

    subgraph External_Zone ["☁️ External Cloud & SaaS Providers (Third-Party APIs)"]
        RazorpayGateway["11. Razorpay & Cashfree APIs\n(Payment Gateway Edge)"]
        BrevoSMTP["12. Brevo Email Infrastructure\n(Transactional Email Delivery)"]
        GeminiAI["13. Google Gemini AI API\n(@google/genai Service)"]
    end

    %% Component Wiring & Interactions
    SPA --> DashModules
    DashModules --> APIClient

    %% Primary Request / Data Path (Highlighted)
    APIClient ==>|"1. HTTP REST Requests (JWT Bearer Token)"| ExpressApp
    ExpressApp ==>|"2. Validate Session & Permissions"| AuthSystem
    AuthSystem ==>|"3. Authorize & Delegate"| CRMEngine
    CRMEngine ==>|"4. SQL Query Execution"| PostgresDB
    PostgresDB ==>|"5. Return Normalized Result Set"| CRMEngine
    CRMEngine ==>|"6. JSON Payload Response"| ExpressApp
    ExpressApp ==>|"7. HTTP 200 OK Response"| APIClient

    %% Auxiliary Paths & Integrations
    ExpressApp -.->|"Process Checkout / Webhook"| PaymentController
    PaymentController <-->|"Initiate & Verify Order"| RazorpayGateway
    PaymentController -->|"Persist Subscription & Transaction"| PostgresDB

    ExpressApp -.->|"Trigger Transactional Emails"| EmailService
    EmailService -->|"Deliver Email via SMTP"| BrevoSMTP

    ExpressApp -.->|"AI Logic Query"| GeminiAI

    PostgresDB -.->|"Fallback Sync"| MemStore

    %% Styling
    classDef clientStyle fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef appStyle fill:#0f172a,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef dataStyle fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#f8fafc;
    classDef extStyle fill:#1c1917,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;

    class SPA,DashModules,APIClient clientStyle;
    class ExpressApp,AuthSystem,CRMEngine,PaymentController,EmailService appStyle;
    class PostgresDB,MemStore dataStyle;
    class RazorpayGateway,BrevoSMTP,GeminiAI extStyle;
```

---

## 🔁 Primary Request & Data Execution Path

The diagram highlights the primary client data path (indicated by thick double arrows `==>`) for authenticated user interactions (e.g. Client viewing workout plans, Admin modifying user roles, Support handling inquiries):

1. **Client Request**: User performs an action in the frontend UI (`DashModules`), which invokes the central `VelocityAPI` service (`APIClient`).
2. **Transmission**: `APIClient` attaches the `Authorization: Bearer <jwt_token>` header and executes an asynchronous `fetch()` to `ExpressApp`.
3. **Security Gate**: `ExpressApp` runs Helmet HTTP security headers check, CORS validation, and rate limiting before handing off to `AuthSystem`.
4. **Authentication & Authorization**: `AuthSystem` verifies the JWT signature and checks user role permissions against RBAC policies.
5. **Business Logic Execution**: `CRMEngine` executes the domain logic (e.g., retrieving active subscriptions, client rosters, assigned tasks).
6. **Data Persistence**: `CRMEngine` executes parameterized SQL queries against `PostgresDB` via the `pg` pool.
7. **Response Assembly**: `PostgresDB` returns query results to `CRMEngine`, which formats the JSON payload and responds to `APIClient` with HTTP 200 OK.

---

## 🔍 Core Component Specification Cards

Below is the detailed technical specification for each core runtime component:

| Component ID & Name | Trust Zone | Technology Stack | Key Responsibilities & Capabilities |
| :--- | :--- | :--- | :--- |
| **1. React 19 SPA Frontend** | Client Browser | React 19, TypeScript, Vite, TailwindCSS, Lucide Icons | Responsive UI rendering across desktop, tablet, and mobile; client-side routing and state management. |
| **2. Modular Dashboards** | Client Browser | React 19, TypeScript | 5 isolated dashboard modules (`src/dashboards/`): Admin, Head Coach, Coach, Customer Support, Client. |
| **3. API Client Layer** | Client Browser | TypeScript (`VelocityAPI` service) | Handles REST endpoints, token local storage, auto-retry logic, and error parsing. |
| **4. Express API Gateway** | App Server | Node.js, Express.js, Helmet, CORS, Express-Rate-Limit | Central API router (`/api/*`), HTTP security headers, payload body parsing (10MB limit), XSS sanitization. |
| **5. Auth & RBAC Subsystem** | App Server | JWT, Bcrypt.js, Custom Middleware | Password hashing, token signing & verification, strict role-based route enforcement. |
| **6. Operations & CRM Engine** | App Server | Node.js Express Controllers | Full operational management over users, coach assignments, client stats, workout/diet plans, and enquiries. |
| **7. Payment Controller** | App Server | Node.js, Razorpay Node SDK, Cashfree REST API | Order creation, payment signature validation, webhook verification, and subscription record updating. |
| **8. Email & Notification Service**| App Server | Nodemailer, EmailJS Service | Sending transactional emails (OTP verification, welcome messages, password resets, support ticket updates). |
| **9. Primary Database Storage** | Database Zone | PostgreSQL (Neon Serverless / `pg` pool) | Relational persistence for users, bookings, subscriptions, workout programs, nutrition plans, tickets, and logs. |
| **10. In-Memory Fallback & Cache**| Database Zone | Node.js Memory Objects | High-speed transient fallback for offline testing, rate limiting metrics, and fallback data structures. |
| **11. External Payment Gateways**| External SaaS | Razorpay & Cashfree APIs | Processing credit cards, UPI, net banking, checkout UI overlays, and webhook event notifications. |
| **12. Brevo Email Infrastructure**| External SaaS | Brevo SMTP | High-deliverability transactional email delivery network for transactional notifications. |
| **13. Google Gemini AI API** | External SaaS | `@google/genai` SDK | Powers AI logic widgets for automated customer assistance and personalized workout insights. |

---

## 🔒 Security & Trust Boundaries

1. **Client Browser Zone vs. Application Server Zone**:
   - The browser is considered an untrusted zone.
   - All input parameters (`req.body`, `req.query`, `req.params`) are strictly sanitized for XSS and validated on the backend.
   - Access control is enforced exclusively on the backend via JWT bearer tokens and RBAC middleware.

2. **Application Server Zone vs. Database Zone**:
   - Database connections use SSL encryption (`ssl: { rejectUnauthorized: false }`).
   - Parameterized SQL queries are mandatory to prevent SQL injection vulnerabilities.

3. **Application Server Zone vs. External SaaS Zone**:
   - Secret API Keys (`RAZORPAY_KEY_SECRET`, `JWT_SECRET`, `BREVO_SMTP_KEY`) are kept strictly confidential in server environment variables (`.env`).
   - Payment webhooks verify digital signatures (`HMAC-SHA256`) before updating subscription statuses.
