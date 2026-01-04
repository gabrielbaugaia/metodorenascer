import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Flame, Upload, X, Camera } from "lucide-react";

export default function Anamnese() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    // Dados Pessoais
    data_nascimento: "",
    weight: "",
    height: "",
    whatsapp: "",
    sexo: "",
    
    // Objetivos
    objetivo_principal: "",
    
    // Histórico de Treino
    ja_treinou_antes: "",
    local_treino: "",
    dias_disponiveis: "",
    
    // Condicionamento Físico
    nivel_condicionamento: "",
    pratica_aerobica: "",
    escada_sem_cansar: "",
    
    // Saúde
    condicoes_saude: "",
    injuries: "",
    toma_medicamentos: "",
    medicamentos_detalhes: "",
    
    // Hábitos Alimentares
    refeicoes_por_dia: "",
    bebe_agua_frequente: "",
    restricoes_alimentares: "",
    
    // Estilo de Vida
    qualidade_sono: "",
    nivel_estresse: "",
    consome_alcool: "",
    fuma: "",
    
    // Horários
    horario_treino: "",
    horario_acorda: "",
    horario_dorme: "",
    
    // Fotos
    foto_frente_url: "",
    foto_lado_url: "",
    foto_costas_url: "",
    
    // Observações
    observacoes_adicionais: "",
  });

  const [photoPreview, setPhotoPreview] = useState({
    frente: "",
    lado: "",
    costas: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Check if user already completed anamnese
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("anamnese_completa")
        .eq("id", user.id)
        .maybeSingle();
      
      if (data?.anamnese_completa) {
        navigate("/dashboard");
      }
    };
    
    checkProfile();
  }, [user, navigate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'frente' | 'lado' | 'costas') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setUploadingPhoto(type);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(prev => ({ ...prev, [type]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('body-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get signed URL (7 days expiry for security)
      const { data: urlData } = await supabase.storage
        .from('body-photos')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      const fieldName = `foto_${type}_url` as keyof typeof formData;
      setFormData(prev => ({ ...prev, [fieldName]: urlData?.signedUrl || '' }));
      
      toast.success(`Foto de ${type} enviada com sucesso!`);
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Erro ao enviar foto");
    } finally {
      setUploadingPhoto(null);
    }
  };

  const removePhoto = (type: 'frente' | 'lado' | 'costas') => {
    setPhotoPreview(prev => ({ ...prev, [type]: "" }));
    const fieldName = `foto_${type}_url` as keyof typeof formData;
    setFormData(prev => ({ ...prev, [fieldName]: "" }));
  };

  // Normalize nivel_condicionamento to match database constraint
  const normalizeNivelExperiencia = (nivel: string): string => {
    const map: Record<string, string> = {
      'Sedentário': 'iniciante',
      'Iniciante': 'iniciante',
      'Intermediário': 'intermediario',
      'Avançado': 'avancado',
    };
    return map[nivel] || 'iniciante';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    // Validate required fields
    if (!formData.data_nascimento || !formData.weight || !formData.height || 
        !formData.objetivo_principal || !formData.ja_treinou_antes || 
        !formData.dias_disponiveis || !formData.nivel_condicionamento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    
  try {
      const nivelExperienciaNormalizado = normalizeNivelExperiencia(formData.nivel_condicionamento);
      console.log("[ANAMNESE] Start submit for user", user.id);
      // Calculate age from birth date
      const birthDate = new Date(formData.data_nascimento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Combina lesões e detalhes de medicamentos em um campo de restrições médicas
      const restricoesMedicasCompletas = [
        formData.injuries,
        formData.toma_medicamentos === "sim" ? `Medicamentos: ${formData.medicamentos_detalhes}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      console.log("[ANAMNESE] Updating profile...");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          age,
          data_nascimento: formData.data_nascimento,
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          telefone: formData.whatsapp,
          sexo: formData.sexo,
          goals: formData.objetivo_principal,
          objetivo_principal: formData.objetivo_principal,
          ja_treinou_antes: formData.ja_treinou_antes === "sim",
          local_treino: formData.local_treino,
          availability: formData.dias_disponiveis,
          dias_disponiveis: formData.dias_disponiveis,
          nivel_experiencia: nivelExperienciaNormalizado,
          nivel_condicionamento: formData.nivel_condicionamento,
          pratica_aerobica: formData.pratica_aerobica === "sim",
          escada_sem_cansar: formData.escada_sem_cansar,
          condicoes_saude: formData.condicoes_saude,
          injuries: formData.injuries,
          restricoes_medicas: restricoesMedicasCompletas,
          toma_medicamentos: formData.toma_medicamentos === "sim",
          refeicoes_por_dia: formData.refeicoes_por_dia,
          bebe_agua_frequente: formData.bebe_agua_frequente === "sim",
          restricoes_alimentares: formData.restricoes_alimentares,
          qualidade_sono: formData.qualidade_sono,
          nivel_estresse: formData.nivel_estresse,
          consome_alcool: formData.consome_alcool,
          fuma: formData.fuma,
          foto_frente_url: formData.foto_frente_url,
          foto_lado_url: formData.foto_lado_url,
          foto_costas_url: formData.foto_costas_url,
          observacoes_adicionais: formData.observacoes_adicionais,
          anamnese_completa: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("[ANAMNESE] Profile update error", updateError);
        throw new Error("PROFILE_UPDATE_ERROR");
      }

      console.log("[ANAMNESE] Fetching subscription...");
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error("[ANAMNESE] Subscription fetch error", subError);
      }

      const planType = subscription?.plan_type || "mensal";
      console.log("[ANAMNESE] Using plan type", planType);

      console.log("[ANAMNESE] Fetching profile for protocol context...");
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[ANAMNESE] Profile fetch error", profileError);
      }

      const profileContext = profileRow || {
        id: user.id,
        age,
        data_nascimento: formData.data_nascimento,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        telefone: formData.whatsapp,
        sexo: formData.sexo,
        goals: formData.objetivo_principal,
        objetivo_principal: formData.objetivo_principal,
        ja_treinou_antes: formData.ja_treinou_antes === "sim",
        local_treino: formData.local_treino,
        availability: formData.dias_disponiveis,
        dias_disponiveis: formData.dias_disponiveis,
        nivel_experiencia: nivelExperienciaNormalizado,
        nivel_condicionamento: formData.nivel_condicionamento,
        pratica_aerobica: formData.pratica_aerobica === "sim",
        escada_sem_cansar: formData.escada_sem_cansar,
        condicoes_saude: formData.condicoes_saude,
        injuries: formData.injuries,
        restricoes_medicas: restricoesMedicasCompletas,
        toma_medicamentos: formData.toma_medicamentos === "sim",
        refeicoes_por_dia: formData.refeicoes_por_dia,
        bebe_agua_frequente: formData.bebe_agua_frequente === "sim",
        restricoes_alimentares: formData.restricoes_alimentares,
        qualidade_sono: formData.qualidade_sono,
        nivel_estresse: formData.nivel_estresse,
        consome_alcool: formData.consome_alcool,
        fuma: formData.fuma,
        foto_frente_url: formData.foto_frente_url,
        foto_lado_url: formData.foto_lado_url,
        foto_costas_url: formData.foto_costas_url,
        observacoes_adicionais: formData.observacoes_adicionais,
      };

      if (!profileRow) {
        console.warn("[ANAMNESE] No profile row found, using fallback context from form data");
      }

      console.log("[ANAMNESE] Invoking generate-protocol functions in parallel...");
      const tipos = ["treino", "nutricao", "mindset"] as const;
      
      // Deactivate all previous active protocols first
      await Promise.all(
        tipos.map(tipo => 
          supabase
            .from("protocolos")
            .update({ ativo: false })
            .eq("user_id", user.id)
            .eq("tipo", tipo)
        )
      );

      // Generate all protocols in parallel for faster completion
      const protocolResults = await Promise.all(
        tipos.map(async (tipo) => {
          console.log(`[ANAMNESE] Generating protocol`, { tipo });
          const { error: fnError } = await supabase.functions.invoke("generate-protocol", {
            body: {
              tipo,
              userId: user.id,
              userContext: profileContext,
            },
          });
          return { tipo, error: fnError };
        })
      );

      // Check for any errors
      const failedProtocol = protocolResults.find(r => r.error);
      if (failedProtocol) {
        console.error(`[ANAMNESE] generate-protocol error for ${failedProtocol.tipo}`, failedProtocol.error);
        throw new Error(`PROTOCOL_ERROR_${failedProtocol.tipo.toUpperCase()}`);
      }

      toast.success("Anamnese concluída e planos gerados com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving anamnese:", error);
      toast.error("Não foi possível salvar seus dados");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const PhotoUploadBox = ({ type, label }: { type: 'frente' | 'lado' | 'costas'; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        {photoPreview[type] ? (
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
            <img 
              src={photoPreview[type]} 
              alt={`Foto de ${type}`} 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(type)}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, type)}
              className="hidden"
              disabled={uploadingPhoto !== null}
            />
            {uploadingPhoto === type ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Clique para selecionar</span>
                <span className="text-xs text-muted-foreground mt-1">Máximo 10MB</span>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">MÉTODO RENASCER</span>
          </div>
          <h1 className="text-3xl font-bold uppercase mb-2">Complete sua Anamnese</h1>
          <p className="text-muted-foreground mb-4">
            Preencha os dados abaixo para personalizar seu programa
          </p>
          {/* Progress indicator */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-primary font-medium">
                {Object.values(formData).filter(v => v !== "").length} de {Object.keys(formData).length} campos preenchidos
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(Object.values(formData).filter(v => v !== "").length / Object.keys(formData).length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 70.5"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="Ex: 170"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <Select
                  value={formData.sexo}
                  onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="Ex: (11) 98765-4321"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Objetivos */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Objetivo Principal *</Label>
                <Select
                  value={formData.objetivo_principal}
                  onValueChange={(value) => setFormData({ ...formData, objetivo_principal: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="Ganho de massa muscular">Ganho de massa muscular</SelectItem>
                    <SelectItem value="Definição muscular">Definição muscular</SelectItem>
                    <SelectItem value="Melhora de condicionamento">Melhora de condicionamento</SelectItem>
                    <SelectItem value="Saúde e bem-estar">Saúde e bem-estar</SelectItem>
                    <SelectItem value="Reabilitação">Reabilitação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Treino */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Treino</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Já treinou antes? *</Label>
                <RadioGroup
                  value={formData.ja_treinou_antes}
                  onValueChange={(value) => setFormData({ ...formData, ja_treinou_antes: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="treinou-sim" />
                    <Label htmlFor="treinou-sim" className="font-normal">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="treinou-nao" />
                    <Label htmlFor="treinou-nao" className="font-normal">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Onde prefere treinar? *</Label>
                <Select
                  value={formData.local_treino}
                  onValueChange={(value) => setFormData({ ...formData, local_treino: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academia">Academia</SelectItem>
                    <SelectItem value="Casa">Casa</SelectItem>
                    <SelectItem value="Ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantos dias na semana pode treinar? *</Label>
                <Select
                  value={formData.dias_disponiveis}
                  onValueChange={(value) => setFormData({ ...formData, dias_disponiveis: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2x">2x por semana</SelectItem>
                    <SelectItem value="3x">3x por semana</SelectItem>
                    <SelectItem value="4x">4x por semana</SelectItem>
                    <SelectItem value="5x">5x por semana</SelectItem>
                    <SelectItem value="6x">6x por semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Condicionamento Físico */}
          <Card>
            <CardHeader>
              <CardTitle>Condicionamento Físico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nível de condicionamento atual *</Label>
                <Select
                  value={formData.nivel_condicionamento}
                  onValueChange={(value) => setFormData({ ...formData, nivel_condicionamento: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sedentário">Sedentário</SelectItem>
                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                    <SelectItem value="Intermediário">Intermediário</SelectItem>
                    <SelectItem value="Avançado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pratica atividade aeróbica?</Label>
                <RadioGroup
                  value={formData.pratica_aerobica}
                  onValueChange={(value) => setFormData({ ...formData, pratica_aerobica: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="aerobica-sim" />
                    <Label htmlFor="aerobica-sim" className="font-normal">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="aerobica-nao" />
                    <Label htmlFor="aerobica-nao" className="font-normal">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Consegue subir 3 lances de escada sem cansar?</Label>
                <RadioGroup
                  value={formData.escada_sem_cansar}
                  onValueChange={(value) => setFormData({ ...formData, escada_sem_cansar: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="escada-sim" />
                    <Label htmlFor="escada-sim" className="font-normal">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="escada-nao" />
                    <Label htmlFor="escada-nao" className="font-normal">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dificuldade" id="escada-dificuldade" />
                    <Label htmlFor="escada-dificuldade" className="font-normal">Com dificuldade</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Saúde */}
          <Card>
            <CardHeader>
              <CardTitle>Saúde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="condicoes_saude">Condições de saúde (se houver)</Label>
                <Input
                  id="condicoes_saude"
                  placeholder="Ex: Hipertensão, diabetes, etc."
                  value={formData.condicoes_saude}
                  onChange={(e) => setFormData({ ...formData, condicoes_saude: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="injuries">Limitações físicas ou lesões</Label>
                <Input
                  id="injuries"
                  placeholder="Ex: Dor no joelho, problema na coluna, etc."
                  value={formData.injuries}
                  onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                />
              </div>

          <div className="space-y-2">
            <Label>Toma medicamentos regularmente?</Label>
            <RadioGroup
              value={formData.toma_medicamentos}
              onValueChange={(value) => setFormData({ ...formData, toma_medicamentos: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="medicamentos-sim" />
                <Label htmlFor="medicamentos-sim" className="font-normal">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="medicamentos-nao" />
                <Label htmlFor="medicamentos-nao" className="font-normal">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.toma_medicamentos === "sim" && (
            <div className="space-y-2">
              <Label htmlFor="medicamentos_detalhes">Quais medicamentos e para que são utilizados?</Label>
              <Textarea
                id="medicamentos_detalhes"
                placeholder="Ex: Losartana 50mg (hipertensão) 1x ao dia, Metformina 850mg (diabetes) 2x ao dia"
                value={formData.medicamentos_detalhes}
                onChange={(e) => setFormData({ ...formData, medicamentos_detalhes: e.target.value })}
                rows={3}
              />
            </div>
          )}
            </CardContent>
          </Card>

          {/* Hábitos Alimentares */}
          <Card>
            <CardHeader>
              <CardTitle>Hábitos Alimentares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Quantas refeições faz por dia?</Label>
                <Select
                  value={formData.refeicoes_por_dia}
                  onValueChange={(value) => setFormData({ ...formData, refeicoes_por_dia: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1-2 refeições</SelectItem>
                    <SelectItem value="3">3 refeições</SelectItem>
                    <SelectItem value="4">4 refeições</SelectItem>
                    <SelectItem value="5">5 refeições</SelectItem>
                    <SelectItem value="6+">6 ou mais refeições</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bebe água frequentemente?</Label>
                <RadioGroup
                  value={formData.bebe_agua_frequente}
                  onValueChange={(value) => setFormData({ ...formData, bebe_agua_frequente: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="agua-sim" />
                    <Label htmlFor="agua-sim" className="font-normal">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="agua-nao" />
                    <Label htmlFor="agua-nao" className="font-normal">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restricoes_alimentares">Restrições alimentares</Label>
                <Input
                  id="restricoes_alimentares"
                  placeholder="Ex: Intolerância à lactose, vegetariano, etc."
                  value={formData.restricoes_alimentares}
                  onChange={(e) => setFormData({ ...formData, restricoes_alimentares: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Estilo de Vida */}
          <Card>
            <CardHeader>
              <CardTitle>Estilo de Vida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Qualidade do sono</Label>
                <Select
                  value={formData.qualidade_sono}
                  onValueChange={(value) => setFormData({ ...formData, qualidade_sono: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excelente">Excelente</SelectItem>
                    <SelectItem value="Boa">Boa</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Ruim">Ruim</SelectItem>
                    <SelectItem value="Péssima">Péssima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nível de estresse</Label>
                <Select
                  value={formData.nivel_estresse}
                  onValueChange={(value) => setFormData({ ...formData, nivel_estresse: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixo">Baixo</SelectItem>
                    <SelectItem value="Moderado">Moderado</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                    <SelectItem value="Muito alto">Muito alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Consome álcool?</Label>
                <RadioGroup
                  value={formData.consome_alcool}
                  onValueChange={(value) => setFormData({ ...formData, consome_alcool: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="alcool-nao" />
                    <Label htmlFor="alcool-nao" className="font-normal">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="raramente" id="alcool-raramente" />
                    <Label htmlFor="alcool-raramente" className="font-normal">Raramente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="socialmente" id="alcool-socialmente" />
                    <Label htmlFor="alcool-socialmente" className="font-normal">Socialmente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="frequentemente" id="alcool-frequentemente" />
                    <Label htmlFor="alcool-frequentemente" className="font-normal">Frequentemente</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Fuma?</Label>
                <RadioGroup
                  value={formData.fuma}
                  onValueChange={(value) => setFormData({ ...formData, fuma: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="fuma-nao" />
                    <Label htmlFor="fuma-nao" className="font-normal">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="raramente" id="fuma-raramente" />
                    <Label htmlFor="fuma-raramente" className="font-normal">Raramente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="fuma-sim" />
                    <Label htmlFor="fuma-sim" className="font-normal">Sim</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Horários */}
          <Card>
            <CardHeader>
              <CardTitle>Horários</CardTitle>
              <CardDescription>
                Informe seus horários para ajustar seu plano de dieta e treino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horario_treino">Horário preferido de treino</Label>
                  <Input
                    id="horario_treino"
                    type="time"
                    value={formData.horario_treino}
                    onChange={(e) => setFormData({ ...formData, horario_treino: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario_acorda">Que horas acorda?</Label>
                  <Input
                    id="horario_acorda"
                    type="time"
                    value={formData.horario_acorda}
                    onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario_dorme">Que horas dorme?</Label>
                  <Input
                    id="horario_dorme"
                    type="time"
                    value={formData.horario_dorme}
                    onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                Mudou de horário de treino? Avise seu mentor para ajuste da dieta!
              </p>
            </CardContent>
          </Card>

          {/* Fotos Corporais */}
          <Card>
            <CardHeader>
              <CardTitle>Fotos Corporais (Opcional)</CardTitle>
              <CardDescription>
                Envie 3 fotos para análise mais precisa dos seus planos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <PhotoUploadBox type="frente" label="Foto de Frente" />
                <PhotoUploadBox type="lado" label="Foto de Lado" />
                <PhotoUploadBox type="costas" label="Foto de Costas" />
              </div>
            </CardContent>
          </Card>

          {/* Observações Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle>Observações Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="observacoes_adicionais">
                  Algo mais que gostaria de compartilhar? (Opcional)
                </Label>
                <Textarea
                  id="observacoes_adicionais"
                  placeholder="Ex: Preferências específicas, objetivos detalhados, dúvidas..."
                  value={formData.observacoes_adicionais}
                  onChange={(e) => setFormData({ ...formData, observacoes_adicionais: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg" 
            variant="fire"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <div className="text-left">
                  <p className="font-medium">Gerando seus planos personalizados...</p>
                  <p className="text-xs opacity-80">Isso pode levar até 1 minuto</p>
                </div>
              </div>
            ) : (
              "Finalizar e Gerar Planos"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
