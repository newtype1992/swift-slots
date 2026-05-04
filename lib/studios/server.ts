import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StudioRecord = {
  id: string;
  operator_user_id: string;
  name: string;
  slug: string;
  description: string | null;
  location_text: string;
  city: string;
  province: string;
  postal_code: string | null;
  class_categories: string[];
  created_at: string;
  updated_at: string;
};

export type StudioSlotRecord = {
  id: string;
  class_type: string;
  start_time: string;
  class_length_minutes: number;
  original_price: number;
  discount_percent: number;
  available_spots: number;
  status: string;
  created_at: string;
};

type StudioBookingSlotRow = {
  id: string;
  class_type: string;
  start_time: string;
  status: string;
  original_price: number;
  discount_percent: number;
};

type StudioBookingRow = {
  id: string;
  payment_status: string;
  amount_paid: number | null;
  paid_at: string | null;
  created_at: string;
  slot_id: string;
  slots: StudioBookingSlotRow | StudioBookingSlotRow[] | null;
};

export type OperatorBookingRecord = {
  id: string;
  payment_status: string;
  amount_paid: number | null;
  paid_at: string | null;
  created_at: string;
  slot: StudioBookingSlotRow | null;
};

async function getStudioForOperator(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
}) {
  const { supabase, userId } = input;

  const { data: studio } = await supabase
    .from("studios")
    .select(
      "id, operator_user_id, name, slug, description, location_text, city, province, postal_code, class_categories, created_at, updated_at"
    )
    .eq("operator_user_id", userId)
    .maybeSingle<StudioRecord>();

  return studio ?? null;
}

async function getStudioSlots(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  studioId: string;
  limit?: number;
}) {
  const { supabase, studioId, limit } = input;
  let query = supabase
    .from("slots")
    .select(
      "id, class_type, start_time, class_length_minutes, original_price, discount_percent, available_spots, status, created_at"
    )
    .eq("studio_id", studioId)
    .order("start_time", { ascending: true });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data: slots } = await query.returns<StudioSlotRecord[]>();
  return Array.isArray(slots) ? slots : [];
}

function normalizeBookingSlot(slot: StudioBookingSlotRow | StudioBookingSlotRow[] | null) {
  if (Array.isArray(slot)) {
    return slot[0] ?? null;
  }

  return slot ?? null;
}

async function getStudioBookings(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  studioId: string;
  limit?: number;
}) {
  const { supabase, studioId, limit = 5 } = input;

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, payment_status, amount_paid, paid_at, created_at, slot_id, slots!inner(id, class_type, start_time, status, original_price, discount_percent)"
    )
    .eq("slots.studio_id", studioId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<StudioBookingRow[]>();

  return Array.isArray(bookings)
    ? bookings.map((booking) => ({
        id: booking.id,
        payment_status: booking.payment_status,
        amount_paid: booking.amount_paid !== null ? Number(booking.amount_paid) : null,
        paid_at: booking.paid_at,
        created_at: booking.created_at,
        slot: normalizeBookingSlot(booking.slots),
      }))
    : [];
}

export async function getOperatorStudioSlots(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
}) {
  const { supabase, userId } = input;
  const studio = await getStudioForOperator({
    supabase,
    userId,
  });

  if (!studio) {
    return {
      studio: null as StudioRecord | null,
      slots: [] as StudioSlotRecord[],
    };
  }

  return {
    studio,
    slots: await getStudioSlots({
      supabase,
      studioId: studio.id,
    }),
  };
}

export async function getOperatorStudioSnapshot(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
}) {
  const { supabase, userId } = input;
  const studio = await getStudioForOperator({
    supabase,
    userId,
  });

  if (!studio) {
    return {
      studio: null as StudioRecord | null,
      slots: [] as StudioSlotRecord[],
    };
  }

  return {
    studio,
    slots: await getStudioSlots({
      supabase,
      studioId: studio.id,
      limit: 8,
    }),
  };
}

export async function getOperatorDashboardSnapshot(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
}) {
  const { supabase, userId } = input;
  const studio = await getStudioForOperator({
    supabase,
    userId,
  });

  if (!studio) {
    return {
      studio: null as StudioRecord | null,
      slots: [] as StudioSlotRecord[],
      bookings: [] as OperatorBookingRecord[],
    };
  }

  const [slots, bookings] = await Promise.all([
    getStudioSlots({
      supabase,
      studioId: studio.id,
      limit: 8,
    }),
    getStudioBookings({
      supabase,
      studioId: studio.id,
      limit: 5,
    }),
  ]);

  return {
    studio,
    slots,
    bookings,
  };
}
