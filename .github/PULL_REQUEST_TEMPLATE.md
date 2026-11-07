## Description
Briefly describe the purpose of this Pull Request and what changes it introduces.

Fixes #(issue number if applicable)

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Style/UI polish (non-functional visual improvements)
- [ ] ⚡ Performance optimization
- [ ] 🔧 Tooling, CI/CD, or maintenance

## Affected Areas
- [ ] Guided Scoping Wizard (`components/GuidedScopingWizard.tsx`)
- [ ] GANTT Timeline Breakdown (`components/GanttTimelineBreakdown.tsx`)
- [ ] Calculation Engine (`lib/estimator-engine.ts`)
- [ ] Feature / Role Catalog Data (`lib/estimator-data.ts`)
- [ ] Proposal Export (PDF / CSV / HTML / Markdown)
- [ ] AI Scope Architect API (`app/api/estimate-ai`)
- [ ] GoHighLevel CRM Sync Proxy (`app/api/leads`)
- [ ] Styling & Global Layout (`app/globals.css`, `app/layout.tsx`)

## Screenshots / Verification
*(If UI or calculation changes were made, please provide before/after screenshots or terminal output)*

## Checklist
- [ ] My code follows the code style and guidelines of this project.
- [ ] I have performed a self-review of my own code.
- [ ] I have verified that `npx tsc --noEmit` passes with 0 errors.
- [ ] I have verified that `npm run lint` passes without errors.
- [ ] I have verified that `npm run build` succeeds cleanly.
- [ ] My changes generate no new warnings or console errors.
- [ ] I have updated corresponding documentation where relevant.
- [ ] No hardcoded secrets, personal tokens, or API keys are committed.
