insert into public.subscriptions (
  organization_id,
  provider,
  plan_key,
  status
)
select
  organizations.id,
  'stripe',
  'free',
  'active'
from public.organizations organizations
on conflict (organization_id) do nothing;

create or replace function public.create_organization(p_name text, p_slug text default null)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization public.organizations;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'Organization name is required';
  end if;

  v_slug := coalesce(nullif(lower(btrim(p_slug)), ''), lower(regexp_replace(btrim(p_name), '[^a-zA-Z0-9]+', '-', 'g')));
  v_slug := trim(both '-' from v_slug);

  if v_slug = '' then
    raise exception 'Organization slug is required';
  end if;

  insert into public.organizations (name, slug, owner_user_id)
  values (btrim(p_name), v_slug, auth.uid())
  returning * into v_organization;

  insert into public.memberships (organization_id, user_id, role, status)
  values (v_organization.id, auth.uid(), 'owner', 'active');

  insert into public.subscriptions (organization_id, provider, plan_key, status)
  values (v_organization.id, 'stripe', 'free', 'active');

  insert into public.activity_logs (organization_id, actor_user_id, action, entity_type, entity_id)
  values (v_organization.id, auth.uid(), 'organization.created', 'organization', v_organization.id);

  return v_organization;
end;
$$;
