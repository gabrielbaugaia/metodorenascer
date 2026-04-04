# Plano: V2Header com menu mobile e no desktop igual V1

## O que muda

O V2Header atual não tem menu mobile (hamburger). O usuário quer o mesmo comportamento da V1: ícone hamburger no mobile que abre um menu com links de navegação + botão "ENTRAR" grande. O CTA principal no desktop também muda de "Ver Planos" para "ENTRAR" (link para `/auth`).

## Alterações em `src/components/landing-v2/V2Header.tsx`

1. **Importar** `Menu`, `X`, `Flame` do lucide-react + `useAuth` + `useNavigate`
2. **Estado** `isMobileMenuOpen` para controlar o menu
3. **Logo**: adicionar ícone Flame em círculo (igual V1) + texto "RENASCER"
4. **Desktop CTA**: trocar "Ver Planos" por "ENTRAR" apontando para `/auth`
5. **Desktop nav links**: manter Sistema, Planos, Prevenção, FAQ + adicionar "Blog" (`/blog`)
6. **Botão hamburger** visível apenas no mobile (`md:hidden`)
7. **Menu mobile expandido**: fundo escuro fullscreen com links:
  - Metodologia → `#v2-sistema`
  - Planos → `#v2-preco`
  - Blog → `/blog`
  - Botão "ENTRAR" largo (estilo primary, link para `/auth`)
8. Se usuário logado: mostrar "Dashboard" e "Sair" em vez de "ENTRAR"

Nenhum outro arquivo precisa ser alterado.