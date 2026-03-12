"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function acceptInviteAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?message=Sign%20in%20to%20accept%20this%20invite.&next=${encodeURIComponent(`/invites/${token}`)}`);
  }

  const { error } = await supabase.rpc("accept_organization_invite", {
    p_token: token,
  });

  if (error) {
    redirect(`/invites/${token}?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?message=Invite%20accepted.");
}
