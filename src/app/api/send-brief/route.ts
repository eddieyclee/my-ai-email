import { createHash, timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { Resend } from "resend";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SentEmailModel } from "@/lib/db/models/sent-email";
import { buildDailyBrief } from "@/lib/daily-brief/build";
import { renderBriefEmail } from "@/lib/daily-brief/email";

// 背景工作（抓資料 + Claude + 寄信）可執行的最長秒數，部署平台（如 Vercel）會依此設定上限
export const maxDuration = 300;

// Resend 預設寄件人；收件人固定
const FROM = "每日晨報 <onboarding@resend.dev>";
const TO = "chuan1072@gmail.com";

const resend = new Resend(process.env.RESEND_API_KEY);

/** 比對 Authorization: Bearer <CRON_SECRET>，用固定時間比較避免 timing attack */
function isAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

/** 產生今天的晨報、寄信並存到 MongoDB */
async function sendDailyBrief() {
  const data = await buildDailyBrief();
  const { subject, html, text } = renderBriefEmail(data);
  const { data: sent, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject,
    html,
    text,
  });
  if (error) console.error("寄信失敗：", error);

  // 不論寄送成功或失敗都存一筆紀錄
  await connectToDatabase();
  const record = await SentEmailModel.create({
    status: error ? "failed" : "sent",
    from: FROM,
    to: TO,
    subject,
    resendId: sent?.id,
    error: error?.message,
    briefDate: data.date,
    weather: data.weather,
    stock: data.stock,
    news: data.news,
    summary: data.summary,
    html,
  });
  console.log(`晨報處理完成：${error ? "寄信失敗" : `已寄出 ${sent?.id}`}，紀錄 ${record.id}`);
}

/** 給 cron-job.org 排程呼叫：驗證後立刻回應，實際工作在回應送出後於背景執行 */
async function handler(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "伺服器未設定 CRON_SECRET" }, { status: 500 });
  }
  if (!isAuthorized(request, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  after(() =>
    sendDailyBrief().catch((error) => console.error("晨報背景工作失敗：", error)),
  );

  return Response.json({
    accepted: true,
    message: "已開始產生晨報，完成後會寄到信箱並存到資料庫",
  });
}

// cron-job.org 預設用 GET，也接受 POST
export { handler as GET, handler as POST };
