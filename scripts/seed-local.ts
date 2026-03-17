import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

type SeedUserConfig = {
  key: "oliveOperator" | "pulseOperator" | "demoConsumer" | "historyConsumer";
  email: string;
  password: string;
  fullName: string;
  role: "studio_operator" | "consumer";
  profile: {
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
    country_code?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
};

type SeedStudioConfig = {
  id: string;
  operatorKey: SeedUserConfig["key"];
  name: string;
  slug: string;
  description: string;
  location_text: string;
  city: string;
  province: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  class_categories: string[];
};

function loadEnvFile(filepath: string) {
  const raw = readFileSync(filepath, "utf8");

  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        return [key, value];
      })
  ) as Record<string, string>;
}

function requiredEnv(name: string, env: Record<string, string>) {
  const value = process.env[name] ?? env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isoFromNow(minutesFromNow: number) {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}

async function ensureOk<T extends { error: { message: string } | null }>(result: T, label: string) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
}

async function main() {
  const env = loadEnvFile(resolve(process.cwd(), ".env.local"));
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL", env);
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY", env);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const users: SeedUserConfig[] = [
    {
      key: "oliveOperator",
      email: "studio.olive@swiftslots.test",
      password: "password123",
      fullName: "Olive Studio Operator",
      role: "studio_operator",
      profile: {},
    },
    {
      key: "pulseOperator",
      email: "studio.pulse@swiftslots.test",
      password: "password123",
      fullName: "Pulse Studio Operator",
      role: "studio_operator",
      profile: {},
    },
    {
      key: "demoConsumer",
      email: "consumer.demo@swiftslots.test",
      password: "password123",
      fullName: "Demo Consumer",
      role: "consumer",
      profile: {
        address_line1: "5415 Avenue du Parc",
        address_line2: "Unit 204",
        city: "Montreal",
        province: "QC",
        postal_code: "H2V 4G9",
        country_code: "CA",
        latitude: 45.52392,
        longitude: -73.60123,
      },
    },
    {
      key: "historyConsumer",
      email: "consumer.history@swiftslots.test",
      password: "password123",
      fullName: "History Consumer",
      role: "consumer",
      profile: {
        city: "Montreal",
        province: "QC",
        country_code: "CA",
      },
    },
  ];

  const studios: SeedStudioConfig[] = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      operatorKey: "oliveOperator",
      name: "Olive Pilates Club",
      slug: "olive-pilates-club",
      description: "Pilates and strength sessions designed for short-notice bookings in Mile End.",
      location_text: "5445 Avenue du Parc",
      city: "Montreal",
      province: "QC",
      postal_code: "H2V 4G9",
      latitude: 45.52457,
      longitude: -73.60168,
      class_categories: ["Pilates", "Strength", "Mobility"],
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      operatorKey: "pulseOperator",
      name: "Pulse Spin House",
      slug: "pulse-spin-house",
      description: "Spin, HIIT, and conditioning classes seeded for marketplace and payment testing.",
      location_text: "1400 Notre-Dame Ouest",
      city: "Montreal",
      province: "QC",
      postal_code: "H3C 1K7",
      latitude: 45.49141,
      longitude: -73.56144,
      class_categories: ["Spin", "HIIT", "Conditioning"],
    },
  ];

  const listed = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 20,
  });
  await ensureOk(listed, "List auth users");

  if ((listed.data.users ?? []).length > 0) {
    throw new Error("Local seed expects a fresh database. Run `npm run reset:local` before running `npm run seed:local`.");
  }

  const createdUsers = new Map<SeedUserConfig["key"], string>();

  for (const user of users) {
    const created = await admin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
      },
    });
    await ensureOk(created, `Create auth user ${user.email}`);

    const userId = created.data.user?.id;

    if (!userId) {
      throw new Error(`Auth user ${user.email} was created without an id.`);
    }

    createdUsers.set(user.key, userId);

    const profileUpdate = await admin
      .from("profiles")
      .update({
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        address_line1: user.profile.address_line1 ?? null,
        address_line2: user.profile.address_line2 ?? null,
        city: user.profile.city ?? null,
        province: user.profile.province ?? null,
        postal_code: user.profile.postal_code ?? null,
        country_code: user.profile.country_code ?? "CA",
        latitude: user.profile.latitude ?? null,
        longitude: user.profile.longitude ?? null,
        location_updated_at:
          typeof user.profile.latitude === "number" && typeof user.profile.longitude === "number"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", userId);
    await ensureOk(profileUpdate, `Update profile ${user.email}`);
  }

  const organizations = [
    {
      id: "33333333-3333-4333-8333-333333333333",
      ownerKey: "oliveOperator" as const,
      name: "Olive Ops",
      slug: "olive-ops",
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      ownerKey: "pulseOperator" as const,
      name: "Pulse Ops",
      slug: "pulse-ops",
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      ownerKey: "demoConsumer" as const,
      name: "Consumer Sandbox",
      slug: "consumer-sandbox",
    },
  ];

  for (const organization of organizations) {
    const ownerId = createdUsers.get(organization.ownerKey);

    if (!ownerId) {
      throw new Error(`Missing owner id for ${organization.name}`);
    }

    const insertedOrganization = await admin.from("organizations").insert({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      owner_user_id: ownerId,
    });
    await ensureOk(insertedOrganization, `Insert organization ${organization.name}`);

    const insertedMembership = await admin.from("memberships").insert({
      organization_id: organization.id,
      user_id: ownerId,
      role: "owner",
      status: "active",
    });
    await ensureOk(insertedMembership, `Insert owner membership for ${organization.name}`);

    const insertedSubscription = await admin.from("subscriptions").insert({
      organization_id: organization.id,
      provider: "stripe",
      plan_key: "free",
      status: "active",
      billing_email: users.find((user) => user.key === organization.ownerKey)?.email ?? null,
    });
    await ensureOk(insertedSubscription, `Insert subscription for ${organization.name}`);

    const insertedActivity = await admin.from("activity_logs").insert({
      organization_id: organization.id,
      actor_user_id: ownerId,
      action: "organization.seeded",
      entity_type: "organization",
      entity_id: organization.id,
      metadata: {
        source: "local-seed",
      },
    });
    await ensureOk(insertedActivity, `Insert activity log for ${organization.name}`);
  }

  const pendingInvite = await admin.from("organization_invites").insert({
    organization_id: "33333333-3333-4333-8333-333333333333",
    email: "coach.pending@swiftslots.test",
    role: "member",
    invited_by_user_id: createdUsers.get("oliveOperator"),
    status: "pending",
    delivery_status: "pending",
  });
  await ensureOk(pendingInvite, "Insert pending starter invite");

  for (const studio of studios) {
    const operatorId = createdUsers.get(studio.operatorKey);

    if (!operatorId) {
      throw new Error(`Missing operator id for ${studio.name}`);
    }

    const insertedStudio = await admin.from("studios").insert({
      id: studio.id,
      operator_user_id: operatorId,
      name: studio.name,
      slug: studio.slug,
      description: studio.description,
      location_text: studio.location_text,
      city: studio.city,
      province: studio.province,
      postal_code: studio.postal_code,
      latitude: studio.latitude,
      longitude: studio.longitude,
      class_categories: studio.class_categories,
    });
    await ensureOk(insertedStudio, `Insert studio ${studio.name}`);
  }

  const slots = [
    {
      id: "66666666-6666-4666-8666-666666666661",
      studio_id: "11111111-1111-4111-8111-111111111111",
      class_type: "Mat Pilates",
      start_time: isoFromNow(90),
      class_length_minutes: 50,
      original_price: 32,
      discount_percent: 20,
      available_spots: 4,
      status: "open",
    },
    {
      id: "66666666-6666-4666-8666-666666666662",
      studio_id: "11111111-1111-4111-8111-111111111111",
      class_type: "Mobility Reset",
      start_time: isoFromNow(210),
      class_length_minutes: 45,
      original_price: 24,
      discount_percent: 30,
      available_spots: 5,
      status: "open",
    },
    {
      id: "77777777-7777-4777-8777-777777777771",
      studio_id: "22222222-2222-4222-8222-222222222222",
      class_type: "HIIT Express",
      start_time: isoFromNow(130),
      class_length_minutes: 40,
      original_price: 28,
      discount_percent: 35,
      available_spots: 2,
      status: "open",
    },
    {
      id: "77777777-7777-4777-8777-777777777772",
      studio_id: "22222222-2222-4222-8222-222222222222",
      class_type: "Spin Intervals",
      start_time: isoFromNow(300),
      class_length_minutes: 50,
      original_price: 36,
      discount_percent: 25,
      available_spots: 3,
      status: "open",
    },
    {
      id: "88888888-8888-4888-8888-888888888881",
      studio_id: "11111111-1111-4111-8111-111111111111",
      class_type: "Core Burn",
      start_time: isoFromNow(10),
      class_length_minutes: 35,
      original_price: 26,
      discount_percent: 20,
      available_spots: 1,
      status: "locked",
      locked_at: new Date().toISOString(),
    },
    {
      id: "88888888-8888-4888-8888-888888888882",
      studio_id: "22222222-2222-4222-8222-222222222222",
      class_type: "Strength Circuit",
      start_time: isoFromNow(160),
      class_length_minutes: 55,
      original_price: 34,
      discount_percent: 40,
      available_spots: 0,
      status: "filled",
      filled_at: new Date().toISOString(),
    },
    {
      id: "88888888-8888-4888-8888-888888888883",
      studio_id: "11111111-1111-4111-8111-111111111111",
      class_type: "Evening Stretch",
      start_time: isoFromNow(-90),
      class_length_minutes: 45,
      original_price: 22,
      discount_percent: 15,
      available_spots: 2,
      status: "expired",
      locked_at: isoFromNow(-105),
    },
  ];

  const insertedSlots = await admin.from("slots").insert(slots);
  await ensureOk(insertedSlots, "Insert marketplace slots");

  const historyConsumerId = createdUsers.get("historyConsumer");

  if (!historyConsumerId) {
    throw new Error("Missing history consumer id.");
  }

  const insertedBookings = await admin.from("bookings").insert([
    {
      id: "99999999-9999-4999-8999-999999999991",
      slot_id: "88888888-8888-4888-8888-888888888882",
      consumer_user_id: historyConsumerId,
      payment_status: "paid",
      amount_paid: 20.4,
      provider_checkout_session_id: "cs_seed_paid_strength_circuit",
      provider_payment_intent_id: "pi_seed_paid_strength_circuit",
      paid_at: new Date().toISOString(),
      consumer_confirmation_sent_at: new Date().toISOString(),
      studio_notification_sent_at: new Date().toISOString(),
    },
    {
      id: "99999999-9999-4999-8999-999999999992",
      slot_id: "77777777-7777-4777-8777-777777777772",
      consumer_user_id: historyConsumerId,
      payment_status: "canceled",
      provider_checkout_session_id: "cs_seed_canceled_spin_intervals",
      checkout_expires_at: isoFromNow(-15),
      canceled_at: isoFromNow(-15),
      checkout_expired_notified_at: new Date().toISOString(),
    },
  ]);
  await ensureOk(insertedBookings, "Insert seeded bookings");

  console.log("Seeded local Swift Slots demo data.");
  console.log("Demo accounts:");
  for (const user of users) {
    console.log(`- ${user.email} / ${user.password}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
