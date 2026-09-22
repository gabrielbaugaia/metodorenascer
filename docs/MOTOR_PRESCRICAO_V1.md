# ENGENHARIA DO MOVIMENTO — Prescription Engine v1

Motor híbrido de prescrição de treino: **regras determinísticas definem a dose**
(volume, frequência, RIR, limites, segurança) e a **IA apenas escolhe exercícios
e organiza a rotina dentro desses limites**.

Versão: `engenharia-do-movimento-v1.0.0`

## Arquivos

| Arquivo | Papel |
|---|---|
| `supabase/functions/_shared/prescription-engine/config.ts` | Configuração central: faixas de volume por músculo, pesos de séries indiretas, limites por sessão, RIR, limiares de recuperação, ajuste máximo por ciclo, fatores por objetivo. Merge com `public.prescription_engine_config`. |
| `.../muscles.ts` | Mapa exercício → grupos musculares (direta 1.0 / indireta 0.5) e agregação de volume equivalente. |
| `.../readiness.ts` | Recovery/Readiness Modifier por **tendência** (sono 7d, VFC e FC de repouso vs base de 30d, energia dos check-ins, SIS, passos, dor). |
| `.../engine.ts` | Núcleo: volume base individual, prioridade, recuperação, aderência, retorno decrescente, capacidade real da agenda, frequência, RIR, faixas de repetição, deload, confiança, alertas de segurança, `planToPromptConstraints()`. |
| `.../enforce.ts` | Conformidade pós-IA: compara o protocolo gerado com a dose, corta excessos, produz relatório e volume realizado a partir dos logs. |
| `.../gather.ts` | Coleta de entradas reais (profiles, workout_set_logs, workout_completions, weekly_checkins, health_daily, sis_scores_daily, protocolo anterior). |
| `.../engine.test.ts` | 11 testes (`deno test -A`), cobrindo os 8 casos de aceite. |
| `src/lib/prescription/*` | Espelho de tipos e mapa muscular para o painel do admin. |
| `src/components/admin/PrescriptionEnginePanel.tsx` | "Por que a IA prescreveu assim?" — dose planejada x gerada x realizada, racional, recuperação, confiança, ajustes. |

## Banco

- `protocolos.prescription_meta` (jsonb): versão do motor, snapshot das entradas, plano, racional, confiança, prontidão, deload, conformidade.
- `prescription_engine_config`: parâmetros editáveis (leitura autenticada, escrita admin).
- `workout_set_logs.rir` (numeric, opcional) — preparado para captura de esforço.

## Regras implementadas

- Volume em **séries efetivas por grupo/semana**, partindo do menor volume com alta chance de progresso (âncora por nível ou volume já tolerado nos logs).
- Séries indiretas contam com peso 0.5, sem dupla contagem.
- Teto por sessão (padrão 8, preferencial 6) e divisão em mais exposições quando necessário.
- Frequência derivada do volume e limitada pela agenda real.
- Retorno decrescente: só passa do topo do default com prioridade alta + boa recuperação + aderência ≥ 80% + nível avançado.
- Progressão limitada a ±2 séries por ciclo; aderência < 70% bloqueia aumento.
- Deload sinalizado por fadiga/perda de performance, nunca por calendário fixo.
- Confiança alta/média/baixa com motivos explícitos; ausência de dado nunca é inventada.
- Prescrição manual do treinador tem prioridade absoluta (sinalizada nos alertas).

## Fase 2 (não implementado)

- Tela de admin para editar `prescription_engine_config` pela interface.
- Captura de RIR/RPE na execução do treino (coluna já existe).
- Campos estruturados de anamnese: frequência semanal, minutos por sessão e equipamentos (hoje inferidos de texto livre).
- Contribuição indireta variável por exercício catalogado em `exercise_gifs`.
- Histórico por ciclo de volume prescrito x realizado com gráfico de evolução.
- Integração do motor ao fluxo `transcribe-manual-protocol` e ao módulo MQO.
