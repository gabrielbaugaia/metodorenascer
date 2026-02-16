
# Ajuste de Robustez no Fluxo /connect

## Resumo

Corrigir duplo-sync causado pelo React StrictMode, melhorar `getToken()` para usar a sessao real do Supabase, e atualizar o checklist da documentacao admin.

---

## Arquivos a Modificar

### 1. `src/pages/connect/ConnectSync.tsx`

Problemas atuais:
- `getToken()` e chamado 2x (uma no useEffect, outra dentro de `runSync`)
- Sem guard contra dupla execucao do StrictMode
- Botao "Sincronizar novamente" chama `runSync()` sem token

Correcoes:
- Adicionar `useRef` (`hasRunRef`) para impedir dupla execucao no mount
- Guardar token em `useState` ao montar
- `runSync(token: string)` recebe token como argumento, sem chamar `getToken()` internamente
- useEffect busca token 1 unica vez, valida, guarda no state, e chama `runSync(token)`
- Botao "Sincronizar novamente" busca token fresco via `getToken()`, valida, e chama `runSync(token)`
- Botao "Voltar ao Dashboard" ja esta correto (mantido)

### 2. `src/services/authStore.ts`

Problema atual:
- `getToken()` busca de localStorage/Preferences mas nao do Supabase Auth — pode estar dessincronizado

Correcao:
- Reimplementar `getToken()` para usar `supabase.auth.getSession()` como fonte primaria
- Se houver sessao ativa, retorna `session.access_token`
- Se nao, tenta fallback do Preferences/localStorage (para contexto nativo sem Supabase client)
- Se nenhum, retorna `null`
- Manter `saveToken()`, `clearToken()`, `saveLastSync()`, `getLastSync()` inalterados

### 3. `src/pages/admin/AdminConectorMobileDocs.tsx`

Atualizar o checklist (Secao 7) para refletir itens concluidos:
- Fase 1: marcar como pre-checked os itens ja feitos (Criar projeto Capacitor, Implementar tela Login, Integrar Supabase Auth, Salvar JWT)
- Fase 3: marcar "Implementar POST health-sync" e "Implementar funcao montar payload" como concluidos
- Fase 4: marcar todos como concluidos (Tela status, Botao sincronizar, Mostrar ultima sync)
- Fase 2 (HealthKit): manter todos pendentes

Implementacao: alterar o estado inicial de `checked` para incluir as chaves pre-marcadas.

---

## Detalhes Tecnicos

### ConnectSync.tsx — Codigo refatorado

```typescript
const hasRunRef = useRef(false);
const [token, setToken] = useState<string | null>(null);

const runSync = async (syncToken: string) => {
  setState("syncing");
  setErrorMsg("");
  try {
    await syncHealthData(syncToken);
    setState("success");
  } catch (err: any) {
    setState("error");
    setErrorMsg(err?.message || "Erro desconhecido");
  }
};

useEffect(() => {
  if (hasRunRef.current) return;
  hasRunRef.current = true;
  (async () => {
    const t = await getToken();
    if (!t) { navigate("/connect/login", { replace: true }); return; }
    setToken(t);
    runSync(t);
  })();
}, []);

// Botao "Sincronizar novamente":
const handleRetry = async () => {
  const t = await getToken();
  if (!t) { navigate("/connect/login", { replace: true }); return; }
  setToken(t);
  runSync(t);
};
```

### authStore.ts — getToken melhorado

```typescript
import { supabase } from "@/integrations/supabase/client";

export async function getToken(): Promise<string | null> {
  // Fonte primaria: sessao Supabase ativa
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch {}
  // Fallback: Preferences/localStorage (contexto nativo)
  if (isNative()) {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  }
  return localStorage.getItem(TOKEN_KEY);
}
```

---

## O que NAO sera alterado

- Nenhuma outra pagina ou componente
- Edge functions permanecem inalteradas
- Banco de dados nao sera modificado
- Rotas /connect/login e /connect/dashboard permanecem como estao
