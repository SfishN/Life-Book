# Product Document Index

## Purpose

This folder is the product and delivery source of truth for Life as a Room. Keep documents concise, dated, and linked to evidence. Do not turn every conversation into a new document; update the document that owns the decision.

## Document Set

| File | Purpose | Update cadence | Current status |
| --- | --- | --- | --- |
| `01_PRD_MVP.md` | Approved scope and product requirements for the MVP milestone | Freeze at milestone end | MVP snapshot |
| `02_User_Journey.md` | End-to-end user experience, alternate paths, and emotions | When flows change | Active |
| `03_Architecture.md` | System structure, boundaries, and technical decisions | Each technical milestone | Active |
| `04_Data_Model.md` | Entities, relationships, ownership, and invariants | When records change | Active |
| `05_AI_Workflow.md` | Mirror AI inputs, outputs, safety, and approval boundary | Every AI change | Active |
| `06_Acceptance_Criteria.md` | Testable milestone release conditions | With each PRD | Active |
| `07_Backlog.md` | Prioritized work and discovery questions | Weekly | Active |
| `08_Roadmap.md` | Outcome-based milestones and decision gates | Monthly or at milestone review | Active |
| `09_RAID_Log.md` | Risks, assumptions, issues, and dependencies | Weekly | Active |
| `10_Test_Plan.md` | Functional, accessibility, resilience, and release tests | Before each release | Active |
| `11_Eval_Report.md` | Technical and AI evaluation evidence | Each release candidate/model change | MVP baseline |
| `12_User_Test_Report.md` | Research plan, observations, and findings | Each user study | Study pending |
| `13_Iteration_Log.md` | Chronological record of product changes | Every meaningful iteration | Active |
| `14_Retrospective.md` | Milestone learning and process improvements | Milestone end | MVP build reflection |
| `15_Decision_Log.md` | Important product and technical decisions with rationale | When a durable decision is made | Active |
| `16_Privacy_and_Safety.md` | Personal-data, AI-safety, and consent requirements | Every data or AI change | Active |

## Working Rules

1. Create a new milestone PRD instead of overwriting the old one, for example `01_PRD_Beta.md`.
2. Once a milestone is released, treat its PRD, acceptance criteria, and eval report as historical evidence.
3. Use ISO dates (`YYYY-MM-DD`) and mark unknown facts as `TBD`.
4. Separate requirements, decisions, assumptions, and observed evidence.
5. Never report a user-test or AI-evaluation result that was not actually collected.
6. Keep the Backlog tactical and the Roadmap outcome-based.
7. Keep personal data and AI consent decisions linked to `16_Privacy_and_Safety.md`.
8. Local work is pushed to GitHub only after the product owner explicitly asks for a push.
