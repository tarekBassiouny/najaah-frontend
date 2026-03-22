# Handoff Contract

Use a handoff memo whenever one specialist hands work to another:

```text
FROM
- specialist or lane

TO
- specialist or lane

OWNED AREA
- files/modules that changed or are reserved

CHANGED CONTRACTS
- routing, component, service, capability, or test assumptions that changed

DECISIONS
- choices that are now fixed

BLOCKERS
- what is missing

VERIFICATION
- tests/checks run
- tests/checks still needed

NEXT ACTION
- exact next step for the receiver
```

Direct specialist-to-specialist sync is acceptable only for a shared contract boundary, and the result must be written back to memory immediately.
