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
  User as UserIcon
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
  goals: string | null;
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
  const [conversaId, setConversaId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, weight, goals")
        .eq("id", user.id)
        .single();
      if (profileData) setProfile(profileData);
      
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

  // Save messages to database when they change
  useEffect(() => {
    const saveMessages = async () => {
      if (!user || messages.length === 0 || loadingHistory) return;
      
      try {
        if (conversaId) {
          await supabase
            .from("conversas")
            .update({ 
              mensagens: messages as any,
              updated_at: new Date().toISOString()
            })
            .eq("id", conversaId);
        } else {
          const { data } = await supabase
            .from("conversas")
            .insert({
              user_id: user.id,
              tipo: "suporte",
              mensagens: messages as any
            })
            .select("id")
            .single();
          
          if (data) setConversaId(data.id);
        }
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    };
    
    saveMessages();
  }, [messages, user, conversaId, loadingHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            type: "mentor",
            userContext: profile,
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

  return (
    <ClientLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold uppercase">Suporte</h1>
          <p className="text-muted-foreground">Tire suas dúvidas com nosso mentor IA ou consulte o FAQ</p>
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
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg uppercase">
                  <Bot className="h-5 w-5 text-primary" />
                  Como posso te ajudar?
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div className="space-y-4">
                        <Bot className="h-16 w-16 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold uppercase">Olá, Guerreiro!</h3>
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
