# ScopeCraft ⚡️
### Precision Software Scoping, Squad Velocity & Architecture Estimation Studio

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 📌 Overview

**ScopeCraft** is an open-source, full-stack software scoping, team headcount, and architecture cost estimation studio. Built for software agencies, CTOs, product managers, and founders, ScopeCraft replaces spreadsheet guesswork with an interactive, mathematically rigorous scoping engine that models delivery timelines, engineering team capacity, regional labor benchmarks, and phased delivery roadmaps in real time.

---

## ✨ Key Features

### 1. 🧭 4-Step Guided Scoping Wizard
- **Foundations**: Configure target delivery milestones, platform targets (Web, iOS, Android, Desktop, Cross-Platform), architecture complexity (MVP, Standard, Enterprise), and design/QA polish levels.
- **Technical Modules Catalog**: Select from 17+ pre-architected modules (Authentication & RBAC, Stripe Monetization, LLM & Vector RAG, Realtime WebSocket Chat, Content CMS, Analytics, Integrations, and DevOps).
- **Dedicated Squad Builder**: Configure headcount by role, experience tier (Junior, Mid, Senior, Lead), and engagement model (Full-time, 50% Part-time, 25% Advisory).
- **Executive Reveal & Lead Capture**: Optional gated contact capture for agency websites with automatic GoHighLevel (GHL) CRM proxy synchronization.

### 2. 📊 Interactive Module Phase GANTT Timeline
- **Phased Delivery Roadmap**: Automatically calculates and renders the 5 core development phases:
  - *Phase 1*: Discovery & System Architecture
  - *Phase 2*: UI/UX Prototyping & Design System
  - *Phase 3*: Core Sprint Engineering
  - *Phase 4*: Intelligence, Analytics & System Integrations
  - *Phase 5*: QA Hardening, DevOps & Production Go-Live
- **Module Sprint Tracks**: Visualizes exact start/end weeks and duration for every scoped module.
- **Critical Path Highlighting**: Highlights zero-slack workstreams that dictate the critical delivery path.
- **Milestone Quality Gates**: Visual milestone markers (Kickoff, Architecture Signoff, Alpha Demo, Beta Freeze, Production Launch).
- **Interactive Inspector**: Click or hover any sprint bar to inspect effort hours, allocated squad roles, deliverable definitions, and projected investment.

### 3. 👥 Squad Capacity & Velocity Synchronization
- Dynamically balances **target deadline** vs. **engineering throughput**.
- Instant velocity status warnings (`understaffed`, `balanced`, `accelerated`).
- One-click **"Auto-Optimize Team to Scope"** button that auto-allocates the exact required roles to hit project deadlines.

### 4. 🌍 Global Regional Rate Benchmarks & Multi-Currency
- Real-time labor rate comparisons across 5 global regions:
  - **North America (US / Canada)** ($120–$165/hr)
  - **Western Europe (UK / EU)** ($95–$130/hr)
  - **Eastern Europe (Poland / Ukraine)** ($55–$75/hr)
  - **South Asia (Pakistan / India)** ($30–$45/hr)
  - **Latin America (Brazil / Argentina)** ($45–$65/hr)
- Instant multi-currency conversions across **USD ($)**, **EUR (€)**, **GBP (£)**, **CAD ($)**, **AUD ($)**, and **INR (₹)**.

### 5. 📄 Statement of Work (SOW) Proposal Generator
- Export high-resolution, print-ready client proposals with one click:
  - **Executive PDF Proposal**: Multi-page styled SOW with scope breakdown, squad roster, and payment milestones.
  - **HTML Interactive Report**: Self-contained client-facing proposal web view.
  - **CSV Spreadsheet**: Structured data export for finance and spreadsheet modeling.
  - **Markdown Report**: Ready for GitHub issues, Notion, or Slack briefs.

### 6. 🤖 AI Scope Architect (Powered by Gemini)
- Paste unstructured product requirements, PRDs, or raw client briefs.
- The AI engine analyzes technical requirements, estimates complexity, recommends feature modules, and pre-configures the squad composition.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **Language**: [TypeScript 5.9](https://www.typescriptlang.org/) (Strict type checking)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with clean, high-contrast executive light design
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Document Export**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)
- **AI SDK**: [@google/genai](https://www.npmjs.com/package/@google/genai) (Gemini 2.5/3.5 models)
- **License**: GNU General Public License v3.0 (GPLv3)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.18.0` or higher (Recommended: `v20.x` or `v22.x`)
- **Package Manager**: `npm`, `pnpm`, or `bun`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/scopecraft/scopecraft.git
   cd scopecraft
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration:
   ```env
   # Optional: For AI Scope Architect features
   GEMINI_API_KEY="your-gemini-api-key"

   # Optional: Base application URL for production self-referencing
   APP_URL="http://localhost:3000"

   # Optional: GoHighLevel Inbound Webhook for CRM lead capture
   GHL_WEBHOOK_URL="https://services.leadconnectorhq.com/hooks/YOUR_INBOUND_WEBHOOK"
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📜 Available Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Starts the Next.js development server on port 3000 |
| `npm run build` | Compiles an optimized standalone production build |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint across the codebase |
| `npx tsc --noEmit` | Performs strict TypeScript type validation |

---

## 📂 Project Structure

```
scopecraft/
├── app/
│   ├── api/
│   │   ├── estimate-ai/route.ts  # Gemini AI brief scoping endpoint
│   │   └── leads/route.ts        # GoHighLevel CRM lead sync proxy
│   ├── globals.css               # Tailwind CSS v4 root styling & print rules
│   ├── layout.tsx                # Root layout, meta tags & light-mode base
│   ├── not-found.tsx             # 404 error page
│   └── page.tsx                  # Primary studio assembly & live cost dock
├── components/
│   ├── CombinedStudio.tsx        # Executive summary, velocity sync & studio hub
│   ├── GanttTimelineBreakdown.tsx# Interactive delivery roadmap & GANTT chart
│   ├── GuidedScopingWizard.tsx   # 4-step interactive guided project onboarding
│   ├── CostCharts.tsx            # Recharts cost & phase distribution visuals
│   ├── ProjectCostCalculator.tsx # Granular module toggles & custom parameters
│   ├── TeamCostCalculator.tsx    # Squad builder, role rates & headcount sliders
│   ├── ScenarioComparison.tsx    # Dedicated squad vs Fixed price vs T&M breakdown
│   ├── ProposalExportModal.tsx   # Multi-format SOW generator (PDF, CSV, HTML, MD)
│   ├── AiEstimatorModal.tsx      # Natural language project brief scoping modal
│   └── Header.tsx                # Wordmark, currency selector & benchmark switcher
├── lib/
│   ├── estimator-data.ts         # Feature modules catalog, role rates, regions & presets
│   ├── estimator-engine.ts       # Mathematical calculation engine & squad auto-sync
│   ├── export-helpers.ts         # PDF generation, CSV compiler & HTML templates
│   └── ghl-sync.ts               # GoHighLevel payload formatters & webhook dispatch
├── types/
│   └── estimator.ts              # Core TypeScript interfaces & domain types
├── .env.example                  # Documented environment variable template
├── .gitignore                    # Git exclusions & secret safeguards
├── CONTRIBUTING.md               # Contribution workflow and guidelines
├── CODE_OF_CONDUCT.md            # Contributor Covenant v2.1 code of conduct
├── SECURITY.md                   # Security vulnerability reporting policy
├── LICENSE                       # GNU General Public License v3.0 (GPLv3)
└── package.json                  # Dependencies, scripts & metadata
```

---

## 🤝 Contributing

We welcome community contributions, bug fixes, module additions, and feature proposals! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for local development workflows, coding standards, and pull request procedures.

All participants are expected to adhere to the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🔒 Security

For security vulnerability reports, please review our [SECURITY.md](SECURITY.md) for private disclosure instructions. Do not disclose vulnerabilities via public issues.

---

## ⚖️ License

ScopeCraft is open-source software licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [LICENSE](LICENSE) file for the complete license text.

Copyright (C) 2026 Phaedra Solutions. All rights reserved.
