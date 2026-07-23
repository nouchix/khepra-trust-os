
create type public.app_role as enum ('admin', 'operator', 'auditor');
create type public.aeo_type as enum ('prompt','tool','finding','control','attest','rulepack','replay');
create type public.aeo_severity as enum ('CAT_I','CAT_II','CAT_III');
create type public.finding_status as enum ('open','adjudicated','dismissed');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  classification text not null default 'UNCLASSIFIED // CUI',
  created_at timestamptz not null default now()
);
create table public.memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'operator',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
grant select on public.tenants to authenticated;
grant all on public.tenants to service_role;
grant select on public.memberships to authenticated;
grant all on public.memberships to service_role;
alter table public.tenants enable row level security;
alter table public.memberships enable row level security;

create or replace function public.is_tenant_member(_tenant uuid, _user uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.memberships where tenant_id=_tenant and user_id=_user)
$$;
create or replace function public.has_tenant_role(_user uuid, _tenant uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.memberships where tenant_id=_tenant and user_id=_user and role=_role)
$$;

create policy "members read tenants" on public.tenants for select to authenticated
  using (public.is_tenant_member(id, auth.uid()));
create policy "members read own memberships" on public.memberships for select to authenticated
  using (user_id = auth.uid() or public.is_tenant_member(tenant_id, auth.uid()));

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  did text not null,
  display_name text not null,
  class text not null,
  capabilities jsonb not null default '[]'::jsonb,
  trust_score numeric not null default 1.0,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, did)
);
grant select, insert, update, delete on public.agents to authenticated;
grant all on public.agents to service_role;
alter table public.agents enable row level security;
create policy "tenant members read agents" on public.agents for select to authenticated
  using (public.is_tenant_member(tenant_id, auth.uid()));

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  session_ref text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  intent jsonb not null default '{}'::jsonb
);
grant select, insert on public.sessions to authenticated;
grant all on public.sessions to service_role;
alter table public.sessions enable row level security;
create policy "tenant members read sessions" on public.sessions for select to authenticated
  using (public.is_tenant_member(tenant_id, auth.uid()));

create table public.controls (
  id text primary key,
  framework text not null,
  code text not null,
  title text not null,
  description text
);
grant select on public.controls to authenticated, anon;
grant all on public.controls to service_role;
alter table public.controls enable row level security;
create policy "controls readable" on public.controls for select to authenticated using (true);
create policy "controls readable anon" on public.controls for select to anon using (true);

create table public.aeos (
  id text primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  type public.aeo_type not null,
  label text not null,
  description text,
  severity public.aeo_severity,
  verdict text,
  hash text,
  parent_hash text,
  val int not null default 8,
  payload jsonb not null default '{}'::jsonb,
  sig jsonb,
  ts timestamptz not null default now()
);
create index aeos_tenant_session_idx on public.aeos (tenant_id, session_id);
grant select on public.aeos to authenticated;
grant all on public.aeos to service_role;
alter table public.aeos enable row level security;
create policy "tenant members read aeos" on public.aeos for select to authenticated
  using (public.is_tenant_member(tenant_id, auth.uid()));

create table public.aeo_links (
  parent_id text not null references public.aeos(id) on delete cascade,
  child_id text not null references public.aeos(id) on delete cascade,
  weight int not null default 1,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  primary key (parent_id, child_id)
);
grant select on public.aeo_links to authenticated;
grant all on public.aeo_links to service_role;
alter table public.aeo_links enable row level security;
create policy "tenant members read links" on public.aeo_links for select to authenticated
  using (public.is_tenant_member(tenant_id, auth.uid()));

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  aeo_id text not null references public.aeos(id) on delete cascade,
  severity public.aeo_severity not null,
  status public.finding_status not null default 'open',
  label text not null,
  impact_usd numeric,
  remediation_usd numeric,
  roi_text text,
  adjudicated_by uuid references auth.users(id),
  adjudicated_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, update on public.findings to authenticated;
grant all on public.findings to service_role;
alter table public.findings enable row level security;
create policy "tenant members read findings" on public.findings for select to authenticated
  using (public.is_tenant_member(tenant_id, auth.uid()));
create policy "operators adjudicate findings" on public.findings for update to authenticated
  using (public.has_tenant_role(auth.uid(), tenant_id, 'operator')
      or public.has_tenant_role(auth.uid(), tenant_id, 'admin'))
  with check (public.has_tenant_role(auth.uid(), tenant_id, 'operator')
           or public.has_tenant_role(auth.uid(), tenant_id, 'admin'));

create table public.rulepacks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  generation int not null,
  parent_id uuid references public.rulepacks(id) on delete set null,
  active boolean not null default false,
  weights jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.rulepacks to authenticated;
grant all on public.rulepacks to service_role;
alter table public.rulepacks enable row level security;
create policy "tenant members read rulepacks" on public.rulepacks for select to authenticated
  using (public.is_tenant_member(tenant_id, auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare demo_id uuid;
begin
  select id into demo_id from public.tenants where slug='demo' limit 1;
  if demo_id is not null then
    insert into public.memberships (tenant_id, user_id, role)
    values (demo_id, new.id, 'operator')
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ SEED ============
insert into public.controls (id,framework,code,title,description) values
 ('c1','NIST 800-53 Rev 5','AC-17','Remote Access','Remote Access controls'),
 ('c2','NIST 800-53 Rev 5','AU-2','Audit Events','Audit Events — continuous monitoring'),
 ('c3','NIST 800-53 Rev 5','SI-7','Software Integrity','Software & Information Integrity'),
 ('c4','CMMC Level 2','CA.2.158','Periodic Assessment','Periodically assess security controls'),
 ('c5','NSA CNSA 2.0','ML-DSA','CNSA 2.0 ML-DSA','NSA CNSA 2.0 — ML-DSA-65 required by 2030'),
 ('c6','NIST FIPS 204','FIPS-204','Module-Lattice Sig','Module-Lattice-Based Digital Signature Standard'),
 ('c7','NIST 800-53 Rev 5','SC-8','Transmission Integrity','Transmission Confidentiality and Integrity');

insert into public.tenants (slug,name,classification) values ('demo','KHEPRA Demo Tenant','UNCLASSIFIED // CUI // FOUO');

insert into public.agents (tenant_id, did, display_name, class, capabilities, trust_score, last_seen_at)
select id, x.did, x.dn, x.cls, x.caps::jsonb, x.ts, now() - x.seen::interval
from public.tenants, (values
 ('did:khepra:adinkhepra-scanner-01','AdinKhepra Scanner','compliance-scanner','["stig.scan","nist.map","cmmc.report"]',0.97,'2 minutes'),
 ('did:khepra:souhimbou-recorder-01','SouHimBou Recorder','flight-recorder','["telemetry.capture","attest.mldsa65"]',0.99,'30 seconds'),
 ('did:khepra:orchestrator-01','Trust Orchestrator','orchestrator','["session.orchestrate","policy.decide"]',0.95,'10 seconds')
) as x(did,dn,cls,caps,ts,seen)
where slug='demo';

insert into public.sessions (tenant_id, agent_id, session_ref, started_at, intent)
select t.id, a.id, 'dag-2026-06-15T02:43:08Z', now() - interval '1 hour',
       '{"target":"/etc","frameworks":["STIG","NIST800-53","CMMC","PQC"]}'::jsonb
from public.tenants t
join public.agents a on a.tenant_id=t.id and a.class='orchestrator'
where t.slug='demo';

insert into public.aeos (id, tenant_id, session_id, type, label, description, severity, val, ts, sig, payload)
select v.id, s.tenant_id, s.id, v.node_type::public.aeo_type, v.label, v.descr,
       nullif(v.sev,'')::public.aeo_severity, v.val,
       now() - (v.mins || ' minutes')::interval,
       case when v.sig<>'' then jsonb_build_object('alg','ML-DSA-65','value',v.sig) else null end,
       v.payload::jsonb
from public.sessions s, (values
 ('p1','prompt','Run ert_scan on /etc','AI initiated enterprise risk and threat scan','',20,58,'','{}'),
 ('t1','tool','ert_scan','Enterprise Risk & Threat — STIG + NIST + CMMC','',14,57,'','{"target":"/etc"}'),
 ('t2','tool','pqc_stig','PQC-01-STIG-V1R1 post-quantum readiness scan','',12,56,'','{"scan_path":"/etc","profile":"full"}'),
 ('t3','tool','nist_map','Map findings to NIST 800-53 Rev 5 controls','',10,55,'','{}'),
 ('t4','tool','godfather_report','Godfather Report — dollar-denominated business impact','',11,54,'','{}'),
 ('f1','finding','RHEL-09-212030','No FIPS-validated crypto on /etc/ssh — exposed to harvest-now-decrypt-later','CAT_I',16,56,'','{"impact":2400000,"remediation":800,"roi":"3000x"}'),
 ('f2','finding','RHEL-09-431030','Audit logs not centrally collected','CAT_II',12,56,'','{"impact":420000,"remediation":200,"roi":"2100x"}'),
 ('f3','finding','PQC-01-001','ML-DSA-65 not implemented — CNSA 2.0 non-compliant','CAT_I',14,55,'','{"impact":3800000,"remediation":12000,"roi":"317x"}'),
 ('f4','finding','PQC-01-003','Hybrid classical/PQC not present for key exchange','CAT_II',10,55,'','{"impact":890000,"remediation":4000,"roi":"222x"}'),
 ('ctrl1','control','NIST AC-17','Remote Access controls','',8,54,'','{"framework":"NIST 800-53 Rev 5"}'),
 ('ctrl2','control','NIST AU-2','Audit Events — continuous monitoring','',8,54,'','{"framework":"NIST 800-53 Rev 5"}'),
 ('ctrl3','control','NIST SI-7','Software & Information Integrity','',8,54,'','{"framework":"NIST 800-53 Rev 5"}'),
 ('ctrl4','control','CMMC CA.2.158','Periodically assess security controls','',7,54,'','{"framework":"CMMC Level 2"}'),
 ('ctrl5','control','CNSA 2.0 ML-DSA','NSA CNSA 2.0 — ML-DSA-65 required by 2030','',9,54,'','{"framework":"NSA CNSA 2.0"}'),
 ('ctrl6','control','FIPS 204','Module-Lattice-Based Digital Signature Standard','',8,54,'','{"framework":"NIST FIPS 204"}'),
 ('ctrl7','control','NIST SC-8','Transmission Confidentiality and Integrity','',7,54,'','{"framework":"NIST 800-53 Rev 5"}'),
 ('a1','attest','ML-DSA-65 · ert_scan','Attestation on ert_scan response','',6,57,'3d7f2a9b1e4c8f0a6b2d5e8f1a3c7b9d2e5f8a1b4c6d9e2f','{}'),
 ('a2','attest','ML-DSA-65 · pqc_stig','Attestation on pqc_stig response','',6,56,'8f1a3c7b9d2e5f8a1b3d7f2a9b1e4c8f0a6b2d5e8c1f3a7','{}'),
 ('a3','attest','ML-DSA-65 · godfather','Attestation on Godfather Report','',6,54,'1b3d7f2a9b1e4c8f0a6b2d5e8f1a3c7b9d2e5f8a4c7b2e9','{}')
) as v(id,node_type,label,descr,sev,val,mins,sig,payload)
where s.session_ref='dag-2026-06-15T02:43:08Z';

insert into public.aeo_links (parent_id, child_id, weight, tenant_id)
select v.p, v.c, v.w, s.tenant_id
from public.sessions s, (values
 ('p1','t1',3),('p1','t2',2),('t1','f1',2),('t1','f2',2),('t2','f3',2),('t2','f4',2),
 ('t1','t3',1),('t3','ctrl1',1),('t3','ctrl2',1),('t3','ctrl7',1),
 ('t2','ctrl3',2),('t2','ctrl5',2),('t2','ctrl6',2),
 ('f1','ctrl1',1),('f2','ctrl2',1),('f3','ctrl5',2),('f4','ctrl3',1),
 ('t4','f1',1),('t4','f2',1),('t4','f3',1),('t1','t4',1),
 ('t1','a1',1),('t2','a2',1),('t4','a3',1),('t1','ctrl4',1),('f3','ctrl6',1)
) as v(p,c,w)
where s.session_ref='dag-2026-06-15T02:43:08Z';

insert into public.findings (tenant_id, aeo_id, severity, label, impact_usd, remediation_usd, roi_text)
select s.tenant_id, v.aeo_id, v.sev::public.aeo_severity, v.label, v.impact, v.rem, v.roi
from public.sessions s, (values
 ('f1','CAT_I','RHEL-09-212030',2400000,800,'3000x'),
 ('f2','CAT_II','RHEL-09-431030',420000,200,'2100x'),
 ('f3','CAT_I','PQC-01-001',3800000,12000,'317x'),
 ('f4','CAT_II','PQC-01-003',890000,4000,'222x')
) as v(aeo_id,sev,label,impact,rem,roi)
where s.session_ref='dag-2026-06-15T02:43:08Z';

with g1 as (
  insert into public.rulepacks (tenant_id,generation,weights,metrics)
  select id,1,'{"seed":true}'::jsonb,'{"tpr":0.72,"fpr":0.11}'::jsonb from public.tenants where slug='demo'
  returning id, tenant_id
), g2 as (
  insert into public.rulepacks (tenant_id,generation,parent_id,weights,metrics)
  select tenant_id,2,id,'{"mutated":true}'::jsonb,'{"tpr":0.81,"fpr":0.08}'::jsonb from g1
  returning id, tenant_id
)
insert into public.rulepacks (tenant_id,generation,parent_id,active,weights,metrics)
select tenant_id,3,id,true,'{"crossover":true}'::jsonb,'{"tpr":0.89,"fpr":0.05}'::jsonb from g2;
