

# Finalizar Camada Web/TypeScript — iOS + Android Health Bridge

## Objetivo

Criar a bridge completa para Android Health Connect, refatorar o fluxo de sincronizacao para detectar plataforma automaticamente (iOS/Android/Web), e atualizar a UI para refletir o provider correto.

---

## Arquivos a Criar

### 1. `src/services/platform.ts`
Utilitario centralizado de deteccao de plataforma. Substitui todas as funcoes `isNative()` espalhadas.

```text
- Exporta: platform ('ios' | 'android' | 'web')
- Exporta: isNative (boolean)
- Usa Capacitor.getPlatform() quando disponivel
- Fallback para 'web' quando Capacitor nao existe
```

### 2. `src/services/healthConnect.ts`
Bridge TypeScript para o plugin nativo Android Health Connect. Mesma estrutura do `healthkit.ts`.

```text
- registerPlugin('HealthConnectPlugin')
- Interface HealthConnectPluginInterface com:
  - isAvailable()
  - requestPermissions()
  - getTodayMetrics()
  - getWorkoutsLast24h()
- Funcoes publicas:
  - healthConnectIsAvailable()
  - requestHealthConnectPermissions()
  - healthConnectGetTodayMetrics() (com cache 30s)
  - healthConnectGetWorkoutsLast24h()
- Mock fallback identico ao do healthkit.ts para quando plugin nativo nao estiver disponivel
- source retornada: 'google' ou 'health_connect'
```

---

## Arquivos a Modificar

### 3. `src/services/healthkit.ts`
Tornar exclusivo para iOS. Remover a funcao `isNative()` local e usar `platform.ts`.

Mudancas:
- Importar `platform` de `./platform`
- Substituir `isNative()` por `platform === 'ios'` no `getPlugin()`
- Manter todas as funcoes publicas intactas (sao usadas como fallback pelo healthSync)
- Manter mocks para backward compatibility

### 4. `src/services/healthSync.ts`
Refatorar para selecionar provider por plataforma automaticamente.

Mudancas:
- Importar `platform` de `./platform`
- Importar funcoes do `healthConnect.ts`
- Logica:

```text
se platform === 'ios':
  usar healthkitGetTodayMetrics / healthkitGetWorkoutsLast24h
  source = 'apple'

se platform === 'android':
  usar healthConnectGetTodayMetrics / healthConnectGetWorkoutsLast24h
  source = 'google'

se platform === 'web':
  usar mock fallback (manter comportamento atual)
  source = 'mock'
```

- Atualizar tipo SyncResult.source para incluir `'google' | 'mock'`
- Mensagens de sucesso adaptadas por plataforma

### 5. `src/services/authStore.ts`
Substituir `isNative()` local pela importacao de `platform.ts`.

Mudanca minima: trocar `function isNative()` por `import { isNative } from './platform'` e remover a funcao local.

### 6. `src/pages/connect/ConnectDashboard.tsx`
Adaptar UI para mostrar provider correto por plataforma.

Mudancas:
- Importar `platform` de `@/services/platform`
- Se `platform === 'ios'`: mostrar "Apple Health" (comportamento atual)
- Se `platform === 'android'`: mostrar "Health Connect" com icone Android, textos e labels adaptados
- Se `platform === 'web'`: mostrar ambas opcoes como informativas
- Importar `healthConnectIsAvailable` e `requestHealthConnectPermissions` do `healthConnect.ts`
- No `useEffect` de init: chamar o provider correto baseado na plataforma
- Renomear `HealthPermissionCard` para aceitar prop `providerName` e `providerIcon`

### 7. `src/components/renascer/WearableModal.tsx`
Adaptar conteudo baseado na plataforma.

Mudancas:
- Importar `platform, isNative` de `@/services/platform`
- Se `isNative`:
  - Mostrar apenas o provider da plataforma atual (nao "em breve")
  - Texto: "Toque em Sincronizar para conectar seu [Apple Health / Health Connect]"
  - Remover frase "Funcionalidade em desenvolvimento"
- Se web:
  - Manter comportamento atual (informativo sobre ambas plataformas)
  - Manter texto "Baixe o Conector Renascer..."

---

## Resumo de Arquivos

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/services/platform.ts` | Criar | Deteccao centralizada de plataforma |
| `src/services/healthConnect.ts` | Criar | Bridge TypeScript para Android Health Connect |
| `src/services/healthkit.ts` | Modificar | Tornar exclusivo iOS, usar platform.ts |
| `src/services/healthSync.ts` | Modificar | Selecao automatica de provider por plataforma |
| `src/services/authStore.ts` | Modificar | Usar platform.ts centralizado |
| `src/pages/connect/ConnectDashboard.tsx` | Modificar | UI adaptativa por plataforma |
| `src/components/renascer/WearableModal.tsx` | Modificar | Conteudo dinamico nativo vs web |

---

## Detalhes Tecnicos

### Contrato do HealthConnectPlugin (Android nativo - Kotlin)

A bridge TypeScript define a interface que o plugin nativo Kotlin deve implementar. Os metodos sao identicos ao HealthKitPlugin:

```text
HealthConnectPluginInterface {
  isAvailable(): Promise<{ available: boolean }>
  requestPermissions(): Promise<{ granted: boolean }>
  getTodayMetrics(): Promise<TodayMetrics>
  getWorkoutsLast24h(): Promise<{ workouts: HealthConnectWorkout[] }>
}
```

O plugin nativo Kotlin (HealthConnectPlugin.kt) NAO faz parte deste sprint — ele precisa ser criado manualmente no Android Studio. A bridge TypeScript esta preparada para funcionar com mock quando o plugin nativo nao estiver presente.

### Fluxo de dados por plataforma

```text
iOS:
  ConnectDashboard -> healthkit.ts -> HealthKitPlugin (Swift) -> Apple HealthKit -> healthSync.ts -> Supabase

Android:
  ConnectDashboard -> healthConnect.ts -> HealthConnectPlugin (Kotlin) -> Health Connect -> healthSync.ts -> Supabase

Web:
  ConnectDashboard -> healthSync.ts -> mock data -> Supabase
```

### Backward Compatibility

- Nenhuma rota alterada
- Nenhuma tabela do banco modificada
- O backend (health-sync edge function) ja aceita ambos os sources ('apple', 'google')
- Mocks continuam funcionando identicamente na web

