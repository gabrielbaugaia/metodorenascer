# HYROX 90 — Lemuel (protocolo real + complementos do módulo)

## Situação atual
- O módulo de acompanhamento de 90 dias já existe no app (calendário, fases, treinos com séries, registro de corrida/HYROX, revisões 30/60/90, painel do treinador, PDF, documentos privados).
- No app oficial ainda não há nenhum protocolo cadastrado. O cadastro do Lemuel (lemuel@gabrielbau.com.br) já existe e será usado — sem duplicar.

## O que vou fazer

### 1. Cadastrar o protocolo do Lemuel (dados do PDF, sem alterar nada)
- HYROX 90, 01/12/2026 a 28/02/2027, HYROX Open, São Paulo mai/2027 (Florianópolis mar/2027 a confirmar), meta 1h20 e pace 4:40/km.
- Referência inicial de 25/11/2026: 96,90 kg, 1,85 m, 19,45%, magra 78,05 kg, gorda 18,85 kg, cintura 86,5, abdômen 94, pace 5:40 (5 km a 5:30).
- Treinos A, B e C exatamente como no PDF (18 exercícios, séries, reps, RIR, pausa), com vídeo/GIF do catálogo quando houver correspondência.
- Rotina semanal, HYROX alternativo (qui/dom 7h), domingo de descanso.
- Fases e regras de progressão, ajustes de B e C e alertas de segurança copiados do PDF.
- Fica como rascunho até você aprovar; corrida e HYROX não são prescritos (só registrados).

### 2. Complementos que faltam no módulo
- **Natal e Ano Novo (21/12–03/01):** aviso ao aluno com as orientações do PDF; sessões não feitas nesse período não contam como falta.
- **Check-in semanal rápido:** peso, sono, energia, fadiga, recuperação, dor, dificuldade, observação (escalas de toque). Alerta ao treinador quando houver dor, fadiga alta ou queda de desempenho. Nada muda a prescrição sozinho.
- **Triagem de saúde:** botão para você confirmar a triagem cardiovascular antes de intensificar; aviso visível enquanto não confirmada.
- **Revisões com 4 status:** pendente, enviada, em análise, protocolo atualizado; com peso, medidas, fotos opcionais e pedido de ajuste.
- **Execução:** mostrar carga da sessão anterior em cada exercício, duração, esforço e desconforto.
- **Gráficos:** evolução do pace, distância e volume semanal; destaque para Burpees e Wall Balls; evolução de cargas.
- **Painel do treinador:** adesão, frequência, RIR prescrito x realizado, check-ins e revisões pendentes.
- **Reutilização:** ao criar protocolo para outro aluno, escolher 30, 60 ou 90 dias.

### 3. Validação antes de você aprovar
- Entrar como Lemuel e como admin, no celular e no computador: treinos A/B/C, salvar séries, histórico, calendário, check-in, revisão, privacidade (outro aluno não vê nada).
- Rodar os testes existentes e novos (datas das fases, período de festas, alertas).
- Nada será publicado sem sua aprovação. Link do Lemuel: app.gabrielbau.com.br/meu-protocolo-90 (após login).

## Detalhes técnicos
- Reutilizar hyrox_programs (config jsonb versionado), hyrox_activities, hyrox_reviews; adicionar campos de duração (30/60/90), período especial e confirmação de triagem em config; check-in semanal como novo tipo de atividade auditada (sem tabela nova) ou reutilizando weekly_checkins se as colunas servirem.
- Status de revisão: coluna com check (pending/submitted/in_review/updated) via migração aditiva.
- Inserção dos dados do Lemuel via linha privada no banco, nunca em arquivo do código.
- Testes em src/lib/hyrox90.test.ts.
