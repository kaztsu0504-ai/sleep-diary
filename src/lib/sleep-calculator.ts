import type { SleepMetrics } from "@/types/sleep";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeString(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function parseTimeToMinutes(hhmm: string): number {
  const [hoursStr, minutesStr] = hhmm.split(":");
  return Number(hoursStr) * 60 + Number(minutesStr);
}

/**
 * 2つの時刻(HH:MM)の経過分数を返す（日付をまたぐ場合にも対応）
 */
export function diffMinutes(startHHMM: string, endHHMM: string): number {
  const start = parseTimeToMinutes(startHHMM);
  const end = parseTimeToMinutes(endHHMM);
  return (end - start + 1440) % 1440;
}

export type SleepCalculationResult =
  | { ok: true; metrics: SleepMetrics }
  | { ok: false; error: string };

export function calculateSleepMetrics(input: {
  bedtime: string;
  sleep_onset_time: string;
  waso_minutes: number;
  wake_time: string;
  out_of_bed_time: string;
}): SleepCalculationResult {
  const { bedtime, sleep_onset_time, waso_minutes, wake_time, out_of_bed_time } = input;

  if (
    !isValidTimeString(bedtime) ||
    !isValidTimeString(sleep_onset_time) ||
    !isValidTimeString(wake_time) ||
    !isValidTimeString(out_of_bed_time)
  ) {
    return { ok: false, error: "時刻は HH:MM 形式で入力してください。" };
  }

  if (!Number.isFinite(waso_minutes) || waso_minutes < 0 || waso_minutes > 720) {
    return { ok: false, error: "中途覚醒時間は 0〜720 分の範囲で入力してください。" };
  }

  const normalizedWaso = Math.round(waso_minutes);
  const sleepLatencyMinutes = diffMinutes(bedtime, sleep_onset_time);
  const sleepPeriodMinutes = diffMinutes(sleep_onset_time, wake_time);
  const morningAwakeMinutes = diffMinutes(wake_time, out_of_bed_time);

  if (sleepLatencyMinutes > 720) {
    return {
      ok: false,
      error: "入眠時刻が就寝時刻より前になっている可能性があります。時刻をご確認ください。",
    };
  }

  if (sleepPeriodMinutes === 0) {
    return {
      ok: false,
      error: "入眠時刻と目が覚めた時間が同じです。時刻をご確認ください。",
    };
  }

  if (morningAwakeMinutes > 720) {
    return {
      ok: false,
      error: "起床時刻が目が覚めた時間より前になっている可能性があります。時刻をご確認ください。",
    };
  }

  const tibMinutes = sleepLatencyMinutes + sleepPeriodMinutes + morningAwakeMinutes;
  if (tibMinutes <= 0 || tibMinutes > 1440) {
    return {
      ok: false,
      error: "就寝から起床までの合計時間が24時間を超えています。各時刻の前後関係をご確認ください。",
    };
  }

  if (normalizedWaso > sleepPeriodMinutes) {
    return {
      ok: false,
      error: "中途覚醒時間が、入眠から目が覚めた時間までの長さを超えています。",
    };
  }

  const totalAwakeMinutes = sleepLatencyMinutes + normalizedWaso + morningAwakeMinutes;
  const tstMinutes = tibMinutes - totalAwakeMinutes;
  const sleepEfficiency = Math.round((tstMinutes / tibMinutes) * 1000) / 10;

  return {
    ok: true,
    metrics: {
      tibMinutes,
      tstMinutes,
      sleepEfficiency,
      totalAwakeMinutes,
      sleepLatencyMinutes,
      morningAwakeMinutes,
    },
  };
}

export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function formatMinutesToHoursDecimal(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

export function getSleepEfficiencyStatus(se: number): {
  label: string;
  tone: "excellent" | "moderate" | "low";
} {
  if (se >= 85) return { label: "良好", tone: "excellent" };
  if (se >= 75) return { label: "やや低め", tone: "moderate" };
  return { label: "改善の余地あり", tone: "low" };
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateJP(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const w = weekdays[date.getDay()];
  return `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")} (${w})`;
}

export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  if (!m || !d) return dateStr;
  return `${Number(m)}/${Number(d)}`;
}

/**
 * 睡眠時間帯チャート用に 18:00 を 0 基準（18:00〜翌18:00 = 18.0〜42.0）へ変換する
 */
export function toTimelineHour(hhmm: string): number {
  const minutes = parseTimeToMinutes(hhmm);
  const hours = minutes / 60;
  return hours < 18 ? hours + 24 : hours;
}

export function formatTimelineHour(hourValue: number): string {
  const normalized = ((Math.round(hourValue * 60) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
