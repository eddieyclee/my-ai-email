// 台灣證券交易所 STOCK_DAY：免 token，回傳個股當月每日成交資訊
const STOCK_NO = "2330";
const STOCK_NAME = "台積電";

export type StockQuote = {
  stockNo: string;
  name: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  volume: number;
};

const toNumber = (value: string) => Number(value.replace(/[,+X]/g, ""));

/** 民國日期 "115/10/28" → 西元 "2026-10-28" */
function rocToIso(rocDate: string): string {
  const [year, month, day] = rocDate.split("/");
  return `${Number(year) + 1911}-${month}-${day}`;
}

async function fetchMonth(yyyymmdd: string): Promise<StockQuote[]> {
  const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${yyyymmdd}&stockNo=${STOCK_NO}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TWSE 回應 ${res.status}`);

  const data = await res.json();
  if (data.stat !== "OK" || !Array.isArray(data.data)) return [];

  // 欄位：日期, 成交股數, 成交金額, 開盤價, 最高價, 最低價, 收盤價, 漲跌價差, 成交筆數, 註記
  return data.data.map((row: string[]) => ({
    stockNo: STOCK_NO,
    name: STOCK_NAME,
    date: rocToIso(row[0]),
    open: toNumber(row[3]),
    high: toNumber(row[4]),
    low: toNumber(row[5]),
    close: toNumber(row[6]),
    change: toNumber(row[7]),
    volume: toNumber(row[1]),
  }));
}

/** 今天之前最近一個交易日的股價（遇到週末、假日會往前找） */
export async function fetchPreviousTradingDay(today: string): Promise<StockQuote> {
  const [year, month] = today.split("-").map(Number);
  const thisMonth = `${year}${String(month).padStart(2, "0")}01`;
  const prev = new Date(Date.UTC(year, month - 2, 1));
  const lastMonth = `${prev.getUTCFullYear()}${String(prev.getUTCMonth() + 1).padStart(2, "0")}01`;

  for (const monthKey of [thisMonth, lastMonth]) {
    const quotes = (await fetchMonth(monthKey)).filter((q) => q.date < today);
    if (quotes.length > 0) return quotes[quotes.length - 1];
  }
  throw new Error("找不到前一個交易日的股價資料");
}
