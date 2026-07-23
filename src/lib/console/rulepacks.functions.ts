import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listRulepacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("rulepacks")
      .select("id, generation, parent_id, active, weights, metrics, created_at")
      .order("generation");
    if (error) throw new Error(error.message);
    return data ?? [];
  });