"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  ClipboardList,
} from "lucide-react";
import type { SleepLogRow } from "@/types/sleep";
import {
  formatDateJP,
  formatDuration,
  getSleepEfficiencyStatus,
} from "@/lib/sleep-calculator";
import {
  DAYTIME_IMPAIRMENT_LABELS,
  SLEEP_QUALITY_LABELS,
  generateSleepAdvice,
} from "@/lib/sleep-advice";
import { downloadSleepLogsCsv } from "@/lib/csv-export";

interface SleepHistoryProps {
  logs: SleepLogRow[];
  onEdit: (record: SleepLogRow) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
  onGoToRecord: () => void;
}

export function SleepHistory({
  logs,
  onEdit,
  onDelete,
  deletingId,
  onGoToRecord,
}: SleepHistoryProps) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return logs;
    return logs.filter(
      (log) =>
        log.log_date.includes(trimmed) ||
        log.memo.toLowerCase().includes(trimmed)
    );
  }, [logs, query]);

  if (logs.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center border border-slate-200/80 shadow-[0_2px_14px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <ClipboardList className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          記録履歴はまだありません
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          「記録する」タブから日々の睡眠を記録すると、こちらに一覧で保存されます。
        </p>
        <button
          type="button"
          onClick={onGoToRecord}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition cursor-pointer"
        >
          今日の睡眠を記録する
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="日付（例: 2026-11）やメモ内容で検索..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            全 {filtered.length} 件
          </span>
          <button
            type="button"
            onClick={() => downloadSleepLogsCsv(filtered)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700 transition shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            CSVエクスポート
          </button>
        </div>
      </div>

      {/* Records List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center border border-slate-200/80 text-sm text-slate-500">
          条件に一致する記録が見つかりませんでした。
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => {
            const se = Number(log.sleep_efficiency);
            const seStatus = getSleepEfficiencyStatus(se);
            const isExpanded = expandedId === log.id;
            const isConfirmingDelete = confirmDeleteId === log.id;

            const seBadge =
              seStatus.tone === "excellent"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : seStatus.tone === "moderate"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-rose-50 text-rose-700 border-rose-200";

            const dayAdvice = isExpanded
              ? generateSleepAdvice({
                  metrics: {
                    tibMinutes: log.tib_minutes,
                    tstMinutes: log.tst_minutes,
                    sleepEfficiency: se,
                    totalAwakeMinutes: log.total_awake_minutes,
                    sleepLatencyMinutes: log.sleep_latency_minutes,
                    morningAwakeMinutes: log.morning_awake_minutes,
                  },
                  wasoMinutes: log.waso_minutes,
                  sleepQualityScore: log.sleep_quality_score,
                  daytimeImpairmentScore: log.daytime_impairment_score,
                  memo: log.memo,
                })
              : null;

            return (
              <article
                key={log.id}
                className="rounded-3xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.03)] overflow-hidden transition hover:border-sky-200"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 tabular-nums">
                          {formatDateJP(log.log_date)}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums ${seBadge}`}
                        >
                          SE {se.toFixed(1)}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 tabular-nums">
                        就寝 {log.bedtime} → 入眠 {log.sleep_onset_time} → 目覚め{" "}
                        {log.wake_time} → 起床 {log.out_of_bed_time}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(log)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        編集
                      </button>

                      {isConfirmingDelete ? (
                        <div className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2 py-1">
                          <button
                            type="button"
                            disabled={deletingId === log.id}
                            onClick={() => {
                              onDelete(log.id);
                              setConfirmDeleteId(null);
                            }}
                            className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                          >
                            {deletingId === log.id ? "削除中" : "削除確定"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            戻す
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(log.id)}
                          aria-label="記録を削除"
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">削除</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metrics Summary Grid */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <div className="rounded-xl bg-sky-50/75 px-3 py-2">
                      <span className="text-[11px] text-sky-700">実睡眠 (TST)</span>
                      <p className="mt-0.5 font-bold text-sky-950 text-sm tabular-nums">
                        {formatDuration(log.tst_minutes)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-[11px] text-slate-500">総臥床 (TIB)</span>
                      <p className="mt-0.5 font-bold text-slate-900 text-sm tabular-nums">
                        {formatDuration(log.tib_minutes)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50/60 px-3 py-2">
                      <span className="text-[11px] text-amber-800">覚醒合計</span>
                      <p className="mt-0.5 font-bold text-amber-950 text-sm tabular-nums">
                        {formatDuration(log.total_awake_minutes)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-[11px] text-slate-500">熟睡感</span>
                      <p className="mt-0.5 font-bold text-slate-900 text-sm tabular-nums">
                        {log.sleep_quality_score}/5{" "}
                        <span className="text-[11px] font-normal text-slate-500">
                          ({SLEEP_QUALITY_LABELS[log.sleep_quality_score]})
                        </span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2 col-span-2 sm:col-span-1">
                      <span className="text-[11px] text-slate-500">日中の支障度</span>
                      <p className="mt-0.5 font-bold text-slate-900 text-sm tabular-nums">
                        {log.daytime_impairment_score}/5{" "}
                        <span className="text-[11px] font-normal text-slate-500">
                          ({DAYTIME_IMPAIRMENT_LABELS[log.daytime_impairment_score]})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Memo Preview */}
                  {log.memo && (
                    <p className="mt-3 rounded-xl bg-slate-50/80 px-3.5 py-2 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {log.memo}
                    </p>
                  )}

                  {/* Expand Toggle */}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : log.id)
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {isExpanded
                        ? "詳細・アドバイスを閉じる"
                        : "内訳とアドバイスを見る"}
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail & Advice */}
                {isExpanded && dayAdvice && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap gap-3 text-xs text-slate-600 tabular-nums">
                      <span>
                        入眠まで:{" "}
                        <strong className="text-slate-900">
                          {formatDuration(log.sleep_latency_minutes)}
                        </strong>
                      </span>
                      <span>
                        中途覚醒:{" "}
                        <strong className="text-slate-900">
                          {formatDuration(log.waso_minutes)}
                        </strong>
                      </span>
                      <span>
                        起床前の布団滞在:{" "}
                        <strong className="text-slate-900">
                          {formatDuration(log.morning_awake_minutes)}
                        </strong>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dayAdvice.items.map((item, idx) => (
                        <div
                          key={`${log.id}-adv-${idx}`}
                          className="rounded-xl bg-white border border-slate-200/70 p-3 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-slate-900">
                              {item.title}
                            </span>
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 tabular-nums">
                              {item.metricTag}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600 leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
