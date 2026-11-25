export interface SleepLogRow {
  id: number;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  bedtime: string; // HH:MM
  sleep_onset_time: string; // HH:MM
  waso_minutes: number;
  wake_time: string; // HH:MM
  out_of_bed_time: string; // HH:MM
  sleep_quality_score: number; // 1-5
  daytime_impairment_score: number; // 1-5
  memo: string;
  tib_minutes: number;
  tst_minutes: number;
  sleep_efficiency: number;
  total_awake_minutes: number;
  sleep_latency_minutes: number;
  morning_awake_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface SleepLogInput {
  log_date: string;
  bedtime: string;
  sleep_onset_time: string;
  waso_minutes: number;
  wake_time: string;
  out_of_bed_time: string;
  sleep_quality_score: number;
  daytime_impairment_score: number;
  memo: string;
}

export interface SleepMetrics {
  tibMinutes: number;
  tstMinutes: number;
  sleepEfficiency: number;
  totalAwakeMinutes: number;
  sleepLatencyMinutes: number;
  morningAwakeMinutes: number;
}

export type AdviceCategory = "good" | "info" | "caution";

export interface AdviceItem {
  category: AdviceCategory;
  title: string;
  message: string;
  metricTag: string;
}

export interface AdviceSummary {
  headline: string;
  tone: "positive" | "balanced" | "attention";
  items: AdviceItem[];
}
