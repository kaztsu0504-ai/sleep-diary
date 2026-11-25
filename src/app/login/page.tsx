import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; mode?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/");
  }

  const params = await searchParams;
  const initialError =
    params.error === "auth_callback_failed"
      ? "メール認証リンクの検証に失敗しました。もう一度ログインまたは新規登録をお試しください。"
      : params.error === "reset_link_expired"
      ? "パスワード再設定リンクの有効期限が切れているか無効です。もう一度再設定メールを送信してください。"
      : undefined;

  const initialMode = params.mode === "reset" ? "reset" : "signin";

  return <LoginForm initialError={initialError} initialMode={initialMode} />;
}
