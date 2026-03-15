create or replace function public.has_booking_for_slot(p_slot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings bookings
    where bookings.slot_id = p_slot_id
      and bookings.consumer_user_id = auth.uid()
  );
$$;

drop policy if exists "slots_select_for_marketplace_or_owner" on public.slots;

create policy "slots_select_for_marketplace_or_owner"
on public.slots
for select
to authenticated
using (
  public.owns_studio(studio_id)
  or public.is_slot_bookable(id)
  or public.has_booking_for_slot(id)
);

