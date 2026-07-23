
revoke execute on function public.is_tenant_member(uuid,uuid) from public, anon;
revoke execute on function public.has_tenant_role(uuid,uuid,public.app_role) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
