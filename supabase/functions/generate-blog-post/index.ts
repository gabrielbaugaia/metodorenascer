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

    const systemPrompt = `Você é um especialista em fitness, nutrição e mindset. Gere artigos de blog em português brasileiro para o Método Renascer, um programa de transformação física e mental.

Retorne APENAS um JSON válido com a seguinte estrutura (sem markdown, sem \`\`\`):
{
  "title": "Título do artigo (máximo 60 caracteres)",
  "excerpt": "Resumo do artigo em 2-3 frases (máximo 160 caracteres)",
  "metaTitle": "Título SEO otimizado (máximo 60 caracteres)",
  "metaDescription": "Descrição SEO (máximo 160 caracteres)",
  "content": [
    { "id": "1", "type": "paragraph", "content": "Texto introdutório..." },
    { "id": "2", "type": "heading2", "content": "Subtítulo da seção" },
    { "id": "3", "type": "paragraph", "content": "Conteúdo da seção..." },
    { "id": "4", "type": "list", "items": ["Item 1", "Item 2", "Item 3"] },
    { "id": "5", "type": "quote", "content": "Citação inspiradora..." },
    { "id": "6", "type": "heading2", "content": "Conclusão" },
    { "id": "7", "type": "paragraph", "content": "Texto de conclusão..." }
  ]
}

Tipos de blocos permitidos:
- paragraph: texto normal
- heading1, heading2, heading3: títulos
- list: lista com bullets (usar "items": ["item1", "item2"])
- ordered-list: lista numerada (usar "items": ["item1", "item2"])
- quote: citação

O artigo deve:
1. Ter entre 800-1200 palavras
2. Ser informativo e prático
3. Usar linguagem acessível mas profissional
4. Incluir pelo menos 3-4 seções com subtítulos (heading2)
5. Ter uma introdução engajadora e conclusão com call-to-action
6. Ser otimizado para SEO com palavras-chave relevantes`;

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Gere um artigo de blog sobre: ${prompt}` }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    let parsedContent;
    try {
      // Remove any markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedContent = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse AI response:', generatedText);
      throw new Error('Failed to parse generated content');
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-blog-post:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
