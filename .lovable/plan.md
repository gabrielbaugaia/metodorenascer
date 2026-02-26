Dados do Apple Fitness -- Input Manual + Print de Tela

## O que sera feito

Expandir o formulario de registro diario para que o cliente possa informar os dados que ve no app Fitness da Apple (passos, calorias, minutos de exercicio, horas em pe, distancia) e tambem enviar um **print de tela** como comprovante. Isso permite ao admin e ao sistema usar esses dados para gerar analises mesmo sem o wearable conectado.

## Mudancas

### 1. Banco de dados -- nova migration

Adicionar colunas na tabela `manual_day_logs`:


| Coluna                  | Tipo         | Default |
| ----------------------- | ------------ | ------- |
| steps                   | integer      | null    |
| active_calories         | integer      | null    |
| exercise_minutes        | integer      | null    |
| standing_hours          | integer      | null    |
| distance_km             | numeric(5,2) | null    |
| fitness_screenshot_path | text         | null    |


Tambem sincronizar `steps` e `active_calories` na tabela `health_daily` (que ja tem essas colunas).

### 2. Upload de screenshot -- Storage

Usar o bucket existente `body-photos` (ou criar um novo `fitness-screenshots`). O print sera salvo em `fitness-screenshots/{userId}/{date}.{ext}`. As RLS policies do storage precisam permitir que o proprio usuario faca upload.

### 3. Formulario expandido -- `ManualInput.tsx`

Adicionar uma secao colapsavel **"Dados do Apple Fitness / Relogio"** abaixo dos campos existentes (sono, estresse, energia, treino):

- **Passos** -- input numerico
- **Calorias Ativas** -- input numerico
- **Minutos de Exercicio** -- input numerico
- **Horas em Pe** -- input numerico
- **Distancia (km)** -- input numerico com step 0.1
- **Print da tela do Fitness** -- botao de upload com preview da imagem

A secao sera opcional (campos nao preenchidos ficam null). Isso nao quebra o fluxo rapido de 30 segundos para quem nao tem esses dados.

### 4. Salvamento

Ao clicar "Salvar meu dia", os novos campos sao incluidos no upsert de `manual_day_logs`. Os campos `steps` e `active_calories` tambem sao espelhados na tabela `health_daily` (como ja e feito com `sleep_minutes`).

### 5. Visualizacao no historico

O componente `RecentLogsHistory` podera exibir icones extras (passos, calorias) quando esses dados existirem, mas isso e uma melhoria incremental e nao bloqueia o lancamento.

## Detalhes Tecnicos

### Arquivos modificados


| Arquivo                                   | Mudanca                                                          |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Migration SQL                             | Adicionar 6 colunas em `manual_day_logs` + policy de storage     |
| `src/components/renascer/ManualInput.tsx` | Expandir formulario com campos de fitness + upload de screenshot |
| `src/integrations/supabase/types.ts`      | Auto-atualizado apos migration                                   |


### Fluxo do upload de screenshot

```text
1. Cliente tira print no iPhone
2. Clica "Enviar print" no formulario
3. Seleciona imagem da galeria
4. Preview aparece no formulario
5. Ao clicar "Salvar meu dia", imagem sobe para Storage
6. Path salvo em manual_day_logs.fitness_screenshot_path
7. Admin pode ver o print na pagina de detalhes do cliente
```

### Experiencia do usuario

O formulario continua rapido para quem so quer registrar sono/estresse/energia. Os campos de fitness ficam em uma secao expansivel com titulo "Dados do Fitness (opcional)" -- o cliente so abre se quiser preencher. O upload de print e um botao com icone de camera, simples e direto.

&nbsp;

observação: do Android também se

For o sistema do cliente poder anexar do Android tbm 