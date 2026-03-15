"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCategories(input: string) {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

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

function normalizeProvince(input: string) {
  return input.trim().toUpperCase() || "QC";
}

function parseMontrealDateTimeInput(input: string) {
  const raw = input.trim();

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    return null;
  }

  const [datePart, timePart] = raw.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const offsetValue = offsetFormatter
    .formatToParts(guess)
    .find((part) => part.type === "timeZoneName")
    ?.value.replace("GMT", "");

  if (offsetValue === undefined) {
    return null;
  }

  const normalizedOffset = (() => {
    if (offsetValue === "") {
      return "Z";
    }

    const match = offsetValue.match(/^([+-])(\d{1,2})(?::(\d{2}))?$/);

    if (!match) {
      return null;
    }

    const [, sign, hours, minutes] = match;
    return `${sign}${hours.padStart(2, "0")}:${(minutes || "00").padStart(2, "0")}`;
  })();

  if (!normalizedOffset) {
    return null;
  }

  const parsed = new Date(`${datePart}T${timePart}:00${normalizedOffset}`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?error=You%20must%20sign%20in%20first.");
  }

  return { supabase, user };
}

async function requireOrganizationOwner(organizationId: string) {
  const { supabase, user } = await requireAuthenticatedUser();
  const { data: membership, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();

  if (error || !membership || membership.role !== "owner") {
    redirect("/settings/organization?error=Only%20organization%20owners%20can%20update%20workspace%20settings.");
  }

  return { supabase, user };
}

async function requireStudioOperator() {
  const { supabase, user } = await requireAuthenticatedUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: "studio_operator" | "consumer" }>();

  if (error || !profile || profile.role !== "studio_operator") {
    redirect("/settings/profile?error=Switch%20your%20account%20to%20Studio%20operator%20before%20managing%20a%20studio.");
  }

  return { supabase, user, profile };
}

export async function updateProfileAction(formData: FormData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const role = String(formData.get("role") || "consumer").trim();
  const { supabase, user } = await requireAuthenticatedUser();
  const redirectTo = resolveRedirectTarget(formData, "/settings/profile");

  if (role !== "consumer" && role !== "studio_operator") {
    redirect(withFlash(redirectTo, "error", "Select a valid account role."));
  }

  if (role === "consumer") {
    const { data: studio } = await supabase.from("studios").select("id").eq("operator_user_id", user.id).maybeSingle<{ id: string }>();

    if (studio?.id) {
      redirect(
        withFlash(
          redirectTo,
          "error",
          "This account already owns a studio. Update or remove the studio before switching to consumer mode."
        )
      );
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      role,
    })
    .eq("id", user.id);

  if (error) {
    redirect(withFlash(redirectTo, "error", error.message));
  }

  redirect(withFlash(redirectTo, "message", "Profile updated."));
}

export async function upsertStudioProfileAction(formData: FormData) {
  const studioId = String(formData.get("studioId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const locationText = String(formData.get("locationText") || "").trim();
  const city = String(formData.get("city") || "").trim() || "Montreal";
  const province = normalizeProvince(String(formData.get("province") || ""));
  const postalCode = String(formData.get("postalCode") || "").trim();
  const classCategories = parseCategories(String(formData.get("classCategories") || ""));
  const redirectTo = resolveRedirectTarget(formData, "/settings/studio");

  if (!name || !locationText) {
    redirect(withFlash(redirectTo, "error", "Studio name and location are required."));
  }

  const slug = slugify(rawSlug || name);

  if (!slug) {
    redirect(withFlash(redirectTo, "error", "Studio slug could not be generated."));
  }

  const { supabase, user } = await requireStudioOperator();

  const payload = {
    operator_user_id: user.id,
    name,
    slug,
    description: description || null,
    location_text: locationText,
    city,
    province,
    postal_code: postalCode || null,
    class_categories: classCategories,
  };

  const query = studioId
    ? supabase.from("studios").update(payload).eq("id", studioId).eq("operator_user_id", user.id)
    : supabase.from("studios").insert(payload);

  const { error } = await query;

  if (error) {
    redirect(withFlash(redirectTo, "error", error.message));
  }

  redirect(withFlash(redirectTo, "message", studioId ? "Studio updated." : "Studio created."));
}

export async function createSlotAction(formData: FormData) {
  const studioId = String(formData.get("studioId") || "").trim();
  const classType = String(formData.get("classType") || "").trim();
  const startTimeRaw = String(formData.get("startTime") || "").trim();
  const classLengthMinutes = Number(formData.get("classLengthMinutes") || 60);
  const originalPrice = Number(formData.get("originalPrice") || 0);
  const discountPercent = Number(formData.get("discountPercent") || 0);
  const availableSpots = Number(formData.get("availableSpots") || 0);
  const redirectTo = resolveRedirectTarget(formData, "/settings/studio");

  if (!studioId || !classType) {
    redirect(withFlash(redirectTo, "error", "Studio and class type are required."));
  }

  if (!Number.isFinite(classLengthMinutes) || classLengthMinutes <= 0) {
    redirect(withFlash(redirectTo, "error", "Class length must be greater than zero."));
  }

  if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
    redirect(withFlash(redirectTo, "error", "Original price must be greater than zero."));
  }

  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent >= 100) {
    redirect(withFlash(redirectTo, "error", "Discount percent must be between 0 and 100."));
  }

  if (!Number.isFinite(availableSpots) || availableSpots < 1) {
    redirect(withFlash(redirectTo, "error", "Available spots must be at least 1."));
  }

  const startTime = parseMontrealDateTimeInput(startTimeRaw);

  if (!startTime) {
    redirect(withFlash(redirectTo, "error", "Enter a valid class start time."));
  }

  if (new Date(startTime).getTime() <= Date.now() + 15 * 60 * 1000) {
    redirect(withFlash(redirectTo, "error", "Slots must start at least 15 minutes in the future."));
  }

  const { supabase, user } = await requireStudioOperator();
  const { data: studio, error: studioError } = await supabase
    .from("studios")
    .select("id")
    .eq("id", studioId)
    .eq("operator_user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (studioError || !studio) {
    redirect(withFlash(redirectTo, "error", "That studio is not available to this account."));
  }

  const { error } = await supabase.from("slots").insert({
    studio_id: studioId,
    class_type: classType,
    start_time: startTime,
    class_length_minutes: classLengthMinutes,
    original_price: originalPrice,
    discount_percent: discountPercent,
    available_spots: availableSpots,
    status: "open",
  });

  if (error) {
    redirect(withFlash(redirectTo, "error", error.message));
  }

  redirect(withFlash(redirectTo, "message", "Slot posted."));
}

export async function updateOrganizationDetailsAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();

  if (!name) {
    redirect("/settings/organization?error=Organization%20name%20is%20required.");
  }

  const { supabase } = await requireOrganizationOwner(organizationId);
  const slug = slugify(rawSlug || name);
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      slug,
    })
    .eq("id", organizationId);

  if (error) {
    redirect(`/settings/organization?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/settings/organization?message=Organization%20settings%20updated.");
}
