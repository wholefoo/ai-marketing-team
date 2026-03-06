import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedData } from "./scraper";
import type { AgentAnalysis, Finding, ActionItem } from "@shared/schema";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

function buildDataContext(data: ScrapedData): string {
  return `
WEBSITE DATA:
URL: ${data.url}
Title: ${data.title}
Meta Description: ${data.metaDescription}
Meta Keywords: ${data.metaKeywords}
Word Count: ${data.wordCount}
SSL: ${data.hasSSL}
Sitemap: ${data.hasSitemap}
Robots.txt: ${data.hasRobotsTxt}
Structured Data: ${data.structuredData}
Canonical URL: ${data.canonicalUrl}
Viewport: ${data.viewport}
Favicon: ${data.favicon}
Load Time: ${data.pageSpeed.loadTime}ms
Forms: ${data.forms}
Tech Stack: ${data.techStack.join(", ") || "Unknown"}
Social Links: ${data.socialLinks.join(", ") || "None"}
Contact Emails: ${data.contactInfo.emails.join(", ") || "None found"}
Contact Phones: ${data.contactInfo.phones.join(", ") || "None found"}
CTA Buttons Found: ${data.ctaButtons.join(", ") || "None"}
OG Tags: ${JSON.stringify(data.ogTags)}

HEADINGS:
${data.headings.map((h) => `${h.level}: ${h.text}`).join("\n")}

IMAGES (${data.images.length} total, ${data.images.filter((i) => !i.hasAlt).length} missing alt text)

LINKS: ${data.links.length} total (${data.links.filter((l) => l.isExternal).length} external)

PAGE CONTENT (first 5000 chars):
${data.textContent.substring(0, 5000)}
  `.trim();
}

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  content: `You are an expert Content & Messaging Analyst. Evaluate the website's brand voice, copy effectiveness, messaging clarity, and content quality. Focus on:
- Brand voice consistency and tone
- Headline effectiveness and clarity
- Value proposition communication
- Content structure and readability
- Emotional triggers and persuasion techniques
- Content gaps and opportunities

Provide your analysis as valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "findings": [
    {
      "severity": "<critical|high|medium|low>",
      "category": "Content & Messaging",
      "title": "<finding title>",
      "description": "<detailed description>",
      "recommendation": "<actionable recommendation>"
    }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}`,

  conversion: `You are an expert Conversion Optimization Specialist. Evaluate the website's user journey, conversion funnel, and UX effectiveness. Focus on:
- Call-to-action clarity and placement
- Form design and friction points
- Trust signals (testimonials, badges, guarantees)
- Navigation and user flow
- Mobile responsiveness indicators
- Page load speed impact on conversions

Provide your analysis as valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "findings": [
    {
      "severity": "<critical|high|medium|low>",
      "category": "Conversion Optimization",
      "title": "<finding title>",
      "description": "<detailed description>",
      "recommendation": "<actionable recommendation>"
    }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}`,

  seo: `You are an expert SEO & Discoverability Analyst. Audit the website's technical SEO, on-page optimization, and search visibility. Focus on:
- Title tag and meta description optimization
- Heading hierarchy (H1-H6 structure)
- Image alt text coverage
- Internal/external linking strategy
- Schema markup and structured data
- Sitemap and robots.txt presence
- Canonical URLs and duplicate content
- Page speed and Core Web Vitals indicators

Provide your analysis as valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "findings": [
    {
      "severity": "<critical|high|medium|low>",
      "category": "SEO & Discoverability",
      "title": "<finding title>",
      "description": "<detailed description>",
      "recommendation": "<actionable recommendation>"
    }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}`,

  competitive: `You are an expert Competitive Intelligence Analyst. Based on the website data, analyze the competitive landscape and positioning. Focus on:
- Market positioning and differentiation
- Unique selling propositions vs industry norms
- Pricing strategy indicators
- Brand authority signals
- Content marketing maturity
- Digital presence completeness (social, reviews, etc.)

Provide your analysis as valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "findings": [
    {
      "severity": "<critical|high|medium|low>",
      "category": "Competitive Intelligence",
      "title": "<finding title>",
      "description": "<detailed description>",
      "recommendation": "<actionable recommendation>"
    }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}`,

  strategy: `You are an expert Marketing Strategy Planner. Synthesize the website data into a comprehensive strategic roadmap. Focus on:
- Overall marketing maturity assessment
- Quick wins vs long-term investments
- Channel prioritization (SEO, paid, social, email)
- Budget allocation recommendations
- 6-month action plan with milestones
- ROI potential for each recommendation

Provide your analysis as valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "findings": [
    {
      "severity": "<critical|high|medium|low>",
      "category": "Strategy & Action Plan",
      "title": "<finding title>",
      "description": "<detailed description>",
      "recommendation": "<actionable recommendation>"
    }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}`,
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
  scrapedData: ScrapedData
): Promise<AgentAnalysis> {
  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentType];
  if (!systemPrompt) throw new Error(`Unknown agent type: ${agentType}`);

  const dataContext = buildDataContext(scrapedData);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Analyze this website and provide your expert assessment:\n\n${dataContext}`,
      },
    ],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  return parseAgentResponse(responseText);
}

export async function generateExecutiveSummary(
  url: string,
  analyses: Record<string, AgentAnalysis>,
  overallScore: number
): Promise<{ summary: string; actionPlan: ActionItem[] }> {
  const prompt = `Based on these marketing audit results for ${url} (Overall Score: ${overallScore}/100):

Content & Messaging (Score: ${analyses.content?.score || 0}/100): ${analyses.content?.summary || "N/A"}
Conversion Optimization (Score: ${analyses.conversion?.score || 0}/100): ${analyses.conversion?.summary || "N/A"}
SEO & Discoverability (Score: ${analyses.seo?.score || 0}/100): ${analyses.seo?.summary || "N/A"}
Competitive Intelligence (Score: ${analyses.competitive?.score || 0}/100): ${analyses.competitive?.summary || "N/A"}
Strategy & Action Plan (Score: ${analyses.strategy?.score || 0}/100): ${analyses.strategy?.summary || "N/A"}

Key Findings:
${Object.values(analyses)
  .flatMap((a) => a.findings || [])
  .filter((f) => f.severity === "critical" || f.severity === "high")
  .map((f) => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`)
  .join("\n")}

Provide a response as valid JSON:
{
  "summary": "<3-4 paragraph executive summary suitable for a client report>",
  "actionPlan": [
    {
      "priority": 1,
      "title": "<action title>",
      "description": "<what to do>",
      "timeline": "<Month 1|Month 1-2|Month 2-3|Month 3-4|Month 4-6>",
      "impact": "<High|Medium|Low>",
      "effort": "<High|Medium|Low>"
    }
  ]
}

Include 8-12 action items in the plan, ordered by priority.`;

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
  if (text.includes("shop") || text.includes("cart") || text.includes("product") || text.includes("buy")) return "E-commerce";
  if (text.includes("saas") || text.includes("software") || text.includes("platform") || text.includes("app")) return "SaaS";
  if (text.includes("restaurant") || text.includes("menu") || text.includes("dining")) return "Restaurant";
  if (text.includes("spa") || text.includes("salon") || text.includes("beauty") || text.includes("aesthetic")) return "Beauty & Wellness";
  if (text.includes("law") || text.includes("attorney") || text.includes("legal")) return "Legal Services";
  if (text.includes("real estate") || text.includes("property") || text.includes("listing")) return "Real Estate";
  if (text.includes("doctor") || text.includes("medical") || text.includes("health") || text.includes("clinic")) return "Healthcare";
  if (text.includes("agency") || text.includes("marketing") || text.includes("consulting")) return "Agency/Consulting";
  if (text.includes("course") || text.includes("learn") || text.includes("training") || text.includes("education")) return "Education";
  return "Business";
}
