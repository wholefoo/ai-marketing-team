# AI Market Audit

An AI-powered marketing audit web application. Users enter their name, email, and a website URL to receive a comprehensive marketing audit produced by 5 parallel AI agents, with an overall score, severity-coded findings, and a downloadable PDF report.

---

## Features

### Audit Engine
- Scrapes the target website (multi-page discovery via Cheerio)
- Runs 5 AI agents in parallel using Anthropic Claude:
  - **Content** — copy quality, messaging, brand voice
  - **Conversion** — CTAs, lead capture, funnel friction
  - **SEO** — on-page SEO, meta tags, content structure
  - **Competitive** — market positioning, differentiation
  - **Strategy** — synthesized recommendations
- Real-time progress updates via Server-Sent Events (SSE)
- Overall score (0–100) with per-agent score breakdown
- Severity-coded findings: Critical, High, Medium, Low

### Paywall
- **Free:** overall score, score breakdown, executive summary, Critical + High findings
- **Paid ($99):** full findings, detailed agent reports, 6-month action plan, PDF download
- Stripe Checkout (one-time payment) with webhook-based fulfillment
- Server-side content gating — paid data is never sent to unpaid clients

### PDF Report
- Generated server-side with PDFKit
- Includes all findings, agent reports, score breakdown, and action plan

### Admin Dashboard (`/admin`)
- Password-protected (HMAC-signed token, 24-hour expiry)
- Stats: total audits, completed, paid, revenue, in-progress, errors
- Audit table with customer name, email, website, status, score, payment status, date
- Search/filter by name, email, URL, or business name
- Delete individual audits
- Auto-refreshes every 10 seconds

### AI Blog System
- Admin enters a topic; an AI agent writes a 1,200–2,000 word SEO-optimized article
- Enhanced content controls: niche (10 industries), content type (10 formats), audience (8 personas), tone (5 styles), word count
- "Suggest Topics" generates 8 trending topic ideas with search potential indicators (High/Medium/Low)
- Publish/unpublish, edit, delete posts
- Public routes: `/blog` (listing), `/blog/:slug` (post)
- AI-generated HTML sanitized via `sanitize-html` (XSS prevention)

### SEO / AEO
- `robots.txt` with rules for AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
- Dynamic `sitemap.xml` including blog posts and legal pages
- JSON-LD schemas: `SoftwareApplication`, `Organization`, `WebSite`, `FAQPage`, `Review`
- Open Graph and canonical meta tags on every page
- Google Analytics integration
- Full static `<noscript>` HTML fallback for crawlers

### Legal Pages
- `/privacy` — Privacy Policy
- `/terms` — Terms of Service
- `/refund` — Refund Policy

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS + shadcn/ui (Vite) |
| Backend | Express.js (TypeScript) |
| Database | PostgreSQL via Drizzle ORM |
| AI | Anthropic Claude (Replit AI Integration) |
| Payments | Stripe (Replit Stripe Integration) |
| PDF | PDFKit |
| Scraping | Cheerio + fetch |
| Routing | Wouter |
| Data fetching | TanStack Query v5 |

---

## Project Structure

```
├── client/src/
│   ├── pages/
│   │   ├── home.tsx          # Landing page + audit submission
│   │   ├── audit.tsx         # Audit results + paywall
│   │   ├── admin.tsx         # Admin dashboard
│   │   ├── blog-post.tsx     # Individual blog post
│   │   ├── privacy.tsx
│   │   ├── terms.tsx
│   │   └── refund.tsx
│   └── App.tsx               # Router
├── server/
│   ├── routes.ts             # All API routes
│   ├── agents.ts             # 5 AI agent implementations
│   ├── blogAgent.ts          # Blog content generation
│   ├── scraper.ts            # Website scraper
│   ├── pdf.ts                # PDF generation
│   ├── storage.ts            # Database interface
│   ├── stripeClient.ts       # Stripe client
│   ├── webhookHandlers.ts    # Stripe webhook processing
│   └── db.ts                 # Database connection
└── shared/
    └── schema.ts             # Drizzle schema + Zod types
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/audits` | Start a new audit |
| `GET` | `/api/audits/:id` | Get audit (gated if unpaid) |
| `GET` | `/api/audits/:id/progress` | SSE progress stream |
| `GET` | `/api/audits/:id/pdf` | Download PDF (paid only) |
| `POST` | `/api/checkout` | Create Stripe checkout session |
| `POST` | `/api/verify-payment` | Verify payment after redirect |
| `POST` | `/api/admin/login` | Admin login |
| `GET` | `/api/admin/dashboard` | Dashboard data |
| `DELETE` | `/api/admin/audit/:id` | Delete an audit |
| `POST` | `/api/stripe/webhook` | Stripe webhook |
| `GET` | `/api/blog` | Published blog posts |
| `GET` | `/api/blog/:slug` | Single blog post |
| `GET` | `/api/admin/blog/config` | Blog generation options |
| `POST` | `/api/admin/blog/trending` | AI topic suggestions |

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_PASSWORD` | Admin dashboard password |
| `SESSION_SECRET` | Token signing secret |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Managed by Replit |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Managed by Replit |

Stripe credentials are managed via the Replit Stripe connector — no manual API keys required.

---

## Development

```bash
npm run dev
```

Starts the Express backend and Vite frontend on the same port.
