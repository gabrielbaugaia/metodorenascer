

# Plano: Nova Landing Page de Vendas Isolada

## Resumo

Criar uma página de vendas independente em `/oferta`, completamente isolada do site principal, focada na conversão para o Plano Inicial (R$49,90/mês).

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Oferta.tsx` | **CRIAR** | Nova página de vendas completa e isolada |
| `src/App.tsx` | **EDITAR** | Adicionar import lazy e rota `/oferta` (2 linhas) |
| `src/hooks/usePageTracking.ts` | **EDITAR** | Adicionar tracking `"/oferta": "oferta_vendas"` (1 linha) |

---

## Estrutura da Nova Página

```text
+-------------------------------------------------------------+
| HEADER MINIMALISTA (proprio da pagina)                      |
| "Metodo Renascer"                                           |
+-------------------------------------------------------------+
| HERO                                                        |
| "PARE DE TENTAR SOZINHO."                                   |
| "COMECE HOJE COM ACOMPANHAMENTO REAL POR R$49,90."          |
| [CTA: Quero comecar agora por R$49,90]                      |
| Acesso imediato | Sem fidelidade | Cancele quando quiser    |
+-------------------------------------------------------------+
| PROBLEMA                                                    |
| "SE VOCE JA TENTOU VARIAS VEZES E DESISTIU..."              |
+-------------------------------------------------------------+
| O QUE ESTA INCLUIDO (5 itens com checkmarks)                |
+-------------------------------------------------------------+
| PARA QUEM E / PARA QUEM NAO E (duas colunas)                |
+-------------------------------------------------------------+
| COMO FUNCIONA (3 passos numerados)                          |
+-------------------------------------------------------------+
| CARD DE PRECO - R$49,90/mes + [CTA]                         |
+-------------------------------------------------------------+
| FAQ (5 perguntas em accordion)                              |
+-------------------------------------------------------------+
| CTA FINAL + urgencia                                        |
+-------------------------------------------------------------+
| FOOTER MINIMALISTA (proprio da pagina)                      |
| "Metodo Renascer 2025"                                      |
+-------------------------------------------------------------+
```

---

## Especificacoes Tecnicas

### Design
- Fundo preto solido (`bg-black`)
- Texto branco/cinza (`text-white` / `text-gray-400`)
- CTA laranja solido LOCAL (`bg-orange-500 hover:bg-orange-600 text-white`)
- Zero gradientes
- Mobile-first e responsivo
- Header e footer proprios (nao usa globais)

### Logica de Checkout
```typescript
const handleCheckout = async () => {
  const { data } = await supabase.functions.invoke("create-checkout", {
    body: { price_id: "price_1ScZqTCuFZvf5xFdZuOBMzpt" }
  });
  if (data?.url) window.location.href = data.url;
};
```

### Componentes Utilizados
- `Button` (com classes locais para cor)
- `Accordion` + `AccordionItem` + `AccordionTrigger` + `AccordionContent`
- `Check` e `X` (Lucide icons)

---

## Copy Aplicada (Exatamente como fornecida)

Toda a copy sera implementada palavra por palavra conforme o texto enviado, incluindo:
- Headlines em CAPS
- Listas de beneficios
- Secoes "Para quem e" / "Para quem nao e"
- 5 perguntas do FAQ
- CTA final com urgencia

---

## Garantias

- ZERO impacto na home atual
- ZERO alteracao em estilos globais
- ZERO modificacao em headers/footers existentes
- Pagina 100% isolada, pronta para subdominio

