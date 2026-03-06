# MarketAudit AI

AI-Powered Marketing Audit & Strategy Web Application

## Overview
Users enter a website URL, and the app scrapes the site, then runs 5 specialized AI agents in parallel to produce a comprehensive marketing audit with an overall score, severity-coded findings, and a downloadable PDF report.

## Architecture
- **Frontend:** React + Tailwind CSS + shadcn/ui (Vite)
- **Backend:** Express.js (TypeScript)
- **Database:** PostgreSQL via Drizzle ORM
- **AI:** Anthropic Claude (via Replit AI Integrations)
- **Payments:** Stripe (via Replit Stripe Integration)
- **PDF:** PDFKit
- **Web Scraping:** Cheerio + fetch

## Key Features
1. Website URL input with auto-scraping (discovers key pages: pricing, about, contact, services)
2. 5 parallel AI agents: Content, Conversion, SEO, Competitive, Strategy
3. Real-time progress via SSE (Server-Sent Events)
4. Overall marketing score (0-100) with score breakdown
5. Severity-coded findings (Critical, High, Medium, Low)
6. Executive summary and 6-month action plan
7. Professional PDF report generation
8. **Paywall:** Overview (scores, executive summary, critical/high findings) is free; detailed findings, agent reports, action plan, and PDF download require $99 one-time Stripe payment

## Paywall Architecture
- Free tier: Overall score, score breakdown, executive summary, critical & high findings
- Paid tier ($99): Full findings (all severities), detailed agent reports, 6-month action plan, PDF download
- Payment flow: Stripe Checkout (one-time payment) -> verify-payment endpoint -> unlock audit
- Server-side gating: /api/audits/:id strips gated data for unpaid audits
- Webhook-based fulfillment: checkout.session.completed marks audit as paid
- Security: stripeSessionId stored per audit, verify-payment validates session matches audit

## File Structure
- `shared/schema.ts` - Database schema (audits table with paid/stripeSessionId) + TypeScript types
- `server/db.ts` - Database connection
- `server/routes.ts` - API routes + audit pipeline + Stripe checkout/verify endpoints
- `server/stripeClient.ts` - Stripe client initialization (via Replit connector)
- `server/webhookHandlers.ts` - Stripe webhook processing + payment fulfillment
- `server/seed-products.ts` - Script to create Stripe product/price ($29 Full Marketing Audit Report)
- `server/scraper.ts` - Website scraping using Cheerio (multi-page discovery)
- `server/agents.ts` - 5 AI agent implementations using Anthropic
- `server/pdf.ts` - PDF report generation using PDFKit
- `server/storage.ts` - Database storage interface
- `client/src/pages/home.tsx` - Landing page with URL input + recent audits
- `client/src/pages/audit.tsx` - Audit results dashboard with paywall + progress view
- `client/src/App.tsx` - Router setup

## API Endpoints
- `POST /api/audits` - Start a new audit
- `GET /api/audits` - List all audits
- `GET /api/audits/:id` - Get audit details (gated if unpaid)
- `GET /api/audits/:id/progress` - SSE progress stream
- `GET /api/audits/:id/pdf` - Download PDF report (requires payment)
- `POST /api/checkout` - Create Stripe checkout session for audit
- `POST /api/verify-payment` - Verify payment after Stripe redirect
- `GET /api/stripe/publishable-key` - Get Stripe publishable key
- `POST /api/stripe/webhook` - Stripe webhook endpoint

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - Anthropic API key (Replit managed)
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Anthropic base URL (Replit managed)
- `SESSION_SECRET` - Session secret
- Stripe credentials are managed via Replit Stripe connector (no manual API keys needed)
