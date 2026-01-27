
# Plano: Correção do PDF de Treino + Configuração de Domínio Lovable

## Parte 1: Correção do PDF (Código)

### Problema Identificado
O arquivo `src/lib/generateProtocolPdf.ts` está mapeando campos errados:

| Linha | Código Atual | Campo no Banco |
|-------|--------------|----------------|
| 180 | `treino.day` | `treino.letra` |
| 180 | `treino.focus` | `treino.foco` |
| 202 | `treino.exercises` | `treino.exercicios` |
| 215 | `ex.name` (prioridade) | `ex.nome` |
| 216 | `ex.sets` (prioridade) | `ex.series` |
| 217 | `ex.reps` (prioridade) | `ex.repeticoes` |
| 218 | `ex.rest` (prioridade) | `ex.descanso` |
| 219 | `ex.tips` (prioridade) | `ex.dicas` |

### Correções Necessárias

**Linha 180** - Título do treino:
```javascript
// De:
`${treino.day} - ${treino.focus}${treino.duration ? ` (${treino.duration} min)` : ''}`

// Para:
`Treino ${treino.letra || treino.day || '?'} - ${treino.foco || treino.focus || ''}${treino.duration ? ` (${treino.duration} min)` : ''}`
```

**Linha 202** - Array de exercícios:
```javascript
// De:
const exercises = treino.exercises || [];

// Para:
const exercises = treino.exercicios || treino.exercises || [];
```

**Linhas 214-219** - Campos dos exercícios (inverter prioridade):
```javascript
const rowData = [
  (ex.nome || ex.name)?.substring(0, 25) || "-",        // nome primeiro
  String(ex.series || ex.sets || "-"),                   // series primeiro
  String(ex.repeticoes || ex.reps || "-"),               // repeticoes primeiro
  ex.descanso || ex.rest || "-",                         // descanso primeiro
  (ex.dicas || ex.tips)?.substring(0, 20) || "-"         // dicas primeiro
];
```

---

## Parte 2: Configuração do Domínio para Lovable

### Passo a Passo para Apontar o DNS

**1. Acesse o painel de DNS** do seu registrador (onde você registrou `renascerapp.com.br`)

**2. Configure os registros para o subdomínio `metodo`:**

| Tipo | Nome | Valor |
|------|------|-------|
| **A** | metodo | 185.158.133.1 |
| **A** | www.metodo | 185.158.133.1 |

> Ou se preferir CNAME (alguns registradores não permitem CNAME na raiz):
> - **CNAME** | metodo | metodorenascer.lovable.app

**3. Adicione o domínio no Lovable:**
- Vá em **Settings → Domains** no seu projeto
- Clique em **Connect Domain**
- Digite: `metodo.renascerapp.com.br`
- Siga as instruções (ele mostrará um registro TXT para verificação)

**4. Aguarde a propagação DNS** (geralmente minutos, máximo 72h)

**5. O SSL será provisionado automaticamente** pela Lovable

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/lib/generateProtocolPdf.ts` | Linhas 180, 202, 214-219 - Corrigir mapeamento de campos |

---

## Resultado Esperado

Após implementação:
- **PDF**: Mostrará "Treino A - Peito e Tríceps" com todos exercícios corretamente
- **Domínio**: `metodo.renascerapp.com.br` abrirá o app diretamente da Lovable, sem servidor intermediário
