"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateSleepMetrics } from "@/lib/sleep-calculator";
import type { SleepLogInput, SleepLogRow } from "@/types/sleep";

export type SaveSleepLogResult =
  | { ok: true; record: SleepLogRow; mode: "created" | "updated" }
  | { ok: false; error: string };

export async function saveSleepLogAction(
  input: SleepLogInput,
  editingId?: number | null
): Promise<SaveSleepLogResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "ログインセッションが切れました。再度ログインしてください。" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.log_date)) {
    return { ok: false, error: "記録対象の日付を正しく選択してください。" };
  }

  if (
    !Number.isInteger(input.sleep_quality_score) ||
    input.sleep_quality_score < 1 ||
    input.sleep_quality_score > 5
  ) {
    return { ok: false, error: "熟睡感スコアは 1〜5 の範囲で選択してください。" };
  }

  if (
    !Number.isInteger(input.daytime_impairment_score) ||
    input.daytime_impairment_score < 1 ||
    input.daytime_impairment_score > 5
  ) {
    return { ok: false, error: "日中の支障度スコアは 1〜5 の範囲で選択してください。" };
  }

  const calc = calculateSleepMetrics({
    bedtime: input.bedtime,
    sleep_onset_time: input.sleep_onset_time,
    waso_minutes: Number(input.waso_minutes),
    wake_time: input.wake_time,
    out_of_bed_time: input.out_of_bed_time,
  });

  if (!calc.ok) {
    return { ok: false, error: calc.error };
  }

  const payload = {
    user_id: user.id,
    log_date: input.log_date,
    bedtime: input.bedtime,
    sleep_onset_time: input.sleep_onset_time,
    waso_minutes: Math.round(Number(input.waso_minutes)),
    wake_time: input.wake_time,
    out_of_bed_time: input.out_of_bed_time,
    sleep_quality_score: input.sleep_quality_score,
    daytime_impairment_score: input.daytime_impairment_score,
    memo: input.memo.trim().slice(0, 2000),
    tib_minutes: calc.metrics.tibMinutes,
    tst_minutes: calc.metrics.tstMinutes,
    sleep_efficiency: calc.metrics.sleepEfficiency,
    total_awake_minutes: calc.metrics.totalAwakeMinutes,
    sleep_latency_minutes: calc.metrics.sleepLatencyMinutes,
    morning_awake_minutes: calc.metrics.morningAwakeMinutes,
  };

  if (editingId) {
    const { data, error } = await supabase
      .from("sleep_logs")
      .update(payload)
      .eq("id", editingId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          error: "変更先の日付にはすでに別の記録が存在します。別の日付を選ぶか既存の記録を編集してください。",
        };
      }
      return { ok: false, error: `記録の更新に失敗しました: ${error.message}` };
    }

    revalidatePath("/");
    return { ok: true, record: data as SleepLogRow, mode: "updated" };
  }

  // 新規記録または同一日付の上書き保存
  const { data: existing } = await supabase
    .from("sleep_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("log_date", input.log_date)
    .maybeSingle();

  const { data, error } = await supabase
    .from("sleep_logs")
    .upsert(payload, { onConflict: "user_id,log_date" })
    .select()
    .single();

  if (error) {
    return { ok: false, error: `記録の保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/");
  return {
    ok: true,
    record: data as SleepLogRow,
    mode: existing ? "updated" : "created",
  };
}

export async function deleteSleepLogAction(
  id: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "ログインセッションが切れました。再度ログインしてください。" };
  }

  const { error } = await supabase
    .from("sleep_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath("/");
  return { ok: true };
}
