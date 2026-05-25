import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Send, Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Contact {
  id: string;
  phone_e164: string;
  display_name: string | null;
  user_id: string | null;
  updated_at: string | null;
}

interface WAMessage {
  id: string;
  direction: "inbound" | "outbound";
  from_phone: string | null;
  to_phone: string | null;
  body: string | null;
  status: string | null;
  bot_generated?: boolean | null;
  message_type: string | null;
  created_at: string;
  payload_json: any;
}

interface ContactWithPreview extends Contact {
  last_body: string | null;
  last_at: string | null;
  last_direction: string | null;
  unread: boolean;
}

const READ_KEY = "wa_admin_read_v1";
const loadReadMap = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(READ_KEY) || "{}"); } catch { return {}; }
};
const saveReadMap = (m: Record<string, string>) => localStorage.setItem(READ_KEY, JSON.stringify(m));

export default function AdminWhatsApp() {
  const [contacts, setContacts] = useState<ContactWithPreview[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<WAMessage[]>([]);
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [readMap, setReadMap] = useState<Record<string, string>>(loadReadMap);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedContact = useMemo(
    () => contacts.find(c => c.phone_e164 === selectedPhone) || null,
    [contacts, selectedPhone]
  );

  // Load contacts + previews
  const loadContacts = async () => {
    const { data: contactsData, error } = await supabase
      .from("whatsapp_contacts")
      .select("id, phone_e164, display_name, user_id, updated_at")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(200);
    if (error) {
      toast.error("Erro ao carregar contatos: " + error.message);
      setLoadingContacts(false);
      return;
    }
    const list = contactsData || [];
    // Fetch latest message per contact (sequential but cheap for ~200)
    const map = loadReadMap();
    const enriched: ContactWithPreview[] = await Promise.all(
      list.map(async (c) => {
        const { data: last } = await supabase
          .from("whatsapp_messages")
          .select("body, created_at, direction")
          .or(`from_phone.eq.${c.phone_e164},to_phone.eq.${c.phone_e164}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const lastAt = last?.created_at || null;
        const readAt = map[c.phone_e164];
        const unread = !!(last && last.direction === "inbound" && (!readAt || new Date(lastAt!) > new Date(readAt)));
        return {
          ...c,
          last_body: last?.body || null,
          last_at: lastAt,
          last_direction: last?.direction || null,
          unread,
        };
      })
    );
    // Sort by last_at desc
    enriched.sort((a, b) => {
      const ta = a.last_at ? new Date(a.last_at).getTime() : 0;
      const tb = b.last_at ? new Date(b.last_at).getTime() : 0;
      return tb - ta;
    });
    setContacts(enriched);
    setLoadingContacts(false);
  };

  const loadMessages = async (phone: string) => {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .or(`from_phone.eq.${phone},to_phone.eq.${phone}`)
      .order("created_at", { ascending: true })
      .limit(500);
    setLoadingMessages(false);
    if (error) {
      toast.error("Erro ao carregar mensagens: " + error.message);
      return;
    }
    setMessages((data || []) as WAMessage[]);
    // Mark as read
    const now = new Date().toISOString();
    const next = { ...readMap, [phone]: now };
    setReadMap(next);
    saveReadMap(next);
    setContacts(prev => prev.map(c => c.phone_e164 === phone ? { ...c, unread: false } : c));
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  useEffect(() => { loadContacts(); }, []);

  useEffect(() => {
    if (selectedPhone) loadMessages(selectedPhone);
    else setMessages([]);
     
  }, [selectedPhone]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("wa-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_messages" },
        (payload) => {
          const m = payload.new as WAMessage;
          const involved = [m.from_phone, m.to_phone].filter(Boolean) as string[];
          // Update opened conversation
          if (selectedPhone && involved.includes(selectedPhone)) {
            setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
            requestAnimationFrame(() => {
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
            });
          }
          // Refresh contact list previews
          loadContacts();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
     
  }, [selectedPhone]);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(c =>
      c.phone_e164.toLowerCase().includes(q) ||
      (c.display_name || "").toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const handleSend = async () => {
    if (!selectedPhone || !reply.trim()) return;
    const body = reply.trim();
    if (body.length > 4096) {
      toast.error("Mensagem muito longa (máx 4096 caracteres)");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: { to: selectedPhone, type: "text", body },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReply("");
      toast.success("Mensagem enviada");
      // Realtime trará o INSERT outbound; fallback recarrega:
      setTimeout(() => loadMessages(selectedPhone), 600);
    } catch (e: any) {
      toast.error("Falha ao enviar: " + (e?.message || "erro desconhecido"));
    } finally {
      setSending(false);
    }
  };

  return (
    <ClientLayout>
      <div className="space-y-4 max-w-full">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">WhatsApp</h1>
        </div>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100vh-220px)] min-h-[500px]">
            {/* Lista de contatos */}
            <div
              className={`border-r border-border flex flex-col ${selectedPhone ? "hidden md:flex" : "flex"}`}
            >
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contato ou número..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {loadingContacts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground px-4">
                    Nenhuma conversa ainda. Quando alguém mandar mensagem para o número Business, aparecerá aqui.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredContacts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedPhone(c.phone_e164)}
                        className={`w-full text-left px-3 py-3 hover:bg-muted/50 transition-colors ${
                          selectedPhone === c.phone_e164 ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-foreground truncate">
                                {c.display_name || c.phone_e164}
                              </p>
                              {c.unread && (
                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {c.last_direction === "outbound" ? "Você: " : ""}
                              {c.last_body?.slice(0, 60) || "—"}
                            </p>
                          </div>
                          {c.last_at && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(c.last_at), { locale: ptBR, addSuffix: false })}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Conversa */}
            <div className={`flex flex-col ${selectedPhone ? "flex" : "hidden md:flex"}`}>
              {!selectedContact ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Selecione uma conversa
                </div>
              ) : (
                <>
                  <div className="p-3 border-b border-border flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedPhone(null)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">
                        {selectedContact.display_name || selectedContact.phone_e164}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedContact.phone_e164}
                        {selectedContact.user_id && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">aluno vinculado</Badge>
                        )}
                      </p>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-sm text-muted-foreground">
                        Sem mensagens ainda.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {messages.map((m) => {
                          const isOut = m.direction === "outbound";
                          const failed = m.status === "failed";
                          return (
                            <div
                              key={m.id}
                              className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm break-words ${
                                  isOut
                                    ? failed
                                      ? "bg-destructive/20 text-foreground"
                                      : "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{m.body || `[${m.message_type || "sem texto"}]`}</p>
                                <div className={`flex items-center gap-1 mt-1 text-[10px] opacity-70 ${isOut ? "justify-end" : ""}`}>
                                  {m.bot_generated && isOut && <span title="Resposta automática do bot">🤖</span>}
                                  {format(new Date(m.created_at), "HH:mm", { locale: ptBR })}
                                  {isOut && (failed
                                    ? <AlertCircle className="w-3 h-3" />
                                    : <CheckCircle2 className="w-3 h-3" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="p-3 border-t border-border">
                    <div className="flex gap-2 items-end">
                      <Textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Escreva uma resposta..."
                        className="resize-none min-h-[44px] max-h-32"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        disabled={sending}
                      />
                      <Button onClick={handleSend} disabled={sending || !reply.trim()} size="icon">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Janela de 24h: respostas livres só funcionam até 24h após a última mensagem do contato.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
}
