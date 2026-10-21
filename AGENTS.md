# Project rules

- Keep online consultancy plan presentation in `src/lib/consultoriaPlans.ts` and reuse it in public pricing and checkout; this prevents display drift while preserving existing payment slugs and contracts.
- Use `ConsultoriaPlansSection` for public online plan cards and comparisons; legacy landing routes remain unchanged unless explicitly requested.
- Scope public consultancy styling to `.consultoria-plans` using global semantic tokens; changes must not restyle protected app screens.
- Keep internal responsive sizing in ClientLayout and shared UI primitives; page-specific grids remain local so public styling and business logic stay isolated.- Physical assessments: published rows and their photos are immutable (DB triggers); corrections are new versions linked by supersedes_id/root_id, so history is never overwritten. Calculations live in src/lib/physicalAssessment.ts with tests.
- Movement assessments use immutable published snapshots with versioned corrections and private media; visual suggestions require admin review before publication to preserve health-data provenance.
- Uploaded movement videos are analyzed as chronological image samples via an admin-authenticated server boundary; never represent sampled observations as continuous kinematics or measured force.
- Share movement report rendering and private signed-media queries between admin and student views to keep publication and access behavior consistent.
- Store projected movement angles as trainer-marked normalized three-point coordinates with media ID, frame time and image aspect ratio in the immutable report; never generate angular measurements or reference ranges from visual language-model guesses.
- Store automatic posture suggestions as validated two-point photo annotations with explanations in the reviewed report; share their geometry between admin, student and PDF without altering original photos or interpreting them as measured metrics.
