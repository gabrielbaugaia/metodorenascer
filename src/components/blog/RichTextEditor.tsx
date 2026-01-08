import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Image,
  Youtube,
  FileDown,
  Type,
  Quote,
  Loader2,
  Sparkles,
  Wand2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'image' | 'youtube' | 'document' | 'list' | 'ordered-list' | 'quote';
  content?: string;
  url?: string;
  alt?: string;
  caption?: string;
  fileName?: string;
  items?: string[];
  style?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
}

interface RichTextEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  onRewriteSection?: (index: number) => void;
  rewritingSection?: number | null;
}

export function RichTextEditor({ blocks, onChange, onRewriteSection, rewritingSection }: RichTextEditorProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [generatingAiImage, setGeneratingAiImage] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [showAiImageInput, setShowAiImageInput] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addBlock = (type: ContentBlock['type'], extraProps?: Partial<ContentBlock>) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: '',
      ...extraProps
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    onChange(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(block => block.id !== id));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      onChange(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      onChange(newBlocks);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-assets')
        .getPublicUrl(filePath);

      addBlock('image', { url: publicUrl, alt: file.name });
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-assets')
        .getPublicUrl(filePath);

      addBlock('document', { url: publicUrl, fileName: file.name });
      toast.success("Documento enviado com sucesso!");
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleYoutubeAdd = () => {
    if (!youtubeUrl) return;
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;

    if (videoId) {
      addBlock('youtube', { url: `https://www.youtube.com/embed/${videoId}` });
      setYoutubeUrl("");
      setShowYoutubeInput(false);
      toast.success("Vídeo adicionado!");
    } else {
      toast.error("URL do YouTube inválida");
    }
  };

  const handleAiImageGenerate = async () => {
    if (!aiImagePrompt.trim()) {
      toast.error("Digite um tema para a imagem");
      return;
    }

    setGeneratingAiImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-image', {
        body: { prompt: aiImagePrompt }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        // If it's base64, upload to storage for permanent URL
        if (data.imageUrl.startsWith('data:')) {
          const response = await fetch(data.imageUrl);
          const blob = await response.blob();
          const fileName = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
          const filePath = `images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('blog-assets')
            .upload(filePath, blob, { contentType: 'image/png' });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('blog-assets')
            .getPublicUrl(filePath);

          addBlock('image', { url: publicUrl, alt: aiImagePrompt });
        } else {
          addBlock('image', { url: data.imageUrl, alt: aiImagePrompt });
        }
        
        toast.success("Imagem gerada com sucesso!");
        setAiImagePrompt("");
        setShowAiImageInput(false);
      }
    } catch (error) {
      console.error('Error generating AI image:', error);
      toast.error("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setGeneratingAiImage(false);
    }
  };

  const renderBlockEditor = (block: ContentBlock, index: number) => {
    const canRewrite = block.type !== 'image' && block.type !== 'youtube' && block.type !== 'document';
    const isRewriting = rewritingSection === index;

    return (
      <div key={block.id} className="relative group border border-border rounded-lg p-4 mb-3 bg-card">
        <div className="absolute -top-3 left-3 bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground">
          {block.type === 'paragraph' && 'Parágrafo'}
          {block.type === 'heading1' && 'Título H1'}
          {block.type === 'heading2' && 'Título H2'}
          {block.type === 'heading3' && 'Título H3'}
          {block.type === 'image' && 'Imagem'}
          {block.type === 'youtube' && 'Vídeo YouTube'}
          {block.type === 'document' && 'Documento'}
          {block.type === 'list' && 'Lista'}
          {block.type === 'ordered-list' && 'Lista Numerada'}
          {block.type === 'quote' && 'Citação'}
        </div>
        
        <div className="absolute -top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canRewrite && onRewriteSection && (
            <Button 
              variant="outline" 
              size="icon" 
              className="h-6 w-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 hover:from-purple-600/40 hover:to-pink-600/40"
              onClick={() => onRewriteSection(index)}
              disabled={isRewriting}
              title="Reescrever com IA"
            >
              {isRewriting ? (
                <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
              ) : (
                <Wand2 className="h-3 w-3 text-purple-500" />
              )}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => moveBlock(block.id, 'up')}
            disabled={index === 0}
          >
            ↑
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => moveBlock(block.id, 'down')}
            disabled={index === blocks.length - 1}
          >
            ↓
          </Button>
          <Button 
            variant="destructive" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => removeBlock(block.id)}
          >
            ×
          </Button>
        </div>

        <div className="mt-2">
          {(block.type === 'paragraph' || block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3' || block.type === 'quote') && (
            <Textarea
              value={block.content || ''}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder={block.type === 'quote' ? 'Digite a citação...' : 'Digite o texto...'}
              className={`min-h-[100px] ${block.type === 'heading1' ? 'text-2xl font-bold' : ''} ${block.type === 'heading2' ? 'text-xl font-semibold' : ''} ${block.type === 'heading3' ? 'text-lg font-medium' : ''} ${block.type === 'quote' ? 'italic border-l-4 border-primary pl-4' : ''}`}
            />
          )}

          {block.type === 'image' && (
            <div className="space-y-2">
              {block.url && (
                <img src={block.url} alt={block.alt || ''} className="max-h-64 rounded-lg object-cover" />
              )}
              <Input
                value={block.alt || ''}
                onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                placeholder="Texto alternativo (SEO)"
              />
              <Input
                value={block.caption || ''}
                onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                placeholder="Legenda da imagem"
              />
            </div>
          )}

          {block.type === 'youtube' && (
            <div className="aspect-video">
              <iframe
                src={block.url}
                className="w-full h-full rounded-lg"
                allowFullScreen
                title="YouTube video"
              />
            </div>
          )}

          {block.type === 'document' && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileDown className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{block.fileName}</p>
                <p className="text-sm text-muted-foreground">Documento para download</p>
              </div>
            </div>
          )}

          {(block.type === 'list' || block.type === 'ordered-list') && (
            <div className="space-y-2">
              {(block.items || ['']).map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground w-6">
                    {block.type === 'ordered-list' ? `${i + 1}.` : '•'}
                  </span>
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(block.items || [''])];
                      newItems[i] = e.target.value;
                      updateBlock(block.id, { items: newItems });
                    }}
                    placeholder="Item da lista"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newItems = (block.items || ['']).filter((_, idx) => idx !== i);
                      updateBlock(block.id, { items: newItems.length ? newItems : [''] });
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBlock(block.id, { items: [...(block.items || ['']), ''] })}
              >
                + Adicionar item
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
        <Button variant="outline" size="sm" onClick={() => addBlock('paragraph')}>
          <Type className="h-4 w-4 mr-1" /> Parágrafo
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('heading1')}>
          <Heading1 className="h-4 w-4 mr-1" /> H1
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('heading2')}>
          <Heading2 className="h-4 w-4 mr-1" /> H2
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('heading3')}>
          <Heading3 className="h-4 w-4 mr-1" /> H3
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('quote')}>
          <Quote className="h-4 w-4 mr-1" /> Citação
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('list', { items: [''] })}>
          <List className="h-4 w-4 mr-1" /> Lista
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('ordered-list', { items: [''] })}>
          <ListOrdered className="h-4 w-4 mr-1" /> Lista Num.
        </Button>
        
        <div className="h-6 w-px bg-border" />
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingImage}
        >
          {uploadingImage ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Image className="h-4 w-4 mr-1" />}
          Imagem
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setShowAiImageInput(!showAiImageInput);
            setShowYoutubeInput(false);
          }}
          disabled={generatingAiImage}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:opacity-90"
        >
          {generatingAiImage ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Gerar Imagem IA
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setShowYoutubeInput(!showYoutubeInput);
            setShowAiImageInput(false);
          }}
        >
          <Youtube className="h-4 w-4 mr-1" /> YouTube
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => docInputRef.current?.click()}
          disabled={uploadingDoc}
        >
          {uploadingDoc ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
          Documento
        </Button>
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={handleDocUpload}
          className="hidden"
        />
      </div>

      {/* AI Image Generation Input */}
      {showAiImageInput && (
        <div className="flex gap-2 p-3 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-lg border border-purple-500/30">
          <Input
            value={aiImagePrompt}
            onChange={(e) => setAiImagePrompt(e.target.value)}
            placeholder="Descreva a imagem: ex. pessoa feliz treinando, alimentação saudável..."
            disabled={generatingAiImage}
          />
          <Button 
            onClick={handleAiImageGenerate} 
            disabled={generatingAiImage}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
          >
            {generatingAiImage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar'}
          </Button>
          <Button variant="outline" onClick={() => setShowAiImageInput(false)} disabled={generatingAiImage}>
            Cancelar
          </Button>
        </div>
      )}

      {/* YouTube URL Input */}
      {showYoutubeInput && (
        <div className="flex gap-2">
          <Input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Cole a URL do YouTube aqui..."
          />
          <Button onClick={handleYoutubeAdd}>Adicionar</Button>
          <Button variant="outline" onClick={() => setShowYoutubeInput(false)}>Cancelar</Button>
        </div>
      )}

      {/* Content Blocks */}
      <div className="min-h-[300px]">
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">
              Use a barra de ferramentas acima para adicionar conteúdo
            </p>
          </div>
        ) : (
          blocks.map((block, index) => renderBlockEditor(block, index))
        )}
      </div>
    </div>
  );
}
