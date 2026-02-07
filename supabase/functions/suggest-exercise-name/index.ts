import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse } from "../_shared/cors.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, STRICT_RATE_LIMIT } from "../_shared/rateLimit.ts";

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    // --- Authentication: require valid user token ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createErrorResponse(req, "Não autorizado", 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      console.error("[suggest-exercise-name] Invalid token:", userError?.message);
      return createErrorResponse(req, "Token inválido", 401);
    }

    const userId = userData.user.id;

    // --- Authorization: require admin role ---
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("[suggest-exercise-name] Non-admin access attempt:", userId);
      return createErrorResponse(req, "Acesso restrito a administradores", 403);
    }

    // --- Rate limiting: 10 requests per minute per user ---
    const identifier = getClientIdentifier(req, userId);
    const rateLimitResult = checkRateLimit(`suggest-exercise:${identifier}`, STRICT_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetAt);
    }

    // --- Input validation ---
    const { gifUrl } = await req.json();

    if (!gifUrl || typeof gifUrl !== "string") {
      return createErrorResponse(req, "gifUrl is required", 400);
    }

    // URL validation: only allow HTTPS URLs from trusted domains
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(gifUrl);
    } catch {
      return createErrorResponse(req, "Invalid URL format", 400);
    }

    if (parsedUrl.protocol !== "https:") {
      return createErrorResponse(req, "Only HTTPS URLs are allowed", 400);
    }

    // Block private/internal IPs (SSRF prevention)
    const hostname = parsedUrl.hostname;
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^\[::1\]$/,
      /^\[fc/i,
      /^\[fd/i,
      /^\[fe80:/i,
    ];

    if (blockedPatterns.some((pattern) => pattern.test(hostname))) {
      console.error("[suggest-exercise-name] Blocked SSRF attempt:", hostname);
      return createErrorResponse(req, "URL not allowed", 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[suggest-exercise-name] LOVABLE_API_KEY not configured");
      return createErrorResponse(req, "AI service not configured", 500);
    }

    console.log("[suggest-exercise-name] Admin", userId, "processing image:", gifUrl.substring(0, 100));

    // Download the image with size limit
    let imageDataUrl: string;
    try {
      const imageResponse = await fetch(gifUrl);
      if (!imageResponse.ok) {
        console.error("[suggest-exercise-name] Failed to fetch image:", imageResponse.status);
        return createErrorResponse(req, "Failed to fetch image from URL", 400);
      }

      // Check content-length header for early rejection (5MB limit)
      const MAX_SIZE = 5 * 1024 * 1024;
      const contentLength = imageResponse.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > MAX_SIZE) {
        await imageResponse.body?.cancel();
        return createErrorResponse(req, "Image too large (max 5MB)", 400);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();

      // Also check actual size after download
      if (arrayBuffer.byteLength > MAX_SIZE) {
        return createErrorResponse(req, "Image too large (max 5MB)", 400);
      }

      const uint8Array = new Uint8Array(arrayBuffer);

      // Convert to base64
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      imageDataUrl = `data:image/jpeg;base64,${base64}`;
      console.log("[suggest-exercise-name] Image converted to base64, size:", base64.length);
    } catch (fetchError) {
      console.error("[suggest-exercise-name] Error fetching/converting image:", fetchError);
      return createErrorResponse(req, "Failed to process image", 500);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta imagem de exercício físico e responda APENAS com o nome do exercício em português brasileiro. Use letras maiúsculas no início de cada palavra. Exemplos: 'Supino Reto com Barra', 'Elevação Lateral', 'Agachamento Búlgaro'. Sem explicações, apenas o nome.",
              },
              {
                type: "image_url",
                image_url: { url: imageDataUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[suggest-exercise-name] AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return createErrorResponse(req, "AI service error", 500);
    }

    const data = await response.json();
    const rawName = data.choices?.[0]?.message?.content?.trim();

    if (!rawName || rawName.length < 3) {
      console.log("[suggest-exercise-name] AI could not identify the exercise");
      return new Response(
        JSON.stringify({ suggestedName: null, error: "Could not identify exercise" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up the response
    const suggestedName = rawName
      .replace(/^["']|["']$/g, "")
      .replace(/\.$/, "")
      .trim();

    console.log("[suggest-exercise-name] Suggested name:", suggestedName);

    return new Response(JSON.stringify({ suggestedName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[suggest-exercise-name] Error:", error);
    return createErrorResponse(req, "Erro interno", 500);
  }
});
