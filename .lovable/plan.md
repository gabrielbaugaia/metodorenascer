# Integrar Controle de Carga e Timer no Modal do Exercicio

## Problema Atual

Hoje o fluxo do treino ativo usa 3 telas separadas:

1. **ExerciseSetTracker** - lista de exercicios com inputs de carga/reps (tela principal da sessao)
2. **ExerciseVideoModal** - modal com GIF do exercicio (apenas visualizacao, sem interacao de carga)
3. **RestCountdown** - overlay fullscreen do timer de descanso

O aluno precisa navegar entre essas telas, perdendo agilidade e controle durante o treino.

## Solucao

Transformar o **ExerciseVideoModal** em um hub completo durante a sessao ativa. Quando o modal abrir durante uma sessao de treino, ele mostra:

- GIF do exercicio (como ja faz)
- Inputs de carga (kg) e reps para a serie atual
- Botao "OK" para registrar a serie
- Timer de descanso integrado (inline, nao fullscreen)
- Progresso das series (1/3, 2/3, etc)

Quando NAO ha sessao ativa, o modal funciona normalmente (apenas GIF + info).

---

## Alteracoes

### 1. Expandir `ExerciseVideoModal` com props condicionais de sessao

Adicionar props opcionais para modo de sessao ativa:

- `sessionActive: boolean` - se ha sessao em andamento
- `completedSets: SetLog[]` - series ja completadas
- `lastWeight: number` - ultima carga usada
- `canLog: boolean` - se pode registrar (sem descanso ativo)
- `onLogSet: (weight, reps) => void` - callback ao registrar serie
- `restTimer: { active, remainingSeconds, totalSeconds }` - estado do timer

Quando `sessionActive=true`, o modal exibe abaixo do GIF:

- Progresso: "Serie 2/3"
- Input de carga (kg) pre-preenchido com ultima carga
- Input de reps pre-preenchido com reps prescritas
- Botao "OK" para registrar
- Se timer ativo: circular progress inline (compacto, nao fullscreen)
- Series completadas com check (ex: "Serie 1: 30kg x 8 reps")

### 2. Modificar `WorkoutSessionManager`

Passar as props de sessao para o `ExerciseVideoModal` que ja e aberto ao clicar no exercicio. O modal receberao os dados de sessao para permitir registro inline.

### 3. Adaptar `RestCountdown` para modo inline

Criar uma variante compacta do timer que funciona dentro do modal (nao fullscreen). O timer fullscreen continua existindo como fallback quando o modal nao esta aberto.

---

## Fluxo do Usuario (Novo)

```text
1. Aluno inicia treino
2. Clica no exercicio -> abre modal com GIF
3. No mesmo modal, ve inputs de carga e reps
4. Digita 30kg x 8 reps -> clica OK
5. Timer de descanso aparece DENTRO do modal (inline)
6. Timer termina -> inputs da proxima serie aparecem
7. Completa todas as series -> modal mostra "Concluido"
8. Fecha modal ou vai para proximo exercicio
```

---

## Arquivos a Modificar


| Arquivo                                           | Alteracao                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/components/treino/ExerciseVideoModal.tsx`    | Adicionar modo sessao com inputs de carga, reps, timer inline e progresso de series |
| `src/components/treino/WorkoutSessionManager.tsx` | Passar props de sessao para o ExerciseVideoModal                                    |
| `src/components/treino/RestCountdown.tsx`         | Adicionar variante `inline` compacta para uso dentro do modal                       |


Nenhum arquivo novo. Nenhuma alteracao no banco de dados.

---

## Secao Tecnica

- O `ExerciseVideoModal` recebe props opcionais (`sessionActive`, `completedSets`, `onLogSet`, `restTimer`). Quando `sessionActive=false` (ou ausente), funciona identicamente ao atual.
- O timer inline usa o mesmo componente `RestCountdown` com uma prop `variant="inline"` que renderiza em tamanho compacto (w-20 h-20) sem overlay fullscreen.
- Os inputs de carga/reps reutilizam a mesma logica do `ExerciseSetTracker`: pre-preenchem com ultima carga e reps prescritas.
- O `WorkoutSessionManager` abre o modal ao clicar em um exercicio e passa `session.getCompletedSets()`, `session.canLogSet()`, `session.logSet`, e `session.restTimer` como props.
- O `ExerciseSetTracker` continua existindo como visao de lista (para quem prefere ver todos os exercicios de uma vez), mas o registro principal acontece no modal.  
  
  
  

  sEMPRE QUE ATUALIZAR LEMBRE QUE O CLIENTE USA NO CELULAR 99,9% DAS VEZES . ENTÃO Precisa que tudo seja  para facilidade o uso do cliente na tela de treino 