create or replace function public.prevent_owner_membership_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.role = 'owner' then
    raise exception 'Owner memberships cannot be modified directly';
  end if;

  return case
    when tg_op = 'DELETE' then old
    else new
  end;
end;
$$;

drop policy if exists "memberships_insert_for_org_admins" on public.memberships;
drop policy if exists "memberships_update_for_org_admins" on public.memberships;
drop policy if exists "memberships_delete_for_org_admins" on public.memberships;

create policy "memberships_insert_for_org_owners"
on public.memberships
for insert
to authenticated
with check (public.has_organization_role(organization_id, array['owner']));

create policy "memberships_update_for_org_owners"
on public.memberships
for update
to authenticated
using (public.has_organization_role(organization_id, array['owner']))
with check (public.has_organization_role(organization_id, array['owner']));

create policy "memberships_delete_for_org_owners"
on public.memberships
for delete
to authenticated
using (public.has_organization_role(organization_id, array['owner']));

drop trigger if exists prevent_owner_membership_mutation on public.memberships;

create trigger prevent_owner_membership_mutation
before update or delete on public.memberships
for each row
execute function public.prevent_owner_membership_mutation();

drop policy if exists "subscriptions_insert_for_org_admins" on public.subscriptions;
drop policy if exists "subscriptions_update_for_org_admins" on public.subscriptions;
drop policy if exists "subscriptions_delete_for_org_owners" on public.subscriptions;

drop policy if exists "activity_logs_insert_for_members" on public.activity_logs;
