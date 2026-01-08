import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const updateMetaTags = () => {
  const baseUrl = window.location.origin;
  const title = "Blog do Método Renascer | Dicas de Transformação Física e Mental";
  const description = "Dicas, estratégias e conhecimento para sua transformação física e mental. Artigos sobre treino, nutrição e mindset.";
  const image = `${baseUrl}/og-blog.png`;

  document.title = title;

  // Meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);

  // Open Graph tags
  const ogTags = {
    'og:type': 'website',
    'og:url': `${baseUrl}/blog`,
    'og:title': title,
    'og:description': description,
    'og:image': image,
    'og:site_name': 'Método Renascer'
  };

  Object.entries(ogTags).forEach(([property, content]) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  });

  // Twitter Card tags
  const twitterTags = {
    'twitter:card': 'summary_large_image',
    'twitter:url': `${baseUrl}/blog`,
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image
  };

  Object.entries(twitterTags).forEach(([name, content]) => {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  });

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', `${baseUrl}/blog`);
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  views_count: number;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    updateMetaTags();
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image_url, published_at, views_count')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const estimateReadTime = (excerpt: string | null) => {
    const words = (excerpt || '').split(' ').length;
    return Math.max(1, Math.ceil(words / 200)) + ' min';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Blog do Método Renascer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Dicas, estratégias e conhecimento para sua transformação física e mental
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                Nenhum artigo publicado ainda. Volte em breve!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    {post.cover_image_url ? (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-6xl opacity-20">📝</span>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(post.published_at), "d 'de' MMM, yyyy", { locale: ptBR })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {estimateReadTime(post.excerpt)}
                        </span>
                      </div>
                      
                      <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      
                      {post.excerpt && (
                        <CardDescription className="line-clamp-3">
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <span className="text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Ler artigo <ArrowRight className="h-4 w-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
