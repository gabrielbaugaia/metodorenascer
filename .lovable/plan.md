

# Plano: Corrigir Hero Section V2

## Duas correções no `src/components/landing-v2/V2HeroSection.tsx`

### 1. Botão "Ver Como Funciona" (linha 60-65)
O texto ainda apresenta problemas de renderização no mobile por causa do `tracking` largo na fonte mono. Corrigir:
- Reduzir `tracking` para `tracking-[1px]` no mobile
- Garantir que não há nenhum caractere especial (seta, ícone)
- Usar `text-[10px]` fixo em ambos breakpoints para evitar sobreposição de caracteres

### 2. Badge "Sistema Ativo — Abril 2026" (linha 32-35)
Trocar o texto para **"Sistema Inteligente"** e remover o ponto pulsante (bolinha laranja animada) para ficar mais limpo:
- Linha 33: remover o `<span>` com bolinha pulsante
- Linha 34: trocar texto para `Sistema Inteligente`

Apenas 1 arquivo modificado: `src/components/landing-v2/V2HeroSection.tsx`

