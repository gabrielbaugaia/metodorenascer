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

    const systemPrompt = `Você é um copywriter especializado em transformação física e mental. Gere artigos de blog em português brasileiro para o Método Renascer.

CONTEXTO DO PÚBLICO-ALVO:
- Pessoas comuns que querem transformar seu corpo e mente
- Não são profissionais de fitness, são potenciais CLIENTES
- Querem entender como o método funciona e se sentir seguros para começar
- Buscam resultados reais sem complicações

TOM E ESTILO:
- Escreva como se estivesse conversando com um amigo
- Seja acolhedor, empático e inspirador
- NÃO use linguagem técnica ou jargões de academia
- NÃO pareça vendedor - mostre valor naturalmente
- Faça o leitor se imaginar alcançando seus objetivos
- Transmita confiança e segurança sobre o método
- Use histórias e exemplos que conectem emocionalmente

IMPORTANTE:
- NÃO use asteriscos (**) para negrito no texto
- Use linguagem limpa e natural
- Foque nos benefícios e transformações reais
- Faça o leitor sentir que é possível para ele também
- Termine sempre incentivando a dar o primeiro passo

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

Tipos de blocos:
- paragraph: texto normal (SEM asteriscos ou markdown)
- heading1, heading2, heading3: títulos
- list: lista com bullets
- ordered-list: lista numerada
- quote: citação inspiradora

O artigo deve ter 800-1200 palavras, ser envolvente e fazer o leitor querer conhecer mais sobre o Método Renascer.`;

    console.log('Calling Lovable AI Gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Gere um artigo de blog sobre: ${prompt}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`Failed to generate content: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
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
      console.log('Content parsed successfully');
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
