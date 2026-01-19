import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gifUrl } = await req.json();
    
    if (!gifUrl) {
      return new Response(
        JSON.stringify({ error: "gifUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing image for AI analysis:", gifUrl.substring(0, 100));

    // Download the image and convert to base64 to avoid MIME type issues with GIFs
    let imageDataUrl: string;
    try {
      const imageResponse = await fetch(gifUrl);
      if (!imageResponse.ok) {
        console.error("Failed to fetch image:", imageResponse.status);
        return new Response(
          JSON.stringify({ error: "Failed to fetch image from URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const arrayBuffer = await imageResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      
      // Use image/jpeg as the MIME type for better compatibility
      // The AI will still be able to analyze the first frame of GIFs
      imageDataUrl = `data:image/jpeg;base64,${base64}`;
      console.log("Image converted to base64, size:", base64.length);
    } catch (fetchError) {
      console.error("Error fetching/converting image:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to process image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
                text: "Analise esta imagem de exercício físico e responda APENAS com o nome do exercício em português brasileiro. Use letras maiúsculas no início de cada palavra. Exemplos: 'Supino Reto com Barra', 'Elevação Lateral', 'Agachamento Búlgaro'. Sem explicações, apenas o nome."
              },
              {
                type: "image_url",
                image_url: { url: imageDataUrl }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
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
      
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawName = data.choices?.[0]?.message?.content?.trim();
    
    if (!rawName || rawName.length < 3) {
      console.log("AI could not identify the exercise");
      return new Response(
        JSON.stringify({ suggestedName: null, error: "Could not identify exercise" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up the response
    const suggestedName = rawName
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\.$/, '') // Remove trailing period
      .trim();

    console.log("Suggested name:", suggestedName);

    return new Response(
      JSON.stringify({ suggestedName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in suggest-exercise-name:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
