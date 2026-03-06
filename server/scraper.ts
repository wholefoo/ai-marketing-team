import * as cheerio from "cheerio";

export interface PageData {
  url: string;
  title: string;
  content: string;
  headings: { level: string; text: string }[];
  ctaButtons: string[];
  forms: number;
}

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
  structuredDataTypes: string[];
  canonicalUrl: string;
  viewport: string;
  favicon: boolean;
  keyPages: PageData[];
  pricingInfo: string;
  testimonials: string[];
  trustSignals: string[];
}

const FETCH_OPTS = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  },
  redirect: "follow" as RequestRedirect,
};

async function fetchPage(url: string, timeout = 12000): Promise<string> {
  const response = await fetch(url, {
    ...FETCH_OPTS,
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText})`);
  }
  return response.text();
}

function extractPageData(html: string, url: string): PageData {
  const $ = cheerio.load(html);
  const title = $("title").text().trim();
  const content = $("body").text().replace(/\s+/g, " ").trim().substring(0, 5000);

  const headings: { level: string; text: string }[] = [];
  $("h1, h2, h3").each((_, el) => {
    headings.push({ level: el.tagName.toLowerCase(), text: $(el).text().trim().substring(0, 200) });
  });

  const ctaButtons: string[] = [];
  const ctaKeywords = ["buy", "sign up", "get started", "contact", "book", "schedule", "call", "free", "try", "start", "order", "subscribe", "register", "download", "learn more", "shop", "pricing", "demo", "quote"];
  $('a, button, [role="button"]').each((_, el) => {
    const text = $(el).text().trim();
    if (ctaKeywords.some((kw) => text.toLowerCase().includes(kw))) {
      ctaButtons.push(text.substring(0, 100));
    }
  });

  return { url, title, content, headings, ctaButtons: [...new Set(ctaButtons)], forms: $("form").length };
}

function findKeyPageUrls(links: { href: string; text: string; isExternal: boolean }[], baseHostname: string): { pricing: string | null; about: string | null; contact: string | null; services: string | null } {
  const result = { pricing: null as string | null, about: null as string | null, contact: null as string | null, services: null as string | null };

  for (const link of links) {
    if (link.isExternal) continue;
    const href = link.href.toLowerCase();
    const text = link.text.toLowerCase();

    if (!result.pricing && (href.includes("/pricing") || href.includes("/plans") || text.includes("pricing") || text.includes("plans"))) {
      result.pricing = link.href;
    }
    if (!result.about && (href.includes("/about") || text.includes("about us") || text.includes("about"))) {
      result.about = link.href;
    }
    if (!result.contact && (href.includes("/contact") || text.includes("contact"))) {
      result.contact = link.href;
    }
    if (!result.services && (href.includes("/service") || href.includes("/solution") || text.includes("service") || text.includes("solution"))) {
      result.services = link.href;
    }
  }

  return result;
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  const startTime = Date.now();
  const html = await fetchPage(normalizedUrl, 15000);
  const loadTime = Date.now() - startTime;

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
    headings.push({ level: el.tagName.toLowerCase(), text: $(el).text().trim().substring(0, 200) });
  });

  const links: { href: string; text: string; isExternal: boolean }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim().substring(0, 100);
    try {
      const linkUrl = new URL(href, normalizedUrl);
      links.push({ href: linkUrl.href, text, isExternal: linkUrl.hostname !== baseUrl.hostname });
    } catch {
      links.push({ href, text, isExternal: false });
    }
  });

  const images: { src: string; alt: string; hasAlt: boolean }[] = [];
  $("img").each((_, el) => {
    images.push({ src: $(el).attr("src") || "", alt: $(el).attr("alt") || "", hasAlt: !!$(el).attr("alt") });
  });

  const textContent = $("body").text().replace(/\s+/g, " ").trim().substring(0, 10000);
  const wordCount = textContent.split(/\s+/).length;

  const ctaButtons: string[] = [];
  const ctaKeywords = ["buy", "sign up", "get started", "contact", "book", "schedule", "call", "free", "try", "start", "order", "subscribe", "register", "download", "learn more", "shop", "demo", "quote"];
  $('a, button, [role="button"]').each((_, el) => {
    const text = $(el).text().trim();
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
  if (html.includes("webflow")) techStack.push("Webflow");
  if (html.includes("hubspot")) techStack.push("HubSpot");
  if ($('script[src*="react"]').length) techStack.push("React");
  if ($('script[src*="jquery"]').length) techStack.push("jQuery");
  if ($('script[src*="gtag"]').length || $('script[src*="analytics"]').length) techStack.push("Google Analytics");
  if ($('script[src*="fbevents"]').length || html.includes("fbq(")) techStack.push("Facebook Pixel");
  if (html.includes("hotjar")) techStack.push("Hotjar");
  if (html.includes("intercom")) techStack.push("Intercom");
  if (html.includes("drift")) techStack.push("Drift");
  if (html.includes("mailchimp")) techStack.push("Mailchimp");
  if (html.includes("klaviyo")) techStack.push("Klaviyo");
  if ($('link[href*="bootstrap"]').length) techStack.push("Bootstrap");

  const structuredDataScripts = $('script[type="application/ld+json"]');
  const structuredData = structuredDataScripts.length > 0;
  const structuredDataTypes: string[] = [];
  structuredDataScripts.each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      if (json["@type"]) structuredDataTypes.push(json["@type"]);
    } catch {}
  });

  const canonicalUrl = $('link[rel="canonical"]').attr("href") || "";
  const viewport = $('meta[name="viewport"]').attr("content") || "";
  const favicon = $('link[rel="icon"]').length > 0 || $('link[rel="shortcut icon"]').length > 0;

  const testimonials: string[] = [];
  $('[class*="testimonial"], [class*="review"], [class*="quote"], blockquote').each((_, el) => {
    const text = $(el).text().trim().substring(0, 300);
    if (text.length > 20) testimonials.push(text);
  });

  const trustSignals: string[] = [];
  $('[class*="trust"], [class*="badge"], [class*="partner"], [class*="client"], [class*="logo"]').each((_, el) => {
    const text = $(el).text().trim().substring(0, 100);
    if (text.length > 3) trustSignals.push(text);
  });

  let pricingInfo = "";
  $('[class*="price"], [class*="pricing"], [class*="plan"]').each((_, el) => {
    pricingInfo += $(el).text().trim().substring(0, 200) + " | ";
  });

  let hasSitemap = false;
  let hasRobotsTxt = false;
  try {
    const robotsRes = await fetch(`${baseUrl.origin}/robots.txt`, { ...FETCH_OPTS, signal: AbortSignal.timeout(5000) });
    hasRobotsTxt = robotsRes.ok;
  } catch {}
  try {
    const sitemapRes = await fetch(`${baseUrl.origin}/sitemap.xml`, { ...FETCH_OPTS, signal: AbortSignal.timeout(5000) });
    hasSitemap = sitemapRes.ok;
  } catch {}

  const keyPageUrls = findKeyPageUrls(links, baseUrl.hostname);
  const keyPages: PageData[] = [];

  const pageFetches = Object.entries(keyPageUrls)
    .filter(([, url]) => url !== null)
    .slice(0, 3)
    .map(async ([type, pageUrl]) => {
      try {
        const pageHtml = await fetchPage(pageUrl!, 8000);
        return extractPageData(pageHtml, pageUrl!);
      } catch {
        return null;
      }
    });

  const fetchedPages = await Promise.all(pageFetches);
  fetchedPages.forEach((page) => {
    if (page) keyPages.push(page);
  });

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
    structuredDataTypes,
    canonicalUrl,
    viewport,
    favicon,
    keyPages,
    pricingInfo: pricingInfo.substring(0, 1000),
    testimonials: testimonials.slice(0, 10),
    trustSignals: [...new Set(trustSignals)].slice(0, 15),
  };
}
