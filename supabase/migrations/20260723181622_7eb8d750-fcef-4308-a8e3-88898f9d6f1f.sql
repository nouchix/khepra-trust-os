
ALTER TABLE public.aeos ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.aeos ALTER COLUMN id SET DEFAULT ('aeo_' || replace(gen_random_uuid()::text,'-',''));
CREATE UNIQUE INDEX IF NOT EXISTS aeos_session_external_idx ON public.aeos(session_id, external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sessions_tenant_ref_idx ON public.sessions(tenant_id, session_ref);
CREATE UNIQUE INDEX IF NOT EXISTS aeo_links_pair_idx ON public.aeo_links(parent_id, child_id);
