import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlogPostRenderer } from "@/components/blog/BlogPostRenderer";
import { LeadCaptureForm } from "@/components/blog/LeadCaptureForm";
import { ContentBlock } from "@/components/blog/RichTextEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: ContentBlock[];
  cover_image_url: string | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  enable_lead_capture: boolean;
  lead_capture_title: string | null;
  lead_capture_description: string | null;
  views_count: number;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (post) {
      // Update page title and meta for SEO
      document.title = post.meta_title || post.title;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.meta_description || post.excerpt || '');
      }

      // Increment view count
      incrementViews(post.id);
    }
  }, [post]);

  const fetchPost = async (postSlug: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', postSlug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      
      // Parse content as ContentBlock array
      const parsedPost = {
        ...data,
        content: (data.content as unknown as ContentBlock[]) || []
      };
      
      setPost(parsedPost);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (postId: string) => {
    await supabase
      .from('blog_posts')
      .update({ views_count: (post?.views_count || 0) + 1 })
      .eq('id', postId);
  };

  const handleDocumentClick = (url: string, fileName: string) => {
    if (post?.enable_lead_capture) {
      setPendingDocument({ url, name: fileName });
      setShowLeadForm(true);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || '',
          url
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  const estimateReadTime = () => {
    if (!post) return '1 min';
    const textContent = post.content
      .filter(b => b.type === 'paragraph' || b.type.startsWith('heading'))
      .map(b => b.content || '')
      .join(' ');
    const words = textContent.split(' ').length;
    return Math.max(1, Math.ceil(words / 200)) + ' min de leitura';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-12 w-3/4 mt-8" />
          <Skeleton className="h-6 w-1/2 mt-4" />
          <div className="space-y-4 mt-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Artigo não encontrado</h1>
          <p className="text-muted-foreground mb-8">
            O artigo que você está procurando não existe ou foi removido.
          </p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero / Cover Image */}
      {post.cover_image_url && (
        <div className="relative h-[50vh] min-h-[400px] mt-16">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}

      <article className={`container mx-auto px-4 ${post.cover_image_url ? '-mt-32 relative z-10' : 'pt-24'}`}>
        <div className="max-w-3xl mx-auto">
          {/* Back Link */}
          <Link 
            to="/blog" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Blog
          </Link>

          {/* Title & Meta */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {estimateReadTime()}
              </span>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Compartilhar
              </Button>
            </div>
          </header>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div className="bg-card rounded-xl p-6 md:p-8 shadow-sm border border-border">
            <BlogPostRenderer 
              blocks={post.content} 
              onDocumentClick={handleDocumentClick}
            />
          </div>

          {/* Lead Capture Form */}
          {post.enable_lead_capture && (
            <div className="mt-12">
              <LeadCaptureForm
                postId={post.id}
                title={post.lead_capture_title || "Receba mais conteúdos exclusivos"}
                description={post.lead_capture_description || "Cadastre-se para receber novidades e materiais exclusivos."}
                documentUrl={pendingDocument?.url}
                documentName={pendingDocument?.name}
              />
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-12 p-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Pronto para sua transformação?
            </h3>
            <p className="text-muted-foreground mb-6">
              Conheça o Método Renascer e comece sua jornada de evolução física e mental.
            </p>
            <Link to="/#preco">
              <Button size="lg" className="px-8">
                Conhecer o Método
              </Button>
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
