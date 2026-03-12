alter table public.organization_invites
add column delivery_status text not null default 'pending',
add column delivery_error text,
add column last_sent_at timestamptz;

alter table public.organization_invites
add constraint organization_invites_delivery_status_check
check (delivery_status in ('pending', 'sent', 'skipped', 'failed'));

create or replace function public.record_invite_delivery(
  p_invite_id uuid,
  p_delivery_status text,
  p_delivery_error text default null
)
returns public.organization_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.organization_invites;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_delivery_status not in ('pending', 'sent', 'skipped', 'failed') then
    raise exception 'Invalid delivery status';
  end if;

  select *
  into v_invite
  from public.organization_invites organization_invites
  where organization_invites.id = p_invite_id
  limit 1;

  if not found then
    raise exception 'Invite not found';
  end if;

  if not public.has_organization_role(v_invite.organization_id, array['owner']) then
    raise exception 'Only organization owners can update invite delivery state';
  end if;

  update public.organization_invites
  set
    delivery_status = p_delivery_status,
    delivery_error = p_delivery_error,
    last_sent_at = case
      when p_delivery_status = 'sent' then timezone('utc', now())
      else last_sent_at
    end,
    updated_at = timezone('utc', now())
  where id = v_invite.id
  returning * into v_invite;

  return v_invite;
end;
$$;

create or replace function public.get_organization_invite_history(p_organization_id uuid)
returns table (
  invite_id uuid,
  organization_id uuid,
  email text,
  role text,
  token uuid,
  status text,
  delivery_status text,
  delivery_error text,
  expires_at timestamptz,
  accepted_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    organization_invites.id as invite_id,
    organization_invites.organization_id,
    lower(organization_invites.email) as email,
    organization_invites.role,
    organization_invites.token,
    organization_invites.status,
    organization_invites.delivery_status,
    organization_invites.delivery_error,
    organization_invites.expires_at,
    organization_invites.accepted_at,
    organization_invites.last_sent_at,
    organization_invites.created_at
  from public.organization_invites
  where organization_invites.organization_id = p_organization_id
    and public.has_organization_role(p_organization_id, array['owner'])
  order by organization_invites.created_at desc;
$$;

revoke all on function public.record_invite_delivery(uuid, text, text) from public;
revoke all on function public.get_organization_invite_history(uuid) from public;

grant execute on function public.record_invite_delivery(uuid, text, text) to authenticated;
grant execute on function public.get_organization_invite_history(uuid) to authenticated;
grant execute on function public.get_invitation_by_token(uuid) to anon;
