const TIME_ZONE = "Asia/Taipei";

/** 台北時區的今天，格式 YYYY-MM-DD */
export function todayInTaipei(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** 把任意時間轉成台北時區的 YYYY-MM-DD */
export function toTaipeiDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}
