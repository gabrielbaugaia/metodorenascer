import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  getCorsHeaders, 
  handleCorsPreflightRequest, 
  createErrorResponse, 
  createSuccessResponse,
  mapErrorToUserMessage 
} from "../_shared/cors.ts";
import { 
  getClientIdentifier, 
  checkRateLimit, 
  createRateLimitResponse,
  STRICT_RATE_LIMIT 
} from "../_shared/rateLimit.ts";

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Apply rate limiting (10 requests per minute for AI endpoints)
  const clientId = getClientIdentifier(req);
  const rateCheck = checkRateLimit(clientId, STRICT_RATE_LIMIT);
  
  if (!rateCheck.allowed) {
    console.log("[AI-MENTOR] Rate limit exceeded for:", clientId);
    return createRateLimitResponse(rateCheck.resetAt);
  }

  try {
    const { messages, type, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[AI-MENTOR] Request type:", type);

    let systemPrompt = "";
    
    if (type === "mentor") {
      // Extract protocol status for better responses
      const protocolStatus = userContext?.protocolos || {};
      
      // Log full context for debugging
      console.log("[AI-MENTOR] UserContext completo:", JSON.stringify(userContext, null, 2));
      console.log("[AI-MENTOR] Protocolos recebidos:", JSON.stringify(protocolStatus));
      
      const temTreino = protocolStatus.temTreino === true;
      const temNutricao = protocolStatus.temNutricao === true;
      const temMindset = protocolStatus.temMindset === true;
      
      console.log("[AI-MENTOR] Status após parse - Treino:", temTreino, "Nutricao:", temNutricao, "Mindset:", temMindset);

      let protocolInfo = "STATUS DOS PROTOCOLOS:\n";
      protocolInfo += `- Protocolo de Treino: ${temTreino ? "JÁ FOI GERADO e está disponível na seção 'Treino' do menu" : "AINDA NÃO FOI GERADO - orientar o cliente a aguardar que o admin irá gerar"}\n`;
      protocolInfo += `- Protocolo de Nutrição: ${temNutricao ? "JÁ FOI GERADO e está disponível na seção 'Nutrição' do menu" : "AINDA NÃO FOI GERADO - orientar o cliente a aguardar que o admin irá gerar"}\n`;
      protocolInfo += `- Protocolo de Mindset: ${temMindset ? "JÁ FOI GERADO e está disponível na seção 'Mindset' do menu" : "AINDA NÃO FOI GERADO - orientar o cliente a aguardar que o admin irá gerar"}\n`;

      // Extract check-in and progress info
      const checkinData = userContext?.checkin || {};
      const progressData = userContext?.progresso || {};

      let checkinInfo = "\nPROGRESSO E CHECK-INS:\n";
      if (checkinData.ultimoCheckin) {
        const ultimoCheckinDate = new Date(checkinData.ultimoCheckin).toLocaleDateString('pt-BR');
        checkinInfo += `- Último check-in: ${ultimoCheckinDate}\n`;
        checkinInfo += `- Total de check-ins realizados: ${checkinData.totalCheckins || 0}\n`;
        
        if (checkinData.pesoAtual) {
          checkinInfo += `- Peso atual (último check-in): ${checkinData.pesoAtual}kg\n`;
        }
        if (checkinData.pesoInicial && checkinData.pesoAtual) {
          const diferenca = (checkinData.pesoAtual - checkinData.pesoInicial).toFixed(1);
          const sinal = parseFloat(diferenca) >= 0 ? "+" : "";
          checkinInfo += `- Variação de peso desde o início: ${sinal}${diferenca}kg\n`;
        }
        if (checkinData.diasParaProximoCheckin !== null) {
          if (checkinData.diasParaProximoCheckin === 0) {
            checkinInfo += `- Próximo check-in: DISPONÍVEL AGORA - orientar a acessar seção 'Evolução'\n`;
          } else {
            checkinInfo += `- Próximo check-in em: ${checkinData.diasParaProximoCheckin} dias\n`;
          }
        }
      } else {
        checkinInfo += `- Ainda não realizou nenhum check-in de evolução\n`;
        checkinInfo += `- Orientar a fazer o primeiro check-in na seção 'Evolução' para acompanhar progresso\n`;
      }

      if (progressData.treinos_completos !== undefined) {
        checkinInfo += `- Treinos marcados como concluídos: ${progressData.treinos_completos}\n`;
      }

      // Extract subscription info
      const subscriptionData = userContext?.assinatura || {};
      let subscriptionInfo = "\nASSSINATURA:\n";
      if (subscriptionData.plano) {
        subscriptionInfo += `- Plano: ${subscriptionData.plano}\n`;
        subscriptionInfo += `- Status: ${subscriptionData.status === 'active' ? 'Ativo' : subscriptionData.status === 'past_due' ? 'Pagamento pendente' : subscriptionData.status === 'canceled' ? 'Cancelado' : subscriptionData.status || 'Não informado'}\n`;
        
        if (subscriptionData.dataInicio) {
          const dataInicio = new Date(subscriptionData.dataInicio).toLocaleDateString('pt-BR');
          subscriptionInfo += `- Início da assinatura: ${dataInicio}\n`;
        }
        if (subscriptionData.dataTermino) {
          const dataTermino = new Date(subscriptionData.dataTermino).toLocaleDateString('pt-BR');
          subscriptionInfo += `- Término/Renovação: ${dataTermino}\n`;
        }
        if (subscriptionData.diasRestantes !== null) {
          if (subscriptionData.diasRestantes === 0) {
            subscriptionInfo += `- Status do período: EXPIRA HOJE - orientar a renovar na seção 'Assinatura'\n`;
          } else if (subscriptionData.diasRestantes <= 7) {
            subscriptionInfo += `- Dias até renovação: ${subscriptionData.diasRestantes} (PRÓXIMO DA RENOVAÇÃO)\n`;
          } else {
            subscriptionInfo += `- Dias até renovação: ${subscriptionData.diasRestantes}\n`;
          }
        }
      } else {
        subscriptionInfo += `- Sem assinatura ativa encontrada\n`;
      }

      systemPrompt = `Você é Gabriel Baú, mentor fitness do Método Renascer. Você é um especialista em transformação corporal com mais de 10 anos de experiência. Seu papel é:

1. Motivar e apoiar o cliente em sua jornada de transformação
2. Responder dúvidas sobre treino, nutrição e mindset
3. Dar dicas práticas e personalizadas baseadas nos dados do cliente
4. Celebrar conquistas e ajudar em momentos difíceis
5. Manter um tom amigável, profissional e motivador

DADOS DO CLIENTE:
- Nome: ${userContext?.full_name || "Cliente"}
- Peso cadastrado: ${userContext?.weight ? userContext.weight + "kg" : "Não informado"}
- Altura: ${userContext?.height ? userContext.height + "cm" : "Não informada"}
- Objetivo: ${userContext?.objetivo_principal || userContext?.objective_primary || userContext?.goals || "Não informado"}
- Local de treino: ${userContext?.local_treino || "Não informado"}
- Dias disponíveis: ${userContext?.dias_disponiveis || "Não informado"}
- Horário de treino: ${userContext?.horario_treino || "Não informado"}
- Nível de experiência: ${userContext?.nivel_experiencia || "Não informado"}
- Restrições médicas: ${userContext?.restricoes_medicas || "Nenhuma informada"}
- Restrições alimentares: ${userContext?.restricoes_alimentares || "Nenhuma informada"}

${protocolInfo}
${checkinInfo}
${subscriptionInfo}

REGRAS IMPORTANTES:
- Sempre responda em português brasileiro
- Seja empático e motivador
- Use linguagem acessível e o nome do cliente quando apropriado
- Dê respostas práticas e acionáveis baseadas nos dados acima
- Se o cliente perguntar sobre seu treino/nutrição/mindset, VERIFIQUE o status do protocolo antes de responder
- Se o protocolo já existe, oriente a acessar no menu lateral
- Se o protocolo não existe ainda, explique que está em processo de criação e será liberado em breve
- Nunca forneça diagnósticos médicos, sempre recomende consultar um profissional para questões de saúde
- Não peça informações que você já tem acima`;
    } else if (type === "protocolo") {
      systemPrompt = `Você é um sistema de geração de protocolos fitness do Método Renascer. Gere planos de treino e nutrição personalizados baseados na anamnese do cliente.

Contexto do cliente: ${JSON.stringify(userContext || {})}

Para TREINO, retorne JSON no formato:
{
  "semanas": [
    {
      "semana": 1,
      "dias": [
        {
          "dia": "Segunda",
          "foco": "Peito e Tríceps",
          "exercicios": [
            {"nome": "Supino reto", "series": 4, "repeticoes": "10-12", "descanso": "60s"}
          ]
        }
      ]
    }
  ],
  "observacoes": "..."
}

Para NUTRIÇÃO, retorne JSON no formato:
{
  "calorias_diarias": 2000,
  "macros": {"proteinas": 150, "carboidratos": 200, "gorduras": 67},
  "refeicoes": [
    {
      "nome": "Café da manhã",
      "horario": "07:00",
      "alimentos": ["2 ovos", "1 banana", "30g aveia"],
      "calorias": 350
    }
  ],
  "observacoes": "..."
}`;
    } else if (type === "receita") {
      systemPrompt = `Você é um chef nutricional do Método Renascer. Crie receitas fitness deliciosas e saudáveis.

Retorne JSON no formato:
{
  "nome": "Nome da Receita",
  "tempo_preparo": "20 minutos",
  "porcoes": 2,
  "calorias_por_porcao": 350,
  "macros": {"proteinas": 30, "carboidratos": 25, "gorduras": 12},
  "ingredientes": ["100g frango", "1 xícara arroz integral"],
  "modo_preparo": ["Passo 1...", "Passo 2..."],
  "dicas": "Dica do chef..."
}`;
    } else {
      systemPrompt = `Você é o assistente de suporte do Método Renascer. Ajude os clientes com dúvidas gerais sobre a plataforma, planos, funcionalidades e aspectos técnicos. Seja sempre cordial e prestativo.`;
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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI-MENTOR] AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return createErrorResponse(req, "Limite de requisições excedido. Tente novamente em alguns instantes.", 429);
      }
      if (response.status === 402) {
        return createErrorResponse(req, "Créditos insuficientes. Entre em contato com o suporte.", 402);
      }
      
      return createErrorResponse(req, "Erro no serviço de IA");
    }

    console.log("[AI-MENTOR] Streaming response started");

    return new Response(response.body, {
      headers: { ...getCorsHeaders(req), "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[AI-MENTOR] Error:", error);
    const userMessage = mapErrorToUserMessage(error);
    return createErrorResponse(req, userMessage);
  }
});
