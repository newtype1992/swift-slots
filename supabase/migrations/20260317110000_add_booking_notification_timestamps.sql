alter table public.bookings
add column consumer_confirmation_sent_at timestamptz,
add column studio_notification_sent_at timestamptz,
add column checkout_expired_notified_at timestamptz;

