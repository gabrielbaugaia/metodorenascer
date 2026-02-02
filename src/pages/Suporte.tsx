import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Send, 
  Loader2, 
  MessageCircle, 
  HelpCircle, 
  ChefHat,
  Bot,
  User as UserIcon,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Profile {
  full_name: string;
  weight: number | null;
  height: number | null;
  goals: string | null;
  objective_primary: string | null;
  objetivo_principal: string | null;
  local_treino: string | null;
  dias_disponiveis: string | null;
  horario_treino: string | null;
  nivel_experiencia: string | null;
  restricoes_medicas: string | null;
  restricoes_alimentares: string | null;
}

interface ProtocoloStatus {
  temTreino: boolean;
  temNutricao: boolean;
  temMindset: boolean;
}

interface CheckinInfo {
  ultimoCheckin: string | null;
  pesoAtual: number | null;
  pesoInicial: number | null;
  totalCheckins: number;
  diasParaProximoCheckin: number | null;
}

interface ProgressInfo {
  treinos_completos: number;
}

interface SubscriptionInfo {
  plano: string | null;
  status: string | null;
  dataInicio: string | null;
  dataTermino: string | null;
  diasRestantes: number | null;
}

const faqs = [
  {
    question: "Como funciona o plano de treino?",
    answer: "Seu plano de treino é criado de forma personalizada com base nas informações da sua anamnese. Ele é adaptado aos seus objetivos, nível de experiência e disponibilidade de horários."
  },
  {
    question: "Posso alterar meu protocolo?",
    answer: "Sim! A qualquer momento você pode conversar com seu mentor para solicitar ajustes no seu protocolo de acordo com suas necessidades ou preferências."
  },
  {
    question: "Como faço para gerar receitas?",
    answer: "Na seção 'Receitas', você pode selecionar ingredientes disponíveis e nosso sistema irá sugerir receitas fitness personalizadas para você."
  },
  {
    question: "O suporte funciona 24 horas?",
    answer: "Sim! Nosso mentor IA está disponível 24/7 para tirar suas dúvidas sobre treino, nutrição e mindset."
  },
  {
    question: "Como funciona o acompanhamento de evolução?",
    answer: "A cada 30 dias você pode enviar suas fotos de evolução e atualizar seu peso. Essas informações são analisadas pelo sistema para acompanhar seu progresso e sugerir ajustes no protocolo."
  },
  {
    question: "Posso cancelar minha assinatura?",
    answer: "Sim, você pode gerenciar sua assinatura a qualquer momento através da seção 'Assinatura' no menu lateral."
  },
  {
    question: "Como os vídeos de exercícios funcionam?",
    answer: "Ao clicar em qualquer exercício no seu treino, um vídeo demonstrativo será exibido. Os vídeos são atualizados regularmente para cobrir todos os exercícios do seu protocolo."
  },
  {
    question: "O que fazer se não tiver vídeo para um exercício?",
    answer: "Caso algum exercício ainda não tenha vídeo demonstrativo, você pode perguntar ao mentor como executar corretamente ou pesquisar pelo nome do exercício."
  }
];

export default function Suporte() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [protocolos, setProtocolos] = useState<ProtocoloStatus>({ temTreino: false, temNutricao: false, temMindset: false });
  const [checkinInfo, setCheckinInfo] = useState<CheckinInfo | null>(null);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Fetch profile with complete data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, weight, height, goals, objective_primary, objetivo_principal, local_treino, dias_disponiveis, horario_treino, nivel_experiencia, restricoes_medicas, restricoes_alimentares")
        .eq("id", user.id)
        .single();
      if (profileData) setProfile(profileData);

      // Fetch user protocols status
      const { data: protocolosData, error: protocolosError } = await supabase
        .from("protocolos")
        .select("tipo, ativo")
        .eq("user_id", user.id)
        .eq("ativo", true);
      
      console.log("[Suporte] Protocolos encontrados:", protocolosData, "Erro:", protocolosError);
      
      if (protocolosData) {
        const novoStatus = {
          temTreino: protocolosData.some(p => p.tipo === "treino"),
          temNutricao: protocolosData.some(p => p.tipo === "nutricao"),
          temMindset: protocolosData.some(p => p.tipo === "mindset")
        };
        console.log("[Suporte] Status calculado:", novoStatus);
        setProtocolos(novoStatus);
      }

      // Fetch check-in data
      const { data: checkinsData } = await supabase
        .from("checkins")
        .select("data_checkin, peso_atual, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (checkinsData && checkinsData.length > 0) {
        const ultimoCheckin = checkinsData[0];
        const primeiroCheckin = checkinsData[checkinsData.length - 1];
        
        // Calculate days until next check-in (30 days cycle)
        let diasParaProximoCheckin: number | null = null;
        if (ultimoCheckin.data_checkin) {
          const lastCheckinDate = new Date(ultimoCheckin.data_checkin);
          const nextCheckinDate = new Date(lastCheckinDate);
          nextCheckinDate.setDate(nextCheckinDate.getDate() + 30);
          const today = new Date();
          const diffDays = Math.ceil((nextCheckinDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          diasParaProximoCheckin = diffDays > 0 ? diffDays : 0;
        }

        setCheckinInfo({
          ultimoCheckin: ultimoCheckin.data_checkin,
          pesoAtual: ultimoCheckin.peso_atual,
          pesoInicial: primeiroCheckin.peso_atual,
          totalCheckins: checkinsData.length,
          diasParaProximoCheckin
        });
      }

      // Fetch workout completions count
      const { count: workoutCount } = await supabase
        .from("workout_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setProgressInfo({
        treinos_completos: workoutCount || 0
      });

      // Fetch subscription data
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("plan_name, status, started_at, current_period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionData) {
        let diasRestantes: number | null = null;
        if (subscriptionData.current_period_end) {
          const endDate = new Date(subscriptionData.current_period_end);
          const today = new Date();
          const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          diasRestantes = diffDays > 0 ? diffDays : 0;
        }

        setSubscriptionInfo({
          plano: subscriptionData.plan_name,
          status: subscriptionData.status,
          dataInicio: subscriptionData.started_at,
          dataTermino: subscriptionData.current_period_end,
          diasRestantes
        });
      }
      
      // Fetch chat history
      const { data: conversaData } = await supabase
        .from("conversas")
        .select("id, mensagens")
        .eq("user_id", user.id)
        .eq("tipo", "suporte")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (conversaData?.mensagens) {
        setConversaId(conversaData.id);
        const historico = conversaData.mensagens as unknown as Message[];
        if (Array.isArray(historico)) {
          setMessages(historico);
        }
      }
      setLoadingHistory(false);
    };
    fetchData();
  }, [user]);

  // Save messages to database with debounce - uses UPSERT to ensure only 1 conversation per user+tipo
  useEffect(() => {
    if (!user || messages.length === 0 || loadingHistory) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        if (conversaId) {
          // Update existing conversation
          await supabase
            .from("conversas")
            .update({ 
              mensagens: messages as any,
              updated_at: new Date().toISOString()
            })
            .eq("id", conversaId);
        } else {
          // Use UPSERT to prevent duplicates - unique constraint on (user_id, tipo)
          const { data, error } = await supabase
            .from("conversas")
            .upsert({
              user_id: user.id,
              tipo: "suporte",
              mensagens: messages as any,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,tipo',
              ignoreDuplicates: false
            })
            .select("id")
            .single();
          
          if (error) {
            // If upsert fails, try to find existing conversation
            const { data: existing } = await supabase
              .from("conversas")
              .select("id")
              .eq("user_id", user.id)
              .eq("tipo", "suporte")
              .single();
            
            if (existing) {
              setConversaId(existing.id);
              // Update the existing one
              await supabase
                .from("conversas")
                .update({ 
                  mensagens: messages as any,
                  updated_at: new Date().toISOString()
                })
                .eq("id", existing.id);
            }
          } else if (data) {
            setConversaId(data.id);
          }
        }
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    }, 1000); // Debounce de 1 segundo

    return () => clearTimeout(timeoutId);
  }, [messages, user, conversaId, loadingHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Urgent keywords detection
  const urgentKeywords = {
    pain: ['dor', 'doendo', 'machuca', 'machucando', 'lesão', 'lesionei', 'lesionado', 'ferido', 'inchado', 'inchaço'],
    exerciseSwap: ['trocar exercício', 'trocar exercicio', 'substituir exercício', 'substituir exercicio', 'outro exercício', 'outro exercicio', 'não consigo fazer', 'nao consigo fazer'],
    humanSupport: ['falar com humano', 'atendimento humano', 'pessoa real', 'gabriel bau', 'gabriel bau', 'falar com você', 'falar com voce', 'quero cancelar', 'preciso de ajuda urgente', 'emergência', 'emergencia'],
    urgent: ['urgente', 'socorro', 'ajuda', 'grave', 'sério', 'serio', 'problema', 'não funciona', 'nao funciona', 'erro']
  };

  const detectUrgency = (message: string): { isUrgent: boolean; keywords: string[]; reason: string } => {
    const lowerMessage = message.toLowerCase();
    const detectedKeywords: string[] = [];
    let reason = '';

    // Check pain keywords
    for (const keyword of urgentKeywords.pain) {
      if (lowerMessage.includes(keyword)) {
        detectedKeywords.push(keyword);
        reason = 'Cliente relatou dor ou desconforto durante exercício';
      }
    }

    // Check exercise swap requests
    for (const keyword of urgentKeywords.exerciseSwap) {
      if (lowerMessage.includes(keyword)) {
        detectedKeywords.push(keyword);
        reason = 'Cliente solicitou troca de exercício';
      }
    }

    // Check human support requests
    for (const keyword of urgentKeywords.humanSupport) {
      if (lowerMessage.includes(keyword)) {
        detectedKeywords.push(keyword);
        reason = 'Cliente solicitou atendimento humano direto';
      }
    }

    // Check general urgent keywords
    for (const keyword of urgentKeywords.urgent) {
      if (lowerMessage.includes(keyword)) {
        detectedKeywords.push(keyword);
        if (!reason) reason = 'Mensagem contém indicação de urgência';
      }
    }

    return {
      isUrgent: detectedKeywords.length > 0,
      keywords: [...new Set(detectedKeywords)],
      reason
    };
  };

  const createSupportAlert = async (message: string, isUrgent: boolean, keywords: string[], reason: string) => {
    try {
      if (isUrgent) {
        // Get session for authenticated request
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          console.error("No active session for urgent alert");
          return;
        }

        // Send urgent alert via edge function with user's auth token
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-urgent-support-alert`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              conversaId: conversaId,
              messagePreview: message.substring(0, 200),
              keywordsDetected: keywords,
              urgencyReason: reason
            }),
          }
        );
      } else {
        // Normal alert - just insert to database
        await supabase
          .from("admin_support_alerts")
          .insert({
            user_id: user?.id,
            conversa_id: conversaId,
            alert_type: "new_message",
            urgency_level: "normal",
            message_preview: message.substring(0, 200),
            keywords_detected: keywords.length > 0 ? keywords : null
          });
      }
    } catch (error) {
      console.error("Error creating support alert:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { role: "user", content: input };
    const messageContent = input;
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    // Detect urgency in user message
    const { isUrgent, keywords, reason } = detectUrgency(messageContent);

    try {
      // Buscar protocolos frescos no momento do envio para garantir dados atualizados
      const { data: protocolosFrescos } = await supabase
        .from("protocolos")
        .select("tipo, ativo")
        .eq("user_id", user.id)
        .eq("ativo", true);
      
      const protocolosAtuais = {
        temTreino: protocolosFrescos?.some(p => p.tipo === "treino") || false,
        temNutricao: protocolosFrescos?.some(p => p.tipo === "nutricao") || false,
        temMindset: protocolosFrescos?.some(p => p.tipo === "mindset") || false
      };
      
      console.log("[Suporte] Protocolos no envio:", protocolosAtuais);

      // SECURITY FIX: Use user's session token instead of publishable key
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            type: "mentor",
            userContext: {
              ...profile,
              protocolos: protocolosAtuais,
              checkin: checkinInfo,
              progresso: progressInfo,
              assinatura: subscriptionInfo
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar mensagem");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Não foi possível ler a resposta");

      // Add empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (updated[lastIndex]?.role === "assistant") {
                  updated[lastIndex] = { ...updated[lastIndex], content: assistantContent };
                }
                return updated;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Create alert after message is sent (with or without urgency)
      await createSupportAlert(messageContent, isUrgent, keywords, reason);

    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(error.message || "Erro ao enviar mensagem");
      // Remove empty assistant message on error
      setMessages(prev => prev.filter(m => m.content !== ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    
    try {
      // Delete conversation from database if exists
      if (conversaId) {
        await supabase
          .from("conversas")
          .delete()
          .eq("id", conversaId);
      }
      
      // Clear local state
      setMessages([]);
      setConversaId(null);
      toast.success("Histórico limpo com sucesso");
    } catch (error) {
      console.error("Error clearing history:", error);
      toast.error("Erro ao limpar histórico");
    }
  };

  return (
    <ClientLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold uppercase">Suporte</h1>
          <p className="text-muted-foreground">Tire suas dúvidas com nosso mentor ou consulte o FAQ</p>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat com Mentor
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card variant="glass" className="h-[600px] flex flex-col">
              <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg uppercase">
                  <Bot className="h-5 w-5 text-primary" />
                  Como posso te ajudar?
                </CardTitle>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div className="space-y-4">
                        <Bot className="h-16 w-16 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold uppercase">Olá, {profile?.full_name?.split(' ')[0] || 'Bem-vindo'}!</h3>
                          <p className="text-sm text-muted-foreground">
                            Sou seu mentor. Você pode me perguntar sobre seu treino, nutrição, mindset ou qualquer dúvida relacionada que estou aqui para te ajudar!
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex gap-3",
                            message.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                          {message.role === "assistant" && (
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2",
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          {message.role === "user" && (
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <UserIcon className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isLoading && messages[messages.length - 1]?.content === "" && (
                        <div className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="bg-muted rounded-2xl px-4 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!input.trim() || isLoading}
                      variant="fire"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Perguntas Frequentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
