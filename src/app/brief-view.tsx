import type { Brief, NewsItem, StockQuote, Weather } from "@/lib/daily-brief/types";

/** 一份晨報的完整內容：鼓勵的話、天氣、股價、科技重點與新聞列表 */
export function BriefView({
  weather,
  stock,
  news,
  summary,
}: {
  weather: Weather | null;
  stock: StockQuote | null;
  news: NewsItem[];
  summary: Brief | null;
}) {
  return (
    <div className="space-y-6">
      {summary && (
        <section className="rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 p-6 dark:from-amber-950 dark:to-rose-950">
          <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            ☀️ 給今天的你
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-zinc-800 dark:text-zinc-100">
            {summary.encouragement}
          </p>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <WeatherCard weather={weather} summary={summary?.weatherSummary} />
        <StockCard stock={stock} summary={summary?.stockSummary} />
      </div>

      {summary && summary.newsHighlights.length > 0 && (
        <Card title="📰 今日科技重點">
          <ol className="space-y-4">
            {summary.newsHighlights.map((item, i) => (
              <li key={item.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <NewsList news={news} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Unavailable() {
  return <p className="text-sm text-zinc-500">暫時取不到這項資料。</p>;
}

function WeatherCard({ weather, summary }: { weather: Weather | null; summary?: string }) {
  return (
    <Card title={`🌤️ ${weather?.location ?? ""}天氣`}>
      {weather ? (
        <>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold">{weather.currentTemperature}°</span>
            <span className="text-lg text-zinc-600 dark:text-zinc-400">{weather.description}</span>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <Stat label="最高" value={`${weather.maxTemperature}°`} />
            <Stat label="最低" value={`${weather.minTemperature}°`} />
            <Stat label="降雨機率" value={`${weather.precipitationProbability}%`} />
          </dl>
          {summary && (
            <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{summary}</p>
          )}
        </>
      ) : (
        <Unavailable />
      )}
    </Card>
  );
}

function StockCard({ stock, summary }: { stock: StockQuote | null; summary?: string }) {
  // 台股慣例：漲紅跌綠
  const changeColor =
    !stock || stock.change === 0
      ? "text-zinc-500"
      : stock.change > 0
        ? "text-red-600 dark:text-red-400"
        : "text-green-600 dark:text-green-400";
  const sign = stock && stock.change > 0 ? "+" : "";

  return (
    <Card title="📈 台積電股價">
      {stock ? (
        <>
          <p className="text-sm text-zinc-500">
            {stock.stockNo}・{formatDate(stock.date)} 收盤
          </p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-5xl font-bold">{stock.close.toLocaleString()}</span>
            <span className={`text-lg font-semibold ${changeColor}`}>
              {sign}
              {stock.change} ({sign}
              {((stock.change / (stock.close - stock.change)) * 100).toFixed(2)}%)
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
            <Stat label="開盤" value={stock.open.toLocaleString()} />
            <Stat label="最高" value={stock.high.toLocaleString()} />
            <Stat label="最低" value={stock.low.toLocaleString()} />
            <Stat label="成交張數" value={Math.round(stock.volume / 1000).toLocaleString()} />
          </dl>
          {summary && (
            <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{summary}</p>
          )}
        </>
      ) : (
        <Unavailable />
      )}
    </Card>
  );
}

function NewsList({ news }: { news: NewsItem[] }) {
  return (
    <Card title={`🗞️ 科技新聞（${news.length} 則）`}>
      {news.length > 0 ? (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {news.map((item) => (
            <li key={item.link} className="py-3 first:pt-0 last:pb-0">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {item.title}
              </a>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
              <p className="mt-1 text-xs text-zinc-400">{formatTime(item.publishedAt)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <Unavailable />
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-100 px-2 py-2 dark:bg-zinc-800">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-36 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-80 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <p className="text-center text-sm text-zinc-500">載入寄信紀錄中…</p>
    </div>
  );
}

export function formatDate(iso: string) {
  const [, month, day] = iso.split("-");
  const weekday = "日一二三四五六"[new Date(`${iso}T00:00:00Z`).getUTCDay()];
  return `${Number(month)} 月 ${Number(day)} 日（${weekday}）`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
