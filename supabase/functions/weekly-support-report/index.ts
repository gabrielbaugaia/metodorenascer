import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConversaMetrics {
  totalConversas: number;
  totalMensagens: number;
  mensagensUsuario: number;
  mensagensAssistente: number;
  mensagensAdmin: number;
  alertasUrgentes: number;
  alertasNormais: number;
  conversasComIntervencao: number;
  tempoMedioResposta: string;
  topKeywords: { keyword: string; count: number }[];
  clientesMaisAtivos: { nome: string; mensagens: number }[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    console.log(`Generating weekly report from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // 1. Fetch conversations from last 7 days
    const { data: conversas, error: conversasError } = await supabase
      .from("conversas")
      .select("*")
      .gte("updated_at", startDate.toISOString())
      .order("updated_at", { ascending: false });

    if (conversasError) {
      console.error("Error fetching conversas:", conversasError);
      throw conversasError;
    }

    console.log(`Found ${conversas?.length || 0} conversations`);

    // 2. Fetch alerts from last 7 days
    const { data: alerts, error: alertsError } = await supabase
      .from("admin_support_alerts")
      .select("*")
      .gte("created_at", startDate.toISOString());

    if (alertsError) {
      console.error("Error fetching alerts:", alertsError);
    }

    // 3. Calculate metrics
    let totalMensagens = 0;
    let mensagensUsuario = 0;
    let mensagensAssistente = 0;
    let mensagensAdmin = 0;
    let conversasComIntervencao = 0;
    const keywordCounts: Record<string, number> = {};
    const clientesMensagens: Record<string, { nome: string; count: number }> = {};

    // Track response times (simplified - time between user message and next response)
    const responseTimes: number[] = [];

    for (const conversa of conversas || []) {
      const mensagens = Array.isArray(conversa.mensagens) ? conversa.mensagens : [];
      totalMensagens += mensagens.length;

      let hasAdminIntervention = false;
      let lastUserMessageTime: Date | null = null;

      for (let i = 0; i < mensagens.length; i++) {
        const msg = mensagens[i] as { role: string; content: string; timestamp?: string };
        
        if (msg.role === "user") {
          mensagensUsuario++;
          if (msg.timestamp) {
            lastUserMessageTime = new Date(msg.timestamp);
          }
        } else if (msg.role === "assistant") {
          mensagensAssistente++;
          // Calculate response time if we have a previous user message time
          if (lastUserMessageTime && msg.timestamp) {
            const responseTime = new Date(msg.timestamp).getTime() - lastUserMessageTime.getTime();
            if (responseTime > 0 && responseTime < 300000) { // Less than 5 minutes (streaming response)
              responseTimes.push(responseTime);
            }
            lastUserMessageTime = null;
          }
        } else if (msg.role === "admin") {
          mensagensAdmin++;
          hasAdminIntervention = true;
        }
      }

      if (hasAdminIntervention) {
        conversasComIntervencao++;
      }

      // Get client name for active clients
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", conversa.user_id)
        .single();

      const clientName = profile?.full_name || "Cliente desconhecido";
      if (!clientesMensagens[conversa.user_id]) {
        clientesMensagens[conversa.user_id] = { nome: clientName, count: 0 };
      }
      clientesMensagens[conversa.user_id].count += mensagens.filter((m: any) => m.role === "user").length;
    }

    // Process alert keywords
    for (const alert of alerts || []) {
      if (alert.keywords_detected && Array.isArray(alert.keywords_detected)) {
        for (const keyword of alert.keywords_detected) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      }
    }

    // Sort and get top keywords
    const topKeywords = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Sort and get most active clients
    const clientesMaisAtivos = Object.values(clientesMensagens)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(c => ({ nome: c.nome, mensagens: c.count }));

    // Calculate average response time
    let tempoMedioResposta = "N/A";
    if (responseTimes.length > 0) {
      const avgMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      if (avgMs < 1000) {
        tempoMedioResposta = `${Math.round(avgMs)}ms`;
      } else if (avgMs < 60000) {
        tempoMedioResposta = `${Math.round(avgMs / 1000)}s`;
      } else {
        tempoMedioResposta = `${Math.round(avgMs / 60000)}min`;
      }
    }

    const alertasUrgentes = alerts?.filter(a => a.urgency_level === "urgent").length || 0;
    const alertasNormais = alerts?.filter(a => a.urgency_level === "normal").length || 0;

    const metrics: ConversaMetrics = {
      totalConversas: conversas?.length || 0,
      totalMensagens,
      mensagensUsuario,
      mensagensAssistente,
      mensagensAdmin,
      alertasUrgentes,
      alertasNormais,
      conversasComIntervencao,
      tempoMedioResposta,
      topKeywords,
      clientesMaisAtivos
    };

    console.log("Metrics calculated:", metrics);

    // 4. Get admin email
    const adminEmail = "gabrielbaugaia@gmail.com";

    // 5. Format date range for email
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    };

    // 6. Send email report
    const emailResponse = await resend.emails.send({
      from: "Relatório Semanal <noreply@renascerapp.com.br>",
      to: [adminEmail],
      subject: `📊 Relatório Semanal de Suporte - ${formatDate(startDate)} a ${formatDate(endDate)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f1f5f9; }
            .container { max-width: 650px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF4500, #ff6b35); color: white; padding: 32px; border-radius: 16px 16px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
            .content { background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px; }
            .stat-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
            .stat-card.urgent { background: #fef2f2; border-color: #fecaca; }
            .stat-value { font-size: 32px; font-weight: 700; color: #0f172a; margin: 0; }
            .stat-value.urgent { color: #dc2626; }
            .stat-label { font-size: 13px; color: #64748b; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.05em; }
            .section { margin-top: 28px; }
            .section-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #FF4500; display: inline-block; }
            .list { list-style: none; padding: 0; margin: 0; }
            .list li { padding: 12px 16px; background: #f8fafc; margin-bottom: 8px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
            .list li:last-child { margin-bottom: 0; }
            .keyword-badge { background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; }
            .count-badge { background: #FF4500; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; }
            .highlight-box { background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin-top: 24px; }
            .highlight-box h3 { margin: 0 0 8px 0; color: #9a3412; font-size: 14px; }
            .highlight-box p { margin: 0; color: #c2410c; font-size: 24px; font-weight: 700; }
            .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; }
            .cta-button { display: inline-block; background: #FF4500; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; }
            .empty-state { text-align: center; padding: 20px; color: #94a3b8; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Relatório Semanal de Suporte</h1>
              <p>${formatDate(startDate)} a ${formatDate(endDate)}</p>
            </div>
            <div class="content">
              <div class="stats-grid">
                <div class="stat-card">
                  <p class="stat-value">${metrics.totalConversas}</p>
                  <p class="stat-label">Conversas Ativas</p>
                </div>
                <div class="stat-card">
                  <p class="stat-value">${metrics.totalMensagens}</p>
                  <p class="stat-label">Total de Mensagens</p>
                </div>
                <div class="stat-card urgent">
                  <p class="stat-value urgent">${metrics.alertasUrgentes}</p>
                  <p class="stat-label">Alertas Urgentes</p>
                </div>
                <div class="stat-card">
                  <p class="stat-value">${metrics.conversasComIntervencao}</p>
                  <p class="stat-label">Intervenções Admin</p>
                </div>
              </div>

              <div class="highlight-box">
                <h3>⚡ Tempo Médio de Resposta da IA</h3>
                <p>${metrics.tempoMedioResposta}</p>
              </div>

              <div class="section">
                <h2 class="section-title">📊 Distribuição de Mensagens</h2>
                <ul class="list">
                  <li>
                    <span>Mensagens de Clientes</span>
                    <span class="count-badge">${metrics.mensagensUsuario}</span>
                  </li>
                  <li>
                    <span>Respostas da IA</span>
                    <span class="count-badge">${metrics.mensagensAssistente}</span>
                  </li>
                  <li>
                    <span>Intervenções do Admin</span>
                    <span class="count-badge">${metrics.mensagensAdmin}</span>
                  </li>
                </ul>
              </div>

              ${metrics.topKeywords.length > 0 ? `
              <div class="section">
                <h2 class="section-title">🔴 Palavras-chave Detectadas</h2>
                <ul class="list">
                  ${metrics.topKeywords.map(k => `
                    <li>
                      <span class="keyword-badge">${k.keyword}</span>
                      <span class="count-badge">${k.count}x</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
              ` : ''}

              ${metrics.clientesMaisAtivos.length > 0 ? `
              <div class="section">
                <h2 class="section-title">👥 Clientes Mais Ativos</h2>
                <ul class="list">
                  ${metrics.clientesMaisAtivos.map((c, i) => `
                    <li>
                      <span>${i + 1}. ${c.nome}</span>
                      <span class="count-badge">${c.mensagens} msgs</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
              ` : ''}

              <center style="margin-top: 32px;">
                <a href="https://preview--formadeser.lovable.app/admin/suporte-chats" class="cta-button">
                  Ver Todos os Chats
                </a>
              </center>
            </div>
            <div class="footer">
              <p>Relatório gerado automaticamente pelo sistema Método Gabriel Bau.</p>
              <p>Próximo relatório: ${formatDate(new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000))}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Weekly report email sent:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      metrics,
      emailResponse 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in weekly-support-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
