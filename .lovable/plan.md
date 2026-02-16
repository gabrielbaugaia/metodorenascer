
# Ajuste do Capacitor e Guia do Renascer Connect

## Resumo

Corrigir a configuracao do Capacitor (arquivo inexistente), adicionar rota `/connect/sync` faltante, e atualizar a documentacao tecnica com guia de instalacao robusto e secao de deep links futuros.

---

## Arquivos a Criar

### 1. `capacitor.config.ts`

Arquivo de configuracao do Capacitor na raiz do projeto:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.renascer.connect',
  appName: 'Renascer Connect',
  webDir: 'dist',
  server: {
    url: 'https://a75d46a2-4cbd-4416-81c4-9988ca4fb176.lovableproject.com/connect/login?forceHideBadge=true',
    cleartext: false
  }
};

export default config;
```

### 2. `src/pages/connect/ConnectSync.tsx`

Pagina dedicada de sincronizacao (`/connect/sync`) que:
- Verifica token ao montar (redireciona para `/connect/login` se ausente)
- Executa sync automaticamente ao carregar
- Mostra progresso e resultado (sucesso/erro)
- Botoes: "Sincronizar novamente" e "Voltar ao Dashboard"
- Layout autonomo (sem sidebar)

---

## Arquivos a Modificar

### 3. `src/App.tsx`

- Adicionar lazy import para `ConnectSync`
- Adicionar rota: `/connect/sync`

### 4. `src/pages/admin/AdminConectorMobileDocs.tsx`

Atualizar a documentacao com:

**Substituir/adicionar na Secao 1 (Visao Geral) ou criar nova secao "Guia de Instalacao":**
- Guia de instalacao passo a passo completo (git pull, npm install, cap init, cap add ios, build, sync, open ios)
- Notas sobre requisitos (Mac + Xcode)
- Nota sobre server.url ser apenas para MVP
- Nota sobre HealthKit real exigir plugin nativo

**Adicionar nova secao "Deep Links (Futuro)":**
- Documentar `renascer://connect/success` e `renascer://connect/error`
- Marcar como "nao implementado — planejamento futuro"

**Atualizar Secao 10 (Status):**
- Alterar "Conector mobile" de "Pendente" para "MVP em validacao" (refletindo que a estrutura base esta pronta)

---

## Detalhes Tecnicos

### ConnectSync.tsx
- Usa `getToken()` do authStore para verificar autenticacao
- Chama `syncHealthData(token)` automaticamente no `useEffect`
- Mostra estados: "Sincronizando...", "Sucesso", "Erro" com mensagens claras
- Redireciona para `/connect/login` se token ausente
- Botao voltar navega para `/connect/dashboard`

### AdminConectorMobileDocs.tsx — Guia de Instalacao
O conteudo do novo accordion "Guia de Instalacao" incluira blocos de codigo com:

```text
# 1) Exportar para GitHub e clonar
git pull

# 2) Instalar dependencias
npm install

# 3) Instalar Capacitor CLI (dev)
npm install -D @capacitor/cli

# 4) Inicializar Capacitor (apenas uma vez)
npx cap init "Renascer Connect" "com.renascer.connect"

# 5) iOS
npm install @capacitor/ios
npx cap add ios

# 6) Build + Sync
npm run build
npx cap sync

# 7) Abrir no Xcode
npx cap open ios
```

Observacoes claras:
- Requer Mac + Xcode 15+ para iOS
- server.url aponta para WebView do Lovable apenas para MVP
- HealthKit real exigira plugin nativo (nao implementar agora)
- Rodar `npx cap sync` apos cada `git pull`

### AdminConectorMobileDocs.tsx — Deep Links
Novo accordion com documentacao de planejamento:
- `renascer://connect/success` — retorno apos sync bem-sucedido
- `renascer://connect/error` — retorno apos falha
- Status: nao implementado, apenas planejamento

---

## O que NAO sera feito

- Nenhuma funcionalidade existente sera alterada
- HealthKit nativo NAO sera implementado
- Nenhuma tabela de banco criada ou modificada
- Edge function health-sync permanece inalterada
