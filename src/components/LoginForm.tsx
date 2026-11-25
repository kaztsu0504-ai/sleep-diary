"use client";

import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
} from "@/app/actions/auth";

type AuthMode = "signin" | "signup" | "reset";

interface LoginFormProps {
  initialError?: string;
  initialMode?: AuthMode;
}

export function LoginForm({
  initialError,
  initialMode = "signin",
}: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSwitchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setSuccessMessage(null);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result =
        mode === "signin"
          ? await signInAction(formData)
          : mode === "signup"
          ? await signUpAction(formData)
          : await requestPasswordResetAction(formData);
      if (result?.error) {
        setError(result.error);
      }
      if (result?.successMessage) {
        setSuccessMessage(result.successMessage);
      }
    });
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Calm Healthcare Intro Panel */}
        <section className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-sky-600 via-sky-500 to-blue-600 p-7 sm:p-8 text-white shadow-[0_14px_40px_rgba(2,132,199,0.22)] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-2xl bg-white/15 px-3.5 py-2 backdrop-blur-sm border border-white/20">
              <Moon className="h-5 w-5 text-sky-100" />
              <span className="text-sm font-semibold tracking-wide">
                すいみん日誌
              </span>
            </div>

            <h1 className="mt-6 text-2xl sm:text-3xl font-bold leading-snug tracking-tight">
              毎日の眠りを見える化し、
              <br />
              心地よい朝へ。
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-sky-100/95">
              就寝・入眠・起床を記録するだけで、総臥床時間・実睡眠時間・睡眠効率を自動計算。あなたの記録に合わせた改善アドバイスをお届けします。
            </p>
          </div>

          <ul className="mt-8 space-y-3.5 text-sm">
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Sparkles className="h-4 w-4 text-sky-100" />
              </div>
              <div>
                <p className="font-semibold">自動計算＆個別アドバイス</p>
                <p className="text-xs text-sky-100/85">
                  TIB・TST・睡眠効率(SE)・覚醒時間を即座に算出
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <LineChart className="h-4 w-4 text-sky-100" />
              </div>
              <div>
                <p className="font-semibold">推移グラフ＆生活リズム可視化</p>
                <p className="text-xs text-sky-100/85">
                  週次・月次の変化と就寝〜起床のリズムを一目で把握
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <ShieldCheck className="h-4 w-4 text-sky-100" />
              </div>
              <div>
                <p className="font-semibold">スマホ・PCで安全にクラウド同期</p>
                <p className="text-xs text-sky-100/85">
                  あなた専用の睡眠データを安全に保存・CSV出力も可能
                </p>
              </div>
            </li>
          </ul>
        </section>

        {/* Right: Auth Card */}
        <section className="lg:col-span-7 rounded-3xl bg-white p-7 sm:p-9 border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.05)] flex flex-col justify-center">
          {/* Mode Toggle or Back to Login */}
          {mode === "reset" ? (
            <div>
              <button
                type="button"
                onClick={() => handleSwitchMode("signin")}
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 -ml-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                ログイン画面に戻る
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => handleSwitchMode("signin")}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                ログイン
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("signup")}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                新規アカウント登録
              </button>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-xl font-bold text-slate-900">
              {mode === "signin"
                ? "おかえりなさい"
                : mode === "signup"
                ? "睡眠日誌をはじめましょう"
                : "パスワードの再設定"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "signin"
                ? "登録済みのメールアドレスとパスワードでログインしてください。"
                : mode === "signup"
                ? "メールアドレスとパスワードを設定して個人の記録スペースを作成します。"
                : "登録済みのメールアドレスを入力すると、パスワード再設定用のリンクを送信します。"}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form action={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
                />
              </div>
            </div>

            {mode !== "reset" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    パスワード
                    {mode === "signup" && (
                      <span className="ml-1.5 text-xs font-normal text-slate-400">
                        （6文字以上）
                      </span>
                    )}
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("reset")}
                      className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline transition cursor-pointer"
                    >
                      パスワードをお忘れですか？
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "signin" ? "current-password" : "new-password"
                    }
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "パスワードを隠す" : "パスワードを表示"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  パスワード（確認用）
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    placeholder="もう一度入力してください"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full rounded-xl bg-sky-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {isPending
                ? "処理中..."
                : mode === "signin"
                ? "ログインする"
                : mode === "signup"
                ? "アカウントを作成する"
                : "再設定メールを送信する"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            記録された睡眠データはログイン中のアカウントのみが閲覧・編集できます。
          </p>
        </section>
      </div>
    </div>
  );
}
