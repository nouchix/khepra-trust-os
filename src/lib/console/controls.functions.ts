import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listControls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("controls")
      .select("id, framework, code, title, description")
      .order("framework");
    if (error) throw new Error(error.message);
    return data ?? [];
  });