# Publicação do desconto Start + Link de convite Auge Clube (30 dias)

## Parte 1 — Publicar o desconto R$97
1. Conferir o resultado da verificação de segurança antes de publicar.
2. Publicar o app (inclui tudo pendente: responsividade, avaliações física e de movimento, laudos/PDF, troca para Equipe GB, hero novo, imagem de compartilhamento, desconto Start).
3. Só depois da publicação: ligar o desconto em Pagamentos Asaas, para o site não mostrar R$197 cobrando R$97.
4. Conferir no site real o preço R$97 e "Restam X de 20 vagas".

## Parte 2 — Link geral de convite (Auge Clube)

### Como fica para você (Admin)
Nova seção "Links de convite" em Admin > Convites:
- Criar link: nome (ex.: Auge Clube), número de vagas (20), dias de acesso liberado (30), quantos dias antes do fim a oferta aparece (você escolhe, ex.: 5), plano oferecido (Start/Evolution/Premium).
- Copiar o link e enviar onde quiser (grupo, Instagram, WhatsApp).
- Ver vagas usadas, lista de quem entrou e quando expira; pausar ou encerrar o link.

### Como fica para o cliente
1. Abre o link e vê "Acesso de 30 dias — Auge Clube — X vagas restantes".
2. Cria a própria conta (nome, e-mail, senha) — você não precisa cadastrar ninguém.
3. Entra direto com acesso liberado por 30 dias.
4. Durante o período, nenhum aviso de prazo aparece.
5. Nos últimos N dias (o número que você definiu), aparece uma oferta discreta para ativar o plano, com botão para o checkout.
6. Ao vencer sem pagamento, o acesso é bloqueado com a oferta de ativação.

### Regras
- Vagas contadas no backend de forma segura (a 21ª pessoa vê "vagas esgotadas").
- Uma vaga por conta; quem já é aluno ativo não consome vaga.
- Ao pagar um plano, o acesso de convidado é substituído pelo plano pago.

## Detalhes técnicos
- Tabelas `invite_links` (slug, label, slot_limit, access_days, offer_days_before, offer_plan_slug, active) e `invite_link_claims` (link_id, user_id, expires_at), RLS: admin gerencia, público lê só status via função.
- Função atômica `claim_invite_link(slug)` chamada após o cadastro; cria acesso temporário em `subscriptions` (status active, current_period_end = agora + access_days) reaproveitando o bloqueio já existente ao expirar.
- Rota pública `/convite/:slug`; banner de oferta no layout do aluno calculado por `expires_at - offer_days_before`.
- Teste: 20ª vaga aceita, 21ª recusada; oferta só aparece dentro da janela definida.
- Nada da Parte 2 é publicado sem sua validação.
