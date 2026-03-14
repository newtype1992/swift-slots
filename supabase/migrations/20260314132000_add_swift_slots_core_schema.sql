alter table public.profiles
add column role text not null default 'consumer';

alter table public.profiles
add constraint profiles_role_check
check (role in ('studio_operator', 'consumer'));

create or replace function public.has_profile_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profiles
    where profiles.id = auth.uid()
      and profiles.role = any (p_roles)
  );
$$;

create table public.studios (
  id uuid primary key default gen_random_uuid(),
  operator_user_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  location_text text not null,
  city text not null default 'Montreal',
  province text not null default 'QC',
  postal_code text,
  latitude double precision,
  longitude double precision,
  class_categories text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint studios_name_not_blank check (btrim(name) <> ''),
  constraint studios_slug_not_blank check (btrim(slug) <> ''),
  constraint studios_location_not_blank check (btrim(location_text) <> ''),
  constraint studios_city_not_blank check (btrim(city) <> ''),
  constraint studios_province_not_blank check (btrim(province) <> '')
);

create table public.slots (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  class_type text not null,
  start_time timestamptz not null,
  class_length_minutes integer not null default 60,
  original_price numeric(10, 2) not null,
  discount_percent numeric(5, 2) not null,
  available_spots integer not null,
  status text not null default 'open',
  locked_at timestamptz,
  filled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint slots_class_type_not_blank check (btrim(class_type) <> ''),
  constraint slots_class_length_positive check (class_length_minutes > 0),
  constraint slots_original_price_positive check (original_price > 0),
  constraint slots_discount_percent_range check (discount_percent > 0 and discount_percent < 100),
  constraint slots_available_spots_nonnegative check (available_spots >= 0),
  constraint slots_status_check check (status in ('open', 'filled', 'locked', 'expired'))
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.slots (id) on delete restrict,
  consumer_user_id uuid not null references public.profiles (id) on delete cascade,
  payment_status text not null default 'pending',
  amount_paid numeric(10, 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookings_payment_status_check check (payment_status in ('pending', 'paid', 'failed', 'canceled', 'refunded')),
  constraint bookings_amount_paid_nonnegative check (amount_paid is null or amount_paid >= 0),
  constraint bookings_one_spot_per_consumer unique (slot_id, consumer_user_id)
);

create index studios_operator_user_id_idx on public.studios (operator_user_id);
create index slots_studio_id_idx on public.slots (studio_id);
create index slots_marketplace_idx on public.slots (status, start_time);
create index bookings_slot_id_idx on public.bookings (slot_id);
create index bookings_consumer_user_id_idx on public.bookings (consumer_user_id);

create trigger set_studios_updated_at
before update on public.studios
for each row
execute function public.set_updated_at();

create trigger set_slots_updated_at
before update on public.slots
for each row
execute function public.set_updated_at();

create trigger set_bookings_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();

create or replace function public.owns_studio(p_studio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.studios studios
    where studios.id = p_studio_id
      and studios.operator_user_id = auth.uid()
  );
$$;

create or replace function public.is_slot_bookable(p_slot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.slots slots
    where slots.id = p_slot_id
      and slots.status = 'open'
      and slots.available_spots > 0
      and slots.start_time > timezone('utc', now()) + interval '15 minutes'
  );
$$;

create or replace function public.prevent_slot_detail_edits_after_booking()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.bookings bookings
    where bookings.slot_id = old.id
  ) then
    if row(
      new.studio_id,
      new.class_type,
      new.start_time,
      new.class_length_minutes,
      new.original_price,
      new.discount_percent
    ) is distinct from row(
      old.studio_id,
      old.class_type,
      old.start_time,
      old.class_length_minutes,
      old.original_price,
      old.discount_percent
    ) then
      raise exception 'Slot details cannot be edited after the first booking';
    end if;
  end if;

  return new;
end;
$$;

create trigger prevent_slot_detail_edits_after_booking
before update on public.slots
for each row
execute function public.prevent_slot_detail_edits_after_booking();

alter table public.studios enable row level security;
alter table public.slots enable row level security;
alter table public.bookings enable row level security;

create policy "studios_select_for_authenticated"
on public.studios
for select
to authenticated
using (true);

create policy "studios_insert_for_studio_operators"
on public.studios
for insert
to authenticated
with check (
  operator_user_id = auth.uid()
  and public.has_profile_role(array['studio_operator'])
);

create policy "studios_update_for_owner"
on public.studios
for update
to authenticated
using (operator_user_id = auth.uid())
with check (
  operator_user_id = auth.uid()
  and public.has_profile_role(array['studio_operator'])
);

create policy "studios_delete_for_owner"
on public.studios
for delete
to authenticated
using (operator_user_id = auth.uid());

create policy "slots_select_for_marketplace_or_owner"
on public.slots
for select
to authenticated
using (
  public.owns_studio(studio_id)
  or public.is_slot_bookable(id)
);

create policy "slots_insert_for_studio_owner"
on public.slots
for insert
to authenticated
with check (public.owns_studio(studio_id));

create policy "slots_update_for_studio_owner"
on public.slots
for update
to authenticated
using (public.owns_studio(studio_id))
with check (public.owns_studio(studio_id));

create policy "slots_delete_for_studio_owner"
on public.slots
for delete
to authenticated
using (public.owns_studio(studio_id));

create policy "bookings_select_for_consumer_or_studio_owner"
on public.bookings
for select
to authenticated
using (
  consumer_user_id = auth.uid()
  or exists (
    select 1
    from public.slots slots
    join public.studios studios on studios.id = slots.studio_id
    where slots.id = slot_id
      and studios.operator_user_id = auth.uid()
  )
);
