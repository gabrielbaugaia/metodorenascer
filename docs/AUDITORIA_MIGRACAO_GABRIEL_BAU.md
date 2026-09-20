# Auditoria de migração Renascer → Gabriel Baú

Domínio público oficial: https://app.gabrielbau.com.br
Data da execução: setembro/2026. Nada foi publicado em produção.

## 1. Origem canônica centralizada

| Item | Status |
| --- | --- |
| `src/lib/appConfig.ts` (PUBLIC_APP_URL, BRAND_NAME, BRAND_FULL_NAME, absoluteUrl) | Corrigido e testado (build) |
| `supabase/functions/_shared/appConfig.ts` (mesmos valores + remetente de e-mail) | Corrigido, revisado estaticamente |
| CORS das funções de backend com a origem oficial como principal | Corrigido, revisado estaticamente |
| Metadados do `index.html` (title, canonical, og:url, og:site_name, twitter) | Corrigido e testado |
| Service worker com novo nome de cache (`gb-consultoria-cache-v8`) | Corrigido, revisado estaticamente |
| Links de convite, indicação, anamnese externa, blog e SEO | Corrigido, revisado estaticamente |
| E-mails transacionais e prompts de IA com "Consultoria Gabriel Baú" | Corrigido, revisado estaticamente |

## 2. Erros encontrados e corrigidos

1. **10 botões levavam a `/area-cliente`, rota inexistente** → agora vão para `/dashboard`.
2. **Todas as telas internas do painel administrativo caíam no Dashboard.** Causa: a verificação de administrador concluía com "não é admin" antes da sessão carregar, disparando `/acesso-bloqueado` → `/admin`. Corrigido em `src/hooks/useAdminCheck.ts` (respeita o carregamento da sessão). Verificado no navegador: 20 rotas administrativas abrem direto e por refresh.
3. **Página 404 em inglês e genérica** → reescrita em português, mostra o endereço acessado e oferece "Ir para Hoje" e "Entrar".
4. **Erro HTTP 406 repetido na tela Hoje** (consulta de check-in semanal usando `single()` sem registro) → trocado por `maybeSingle()`.
5. **Grafia da marca inconsistente** ("GabrielBau Treinador", "Metodo GabrielBau", "GabrielBau Connect") → padronizado para "Consultoria Gabriel Baú" e "Gabriel Baú Connect".

## 3. Rotas efetivamente exercitadas no navegador

- Sem sessão: `/`, `/auth`, `/entrar`, `/blog`, `/convite?ref=...`, `/redefinir-senha`, rota inexistente; rotas protegidas (`/dashboard`, `/treino`, `/nutricao`, `/evolucao`, `/renascer`, `/admin`, ...) redirecionam corretamente para `/auth`.
- Com sessão de administrador: 20 rotas `/admin/*` + `/mqo`, todas carregando, sem erros de console e sem requisições com falha.
- 404 útil confirmado em rota inexistente.
- Testes feitos em viewport de celular (390px) e desktop (1280px).

## 4. Não testado / bloqueado

- **Telas do aluno** (Hoje, Treino, Nutrição, Evolução, Aeróbico, Receitas, Mindset, Suporte, Perfil): a conta de teste disponível é de administrador e é redirecionada para o painel. Verificação apenas estática. Precisa de uma conta de aluno autorizada.
- **Checkout, portal do cliente, webhooks e envio de e-mails**: revisados estaticamente. Nenhuma cobrança, mensagem ou alteração de assinatura foi executada.
- **Configurações de autenticação do backend** (Site URL e lista de endereços de retorno) não são editáveis pelas ferramentas disponíveis — precisam ser conferidas para incluir `https://app.gabrielbau.com.br`.
- **Redirecionamentos dos domínios antigos** (`renascerapp.com.br`, `metodo.renascerapp.com.br`, `metodorenascer.lovable.app`) preservando caminho e parâmetros: depende do painel de domínios/DNS, pendente.
- **Sitemap** não existe no projeto e o `robots.txt` não referencia nenhum.

## 5. Resíduos legados mantidos de propósito

| Resíduo | Motivo |
| --- | --- |
| Remetente de e-mail `@renascerapp.com.br` | É o único domínio de envio verificado. Trocar exige validar `gabrielbau.com.br` no provedor de e-mail. |
| ID do app mobile `com.renascer.connect` | Alterar quebra atualizações do app já publicado nas lojas. |
| Chaves locais `renascer_*`, nomes de pasta/arquivo `renascer*`, `GabrielBauScore` | Identificadores internos; renomear invalidaria dados já salvos no aparelho sem ganho visível. |
| Rota `/renascer` | Mantida como endereço antigo em uso; a tela oficial é `/dashboard`. |

## 6. Evidência de verificação

- `npm run build`: sucesso.
- Checagem de tipos (`tsgo --noEmit`): sem erros.
- Scripts de navegação com Playwright em `/tmp/browser/gb/` (rotas públicas, rotas protegidas sem sessão, rotas administrativas autenticadas).
