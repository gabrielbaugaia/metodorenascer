import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl text-gradient">METODO RENASCER</span>
          </div>
          
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
            <a href="#metodologia" className="hover:text-foreground transition-colors">Metodologia</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link>
          </nav>
          
          <p className="text-sm text-muted-foreground">
            2024 Metodo Renascer. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
