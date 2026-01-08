import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor, ContentBlock } from "@/components/blog/RichTextEditor";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Sparkles, 
  Loader2, 
  Image as ImageIcon,
  Send
} from "lucide-react";
import { toast } from "sonner";

const BLOG_CATEGORIES = [
  { id: 'treino', label: 'Treino' },
  { id: 'nutricao', label: 'Nutrição' },
  { id: 'mindset', label: 'Mindset' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'geral', label: 'Geral' }
];

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === 'novo';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<ContentBlock[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [category, setCategory] = useState("geral");
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [enableLeadCapture, setEnableLeadCapture] = useState(false);
  const [leadCaptureTitle, setLeadCaptureTitle] = useState("");
  const [leadCaptureDescription, setLeadCaptureDescription] = useState("");

  // AI generation options
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLanguage, setAiLanguage] = useState("conversacional");
  const [aiFormat, setAiFormat] = useState("artigo-completo");
  const [aiAudience, setAiAudience] = useState("iniciantes");

  useEffect(() => {
    if (!isNew && id) {
      fetchPost(id);
    }
  }, [id, isNew]);

  // Auto-generate slug from title
  useEffect(() => {
    if (isNew && title) {
      const generatedSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title, isNew]);

  const fetchPost = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt || '');
      setContent((data.content as unknown as ContentBlock[]) || []);
      setCoverImageUrl(data.cover_image_url || '');
      setCategory(data.category || 'geral');
      setStatus(data.status as 'draft' | 'published');
      setMetaTitle(data.meta_title || '');
      setMetaDescription(data.meta_description || '');
      setEnableLeadCapture(data.enable_lead_capture || false);
      setLeadCaptureTitle(data.lead_capture_title || '');
      setLeadCaptureDescription(data.lead_capture_description || '');
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error("Erro ao carregar artigo");
      navigate('/admin/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (!title || !slug) {
      toast.error("Título e slug são obrigatórios");
      return;
    }

    if (publish) {
      setPublishing(true);
    } else {
      setSaving(true);
    }

    try {
      const postData = {
        title,
        slug,
        excerpt,
        content: content as unknown as any,
        cover_image_url: coverImageUrl || null,
        category,
        status: publish ? 'published' : status,
        published_at: publish ? new Date().toISOString() : null,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        enable_lead_capture: enableLeadCapture,
        lead_capture_title: leadCaptureTitle || null,
        lead_capture_description: leadCaptureDescription || null,
        author_id: user?.id
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(postData)
          .select('id')
          .single();

        if (error) throw error;

        toast.success(publish ? "Artigo publicado!" : "Rascunho salvo!");
        
        if (publish) {
          // Notify subscribers
          notifySubscribers(data.id, title);
        }
        
        navigate(`/admin/blog/${data.id}`);
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', id);

        if (error) throw error;

        if (publish && status !== 'published') {
          notifySubscribers(id!, title);
        }

        setStatus(publish ? 'published' : status);
        toast.success(publish ? "Artigo publicado!" : "Alterações salvas!");
      }
    } catch (error: any) {
      console.error('Error saving post:', error);
      if (error.code === '23505') {
        toast.error("Já existe um artigo com esse slug");
      } else {
        toast.error("Erro ao salvar artigo");
      }
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const notifySubscribers = async (postId: string, postTitle: string) => {
    try {
      // Get all subscribed users with push notifications enabled
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('user_id');

      if (!subscriptions || subscriptions.length === 0) return;

      // Send push notification
      await supabase.functions.invoke('send-push', {
        body: {
          userIds: subscriptions.map(s => s.user_id),
          title: '📝 Novo artigo no Blog!',
          body: postTitle,
          url: `/blog/${slug}`
        }
      });
    } catch (error) {
      console.error('Error notifying subscribers:', error);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt) {
      toast.error("Digite um tema para gerar o artigo");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: { 
          prompt: aiPrompt,
          language: aiLanguage,
          format: aiFormat,
          audience: aiAudience
        }
      });

      if (error) throw error;

      if (data.title) setTitle(data.title);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.content) setContent(data.content);
      if (data.metaTitle) setMetaTitle(data.metaTitle);
      if (data.metaDescription) setMetaDescription(data.metaDescription);

      toast.success("Artigo gerado com sucesso!");
      setAiPrompt("");
    } catch (error) {
      console.error('Error generating post:', error);
      toast.error("Erro ao gerar artigo. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `covers/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-assets')
        .getPublicUrl(fileName);

      setCoverImageUrl(publicUrl);
      toast.success("Imagem de capa enviada!");
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? 'Novo Artigo' : 'Editar Artigo'}
            </h1>
            {status === 'published' && (
              <p className="text-sm text-green-500">✓ Publicado</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || publishing}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Rascunho
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving || publishing}>
            {publishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {status === 'published' ? 'Atualizar' : 'Publicar'}
          </Button>
        </div>
      </div>

      {/* AI Generation */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar com IA
          </CardTitle>
          <CardDescription>
            Personalize como o artigo será gerado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Options Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Linguagem</Label>
              <Select value={aiLanguage} onValueChange={setAiLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversacional">💬 Conversacional</SelectItem>
                  <SelectItem value="inspiracional">✨ Inspiracional</SelectItem>
                  <SelectItem value="educativo">📚 Educativo</SelectItem>
                  <SelectItem value="persuasivo">🎯 Persuasivo (vendas sutil)</SelectItem>
                  <SelectItem value="tecnico">🔬 Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={aiFormat} onValueChange={setAiFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artigo-completo">📄 Artigo Completo</SelectItem>
                  <SelectItem value="lista">📝 Lista/Dicas</SelectItem>
                  <SelectItem value="guia-passo">🗺️ Guia Passo a Passo</SelectItem>
                  <SelectItem value="historia">📖 História/Case</SelectItem>
                  <SelectItem value="faq">❓ Perguntas e Respostas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Público-Alvo</Label>
              <Select value={aiAudience} onValueChange={setAiAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciantes">🌱 Iniciantes (nunca treinaram)</SelectItem>
                  <SelectItem value="intermediarios">💪 Intermediários (treinam há pouco)</SelectItem>
                  <SelectItem value="avancados">🏆 Avançados (experientes)</SelectItem>
                  <SelectItem value="ocupados">⏰ Pessoas ocupadas</SelectItem>
                  <SelectItem value="mulheres">👩 Mulheres</SelectItem>
                  <SelectItem value="homens">👨 Homens</SelectItem>
                  <SelectItem value="acima-40">🎂 Acima de 40 anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topic Input */}
          <div className="flex gap-2">
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Tema do artigo: ex. Como começar a treinar em casa"
              className="flex-1"
            />
            <Button onClick={handleGenerateWithAI} disabled={generating} className="min-w-[120px]">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do artigo"
                  className="text-lg font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-do-artigo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Resumo</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Breve descrição do artigo para listagens e SEO"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOG_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Conteúdo do Artigo</Label>
                <RichTextEditor blocks={content} onChange={setContent} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Imagem de Capa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coverImageUrl ? (
                <div className="space-y-2">
                  <img 
                    src={coverImageUrl} 
                    alt="Cover" 
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setCoverImageUrl("")}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  {uploadingCover ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Clique para enviar</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || "Título para buscadores"}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{metaTitle.length}/60</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={excerpt || "Descrição para buscadores"}
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{metaDescription.length}/160</p>
              </div>
            </CardContent>
          </Card>

          {/* Lead Capture */}
          <Card>
            <CardHeader>
              <CardTitle>Captura de Leads</CardTitle>
              <CardDescription>
                Formulário para baixar documentos ou receber conteúdos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableLead">Ativar captura</Label>
                <Switch
                  id="enableLead"
                  checked={enableLeadCapture}
                  onCheckedChange={setEnableLeadCapture}
                />
              </div>

              {enableLeadCapture && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="leadTitle">Título do formulário</Label>
                    <Input
                      id="leadTitle"
                      value={leadCaptureTitle}
                      onChange={(e) => setLeadCaptureTitle(e.target.value)}
                      placeholder="Baixe nosso e-book gratuito"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leadDesc">Descrição</Label>
                    <Textarea
                      id="leadDesc"
                      value={leadCaptureDescription}
                      onChange={(e) => setLeadCaptureDescription(e.target.value)}
                      placeholder="Preencha seus dados para receber..."
                      rows={2}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </ClientLayout>
  );
}
