"use client";

import {
  Calendar,
  Clock,
  FileText,
  Moon,
  Save,
  Sun,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import type { SleepLogInput, SleepLogRow } from "@/types/sleep";
import {
  DAYTIME_IMPAIRMENT_LABELS,
  SLEEP_QUALITY_LABELS,
} from "@/lib/sleep-advice";

interface SleepFormProps {
  value: SleepLogInput;
  onChange: (next: SleepLogInput) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  editingRecord: SleepLogRow | null;
  onCancelEdit: () => void;
  existingForSelectedDate: SleepLogRow | null;
  onLoadExisting: (record: SleepLogRow) => void;
}

const WASO_PRESETS = [0, 10, 20, 30, 60];
const MEMO_TAGS = [
  "カフェイン摂取",
  "アルコール摂取",
  "入浴あり",
  "就寝前スマホ",
  "軽い運動あり",
  "考え事で眠れず",
  "昼寝",
  "うたた寝",
];

export function SleepForm({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  errorMessage,
  editingRecord,
  onCancelEdit,
  existingForSelectedDate,
  onLoadExisting,
}: SleepFormProps) {
  function updateField<K extends keyof SleepLogInput>(
    key: K,
    fieldValue: SleepLogInput[K]
  ) {
    onChange({ ...value, [key]: fieldValue });
  }

  function appendMemoTag(tag: string) {
    const trimmed = value.memo.trim();
    if (trimmed.includes(tag)) return;
    const nextMemo = trimmed ? `${trimmed} / ${tag}` : tag;
    updateField("memo", nextMemo);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-3xl bg-white p-5 sm:p-7 border border-slate-200/80 shadow-[0_2px_14px_rgba(15,23,42,0.04)]"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-5 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
            <Sparkles className="h-3.5 w-3.5" />
            {editingRecord ? "過去の記録を編集中" : "今日の睡眠を記録"}
          </span>
          <h2 className="mt-1.5 text-lg sm:text-xl font-bold text-slate-900">
            睡眠日誌の入力
          </h2>
        </div>

        {editingRecord && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            編集をキャンセル
          </button>
        )}
      </div>

      {/* Duplicate date notice */}
      {!editingRecord && existingForSelectedDate && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-xs text-sky-900">
          <span>
            <strong>{existingForSelectedDate.log_date}</strong>{" "}
            は記録済みです。このまま保存すると上書き更新されます。
          </span>
          <button
            type="button"
            onClick={() => onLoadExisting(existingForSelectedDate)}
            className="rounded-lg bg-white px-2.5 py-1 font-semibold text-sky-700 border border-sky-200 hover:bg-sky-50 cursor-pointer"
          >
            記録を読み込んで編集
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="mt-5 space-y-6">
        {/* 1. 記録対象の日付 */}
        <div>
          <label
            htmlFor="log_date"
            className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
              1
            </span>
            <Calendar className="h-4 w-4 text-sky-600" />
            記録対象の日付
            <span className="text-xs font-normal text-slate-400">
              （起きた日の日付がおすすめ）
            </span>
          </label>
          <input
            id="log_date"
            type="date"
            required
            value={value.log_date}
            onChange={(e) => updateField("log_date", e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-900 tabular-nums focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
          />
        </div>

        {/* 2 & 3. 就寝・入眠時刻 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <label
              htmlFor="bedtime"
              className="flex items-center gap-2 text-sm font-semibold text-slate-800"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                2
              </span>
              <Moon className="h-4 w-4 text-sky-600" />
              就寝時刻
            </label>
            <p className="mt-0.5 text-xs text-slate-500">寝床に入った時間</p>
            <input
              id="bedtime"
              type="time"
              required
              value={value.bedtime}
              onChange={(e) => updateField("bedtime", e.target.value)}
              className="mt-2.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <label
              htmlFor="sleep_onset_time"
              className="flex items-center gap-2 text-sm font-semibold text-slate-800"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                3
              </span>
              <Clock className="h-4 w-4 text-sky-600" />
              入眠時刻
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              実際に眠りについた時間
            </p>
            <input
              id="sleep_onset_time"
              type="time"
              required
              value={value.sleep_onset_time}
              onChange={(e) => updateField("sleep_onset_time", e.target.value)}
              className="mt-2.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
            />
          </div>
        </div>

        {/* 4. 中途覚醒 */}
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label
                htmlFor="waso_minutes"
                className="flex items-center gap-2 text-sm font-semibold text-slate-800"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                  4
                </span>
                中途覚醒（合計分数）
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                途中で目が覚めて再び眠るまでにかかった時間
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                id="waso_minutes"
                type="number"
                min={0}
                max={720}
                step={1}
                required
                value={value.waso_minutes}
                onChange={(e) =>
                  updateField(
                    "waso_minutes",
                    Math.max(0, Math.min(720, Number(e.target.value) || 0))
                  )
                }
                className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-base font-semibold text-slate-900 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
              />
              <span className="text-sm font-medium text-slate-600">分</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {WASO_PRESETS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => updateField("waso_minutes", mins)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums transition cursor-pointer ${
                  value.waso_minutes === mins
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-700"
                }`}
              >
                {mins}分
              </button>
            ))}
          </div>
        </div>

        {/* 5 & 6. 目が覚めた時間・起床時刻 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <label
              htmlFor="wake_time"
              className="flex items-center gap-2 text-sm font-semibold text-slate-800"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                5
              </span>
              <Sun className="h-4 w-4 text-amber-500" />
              目が覚めた時間
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              最後に目が覚めた時刻
            </p>
            <input
              id="wake_time"
              type="time"
              required
              value={value.wake_time}
              onChange={(e) => updateField("wake_time", e.target.value)}
              className="mt-2.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <label
              htmlFor="out_of_bed_time"
              className="flex items-center gap-2 text-sm font-semibold text-slate-800"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                6
              </span>
              <Sun className="h-4 w-4 text-sky-600" />
              起床時刻
            </label>
            <p className="mt-0.5 text-xs text-slate-500">布団から出た時間</p>
            <input
              id="out_of_bed_time"
              type="time"
              required
              value={value.out_of_bed_time}
              onChange={(e) => updateField("out_of_bed_time", e.target.value)}
              className="mt-2.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
            />
          </div>
        </div>

        {/* 7. 熟睡感スコア */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                7
              </span>
              熟睡感スコア
            </span>
            <span className="text-xs font-semibold text-sky-700">
              {value.sleep_quality_score}：{SLEEP_QUALITY_LABELS[value.sleep_quality_score]}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((score) => {
              const selected = value.sleep_quality_score === score;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => updateField("sleep_quality_score", score)}
                  className={`rounded-2xl border py-2.5 px-1 text-center transition cursor-pointer ${
                    selected
                      ? "border-sky-500 bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                      : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-sky-300 hover:bg-sky-50/40"
                  }`}
                >
                  <div className="text-base font-bold tabular-nums">{score}</div>
                  <div
                    className={`mt-0.5 text-[10px] leading-tight ${
                      selected ? "text-sky-100" : "text-slate-400"
                    }`}
                  >
                    {score === 1
                      ? "全くなし"
                      : score === 5
                      ? "ぐっすり"
                      : SLEEP_QUALITY_LABELS[score]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 8. 日中の支障度スコア */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                8
              </span>
              日中の支障度スコア
            </span>
            <span className="text-xs font-semibold text-amber-700">
              {value.daytime_impairment_score}：
              {DAYTIME_IMPAIRMENT_LABELS[value.daytime_impairment_score]}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((score) => {
              const selected = value.daytime_impairment_score === score;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => updateField("daytime_impairment_score", score)}
                  className={`rounded-2xl border py-2.5 px-1 text-center transition cursor-pointer ${
                    selected
                      ? score >= 4
                        ? "border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                        : "border-sky-500 bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                      : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-sky-300 hover:bg-sky-50/40"
                  }`}
                >
                  <div className="text-base font-bold tabular-nums">{score}</div>
                  <div
                    className={`mt-0.5 text-[10px] leading-tight ${
                      selected ? "text-white/90" : "text-slate-400"
                    }`}
                  >
                    {score === 1
                      ? "支障なし"
                      : score === 5
                      ? "強い眠気"
                      : DAYTIME_IMPAIRMENT_LABELS[score]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 9. メモ */}
        <div>
          <label
            htmlFor="memo"
            className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-1.5"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
              9
            </span>
            <FileText className="h-4 w-4 text-sky-600" />
            メモ
            <span className="text-xs font-normal text-slate-400">（任意）</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            カフェイン・アルコールの摂取、入浴時間、昼寝・うたた寝、眠れなかった理由などを記録できます
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {MEMO_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => appendMemoTag(tag)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>
          <textarea
            id="memo"
            rows={3}
            maxLength={2000}
            value={value.memo}
            onChange={(e) => updateField("memo", e.target.value)}
            placeholder="例：15時にコーヒー1杯。21:30に湯船で15分入浴。布団に入ってから仕事のことが気になり少し寝つきが悪かった。"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition resize-y"
          />
        </div>

        {/* Submit CTA */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {isSubmitting
              ? "保存しています..."
              : editingRecord
              ? "睡眠日誌を更新する"
              : "睡眠日誌を記録する"}
          </button>
        </div>
      </div>
    </form>
  );
}
