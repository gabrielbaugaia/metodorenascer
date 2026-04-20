

## Diagnóstico — erro confirmado

Reproduzi o erro fazendo um INSERT como visitante anônimo (mesmo cenário da aluna):

```
HTTP 401 — code 42501
"new row violates row-level security policy for table quiz_leads"
```

A tabela `quiz_leads` **está vazia** — nenhum lead foi salvo desde o deploy. Todas as pessoas que tentaram completar o quiz nas últimas horas viram esse mesmo erro.

### Causa raiz

A policy de INSERT existe (`"Anyone can submit quiz leads"` com `WITH CHECK true`), mas foi criada com role `{public}` em vez de explicitamente `{anon, authenticated}`. No Supabase/PostgREST, **policies destinadas ao role `public` não são aplicadas corretamente para usuários anônimos** quando o JWT é o anon key — precisa ser explícito.

### Correção (1 migration, ~30 segundos)

Recriar a policy de INSERT apontando para os roles corretos:

```sql
DROP POLICY IF EXISTS "Anyone can submit quiz leads" ON public.quiz_leads;

CREATE POLICY "Anyone can submit quiz leads"
ON public.quiz_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

E o mesmo para a policy de UPDATE pública (avançar funil de `viewed_offer` → `clicked_checkout`):

```sql
DROP POLICY IF EXISTS "Public can advance funnel status only" ON public.quiz_leads;

CREATE POLICY "Public can advance funnel status only"
ON public.quiz_leads
FOR UPDATE
TO anon, authenticated
USING (status = ANY (ARRAY['completed_quiz','viewed_offer']))
WITH CHECK (status = ANY (ARRAY['viewed_offer','clicked_checkout']));
```

### Validação após o fix

1. Vou refazer o teste de INSERT anônimo via curl — deve retornar HTTP 201 com o `id` do lead
2. Você abre o quiz em janela anônima, completa as 4 perguntas, preenche nome/email/WhatsApp e confirma que avança para a tela do mentor
3. Confirma que aparece em `/admin/leads-quiz`

### Arquivos
- **Nova migration** em `supabase/migrations/` — recriar 2 policies de `quiz_leads`

Nenhum código frontend muda. A aluna Adriana e qualquer pessoa que tente completar o quiz vão conseguir liberar a análise normalmente após esse fix.

