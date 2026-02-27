
# Link Exclusivo de Anamnese + PDF em Branco para o Admin

## Resumo

Criar um sistema para que o admin possa:
1. **Enviar um link exclusivo** de anamnese para o cliente preencher diretamente (sem precisar de login)
2. **Baixar um PDF em branco** da anamnese para preencher manualmente e depois inserir os dados na plataforma
3. Quando o cliente preencher pelo link e clicar "Enviar", os dados alimentam automaticamente o perfil dele

## Como Funciona

### Fluxo do Link Exclusivo
1. Admin acessa o cadastro do cliente e clica "Enviar Link da Anamnese"
2. O sistema gera um token unico e salva no banco com validade de 7 dias
3. O link e copiado para a area de transferencia (ex: `metodorenascer.lovable.app/anamnese-externa/abc123`)
4. O cliente abre o link, ve o formulario completo da anamnese com o nome dele no topo
5. Preenche os dados e clica "Enviar"
6. Os dados sao salvos no perfil do cliente automaticamente via uma edge function segura
7. O token e marcado como usado

### PDF em Branco
- Botao "Baixar Anamnese em Branco" na area do admin
- Gera um PDF com todos os campos da anamnese vazios (com linhas para preenchimento manual)
- O admin pode imprimir e preencher com o cliente presencialmente

## Mudancas Tecnicas

### 1. Nova tabela: `anamnese_tokens`

```text
id (uuid, PK)
user_id (uuid, NOT NULL) -- o cliente que vai preencher
token (text, UNIQUE, NOT NULL) -- token aleatorio de 32 chars
expires_at (timestamptz, NOT NULL) -- validade de 7 dias
used_at (timestamptz, NULL) -- quando foi preenchido
created_by (uuid, NOT NULL) -- o admin que criou
created_at (timestamptz, default now())
```

RLS: admins podem inserir e ler; service role pode ler para validacao na edge function.

### 2. Nova edge function: `submit-external-anamnese`

- Recebe o token + dados do formulario
- Valida que o token existe, nao esta expirado e nao foi usado
- Atualiza o perfil do cliente com os dados recebidos (mesma logica da pagina /anamnese)
- Marca o token como usado (`used_at = now()`)
- Retorna sucesso

### 3. Nova pagina: `src/pages/AnamneseExterna.tsx`

- Rota publica: `/anamnese-externa/:token`
- Ao montar, chama a edge function para validar o token e obter o nome do cliente
- Se valido, exibe o formulario da anamnese (reutilizando os mesmos componentes: PersonalDataFields, TrainingHistoryFields, etc.)
- Se invalido/expirado/usado, exibe mensagem de erro
- Ao enviar, chama a edge function `submit-external-anamnese`
- Tela de sucesso com animacao de confirmacao

### 4. Atualizar `AdminClienteDetalhes.tsx`

Adicionar na secao "Acoes Rapidas":

- **Botao "Enviar Link da Anamnese"**: gera o token, monta a URL e copia para clipboard com toast de confirmacao
- **Botao "Baixar Anamnese em Branco"**: chama uma funcao que gera o PDF sem dados preenchidos

### 5. Nova funcao: `generateBlankAnamnesePdf` em `src/lib/generateBlankAnamnesePdf.ts`

- Baseada na `generateAnamnesePdf` existente
- Em vez de valores preenchidos, mostra linhas vazias com labels dos campos
- Inclui header "Metodo Renascer - Anamnese" e espaco para nome do cliente
- Layout profissional para impressao

### 6. Atualizar `App.tsx`

- Adicionar rota publica: `/anamnese-externa/:token` apontando para `AnamneseExterna`

## Resumo dos Arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar tabela `anamnese_tokens` com RLS |
| `supabase/functions/submit-external-anamnese/index.ts` | Nova edge function para validar token e salvar dados |
| `src/pages/AnamneseExterna.tsx` | Nova pagina publica do formulario |
| `src/lib/generateBlankAnamnesePdf.ts` | Nova funcao para PDF em branco |
| `src/pages/admin/AdminClienteDetalhes.tsx` | Adicionar botoes de link e PDF em branco |
| `src/App.tsx` | Adicionar rota publica |
| `supabase/config.toml` | Registrar nova edge function com `verify_jwt = false` |
