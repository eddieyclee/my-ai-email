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

/** /api/sent-emails 回傳的單筆寄信紀錄 */
export type SentEmailRecord = {
  id: string;
  status: "sent" | "failed";
  from: string;
  to: string;
  subject: string;
  resendId: string | null;
  error: string | null;
  briefDate: string;
  weather: Weather | null;
  stock: StockQuote | null;
  news: NewsItem[];
  summary: Brief | null;
  createdAt: string;
};

export type { Brief, NewsItem, StockQuote, Weather };
