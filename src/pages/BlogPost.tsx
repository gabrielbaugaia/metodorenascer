import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlogPostRenderer } from "@/components/blog/BlogPostRenderer";
import { LeadCaptureForm } from "@/components/blog/LeadCaptureForm";
import { ContentBlock } from "@/components/blog/RichTextEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Share2, ArrowRight, Flame } from "lucide-react";
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
      updatePostMetaTags(post);
      incrementViews(post.id);
    }
  }, [post]);

  const updatePostMetaTags = (postData: BlogPostData) => {
    const baseUrl = window.location.origin;
    const title = postData.meta_title || `${postData.title} | Método Renascer`;
    const description = postData.meta_description || postData.excerpt || '';
    const image = postData.cover_image_url || `${baseUrl}/og-blog.png`;
    const url = `${baseUrl}/blog/${postData.slug}`;

    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', description);
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    const ogTags: Record<string, string> = {
      'og:type': 'article',
      'og:url': url,
      'og:title': title,
      'og:description': description,
      'og:image': image,
      'og:site_name': 'Método Renascer'
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    const twitterTags: Record<string, string> = {
      'twitter:card': 'summary_large_image',
      'twitter:url': url,
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  };

  const fetchPost = async (postSlug: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', postSlug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      
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
      } catch {
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
    return Math.max(1, Math.ceil(words / 200)) + ' min';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-12 w-3/4 mb-8" />
            <div className="flex gap-4 mb-8">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-80 w-full rounded-xl mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
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
        <div className="container mx-auto px-4 pt-32 pb-16 text-center">
          <div className="max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Flame className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-3xl text-foreground mb-4">Artigo não encontrado</h1>
            <p className="text-muted-foreground mb-8">
              O artigo que você procura não existe ou foi removido.
            </p>
            <Link to="/blog">
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Blog
              </Button>
            </Link>
          </div>
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
        <div className="relative h-[60vh] min-h-[450px] mt-16">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        </div>
      )}

      <article className={`container mx-auto px-4 ${post.cover_image_url ? '-mt-40 relative z-10' : 'pt-32'} pb-16`}>
        <div className="max-w-3xl mx-auto">
          {/* Back Link */}
          <Link 
            to="/blog" 
            className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Blog
          </Link>

          {/* Title & Meta */}
          <header className="mb-10">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-6">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-4 w-4 text-primary/70" />
                  {format(new Date(post.published_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm">
                <Clock className="h-4 w-4 text-primary/70" />
                {estimateReadTime()} de leitura
              </span>
              <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground hover:text-primary">
                <Share2 className="h-4 w-4 mr-1.5" />
                Compartilhar
              </Button>
            </div>
          </header>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed border-l-4 border-primary pl-6">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div className="glass-card p-8 md:p-12">
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
          <div className="mt-16 glass-card p-10 md:p-14 text-center border-primary/20">
            <h3 className="font-display text-3xl md:text-4xl text-foreground mb-4">
              PRONTO PARA <span className="text-primary">RENASCER</span>?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Conheça o Método Renascer e comece sua jornada de transformação física e mental.
            </p>
            <Link 
              to="/#preco"
              className="btn-fire inline-flex items-center gap-2 px-10 py-4 rounded-lg text-primary-foreground font-semibold uppercase tracking-wider"
            >
              <span className="relative z-10">Conhecer os Planos</span>
              <ArrowRight className="w-5 h-5 relative z-10" />
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}