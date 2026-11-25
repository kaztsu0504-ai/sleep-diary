"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  Clock,
  Download,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import type { SleepLogRow } from "@/types/sleep";
import {
  formatDuration,
  formatMinutesToHoursDecimal,
  formatShortDate,
  formatTimelineHour,
  toTimelineHour,
} from "@/lib/sleep-calculator";
import { downloadSleepLogsCsv } from "@/lib/csv-export";

interface SleepChartsProps {
  logs: SleepLogRow[];
  onGoToRecord: () => void;
}

type PeriodOption = "7" | "30" | "all";

interface ChartDataPoint {
  dateLabel: string;
  fullDate: string;
  tibHours: number;
  tstHours: number;
  tibMinutes: number;
  tstMinutes: number;
  sleepEfficiency: number;
  qualityScore: number;
  impairmentScore: number;
}

interface CustomTooltipPayloadItem {
  dataKey?: string;
  value?: number;
  payload?: ChartDataPoint;
}

function SleepDurationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const d = payload[0].payload;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm text-xs">
      <p className="font-bold text-slate-900 mb-1.5 tabular-nums">{d.fullDate}</p>
      <div className="space-y-1 text-slate-700 tabular-nums">
        <p className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-200" />
            総臥床時間 (TIB)
          </span>
          <span className="font-semibold">{formatDuration(d.tibMinutes)}</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-600" />
            実睡眠時間 (TST)
          </span>
          <span className="font-semibold text-sky-800">
            {formatDuration(d.tstMinutes)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            睡眠効率 (SE)
          </span>
          <span className="font-bold text-emerald-700">
            {d.sleepEfficiency.toFixed(1)}%
          </span>
        </p>
      </div>
    </div>
  );
}

function ScoreTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const d = payload[0].payload;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm text-xs">
      <p className="font-bold text-slate-900 mb-1.5 tabular-nums">{d.fullDate}</p>
      <div className="space-y-1 text-slate-700 tabular-nums">
        <p className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
            熟睡感スコア
          </span>
          <span className="font-bold text-sky-700">{d.qualityScore} / 5</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            日中の支障度
          </span>
          <span className="font-bold text-amber-700">
            {d.impairmentScore} / 5
          </span>
        </p>
      </div>
    </div>
  );
}

export function SleepCharts({ logs, onGoToRecord }: SleepChartsProps) {
  const [period, setPeriod] = useState<PeriodOption>("7");

  const filteredLogs = useMemo(() => {
    // logs は log_date 降順前提。最新から N 件または全件を取り、グラフ用に昇順へ
    const sortedDesc = [...logs].sort((a, b) =>
      b.log_date.localeCompare(a.log_date)
    );
    const sliced =
      period === "7"
        ? sortedDesc.slice(0, 7)
        : period === "30"
        ? sortedDesc.slice(0, 30)
        : sortedDesc;
    return sliced.reverse();
  }, [logs, period]);

  const summary = useMemo(() => {
    if (filteredLogs.length === 0) return null;
    const count = filteredLogs.length;
    const avgTst =
      filteredLogs.reduce((s, l) => s + l.tst_minutes, 0) / count;
    const avgSe =
      filteredLogs.reduce((s, l) => s + Number(l.sleep_efficiency), 0) / count;
    const avgQuality =
      filteredLogs.reduce((s, l) => s + l.sleep_quality_score, 0) / count;
    const avgImpairment =
      filteredLogs.reduce((s, l) => s + l.daytime_impairment_score, 0) / count;
    return { count, avgTst, avgSe, avgQuality, avgImpairment };
  }, [filteredLogs]);

  const chartData: ChartDataPoint[] = useMemo(
    () =>
      filteredLogs.map((log) => ({
        dateLabel: formatShortDate(log.log_date),
        fullDate: log.log_date,
        tibHours: formatMinutesToHoursDecimal(log.tib_minutes),
        tstHours: formatMinutesToHoursDecimal(log.tst_minutes),
        tibMinutes: log.tib_minutes,
        tstMinutes: log.tst_minutes,
        sleepEfficiency: Number(log.sleep_efficiency),
        qualityScore: log.sleep_quality_score,
        impairmentScore: log.daytime_impairment_score,
      })),
    [filteredLogs]
  );

  // 就寝〜起床の時間帯チャート用データ
  const scheduleChart = useMemo(() => {
    if (filteredLogs.length === 0) {
      return { rows: [], minHour: 20, maxHour: 33, ticks: [20, 23, 26, 29, 32] };
    }
    const rows = filteredLogs.map((log) => {
      const bedStart = toTimelineHour(log.bedtime);
      const onsetStart = bedStart + log.sleep_latency_minutes / 60;
      const wakeEnd =
        bedStart + (log.tib_minutes - log.morning_awake_minutes) / 60;
      const outEnd = bedStart + log.tib_minutes / 60;
      return {
        id: log.id,
        dateLabel: formatShortDate(log.log_date),
        fullDate: log.log_date,
        bedtime: log.bedtime,
        sleepOnset: log.sleep_onset_time,
        wakeTime: log.wake_time,
        outOfBed: log.out_of_bed_time,
        bedStart,
        onsetStart,
        wakeEnd,
        outEnd,
        sleepEfficiency: Number(log.sleep_efficiency),
      };
    });

    const minVal = Math.min(21, ...rows.map((r) => r.bedStart));
    const maxVal = Math.max(32, ...rows.map((r) => r.outEnd));
    const minHour = Math.floor(minVal);
    const maxHour = Math.ceil(maxVal);
    const span = Math.max(maxHour - minHour, 6);
    const step = span <= 12 ? 2 : 3;
    const ticks: number[] = [];
    for (let h = minHour; h <= maxHour; h += step) {
      ticks.push(h);
    }
    if (ticks[ticks.length - 1] !== maxHour) {
      ticks.push(maxHour);
    }

    return { rows: rows.reverse(), minHour, maxHour, ticks };
  }, [filteredLogs]);

  if (logs.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center border border-slate-200/80 shadow-[0_2px_14px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <BarChart3 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          まだ睡眠記録がありません
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
          日々の睡眠を記録すると、睡眠時間・睡眠効率の推移や就寝〜起床のリズムがグラフでわかりやすく表示されます。
        </p>
        <button
          type="button"
          onClick={onGoToRecord}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition cursor-pointer"
        >
          最初の記録をつける
        </button>
      </div>
    );
  }

  const totalScheduleSpan = Math.max(
    scheduleChart.maxHour - scheduleChart.minHour,
    1
  );

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl bg-white p-1 border border-slate-200/80 shadow-xs">
          {(
            [
              { key: "7", label: "直近7日" },
              { key: "30", label: "直近30日" },
              { key: "all", label: "全期間" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setPeriod(opt.key)}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                period === opt.key
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => downloadSleepLogsCsv(filteredLogs)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700 transition shadow-xs cursor-pointer"
        >
          <Download className="h-4 w-4" />
          表示期間をCSV出力
        </button>
      </div>

      {/* Period Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Moon className="h-3.5 w-3.5 text-sky-600" />
              <span>平均 実睡眠時間</span>
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {formatDuration(summary.avgTst)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              対象 {summary.count}日間の平均
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span>平均 睡眠効率</span>
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {summary.avgSe.toFixed(1)}
              <span className="ml-0.5 text-sm font-semibold text-slate-500">
                %
              </span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">目標目安 85%以上</p>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" />
              <span>平均 熟睡感</span>
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {summary.avgQuality.toFixed(1)}
              <span className="ml-1 text-xs font-medium text-slate-400">
                / 5.0
              </span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              高いほどぐっすり
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span>平均 日中の支障度</span>
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {summary.avgImpairment.toFixed(1)}
              <span className="ml-1 text-xs font-medium text-slate-400">
                / 5.0
              </span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              低いほど日中が快適
            </p>
          </div>
        </div>
      )}

      {/* Chart 1: Sleep Duration & Efficiency */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_14px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              睡眠時間（TIB・TST）と睡眠効率の推移
            </h3>
            <p className="text-xs text-slate-500">
              棒グラフが睡眠時間（時間）、折れ線が睡眠効率（%）を示します
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-200" />
              総臥床 (TIB)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-600" />
              実睡眠 (TST)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              睡眠効率 (%)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="hours"
                domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax + 1))]}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={(v) => `${v}h`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="percent"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "#059669" }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<SleepDurationTooltip />} />
              <ReferenceLine
                yAxisId="percent"
                y={85}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeOpacity={0.65}
              />
              <Bar
                yAxisId="hours"
                dataKey="tibHours"
                name="総臥床時間"
                fill="#bae6fd"
                radius={[6, 6, 0, 0]}
                maxBarSize={26}
              />
              <Bar
                yAxisId="hours"
                dataKey="tstHours"
                name="実睡眠時間"
                fill="#0284c7"
                radius={[6, 6, 0, 0]}
                maxBarSize={26}
              />
              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="sleepEfficiency"
                name="睡眠効率"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart 2: Bedtime to Out-of-Bed Rhythm Schedule Chart */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_14px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                就寝〜起床の時間帯チャート（生活リズム）
              </h3>
              <p className="text-xs text-slate-500">
                毎日の寝る時間・起きる時間のズレを横バーで一目で確認できます
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-full bg-sky-200" />
              布団にいた時間
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-full bg-sky-600" />
              入眠〜目が覚めた時間
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            {/* Hour Scale Header */}
            <div className="flex items-center mb-2">
              <div className="w-16 shrink-0 text-[11px] font-medium text-slate-400">
                日付
              </div>
              <div className="relative flex-1 h-5">
                {scheduleChart.ticks.map((h) => {
                  const leftPct =
                    ((h - scheduleChart.minHour) / totalScheduleSpan) * 100;
                  return (
                    <span
                      key={h}
                      style={{ left: `${leftPct}%` }}
                      className="absolute -translate-x-1/2 text-[11px] font-medium text-slate-400 tabular-nums"
                    >
                      {formatTimelineHour(h)}
                    </span>
                  );
                })}
              </div>
              <div className="w-28 shrink-0 text-right text-[11px] font-medium text-slate-400">
                就寝 → 起床
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-2.5">
              {scheduleChart.rows.map((row) => {
                const tibLeft =
                  ((row.bedStart - scheduleChart.minHour) / totalScheduleSpan) *
                  100;
                const tibWidth =
                  ((row.outEnd - row.bedStart) / totalScheduleSpan) * 100;

                const sleepLeft =
                  ((row.onsetStart - scheduleChart.minHour) /
                    totalScheduleSpan) *
                  100;
                const sleepWidth = Math.max(
                  0.8,
                  ((row.wakeEnd - row.onsetStart) / totalScheduleSpan) * 100
                );

                return (
                  <div key={row.id} className="flex items-center group">
                    <div className="w-16 shrink-0 text-xs font-semibold text-slate-700 tabular-nums">
                      {row.dateLabel}
                    </div>
                    <div className="relative flex-1 h-7 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                      {/* Grid Lines */}
                      {scheduleChart.ticks.map((h) => {
                        const leftPct =
                          ((h - scheduleChart.minHour) / totalScheduleSpan) *
                          100;
                        return (
                          <div
                            key={h}
                            style={{ left: `${leftPct}%` }}
                            className="absolute inset-y-0 w-px bg-slate-200/70"
                          />
                        );
                      })}

                      {/* TIB bar */}
                      <div
                        style={{
                          left: `${Math.max(0, tibLeft)}%`,
                          width: `${Math.min(100, tibWidth)}%`,
                        }}
                        title={`${row.fullDate}: 就寝 ${row.bedtime} 〜 起床 ${row.outOfBed}`}
                        className="absolute top-1.5 bottom-1.5 rounded-full bg-sky-200/90 transition-all"
                      />

                      {/* Sleep Onset -> Wake bar */}
                      <div
                        style={{
                          left: `${Math.max(0, sleepLeft)}%`,
                          width: `${Math.min(100, sleepWidth)}%`,
                        }}
                        title={`入眠 ${row.sleepOnset} 〜 目が覚めた ${row.wakeTime} (SE ${row.sleepEfficiency.toFixed(1)}%)`}
                        className="absolute top-2 bottom-2 rounded-full bg-sky-600 shadow-xs transition-all group-hover:bg-sky-700"
                      />
                    </div>
                    <div className="w-28 shrink-0 text-right text-[11px] font-medium text-slate-600 tabular-nums">
                      {row.bedtime} → {row.outOfBed}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Chart 3: Quality & Daytime Impairment Scores */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_14px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              熟睡感・日中の支障度スコアの推移
            </h3>
            <p className="text-xs text-slate-500">
              熟睡感（高いほど良い）と日中の支障度（低いほど良い）のバランスを確認
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
              熟睡感 (1〜5)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              日中の支障度 (1〜5)
            </span>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ScoreTooltip />} />
              <Line
                type="monotone"
                dataKey="qualityScore"
                name="熟睡感スコア"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#0284c7", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="impairmentScore"
                name="日中の支障度"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="5 3"
                dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
