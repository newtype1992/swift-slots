alter table public.profiles
add column address_line1 text,
add column address_line2 text,
add column city text,
add column province text,
add column postal_code text,
add column country_code text not null default 'CA',
add column latitude double precision,
add column longitude double precision,
add column location_updated_at timestamptz;

