import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueJob {
  id: string;
  exercise_gif_id: string;
  exercise_name_pt: string;
  exercise_name_en: string;
  status: string;
  attempts: number;
  max_attempts: number;
}

// Process a single job
async function processJob(
  supabase: any,
  job: QueueJob,
  firecrawlKey: string,
  lovableKey: string
): Promise<{ success: boolean; error?: string; gifUrl?: string }> {
  console.log(`Processing job ${job.id} for exercise: ${job.exercise_name_pt}`);

  try {
    // Update job status to processing
    await supabase
      .from('gif_search_queue')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', job.id);

    // Use English name for search
    const searchName = job.exercise_name_en || job.exercise_name_pt;
    const searchQuery = `${searchName} exercise gym workout`;
    const tenorSearchUrl = `https://tenor.com/search/${encodeURIComponent(searchQuery)}-gifs`;

    console.log(`Searching Tenor for: ${searchQuery}`);

    // Scrape Tenor for GIF URLs
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tenorSearchUrl,
        formats: ['html', 'links'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl error:', errorText);
      return { success: false, error: 'Firecrawl search failed' };
    }

    const scrapeData = await scrapeResponse.json();
    const html = scrapeData.data?.html || scrapeData.html || '';
    
    // Extract GIF URLs
    const gifUrls: string[] = [];
    const gifPatterns = [
      /https:\/\/media\.tenor\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.gif/g,
      /https:\/\/c\.tenor\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.gif/g,
      /https:\/\/media1\.tenor\.com\/[a-zA-Z0-9_/-]+\.gif/g,
    ];

    for (const pattern of gifPatterns) {
      const matches = html.match(pattern) || [];
      gifUrls.push(...matches);
    }

    const uniqueGifUrls = [...new Set(gifUrls)]
      .filter(url => url.endsWith('.gif') && !url.includes('placeholder'))
      .slice(0, 5);

    console.log(`Found ${uniqueGifUrls.length} GIF URLs`);

    if (uniqueGifUrls.length === 0) {
      // Try GIPHY as fallback
      const giphySearchUrl = `https://giphy.com/search/${encodeURIComponent(searchQuery)}`;
      
      const giphyResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
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
      return { success: false, error: 'No GIFs found' };
    }

    const selectedGifUrl = uniqueGifUrls[0];

    // Validate with AI
    let isValidExercise = true;
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
            Authorization: `Bearer ${lovableKey}`,
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
                    text: `This image should show the exercise "${job.exercise_name_pt}" (or "${searchName}" in English). Is this a valid exercise demonstration GIF? Answer ONLY with "yes" or "no".`
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
          console.log(`AI validation: ${answer} -> ${isValidExercise}`);
        }
      }
    } catch (validationError) {
      console.error('AI validation error (proceeding anyway):', validationError);
    }

    if (!isValidExercise) {
      return { success: false, error: 'AI validation failed - GIF may not match exercise' };
    }

    // Download and upload to Storage
    console.log('Downloading and uploading to Storage...');
    
    const gifResponse = await fetch(selectedGifUrl);
    if (!gifResponse.ok) {
      return { success: false, error: 'Failed to download GIF' };
    }

    const gifBlob = await gifResponse.blob();
    const fileName = `${job.exercise_gif_id}.gif`;
    
    const { error: uploadError } = await supabase.storage
      .from('exercise-gifs')
      .upload(fileName, gifBlob, {
        contentType: 'image/gif',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: 'Failed to upload GIF' };
    }

    const { data: publicUrlData } = supabase.storage
      .from('exercise-gifs')
      .getPublicUrl(fileName);

    const storageUrl = publicUrlData.publicUrl;
    console.log('GIF uploaded:', storageUrl);

    // Update exercise_gifs table
    const { error: updateError } = await supabase
      .from('exercise_gifs')
      .update({
        gif_url: storageUrl,
        status: 'active',
        api_source: 'web_search_queue',
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', job.exercise_gif_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return { success: true, gifUrl: storageUrl, error: 'GIF saved but database update failed' };
    }

    return { success: true, gifUrl: storageUrl };
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FIRECRAWL_API_KEY || !LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Required API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const body = await req.json().catch(() => ({}));
    const { action, exerciseIds, batchSize = 5 } = body;

    // Action: add jobs to queue
    if (action === 'enqueue') {
      if (!exerciseIds || !Array.isArray(exerciseIds) || exerciseIds.length === 0) {
        return new Response(
          JSON.stringify({ error: 'exerciseIds array is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get exercise details
      const { data: exercises, error: fetchError } = await supabase
        .from('exercise_gifs')
        .select('id, exercise_name_pt, exercise_name_en')
        .in('id', exerciseIds);

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch exercises' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check for existing jobs
      const { data: existingJobs } = await supabase
        .from('gif_search_queue')
        .select('exercise_gif_id')
        .in('exercise_gif_id', exerciseIds)
        .in('status', ['pending', 'processing']);

      const existingIds = new Set((existingJobs || []).map((j: any) => j.exercise_gif_id));
      
      const jobsToInsert = (exercises || [])
        .filter((ex: any) => !existingIds.has(ex.id))
        .map((ex: any) => ({
          exercise_gif_id: ex.id,
          exercise_name_pt: ex.exercise_name_pt,
          exercise_name_en: ex.exercise_name_en,
          status: 'pending',
        }));

      if (jobsToInsert.length === 0) {
        return new Response(
          JSON.stringify({ message: 'All exercises already in queue', added: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: insertError } = await supabase
        .from('gif_search_queue')
        .insert(jobsToInsert);

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to add jobs to queue' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Added ${jobsToInsert.length} jobs to queue`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          added: jobsToInsert.length,
          skipped: exerciseIds.length - jobsToInsert.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: process pending jobs (called by cron or manually)
    if (action === 'process') {
      // Get pending jobs
      const { data: pendingJobs, error: fetchError } = await supabase
        .from('gif_search_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch pending jobs' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!pendingJobs || pendingJobs.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No pending jobs', processed: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Processing ${pendingJobs.length} jobs...`);
      
      const results = { success: 0, failed: 0 };

      for (const job of pendingJobs as QueueJob[]) {
        // Rate limiting between requests
        if (results.success + results.failed > 0) {
          await new Promise(r => setTimeout(r, 3000)); // 3 second delay
        }

        const result = await processJob(supabase, job, FIRECRAWL_API_KEY, LOVABLE_API_KEY);
        
        if (result.success) {
          // Mark job as completed
          await supabase
            .from('gif_search_queue')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              result_gif_url: result.gifUrl,
            })
            .eq('id', job.id);
          
          results.success++;
        } else {
          // Mark job as failed or retry
          const newAttempts = job.attempts + 1;
          const newStatus = newAttempts >= job.max_attempts ? 'failed' : 'pending';
          
          await supabase
            .from('gif_search_queue')
            .update({
              status: newStatus,
              attempts: newAttempts,
              error_message: result.error,
              completed_at: newStatus === 'failed' ? new Date().toISOString() : null,
            })
            .eq('id', job.id);
          
          if (newStatus === 'failed') {
            results.failed++;
          }
        }
      }

      console.log(`Processed ${pendingJobs.length} jobs: ${results.success} success, ${results.failed} failed`);

      return new Response(
        JSON.stringify({
          success: true,
          processed: pendingJobs.length,
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: get queue status
    if (action === 'status') {
      const { data: statusData, error: statusError } = await supabase
        .from('gif_search_queue')
        .select('status')
        .order('created_at', { ascending: false });

      if (statusError) {
        return new Response(
          JSON.stringify({ error: 'Failed to get queue status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const counts = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: statusData?.length || 0,
      };

      for (const job of statusData || []) {
        const status = (job as any).status as keyof typeof counts;
        if (status in counts) {
          counts[status]++;
        }
      }

      return new Response(
        JSON.stringify(counts),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: clear completed/failed jobs
    if (action === 'clear') {
      const { error: deleteError } = await supabase
        .from('gif_search_queue')
        .delete()
        .in('status', ['completed', 'failed']);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: 'Failed to clear queue' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Queue cleared' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: enqueue, process, status, or clear' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-gif-queue:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
