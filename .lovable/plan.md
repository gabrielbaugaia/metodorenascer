## Teste de Esteira Interativo (Bruce + Cooper) com Cronômetro In-App

Transformar o teste de esteira de "preencher tempo no final" para uma experiência guiada estilo treino de musculação: o cliente toca **Iniciar Teste**, o app cronometra, anuncia cada estágio com destaque visual + som/vibração, e ao **Finalizar** salva o tempo automaticamente. Depois, segunda etapa opcional para anexar dados do app fitness/foto da esteira.

### Fluxo novo

```
/vo2max → seleciona "Esteira (Bruce)" ou "Cooper 12min"
   ↓
PASSO 1 — Instruções + tabela de estágios (mantém)
   ↓
PASSO 2 — Tela de Execução Ao Vivo (NOVO)
   [Iniciar Teste] → cronômetro grande começa
   ├─ Banner do estágio atual: "ESTÁGIO 3 · 5.5 km/h · 14%"
   ├─ Barra de progresso do estágio (0→3min)
   ├─ Próximo estágio em prévia ("Próximo: 6.8 km/h · 16%")
   ├─ A cada virada de estágio: pulse + beep + vibração + toast
   ├─ Botões: [Pausar] [Finalizar Teste]
   └─ Marcos motivacionais (3min/6min/9min/12min): badge XP
   ↓
PASSO 3 — Resultado Imediato (NOVO)
   - Tempo final salvo automaticamente
   - VO2 calculado + classificação animada
   - "Salvar no perfil" (default ON)
   ↓
PASSO 4 — Anexos Opcionais (NOVO, skippable)
   - Foto da tela da esteira (upload → fitness-screenshots)
   - Screenshot do app fitness (Garmin/Apple Watch/Strava)
   - Notas livres (sensações, BPM máx, etc)
   - [Concluir]
```

### Mesma lógica para Cooper

- Iniciar → cronômetro **regressivo de 12:00**
- Marcos a cada 3 min ("¼ feito", "Metade!", "Reta final", "Sprint final")
- Ao zerar: beep duplo + tela "Pare e meça sua distância"
- Passo 3 pede só a distância percorrida → calcula

Astrand fica como está (não é cronometrado por estágios).

### Gamificação (sugestões)

1. **Badges por marco**: "Sobreviveu ao Estágio 4 (Bruce)", "Completou 12min sem parar (Cooper)" — salvas em `events` (`event_name='vo2max_milestone'`)
2. **XP visível** subindo durante o teste (+10 XP por minuto, +50 por estágio completo)
3. **Streak**: comparar com último teste do usuário ("Você superou seu recorde em +1:23!")
4. **Som/Vibração**: Web Audio API (beep curto na virada) + `navigator.vibrate([200,100,200])`
5. **Wake Lock**: `navigator.wakeLock.request('screen')` pra tela não apagar durante o teste
6. **Modo Foco**: fundo escurece, tudo some exceto cronômetro + estágio atual (estilo Apple Workout)
7. **Frase motivacional** rotativa nos últimos 30s de cada estágio

### Arquivos

**Novos:**
- `src/components/vo2max/Vo2MaxLiveBruce.tsx` — execução ao vivo Bruce
- `src/components/vo2max/Vo2MaxLiveCooper.tsx` — execução ao vivo Cooper
- `src/components/vo2max/Vo2MaxStageBanner.tsx` — banner grande do estágio atual
- `src/components/vo2max/Vo2MaxLiveTimer.tsx` — cronômetro central (reuso para os 2)
- `src/components/vo2max/Vo2MaxAttachmentsStep.tsx` — passo 4 (upload + notas)
- `src/lib/vo2maxAudio.ts` — helpers de beep + vibração + wake lock
- `src/hooks/useVo2MaxSession.ts` — estado da sessão (start/pause/resume/finish, estágio atual, tempo)

**Editados:**
- `src/components/vo2max/Vo2MaxBruceForm.tsx` — substitui input manual por modo "ao vivo" (com fallback "registrar manualmente" pra quem já fez)
- `src/components/vo2max/Vo2MaxCooperForm.tsx` — mesmo padrão
- `src/pages/Vo2Max.tsx` — orquestra os 4 passos

### Banco

Adicionar colunas em `vo2max_tests` (sem breaking change):
- `modo_execucao text` — `'ao_vivo' | 'manual'`
- `estagio_max int` — só Bruce (último estágio completado)
- `pausas int default 0`
- `notas_execucao text`
- `screenshot_app_url text` — separado do screenshot da esteira

### Técnico

- **Timer**: `requestAnimationFrame` ou `setInterval(1000)` com `performance.now()` pra precisão (não confiar em setInterval cego).
- **Persistência durante teste**: salvar estado em `localStorage` a cada 5s pra recuperar se app fechar/recarregar → ao voltar, modal "Continuar teste em andamento?"
- **Beep**: `AudioContext` com oscilador curto (440Hz, 150ms) — sem arquivos.
- **Wake Lock**: try/catch (nem todo browser suporta) — fallback: aviso "mantenha a tela ativa".
- **Vibração**: feature-detect `navigator.vibrate`.
- **Sem dependências novas**.

### Fora de escopo

- Integração nativa Apple Watch/Garmin (anexo é screenshot/foto)
- BPM em tempo real
- Voz sintetizada anunciando estágios (só beep + visual nessa V1)
