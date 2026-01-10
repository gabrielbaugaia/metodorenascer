import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Exercise {
  exerciseId: string
  name: string
  gifUrl: string
  targetMuscles: string[]
  bodyParts: string[]
  equipments: string[]
  secondaryMuscles: string[]
  instructions: string[]
}

interface SyncProgress {
  total: number
  processed: number
  uploaded: number
  failed: number
  errors: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { apiUrl, batchSize = 50, startOffset = 0, maxExercises = 1500 } = await req.json()
    
    if (!apiUrl) {
      return new Response(JSON.stringify({ error: 'API URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Starting GIF sync from ${apiUrl}, batch: ${batchSize}, offset: ${startOffset}, max: ${maxExercises}`)

    const progress: SyncProgress = {
      total: 0,
      processed: 0,
      uploaded: 0,
      failed: 0,
      errors: []
    }

    // Fetch exercises from API
    let offset = startOffset
    let hasMore = true
    const allExercises: Exercise[] = []

    while (hasMore && allExercises.length < maxExercises) {
      const limit = Math.min(100, maxExercises - allExercises.length)
      const url = `${apiUrl}/api/v1/exercises?offset=${offset}&limit=${limit}`
      
      console.log(`Fetching exercises: ${url}`)
      
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const result = await response.json()
        const exercises = result.data || []
        
        if (exercises.length === 0) {
          hasMore = false
        } else {
          allExercises.push(...exercises)
          offset += exercises.length
          
          if (exercises.length < limit) {
            hasMore = false
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Error fetching batch at offset ${offset}:`, err)
        progress.errors.push(`Fetch error at offset ${offset}: ${errorMessage}`)
        hasMore = false
      }
    }

    progress.total = allExercises.length
    console.log(`Fetched ${allExercises.length} exercises, starting GIF upload...`)

    // Process exercises in batches
    for (let i = 0; i < allExercises.length; i += batchSize) {
      const batch = allExercises.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (exercise) => {
        try {
          progress.processed++
          
          // Check if already exists in storage
          const storagePath = `gifs/${exercise.exerciseId}.gif`
          const { data: existingFile } = await supabase.storage
            .from('exercise-gifs')
            .list('gifs', { search: `${exercise.exerciseId}.gif` })
          
          let storageUrl: string | null = null
          
          if (existingFile && existingFile.length > 0) {
            // Already uploaded
            const { data: urlData } = supabase.storage
              .from('exercise-gifs')
              .getPublicUrl(storagePath)
            storageUrl = urlData.publicUrl
          } else {
            // Download GIF from API
            const gifUrl = exercise.gifUrl || `${apiUrl}/api/v1/image/${exercise.exerciseId}.gif`
            
            const gifResponse = await fetch(gifUrl)
            if (!gifResponse.ok) {
              throw new Error(`GIF download failed: ${gifResponse.status}`)
            }
            
            const gifBuffer = await gifResponse.arrayBuffer()
            
            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from('exercise-gifs')
              .upload(storagePath, gifBuffer, {
                contentType: 'image/gif',
                upsert: true
              })
            
            if (uploadError) {
              throw new Error(`Upload failed: ${uploadError.message}`)
            }
            
            const { data: urlData } = supabase.storage
              .from('exercise-gifs')
              .getPublicUrl(storagePath)
            storageUrl = urlData.publicUrl
          }
          
          // Upsert exercise_gifs record
          const { error: dbError } = await supabase
            .from('exercise_gifs')
            .upsert({
              exercise_db_id: exercise.exerciseId,
              exercise_name_en: exercise.name,
              exercise_name_pt: exercise.name, // Will need manual translation
              muscle_group: exercise.bodyParts?.[0] || 'unknown',
              gif_url: storageUrl,
              target_muscles: exercise.targetMuscles || [],
              secondary_muscles: exercise.secondaryMuscles || [],
              body_parts: exercise.bodyParts || [],
              equipments: exercise.equipments || [],
              instructions: exercise.instructions || [],
              status: 'active',
              api_source: 'exercisedb',
              last_checked_at: new Date().toISOString()
            }, {
              onConflict: 'exercise_db_id'
            })
          
          if (dbError) {
            throw new Error(`DB error: ${dbError.message}`)
          }
          
          progress.uploaded++
          
          if (progress.processed % 50 === 0) {
            console.log(`Progress: ${progress.processed}/${progress.total} processed, ${progress.uploaded} uploaded`)
          }
          
        } catch (err: unknown) {
          progress.failed++
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          const errorMsg = `Exercise ${exercise.exerciseId}: ${errorMessage}`
          console.error(errorMsg)
          if (progress.errors.length < 20) {
            progress.errors.push(errorMsg)
          }
        }
      }))
      
      // Small delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`Sync complete: ${progress.uploaded} uploaded, ${progress.failed} failed`)

    return new Response(JSON.stringify({
      success: true,
      progress
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
