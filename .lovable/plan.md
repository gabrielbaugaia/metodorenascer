

# Correcao: Formulario Manual Inteligente no Renascer

## Problema

O componente `ManualInput` ja possui o formulario completo e funcional (sono, estresse, energia, treino/RPE), porem quando `dataMode === "auto"`, ele exibe apenas um placeholder "Conectar relogio (em breve)" em vez do formulario. Como nenhum wearable esta conectado (o servico e um stub que sempre retorna `connected: false`), o aluno fica sem como registrar dados e o Score permanece 0.

## Solucao

Duas mudancas simples:

---

### 1. ManualInput — Sempre mostrar formulario quando wearable nao esta conectado

**Arquivo:** `src/components/renascer/ManualInput.tsx`

Mudanca na logica da linha 80:
- Importar `useWearables` de `src/lib/wearables/useWearables.ts`
- Receber `userId` via props ou via `useAuth`
- Verificar `isConnected` do hook
- Se `dataMode === "auto"` **E** `isConnected === true`: mostrar placeholder atual (wearable ativo)
- Se `dataMode === "auto"` **E** `isConnected === false`: mostrar formulario manual (fallback)
- Se `dataMode === "manual"`: mostrar formulario manual (comportamento atual)

Na pratica, como o stub sempre retorna `false`, o formulario sera sempre exibido ate que wearables sejam implementados de verdade.

---

### 2. Remover "Dados do Corpo" do menu lateral

**Arquivo:** `src/components/layout/ClientSidebar.tsx`

- Remover a entrada `{ title: "Dados do Corpo", url: "/dados-corpo", icon: HeartPulse }` do array `clientMenuItems`
- A rota `/dados-corpo` continua existindo e acessivel via link "Painel Avancado" dentro do Renascer
- Isso elimina a confusao entre dois itens de menu que tratam do mesmo tema

---

## Arquivos

| Arquivo | Mudanca |
|---------|---------|
| `src/components/renascer/ManualInput.tsx` | Adicionar verificacao de wearable conectado; mostrar form como fallback |
| `src/components/layout/ClientSidebar.tsx` | Remover "Dados do Corpo" do menu |

## Sem alteracoes de banco

A tabela `manual_day_logs` e o pipeline de score ja funcionam corretamente. Nenhuma migracao necessaria.

