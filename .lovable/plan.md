

# Anexar Prints de Fitness no Historico + Suporte a 3 Imagens

## O que muda

Hoje o sistema so permite enviar 1 screenshot e apenas no momento do registro. O usuario quer:
1. Poder anexar prints a dias ja registrados no historico
2. Enviar ate 3 prints por dia (nem sempre todas as informacoes aparecem em uma tela so)
3. Filtro de data para escolher qual dia atualizar

## Mudancas no Banco de Dados

**Migracoes necessarias:**

Adicionar 2 colunas na tabela `manual_day_logs`:
- `fitness_screenshot_path_2` (text, nullable) -- segundo print
- `fitness_screenshot_path_3` (text, nullable) -- terceiro print

Isso mantém compatibilidade com o campo existente `fitness_screenshot_path` (que sera o print 1).

## Mudancas nos Arquivos

### 1. `src/components/renascer/RecentLogsHistory.tsx`

Transformar o dialog de detalhes de cada dia para incluir:
- Botao "Anexar print do Fitness" dentro do dialog de cada dia
- Input de arquivo que aceita ate 3 imagens
- Ao selecionar imagem, chamar a edge function `extract-fitness-data` para OCR
- Atualizar os campos de fitness do log existente (steps, active_calories, etc.) via upsert
- Upload das imagens no bucket `fitness-screenshots` com path `{user_id}/{date}_1.jpg`, `{user_id}/{date}_2.jpg`, `{user_id}/{date}_3.jpg`
- Exibir thumbnails dos prints ja anexados
- Mostrar indicador visual nos dias que tem prints anexados

### 2. `src/components/renascer/ManualInput.tsx`

Expandir o upload de screenshots para suportar ate 3 imagens:
- Trocar o estado `screenshotFile` / `screenshotPreview` (single) por arrays de ate 3 arquivos
- Mostrar grid de previews com botao de remover individual
- Cada imagem passa pelo OCR e os dados sao mesclados (somando ou pegando o maior valor)
- Upload salva nos 3 campos (`fitness_screenshot_path`, `_2`, `_3`)

### 3. `supabase/functions/extract-fitness-data/index.ts`

Nenhuma mudanca necessaria -- a funcao ja recebe uma imagem e retorna dados. Sera chamada uma vez por imagem.

## Fluxo do Usuario

```text
Historico "Ultimos 7 dias"
  |
  [Clica no dia "Qui 27/02"]
  |
  Dialog abre com detalhes do dia
  |
  [Botao: "Anexar print do Fitness" com icone de camera]
  |
  Seleciona ate 3 imagens
  |
  IA le cada imagem → preenche/atualiza campos fitness
  |
  [Botao "Salvar"] → atualiza manual_day_logs + health_daily
  |
  Toast: "Dados de fitness atualizados para Qui 27/02!"
```

## Detalhes Tecnicos

### Migracao SQL

```sql
ALTER TABLE public.manual_day_logs
  ADD COLUMN fitness_screenshot_path_2 text,
  ADD COLUMN fitness_screenshot_path_3 text;
```

### RecentLogsHistory - Adicoes principais

- Query expandida para incluir campos de fitness: `steps, active_calories, exercise_minutes, standing_hours, distance_km, fitness_screenshot_path, fitness_screenshot_path_2, fitness_screenshot_path_3`
- Estado local dentro do dialog para editar fitness data do dia selecionado
- Funcao de upload + OCR reutilizando a mesma logica do ManualInput
- Mutation de update que faz upsert no `manual_day_logs` e `health_daily`
- Indicador visual (icone de imagem) nos dias que ja tem screenshots

### ManualInput - Mudancas

- `screenshotFiles: File[]` (max 3) em vez de `screenshotFile: File | null`
- `screenshotPreviews: string[]` em vez de `screenshotPreview: string | null`
- Grid de thumbnails com botao X individual
- Botao "+" para adicionar mais prints (ate 3)
- Dados de OCR mesclados: cada imagem chama `extract-fitness-data`, valores nao-nulos substituem os anteriores (ultima imagem tem prioridade)

## Resumo

| Componente | Mudanca |
|------------|---------|
| Migracao SQL | 2 novas colunas para screenshots adicionais |
| `RecentLogsHistory.tsx` | Botao de anexar prints no dialog do historico; upload + OCR + save |
| `ManualInput.tsx` | Suporte a ate 3 screenshots em vez de 1 |
