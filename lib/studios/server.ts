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

export async function getOperatorStudioSnapshot(input: {
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

  if (!studio) {
    return {
      studio: null as StudioRecord | null,
      slots: [] as StudioSlotRecord[],
    };
  }

  const { data: slots } = await supabase
    .from("slots")
    .select(
      "id, class_type, start_time, class_length_minutes, original_price, discount_percent, available_spots, status, created_at"
    )
    .eq("studio_id", studio.id)
    .order("start_time", { ascending: true })
    .limit(8)
    .returns<StudioSlotRecord[]>();

  return {
    studio,
    slots: Array.isArray(slots) ? slots : [],
  };
}
