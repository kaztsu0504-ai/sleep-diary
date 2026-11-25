"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionResult {
  error?: string;
  successMessage?: string;
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (lower.includes("email not confirmed")) {
    return "メールアドレスの確認が完了していません。受信トレイの確認メールを開いて認証を完了してください。";
  }
  if (lower.includes("user already registered")) {
    return "このメールアドレスはすでに登録されています。ログインをお試しください。";
  }
  if (lower.includes("password should be at least")) {
    return "パスワードは6文字以上で設定してください。";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "リクエストが集中しています。しばらく時間をおいてから再度お試しください。";
  }
  if (lower.includes("invalid email")) {
    return "有効なメールアドレスを入力してください。";
  }
  return `認証エラーが発生しました（${message}）`;
}

export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  redirect("/");
}

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }
  if (password.length < 6) {
    return { error: "パスワードは6文字以上で入力してください。" };
  }
  if (password !== passwordConfirm) {
    return { error: "確認用パスワードが一致していません。" };
  }

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    (headerList.get("host") ? `http://${headerList.get("host")}` : "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: origin
      ? {
          emailRedirectTo: `${origin}/auth/callback`,
        }
      : undefined,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  if (data.session) {
    redirect("/");
  }

  return {
    successMessage:
      "確認メールを送信しました。メール内のリンクをクリックして登録を完了した後、ログインしてください。",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
