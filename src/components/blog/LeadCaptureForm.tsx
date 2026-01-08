import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, Gift } from "lucide-react";

interface LeadCaptureFormProps {
  postId: string;
  title: string;
  description: string;
  documentUrl?: string;
  documentName?: string;
}

export function LeadCaptureForm({ 
  postId, 
  title, 
  description, 
  documentUrl,
  documentName 
}: LeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast.error("Preencha nome e email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('blog_leads')
        .insert({
          post_id: postId,
          name,
          email,
          phone: phone || null,
          document_downloaded: documentName || null
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Cadastro realizado com sucesso!");

      // Auto-download document if available
      if (documentUrl) {
        window.open(documentUrl, '_blank');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Obrigado!</h3>
          <p className="text-muted-foreground">
            {documentUrl 
              ? "Seu download começou automaticamente. Verifique seus downloads."
              : "Em breve entraremos em contato."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          {documentUrl && <Download className="h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name">Nome *</Label>
            <Input
              id="lead-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lead-email">Email *</Label>
            <Input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lead-phone">WhatsApp (opcional)</Label>
            <Input
              id="lead-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                {documentUrl ? "Baixar Agora" : "Quero Receber"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
