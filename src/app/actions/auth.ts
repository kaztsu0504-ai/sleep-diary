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
  if (lower.includes("different from the old password")) {
    return "現在と同じパスワードは設定できません。別のパスワードを入力してください。";
  }
  const waitMatch = lower.match(/only request this after (\d+) seconds/);
  if (waitMatch) {
    return `セキュリティ保護のため、あと ${waitMatch[1]} 秒ほど待ってから再度お試しください。`;
  }
  if (lower.includes("email rate limit exceeded")) {
    return "メール送信回数の上限に達しました。しばらく時間（最大1時間ほど）をおいてから再度お試しください。";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "リクエストが集中しています。1分ほど待ってから再度お試しください。";
  }
  if (lower.includes("invalid email")) {
    return "有効なメールアドレスを入力してください。";
  }
  return `認証エラーが発生しました（${message}）`;
}

async function getRequestOrigin(): Promise<string> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return "";

  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${proto}://${host}`;
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

  const origin = await getRequestOrigin();

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

export async function requestPasswordResetAction(
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "メールアドレスを入力してください。" };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin
      ? `${origin}/auth/callback?next=/auth/reset-password`
      : undefined,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return {
    successMessage:
      "パスワード再設定用のメールを送信しました。メール内のリンクを開いて新しいパスワードを設定してください（届かない場合は迷惑メールフォルダもご確認ください）。",
  };
}

export async function updatePasswordAction(
  formData: FormData
): Promise<AuthActionResult> {
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const tokenHash = String(formData.get("tokenHash") ?? "").trim();

  if (!password) {
    return { error: "新しいパスワードを入力してください。" };
  }
  if (password.length < 6) {
    return { error: "パスワードは6文字以上で入力してください。" };
  }
  if (password !== passwordConfirm) {
    return { error: "確認用パスワードが一致していません。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (!tokenHash) {
      return {
        error:
          "認証セッションが見つかりません。パスワード再設定メールのリンクをもう一度開いてください。",
      };
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });

    if (verifyError) {
      return {
        error:
          "パスワード再設定リンクの有効期限が切れているか、すでに使用されています。ログイン画面から再設定メールをもう一度送信してください。",
      };
    }
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return {
    successMessage:
      "パスワードを更新しました。このまま「すいみん日誌」をご利用いただけます。",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
