revoke insert, update, delete on public.activity_logs from anon;
revoke insert, update, delete on public.activity_logs from authenticated;

create or replace function public.record_organization_activity(
  p_organization_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_actor_user_id uuid default auth.uid()
)
returns public.activity_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log public.activity_logs;
  v_request_role text := coalesce(auth.role(), '');
  v_actor_user_id uuid;
begin
  if auth.uid() is null and v_request_role <> 'service_role' then
    raise exception 'Authentication required';
  end if;

  if coalesce(btrim(p_action), '') = '' then
    raise exception 'Activity action is required';
  end if;

  if coalesce(btrim(p_entity_type), '') = '' then
    raise exception 'Activity entity type is required';
  end if;

  if auth.uid() is not null and not public.is_organization_member(p_organization_id) then
    raise exception 'Organization membership required';
  end if;

  if auth.uid() is not null then
    v_actor_user_id := coalesce(p_actor_user_id, auth.uid());

    if v_actor_user_id <> auth.uid() then
      raise exception 'Activity actor must match the authenticated user';
    end if;
  else
    v_actor_user_id := p_actor_user_id;
  end if;

  insert into public.activity_logs (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    p_organization_id,
    v_actor_user_id,
    btrim(p_action),
    btrim(p_entity_type),
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_log;

  return v_log;
end;
$$;
