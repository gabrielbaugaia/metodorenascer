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
    const { prompt, language = 'conversacional', format = 'artigo-completo', audience = 'iniciantes' } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Language style mapping
    const languageStyles: Record<string, string> = {
      'conversacional': 'Use um tom de conversa amigável, como se estivesse falando com um amigo. Seja próximo e acessível.',
      'inspiracional': 'Use um tom motivador e inspiracional. Faça o leitor sentir que é capaz de alcançar seus objetivos.',
      'educativo': 'Use um tom educativo e informativo. Explique conceitos de forma clara e didática.',
      'persuasivo': 'Use técnicas de copywriting sutil. Mostre valor sem parecer vendedor. Faça o leitor querer começar naturalmente.',
      'tecnico': 'Use uma linguagem mais técnica, mas ainda acessível. Inclua termos específicos quando necessário.'
    };

    // Format mapping
    const formatStyles: Record<string, string> = {
      'artigo-completo': 'Estruture como um artigo completo com introdução, desenvolvimento com subtítulos e conclusão.',
      'lista': 'Estruture como uma lista de dicas ou pontos principais. Use listas bullet para destacar cada item.',
      'guia-passo': 'Estruture como um guia passo a passo numerado. Cada seção deve ser uma etapa clara.',
      'historia': 'Conte uma história ou case de sucesso. Use narrativa envolvente para ilustrar os pontos.',
      'faq': 'Estruture como perguntas e respostas. Antecipe as dúvidas mais comuns do público.'
    };

    // Audience mapping
    const audienceStyles: Record<string, string> = {
      'iniciantes': 'O público nunca treinou ou está começando agora. Evite jargões, explique tudo de forma simples.',
      'intermediarios': 'O público já treina há algum tempo mas quer evoluir. Pode usar termos básicos de treino.',
      'avancados': 'O público é experiente e busca otimização. Pode usar termos técnicos.',
      'ocupados': 'O público tem pouco tempo. Foque em soluções práticas e rápidas.',
      'mulheres': 'Adapte a linguagem para o público feminino. Aborde questões específicas.',
      'homens': 'Adapte a linguagem para o público masculino.',
      'acima-40': 'O público tem mais de 40 anos. Considere cuidados com saúde e adaptações necessárias.'
    };

    const systemPrompt = `Você é um copywriter especializado em transformação física e mental. Gere artigos de blog em português brasileiro para o Método Renascer.

ESTILO DE LINGUAGEM:
${languageStyles[language] || languageStyles['conversacional']}

FORMATO DO ARTIGO:
${formatStyles[format] || formatStyles['artigo-completo']}

PÚBLICO-ALVO:
${audienceStyles[audience] || audienceStyles['iniciantes']}

CONTEXTO IMPORTANTE:
- O Método Renascer é um programa de transformação física e mental personalizado
- Os leitores são potenciais CLIENTES, não profissionais
- O objetivo é fazer o leitor se sentir seguro e animado para começar
- Transmita confiança sem ser vendedor

REGRAS:
- NÃO use asteriscos (**) para negrito
- Use linguagem limpa e natural
- Foque nos benefícios e transformações reais
- Termine incentivando o primeiro passo

Retorne APENAS um JSON válido (sem markdown):
{
  "title": "Título do artigo (máximo 60 caracteres)",
  "excerpt": "Resumo em 2-3 frases (máximo 160 caracteres)",
  "metaTitle": "Título SEO (máximo 60 caracteres)",
  "metaDescription": "Descrição SEO (máximo 160 caracteres)",
  "content": [
    { "id": "1", "type": "paragraph", "content": "Texto..." },
    { "id": "2", "type": "heading2", "content": "Subtítulo..." },
    { "id": "3", "type": "paragraph", "content": "Texto..." },
    { "id": "4", "type": "list", "items": ["Item 1", "Item 2"] },
    { "id": "5", "type": "quote", "content": "Citação..." }
  ]
}

Tipos de blocos: paragraph, heading1, heading2, heading3, list, ordered-list, quote
O artigo deve ter 800-1200 palavras.`;

    console.log('Generating with options:', { language, format, audience });
    
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
          { role: 'user', content: `Gere um artigo sobre: ${prompt}` }
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
