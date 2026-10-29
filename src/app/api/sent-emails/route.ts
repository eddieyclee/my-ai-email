import { connection } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SentEmailModel } from "@/lib/db/models/sent-email";
import type { SentEmailRecord } from "@/lib/daily-brief/types";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

/** 讀取寄信紀錄（新到舊），?limit= 可指定筆數 */
export async function GET(request: Request) {
  await connection();

  const limitParam = Number(new URL(request.url).searchParams.get("limit"));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

  try {
    await connectToDatabase();
    // 不帶 html，避免回應太大；前端用結構化資料重新渲染
    const docs = await SentEmailModel.find().sort({ createdAt: -1 }).limit(limit).select("-html").lean();

    const items: SentEmailRecord[] = docs.map((doc) => ({
      id: String(doc._id),
      status: doc.status,
      from: doc.from,
      to: doc.to,
      subject: doc.subject,
      resendId: doc.resendId ?? null,
      error: doc.error ?? null,
      briefDate: doc.briefDate,
      // 原本是 null 的巢狀欄位，存進 MongoDB 後可能變成空物件
      weather: doc.weather?.location ? (doc.weather as SentEmailRecord["weather"]) : null,
      stock: doc.stock?.stockNo ? (doc.stock as SentEmailRecord["stock"]) : null,
      news: (doc.news ?? []).map((n) => ({
        title: n.title ?? "",
        link: n.link ?? "",
        publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString() : "",
        description: n.description ?? "",
      })),
      summary: doc.summary?.encouragement ? (doc.summary as SentEmailRecord["summary"]) : null,
      createdAt: new Date(doc.createdAt).toISOString(),
    }));

    return Response.json({ items });
  } catch (error) {
    console.error("讀取寄信紀錄失敗：", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
