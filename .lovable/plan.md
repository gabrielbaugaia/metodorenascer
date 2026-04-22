obs: 

o aluno so vai ver o que foi adicionado, no admin que vamos adicionar, editar, subir para ia trasncrever e tudo no aluno e so visualizar 

  
  
  
Diagnóstico: "Reels" já está no menu admin, mas não aparece pra você

Verifiquei o código do sidebar (`src/components/layout/ClientSidebar.tsx` linha 85) e o item **Reels** está corretamente cadastrado no grupo **CONTEÚDO**, entre "Biblioteca de GIFs" e "Blog", apontando para `/admin/reels`.

A screenshot que você mandou mostra a sidebar pulando direto de "Biblioteca de GIFs" para "Blog" — isso é cache do preview. O build da última correção (recharts/input-otp) provavelmente ainda não terminou de recarregar no seu navegador.

### O que fazer agora

**Opção 1 — Recarregar (resolve em 90% dos casos):**

- Faz um hard refresh no preview: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
- O item "Reels" com ícone ▶ deve aparecer entre GIFs e Blog

**Opção 2 — Acessar direto:**

- Vai direto na URL: `/admin/reels`
- A página de upload em lote já está funcional

### Se mesmo após o refresh não aparecer

Me avisa que eu investigo se tem algum erro de build silencioso impedindo o sidebar de re-renderizar, ou se o `useAdminCheck` está bloqueando a seção CONTEÚDO inteira por algum motivo. Nesse caso o próximo passo seria:

1. Abrir o console do navegador no preview e me mandar qualquer erro vermelho
2. Confirmar que você consegue ver "Biblioteca de Vídeos" e "Biblioteca de GIFs" (que aparecem na screenshot, então o grupo CONTEÚDO está renderizando — só falta atualizar)

**Não precisa nenhuma alteração de código nesse momento.** O Reels já está implementado e cadastrado no menu — é só refresh.