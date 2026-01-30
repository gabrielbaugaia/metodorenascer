
# Plano: Correção de Visibilidade e Usabilidade de Botões

## Diagnóstico dos Problemas

Analisando as capturas de tela e o código, identifiquei 4 problemas específicos:

| Problema | Localização | Causa Técnica |
|----------|-------------|---------------|
| Botão "ENTRAR" transparente | Header.tsx (mobile menu) | `variant="outline"` + `border-primary/50` cria borda semi-transparente sem fundo sólido |
| Botão "Sair" invisível | Header.tsx + ClientSidebar.tsx | `variant="ghost"` não tem fundo, difícil visualização |
| Texto ilegível nos botões da Tour | OnboardingTour.tsx | `variant="fire"` com `text-primary-foreground` conflita com gradiente de fundo |
| Botão de Check-in fora da tela | WeeklyCheckinModal.tsx | Modal usa `fixed top-[50%]` sem scroll interno, conteúdo corta em telas pequenas |

---

## Correções Propostas

### 1. Botão "ENTRAR" no Header

**Arquivo:** `src/components/Header.tsx`

**Problema atual (linhas 81-83, 135-137):**
```tsx
// Desktop
<Button variant="outline" size="sm" asChild 
  className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">
  
// Mobile
<Button variant="outline" size="sm" asChild 
  className="w-full border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">
```

**Solução:**
- Trocar de `variant="outline"` para `variant="default"` (fundo laranja sólido)
- Remover classes de borda transparente
- Texto já será branco via `text-primary-foreground`

```tsx
// Desktop
<Button variant="default" size="sm" asChild>
  <Link to="/auth">ENTRAR</Link>
</Button>

// Mobile  
<Button variant="default" size="sm" asChild className="w-full">
  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>ENTRAR</Link>
</Button>
```

---

### 2. Botão "Sair" no Header e Sidebar

**Header.tsx (linhas 77-79, 130-131):**

**Problema atual:**
```tsx
// Desktop
<Button variant="ghost" onClick={handleLogout} size="sm">Sair</Button>

// Mobile
<Button variant="ghost" onClick={() => {...}} size="sm" className="w-full">Sair</Button>
```

**Solução:**
- Usar `variant="outline"` com borda visível
- Adicionar `border-border` para garantir visibilidade

```tsx
<Button 
  variant="outline" 
  onClick={handleLogout} 
  size="sm"
  className="border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground/50"
>
  Sair
</Button>
```

**ClientSidebar.tsx (linhas 189-196):**

**Problema atual:**
```tsx
<SidebarMenuButton
  onClick={handleLogout}
  tooltip="Sair"
  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
>
```

Este já está OK visualmente dentro da sidebar. Mantém styling atual.

---

### 3. Botões da Tour de Onboarding

**Arquivo:** `src/components/onboarding/OnboardingTour.tsx`

**Problema atual (linhas 196-212):**
```tsx
<Button
  variant="fire"
  onClick={handleNext}
  className="w-full sm:w-auto text-white font-semibold"
>
```

O `variant="fire"` usa `text-primary-foreground` que é branco, mas a classe `.btn-fire` aplica um gradiente que pode interferir. A imagem mostra o botão sem texto visível.

**Solução:**
- Forçar `!text-white` para garantir contraste
- Ou trocar para `variant="default"` que é mais confiável

```tsx
<Button
  variant="default"
  onClick={handleNext}
  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold"
>
```

---

### 4. Modal de Check-in Semanal (Botão fora do viewport)

**Arquivo:** `src/components/checkin/WeeklyCheckinModal.tsx`

**Problema atual:**
O `DialogContent` padrão usa posicionamento fixo centralizado sem overflow handling:
```tsx
fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]
```

Em telas pequenas, o conteúdo do modal (com muitos campos de formulário) ultrapassa a altura visível, e o botão "Registrar" fica abaixo da área visível.

**Solução:**
1. Adicionar `max-h-[90vh]` e `overflow-y-auto` ao DialogContent
2. Reorganizar para que o footer com botões fique sempre visível

```tsx
<DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
  <DialogHeader>...</DialogHeader>
  
  {/* Área scrollável */}
  <div className="flex-1 overflow-y-auto space-y-6 py-4">
    {/* campos do formulário */}
  </div>
  
  {/* Footer fixo no final do modal */}
  <div className="flex gap-3 pt-4 border-t border-border/50 shrink-0">
    <Button variant="outline">Cancelar</Button>
    <Button>Registrar</Button>
  </div>
</DialogContent>
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/Header.tsx` | Trocar variant dos botões ENTRAR e Sair |
| `src/components/onboarding/OnboardingTour.tsx` | Ajustar botões para garantir contraste de texto |
| `src/components/checkin/WeeklyCheckinModal.tsx` | Adicionar scroll interno e footer fixo |

---

## Resultado Esperado

| Componente | Antes | Depois |
|------------|-------|--------|
| ENTRAR (Header) | Borda transparente, sem fundo | Fundo laranja sólido, texto branco |
| Sair (Header) | Invisível (ghost) | Borda visível, texto legível |
| Tour buttons | Texto ilegível sobre gradiente | Texto branco claro sobre laranja |
| Check-in modal | Botão cortado fora da tela | Scroll interno, botões sempre visíveis |

---

## Detalhes Técnicos Adicionais

### CSS do variant="default" (já existente)
```tsx
default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
```
- `bg-primary` = laranja sólido (#FF4500)
- `text-primary-foreground` = branco (100%)
- Não há transparência

### Ajuste no WeeklyCheckinModal - Estrutura Final
```text
┌─────────────────────────────────────┐
│ DialogHeader (título + descrição)   │
├─────────────────────────────────────┤
│                                     │
│  [área scrollável]                  │
│  - Peso                             │
│  - Nível de energia                 │
│  - Aderência                        │ ← max-h com scroll
│  - Humor                            │
│  - Observações                      │
│                                     │
├─────────────────────────────────────┤
│ [Cancelar]  [Registrar]             │ ← sempre visível (shrink-0)
└─────────────────────────────────────┘
```

---

## Observações Finais

- Nenhuma alteração de rotas ou lógica de negócio
- Foco exclusivo em visibilidade e contraste
- Mantém identidade visual (laranja + preto)
- Garante acessibilidade em todos os dispositivos
- Todas as ações ficam acessíveis sem scroll oculto
