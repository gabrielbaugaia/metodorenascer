
# Corrigir Liberacao Admin + Criar Tutorial "Comece Aqui"

## Problema 1: Admin nao consegue liberar acesso permanente

### Causa raiz
O `AdminAccessControlSection` so permite "Override de Cortesia" com data de expiracao obrigatoria. O `computeEffective()` em `useEntitlements.ts` ignora overrides sem `override_expires_at`. Quando o admin quer liberar acesso total permanente (ate o Stripe assumir), nao tem como.

### Solucao
Adicionar um botao **"Liberar Acesso Completo"** que atualiza diretamente o campo `access_level` para `'full'` (sem usar override). Assim, o acesso persiste indefinidamente ate o Stripe sincronizar e atualizar naturalmente.

**Arquivo: `src/components/admin/AdminAccessControlSection.tsx`**
- Adicionar botao "Liberar Acesso Completo" que faz upsert em `entitlements` com `access_level: 'full'` e limpa `override_level` / `override_expires_at`
- Adicionar botao "Revogar para Trial" que reseta `access_level` para `'trial_limited'`
- Adicionar botao "Bloquear Acesso" que seta `access_level` para `'none'`
- Manter o override de cortesia existente para casos temporarios

O fluxo fica:
1. Admin clica "Liberar Acesso Completo"
2. `entitlements.access_level` = `'full'`, sem data de expiracao
3. Cliente tem acesso total imediato
4. Quando cliente paga via Stripe, a funcao `check-subscription` faz upsert normal e mantem `'full'`
5. Se cancelar no futuro, Stripe webhook atualiza para `'none'`

---

## Problema 2: Tutorial "Comece Aqui" para cada area

### Solucao
Criar um componente reutilizavel `PageTutorial` que exibe um guia passo-a-passo para cada pagina. O tutorial aparece como um botao discreto "Como usar" no canto da pagina que abre um dialog/drawer com instrucoes escritas organizadas por passos.

### Novo componente: `src/components/onboarding/PageTutorial.tsx`
- Recebe `pageId` como prop (ex: `'treino'`, `'nutricao'`, `'mindset'`, etc.)
- Botao "Como usar" com icone de HelpCircle
- Ao clicar, abre um Dialog com os passos do tutorial
- Cada passo tem titulo, descricao e icone
- Salva no localStorage quais tutoriais o usuario ja viu (para mostrar badge de "Novo" se nunca abriu)

### Conteudo dos tutoriais

**Treino:**
1. Como visualizar seus treinos do dia
2. Como iniciar uma sessao de treino
3. Como registrar carga em cada exercicio
4. Como funciona o intervalo de descanso
5. Como finalizar o treino e ver o resumo

**Nutricao:**
1. Como alternar entre dia de treino e dia de descanso
2. Como ver macros e calorias de cada refeicao
3. Como usar a lista de compras
4. Como baixar o PDF do plano

**Mindset:**
1. Como acessar as rotinas de manha e noite
2. Como marcar praticas concluidas
3. Como acompanhar seu progresso mental

**Suporte:**
1. Como enviar mensagem ao mentor
2. Como usar o chat de IA
3. Tempo de resposta esperado

**Evolucao:**
1. Como enviar fotos de progresso
2. Padrao correto das fotos (frente, lado, costas)
3. Como ver a analise de IA
4. Como acompanhar a timeline

**Renascer (Hoje):**
1. Como registrar dados do dia (sono, estresse, energia)
2. Como importar dados do celular via print do fitness
3. Como anexar ate 3 screenshots
4. Como ver o historico dos ultimos 7 dias
5. O que significa o Score Renascer

### Integracao nas paginas
Adicionar o componente `<PageTutorial pageId="treino" />` nas seguintes paginas:
- `src/pages/Treino.tsx`
- `src/pages/Nutricao.tsx`
- `src/pages/Mindset.tsx`
- `src/pages/Suporte.tsx`
- `src/pages/Evolucao.tsx`
- `src/pages/Renascer.tsx`

O botao sera posicionado no `actions` do `PageHeader` existente, ao lado de botoes como "Baixar PDF".

---

## Resumo dos arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/admin/AdminAccessControlSection.tsx` | Adicionar botoes de liberacao direta (full/trial/none) |
| `src/components/onboarding/PageTutorial.tsx` | Novo componente de tutorial reutilizavel |
| `src/pages/Treino.tsx` | Adicionar `<PageTutorial>` |
| `src/pages/Nutricao.tsx` | Adicionar `<PageTutorial>` |
| `src/pages/Mindset.tsx` | Adicionar `<PageTutorial>` |
| `src/pages/Suporte.tsx` | Adicionar `<PageTutorial>` |
| `src/pages/Evolucao.tsx` | Adicionar `<PageTutorial>` |
| `src/pages/Renascer.tsx` | Adicionar `<PageTutorial>` |

Nenhuma mudanca no banco de dados necessaria -- o campo `access_level` na tabela `entitlements` ja aceita o valor `'full'`.
