import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("agents")
      .select("id, did, display_name, class, capabilities, trust_score, last_seen_at")
      .order("display_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });