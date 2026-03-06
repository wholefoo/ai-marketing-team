# MarketAudit AI

AI-Powered Marketing Audit & Strategy Web Application

## Overview
Users enter a website URL, and the app scrapes the site, then runs 5 specialized AI agents in parallel to produce a comprehensive marketing audit with an overall score, severity-coded findings, and a downloadable PDF report.

## Architecture
- **Frontend:** React + Tailwind CSS + shadcn/ui (Vite)
- **Backend:** Express.js (TypeScript)
- **Database:** PostgreSQL via Drizzle ORM
- **AI:** Anthropic Claude (via Replit AI Integrations)
- **PDF:** PDFKit
- **Web Scraping:** Cheerio + fetch

## Key Features
1. Website URL input with auto-scraping
2. 5 parallel AI agents: Content, Conversion, SEO, Competitive, Strategy
3. Real-time progress via SSE (Server-Sent Events)
4. Overall marketing score (0-100) with score breakdown
5. Severity-coded findings (Critical, High, Medium, Low)
6. Executive summary and 6-month action plan
7. Professional PDF report generation

## File Structure
- `shared/schema.ts` - Database schema (audits table) + TypeScript types
- `server/db.ts` - Database connection
- `server/routes.ts` - API routes + audit pipeline orchestration
- `server/scraper.ts` - Website scraping using Cheerio
- `server/agents.ts` - 5 AI agent implementations using Anthropic
- `server/pdf.ts` - PDF report generation using PDFKit
- `server/storage.ts` - Database storage interface
- `client/src/pages/home.tsx` - Landing page with URL input + recent audits
- `client/src/pages/audit.tsx` - Audit results dashboard with progress view
- `client/src/App.tsx` - Router setup

## API Endpoints
- `POST /api/audits` - Start a new audit
- `GET /api/audits` - List all audits
- `GET /api/audits/:id` - Get audit details
- `GET /api/audits/:id/progress` - SSE progress stream
- `GET /api/audits/:id/pdf` - Download PDF report

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - Anthropic API key (Replit managed)
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Anthropic base URL (Replit managed)
- `SESSION_SECRET` - Session secret
