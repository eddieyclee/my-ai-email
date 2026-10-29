import { todayInTaipei } from "./date";
import { fetchTechNews } from "./news";
import { fetchPreviousTradingDay } from "./stock";
import { summarize } from "./summarize";
import type { DailyBriefResponse } from "./types";
import { fetchWeather } from "./weather";

const errorMessage = (reason: unknown) =>
  reason instanceof Error ? reason.message : String(reason);

/** 抓天氣、股價、新聞，再交給 Claude 統整成今天的晨報 */
export async function buildDailyBrief(): Promise<DailyBriefResponse> {
  const date = todayInTaipei();
  const [weather, stock, news] = await Promise.allSettled([
    fetchWeather(),
    fetchPreviousTradingDay(date),
    fetchTechNews(date),
  ]);

  // 單一來源失敗不影響其他資料，錯誤集中回報
  const errors: Record<string, string> = {};
  if (weather.status === "rejected") errors.weather = errorMessage(weather.reason);
  if (stock.status === "rejected") errors.stock = errorMessage(stock.reason);
  if (news.status === "rejected") errors.news = errorMessage(news.reason);

  const data = {
    date,
    weather: weather.status === "fulfilled" ? weather.value : null,
    stock: stock.status === "fulfilled" ? stock.value : null,
    news: news.status === "fulfilled" ? news.value : [],
  };

  let summary = null;
  try {
    summary = await summarize(data);
  } catch (error) {
    errors.summary = errorMessage(error);
  }

  return { ...data, summary, errors };
}
