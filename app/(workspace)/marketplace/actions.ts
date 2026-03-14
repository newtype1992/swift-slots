"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function resolveRedirectTarget(formData: FormData, fallbackPath: string) {
  const redirectTo = String(formData.get("redirectTo") || "").trim();

  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return redirectTo;
  }

  return fallbackPath;
}

function withFlash(path: string, type: "error" | "message", value: string) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(type, value);
  return `${url.pathname}${url.search}`;
}

async function requireAuthenticatedConsumer() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?error=You%20must%20sign%20in%20first.&next=%2Fmarketplace");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: "studio_operator" | "consumer" }>();

  if (error || !profile || profile.role !== "consumer") {
    redirect("/settings/profile?error=Switch%20this%20account%20to%20Consumer%20to%20book%20marketplace%20slots.");
  }

  return { supabase, user, profile };
}

export async function createBookingAction(formData: FormData) {
  const slotId = String(formData.get("slotId") || "").trim();
  const fallback = slotId ? `/marketplace/${slotId}` : "/marketplace";
  const redirectTo = resolveRedirectTarget(formData, fallback);
  const { supabase } = await requireAuthenticatedConsumer();

  const { data, error } = await supabase
    .rpc("create_slot_booking", {
      p_slot_id: slotId,
    })
    .single<{ id: string }>();

  if (error || !data?.id) {
    redirect(withFlash(redirectTo, "error", error?.message || "Unable to create booking."));
  }

  redirect(`/marketplace/bookings/${data.id}?message=Booking%20confirmed.`);
}
