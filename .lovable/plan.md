

# Upload de Fotos Corporais pelo Admin

## Contexto

A cliente Laiza nao conseguiu enviar as fotos pelo app, entao o admin precisa fazer o upload manualmente. Atualmente a pagina `AdminClienteDetalhes` exibe as fotos (quando existem) mas nao tem opcao de upload.

## O que sera feito

Adicionar uma secao de **upload de fotos corporais** na pagina de detalhes do cliente (`AdminClienteDetalhes.tsx`) que permite ao admin:

1. Selecionar e enviar imagens para Frente, Lado e Costas
2. Ver preview antes do upload
3. Substituir fotos existentes
4. Salvar as URLs no perfil do cliente automaticamente

## Implementacao Tecnica

### Arquivo: `src/pages/admin/AdminClienteDetalhes.tsx`

Adicionar na secao de acoes rapidas (ou como um Card separado logo apos o header):

- **3 inputs de arquivo** (Frente, Lado, Costas) com preview da imagem selecionada
- Ao selecionar uma imagem, fazer upload para o bucket `body-photos` no caminho `{userId}/{tipo}-{timestamp}.{ext}`
- Apos upload bem-sucedido, atualizar o campo correspondente (`foto_frente_url`, `foto_lado_url`, `foto_costas_url`) na tabela `profiles`
- Mostrar as fotos atuais com opcao de substituir
- Indicador de loading durante o upload

### Logica de upload

```text
1. Admin seleciona arquivo via input
2. Validar tipo (image/jpeg, image/png, image/webp) e tamanho (max 5MB)
3. Upload para storage: body-photos/{clientId}/{tipo}-{timestamp}.{extensao}
4. Obter path do arquivo
5. Atualizar profiles.foto_{tipo}_url com o path
6. Gerar URL assinada para exibir preview
7. Atualizar estado local
```

### RLS do bucket body-photos

O bucket `body-photos` ja existe e e privado. As politicas de RLS do storage precisam permitir que admins facam upload. Sera verificado se ja existe uma policy para admin no bucket -- caso contrario, sera criada uma migration adicionando:

- INSERT para admins (upload)
- SELECT para admins (visualizar)

### Resumo visual

O Card tera 3 colunas (Frente / Lado / Costas), cada uma com:
- Foto atual (se existir) com URL assinada
- Botao "Enviar foto" ou "Substituir"
- Preview da foto selecionada
- Indicador de progresso durante upload

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/admin/AdminClienteDetalhes.tsx` | Adicionar secao de upload de fotos corporais com 3 inputs |
| Migration SQL (se necessario) | Adicionar RLS policy para admin no bucket body-photos |

