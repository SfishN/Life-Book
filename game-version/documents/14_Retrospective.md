# Retrospective - MVP Build

Date: 2026-08-14

## What Went Well

- The room metaphor translated into a clear technical boundary: Phaser room, React panels, shared records.
- Calendar, Desk, and Bookshelf were implemented around one source of truth.
- The no-game-pressure principle remained visible in controls, language, and data behavior.
- Original room art established a coherent emotional direction early.
- Production and responsive QA found no blocking runtime issue.

## What Was Difficult

- Spatial interaction and form interaction require careful keyboard-focus handling.
- The room art is more detailed than the initial character, creating a visual-quality gap.
- AI usefulness cannot be concluded from a fallback response or implementation check.
- Local-first simplicity creates a real backup/export risk.

## What We Learned

- The Room index is essential accessibility, not merely a shortcut.
- Carryover should be an interpretation of one task record, never a copied task.
- AI confirmation needs to be visible in both product language and domain design.
- A functional build is not evidence that the product metaphor works for users.

## Improve Next Milestone

1. Run user research before expanding the room.
2. Add domain tests before adding sync complexity.
3. Implement export/delete and explicit AI context consent.
4. Define measurable AI eval cases before choosing a production model.
5. Review character art after validating that the core room is useful.
