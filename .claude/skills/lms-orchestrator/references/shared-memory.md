# Shared Memory Template

Create and keep a compact task memory with these sections:

```text
OBJECTIVE
- requested outcome

SCOPE
- platform | center | shared | mixed

INVARIANTS
- auth
- tenant scope
- localization
- responsive behavior
- contract compatibility
- design-system consistency

AFFECTED AREAS
- routes/layouts
- components
- hooks/state
- services/API integration
- docs
- tests

OWNERSHIP
- lane or specialist -> owned files/modules

DEPENDENCIES
- what must finish before another lane can proceed

DECISIONS
- concrete choices that are now settled

VERIFICATION LEDGER
- tests/checks run
- checks still pending

OPEN RISKS
- unresolved questions
```

Do not let specialists drift from this memory. Update it whenever component contracts, routing, API usage, or test scope changes.
