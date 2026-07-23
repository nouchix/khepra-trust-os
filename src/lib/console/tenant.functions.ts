import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyTenant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: memberships, error: mErr } = await context.supabase
      .from("memberships")
      .select("tenant_id, role, tenants(id, slug, name, classification)")
      .eq("user_id", context.userId)
      .limit(1);
    if (mErr) throw new Error(mErr.message);
    const m = memberships?.[0];
    if (!m) return null;
    const t = m.tenants as unknown as { id: string; slug: string; name: string; classification: string } | null;
    if (!t) return null;
    return { tenantId: t.id, slug: t.slug, name: t.name, classification: t.classification, role: m.role as string };
  });