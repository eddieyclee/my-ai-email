import { connection } from "next/server";
import { buildDailyBrief } from "@/lib/daily-brief/build";

export async function GET() {
  // 每次請求都要抓最新資料，不在 build 時預先產生
  await connection();

  return Response.json(await buildDailyBrief());
}
