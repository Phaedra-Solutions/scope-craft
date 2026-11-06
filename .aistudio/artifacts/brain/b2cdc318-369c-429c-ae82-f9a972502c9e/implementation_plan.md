# Phaedra Solutions Guided Step-by-Step Estimator & GoHighLevel CRM Sync

A high-converting, multi-step guided estimation wizard for Phaedra Solutions. Prospective clients build their technical specifications step-by-step through an intuitive scoping workflow (Platforms, Complexity, Feature Modules, Team Roster, and Location Benchmark). At the final step, they enter their contact details to reveal their calculation. Submitting immediately syncs their contact record and complete itemized scope to **GoHighLevel (GHL) CRM**, unlocking the **full interactive studio** with live sliders, financial charts, and SOW proposal PDF export.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during interactive planning:

- **Step-by-Step Guided Wizard Flow**:
  - **Step 1: Project Foundation & Platforms**: Project Name, Target Timeline, Platforms (Web, iOS, Android, Cross-platform, Desktop), and Complexity Level.
  - **Step 2: Technical Scope & Feature Modules**: Interactive module selection across Auth, Payments, AI/LLM, Real-time, CMS, Analytics, Security, and SaaS Cloud Add-ons.
  - **Step 3: Team Squad & Location Benchmark**: Headcount allocation, experience tiers, and rate benchmark (Phaedra Solutions 30% default, USA/Canada 100%, Europe 68%, Middle East 50%, South East 40%).
  - **Step 4: Complimentary Lead Gate & Calculation Reveal**: Lead capture form (Name, Work Email, Phone, Company, Role, Budget) with reassuring copy and explicit marketing opt-in. Submitting sends all lead data + complete calculator selections to GoHighLevel CRM.
  - **Step 5: Full Interactive Studio Unlocked**: Instantly reveals the executive dashboard, interactive charts, live sliders, scenario comparisons, and SOW proposal PDF export.
- **GoHighLevel CRM Integration (No Database Required)**:
  - Submissions route through server-side proxy `POST /api/leads`.
  - Maps standard contact fields: First Name, Last Name, Email, Phone, Company Name.
  - Sets custom fields: `budget_range`, `job_role`, `estimated_grand_total`, `estimated_timeline_weeks`, `estimated_total_hours`, `selected_platforms`, `region_benchmark`.
  - Appends an itemized **Scope Breakdown Note** listing every feature module, team role, complexity level, and SaaS add-on.
  - Assigns automated tags: `["phaedra-estimator-lead", "complimentary-scope", "website-inbound"]`.
- **Reassuring Copy & Zero Risk Positioning**:
  - Reassures users that obtaining their comprehensive estimate is 100% complimentary and they won't lose anything.
  - Clearly explains that a formal project plan vetted by a Senior Solutions Architect is available as an optional paid service.
  - Explicit marketing consent checkbox and interactive Privacy Policy modal.

---

## 1. Multi-Step Wizard Architecture & User Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Guided Estimation Flow                          │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│     Step 1      │      Step 2      │     Step 3      │     Step 4      │
│  Foundations &  │ Feature Modules  │  Team Roster &  │   Lead Form &   │
│    Platforms    │   & SaaS Specs   │ Region (Phaedra)│ Reveal Calculation│
└────────┬────────┴────────┬─────────┴────────┬────────┴────────┬────────┘
         │                 │                  │                 │
         └─────────────────┴──────────────────┴─────────────────┘
                                   │
                                   ▼
                 ┌───────────────────────────────────┐
                 │    POST /api/leads to GHL CRM     │
                 │  • Contact + Tags                 │
                 │  • Custom Fields (Budget, Hours)  │
                 │  • Itemized Scope Breakdown Note  │
                 └─────────────────┬─────────────────┘
                                   │
                                   ▼
                 ┌───────────────────────────────────┐
                 │  Step 5: Full Interactive Studio  │
                 │  • Executive Quote & Timeline     │
                 │  • Live Sliders & Parameter Studio│
                 │  • Discipline Charts & PDF Export │
                 └───────────────────────────────────┘
```

---

## 2. Step Breakdown & Interface Details

### Step 1: Project Foundation & Platforms
- Clean step progress indicator (`Step 1 of 4: Foundations`).
- Project Name & Client Name inputs.
- Platform multi-select chips: Web Application, iOS Native, Android Native, Cross-Platform Mobile, Desktop.
- Complexity selector: MVP Prototype, Production Standard, Enterprise Scale.
- Design Level: Wireframe / Prototype, Standard Modern UI, Custom Bespoke Luxury.
- Primary Action: **"Continue to Feature Modules →"**.

### Step 2: Technical Scope & Feature Modules
- Interactive category-based selector with hour estimates:
  - Authentication (OAuth, SSO, MFA, RBAC)
  - Monetization & Payments (Stripe, Subscriptions, Marketplace)
  - Artificial Intelligence (Gemini LLM Chat, Vector RAG Search, Vision OCR)
  - Real-time & Communication (Live Chat, Push Notifications)
  - Content & Data (Admin CMS, File Uploads, Analytics Dashboards)
  - Security & DevOps (HIPAA/GDPR Compliance, Webhooks)
- SaaS infrastructure cloud add-ons checklist (AWS/GCP, Managed DB, AI API, CDN).
- Live counter: *X Feature Modules Selected (~Y Base Hours)*.
- Navigation: **"← Back"** or **"Continue to Team Squad →"**.

### Step 3: Team Squad & Location Benchmark
- Regional benchmark selection:
  - `⚡ Phaedra Solutions (default) (30%)` (Active by default)
  - `🇺🇸 USA/Canada (100%)`
  - `🇪🇺 Europe (68%)`
  - `🇦🇪 Middle East (50%)`
  - `🇸🇬 South East (40%)`
- Squad composition: Headcount adjustments for Tech Lead, UI/UX Designer, Frontend Engineer, Mobile Engineer, Backend Engineer, QA Engineer, DevOps Architect.
- Target timeline slider (weeks) and maintenance SLA selector.
- Primary Action: **"Review & Reveal Final Estimate →"**.

### Step 4: Complimentary Lead Form & Calculation Reveal Gate
- **Reassuring Banner**:
  > *"Your comprehensive project estimate is ready! Unlocking your full cost quote, timeline forecast, and team breakdown is 100% complimentary and risk-free. You won't lose anything by accessing these calculations.*
  >
  > *Phaedra Solutions collects your details to discuss your software engineering needs. If you'd like your specifications formally vetted by an experienced Senior Solutions Architect alongside a comprehensive project execution plan, that paid service is completely optional."*
- **Form Fields (2-Column Grid)**:
  - Full Name, Work Email, Phone Number.
  - Company Name, Role (Executive, VP Eng, Product Manager, Tech Lead, Other), Estimated Budget (<$25k, $25k-$50k, $50k-$100k, $100k-$250k, $250k+).
- **Consent Checkbox**:
  `[x] I agree to the Privacy Policy and consent to Phaedra Solutions contacting me regarding engineering services, project estimates, and marketing offers.`
- **Primary CTA**: **"Reveal My Estimate & Unlock Full Studio"** (with subtext: *"100% Free • No Credit Card Required"*).

### Step 5: Full Interactive Studio (Unlocked State)
- Unveils the complete executive dashboard with real-time totals, cost allocations, monthly burn rates, and timeline charts.
- Top bar displays navigation tabs (`Overview & Executive Summary`, `Scope Parameters`, `Team Roster`, `Scenario Comparisons`).
- Sticky dock offers quick SOW proposal generation, direct PDF export, and an optional **"Request Architect Vetting"** button.
- Saved in `localStorage` (`phaedra_unlocked_lead`) so returning visits remain unlocked.

---

## 3. GoHighLevel (GHL) Data Synchronization

### Backend Route (`app/api/leads/route.ts`)
- Triggered upon Step 4 form submission.
- Formats payload into GoHighLevel Inbound Webhook schema:
  - **Contact**: `firstName`, `lastName`, `name`, `email`, `phone`, `companyName`.
  - **Custom Fields**: `job_role`, `budget_range`, `estimated_grand_total`, `estimated_timeline_weeks`, `estimated_total_hours`, `monthly_team_burn`, `selected_platforms`, `region_benchmark`.
  - **Formatted Scope Note**: Complete itemized summary of all chosen features, team roles, complexity level, and SaaS add-ons.
  - **Tags**: `["phaedra-estimator-lead", "complimentary-scope", "website-inbound"]`.
- Graceful offline/mock mode if `GHL_WEBHOOK_URL` is empty during dev/sandbox testing.

---

## 4. Verification & Testing Plan

- **Verification 1 (Multi-Step Progression)**: Verify user can navigate forward and back between Steps 1, 2, and 3, preserving state.
- **Verification 2 (Lead Form Validation & Copy)**: Verify Step 4 displays reassuring complimentary copy, validates all 6 fields, and requires the consent checkbox before submission.
- **Verification 3 (GoHighLevel Sync Payload)**: Verify submitting Step 4 sends the combined contact info, calculated totals, and itemized feature list to `/api/leads`.
- **Verification 4 (Unlock & Interactive Studio)**: Verify submission transitions smoothly into Step 5 (full studio with live sliders, charts, and proposal exports) without page reload.
- **Verification 5 (Local Persistence)**: Verify page refresh retains unlocked studio state and pre-fills client/project identity.
- **Verification 6 (Compilation & Lint)**: Run `compile_applet` and `lint_applet` together to verify error-free execution.
