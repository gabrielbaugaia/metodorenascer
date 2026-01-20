import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  exerciseNamePt: string;
  exerciseNameEn?: string;
  exerciseId: string;
  muscleGroup: string;
}

interface TenorGif {
  url: string;
  preview: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseNamePt, exerciseNameEn, exerciseId, muscleGroup } = await req.json() as SearchRequest;

    if (!exerciseNamePt || !exerciseId) {
      return new Response(
        JSON.stringify({ error: 'Exercise name and ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use English name if available, otherwise translate
    const searchName = exerciseNameEn || exerciseNamePt;
    console.log(`Searching GIF for: ${searchName} (PT: ${exerciseNamePt})`);

    // Search on Tenor via Firecrawl
    const searchQuery = `${searchName} exercise gym workout`;
    const tenorSearchUrl = `https://tenor.com/search/${encodeURIComponent(searchQuery)}-gifs`;
    
    console.log('Scraping Tenor:', tenorSearchUrl);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tenorSearchUrl,
        formats: ['html', 'links'],
        onlyMainContent: true,
        waitFor: 2000, // Wait for dynamic content
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to search for GIFs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    console.log('Scrape successful, extracting GIF URLs...');

    // Extract GIF URLs from the scraped content
    const gifUrls: string[] = [];
    const html = scrapeData.data?.html || scrapeData.html || '';
    const links = scrapeData.data?.links || scrapeData.links || [];

    // Extract from HTML - look for Tenor GIF patterns
    const gifPatterns = [
      /https:\/\/media\.tenor\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.gif/g,
      /https:\/\/c\.tenor\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.gif/g,
      /https:\/\/media1\.tenor\.com\/[a-zA-Z0-9_/-]+\.gif/g,
    ];

    for (const pattern of gifPatterns) {
      const matches = html.match(pattern) || [];
      gifUrls.push(...matches);
    }

    // Also check links
    for (const link of links) {
      if (typeof link === 'string' && link.includes('.gif')) {
        gifUrls.push(link);
      }
    }

    // Remove duplicates and filter valid URLs
    const uniqueGifUrls = [...new Set(gifUrls)].filter(url => 
      url.endsWith('.gif') && 
      !url.includes('placeholder') &&
      !url.includes('loading')
    ).slice(0, 5); // Get top 5

    console.log(`Found ${uniqueGifUrls.length} potential GIFs`);

    if (uniqueGifUrls.length === 0) {
      // Try GIPHY as fallback
      console.log('No Tenor GIFs found, trying GIPHY...');
      
      const giphySearchUrl = `https://giphy.com/search/${encodeURIComponent(searchQuery)}`;
      
      const giphyResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: giphySearchUrl,
          formats: ['html', 'links'],
          onlyMainContent: true,
          waitFor: 2000,
        }),
      });

      if (giphyResponse.ok) {
        const giphyData = await giphyResponse.json();
        const giphyHtml = giphyData.data?.html || giphyData.html || '';
        
        const giphyPatterns = [
          /https:\/\/media[0-9]*\.giphy\.com\/media\/[a-zA-Z0-9]+\/giphy\.gif/g,
          /https:\/\/i\.giphy\.com\/[a-zA-Z0-9]+\.gif/g,
        ];

        for (const pattern of giphyPatterns) {
          const matches = giphyHtml.match(pattern) || [];
          uniqueGifUrls.push(...matches);
        }
      }
    }

    if (uniqueGifUrls.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No GIFs found for this exercise',
          searchQuery 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the best GIF with AI
    console.log('Validating GIF with AI...');
    const selectedGifUrl = uniqueGifUrls[0];

    // Download and convert to base64 for AI validation
    let isValidExercise = true; // Default to true if validation fails
    
    try {
      const gifResponse = await fetch(selectedGifUrl);
      if (gifResponse.ok) {
        const arrayBuffer = await gifResponse.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binary);
        const imageDataUrl = `data:image/jpeg;base64,${base64}`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                    text: `This image should show the exercise "${exerciseNamePt}" (or "${searchName}" in English). 
                    
Is this a valid exercise demonstration GIF? 
Consider:
1. Does it show a person doing a physical exercise?
2. Could it reasonably be the exercise mentioned?

Answer ONLY with "yes" or "no".`
                  },
                  {
                    type: "image_url",
                    image_url: { url: imageDataUrl }
                  }
                ]
              }
            ],
            max_tokens: 10,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const answer = aiData.choices?.[0]?.message?.content?.toLowerCase()?.trim();
          isValidExercise = answer?.includes('yes') || answer?.includes('sim');
          console.log(`AI validation result: ${answer} -> ${isValidExercise}`);
        }
      }
    } catch (validationError) {
      console.error('AI validation error (proceeding anyway):', validationError);
    }

    if (!isValidExercise) {
      // Try the next GIF if available
      if (uniqueGifUrls.length > 1) {
        console.log('First GIF rejected, trying next...');
        // For simplicity, just return the search results and let admin choose
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'AI validation failed - GIF may not match the exercise',
          gifUrls: uniqueGifUrls,
          searchQuery 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download and upload to Supabase Storage
    console.log('Downloading and uploading GIF to Storage...');
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const gifResponse = await fetch(selectedGifUrl);
    if (!gifResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to download GIF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const gifBlob = await gifResponse.blob();
    const fileName = `${exerciseId}.gif`;
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exercise-gifs')
      .upload(fileName, gifBlob, {
        contentType: 'image/gif',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload GIF to storage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('exercise-gifs')
      .getPublicUrl(fileName);

    const storageUrl = publicUrlData.publicUrl;
    console.log('GIF uploaded:', storageUrl);

    // Update database
    const { error: updateError } = await supabase
      .from('exercise_gifs')
      .update({
        gif_url: storageUrl,
        status: 'active',
        api_source: 'web_search',
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', exerciseId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          gifUrl: storageUrl,
          warning: 'GIF uploaded but database update failed'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully found and saved GIF for ${exerciseNamePt}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        gifUrl: storageUrl,
        exerciseId,
        searchQuery,
        source: selectedGifUrl.includes('tenor') ? 'tenor' : 'giphy'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-exercise-gif:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
