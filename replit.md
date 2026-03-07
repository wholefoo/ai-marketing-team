# AI Market Audit

AI-Powered Marketing Audit & Strategy Web Application

## Overview
Users enter their name, email, and a website URL. The app scrapes the site, then runs 5 specialized AI agents in parallel to produce a comprehensive marketing audit with an overall score, severity-coded findings, and a downloadable PDF report. A password-protected admin dashboard provides full visibility into all audits, customer info, and revenue.

## Architecture
- **Frontend:** React + Tailwind CSS + shadcn/ui (Vite)
- **Backend:** Express.js (TypeScript)
- **Database:** PostgreSQL via Drizzle ORM
- **AI:** Anthropic Claude (via Replit AI Integrations)
- **Payments:** Stripe (via Replit Stripe Integration)
- **PDF:** PDFKit
- **Web Scraping:** Cheerio + fetch

## Key Features
1. Website URL input with customer name/email collection
2. 5 parallel AI agents: Content, Conversion, SEO, Competitive, Strategy
3. Real-time progress via SSE (Server-Sent Events)
4. Overall marketing score (0-100) with score breakdown
5. Severity-coded findings (Critical, High, Medium, Low)
6. Executive summary and 6-month action plan
7. Professional PDF report generation
8. **Paywall:** Overview is free; detailed findings, agent reports, action plan, and PDF require $99 one-time Stripe payment
9. **Admin Dashboard:** Password-protected at /admin with all audits, customer names/emails, payment status, and revenue tracking

## Paywall Architecture
- Free tier: Overall score, score breakdown, executive summary, critical & high findings
- Paid tier ($99): Full findings (all severities), detailed agent reports, 6-month action plan, PDF download
- Payment flow: Stripe Checkout (one-time payment) -> verify-payment endpoint -> unlock audit
- Server-side gating: /api/audits/:id strips gated data for unpaid audits
- Webhook-based fulfillment: checkout.session.completed marks audit as paid

## Admin Dashboard
- Route: /admin (password-protected via ADMIN_PASSWORD secret)
- Token-based auth with 24-hour expiry, stored in sessionStorage
- Stats: Total audits, completed, paid, revenue, in-progress, errors
- Audit table: Customer name, email, website, status, score, payment status, date
- Search: Filter by name, email, URL, or business name
- Auto-refreshes every 10 seconds

## Homepage Sections (order)
Hero -> Social Proof Bar -> Feature Cards -> Who This Is For -> Pricing (with trust badges) -> Testimonials -> Comparison Chart -> FAQ -> Footer (with legal links) -> Recent Audits

## SEO / AEO
- robots.txt with AI crawler rules (GPTBot, ClaudeBot, PerplexityBot, etc.)
- sitemap.xml (homepage + /privacy + /terms + /refund)
- JSON-LD schemas: SoftwareApplication, Organization, WebSite, FAQPage, Review (4 testimonials)
- Canonical URL: https://aimarketaudit.com everywhere
- Google Analytics: G-28JKW0YJV8
- Enriched noscript fallback with full static HTML replica of all homepage sections

## Legal Pages
- /privacy - Privacy Policy
- /terms - Terms of Service
- /refund - Refund Policy
- All linked in homepage footer

## File Structure
- `shared/schema.ts` - Database schema (audits table with customer info, payment fields) + TypeScript types
- `server/db.ts` - Database connection
- `server/routes.ts` - API routes + audit pipeline + Stripe checkout + admin endpoints + robots.txt + sitemap.xml
- `server/stripeClient.ts` - Stripe client initialization (via Replit connector)
- `server/webhookHandlers.ts` - Stripe webhook processing + payment fulfillment
- `server/seed-products.ts` - Script to create Stripe product/price ($99 Full Marketing Audit Report)
- `server/scraper.ts` - Website scraping using Cheerio (multi-page discovery)
- `server/agents.ts` - 5 AI agent implementations using Anthropic
- `server/pdf.ts` - PDF report generation using PDFKit
- `server/storage.ts` - Database storage interface
- `client/src/pages/home.tsx` - Landing page with name/email/URL input + recent audits
- `client/src/pages/audit.tsx` - Audit results dashboard with paywall + progress view
- `client/src/pages/admin.tsx` - Admin dashboard with login, stats, and audit table
- `client/src/pages/privacy.tsx` - Privacy Policy page
- `client/src/pages/terms.tsx` - Terms of Service page
- `client/src/pages/refund.tsx` - Refund Policy page
- `client/src/App.tsx` - Router setup (/, /audit/:id, /admin, /privacy, /terms, /refund)
- `client/index.html` - Meta tags, OG tags, JSON-LD schemas, noscript fallback

## API Endpoints
- `POST /api/audits` - Start a new audit (requires url, customerName, customerEmail)
- `GET /api/audits` - List all audits
- `GET /api/audits/:id` - Get audit details (gated if unpaid)
- `GET /api/audits/:id/progress` - SSE progress stream
- `GET /api/audits/:id/pdf` - Download PDF report (requires payment)
- `POST /api/checkout` - Create Stripe checkout session for audit
- `POST /api/verify-payment` - Verify payment after Stripe redirect
- `POST /api/admin/login` - Admin login (returns token)
- `GET /api/admin/dashboard` - Admin dashboard data (requires token)
- `POST /api/stripe/webhook` - Stripe webhook endpoint

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - Anthropic API key (Replit managed)
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Anthropic base URL (Replit managed)
- `ADMIN_PASSWORD` - Password for admin dashboard access
- `SESSION_SECRET` - Session secret
- Stripe credentials are managed via Replit Stripe connector (no manual API keys needed)
