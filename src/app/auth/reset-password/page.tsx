import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const tokenHash =
    params.token_hash && (!params.type || params.type === "recovery")
      ? params.token_hash
      : undefined;

  return (
    <ResetPasswordForm
      hasSession={Boolean(user)}
      userEmail={user?.email ?? ""}
      tokenHash={tokenHash}
    />
  );
}
