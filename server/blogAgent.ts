import Anthropic from "@anthropic-ai/sdk";
import sanitizeHtml from "sanitize-html";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

interface BlogPostDraft {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
}

export interface GenerateOptions {
  topic: string;
  niche?: string;
  contentType?: string;
  targetAudience?: string;
  tone?: string;
  wordCount?: string;
}

export const NICHES = [
  { id: "saas", label: "SaaS & Software", keywords: "software companies, SaaS startups, product-led growth" },
  { id: "ecommerce", label: "E-commerce & DTC", keywords: "online stores, direct-to-consumer brands, Shopify merchants" },
  { id: "agency", label: "Marketing Agencies", keywords: "digital agencies, freelance marketers, consultants" },
  { id: "local", label: "Local Business", keywords: "brick-and-mortar, local SEO, service businesses, restaurants" },
  { id: "b2b", label: "B2B & Enterprise", keywords: "B2B companies, enterprise sales, lead generation" },
  { id: "health", label: "Health & Wellness", keywords: "healthcare, fitness, wellness brands, clinics" },
  { id: "finance", label: "Finance & Fintech", keywords: "financial services, fintech, insurance, lending" },
  { id: "realestate", label: "Real Estate", keywords: "real estate agents, property management, listings" },
  { id: "education", label: "Education & Coaching", keywords: "online courses, coaching, edtech, training" },
  { id: "nonprofit", label: "Nonprofit & Advocacy", keywords: "nonprofits, charities, fundraising, advocacy" },
];

export const CONTENT_TYPES = [
  { id: "howto", label: "How-To Guide", description: "Step-by-step actionable instructions" },
  { id: "listicle", label: "Listicle", description: "Numbered list of tips, tools, or strategies" },
  { id: "casestudy", label: "Case Study Analysis", description: "Deep-dive analysis of a real scenario" },
  { id: "comparison", label: "Comparison / vs.", description: "Side-by-side comparison of approaches or tools" },
  { id: "mistakes", label: "Common Mistakes", description: "Pitfalls to avoid with expert solutions" },
  { id: "trends", label: "Trends & Predictions", description: "Industry trends and forward-looking insights" },
  { id: "checklist", label: "Checklist / Audit", description: "Comprehensive checklist readers can follow" },
  { id: "datadriven", label: "Data-Driven Analysis", description: "Statistics and research-backed insights" },
  { id: "beginner", label: "Beginner's Guide", description: "Foundational explainer for newcomers" },
  { id: "advanced", label: "Advanced Strategy", description: "Expert-level tactics for experienced marketers" },
];

export const TARGET_AUDIENCES = [
  { id: "founder", label: "Startup Founders / CEOs" },
  { id: "marketer", label: "Marketing Managers" },
  { id: "smallbiz", label: "Small Business Owners" },
  { id: "freelancer", label: "Freelancers & Solopreneurs" },
  { id: "cmo", label: "CMOs / VPs of Marketing" },
  { id: "developer", label: "Developer-Marketers" },
  { id: "ecomowner", label: "E-commerce Store Owners" },
  { id: "agencyowner", label: "Agency Owners" },
];

export const TONES = [
  { id: "educational", label: "Educational & Authoritative" },
  { id: "conversational", label: "Conversational & Relatable" },
  { id: "urgent", label: "Urgent & Action-Oriented" },
  { id: "analytical", label: "Analytical & Data-Driven" },
  { id: "storytelling", label: "Storytelling & Narrative" },
];

export async function suggestTrendingTopics(niche?: string, count: number = 8): Promise<{ topic: string; angle: string; searchPotential: string }[]> {
  const nicheContext = niche
    ? `Focus on the "${NICHES.find(n => n.id === niche)?.label || niche}" niche (${NICHES.find(n => n.id === niche)?.keywords || niche}).`
    : "Cover a diverse mix of business niches.";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: `You are a content strategist for AI Market Audit, an AI-powered marketing audit tool ($99/audit). Suggest trending, high-search-potential blog topics that would attract businesses needing marketing audits. ${nicheContext}`,
    messages: [{
      role: "user",
      content: `Suggest ${count} trending blog post topics that would perform well for SEO and attract potential customers for a marketing audit tool. For each topic, include:
- A specific, compelling topic title
- A unique angle or hook that makes it stand out
- An estimate of search potential (high/medium/low)

Focus on topics that are currently trending or have evergreen search demand. Think about pain points, seasonal trends, algorithm updates, industry shifts, and common marketing challenges.

Return as a JSON array:
[{"topic": "...", "angle": "...", "searchPotential": "high|medium|low"}]

Return ONLY the JSON array, no other text.`
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

export async function researchAndWritePost(options: GenerateOptions | string): Promise<BlogPostDraft> {
  const opts: GenerateOptions = typeof options === "string" ? { topic: options } : options;
  const { topic, niche, contentType, targetAudience, tone, wordCount } = opts;

  const nicheInfo = niche ? NICHES.find(n => n.id === niche) : null;
  const contentTypeInfo = contentType ? CONTENT_TYPES.find(c => c.id === contentType) : null;
  const audienceInfo = targetAudience ? TARGET_AUDIENCES.find(a => a.id === targetAudience) : null;
  const toneInfo = tone ? TONES.find(t => t.id === tone) : null;
  const targetWords = wordCount === "short" ? "800-1200" : wordCount === "long" ? "2000-3000" : "1200-2000";

  const nicheDirective = nicheInfo
    ? `Target niche: ${nicheInfo.label} (${nicheInfo.keywords}). Tailor examples, pain points, and language specifically to this industry.`
    : "";
  const contentTypeDirective = contentTypeInfo
    ? `Content format: ${contentTypeInfo.label} - ${contentTypeInfo.description}. Structure the article accordingly.`
    : "";
  const audienceDirective = audienceInfo
    ? `Target reader: ${audienceInfo.label}. Write at their level of expertise and address their specific concerns and decision-making context.`
    : "";
  const toneDirective = toneInfo
    ? `Writing tone: ${toneInfo.label}. Maintain this tone consistently throughout the article.`
    : "";

  const systemPrompt = `You are a senior content marketing strategist and SEO copywriter for AI Market Audit (https://aimarketaudit.com), an AI-powered marketing audit tool that costs $99 per audit.

The tool works by having 5 specialized AI agents analyze a website in parallel:
1. Content & Messaging - evaluates copy, value proposition, brand voice
2. Conversion Optimization - examines CTAs, forms, user journey friction
3. SEO & Discoverability - reviews technical SEO, keywords, metadata
4. Competitive Intelligence - benchmarks against industry standards
5. Strategy & Action Plan - synthesizes findings into a prioritized roadmap

Users get a free preview (overall score, category breakdown, executive summary, critical findings) and can unlock the full report with all findings, detailed agent analyses, 6-month action plan, and PDF download for $99.

Your job is to research a business pain point topic and write a comprehensive, SEO-optimized blog article that:
- Educates readers about the pain point with real-world context and data
- Demonstrates expertise and builds trust (E-E-A-T)
- Naturally shows how AI Market Audit helps solve the problem
- Includes a clear call-to-action to try the tool
- Is ${targetWords} words long
- Uses proper heading hierarchy (H2, H3) with keyword-rich headings
- Includes actionable takeaways readers can implement immediately
- Avoids salesy language; focuses on providing genuine value first

${nicheDirective}
${contentTypeDirective}
${audienceDirective}
${toneDirective}

Do NOT use emojis anywhere in the article.

Return your response as a JSON object with these exact fields:
{
  "title": "SEO-optimized title (50-65 chars ideal)",
  "slug": "url-friendly-slug",
  "metaDescription": "Compelling meta description under 155 chars",
  "excerpt": "2-3 sentence preview for blog listing (under 200 chars)",
  "content": "Full article in HTML format using <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em> tags. No <h1> tag (that comes from the title). Include a CTA paragraph near the end.",
  "category": "One of: SEO, Content Marketing, Conversion Optimization, Competitive Analysis, Marketing Strategy, Growth, E-commerce, SaaS",
  "tags": ["array", "of", "5-8", "relevant", "keywords"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Research and write a comprehensive blog article about this business pain point / topic:\n\n"${topic}"\n\nMake the article highly relevant to businesses and marketers who would benefit from a marketing audit. Ground it in real challenges and practical solutions.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse blog post from AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as BlogPostDraft;

  if (!parsed.title || !parsed.content || !parsed.slug) {
    throw new Error("AI response missing required fields (title, content, slug)");
  }

  parsed.slug = parsed.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  parsed.content = sanitizeHtml(parsed.content, {
    allowedTags: ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "a", "br", "blockquote"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["https", "http", "mailto"],
  });

  return parsed;
}
