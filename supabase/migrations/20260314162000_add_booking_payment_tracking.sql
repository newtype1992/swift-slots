alter table public.bookings
add column provider_checkout_session_id text unique,
add column provider_payment_intent_id text unique,
add column checkout_expires_at timestamptz,
add column paid_at timestamptz,
add column canceled_at timestamptz;

create or replace function public.mark_slot_booking_paid(
  p_booking_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_amount_paid numeric
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  update public.bookings
  set
    payment_status = 'paid',
    provider_checkout_session_id = coalesce(p_checkout_session_id, provider_checkout_session_id),
    provider_payment_intent_id = coalesce(p_payment_intent_id, provider_payment_intent_id),
    amount_paid = p_amount_paid,
    paid_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = p_booking_id
    and payment_status in ('pending', 'paid')
  returning *
  into v_booking;

  if v_booking.id is null then
    raise exception 'Booking could not be marked paid';
  end if;

  return v_booking;
end;
$$;

create or replace function public.cancel_slot_booking(
  p_booking_id uuid,
  p_checkout_session_id text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_slot public.slots;
begin
  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if v_booking.id is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.payment_status <> 'pending' then
    return v_booking;
  end if;

  update public.slots
  set
    available_spots = available_spots + 1,
    status = case
      when start_time > timezone('utc', now()) + interval '15 minutes' then 'open'
      else 'locked'
    end,
    filled_at = null,
    locked_at = case
      when start_time > timezone('utc', now()) + interval '15 minutes' then null
      else timezone('utc', now())
    end,
    updated_at = timezone('utc', now())
  where id = v_booking.slot_id
  returning *
  into v_slot;

  update public.bookings
  set
    payment_status = 'canceled',
    provider_checkout_session_id = coalesce(p_checkout_session_id, provider_checkout_session_id),
    canceled_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = v_booking.id
  returning *
  into v_booking;

  return v_booking;
end;
$$;

revoke all on function public.mark_slot_booking_paid(uuid, text, text, numeric) from public;
grant execute on function public.mark_slot_booking_paid(uuid, text, text, numeric) to service_role;

revoke all on function public.cancel_slot_booking(uuid, text) from public;
grant execute on function public.cancel_slot_booking(uuid, text) to service_role;
