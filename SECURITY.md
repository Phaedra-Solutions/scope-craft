# Security Policy

The Phaedra Solutions engineering team and ScopeCraft contributors take the security of our application, infrastructure, and user data seriously. This document describes our vulnerability disclosure process and security policies.

---

## Supported Versions

Only the latest major and minor release lines receive security patches and updates. We strongly encourage all users and organizations deploying ScopeCraft to run the latest released version.

| Version | Supported          | Security Patches |
| ------- | ------------------ | ---------------- |
| 0.1.x   | :white_check_mark: | :white_check_mark: |
| < 0.1.0 | :x:                | :x:              |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities via public GitHub issues, discussions, or pull requests.**

If you believe you have discovered a vulnerability in ScopeCraft, please report it privately:

1. **GitHub Private Vulnerability Advisory (Preferred)**:
   Navigate to the repository's **Security** tab and click **Report a vulnerability** to submit an advisory draft.
2. **Email Disclosure**:
   Email the Phaedra Solutions security team directly at:
   - **`security@phaedrasolutions.com`**
   - Alternatively: **`security@scopecraft.dev`**

### What to Include in Your Report

To help us triage and resolve the issue quickly, please provide:

- A detailed description of the potential vulnerability.
- Clear step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- The affected component, file, or endpoint (e.g., `/api/leads`, `/api/estimate-ai`, or client-side calculation state).
- The potential impact and attack vector (e.g., SSRF, XSS, rate-limiting bypass, injection).
- Any proposed mitigations or remediation steps if you have them.

---

## Disclosure Response Timeline

When a security vulnerability is reported:

1. **Initial Acknowledgment**: Within **48 hours**, an engineer will acknowledge receipt of your report.
2. **Assessment & Validation**: Within **5 business days**, we will investigate and confirm whether the reported behavior constitutes a security vulnerability.
3. **Fix Development**: We will develop and test a security patch in a private repository/branch.
4. **Public Release & Advisory**: Once a patch is verified, we will release a new patch release and publish a coordinated security advisory crediting the reporter (unless anonymity is requested).

---

## Security Best Practices for Self-Hosting

When self-hosting or deploying ScopeCraft in production (e.g. on Vercel, AWS, Google Cloud Run, Docker):

- **API Keys**: Always protect your `GEMINI_API_KEY` on the server side (`process.env.GEMINI_API_KEY`). Never expose API keys with `NEXT_PUBLIC_` prefixes.
- **Webhooks**: When configuring `GHL_WEBHOOK_URL`, ensure your endpoint enforces TLS/HTTPS.
- **Headers**: ScopeCraft is configured with standard Next.js security headers. Consider enforcing strict Content Security Policies (CSP) and rate limiting on public `/api/*` endpoints via a reverse proxy (Cloudflare, Nginx, or Vercel Edge Middleware).
- **Dependencies**: Keep your node packages updated regularly by reviewing Dependabot alerts and running `npm audit`.
