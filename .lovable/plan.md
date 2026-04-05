

# Plano: Importar CSV granular do HeartWatch via ExcelDataImport

## Problema

O CSV do HeartWatch contém **~10.677 leituras individuais de BPM** (uma por medição ao longo do dia), não resumos diários. O importador atual (`ExcelDataImport`) espera 1 linha = 1 dia. Precisamos agregar automaticamente essas leituras em resumos diários.

## Estrutura do CSV

| Coluna | Significado |
|---|---|
| ISO | Timestamp completo |
| bpm | Valor da leitura |
| Bpm ao dormir | Flag "1" = leitura durante sono |
| Bpm sedentária | Flag "1" = leitura sedentária |
| Caminhando | Flag "1" = caminhando |
| Treino | Flag "1" = exercício |
| Tipo | "repouso", "elevado", "alto repouso" |

## Agregação por dia

Para cada data única, calcular:
- **avg_hr_bpm** = média de todos os bpm do dia
- **sleeping_hr** = média dos bpm onde "Bpm ao dormir" = 1
- **sedentary_hr** = média dos bpm onde "Bpm sedentária" = 1
- **resting_hr** = média dos bpm onde Tipo = "repouso"
- **min_hr** = mínimo bpm do dia
- **max_hr** = máximo bpm do dia

## Alterações

### 1. Expandir `ExcelDataImport.tsx`

- Detectar formato HeartWatch pelo header (presença de "ISO" + "bpm" + "Bpm ao dormir")
- Quando detectado, agregar as leituras por dia antes de montar as `ParsedRow[]`
- Adicionar os campos `sleeping_hr`, `sedentary_hr`, `min_hr`, `max_hr` à interface `ParsedRow`
- Incluir esses campos no upsert de `manual_day_logs` e `health_daily`
- Mostrar na tabela de review os novos campos relevantes

### 2. Expandir `COLUMN_MAP` para suportar também importações HeartWatch resumidas

- Adicionar mapeamentos: "bpm ao dormir" → sleeping_hr, "bpm sedentaria" → sedentary_hr, "min hr" → min_hr, "max hr" → max_hr

### 3. Local de anexo no app

O arquivo é anexado na mesma tela existente: **botão "Importar Excel"** na página Renascer ou na aba Dados do Corpo. Nenhum novo ponto de entrada é necessário.

## Arquivo modificado
- `src/components/renascer/ExcelDataImport.tsx`

## Resultado esperado
- Usuário anexa o CSV do HeartWatch
- Sistema detecta que são leituras granulares
- Agrega por dia (~95 dias de jan a abril)
- Mostra preview com avg BPM, FC ao dormir, FC sedentária, min/max
- Salva em `manual_day_logs` + `health_daily`
- Dashboard atualiza imediatamente

