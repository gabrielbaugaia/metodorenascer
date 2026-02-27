

# Alerta de Anamnese Pendente + Pre-preenchimento de Dados

## Problema Atual

1. **Formulario de anamnese nao carrega dados existentes**: Quando o admin adiciona informacoes ao perfil do cliente (como fez com a Laiza), o formulario de anamnese começa vazio. O cliente precisa preencher tudo do zero, sem ver os dados que o admin ja adicionou.

2. **Redirecionamento silencioso**: Clientes com assinatura ativa que nao completaram a anamnese sao redirecionados automaticamente para `/anamnese` sem entender o motivo. Nao ha contexto do que falta preencher.

3. **Alerta fraco no dashboard**: O card amarelo atual aparece, mas para clientes com assinatura ativa ele nem chega a ser visto porque o redirect acontece antes.

## Solucao

### 1. Pre-preencher formulario de anamnese com dados existentes do perfil

**Arquivo: `src/pages/Anamnese.tsx`**

Adicionar um `useEffect` que carrega os dados atuais do perfil do banco de dados e preenche o formulario com os valores existentes. Assim, se o admin ja adicionou peso, altura, sexo, etc., esses campos ja aparecem preenchidos para o cliente. O cliente so precisa completar o que falta.

Campos mapeados do perfil para o formulario:
- `data_nascimento` -> `data_nascimento`
- `weight` -> `weight` (convertido para string)
- `height` -> `height` (convertido para string)
- `telefone` -> `whatsapp`
- `sexo` -> `sexo`
- `objetivo_principal` -> `objetivo_principal`
- `ja_treinou_antes` -> `ja_treinou_antes` (boolean para "sim"/"nao")
- `local_treino` -> `local_treino`
- `dias_disponiveis` -> `dias_disponiveis`
- `nivel_condicionamento` -> `nivel_condicionamento`
- `pratica_aerobica` -> `pratica_aerobica` (boolean para "sim"/"nao")
- `escada_sem_cansar` -> `escada_sem_cansar`
- `condicoes_saude` -> `condicoes_saude`
- `injuries` -> `injuries`
- `toma_medicamentos` -> `toma_medicamentos` (boolean para "sim"/"nao")
- `refeicoes_por_dia` -> `refeicoes_por_dia`
- `bebe_agua_frequente` -> `bebe_agua_frequente` (boolean para "sim"/"nao")
- `restricoes_alimentares` -> `restricoes_alimentares`
- `qualidade_sono` -> `qualidade_sono`
- `nivel_estresse` -> `nivel_estresse`
- `consome_alcool` -> `consome_alcool`
- `fuma` -> `fuma`
- `horario_treino`, `horario_acorda`, `horario_dorme`
- `foto_frente_url`, `foto_lado_url`, `foto_costas_url`
- `observacoes_adicionais`

### 2. Melhorar alerta no Dashboard

**Arquivo: `src/pages/Dashboard.tsx`**

- Remover o redirecionamento automatico para `/anamnese` (linha 243-244). Em vez disso, manter o cliente no dashboard e mostrar o alerta proeminente.
- Mostrar quais campos obrigatorios estao faltando no alerta (ex: "Faltam: peso, altura, objetivo").
- Bloquear os cards de acesso rapido (treino, nutricao, etc.) enquanto a anamnese nao estiver completa, mostrando-os em estado desabilitado com um cadeado.
- Manter o botao "Preencher Anamnese Agora" como acao principal.

### 3. Indicador de campos faltantes na anamnese

**Arquivo: `src/pages/Anamnese.tsx`**

Adicionar um banner no topo do formulario mostrando quais campos obrigatorios ainda faltam preencher, com destaque visual nos campos vazios. Isso ajuda o cliente a saber exatamente o que falta sem ter que procurar.

## Resumo das Mudancas

| Arquivo | O que muda |
|---------|-----------|
| `src/pages/Anamnese.tsx` | Carrega dados existentes do perfil no formulario; adiciona banner de campos faltantes |
| `src/pages/Dashboard.tsx` | Remove redirect silencioso; melhora alerta com lista de campos faltantes; bloqueia cards de acesso quando anamnese incompleta |

Nenhuma mudanca no banco de dados e necessaria -- todos os campos ja existem na tabela `profiles`.

