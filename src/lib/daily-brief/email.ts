import type { DailyBriefResponse } from "./types";

// Email 用 table 排版 + inline style，Gmail / Outlook 等信箱才會正確顯示
const COLORS = {
  text: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  card: "#ffffff",
  page: "#f4f4f5",
  up: "#dc2626",
  down: "#16a34a",
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function formatDate(iso: string) {
  const [, month, day] = iso.split("-");
  const weekday = "日一二三四五六"[new Date(`${iso}T00:00:00Z`).getUTCDay()];
  return `${Number(month)} 月 ${Number(day)} 日（${weekday}）`;
}

function card(title: string, body: string, background = COLORS.card) {
  return `
  <tr><td style="padding:0 0 16px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${background};border:1px solid ${COLORS.border};border-radius:12px;">
      <tr><td style="padding:20px 24px;">
        <h2 style="margin:0 0 12px 0;font-size:17px;color:${COLORS.text};">${title}</h2>
        ${body}
      </td></tr>
    </table>
  </td></tr>`;
}

const paragraph = (text: string, color = COLORS.text) =>
  `<p style="margin:8px 0 0 0;font-size:14px;line-height:1.7;color:${color};">${escapeHtml(text)}</p>`;

const unavailable = paragraph("暫時取不到這項資料。", COLORS.muted);

export function renderBriefEmail(data: DailyBriefResponse) {
  const { weather, stock, news, summary } = data;
  const subject = `☀️ 每日晨報｜${formatDate(data.date)}`;

  const encouragement = summary
    ? card(
        "☀️ 給今天的你",
        `<p style="margin:0;font-size:16px;line-height:1.8;color:${COLORS.text};">${escapeHtml(summary.encouragement)}</p>`,
        "#fef3c7",
      )
    : "";

  const weatherBody = weather
    ? `<p style="margin:0;font-size:32px;font-weight:bold;color:${COLORS.text};">${escapeHtml(weather.currentTemperature)}° <span style="font-size:16px;font-weight:normal;color:${COLORS.muted};">${escapeHtml(weather.description)}</span></p>
       <p style="margin:8px 0 0 0;font-size:14px;color:${COLORS.muted};">最高 ${escapeHtml(weather.maxTemperature)}° ／ 最低 ${escapeHtml(weather.minTemperature)}° ／ 降雨機率 ${escapeHtml(weather.precipitationProbability)}%</p>
       ${summary ? paragraph(summary.weatherSummary) : ""}`
    : unavailable;

  let stockBody = unavailable;
  if (stock) {
    // 台股慣例：漲紅跌綠
    const color = stock.change > 0 ? COLORS.up : stock.change < 0 ? COLORS.down : COLORS.muted;
    const sign = stock.change > 0 ? "+" : "";
    const percent = ((stock.change / (stock.close - stock.change)) * 100).toFixed(2);
    stockBody = `<p style="margin:0;font-size:13px;color:${COLORS.muted};">${escapeHtml(stock.stockNo)}・${formatDate(stock.date)} 收盤</p>
       <p style="margin:4px 0 0 0;font-size:32px;font-weight:bold;color:${COLORS.text};">${stock.close.toLocaleString()} <span style="font-size:16px;color:${color};">${sign}${escapeHtml(stock.change)} (${sign}${percent}%)</span></p>
       <p style="margin:8px 0 0 0;font-size:14px;color:${COLORS.muted};">開盤 ${stock.open.toLocaleString()} ／ 最高 ${stock.high.toLocaleString()} ／ 最低 ${stock.low.toLocaleString()} ／ 成交 ${Math.round(stock.volume / 1000).toLocaleString()} 張</p>
       ${summary ? paragraph(summary.stockSummary) : ""}`;
  }

  const highlights =
    summary && summary.newsHighlights.length > 0
      ? card(
          "📰 今日科技重點",
          summary.newsHighlights
            .map(
              (item, i) =>
                `<p style="margin:${i === 0 ? 0 : 14}px 0 0 0;font-size:15px;font-weight:bold;color:${COLORS.text};">${i + 1}. ${escapeHtml(item.title)}</p>${paragraph(item.summary, COLORS.muted)}`,
            )
            .join(""),
        )
      : "";

  const newsBody =
    news.length > 0
      ? news
          .map(
            (item, i) =>
              `<div style="padding:${i === 0 ? 0 : 12}px 0 12px 0;${i < news.length - 1 ? `border-bottom:1px solid ${COLORS.border};` : ""}">
                 <a href="${escapeHtml(item.link)}" style="font-size:15px;font-weight:bold;color:#2563eb;text-decoration:none;">${escapeHtml(item.title)}</a>
                 ${paragraph(item.description, COLORS.muted)}
               </div>`,
          )
          .join("")
      : unavailable;

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};font-family:'PingFang TC','Microsoft JhengHei',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding:0 0 20px 0;">
          <p style="margin:0;font-size:13px;color:${COLORS.muted};">${formatDate(data.date)}</p>
          <h1 style="margin:4px 0 0 0;font-size:26px;color:${COLORS.text};">每日晨報</h1>
        </td></tr>
        ${encouragement}
        ${card(`🌤️ ${escapeHtml(weather?.location ?? "")}天氣`, weatherBody)}
        ${card("📈 台積電股價", stockBody)}
        ${highlights}
        ${card(`🗞️ 科技新聞（${news.length} 則）`, newsBody)}
        <tr><td style="padding:8px 0 0 0;font-size:12px;color:${COLORS.muted};text-align:center;">
          資料來源：Open-Meteo、台灣證券交易所、TechNews 科技新報｜由 Claude 整理
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // 純文字版本，給不支援 HTML 的信箱
  const text = [
    `每日晨報 ${formatDate(data.date)}`,
    summary ? `\n【給今天的你】\n${summary.encouragement}` : "",
    weather
      ? `\n【${weather.location}天氣】\n${weather.description}，現在 ${weather.currentTemperature}°，${weather.minTemperature}–${weather.maxTemperature}°，降雨機率 ${weather.precipitationProbability}%${summary ? `\n${summary.weatherSummary}` : ""}`
      : "",
    stock
      ? `\n【台積電 ${stock.date}】\n收盤 ${stock.close}（${stock.change > 0 ? "+" : ""}${stock.change}）${summary ? `\n${summary.stockSummary}` : ""}`
      : "",
    summary && summary.newsHighlights.length > 0
      ? `\n【今日科技重點】\n${summary.newsHighlights.map((h, i) => `${i + 1}. ${h.title}：${h.summary}`).join("\n")}`
      : "",
    news.length > 0 ? `\n【科技新聞】\n${news.map((n) => `- ${n.title}\n  ${n.link}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
