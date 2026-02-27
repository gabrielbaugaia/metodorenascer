

# Leitura Automática de Print do Fitness com IA (OCR)

## Objetivo

Quando o cliente enviar um print da tela do Apple Fitness, Google Fit ou Samsung Health, a IA vai ler a imagem automaticamente e preencher os campos (Passos, Calorias Ativas, Minutos de Exercicio, Horas em Pe, Distancia) sem o cliente precisar digitar nada.

## Como vai funcionar

1. Cliente tira print da tela do app de fitness no celular (iPhone ou Android)
2. Clica em "Enviar print" no formulario
3. Sistema envia a imagem para uma funcao backend que usa IA com visao (Gemini) para extrair os dados
4. Os campos sao preenchidos automaticamente com os valores lidos
5. Cliente pode conferir, ajustar se necessario, e clicar "Salvar meu dia"

## Mudancas Tecnicas

### 1. Nova Edge Function: `extract-fitness-data`

Cria uma funcao backend que:
- Recebe a imagem em base64
- Envia para o Gemini (google/gemini-2.5-flash) via Lovable AI Gateway com um prompt especifico para extrair dados de fitness
- Usa tool calling para retornar JSON estruturado com: `steps`, `active_calories`, `exercise_minutes`, `standing_hours`, `distance_km`
- Retorna os valores extraidos para o frontend

Prompt da IA sera algo como: "Analise este print de tela de um app de fitness (Apple Fitness, Google Fit, Samsung Health, etc). Extraia os seguintes dados numericos visiveis na imagem: passos, calorias ativas, minutos de exercicio, horas em pe, distancia em km."

### 2. Atualizar `ManualInput.tsx`

- Ao selecionar uma imagem, alem de mostrar o preview, disparar automaticamente a chamada para `extract-fitness-data`
- Mostrar um estado de loading "Lendo dados..." enquanto a IA processa
- Quando a resposta chegar, preencher automaticamente os campos de passos, calorias, etc.
- Se algum campo nao for encontrado na imagem, deixar vazio para o cliente preencher manualmente
- Manter a possibilidade de editar qualquer campo apos o preenchimento automatico

### 3. Fluxo visual

```text
[Cliente envia print]
       |
  [Preview aparece]
       |
  [Loading: "Lendo dados da imagem..."]
       |
  [IA retorna valores]
       |
  [Campos preenchidos automaticamente]
       |
  [Cliente confere e clica "Salvar meu dia"]
```

## Arquivos

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/extract-fitness-data/index.ts` | Nova edge function com OCR via Gemini |
| `src/components/renascer/ManualInput.tsx` | Chamar a funcao apos upload e preencher campos |

## Sobre analise e graficos

Os dados extraidos (passos, calorias, etc.) ja sao salvos nas tabelas `manual_day_logs` e `health_daily`. O sistema ja possui:
- Score de prontidao (Renascer Score) que usa esses dados
- Sparkline de tendencia dos ultimos 7 dias
- Indicadores de corpo (Consistencia, Recuperacao, Capacidade)

Com os dados preenchidos via OCR, todos esses graficos e analises ja serao alimentados automaticamente. Nenhuma mudanca adicional e necessaria para gerar as analises -- basta ter os dados preenchidos.

