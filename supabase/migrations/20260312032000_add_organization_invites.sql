create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null,
  invited_by_user_id uuid not null references auth.users (id) on delete restrict,
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending',
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days',
  accepted_at timestamptz,
  accepted_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_invites_email_not_blank check (btrim(email) <> ''),
  constraint organization_invites_role_check check (role in ('admin', 'member')),
  constraint organization_invites_status_check check (status in ('pending', 'accepted', 'revoked'))
);

create unique index organization_invites_pending_unique_idx
on public.organization_invites (organization_id, lower(email))
where status = 'pending';

create index organization_invites_organization_id_idx
on public.organization_invites (organization_id, created_at desc);

create trigger set_organization_invites_updated_at
before update on public.organization_invites
for each row
execute function public.set_updated_at();

alter table public.organization_invites enable row level security;

create policy "organization_invites_select_for_owners"
on public.organization_invites
for select
to authenticated
using (public.has_organization_role(organization_id, array['owner']));

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(users.email)
  from auth.users users
  where users.id = auth.uid();
$$;

create or replace function public.get_organization_members(p_organization_id uuid)
returns table (
  membership_id uuid,
  user_id uuid,
  email text,
  role text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    memberships.id as membership_id,
    memberships.user_id,
    lower(users.email) as email,
    memberships.role,
    memberships.status,
    memberships.created_at
  from public.memberships memberships
  left join auth.users users
    on users.id = memberships.user_id
  where memberships.organization_id = p_organization_id
    and public.is_organization_member(p_organization_id)
  order by memberships.created_at asc;
$$;

create or replace function public.get_organization_invites(p_organization_id uuid)
returns table (
  invite_id uuid,
  organization_id uuid,
  email text,
  role text,
  token uuid,
  status text,
  expires_at timestamptz,
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
    organization_invites.expires_at,
    organization_invites.created_at
  from public.organization_invites
  where organization_invites.organization_id = p_organization_id
    and organization_invites.status = 'pending'
    and public.has_organization_role(p_organization_id, array['owner'])
  order by organization_invites.created_at desc;
$$;

create or replace function public.get_invitation_by_token(p_token uuid)
returns table (
  invite_id uuid,
  organization_id uuid,
  organization_name text,
  email text,
  role text,
  status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    organization_invites.id as invite_id,
    organization_invites.organization_id,
    organizations.name as organization_name,
    lower(organization_invites.email) as email,
    organization_invites.role,
    organization_invites.status,
    organization_invites.expires_at
  from public.organization_invites
  join public.organizations
    on organizations.id = organization_invites.organization_id
  where organization_invites.token = p_token;
$$;

create or replace function public.invite_organization_member(
  p_organization_id uuid,
  p_email text,
  p_role text default 'member'
)
returns public.organization_invites
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_existing_invite public.organization_invites;
  v_invite public.organization_invites;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_organization_role(p_organization_id, array['owner']) then
    raise exception 'Only organization owners can invite members';
  end if;

  v_email := lower(btrim(p_email));

  if v_email = '' then
    raise exception 'Invite email is required';
  end if;

  if p_role not in ('admin', 'member') then
    raise exception 'Invite role must be admin or member';
  end if;

  if v_email = public.current_user_email() then
    raise exception 'Owners cannot invite themselves';
  end if;

  if exists (
    select 1
    from public.memberships memberships
    join auth.users users
      on users.id = memberships.user_id
    where memberships.organization_id = p_organization_id
      and lower(users.email) = v_email
  ) then
    raise exception 'That user already has a membership for this organization';
  end if;

  select *
  into v_existing_invite
  from public.organization_invites organization_invites
  where organization_invites.organization_id = p_organization_id
    and lower(organization_invites.email) = v_email
    and organization_invites.status = 'pending'
  limit 1;

  if found then
    update public.organization_invites
    set
      role = p_role,
      token = gen_random_uuid(),
      invited_by_user_id = auth.uid(),
      expires_at = timezone('utc', now()) + interval '7 days',
      updated_at = timezone('utc', now())
    where id = v_existing_invite.id
    returning * into v_invite;
  else
    insert into public.organization_invites (organization_id, email, role, invited_by_user_id)
    values (p_organization_id, v_email, p_role, auth.uid())
    returning * into v_invite;
  end if;

  insert into public.activity_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (
    p_organization_id,
    auth.uid(),
    'organization.invite.created',
    'organization_invite',
    v_invite.id,
    jsonb_build_object('email', v_email, 'role', p_role)
  );

  return v_invite;
end;
$$;

create or replace function public.accept_organization_invite(p_token uuid)
returns public.memberships
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invite public.organization_invites;
  v_membership public.memberships;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_invite
  from public.organization_invites organization_invites
  where organization_invites.token = p_token
    and organization_invites.status = 'pending'
  limit 1;

  if not found then
    raise exception 'Invite not found or no longer active';
  end if;

  if v_invite.expires_at < timezone('utc', now()) then
    raise exception 'Invite has expired';
  end if;

  if lower(v_invite.email) <> public.current_user_email() then
    raise exception 'Invite email does not match the current user';
  end if;

  if exists (
    select 1
    from public.memberships memberships
    where memberships.organization_id = v_invite.organization_id
      and memberships.user_id = auth.uid()
  ) then
    raise exception 'You already have a membership for this organization';
  end if;

  insert into public.memberships (organization_id, user_id, role, status)
  values (v_invite.organization_id, auth.uid(), v_invite.role, 'active')
  returning * into v_membership;

  update public.organization_invites
  set
    status = 'accepted',
    accepted_at = timezone('utc', now()),
    accepted_by_user_id = auth.uid(),
    updated_at = timezone('utc', now())
  where id = v_invite.id;

  insert into public.activity_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (
    v_invite.organization_id,
    auth.uid(),
    'organization.invite.accepted',
    'organization_invite',
    v_invite.id,
    jsonb_build_object('email', lower(v_invite.email), 'role', v_invite.role)
  );

  return v_membership;
end;
$$;

create or replace function public.revoke_organization_invite(p_invite_id uuid)
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

  select *
  into v_invite
  from public.organization_invites organization_invites
  where organization_invites.id = p_invite_id
    and organization_invites.status = 'pending'
  limit 1;

  if not found then
    raise exception 'Invite not found or no longer active';
  end if;

  if not public.has_organization_role(v_invite.organization_id, array['owner']) then
    raise exception 'Only organization owners can revoke invites';
  end if;

  update public.organization_invites
  set
    status = 'revoked',
    updated_at = timezone('utc', now())
  where id = v_invite.id
  returning * into v_invite;

  insert into public.activity_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (
    v_invite.organization_id,
    auth.uid(),
    'organization.invite.revoked',
    'organization_invite',
    v_invite.id,
    jsonb_build_object('email', lower(v_invite.email), 'role', v_invite.role)
  );

  return v_invite;
end;
$$;

create or replace function public.update_organization_member_role(
  p_membership_id uuid,
  p_role text
)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership public.memberships;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_role not in ('admin', 'member') then
    raise exception 'Membership role must be admin or member';
  end if;

  select *
  into v_membership
  from public.memberships memberships
  where memberships.id = p_membership_id
  limit 1;

  if not found then
    raise exception 'Membership not found';
  end if;

  if not public.has_organization_role(v_membership.organization_id, array['owner']) then
    raise exception 'Only organization owners can change member roles';
  end if;

  if v_membership.role = 'owner' then
    raise exception 'Owner memberships cannot be changed';
  end if;

  update public.memberships
  set
    role = p_role,
    updated_at = timezone('utc', now())
  where id = v_membership.id
  returning * into v_membership;

  insert into public.activity_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (
    v_membership.organization_id,
    auth.uid(),
    'organization.membership.role_changed',
    'membership',
    v_membership.id,
    jsonb_build_object('user_id', v_membership.user_id, 'role', p_role)
  );

  return v_membership;
end;
$$;

create or replace function public.remove_organization_member(p_membership_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership public.memberships;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_membership
  from public.memberships memberships
  where memberships.id = p_membership_id
  limit 1;

  if not found then
    raise exception 'Membership not found';
  end if;

  if not public.has_organization_role(v_membership.organization_id, array['owner']) then
    raise exception 'Only organization owners can remove members';
  end if;

  if v_membership.role = 'owner' then
    raise exception 'Owner memberships cannot be removed';
  end if;

  delete from public.memberships
  where id = v_membership.id;

  insert into public.activity_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (
    v_membership.organization_id,
    auth.uid(),
    'organization.membership.removed',
    'membership',
    v_membership.id,
    jsonb_build_object('user_id', v_membership.user_id, 'role', v_membership.role)
  );

  return v_membership.id;
end;
$$;

revoke all on function public.current_user_email() from public;
revoke all on function public.get_organization_members(uuid) from public;
revoke all on function public.get_organization_invites(uuid) from public;
revoke all on function public.get_invitation_by_token(uuid) from public;
revoke all on function public.invite_organization_member(uuid, text, text) from public;
revoke all on function public.accept_organization_invite(uuid) from public;
revoke all on function public.revoke_organization_invite(uuid) from public;
revoke all on function public.update_organization_member_role(uuid, text) from public;
revoke all on function public.remove_organization_member(uuid) from public;

grant execute on function public.current_user_email() to authenticated;
grant execute on function public.get_organization_members(uuid) to authenticated;
grant execute on function public.get_organization_invites(uuid) to authenticated;
grant execute on function public.get_invitation_by_token(uuid) to authenticated;
grant execute on function public.invite_organization_member(uuid, text, text) to authenticated;
grant execute on function public.accept_organization_invite(uuid) to authenticated;
grant execute on function public.revoke_organization_invite(uuid) to authenticated;
grant execute on function public.update_organization_member_role(uuid, text) to authenticated;
grant execute on function public.remove_organization_member(uuid) to authenticated;
