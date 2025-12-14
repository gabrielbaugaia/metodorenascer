import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapear tipo de plano para duração em semanas
const planDurationWeeks: Record<string, number> = {
  "embaixador": 4,
  "mensal": 4,
  "trimestral": 12,
  "semestral": 24,
  "anual": 48,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, userContext, userId, adjustments, planType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Determinar duração do protocolo baseado no plano
    const durationWeeks = planDurationWeeks[planType?.toLowerCase()] || 4;
    
    // Calcular quantas semanas liberar (máximo 4 por ciclo)
    const weeksPerCycle = 4;
    const totalCycles = Math.ceil(durationWeeks / weeksPerCycle);

    let systemPrompt = "";
    let userPrompt = "";

    if (tipo === "treino") {
      systemPrompt = `Você é um personal trainer especializado do Método Renascer. Crie um protocolo de treino completo e personalizado.

IMPORTANTE: 
- O plano deve ter ${durationWeeks} semanas no total
- Divida em ciclos de ${weeksPerCycle} semanas cada
- O aluno deve enviar fotos e feedback a cada ${weeksPerCycle} semanas para ajustes
- Inclua observação sobre possíveis ajustes após análise das fotos mensais

RETORNE APENAS JSON VÁLIDO sem markdown, no formato:
{
  "titulo": "Protocolo de Treino Personalizado",
  "duracao_semanas": ${durationWeeks},
  "ciclo_atual": 1,
  "total_ciclos": ${totalCycles},
  "nivel": "iniciante|intermediario|avancado",
  "objetivo": "...",
  "observacao_ajustes": "Este protocolo pode ser ajustado após o envio das fotos e feedback a cada ${weeksPerCycle} semanas. O acompanhamento contínuo garante resultados otimizados.",
  "semanas": [
    {
      "semana": 1,
      "ciclo": 1,
      "bloqueada": false,
      "dias": [
        {
          "dia": "Segunda-feira",
          "foco": "Peito e Tríceps",
          "duracao_minutos": 45,
          "exercicios": [
            {
              "nome": "Supino reto com halteres",
              "series": 4,
              "repeticoes": "10-12",
              "descanso": "60s",
              "video_url": "",
              "dicas": "Mantenha os cotovelos a 45 graus"
            }
          ]
        }
      ]
    }
  ],
  "observacoes_gerais": "...",
  "aquecimento": "5-10 min de cardio leve",
  "alongamento": "10 min ao final",
  "proxima_avaliacao": "Enviar fotos e feedback após semana 4 para ajustes do próximo ciclo"
}`;

      userPrompt = `Crie um protocolo de treino para este cliente:
${JSON.stringify(userContext, null, 2)}

Plano contratado: ${planType || 'mensal'} (${durationWeeks} semanas)
${adjustments ? `Ajustes solicitados: ${adjustments}` : ""}

Considere:
- Nível de experiência do cliente
- Objetivos específicos
- Lesões ou restrições
- Disponibilidade semanal
- Gerar apenas as primeiras ${weeksPerCycle} semanas detalhadas (as próximas serão liberadas após envio de feedback)`;
    } else if (tipo === "nutricao") {
      systemPrompt = `Você é um nutricionista esportivo do Método Renascer. Crie um plano alimentar completo e personalizado.

IMPORTANTE:
- O plano é para ${durationWeeks} semanas
- Pode ser ajustado a cada ${weeksPerCycle} semanas após análise de fotos e feedback
- Inclua observação sobre ajustes periódicos

RETORNE APENAS JSON VÁLIDO sem markdown, no formato:
{
  "titulo": "Plano Nutricional Personalizado",
  "duracao_semanas": ${durationWeeks},
  "ciclo_atual": 1,
  "objetivo": "...",
  "observacao_ajustes": "Este plano será ajustado a cada ${weeksPerCycle} semanas conforme seu progresso e envio de fotos.",
  "calorias_diarias": 2000,
  "macros": {
    "proteinas": "150g",
    "carboidratos": "200g",
    "gorduras": "67g"
  },
  "refeicoes": [
    {
      "nome": "Café da manhã",
      "horario": "07:00",
      "alimentos": ["2 ovos mexidos", "1 fatia pão integral", "1 banana"],
      "calorias_aproximadas": 350
    }
  ],
  "suplementacao": ["Whey Protein pós-treino", "Creatina 5g/dia"],
  "hidratacao": "Mínimo 2.5L água/dia",
  "dicas_gerais": ["Coma devagar", "Evite distrações durante refeições"],
  "proxima_avaliacao": "Enviar fotos e feedback após semana ${weeksPerCycle} para ajustes"
}`;

      userPrompt = `Crie um plano nutricional para este cliente:
${JSON.stringify(userContext, null, 2)}

Plano contratado: ${planType || 'mensal'} (${durationWeeks} semanas)
${adjustments ? `Ajustes solicitados: ${adjustments}` : ""}

Considere:
- Peso atual e objetivo
- Nível de atividade física
- Restrições alimentares
- Preferências`;
    } else if (tipo === "mindset") {
      systemPrompt = `Você é um coach de mentalidade e psicologia esportiva do Método Renascer. Crie um protocolo de mindset completo e personalizado baseado na anamnese do cliente.

RETORNE APENAS JSON VÁLIDO sem markdown, no formato:
{
  "titulo": "Protocolo de Mindset - Reprogramação Mental",
  "duracao_semanas": ${durationWeeks},
  "mentalidade_necessaria": {
    "titulo": "Disciplina supera motivação",
    "descricao": "A transformação física é 80% mental. Você não precisa estar motivado todos os dias, mas precisa ser disciplinado.",
    "reflexao": "Cada escolha que você faz hoje está moldando o corpo que você terá amanhã. Aceite o desconforto temporário em troca de resultados permanentes."
  },
  "rotina_manha": {
    "duracao": "5-10 minutos",
    "praticas": [
      {"nome": "Meditação de 5 minutos", "descricao": "Foque na respiração e visualize seu dia produtivo"},
      {"nome": "Afirmações positivas", "descricao": "Repita 3 afirmações sobre seus objetivos"},
      {"nome": "Visualização do objetivo", "descricao": "Imagine-se já tendo alcançado seu objetivo"}
    ]
  },
  "rotina_noite": {
    "duracao": "5-10 minutos",
    "praticas": [
      {"nome": "Diário de gratidão", "descricao": "Escreva 3 coisas pelas quais é grato hoje"},
      {"nome": "Revisão do dia", "descricao": "Avalie o que fez bem e o que pode melhorar"},
      {"nome": "Planejamento do amanhã", "descricao": "Defina suas 3 prioridades para amanhã"}
    ]
  },
  "crencas_limitantes": [
    {
      "crenca": "Não tenho tempo para treinar",
      "reformulacao": "Tenho as mesmas 24 horas que pessoas de sucesso. Minha saúde é prioridade e encontro tempo para o que é importante.",
      "acao": "Bloquear 30 minutos no calendário como compromisso inegociável"
    }
  ],
  "habitos_semanais": [
    "Preparar refeições no domingo",
    "Revisar metas toda segunda-feira",
    "Tirar foto de progresso semanal"
  ],
  "afirmacoes_personalizadas": [
    "Eu sou capaz de transformar meu corpo",
    "Cada dia me aproximo mais do meu objetivo",
    "Minha disciplina é mais forte que minhas desculpas"
  ]
}`;

      userPrompt = `Crie um protocolo de mindset personalizado para este cliente:
${JSON.stringify(userContext, null, 2)}

Plano contratado: ${planType || 'mensal'} (${durationWeeks} semanas)
${adjustments ? `Ajustes solicitados: ${adjustments}` : ""}

Considere:
- Objetivos do cliente
- Nível de estresse
- Qualidade do sono
- Histórico de tentativas anteriores
- Crenças limitantes comuns relacionadas ao perfil
- Rotinas personalizadas para o estilo de vida`;
    } else {
      throw new Error("Tipo de protocolo inválido");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      throw new Error("Erro ao gerar protocolo");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    // Parse JSON from response
    let protocolData;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      protocolData = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse protocol JSON:", content);
      throw new Error("Erro ao processar protocolo gerado");
    }

    // Adicionar metadados de controle de ciclos
    protocolData.plan_type = planType || 'mensal';
    protocolData.duracao_semanas = durationWeeks;
    protocolData.semanas_por_ciclo = weeksPerCycle;
    protocolData.ciclo_atual = 1;
    protocolData.total_ciclos = totalCycles;
    protocolData.data_proxima_avaliacao = new Date(Date.now() + weeksPerCycle * 7 * 24 * 60 * 60 * 1000).toISOString();

    // Save protocol to database
    const { data: savedProtocol, error: saveError } = await supabaseClient
      .from("protocolos")
      .insert({
        user_id: userId,
        tipo: tipo,
        titulo: protocolData.titulo || `Protocolo de ${tipo}`,
        conteudo: protocolData,
        ativo: true,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving protocol:", saveError);
      throw new Error("Erro ao salvar protocolo");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      protocol: savedProtocol,
      data: protocolData 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate protocol error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
