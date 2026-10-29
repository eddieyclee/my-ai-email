import { toTaipeiDate } from "./date";

const RSS_URL = "https://technews.tw/feed/";
const MAX_ITEMS = 10;

export type NewsItem = {
  title: string;
  link: string;
  publishedAt: string;
  description: string;
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function readTag(item: string, tag: string): string {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!match) return "";
  const raw = match[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
  return decodeEntities(raw.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

/** 抓 RSS，優先回傳今天發布的新聞；今天還沒有新聞時改回最新幾則 */
export async function fetchTechNews(today: string): Promise<NewsItem[]> {
  const res = await fetch(RSS_URL);
  if (!res.ok) throw new Error(`RSS 回應 ${res.status}`);

  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const pubDate = new Date(readTag(item, "pubDate"));
    return {
      title: readTag(item, "title"),
      link: readTag(item, "link"),
      publishedAt: pubDate.toISOString(),
      description: readTag(item, "description").slice(0, 200),
    };
  });

  const todays = items.filter((n) => toTaipeiDate(new Date(n.publishedAt)) === today);
  return (todays.length > 0 ? todays : items).slice(0, MAX_ITEMS);
}
