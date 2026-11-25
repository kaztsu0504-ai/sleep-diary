"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Moon,
} from "lucide-react";
import { updatePasswordAction } from "@/app/actions/auth";

interface ResetPasswordFormProps {
  hasSession: boolean;
  userEmail: string;
}

export function ResetPasswordForm({
  hasSession,
  userEmail,
}: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await updatePasswordAction(formData);
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
      <div className="w-full max-w-md rounded-3xl bg-white p-7 sm:p-9 border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-sky-50 px-3.5 py-2 border border-sky-100 text-sky-700">
          <Moon className="h-4 w-4 text-sky-600" />
          <span className="text-xs font-semibold tracking-wide">
            すいみん日誌
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              新しいパスワードを設定
            </h1>
            {userEmail && (
              <p className="text-xs text-slate-500 mt-0.5">{userEmail}</p>
            )}
          </div>
        </div>

        {!hasSession ? (
          <div className="mt-6 space-y-4">
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                パスワード再設定リンクの有効期限が切れているか、認証セッションが見つかりません。お手数ですが、再度メールを送信してください。
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                href="/login?mode=reset"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 transition"
              >
                再設定メールをもう一度送る
              </Link>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                ログイン画面へ戻る
              </Link>
            </div>
          </div>
        ) : successMessage ? (
          <div className="mt-6 space-y-5">
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 transition"
            >
              すいみん日誌を開く
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-500">
              6文字以上の新しいパスワードを入力してください。
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form action={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  新しいパスワード
                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                    （6文字以上）
                  </span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
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

              <div>
                <label
                  htmlFor="new-password-confirm"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  新しいパスワード（確認用）
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="new-password-confirm"
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

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 w-full rounded-xl bg-sky-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {isPending ? "更新中..." : "パスワードを更新する"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
