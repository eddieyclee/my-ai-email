import type { NewsItem } from "./news";
import type { StockQuote } from "./stock";
import type { Brief } from "./summarize";
import type { Weather } from "./weather";

/** /api/daily-brief 的回應格式 */
export type DailyBriefResponse = {
  date: string;
  weather: Weather | null;
  stock: StockQuote | null;
  news: NewsItem[];
  summary: Brief | null;
  errors: Record<string, string>;
};

export type { Brief, NewsItem, StockQuote, Weather };
