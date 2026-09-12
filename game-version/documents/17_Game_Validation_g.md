# Game Version Validation

Date: 2026-08-30

Scope: [PRD_g.md](../PRD_g.md). This record applies to game-version, not the inherited room-version evaluation reports.

## Completed checks

- Full folder copy completed successfully before changes.
- SHA-256 comparison of 43 original source, configuration, documentation, and asset files found no changes or missing files in room-version.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: 19 tests passed, zero failed.
- `npm run build`: passed, including the production TypeScript check.
- `http://localhost:3001`: HTTP 200 after implementation.
- Game manifest: game-specific title and identity returned successfully.
- AI Guidance local fallback: returned a nonempty reply with `mode: local`.
- Null, non-string, and empty guide messages: HTTP 400, not a server error.

## Automated behavior coverage

- Seven distinct lighting presets, including Not recorded.
- Unknown weather safely resolves to neutral light.
- Unsaved drafts do not mutate committed room state.
- Saving commits diary and atmosphere together under the game-only key.
- Editing preserves record identity and creation time.
- Repeated weather saves increment visual feedback revision.
- Backdated and same-day entries follow the latest-successful-save rule.
- Reload/rehydration restores the saved weather and source date.
- Invalid bodies/dates and failed local persistence leave the room unchanged.
- Diary-to-skill evidence does not automatically award progress or achievements.
- All six retained record functions work without the removed modules.
- Navigation, hotspots, port, and generated-output configuration match the new scope.

## Not performed

- Browser interaction, screenshot inspection, mobile layout, or visual accessibility QA.
- External user testing or a diary study.
- Live model-backed AI evaluation; this copy has no configured local provider key.
- Public deployment, cloud synchronization, or a new authored story.

The visual differentiation and feel of the room effects still need hands-on review. Automated tests verify state transitions and preset values, not artistic quality.
