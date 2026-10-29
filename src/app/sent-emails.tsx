"use client";

import { useCallback, useEffect, useState } from "react";
import type { SentEmailRecord } from "@/lib/daily-brief/types";
import { BriefView, formatDate, formatTime, LoadingSkeleton } from "./brief-view";

async function fetchSentEmails(): Promise<SentEmailRecord[]> {
  const res = await fetch("/api/sent-emails", { cache: "no-store" });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `API 回應 ${res.status}`);
  return body.items;
}

/** 首頁：列出寄過的晨報，點選後顯示當次內容 */
export default function SentEmails() {
  const [items, setItems] = useState<SentEmailRecord[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyResult = useCallback((request: Promise<SentEmailRecord[]>) => {
    request
      .then((result) => {
        setItems(result);
        setError(null);
        // 預設選最新一筆；原本選的那筆還在就保留
        setSelectedId((current) =>
          current && result.some((item) => item.id === current) ? current : (result[0]?.id ?? null),
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    applyResult(fetchSentEmails());
  }, [applyResult]);

  const reload = () => {
    setLoading(true);
    applyResult(fetchSentEmails());
  };

  const selected = items?.find((item) => item.id === selectedId) ?? null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">寄信紀錄</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">每日晨報</h1>
        </div>
        <button
          onClick={reload}
          disabled={loading}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {loading ? "載入中…" : "重新整理"}
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          載入失敗：{error}
        </div>
      )}

      {loading && !items ? (
        <LoadingSkeleton />
      ) : items && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
          還沒有寄信紀錄。排程寄出第一封晨報後，就會出現在這裡。
        </div>
      ) : (
        items && (
          <div className={`grid gap-6 lg:grid-cols-[18rem_1fr] ${loading ? "opacity-50" : ""}`}>
            <nav aria-label="寄信紀錄" className="lg:sticky lg:top-6 lg:self-start">
              <ul className="flex gap-2 overflow-x-auto pb-2 lg:max-h-[calc(100vh-8rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0">
                {items.map((item) => {
                  const active = item.id === selectedId;
                  return (
                    <li key={item.id} className="shrink-0 lg:shrink">
                      <button
                        onClick={() => setSelectedId(item.id)}
                        aria-current={active}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          active
                            ? "border-zinc-900 bg-white shadow-sm dark:border-zinc-100 dark:bg-zinc-900"
                            : "border-zinc-200 bg-white/60 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{formatDate(item.briefDate)}</span>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">寄出時間 {formatTime(item.createdAt)}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {selected && (
              <article>
                <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold">{selected.subject}</h2>
                    <StatusBadge status={selected.status} />
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-1 text-zinc-600 sm:grid-cols-[auto_1fr] dark:text-zinc-400">
                    <dt className="font-medium">寄件人</dt>
                    <dd className="break-all">{selected.from}</dd>
                    <dt className="font-medium">收件人</dt>
                    <dd className="break-all">{selected.to}</dd>
                    <dt className="font-medium">寄出時間</dt>
                    <dd>{formatTime(selected.createdAt)}</dd>
                    {selected.error && (
                      <>
                        <dt className="font-medium text-red-600 dark:text-red-400">錯誤</dt>
                        <dd className="text-red-600 dark:text-red-400">{selected.error}</dd>
                      </>
                    )}
                  </dl>
                </div>
                <BriefView
                  weather={selected.weather}
                  stock={selected.stock}
                  news={selected.news}
                  summary={selected.summary}
                />
              </article>
            )}
          </div>
        )
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: SentEmailRecord["status"] }) {
  return status === "sent" ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
      已寄出
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
      寄送失敗
    </span>
  );
}
