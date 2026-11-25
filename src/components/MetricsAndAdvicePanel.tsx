"use client";

import {
  Activity,
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Clock,
  Info,
  Moon,
  Sparkles,
} from "lucide-react";
import type { SleepLogInput, SleepLogRow } from "@/types/sleep";
import {
  calculateSleepMetrics,
  formatDuration,
  getSleepEfficiencyStatus,
} from "@/lib/sleep-calculator";
import { generateSleepAdvice } from "@/lib/sleep-advice";

interface MetricsAndAdvicePanelProps {
  input: SleepLogInput;
  recentLogs: SleepLogRow[];
}

export function MetricsAndAdvicePanel({
  input,
  recentLogs,
}: MetricsAndAdvicePanelProps) {
  const calc = calculateSleepMetrics({
    bedtime: input.bedtime,
    sleep_onset_time: input.sleep_onset_time,
    waso_minutes: Number(input.waso_minutes) || 0,
    wake_time: input.wake_time,
    out_of_bed_time: input.out_of_bed_time,
  });

  if (!calc.ok) {
    return (
      <div className="rounded-3xl bg-white p-6 border border-rose-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              時刻の入力を確認してください
            </h3>
            <p className="mt-1 text-sm text-rose-700 leading-relaxed">
              {calc.error}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              例：就寝 23:00 → 入眠 23:20 → 目が覚めた 06:15 → 起床 06:30
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { metrics } = calc;
  const seStatus = getSleepEfficiencyStatus(metrics.sleepEfficiency);
  const advice = generateSleepAdvice({
    metrics,
    wasoMinutes: Number(input.waso_minutes) || 0,
    sleepQualityScore: input.sleep_quality_score,
    daytimeImpairmentScore: input.daytime_impairment_score,
    memo: input.memo,
    recentLogs,
  });

  // タイムラインバーの比率計算
  const total = Math.max(metrics.tibMinutes, 1);
  const solPct = (metrics.sleepLatencyMinutes / total) * 100;
  const tstPct = (metrics.tstMinutes / total) * 100;
  const wasoPct = ((Number(input.waso_minutes) || 0) / total) * 100;
  const morningPct = (metrics.morningAwakeMinutes / total) * 100;

  const seBadgeStyle =
    seStatus.tone === "excellent"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : seStatus.tone === "moderate"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  const seBarColor =
    seStatus.tone === "excellent"
      ? "bg-emerald-500"
      : seStatus.tone === "moderate"
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div className="space-y-5">
      {/* Auto-calculated Metrics Card */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_14px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                自動計算サマリー
              </h2>
              <p className="text-xs text-slate-500">
                入力内容に合わせてリアルタイム計算
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${seBadgeStyle}`}
          >
            効率: {seStatus.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 総臥床時間 (TIB) */}
          <div className="rounded-2xl bg-slate-50/90 border border-slate-200/70 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <BedDouble className="h-3.5 w-3.5 text-sky-600" />
              <span>総臥床時間 (TIB)</span>
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {formatDuration(metrics.tibMinutes)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              寝床にいた合計時間
            </p>
          </div>

          {/* 実睡眠時間 (TST) */}
          <div className="rounded-2xl bg-sky-50/80 border border-sky-200/70 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-sky-700">
              <Moon className="h-3.5 w-3.5 text-sky-600" />
              <span>実睡眠時間 (TST)</span>
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold text-sky-900 tabular-nums">
              {formatDuration(metrics.tstMinutes)}
            </p>
            <p className="mt-0.5 text-[11px] text-sky-700/75">
              実際に眠れた時間
            </p>
          </div>

          {/* 睡眠効率 (SE) */}
          <div className="rounded-2xl bg-slate-50/90 border border-slate-200/70 p-3.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>睡眠効率 (SE)</span>
              <span className="text-[10px] text-slate-400">目安 ≥85%</span>
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {metrics.sleepEfficiency.toFixed(1)}
              <span className="ml-0.5 text-sm font-semibold text-slate-500">
                %
              </span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${seBarColor}`}
                style={{ width: `${Math.min(100, metrics.sleepEfficiency)}%` }}
              />
            </div>
          </div>

          {/* 覚醒合計時間 */}
          <div className="rounded-2xl bg-amber-50/60 border border-amber-200/70 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>覚醒合計時間</span>
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold text-amber-950 tabular-nums">
              {formatDuration(metrics.totalAwakeMinutes)}
            </p>
            <p className="mt-0.5 text-[11px] text-amber-800/80 tabular-nums">
              入眠{metrics.sleepLatencyMinutes}m / 中途
              {Math.round(Number(input.waso_minutes) || 0)}m / 起床前
              {metrics.morningAwakeMinutes}m
            </p>
          </div>
        </div>

        {/* Visual Breakdown Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 tabular-nums">
            <span>就寝 {input.bedtime}</span>
            <span className="text-[11px] text-slate-400">睡眠の内訳バランス</span>
            <span>起床 {input.out_of_bed_time}</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            {solPct > 0 && (
              <div
                className="bg-amber-300 transition-all duration-300"
                style={{ width: `${solPct}%` }}
                title={`入眠まで: ${formatDuration(metrics.sleepLatencyMinutes)}`}
              />
            )}
            {tstPct > 0 && (
              <div
                className="bg-sky-500 transition-all duration-300"
                style={{ width: `${tstPct}%` }}
                title={`実睡眠: ${formatDuration(metrics.tstMinutes)}`}
              />
            )}
            {wasoPct > 0 && (
              <div
                className="bg-orange-400 transition-all duration-300"
                style={{ width: `${wasoPct}%` }}
                title={`中途覚醒: ${formatDuration(Number(input.waso_minutes) || 0)}`}
              />
            )}
            {morningPct > 0 && (
              <div
                className="bg-amber-200 transition-all duration-300"
                style={{ width: `${morningPct}%` }}
                title={`起床前の滞在: ${formatDuration(metrics.morningAwakeMinutes)}`}
              />
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              実睡眠
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              入眠まで
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
              中途覚醒
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-200" />
              起床前
            </span>
          </div>
        </div>
      </section>

      {/* Personalized Advice Card */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_14px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-2.5 mb-4">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
              advice.tone === "positive"
                ? "bg-emerald-50 text-emerald-600"
                : advice.tone === "attention"
                ? "bg-amber-50 text-amber-600"
                : "bg-sky-50 text-sky-600"
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              アドバイスのコメント
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
              {advice.headline}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {advice.items.map((item, idx) => {
            const cardClasses =
              item.category === "good"
                ? "border-emerald-200/80 bg-emerald-50/45"
                : item.category === "caution"
                ? "border-amber-200/80 bg-amber-50/50"
                : "border-sky-200/80 bg-sky-50/45";

            const tagClasses =
              item.category === "good"
                ? "bg-emerald-100/90 text-emerald-800"
                : item.category === "caution"
                ? "bg-amber-100/90 text-amber-900"
                : "bg-sky-100/90 text-sky-800";

            const Icon =
              item.category === "good"
                ? CheckCircle2
                : item.category === "caution"
                ? AlertTriangle
                : Info;

            const iconColor =
              item.category === "good"
                ? "text-emerald-600"
                : item.category === "caution"
                ? "text-amber-600"
                : "text-sky-600";

            return (
              <div
                key={`${item.title}-${idx}`}
                className={`rounded-2xl border p-3.5 ${cardClasses}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                    <h3 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${tagClasses}`}
                  >
                    {item.metricTag}
                  </span>
                </div>
                <p className="mt-1.5 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                  {item.message}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
