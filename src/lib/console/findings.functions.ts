import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listFindings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("findings")
      .select("id, aeo_id, severity, status, label, impact_usd, remediation_usd, roi_text, adjudicated_at")
      .order("severity", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adjudicateFinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "adjudicated" | "dismissed" }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("findings")
      .update({ status: data.status, adjudicated_by: context.userId, adjudicated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });