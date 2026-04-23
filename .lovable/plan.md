

## Tirar admin da tela "Acesso Expirado"

### Diagnóstico

Confirmei no banco: `baugabriel@icloud.com` é **admin** (`user_roles.role = 'admin'`), assinatura `active`, sem bloqueio. Mas a página `/acesso-bloqueado` é **pública e não tem guard** — qualquer um que cair lá (cache, link antigo, redirect residual de outra sessão) vê a tela de bloqueio, mesmo sendo admin.

Ao recarregar o navegador no celular, o último estado de URL fica em `/acesso-bloqueado` e a tela aparece de novo, porque nada redireciona o admin pra fora.

### Correção (`src/pages/AcessoBloqueado.tsx`)

Adicionar uma verificação no topo do componente:

1. Importar `useEffect`, `useAdminCheck`, `useAuth`.
2. No `useEffect`, assim que `isAdmin === true` → `navigate("/admin", { replace: true })`.
3. Enquanto `authLoading || adminLoading`, mostrar um loader leve em vez do card de bloqueio (evita o "flash" da tela vermelha).
4. Se não-admin e não-logado, comportamento atual permanece igual.

Isso garante que:
- Admin que cair em `/acesso-bloqueado` por qualquer motivo (link antigo, cache, refresh) é mandado pra `/admin` instantaneamente.
- Aluno legítimo bloqueado continua vendo a tela como antes.

### Bônus opcional (mesmo arquivo)

Como o admin sempre será redirecionado, o `replace: true` no `navigate` evita que o botão "voltar" do navegador traga ele pra essa tela de novo.

### Arquivos editados

- `src/pages/AcessoBloqueado.tsx` — adicionar guard de admin no topo

**Sem mudanças em:** roteador, `SubscriptionGuard`, `AdminGuard`, banco, RLS. Nenhum risco de afetar o fluxo de bloqueio dos alunos reais.

