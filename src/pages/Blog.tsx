import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, ArrowRight, Flame, Search, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  views_count: number;
  category: string | null;
}

const CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'treino', label: 'Treino' },
  { id: 'nutricao', label: 'Nutrição' },
  { id: 'mindset', label: 'Mindset' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'geral', label: 'Geral' }
];

const updateMetaTags = () => {
  const baseUrl = window.location.origin;
  const title = "Blog | Método Renascer - Transformação Física e Mental";
  const description = "Artigos sobre treino, nutrição e mindset para sua transformação. Conteúdo exclusivo do Método Renascer.";
  const image = `${baseUrl}/og-blog.png`;

  document.title = title;

  const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
  metaDesc.setAttribute('name', 'description');
  metaDesc.setAttribute('content', description);
  if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

  const ogTags: Record<string, string> = {
    'og:type': 'website',
    'og:url': `${baseUrl}/blog`,
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
    'twitter:url': `${baseUrl}/blog`,
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
  canonical.setAttribute('href', `${baseUrl}/blog`);
};

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  useEffect(() => {
    updateMetaTags();
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, selectedCategory]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image_url, published_at, views_count, category')
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

  const filterPosts = () => {
    let result = [...posts];

    // Filter by category
    if (selectedCategory !== 'todos') {
      result = result.filter(post => post.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post =>
        post.title.toLowerCase().includes(query) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(query))
      );
    }

    setFilteredPosts(result);
  };

  const estimateReadTime = (excerpt: string | null) => {
    const words = (excerpt || '').split(' ').length;
    return Math.max(1, Math.ceil(words / 200)) + ' min';
  };

  const getCategoryLabel = (categoryId: string | null) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat?.label || 'Geral';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-background">
          <div 
            className="absolute inset-0" 
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 40%, hsl(20 80% 6% / 0.6) 0%, transparent 70%)'
            }} 
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <span className="text-primary font-medium uppercase tracking-wider text-sm">Blog</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight leading-none mb-6 animate-fade-in">
              <span className="text-foreground">CONTEÚDO PARA SUA </span>
              <span className="text-primary">TRANSFORMAÇÃO</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in mb-10" style={{ animationDelay: "0.1s" }}>
              Artigos exclusivos sobre treino, nutrição e mindset para acelerar seus resultados
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-12 py-6 text-base bg-card border-border focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-6 px-4 border-b border-border">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card overflow-hidden">
                  <Skeleton className="h-56 w-full" />
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-3">
                {searchQuery || selectedCategory !== 'todos' ? 'Nenhum artigo encontrado' : 'Nenhum artigo ainda'}
              </h2>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== 'todos' 
                  ? 'Tente outra busca ou categoria' 
                  : 'Novos conteúdos em breve. Fique ligado!'}
              </p>
              {(searchQuery || selectedCategory !== 'todos') && (
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory("todos"); }}
                  className="mt-6 text-primary hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results count */}
              <p className="text-muted-foreground text-sm mb-8">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post, index) => (
                  <Link 
                    key={post.id} 
                    to={`/blog/${post.slug}`}
                    className="group animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <article className="glass-card-hover overflow-hidden h-full flex flex-col">
                      {post.cover_image_url ? (
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                          {post.category && (
                            <span className="absolute top-4 left-4 px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full">
                              {getCategoryLabel(post.category)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="relative h-56 flex items-center justify-center" style={{ background: 'var(--gradient-card)' }}>
                          <Flame className="w-16 h-16 text-primary/30" />
                          {post.category && (
                            <span className="absolute top-4 left-4 px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full">
                              {getCategoryLabel(post.category)}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          {post.published_at && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-primary/70" />
                              {format(new Date(post.published_at), "d MMM yyyy", { locale: ptBR })}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-primary/70" />
                            {estimateReadTime(post.excerpt)}
                          </span>
                        </div>
                        
                        <h2 className="font-display text-xl md:text-2xl text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">
                            {post.excerpt}
                          </p>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-border">
                          <span className="text-primary font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                            Ler artigo 
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center glass-card p-10 md:p-16">
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
              PRONTO PARA <span className="text-primary">RENASCER</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Transforme seu corpo e mente com acompanhamento personalizado, treino, nutrição e suporte 24h.
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
      </section>

      <Footer />
    </div>
  );
}