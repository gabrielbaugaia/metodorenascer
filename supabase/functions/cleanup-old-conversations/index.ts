import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse optional parameters from request body
    const { days_old = 5, tipo = "suporte" } = await req.json().catch(() => ({}));

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days_old);

    console.log(`[cleanup-old-conversations] Deleting ${tipo} conversations older than ${days_old} days (before ${cutoffDate.toISOString()})`);

    // Delete old conversations
    const { data, error } = await supabase
      .from("conversas")
      .delete()
      .eq("tipo", tipo)
      .lt("updated_at", cutoffDate.toISOString())
      .select("id");

    if (error) {
      console.error("[cleanup-old-conversations] Error:", error);
      throw error;
    }

    const deletedCount = data?.length || 0;
    console.log(`[cleanup-old-conversations] Successfully deleted ${deletedCount} old conversations`);

    return new Response(
      JSON.stringify({ 
        success: true,
        deleted: deletedCount,
        cutoff_date: cutoffDate.toISOString(),
        tipo
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("[cleanup-old-conversations] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
