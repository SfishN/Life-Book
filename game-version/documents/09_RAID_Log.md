# RAID Log

Last reviewed: 2026-08-14

## Risks

| ID | Risk | Probability | Impact | Response | Owner |
| --- | --- | --- | --- | --- | --- |
| R-01 | Spatial metaphor is not discoverable | Medium | High | Room index, onboarding, user testing | Product |
| R-02 | AI language encourages overreliance or feels judgmental | Medium | High | Role boundary, eval set, consent, user control | Product/AI |
| R-03 | Personal records are lost because storage is local-only | Medium | High | Clear disclosure, export/delete, future safe sync | Engineering |
| R-04 | Users assume records are private while AI context is transmitted | Medium | Critical | Explicit context consent and privacy copy before model release | Product |
| R-05 | Large room artwork hurts low-end/mobile loading | Medium | Medium | Optimize formats, measure load, cache essential asset | Engineering |
| R-06 | Game-like presentation undermines serious reflection | Low/Medium | High | No scores, energy, punishment, or manipulative economy | Design |

## Assumptions

| ID | Assumption | Validation plan | Status |
| --- | --- | --- | --- |
| A-01 | A fixed 2D view is sufficient for the first research milestone. | User tests | Unvalidated |
| A-02 | Mirror=AI and Bed=Hero are understandable mappings. | Comprehension task | Unvalidated |
| A-03 | Carryover wording reduces shame compared with overdue labels. | Interview/prototype comparison | Unvalidated |
| A-04 | Users value room visibility behind panels. | Observation and interview | Unvalidated |

## Issues

| ID | Issue | Impact | Next action | Status |
| --- | --- | --- | --- | --- |
| I-01 | No external user tests have been completed. | Product value remains unvalidated. | Recruit first five participants. | Open |
| I-02 | No configured-model AI evaluation exists. | Mirror production quality is unknown. | Define model and run eval set. | Open |
| I-03 | No cloud backup/export exists. | Local records can be lost. | Prioritize export/delete before broader testing. | Open |

## Dependencies

| ID | Dependency | Needed for | Status |
| --- | --- | --- | --- |
| D-01 | Modern browser with local storage and service workers | MVP continuity/PWA | Available |
| D-02 | OpenAI API configuration | Model-backed Mirror | Optional/not configured |
| D-03 | Research participants | M2 evidence | Not arranged |
| D-04 | Future identity/database service | Multi-device sync | Not selected |
