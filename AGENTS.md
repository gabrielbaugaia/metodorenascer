# Project rules

- Keep online consultancy plan presentation in `src/lib/consultoriaPlans.ts` and reuse it in public pricing and checkout; this prevents display drift while preserving existing payment slugs and contracts.
- Use `ConsultoriaPlansSection` for public online plan cards and comparisons; legacy landing routes remain unchanged unless explicitly requested.
- Scope public consultancy styling to `.consultoria-plans` using global semantic tokens; changes must not restyle protected app screens.
- Keep internal responsive sizing in ClientLayout and shared UI primitives; page-specific grids remain local so public styling and business logic stay isolated.