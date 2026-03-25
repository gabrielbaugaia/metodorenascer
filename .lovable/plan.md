

# Fix: OCR não extrai VFC e BPM ao despertar de apps de bem-estar

## Problema

O print enviado é de um app de wellness (tipo Athlytic) que mostra "BPM diário: 108", "BPM ao despertar: 99" e "VFC ao despertar: 18". O prompt da IA no `extract-fitness-data` não menciona esses termos em português, então a IA não consegue mapear corretamente:

- **BPM ao despertar** → deveria ser `resting_hr` (FC de repouso)
- **VFC ao despertar** → deveria ser `hrv_ms`
- **BPM diário** → deveria ser `avg_hr_bpm`

## Correção

### 1. Expandir o prompt do OCR com vocabulário de apps de wellness

No arquivo `supabase/functions/extract-fitness-data/index.ts`, atualizar o system prompt para incluir explicitamente os termos em português usados por apps como Athlytic, AutoSleep, e similares:

```
- BPM ao despertar / BPM ao acordar / Waking HR → resting_hr
- VFC ao despertar / VFC ao acordar / Waking HRV → hrv_ms  
- BPM diário / BPM médio / Avg HR / Daily HR → avg_hr_bpm
- Bem-estar score → ignorar (não é campo extraído)
```

Também adicionar na mensagem do user que apps de wellness (Athlytic, AutoSleep, Heart Analyzer) usam nomenclatura diferente.

### 2. Nenhuma mudança no frontend necessária

O `BatchFitnessUpload.tsx` já exibe e sincroniza `resting_hr`, `hrv_ms` e `avg_hr_bpm` corretamente. O `HealthDashboardTab.tsx` já mostra esses cards. O problema é exclusivamente na extração — a IA não reconhece os labels.

## Arquivo alterado

| Arquivo | Mudança |
|---|---|
| `supabase/functions/extract-fitness-data/index.ts` | Expandir prompt com termos PT-BR de apps wellness |

