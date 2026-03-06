import * as cheerio from "cheerio";

export interface ScrapedData {
  url: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  ogTags: Record<string, string>;
  headings: { level: string; text: string }[];
  links: { href: string; text: string; isExternal: boolean }[];
  images: { src: string; alt: string; hasAlt: boolean }[];
  textContent: string;
  wordCount: number;
  hasSSL: boolean;
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  ctaButtons: string[];
  forms: number;
  socialLinks: string[];
  contactInfo: { emails: string[]; phones: string[] };
  techStack: string[];
  pageSpeed: { loadTime: number };
  structuredData: boolean;
  canonicalUrl: string;
  viewport: string;
  favicon: boolean;
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  const startTime = Date.now();

  const response = await fetch(normalizedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MarketingAuditBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  const loadTime = Date.now() - startTime;

  if (!response.ok) {
    throw new Error(`Website returned HTTP ${response.status} (${response.statusText}). The site may be unreachable or blocking automated requests.`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const baseUrl = new URL(normalizedUrl);

  const title = $("title").text().trim() || "";
  const metaDescription = $('meta[name="description"]').attr("content") || "";
  const metaKeywords = $('meta[name="keywords"]').attr("content") || "";

  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr("property") || "";
    ogTags[prop] = $(el).attr("content") || "";
  });

  const headings: { level: string; text: string }[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    headings.push({
      level: el.tagName.toLowerCase(),
      text: $(el).text().trim().substring(0, 200),
    });
  });

  const links: { href: string; text: string; isExternal: boolean }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim().substring(0, 100);
    try {
      const linkUrl = new URL(href, normalizedUrl);
      links.push({
        href: linkUrl.href,
        text,
        isExternal: linkUrl.hostname !== baseUrl.hostname,
      });
    } catch {
      links.push({ href, text, isExternal: false });
    }
  });

  const images: { src: string; alt: string; hasAlt: boolean }[] = [];
  $("img").each((_, el) => {
    images.push({
      src: $(el).attr("src") || "",
      alt: $(el).attr("alt") || "",
      hasAlt: !!$(el).attr("alt"),
    });
  });

  const textContent = $("body").text().replace(/\s+/g, " ").trim().substring(0, 10000);
  const wordCount = textContent.split(/\s+/).length;

  const ctaButtons: string[] = [];
  $('a, button, [role="button"]').each((_, el) => {
    const text = $(el).text().trim();
    const ctaKeywords = ["buy", "sign up", "get started", "contact", "book", "schedule", "call", "free", "try", "start", "order", "subscribe", "register", "download", "learn more", "shop"];
    if (ctaKeywords.some((kw) => text.toLowerCase().includes(kw))) {
      ctaButtons.push(text.substring(0, 100));
    }
  });

  const forms = $("form").length;

  const socialLinks: string[] = [];
  const socialDomains = ["facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com", "youtube.com", "tiktok.com", "pinterest.com"];
  links.forEach((link) => {
    if (socialDomains.some((domain) => link.href.includes(domain))) {
      socialLinks.push(link.href);
    }
  });

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?1?\s*\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4})/g;
  const emails = [...new Set(textContent.match(emailRegex) || [])];
  const phones = [...new Set(textContent.match(phoneRegex) || [])];

  const techStack: string[] = [];
  if (html.includes("wp-content") || html.includes("wordpress")) techStack.push("WordPress");
  if (html.includes("shopify")) techStack.push("Shopify");
  if (html.includes("squarespace")) techStack.push("Squarespace");
  if (html.includes("wix.com")) techStack.push("Wix");
  if ($('script[src*="react"]').length) techStack.push("React");
  if ($('script[src*="jquery"]').length) techStack.push("jQuery");
  if ($('script[src*="gtag"]').length || $('script[src*="analytics"]').length) techStack.push("Google Analytics");
  if ($('script[src*="fbevents"]').length || html.includes("fbq(")) techStack.push("Facebook Pixel");
  if ($('link[href*="bootstrap"]').length) techStack.push("Bootstrap");

  const structuredData = $('script[type="application/ld+json"]').length > 0;
  const canonicalUrl = $('link[rel="canonical"]').attr("href") || "";
  const viewport = $('meta[name="viewport"]').attr("content") || "";
  const favicon = $('link[rel="icon"]').length > 0 || $('link[rel="shortcut icon"]').length > 0;

  let hasSitemap = false;
  let hasRobotsTxt = false;
  try {
    const robotsRes = await fetch(`${baseUrl.origin}/robots.txt`, { signal: AbortSignal.timeout(5000) });
    hasRobotsTxt = robotsRes.ok;
  } catch {}
  try {
    const sitemapRes = await fetch(`${baseUrl.origin}/sitemap.xml`, { signal: AbortSignal.timeout(5000) });
    hasSitemap = sitemapRes.ok;
  } catch {}

  return {
    url: normalizedUrl,
    title,
    metaDescription,
    metaKeywords,
    ogTags,
    headings,
    links: links.slice(0, 100),
    images: images.slice(0, 50),
    textContent,
    wordCount,
    hasSSL: normalizedUrl.startsWith("https"),
    hasSitemap,
    hasRobotsTxt,
    ctaButtons: [...new Set(ctaButtons)].slice(0, 20),
    forms,
    socialLinks: [...new Set(socialLinks)],
    contactInfo: { emails, phones },
    techStack,
    pageSpeed: { loadTime },
    structuredData,
    canonicalUrl,
    viewport,
    favicon,
  };
}
