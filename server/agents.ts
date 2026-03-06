import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedData } from "./scraper";
import type { AgentAnalysis, Finding, ActionItem } from "@shared/schema";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

function buildDataContext(data: ScrapedData, businessType: string): string {
  let context = `
WEBSITE DATA:
URL: ${data.url}
Business Type: ${businessType}
Title: ${data.title}
Meta Description: ${data.metaDescription}
Meta Keywords: ${data.metaKeywords}
Word Count: ${data.wordCount}
SSL: ${data.hasSSL}
Sitemap: ${data.hasSitemap}
Robots.txt: ${data.hasRobotsTxt}
Structured Data: ${data.structuredData} ${data.structuredDataTypes.length ? `(Types: ${data.structuredDataTypes.join(", ")})` : ""}
Canonical URL: ${data.canonicalUrl}
Viewport: ${data.viewport}
Favicon: ${data.favicon}
Load Time: ${data.pageSpeed.loadTime}ms
Forms: ${data.forms}
Tech Stack: ${data.techStack.join(", ") || "Unknown"}
Social Links: ${data.socialLinks.join(", ") || "None"}
Contact Emails: ${data.contactInfo.emails.join(", ") || "None found"}
Contact Phones: ${data.contactInfo.phones.join(", ") || "None found"}
CTA Buttons Found: ${data.ctaButtons.join(" | ") || "None"}
OG Tags: ${JSON.stringify(data.ogTags)}

HEADINGS:
${data.headings.map((h) => `${h.level}: ${h.text}`).join("\n")}

IMAGES (${data.images.length} total, ${data.images.filter((i) => !i.hasAlt).length} missing alt text)

LINKS: ${data.links.length} total (${data.links.filter((l) => l.isExternal).length} external)

TRUST SIGNALS FOUND: ${data.trustSignals.length > 0 ? data.trustSignals.join(" | ") : "None detected"}

TESTIMONIALS FOUND: ${data.testimonials.length > 0 ? data.testimonials.slice(0, 5).join(" | ") : "None detected"}

PRICING INFORMATION: ${data.pricingInfo || "None found on homepage"}

PAGE CONTENT (first 5000 chars):
${data.textContent.substring(0, 5000)}
  `.trim();

  if (data.keyPages.length > 0) {
    context += "\n\nKEY PAGES DISCOVERED:";
    data.keyPages.forEach((page) => {
      context += `\n\n--- ${page.title || page.url} ---\nURL: ${page.url}\nHeadings: ${page.headings.map((h) => `${h.level}: ${h.text}`).join(", ")}\nCTAs: ${page.ctaButtons.join(" | ") || "None"}\nForms: ${page.forms}\nContent Preview: ${page.content.substring(0, 1500)}`;
    });
  }

  return context;
}

const JSON_SCHEMA = `
Provide your analysis as valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "findings": [
    {
      "severity": "<critical|high|medium|low>",
      "category": "<your agent category>",
      "title": "<concise finding title>",
      "description": "<detailed description explaining the issue and its business impact>",
      "recommendation": "<specific, actionable recommendation the business can implement>"
    }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}

IMPORTANT SCORING GUIDELINES:
- 90-100: Exceptional, best-in-class execution
- 75-89: Strong performance with minor gaps
- 60-74: Adequate but significant room for improvement
- 40-59: Below average with notable issues
- 20-39: Poor, major overhaul needed
- 0-19: Critical failures across the board

Be honest and precise. Do not inflate scores. Provide 4-8 findings with a mix of severities. Each finding must have a specific, actionable recommendation.`;

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  content: `You are a senior Content & Messaging Strategist at a top-tier marketing agency. Your specialty is analyzing brand voice, copy effectiveness, and messaging architecture across digital properties.

ANALYSIS FRAMEWORK:
1. BRAND VOICE AUDIT
   - Is the tone consistent across all pages (homepage, about, pricing, services)?
   - Does the voice match the target audience for this business type?
   - Are there jarring shifts in formality, personality, or style between sections?
   - Flag as CRITICAL if pricing language contradicts messaging elsewhere (e.g., "affordable" on homepage but premium pricing on pricing page)

2. HEADLINE & COPY EFFECTIVENESS
   - Does the H1 clearly communicate what the business does within 3 seconds?
   - Are headlines benefit-oriented or feature-oriented? (benefit is better)
   - Is there a clear value proposition above the fold?
   - Does the copy use "you/your" language or self-focused "we/our" language?

3. CONTENT STRUCTURE
   - Is content scannable with proper heading hierarchy?
   - Are paragraphs concise (under 4 lines)?
   - Is there sufficient content depth for SEO and user education?
   - Are there content gaps? (e.g., missing FAQ, no blog, no case studies)

4. PERSUASION & EMOTIONAL TRIGGERS
   - Does the copy address pain points?
   - Are there urgency or scarcity elements?
   - Is social proof integrated naturally into the messaging?
   - Does the messaging tell a story or just list features?

5. CONSISTENCY CHECK
   - Compare messaging across discovered pages for contradictions
   - Check if the business name, tagline, and key phrases are used consistently
   - Look for outdated references or stale content signals

${JSON_SCHEMA}`,

  conversion: `You are a senior Conversion Rate Optimization (CRO) Specialist who has optimized funnels for hundreds of businesses. Your focus is identifying friction in the user journey that prevents visitors from becoming customers.

ANALYSIS FRAMEWORK:
1. USER JOURNEY MAPPING
   - Can a visitor understand WHAT the business does, WHO it's for, and HOW to buy/book within 10 seconds?
   - Is the path from landing to conversion (buy/book/contact) clear and minimal-click?
   - Are there dead ends or confusing navigation paths?
   - For this business type, what is the primary conversion action? Is it prominently displayed?

2. CALL-TO-ACTION (CTA) AUDIT
   - Is there a primary CTA above the fold?
   - Are CTAs using action-oriented language? ("Get Your Free Quote" > "Submit")
   - Is there CTA repetition throughout long pages?
   - Do CTAs stand out visually or blend into the design?
   - Are there competing CTAs that confuse the user?

3. FRICTION POINT ANALYSIS
   - How many form fields are required? (fewer = better for conversion)
   - Is there a phone number or live chat for people who want to talk?
   - Are prices visible or hidden behind forms? (transparency = trust)
   - Is the booking/buying process clear from the homepage?
   - Any popups, interstitials, or distractions that could cause bounce?

4. TRUST & CREDIBILITY SIGNALS
   - Are testimonials present with real names/photos/company names?
   - Are there security badges, guarantees, or certifications?
   - Is there a privacy policy, terms of service?
   - Are results/outcomes quantified? ("500+ clients served", "98% satisfaction")
   - Are trust elements placed near conversion points?

5. MOBILE & SPEED CONSIDERATIONS
   - Does the page load under 3 seconds? (check load time data)
   - Is the viewport properly configured for mobile?
   - Are click targets appropriately sized for mobile users?
   - Is the most important content visible without scrolling on mobile?

${JSON_SCHEMA}`,

  seo: `You are a senior SEO Technical Auditor with deep expertise in on-page optimization, technical SEO, and search visibility. You analyze websites the way Google's crawlers do.

ANALYSIS FRAMEWORK:
1. TECHNICAL SEO FOUNDATIONS
   - Title tag: Present? Under 60 chars? Contains target keyword?
   - Meta description: Present? Under 160 chars? Compelling with CTA?
   - Heading hierarchy: Single H1? Logical H2-H6 structure? Keywords in headings?
   - Canonical URL: Set correctly? Self-referencing?
   - Viewport meta tag: Properly configured for mobile-first indexing?
   - SSL/HTTPS: Active? Mixed content issues?
   - Favicon: Present? (signals professionalism to Google)

2. CONTENT & KEYWORD OPTIMIZATION
   - Is the content substantial enough for ranking? (300+ words minimum, 1000+ ideal)
   - Are target keywords naturally integrated?
   - Is there keyword stuffing or thin content?
   - Are images optimized with descriptive alt text?
   - Is there duplicate content risk?

3. STRUCTURED DATA & RICH RESULTS
   - Is JSON-LD schema markup present? What types?
   - For this business type, what schema types SHOULD be present?
     - Local Business: LocalBusiness, OpeningHours, AggregateRating
     - E-commerce: Product, Offer, AggregateRating, BreadcrumbList
     - SaaS: SoftwareApplication, FAQPage, Organization
     - Service: Service, FAQPage, HowTo
   - Is there FAQ schema for FAQ content?
   - Flag missing schema as HIGH severity - it's a significant competitive disadvantage

4. CRAWLABILITY & INDEXATION
   - Robots.txt: Present and properly configured?
   - Sitemap.xml: Present? Referenced in robots.txt?
   - Internal linking: Is there a logical link structure?
   - Broken or orphan pages: Any indicators?

5. LOCAL SEO (if applicable)
   - NAP (Name, Address, Phone) consistency
   - Google Business Profile signals
   - Location-specific keywords
   - Local schema markup

6. PAGE SPEED & CORE WEB VITALS
   - Evaluate load time against benchmarks (under 2.5s = good, 2.5-4s = needs improvement, 4s+ = poor)
   - Check for render-blocking resources indicators
   - Image optimization signals

${JSON_SCHEMA}`,

  competitive: `You are a senior Competitive Intelligence Analyst specializing in digital market positioning. You assess how businesses stack up against their competitive landscape and identify strategic gaps.

ANALYSIS FRAMEWORK:
1. COMPETITIVE TIER IDENTIFICATION
   Based on the business type and market signals, identify THREE tiers of competitors:
   - DIRECT competitors: Same service/product, same market area
   - INDIRECT competitors: Different approach to solving the same problem
   - ASPIRATIONAL competitors: Industry leaders this business should model
   Provide specific examples in each tier based on the business type and location.

2. MARKET POSITIONING ASSESSMENT
   - Where does this business position itself? (premium, mid-market, budget)
   - Is the positioning clear and differentiated?
   - Does the brand communicate WHY a customer should choose them over alternatives?
   - Is there a unique selling proposition (USP) or are they a "me too" player?

3. SOCIAL PROOF & AUTHORITY COMPARISON
   - How many social media channels are active? (compare to industry standard)
   - Are reviews/testimonials prominent? How many? Quality?
   - Is there thought leadership content (blog, resources, case studies)?
   - Industry awards, certifications, or partnerships mentioned?
   - Press coverage or media mentions?

4. PRICING STRATEGY ANALYSIS
   - Is pricing visible or hidden? (transparency is a competitive advantage)
   - How does pricing compare to industry benchmarks for this business type?
   - Are there clear pricing tiers or packages?
   - Is value communicated relative to price (ROI messaging)?

5. DIGITAL MATURITY SCORING
   - Website quality vs industry standard (1-10)
   - Content marketing maturity (none / basic / intermediate / advanced)
   - Marketing technology stack sophistication (analytics, CRM, email, etc.)
   - Social media presence quality and engagement indicators

6. COMPETITIVE GAPS & OPPORTUNITIES
   - What are competitors likely doing that this business is NOT?
   - What quick wins could give immediate competitive advantage?
   - What long-term strategic investments would change market position?

${JSON_SCHEMA}`,

  strategy: `You are a senior Marketing Strategy Director who creates actionable roadmaps for businesses. You synthesize data into clear strategic recommendations that balance quick wins with long-term growth.

ANALYSIS FRAMEWORK:
1. MARKETING MATURITY ASSESSMENT
   - Rate overall digital marketing maturity: Beginner / Developing / Established / Advanced
   - Identify the 1-2 biggest bottlenecks holding this business back
   - Assess the gap between current state and industry best practices

2. QUICK WINS (implementable in 1-2 weeks)
   - Technical fixes (missing meta tags, broken elements, SSL issues)
   - Copy improvements (headline rewrites, CTA optimization)
   - Trust signal additions (testimonials, badges, guarantees)
   - Google Business Profile optimization (for local businesses)
   - These should be LOW EFFORT / HIGH IMPACT items

3. STRATEGIC GAINS (1-6 month initiatives)
   - Content strategy development (blog, resources, case studies)
   - SEO optimization program
   - Conversion funnel redesign
   - Email marketing setup
   - Social media strategy
   - Paid advertising readiness

4. CHANNEL PRIORITIZATION
   Based on the business type, recommend the top 3 marketing channels in priority order:
   - Local Business: Google Business Profile > Local SEO > Social Media
   - E-commerce: SEO > Paid Ads > Email Marketing
   - SaaS: Content Marketing > SEO > Paid Ads
   - Service Business: Local SEO > Referral Program > Content Marketing
   Explain WHY each channel is prioritized for this specific business.

5. BUDGET ALLOCATION RECOMMENDATION
   - If the business were to invest $1000/mo, $3000/mo, or $5000/mo in marketing, how should they allocate it?
   - What is the expected ROI timeline for each investment level?

6. 6-MONTH ROADMAP
   - Month 1: Foundation & Quick Wins
   - Month 2-3: Core Infrastructure
   - Month 3-4: Growth Engine Activation
   - Month 4-6: Scale & Optimize
   Each phase should have 2-3 specific, measurable action items.

${JSON_SCHEMA}`,
};

function parseAgentResponse(text: string): AgentAnalysis {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Math.min(100, Math.max(0, parsed.score || 50)),
      summary: parsed.summary || "Analysis complete.",
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      findings: (parsed.findings || []).map((f: any) => ({
        severity: f.severity || "medium",
        category: f.category || "General",
        title: f.title || "Finding",
        description: f.description || "",
        recommendation: f.recommendation || "",
      })),
      recommendations: parsed.recommendations || [],
    };
  } catch (e) {
    console.error("Failed to parse agent response:", e);
    return {
      score: 50,
      summary: "Analysis encountered parsing issues but completed.",
      strengths: [],
      weaknesses: [],
      findings: [],
      recommendations: [],
    };
  }
}

export async function runAgent(
  agentType: string,
  scrapedData: ScrapedData,
  businessType: string
): Promise<AgentAnalysis> {
  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentType];
  if (!systemPrompt) throw new Error(`Unknown agent type: ${agentType}`);

  const dataContext = buildDataContext(scrapedData, businessType);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Analyze this ${businessType} website and provide your expert assessment. Be thorough, specific, and actionable. Reference actual content from the website in your findings.\n\n${dataContext}`,
      },
    ],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  return parseAgentResponse(responseText);
}

export async function generateExecutiveSummary(
  url: string,
  businessType: string,
  analyses: Record<string, AgentAnalysis>,
  overallScore: number
): Promise<{ summary: string; actionPlan: ActionItem[] }> {
  const allFindings = Object.values(analyses).flatMap((a) => a.findings || []);
  const criticalFindings = allFindings.filter((f) => f.severity === "critical");
  const highFindings = allFindings.filter((f) => f.severity === "high");

  const prompt = `You are writing a professional executive summary for a marketing audit report. This report will be presented to the business owner/decision maker. It should be persuasive, specific, and action-oriented.

AUDIT RESULTS for ${url} (${businessType}):
Overall Marketing Score: ${overallScore}/100

Agent Scores:
- Content & Messaging: ${analyses.content?.score || 0}/100 - ${analyses.content?.summary || "N/A"}
- Conversion Optimization: ${analyses.conversion?.score || 0}/100 - ${analyses.conversion?.summary || "N/A"}
- SEO & Discoverability: ${analyses.seo?.score || 0}/100 - ${analyses.seo?.summary || "N/A"}
- Competitive Intelligence: ${analyses.competitive?.score || 0}/100 - ${analyses.competitive?.summary || "N/A"}
- Strategy & Planning: ${analyses.strategy?.score || 0}/100 - ${analyses.strategy?.summary || "N/A"}

CRITICAL Issues (${criticalFindings.length}):
${criticalFindings.map((f) => `- ${f.title}: ${f.description}`).join("\n") || "None"}

HIGH Priority Issues (${highFindings.length}):
${highFindings.map((f) => `- ${f.title}: ${f.description}`).join("\n") || "None"}

Key Strengths:
${Object.values(analyses).flatMap((a) => a.strengths || []).slice(0, 5).map((s) => `- ${s}`).join("\n")}

Write a JSON response with:
{
  "summary": "<Write a 3-4 paragraph executive summary. Paragraph 1: Hook - lead with the score and what it means for their business. Paragraph 2: The biggest issues found and their business impact (lost revenue, missed customers). Paragraph 3: The opportunities - what they could gain by fixing these issues. Paragraph 4: A call to action framing the roadmap as their path forward. Write in a professional, consultative tone. Be specific - reference actual findings from the audit. Make the business owner feel the urgency but also the opportunity.>",
  "actionPlan": [
    {
      "priority": <number>,
      "title": "<specific action title>",
      "description": "<2-3 sentences describing what to do and why it matters>",
      "timeline": "<Month 1|Month 1-2|Month 2-3|Month 3-4|Month 4-6>",
      "impact": "<High|Medium|Low>",
      "effort": "<High|Medium|Low>"
    }
  ]
}

ACTION PLAN RULES:
- Include 8-12 items ordered by priority (quick wins first, strategic gains later)
- First 2-3 items should be "Quick Wins" (Month 1, Low effort, High impact)
- Middle items should be "Core Improvements" (Month 1-3, Medium effort)
- Final items should be "Strategic Investments" (Month 3-6, Higher effort)
- Every item must be specific to THIS business - no generic advice
- Include estimated impact: "This could increase conversions by X%" or "This addresses Y% of your traffic"`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary || "Executive summary generation failed.",
      actionPlan: parsed.actionPlan || [],
    };
  } catch {
    return {
      summary: "The marketing audit has been completed. Please review the individual agent reports for detailed findings.",
      actionPlan: [],
    };
  }
}

export function detectBusinessType(data: ScrapedData): string {
  const text = (data.textContent + " " + data.title + " " + data.metaDescription).toLowerCase();

  const signals: Record<string, number> = {
    "E-commerce": 0,
    "SaaS": 0,
    "Restaurant": 0,
    "Beauty & Wellness": 0,
    "Legal Services": 0,
    "Real Estate": 0,
    "Healthcare": 0,
    "Agency/Consulting": 0,
    "Education/Course": 0,
    "Local Service Business": 0,
    "Non-Profit": 0,
    "Finance": 0,
  };

  const ecommerceTerms = ["shop", "cart", "product", "buy now", "add to cart", "checkout", "store", "merchandise", "shipping", "inventory"];
  const saasTerms = ["saas", "software", "platform", "dashboard", "api", "integration", "workflow", "automation", "enterprise", "subscription", "free trial", "demo"];
  const restaurantTerms = ["restaurant", "menu", "dining", "reservation", "cuisine", "chef", "dine", "takeout", "delivery"];
  const beautyTerms = ["spa", "salon", "beauty", "aesthetic", "skincare", "facial", "treatment", "wellness", "botox", "cosmetic", "medspa"];
  const legalTerms = ["law firm", "attorney", "lawyer", "legal", "litigation", "counsel", "practice areas", "case"];
  const realEstateTerms = ["real estate", "property", "listing", "homes for sale", "realtor", "mortgage", "rental"];
  const healthcareTerms = ["doctor", "medical", "health", "clinic", "patient", "appointment", "physician", "hospital", "dental", "therapy"];
  const agencyTerms = ["agency", "marketing agency", "consulting", "consultant", "strategy", "branding", "creative agency"];
  const educationTerms = ["course", "learn", "training", "education", "enroll", "curriculum", "workshop", "masterclass", "coaching"];
  const localServiceTerms = ["plumbing", "hvac", "roofing", "cleaning", "landscaping", "painting", "moving", "repair", "installation", "contractor"];
  const nonprofitTerms = ["donate", "nonprofit", "charity", "volunteer", "mission", "cause", "foundation"];
  const financeTerms = ["financial", "investment", "wealth", "banking", "insurance", "advisor", "accounting", "tax"];

  const countMatches = (terms: string[]) => terms.filter((t) => text.includes(t)).length;

  signals["E-commerce"] = countMatches(ecommerceTerms);
  signals["SaaS"] = countMatches(saasTerms);
  signals["Restaurant"] = countMatches(restaurantTerms);
  signals["Beauty & Wellness"] = countMatches(beautyTerms);
  signals["Legal Services"] = countMatches(legalTerms);
  signals["Real Estate"] = countMatches(realEstateTerms);
  signals["Healthcare"] = countMatches(healthcareTerms);
  signals["Agency/Consulting"] = countMatches(agencyTerms);
  signals["Education/Course"] = countMatches(educationTerms);
  signals["Local Service Business"] = countMatches(localServiceTerms);
  signals["Non-Profit"] = countMatches(nonprofitTerms);
  signals["Finance"] = countMatches(financeTerms);

  let bestType = "Business";
  let bestScore = 0;
  for (const [type, score] of Object.entries(signals)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestScore >= 2 ? bestType : "Business";
}
