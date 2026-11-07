# Contributing to ScopeCraft

Thank you for your interest in contributing to **ScopeCraft**! We are building the most accurate, transparent, and developer-friendly software scoping studio for the open-source community.

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Message Conventions](#commit-message-conventions)
- [Pull Request Checklist](#pull-request-checklist)

---

## 🚀 Getting Started

1. **Fork the Repository** on GitHub to your personal account.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/scopecraft.git
   cd scopecraft
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Setup environment variables**:
   ```bash
   cp .env.example .env.local
   ```
5. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to verify your setup.

---

## 💡 How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing GitHub issues to make sure it hasn't already been reported.

When creating a bug report, use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- A clear, descriptive title.
- Steps to reproduce the issue.
- Expected vs. actual behavior.
- Screenshots, browser version, and OS details.
- Console error logs if applicable.

### Suggesting Enhancements

Feature requests are warmly welcomed! Use our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) and describe:
- The problem or use-case you are trying to solve.
- Your proposed solution or user experience.
- Any alternative approaches considered.

### Submitting Pull Requests

1. **Create a branch** with a descriptive name from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
2. **Make your changes**: Write clean, documented, and type-safe code.
3. **Verify tests and builds** locally:
   ```bash
   # 1. Check TypeScript types
   npx tsc --noEmit

   # 2. Run ESLint
   npm run lint

   # 3. Test production build
   npm run build
   ```
4. **Commit your changes** following our [Commit Message Conventions](#commit-message-conventions).
5. **Push to your fork** and open a Pull Request against the `main` branch.

---

## 🛠️ Development Workflow

- Always keep your fork's `main` branch synced with upstream:
  ```bash
  git remote add upstream https://github.com/scopecraft/scopecraft.git
  git fetch upstream
  git rebase upstream/main
  ```
- Keep pull requests focused on a single concern or feature. Large PRs that mix refactoring with new features take significantly longer to review.

---

## 🎨 Coding Standards

### TypeScript
- All code must be strictly typed. Avoid `any` where possible.
- Shared domain models belong in `types/estimator.ts`.
- Prefer interfaces for object schemas and type aliases for unions/primitives.

### Styling & Design Constitution
- Use **Tailwind CSS** utility classes directly.
- **Zero-Pill Discipline**: Avoid wrapping plain metadata (category tags, dates, statuses) in heavy bordered pills or capsules. Use subtle, unboxed typography with semantic text colors.
- Maintain **WCAG AA contrast ratios** (minimum 4.5:1 for body text, 3:1 for large text).
- Default to crisp, light-mode executive aesthetics (Slate 50 background, pure white cards with `#e2e8f0` borders, Slate 900 text, and Royal Blue `#2563eb` active accents).

### Security
- **Never commit secrets**, tokens, or private keys.
- Server-side environment variables (e.g. `GEMINI_API_KEY`, `GHL_WEBHOOK_URL`) must only be accessed within API routes (`app/api/*`) or Server Actions. Never prefix server keys with `NEXT_PUBLIC_`.

---

## 📝 Commit Message Conventions

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>
```

### Allowed Types:
- `feat`: A new feature or capability (e.g., `feat(gantt): add critical path filter`)
- `fix`: A bug fix (e.g., `fix(wizard): correct hourly rate calculation in step 3`)
- `docs`: Documentation changes only (e.g., `docs(readme): add deploy to vercel guide`)
- `style`: Changes that do not affect code logic (formatting, whitespace)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, dependencies, or tooling

---

## ✅ Pull Request Checklist

Before marking your pull request as ready for review, ensure:

- [ ] Code follows the project's styling and TypeScript conventions.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm run lint` passes without errors.
- [ ] `npm run build` succeeds cleanly.
- [ ] Any new feature has corresponding user-facing controls and documentation.
- [ ] Commits are clean and follow Conventional Commits.
- [ ] No hardcoded secrets, test credentials, or personal emails are committed.

Thank you for helping make ScopeCraft exceptional!
