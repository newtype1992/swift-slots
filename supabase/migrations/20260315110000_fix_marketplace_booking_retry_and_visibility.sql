alter table public.bookings
drop constraint if exists bookings_one_spot_per_consumer;

create unique index if not exists bookings_active_one_spot_per_consumer_idx
on public.bookings (slot_id, consumer_user_id)
where payment_status in ('pending', 'paid');

drop policy if exists "slots_select_for_marketplace_or_owner" on public.slots;

create policy "slots_select_for_marketplace_or_owner"
on public.slots
for select
to authenticated
using (
  public.owns_studio(studio_id)
  or public.is_slot_bookable(id)
  or exists (
    select 1
    from public.bookings bookings
    where bookings.slot_id = id
      and bookings.consumer_user_id = auth.uid()
  )
);

create or replace function public.create_slot_booking(p_slot_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_role text;
  v_slot public.slots;
  v_booking public.bookings;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select role
  into v_profile_role
  from public.profiles
  where id = auth.uid();

  if v_profile_role is distinct from 'consumer' then
    raise exception 'Only consumers can create bookings';
  end if;

  if exists (
    select 1
    from public.bookings
    where slot_id = p_slot_id
      and consumer_user_id = auth.uid()
      and payment_status in ('pending', 'paid')
  ) then
    raise exception 'You have already booked this slot';
  end if;

  update public.slots
  set
    available_spots = available_spots - 1,
    status = case when available_spots - 1 = 0 then 'filled' else status end,
    filled_at = case when available_spots - 1 = 0 then timezone('utc', now()) else filled_at end,
    updated_at = timezone('utc', now())
  where id = p_slot_id
    and status = 'open'
    and available_spots > 0
    and start_time > timezone('utc', now()) + interval '15 minutes'
  returning *
  into v_slot;

  if v_slot.id is null then
    raise exception 'That slot is no longer bookable';
  end if;

  insert into public.bookings (
    slot_id,
    consumer_user_id,
    payment_status
  )
  values (
    v_slot.id,
    auth.uid(),
    'pending'
  )
  returning *
  into v_booking;

  return v_booking;
end;
$$;

