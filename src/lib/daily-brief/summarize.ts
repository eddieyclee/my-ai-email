import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { NewsItem } from "./news";
import type { StockQuote } from "./stock";
import type { Weather } from "./weather";

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const BriefSchema = z.object({
  weatherSummary: z.string().describe("今天天氣的一兩句摘要與穿著/出門建議"),
  stockSummary: z.string().describe("台積電前一交易日股價表現的一兩句摘要"),
  newsHighlights: z
    .array(z.object({ title: z.string(), summary: z.string() }))
    .describe("挑出 3 到 5 則最值得看的科技新聞，每則一句話重點"),
  encouragement: z.string().describe("結合今天的天氣、股市與新聞，寫一段溫暖、具體的鼓勵的話"),
});

export type Brief = z.infer<typeof BriefSchema>;

type BriefInput = {
  date: string;
  weather: Weather | null;
  stock: StockQuote | null;
  news: NewsItem[];
};

const SYSTEM_PROMPT = `你是使用者的每日晨間小助理，用繁體中文（台灣用語）寫作。
根據提供的天氣、台積電股價、科技新聞資料整理每日摘要，語氣親切自然。
只使用資料中的資訊，不要捏造數字；某項資料為 null 或空陣列時，就說明今天暫時取不到這項資訊。`;

export async function summarize(input: BriefInput): Promise<Brief> {
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(BriefSchema) },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `今天是 ${input.date}，以下是今天的資料：\n${JSON.stringify(input, null, 2)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Claude 沒有產出摘要（stop_reason: ${response.stop_reason}）`);
  }
  return response.parsed_output;
}
