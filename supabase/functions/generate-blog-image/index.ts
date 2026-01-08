import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Enhance prompt for better blog images
    const enhancedPrompt = `Professional high-quality blog header image for fitness and wellness article about: ${prompt}. Clean, modern, inspirational, suitable for health and transformation content. No text overlay. 16:9 aspect ratio.`;

    console.log('Generating image with prompt:', enhancedPrompt);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          { role: 'user', content: enhancedPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Failed to generate image: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response structure:', JSON.stringify(data).substring(0, 1000));
    
    // Extract image from response - check multiple possible locations
    let imageData = null;
    
    // Check for images array in message (new format)
    const message = data.choices?.[0]?.message;
    if (message?.images && Array.isArray(message.images)) {
      for (const img of message.images) {
        if (img.type === 'image_url' && img.image_url?.url) {
          imageData = img.image_url.url;
          break;
        }
      }
    }
    
    // Check content as string for base64
    const content = message?.content;
    if (!imageData && typeof content === 'string') {
      if (content.startsWith('data:image')) {
        imageData = content;
      } else {
        const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (base64Match) {
          imageData = base64Match[0];
        }
      }
    }
    
    // Check content as array
    if (!imageData && Array.isArray(content)) {
      for (const item of content) {
        if (item.type === 'image' && item.image_url?.url) {
          imageData = item.image_url.url;
          break;
        }
        if (item.type === 'image_url' && item.image_url?.url) {
          imageData = item.image_url.url;
          break;
        }
      }
    }
    
    // Check message parts for inline data
    const messageParts = message?.parts;
    if (!imageData && messageParts && Array.isArray(messageParts)) {
      for (const part of messageParts) {
        if (part.inline_data?.mime_type?.startsWith('image/')) {
          imageData = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
          break;
        }
      }
    }

    if (!imageData) {
      console.error('No image found in response. Full response:', JSON.stringify(data));
      throw new Error('No image generated - the model returned text only');
    }

    console.log('Image extracted successfully, length:', imageData.length);

    return new Response(JSON.stringify({ imageUrl: imageData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-blog-image:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
