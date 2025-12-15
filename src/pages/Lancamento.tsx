import { useState } from "react";
import { User, Phone, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/SEU_LINK_AQUI"; // TODO: Substituir pelo link real

export default function Lancamento() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || nome.trim().length < 2) {
      toast.error("Por favor, insira seu nome completo");
      return;
    }
    
    const phoneNumbers = telefone.replace(/\D/g, "");
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      toast.error("Por favor, insira um telefone válido");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Por favor, insira um e-mail válido");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate saving lead data (you can add Supabase integration here)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success("Redirecionando para o grupo VIP...");
    
    // Redirect to WhatsApp group
    window.location.href = WHATSAPP_GROUP_LINK;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 max-w-md">
        <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
          <span className="text-foreground">Não Busque Evolução</span>
          <br />
          <span className="text-primary">Busque Renascimento</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg mt-4">
          Junte-se ao grupo VIP e descubra a transformação que você merece
        </p>
        <div className="w-64 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6" />
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-center text-foreground mb-6">
          Acesse o Grupo VIP
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              Nome
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-background border-border h-12"
              maxLength={100}
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              Telefone
            </Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={handlePhoneChange}
              className="bg-background border-border h-12"
              maxLength={15}
            />
          </div>

          {/* E-mail */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border h-12"
              maxLength={255}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            {isSubmitting ? (
              "Carregando..."
            ) : (
              <>
                Entrar no Grupo VIP
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Você será redirecionado para o grupo VIP do WhatsApp
          </p>
        </form>
      </div>
    </div>
  );
}
