import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, ArrowRight, Flame, Search, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Footer } from "@/components/Footer";
import { Menu, X as CloseIcon } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useState as useMenuState } from "react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useMenuState(false);

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

  const featuredPosts = filteredPosts.slice(0, 3);
  const remainingPosts = filteredPosts.slice(3);

  return (
    <div className="min-h-screen bg-background">
      {/* Blog Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          {/* Top row: Logo + Navigation */}
          <div className="flex items-center justify-between h-16">
            <RouterLink to="/blog" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <span className="text-primary font-display text-xl uppercase tracking-wider">Blog</span>
            </RouterLink>

            {/* Desktop: Categories + Search + Nav */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Categories */}
              <div className="flex items-center gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 py-1.5 h-9 text-sm bg-muted/30 border-border focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Separator */}
              <div className="h-6 w-px bg-border" />

              {/* Navigation */}
              <nav className="flex items-center gap-4">
                <RouterLink to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Início
                </RouterLink>
                <RouterLink to="/#preco" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Planos
                </RouterLink>
              </nav>
            </div>

            {/* Tablet: Search + Nav */}
            <div className="hidden md:flex lg:hidden items-center gap-4">
              <div className="relative w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 py-1.5 h-9 text-sm bg-muted/30 border-border focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <nav className="flex items-center gap-4">
                <RouterLink to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Início
                </RouterLink>
                <RouterLink to="/#preco" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Planos
                </RouterLink>
              </nav>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden text-foreground"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Tablet: Categories row */}
          <div className="hidden md:flex lg:hidden items-center gap-2 pb-3 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 py-2 text-sm bg-muted/30 border-border focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setMobileMenuOpen(false); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Nav links */}
              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <RouterLink 
                  to="/" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Início
                </RouterLink>
                <RouterLink 
                  to="/#preco" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Planos
                </RouterLink>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20 md:h-24 lg:h-20" />

      {/* Featured Posts - First 3 */}
      <section className="pb-8 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredPosts.length === 0 ? (
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
            <div className="grid md:grid-cols-3 gap-6">
              {featuredPosts.map((post, index) => (
                <Link 
                  key={post.id} 
                  to={`/blog/${post.slug}`}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <article className="glass-card-hover overflow-hidden h-full flex flex-col">
                    {post.cover_image_url ? (
                      <div className="relative h-64 overflow-hidden">
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
                      <div className="relative h-64 flex items-center justify-center" style={{ background: 'var(--gradient-card)' }}>
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
          )}
        </div>
      </section>

      {/* Remaining Posts Grid */}
      {remainingPosts.length > 0 && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <p className="text-muted-foreground text-sm mb-6">
              +{remainingPosts.length} {remainingPosts.length === 1 ? 'artigo' : 'artigos'}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingPosts.map((post, index) => (
                <Link 
                  key={post.id} 
                  to={`/blog/${post.slug}`}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <article className="glass-card-hover overflow-hidden h-full flex flex-col">
                    {post.cover_image_url ? (
                      <div className="relative h-48 overflow-hidden">
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
                      <div className="relative h-48 flex items-center justify-center" style={{ background: 'var(--gradient-card)' }}>
                        <Flame className="w-12 h-12 text-primary/30" />
                        {post.category && (
                          <span className="absolute top-4 left-4 px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full">
                            {getCategoryLabel(post.category)}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-primary/70" />
                            {format(new Date(post.published_at), "d MMM yyyy", { locale: ptBR })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary/70" />
                          {estimateReadTime(post.excerpt)}
                        </span>
                      </div>
                      
                      <h2 className="font-display text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 flex-1">
                          {post.excerpt}
                        </p>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-border">
                        <span className="text-primary font-medium text-xs flex items-center gap-2 group-hover:gap-3 transition-all">
                          Ler artigo 
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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