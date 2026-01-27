
# Plano: Corrigir Download de Anamnese e Campos Faltantes no Admin

## Problemas Identificados

### 1. Erro TIFF no PDF
O erro "addImage does not support files of type 'TIFF'" indica que uma foto foi enviada em formato TIFF, que nao e suportado pelo jsPDF.

**Solucao**: Detectar e ignorar fotos em formato incompativel, exibindo mensagem amigavel no PDF.

### 2. Campos de Horario Faltando
Os campos `horario_treino`, `horario_acorda` e `horario_dorme`:
- Existem no banco de dados
- Sao preenchidos na anamnese do cliente
- NAO aparecem no painel admin
- NAO sao incluidos no PDF

---

## Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|-----------|
| `src/pages/admin/AdminClienteDetalhes.tsx` | Adicionar campos de horario na interface Profile e na UI |
| `src/lib/generateAnamnesePdf.ts` | Adicionar campos de horario e tratar erro TIFF |

---

## Alteracoes Detalhadas

### 1. AdminClienteDetalhes.tsx

#### 1.1 Adicionar campos na interface Profile (linha 87)

```typescript
interface Profile {
  // ... campos existentes ...
  data_nascimento: string | null;
  // NOVOS CAMPOS:
  horario_treino: string | null;
  horario_acorda: string | null;
  horario_dorme: string | null;
}
```

#### 1.2 Adicionar secao "Rotina" no formulario (apos "Objetivo e Treino", antes de "Saude")

Nova Card com os campos:
- Horario de Treino (input type="time")
- Horario que Acorda (input type="time")
- Horario que Dorme (input type="time")

#### 1.3 Incluir campos no handleSave (linha 504-543)

Adicionar `horario_treino`, `horario_acorda`, `horario_dorme` no update do Supabase.

---

### 2. generateAnamnesePdf.ts

#### 2.1 Adicionar campos de horario na interface Profile

```typescript
interface Profile {
  // ... campos existentes ...
  horario_treino?: string | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
}
```

#### 2.2 Adicionar secao "Rotina" no PDF (apos "Historico de Treino")

```typescript
addSectionTitle("Rotina");
addField("Horario de Treino", profile.horario_treino);
addField("Horario que Acorda", profile.horario_acorda);
addField("Horario que Dorme", profile.horario_dorme);
```

#### 2.3 Tratar erro TIFF no loadImage

Modificar a funcao `loadImage` para detectar e rejeitar formatos nao suportados antes de tentar adicionar a imagem:

```typescript
const loadImage = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const contentType = response.headers.get("content-type") || "";
    
    // Rejeitar formatos nao suportados pelo jsPDF
    if (contentType.includes("tiff") || contentType.includes("image/tiff")) {
      console.warn("[PDF] Formato TIFF nao suportado, ignorando foto");
      return null;
    }
    
    const blob = await response.blob();
    // ... resto da logica
  } catch (error) {
    return null;
  }
};
```

---

## Resumo das Alteracoes

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `AdminClienteDetalhes.tsx` | Interface + UI + Save | Adicionar 3 campos de horario |
| `generateAnamnesePdf.ts` | Interface + Secao + Tratamento TIFF | Adicionar rotina e corrigir erro |

---

## Campos da Anamnese - Validacao de Obrigatoriedade

Os seguintes campos sao **obrigatorios** na anamnese (ja validados em `Anamnese.tsx`):
- Data de nascimento
- Peso
- Altura
- Objetivo principal
- Historico de treino (ja treinou antes)
- Dias disponiveis
- Nivel de condicionamento
- Horario de treino

Os seguintes campos sao **opcionais**:
- Fotos corporais (frente, lado, costas)
- Observacoes adicionais

Esta validacao ja esta correta no codigo atual.

---

## Resultado Esperado

Apos implementacao:
1. O admin vera os campos de horario (treino, acorda, dorme) na pagina de detalhes do cliente
2. O PDF da anamnese incluira a secao "Rotina" com os horarios
3. Fotos em formato TIFF serao ignoradas no PDF com mensagem amigavel
4. O PDF sera gerado mesmo quando houver fotos incompativeis
