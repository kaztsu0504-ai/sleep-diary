"use client";

import { useMemo, useState, useTransition } from "react";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Download,
  LogOut,
  Moon,
  PenLine,
} from "lucide-react";
import type { SleepLogInput, SleepLogRow } from "@/types/sleep";
import { getTodayDateString } from "@/lib/sleep-calculator";
import { downloadSleepLogsCsv } from "@/lib/csv-export";
import {
  deleteSleepLogAction,
  saveSleepLogAction,
} from "@/app/actions/sleep-logs";
import { signOutAction } from "@/app/actions/auth";
import { SleepForm } from "@/components/SleepForm";
import { MetricsAndAdvicePanel } from "@/components/MetricsAndAdvicePanel";
import { SleepCharts } from "@/components/SleepCharts";
import { SleepHistory } from "@/components/SleepHistory";

interface SleepDiaryDashboardProps {
  initialLogs: SleepLogRow[];
  userEmail: string;
}

type TabKey = "record" | "charts" | "history";

function createDefaultInput(): SleepLogInput {
  return {
    log_date: getTodayDateString(),
    bedtime: "23:00",
    sleep_onset_time: "23:20",
    waso_minutes: 10,
    wake_time: "06:20",
    out_of_bed_time: "06:35",
    sleep_quality_score: 3,
    daytime_impairment_score: 2,
    memo: "",
  };
}

function recordToInput(record: SleepLogRow): SleepLogInput {
  return {
    log_date: record.log_date,
    bedtime: record.bedtime,
    sleep_onset_time: record.sleep_onset_time,
    waso_minutes: record.waso_minutes,
    wake_time: record.wake_time,
    out_of_bed_time: record.out_of_bed_time,
    sleep_quality_score: record.sleep_quality_score,
    daytime_impairment_score: record.daytime_impairment_score,
    memo: record.memo,
  };
}

export function SleepDiaryDashboard({
  initialLogs,
  userEmail,
}: SleepDiaryDashboardProps) {
  const [logs, setLogs] = useState<SleepLogRow[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<TabKey>("record");
  const [formValue, setFormValue] = useState<SleepLogInput>(() =>
    createDefaultInput()
  );
  const [editingRecord, setEditingRecord] = useState<SleepLogRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isSigningOut, startSignOutTransition] = useTransition();

  const existingForSelectedDate = useMemo(
    () => logs.find((l) => l.log_date === formValue.log_date) ?? null,
    [logs, formValue.log_date]
  );

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 4500);
  }

  function handleSave() {
    setFormError(null);
    startSaveTransition(async () => {
      const result = await saveSleepLogAction(
        formValue,
        editingRecord?.id ?? null
      );

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setLogs((prev) => {
        const filtered = prev.filter((item) => item.id !== result.record.id);
        return [result.record, ...filtered].sort((a, b) =>
          b.log_date.localeCompare(a.log_date)
        );
      });

      setEditingRecord(null);
      showToast(
        result.mode === "updated"
          ? `${result.record.log_date} の睡眠日誌を更新しました。`
          : `${result.record.log_date} の睡眠日誌を記録しました。`
      );
    });
  }

  function handleStartEdit(record: SleepLogRow) {
    setEditingRecord(record);
    setFormValue(recordToInput(record));
    setFormError(null);
    setActiveTab("record");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingRecord(null);
    setFormValue(createDefaultInput());
    setFormError(null);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    const result = await deleteSleepLogAction(id);
    setDeletingId(null);

    if (!result.ok) {
      showToast(result.error);
      return;
    }

    setLogs((prev) => prev.filter((item) => item.id !== id));
    if (editingRecord?.id === id) {
      setEditingRecord(null);
      setFormValue(createDefaultInput());
    }
    showToast("記録を削除しました。");
  }

  function handleSignOut() {
    startSignOutTransition(async () => {
      await signOutAction();
    });
  }

  const navItems: { key: TabKey; label: string; icon: typeof PenLine }[] = [
    { key: "record", label: "記録する", icon: PenLine },
    { key: "charts", label: "グラフ・分析", icon: BarChart3 },
    { key: "history", label: "履歴一覧", icon: ClipboardList },
  ];

  return (
    <div className="min-h-dvh pb-24 md:pb-12">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/25">
              <Moon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
                すいみん日誌
              </h1>
              <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">
                Sleep Diary &amp; Advice
              </p>
            </div>
          </div>

          {/* Desktop Tabs */}
          <nav
            aria-label="メインナビゲーション"
            className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100/90 p-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                    active
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.key === "history" && logs.length > 0 && (
                    <span className="ml-0.5 rounded-full bg-sky-100 px-1.5 py-0.2 text-[11px] font-bold text-sky-700 tabular-nums">
                      {logs.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right User Controls */}
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => downloadSleepLogsCsv(logs)}
                title="全記録をCSVエクスポート"
                className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            )}
            <span
              title={userEmail}
              className="hidden sm:inline-block max-w-[160px] truncate rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              {userEmail}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Toast Banner */}
        {toast && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-xs"
          >
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
            <span>{toast}</span>
          </div>
        )}

        {activeTab === "record" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <SleepForm
                value={formValue}
                onChange={setFormValue}
                onSubmit={handleSave}
                isSubmitting={isSaving}
                errorMessage={formError}
                editingRecord={editingRecord}
                onCancelEdit={handleCancelEdit}
                existingForSelectedDate={existingForSelectedDate}
                onLoadExisting={handleStartEdit}
              />
            </div>

            <div className="lg:col-span-5 lg:sticky lg:top-22">
              <MetricsAndAdvicePanel input={formValue} recentLogs={logs} />
            </div>
          </div>
        )}

        {activeTab === "charts" && (
          <SleepCharts
            logs={logs}
            onGoToRecord={() => setActiveTab("record")}
          />
        )}

        {activeTab === "history" && (
          <SleepHistory
            logs={logs}
            onEdit={handleStartEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
            onGoToRecord={() => setActiveTab("record")}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="モバイルナビゲーション"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-3 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition cursor-pointer ${
                  active
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
