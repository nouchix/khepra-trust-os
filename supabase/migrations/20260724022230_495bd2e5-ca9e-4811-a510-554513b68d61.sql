
-- 1) Fix auto_operator_demo: assign auditor (read-only) instead of operator
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare demo_id uuid;
begin
  select id into demo_id from public.tenants where slug='demo' limit 1;
  if demo_id is not null then
    insert into public.memberships (tenant_id, user_id, role)
    values (demo_id, new.id, 'auditor')
    on conflict do nothing;
  end if;
  return new;
end $function$;

-- 2) Revoke EXECUTE on SECURITY DEFINER helpers from public/anon/authenticated.
-- These are only used inside RLS policies, which run with the policy owner's rights.
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
