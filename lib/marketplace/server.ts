import { createSupabaseServerClient } from "@/lib/supabase/server";

type MarketplaceStudioRow = {
  id: string;
  name: string;
  slug: string;
  location_text: string;
  city: string;
  class_categories: string[] | null;
  latitude: number | null;
  longitude: number | null;
};

type MarketplaceSlotRow = {
  id: string;
  class_type: string;
  start_time: string;
  class_length_minutes: number;
  original_price: number;
  discount_percent: number;
  available_spots: number;
  status: string;
  studio_id: string;
  studios: MarketplaceStudioRow | MarketplaceStudioRow[] | null;
};

type BookingDetailRow = {
  id: string;
  payment_status: string;
  created_at: string;
  slot_id: string;
  slots:
    | ({
        id: string;
        class_type: string;
        start_time: string;
        class_length_minutes: number;
        original_price: number;
        discount_percent: number;
        available_spots: number;
        status: string;
        studios: MarketplaceStudioRow | MarketplaceStudioRow[] | null;
      } | null)
    | Array<{
        id: string;
        class_type: string;
        start_time: string;
        class_length_minutes: number;
        original_price: number;
        discount_percent: number;
        available_spots: number;
        status: string;
        studios: MarketplaceStudioRow | MarketplaceStudioRow[] | null;
      }>;
};

export type MarketplaceSlot = {
  id: string;
  class_type: string;
  start_time: string;
  class_length_minutes: number;
  original_price: number;
  discount_percent: number;
  available_spots: number;
  status: string;
  studio: MarketplaceStudioRow | null;
};

export type MarketplaceBooking = {
  id: string;
  payment_status: string;
  created_at: string;
  slot: MarketplaceSlot | null;
};

function normalizeStudio(studio: MarketplaceStudioRow | MarketplaceStudioRow[] | null) {
  if (Array.isArray(studio)) {
    return studio[0] ?? null;
  }

  return studio ?? null;
}

function normalizeSlot(row: MarketplaceSlotRow): MarketplaceSlot {
  return {
    id: row.id,
    class_type: row.class_type,
    start_time: row.start_time,
    class_length_minutes: row.class_length_minutes,
    original_price: Number(row.original_price),
    discount_percent: Number(row.discount_percent),
    available_spots: row.available_spots,
    status: row.status,
    studio: normalizeStudio(row.studios),
  };
}

export function discountedPrice(originalPrice: number, discountPercent: number) {
  return originalPrice * (1 - discountPercent / 100);
}

export async function getMarketplaceSlots(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  limit?: number;
}) {
  const { supabase, limit = 24 } = input;

  const { data } = await supabase
    .from("slots")
    .select(
      "id, class_type, start_time, class_length_minutes, original_price, discount_percent, available_spots, status, studio_id, studios(id, name, slug, location_text, city, class_categories, latitude, longitude)"
    )
    .order("start_time", { ascending: true })
    .limit(limit)
    .returns<MarketplaceSlotRow[]>();

  return Array.isArray(data) ? data.map(normalizeSlot) : [];
}

export async function getMarketplaceSlot(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  slotId: string;
}) {
  const { supabase, slotId } = input;

  const { data } = await supabase
    .from("slots")
    .select(
      "id, class_type, start_time, class_length_minutes, original_price, discount_percent, available_spots, status, studio_id, studios(id, name, slug, location_text, city, class_categories, latitude, longitude)"
    )
    .eq("id", slotId)
    .maybeSingle<MarketplaceSlotRow>();

  return data ? normalizeSlot(data) : null;
}

export async function getBookingConfirmation(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  bookingId: string;
}) {
  const { supabase, bookingId } = input;

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, payment_status, created_at, slot_id, slots(id, class_type, start_time, class_length_minutes, original_price, discount_percent, available_spots, status, studios(id, name, slug, location_text, city, class_categories, latitude, longitude))"
    )
    .eq("id", bookingId)
    .maybeSingle<BookingDetailRow>();

  if (!data) {
    return null;
  }

  const rawSlot = Array.isArray(data.slots) ? data.slots[0] ?? null : data.slots;

  return {
    id: data.id,
    payment_status: data.payment_status,
    created_at: data.created_at,
    slot: rawSlot
      ? {
          id: rawSlot.id,
          class_type: rawSlot.class_type,
          start_time: rawSlot.start_time,
          class_length_minutes: rawSlot.class_length_minutes,
          original_price: Number(rawSlot.original_price),
          discount_percent: Number(rawSlot.discount_percent),
          available_spots: rawSlot.available_spots,
          status: rawSlot.status,
          studio: normalizeStudio(rawSlot.studios),
        }
      : null,
  } satisfies MarketplaceBooking;
}
