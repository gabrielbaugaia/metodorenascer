

# Plano: Adicionar política de cancelamento na seção de preços

## O que muda

Adicionar um bloco de texto abaixo dos cards de planos na `PricingSection` com a política de cancelamento, incluindo:

- Cancelamento pode ser solicitado a qualquer momento após o período de teste
- Aviso de 30 dias antes da próxima fatura para evitar cobrança
- Referência ao CDC (direito de arrependimento de 7 dias)

## Visual

Texto discreto, centralizado, abaixo dos cards — estilo rodapé legal com ícone de escudo (ShieldCheck), mantendo o tom premium.

## Arquivo alterado

| Arquivo | Ação |
|---|---|
| `src/components/landing/PricingSection.tsx` | Adicionar bloco de política de cancelamento após o grid de cards |

## Texto proposto

```
🛡️ Política de cancelamento transparente

Você pode cancelar sua assinatura a qualquer momento após o período de teste.
Para evitar a cobrança do próximo ciclo, solicite o cancelamento com pelo menos
30 dias de antecedência da próxima fatura. Garantia de 7 dias de arrependimento
conforme o Código de Defesa do Consumidor (Art. 49).
```

Sem migrations. Alteração apenas visual/textual.
