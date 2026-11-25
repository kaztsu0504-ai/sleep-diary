import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
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
      : undefined;

  return <LoginForm initialError={initialError} />;
}
