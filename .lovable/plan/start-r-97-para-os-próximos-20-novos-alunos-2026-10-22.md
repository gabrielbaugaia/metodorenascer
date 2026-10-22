# Start R$97 para os próximos 20 novos alunos

## O que a inspeção confirmou (somente leitura)
- Domínio: app.gabrielbau.com.br ativo, principal, projeto publicado.
- Oferta: `/` (src/pages/LandingGB.tsx) usa `src/components/landing/ConsultoriaPlansSection.tsx`; checkout em `/checkout?plano=start` (src/pages/CheckoutAsaas.tsx).
- Preço exibido: `src/lib/consultoriaPlans.ts` (price 197, texto "R$ 197", tabela). Teste em `src/lib/consultoriaPlans.test.ts`.
- Preço cobrado: `supabase/functions/_shared/asaas.ts` → `ASAAS_PLANS.start.value_cents = 19700`. O valor exibido não é o cobrado; quem manda é o backend.
- Cobrança: `supabase/functions/asaas-checkout/index.ts` cria assinatura Asaas mensal no cartão (`/subscriptions`, value fixo) e grava `asaas_subscriptions` / `asaas_payment_orders` com `value_cents`. Webhook (`asaas-webhook`) libera acesso pelo slug.
- Limite de vagas: não existe nenhum mecanismo (sem contador, cupom ou desconto).

## Riscos concretos
1. Assinatura Asaas guarda o valor: quem entrar a R$97 continua R$97 para sempre, salvo alteração manual depois. Definir se é preço vitalício ou só no 1º mês.
2. Corrida: sem trava atômica, mais de 20 podem pegar o preço. Precisa contar no backend com bloqueio, não na tela.
3. Contar quem: pedidos criados mas não pagos podem consumir vagas. Proposta: conta só assinatura com pagamento confirmado; reserva expira em 30 min.
4. Alunos atuais a R$197 não mudam automaticamente.
5. Memória do projeto diz "R$97 removido, não reintroduzir" — será atualizada com esta exceção do proprietário.
6. Backend publica na hora: funções alteradas entram em produção ao salvar, antes de você publicar a tela. A tela pública mostraria R$197 enquanto cobraria R$97 até publicar.
7. Publicar a tela inclui tudo pendente: responsividade admin/aluno, avaliação física, avaliação de movimento + laudos/PDF, marcações posturais, troca "Análise IA" → Equipe GB, hero novo e imagem de compartilhamento (se ainda não publicados). Webhook Asaas nunca foi testado com pagamento real.

## Proposta (após aprovação)
- Tabela de promoção (`plan_promotions`: slug start, preço 9700, limite 20, ativo) com função no banco que reserva vaga de forma atômica.
- `asaas-checkout`: se houver vaga, cria assinatura com 9700 e marca o pedido como promocional; senão 19700.
- Página e checkout: mostram "R$ 97/mês — X de 20 vagas" vindo do backend; volta a R$197 sozinho ao esgotar.
- Admin: ver vagas usadas e desligar a promoção.
- Testes: 20ª vaga = R$97, 21ª = R$197; reserva expirada libera vaga.
- Nada publicado e ninguém cobrado sem sua validação.

## Preciso confirmar
- R$97 vitalício para esses 20 ou só por um período?
- Vale só para quem nunca foi aluno?
