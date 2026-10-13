# Revisão dos planos de consultoria online

## Entrega

- Página pública ativa `/`: cards Start R$197, Evolution R$297 e Premium R$697, comparação adaptada para celular e resumo de pagamento por plano.
- Evolution usa o ID existente `mensal`. Nenhuma mudança em contratos, preços de cobrança, banco, permissões ou integrações.
- CTAs apontam para `/checkout?plano=start`, `/checkout?plano=mensal` e `/checkout?plano=premium`.
- Jornada presencial separada, com consulta pelo Instagram existente. Não está incluída no Premium online.
- `/landing-app`, `/v2`, `/quiz` e `/landing-classica` já estavam desativadas para vendas e continuam exibindo login. A página pública de vendas operante neste projeto é `/`; nenhuma rota foi reativada ou criada.
- Nenhum outro projeto ou site externo foi alterado. Não houve publicação.

## Recursos conferidos no código

- Treino individualizado e registro de séries/repetições/cargas: `useProtocol`, `Treino`, `useWorkoutSession`.
- SIS e indicadores com sono, estresse, energia e recuperação: `useSisScore`, `sisScoreCalc`, `bodyIndicators`, check-in em `Dashboard`. Sem alegação de diagnóstico ou previsão clínica.
- Fotos, peso e medidas: `Evolucao`, `DadosCorpo`, `bodyPhotos`. Comunicação em ciclos de 30 dias.
- Ferramentas alimentares: `Nutricao`, `NutricaoTracking` e `Receitas`. Lista de compras depende de estar incluída no protocolo; não é garantida em todo protocolo.
- Suporte e intervenção humana: `Suporte`, telas administrativas de suporte e mensagens. Isso permite a prestação do serviço, mas não comprova que Gabriel cumpriu revisões semanais.
- Integração WhatsApp existe; não comprova número pessoal, disponibilidade de Gabriel nem prazo de resposta. A página limita o contato a dias úteis/horário comercial, conforme agenda, sem resposta imediata, plantão ou 24h.
- Não foi anunciada regeneração automática de treino nem ajuste automático de dieta. Revisões humanas são descritas como serviço de Gabriel nos planos Evolution/Premium.

Esta conferência é de implementação no código, não uma certificação de funcionamento de todas as funções hospedadas nem de atendimento real a alunos.

## Validação executada

- Cinco testes automáticos de valores, modos de pagamento, ID mensal, compatibilidade do link elite e ausência do plano R$97.
- Navegador em 375, 768 e 1280px: os três CTAs abrem o checkout com o plano correto.
- Start oferece apenas cartão recorrente. Evolution/Premium oferecem Pix e cartão sem renovação automática.
- Botão Entrar abre `/auth`. Nenhum erro de execução observado ou transbordamento horizontal.
- Capturas revisadas para os cards e comparação responsiva. Build automático verificado após os ajustes.
- Nenhuma cobrança foi gerada ou paga durante o teste.

## Pendências e limites para revisão do proprietário

- Confirmar a agenda real de horário comercial e a operação de feedback pessoal semanal; não foram inventados horários ou prazo garantido.
- O aviso de cancelamento de 30 dias do Start já era texto comercial. O cancelamento no app continua chamando o cancelamento imediato existente: não foi alterado neste pedido de apresentação. A aplicação técnica do aviso exige uma tarefa específica.
- Não foram testados pagamento real, liberação de acesso pós-pagamento ou recursos protegidos com uma conta de aluno; nenhuma alteração nesses fluxos.
- Um site principal externo a este projeto não foi fornecido para edição. A separação presencial/online foi aplicada à página pública existente neste projeto.

## Arquivos

- `src/lib/consultoriaPlans.ts` e teste: catálogo de apresentação e slugs preservados.
- `src/components/landing/ConsultoriaPlansSection.tsx`: cards, comparação e limites.
- `src/pages/LandingGB.tsx`: utilização da seção e atualização do FAQ.
- `src/pages/CheckoutAsaas.tsx`: rótulos e resumo de pagamento, sem alteração da cobrança.
- `src/index.css`, `src/styles/gb-premium.css`: tokens isolados e apresentação responsiva.
- `AGENTS.md`, `roadmap.md` e este documento: regras e revisão.