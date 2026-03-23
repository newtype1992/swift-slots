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
