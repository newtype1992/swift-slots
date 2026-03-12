"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toMessage(error: string | null | undefined, fallback: string) {
  return encodeURIComponent(error || fallback);
}

function nextPath(formData: FormData) {
  const rawNext = String(formData.get("next") || "").trim();

  if (!rawNext.startsWith("/")) {
    return "/dashboard";
  }

  return rawNext;
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = nextPath(formData);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/auth?error=${toMessage(error.message, "Unable to sign in.")}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = nextPath(formData);

  const origin = (await headers()).get("origin") || process.env.APP_URL || "http://localhost:3000";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/dashboard`,
    },
  });

  if (error) {
    redirect(`/auth?error=${toMessage(error.message, "Unable to sign up.")}&next=${encodeURIComponent(next)}`);
  }

  if (!data.session) {
    redirect(
      `/auth?message=Check%20your%20email%20to%20complete%20sign%20up.&next=${encodeURIComponent(next)}`
    );
  }

  redirect(next);
}
