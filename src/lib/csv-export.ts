import type { SleepLogRow } from "@/types/sleep";

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildSleepLogsCsv(logs: SleepLogRow[]): string {
  const headers = [
    "記録日",
    "就寝時刻",
    "入眠時刻",
    "入眠所要時間(分)",
    "中途覚醒(分)",
    "目が覚めた時刻",
    "起床時刻",
    "起床前覚醒(分)",
    "総臥床時間TIB(分)",
    "実睡眠時間TST(分)",
    "睡眠効率SE(%)",
    "覚醒合計時間(分)",
    "熟睡感スコア(1-5)",
    "日中の支障度スコア(1-5)",
    "メモ",
  ];

  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));

  const rows = sorted.map((log) =>
    [
      log.log_date,
      log.bedtime,
      log.sleep_onset_time,
      log.sleep_latency_minutes,
      log.waso_minutes,
      log.wake_time,
      log.out_of_bed_time,
      log.morning_awake_minutes,
      log.tib_minutes,
      log.tst_minutes,
      Number(log.sleep_efficiency).toFixed(1),
      log.total_awake_minutes,
      log.sleep_quality_score,
      log.daytime_impairment_score,
      log.memo,
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  // UTF-8 BOM付きでExcelの文字化けを防止
  return `\uFEFF${headers.join(",")}\r\n${rows.join("\r\n")}`;
}

export function downloadSleepLogsCsv(logs: SleepLogRow[]): void {
  const csv = buildSleepLogsCsv(logs);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `sleep-diary_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
