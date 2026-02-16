

# Adicionar Link para Documentação do Conector Mobile no Painel Admin

## Resumo

Adicionar um botão/link visível no painel administrativo que leve diretamente à página `/admin/docs/conector-mobile`.

---

## O que será feito

Modificar o **AdminDashboard** (`src/pages/admin/AdminDashboard.tsx`) para incluir um card ou botão de acesso rápido à documentação técnica do Conector Mobile.

O link será adicionado na área de ferramentas/utilitários do dashboard admin, com:

- Icone de documento (FileText ou BookOpen do Lucide)
- Titulo: "Docs Conector Mobile"
- Subtitulo: "Especificação técnica do Renascer Connect"
- Navegação para `/admin/docs/conector-mobile`

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/AdminDashboard.tsx` | Adicionar card/botão com link para `/admin/docs/conector-mobile` |

Nenhum outro arquivo será modificado. Nenhuma funcionalidade existente será alterada.

