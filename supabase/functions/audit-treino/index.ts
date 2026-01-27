import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExerciseSchema {
  nome?: string;
  name?: string;
  series?: number;
  sets?: number;
  repeticoes?: string;
  reps?: string;
  descanso?: string;
  rest?: string;
}

interface TreinoSchema {
  letra?: string;
  foco?: string;
  nome?: string;
  exercicios?: ExerciseSchema[];
}

interface ValidationResult {
  render_ready: boolean;
  issues: string[];
  treinos_len: number;
  semanas_len: number;
  letras_found: string[];
  exercises_sample: {
    treino_index: number;
    count: number;
    first_exercise_keys: string[];
  }[];
}

function validateProtocolSchema(conteudo: unknown): ValidationResult {
  const result: ValidationResult = {
    render_ready: false,
    issues: [],
    treinos_len: 0,
    semanas_len: 0,
    letras_found: [],
    exercises_sample: [],
  };

  if (!conteudo || typeof conteudo !== "object") {
    result.issues.push("conteudo is null or not an object");
    return result;
  }

  const c = conteudo as Record<string, unknown>;

  // Check new format (treinos)
  if (Array.isArray(c.treinos)) {
    result.treinos_len = c.treinos.length;

    if (c.treinos.length === 0) {
      result.issues.push("treinos array is empty");
    } else {
      for (let i = 0; i < c.treinos.length; i++) {
        const treino = c.treinos[i] as TreinoSchema;

        if (treino.letra) {
          result.letras_found.push(treino.letra);
        }

        if (!treino.foco && !treino.nome) {
          result.issues.push(`treino[${i}] missing foco and nome`);
        }

        if (!Array.isArray(treino.exercicios)) {
          result.issues.push(`treino[${i}].exercicios is not an array`);
        } else {
          result.exercises_sample.push({
            treino_index: i,
            count: treino.exercicios.length,
            first_exercise_keys:
              treino.exercicios.length > 0
                ? Object.keys(treino.exercicios[0])
                : [],
          });

          if (treino.exercicios.length === 0) {
            result.issues.push(`treino[${i}].exercicios is empty`);
          } else {
            // Check first exercise has minimum fields
            const ex = treino.exercicios[0];
            const hasName = ex.nome || ex.name;
            const hasSets = ex.series !== undefined || ex.sets !== undefined;
            const hasReps = ex.repeticoes || ex.reps;

            if (!hasName) {
              result.issues.push(
                `treino[${i}].exercicios[0] missing nome/name`
              );
            }
            if (!hasSets) {
              result.issues.push(
                `treino[${i}].exercicios[0] missing series/sets`
              );
            }
            if (!hasReps) {
              result.issues.push(
                `treino[${i}].exercicios[0] missing repeticoes/reps`
              );
            }
          }
        }
      }

      // If we have treinos and no critical issues, it's render ready
      if (
        result.treinos_len > 0 &&
        result.issues.filter((i) => i.includes("not an array")).length === 0
      ) {
        result.render_ready = true;
      }
    }
  }

  // Check legacy format (semanas)
  if (Array.isArray(c.semanas)) {
    result.semanas_len = c.semanas.length;

    if (result.treinos_len === 0 && c.semanas.length > 0) {
      // Legacy format validation
      const semana = c.semanas[0] as Record<string, unknown>;
      if (Array.isArray(semana.dias) && semana.dias.length > 0) {
        result.render_ready = true;
      } else {
        result.issues.push("semanas[0].dias is not valid");
      }
    }
  }

  if (result.treinos_len === 0 && result.semanas_len === 0) {
    result.issues.push("No treinos or semanas found in conteudo");
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    // Validate admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user via getUser
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !userData?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = userData.user.id;

    // Check if caller is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user
    const url = new URL(req.url);
    let targetUserId = url.searchParams.get("user_id");
    const targetEmail = url.searchParams.get("email");

    if (!targetUserId && targetEmail) {
      // Lookup by email
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", targetEmail)
        .maybeSingle();

      if (profile) {
        targetUserId = profile.id;
      }
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "user_id or email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[audit-treino] Auditing user: ${targetUserId}`);

    // Fetch protocol (same query as front-end)
    const { data: protocol, error: protocolError } = await supabaseAdmin
      .from("protocolos")
      .select("id, conteudo, created_at, ativo, tipo, titulo")
      .eq("user_id", targetUserId)
      .eq("tipo", "treino")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const elapsed = Math.round(performance.now() - startTime);

    // Fetch subscription status
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("status, plan_name, access_blocked")
      .eq("user_id", targetUserId)
      .maybeSingle();

    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, anamnese_completa")
      .eq("id", targetUserId)
      .maybeSingle();

    // Fetch last page trace event if exists
    const { data: lastTrace } = await supabaseAdmin
      .from("events")
      .select("metadata, created_at")
      .eq("user_id", targetUserId)
      .eq("event_name", "treino_page_trace")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (protocolError) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: protocolError.message,
          user_id: targetUserId,
          profile,
          subscription,
          elapsed_ms: elapsed,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!protocol) {
      return new Response(
        JSON.stringify({
          status: "no_protocol",
          user_id: targetUserId,
          profile,
          subscription,
          elapsed_ms: elapsed,
          diagnosis: "No active treino protocol found for this user",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate schema
    const validation = validateProtocolSchema(protocol.conteudo);

    return new Response(
      JSON.stringify({
        status: "ok",
        user_id: targetUserId,
        profile,
        subscription,
        protocol: {
          id: protocol.id,
          created_at: protocol.created_at,
          ativo: protocol.ativo,
          titulo: protocol.titulo,
        },
        validation,
        last_trace: lastTrace
          ? {
              created_at: lastTrace.created_at,
              metadata: lastTrace.metadata,
            }
          : null,
        elapsed_ms: elapsed,
        diagnosis: validation.render_ready
          ? "Protocol is valid and should render"
          : `Protocol has issues: ${validation.issues.join("; ")}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[audit-treino] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
