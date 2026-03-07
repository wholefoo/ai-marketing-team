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

export async function researchAndWritePost(topic: string): Promise<BlogPostDraft> {
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
- Is 1200-2000 words long
- Uses proper heading hierarchy (H2, H3) with keyword-rich headings
- Includes actionable takeaways readers can implement immediately
- Avoids salesy language; focuses on providing genuine value first

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
