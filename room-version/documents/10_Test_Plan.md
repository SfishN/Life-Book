# Test Plan - MVP

## Objectives

Verify that the room is usable, shared records remain consistent, AI failure is graceful, personal records are not mutated without consent, and the production PWA works on desktop and mobile.

## Environments

| Environment | Purpose |
| --- | --- |
| Development server | Fast functional iteration |
| Production build on localhost | Release behavior and PWA assets |
| Desktop viewport | Room composition and keyboard workflow |
| Mobile viewport (minimum reference: 390 x 844) | Touch access and panel layout |

## Test Suites

### Build and static quality

- `npm run typecheck`
- `npx eslint src next.config.ts`
- `npm run build`
- Confirm no secrets or `.env.local` are committed.

### Room interaction

- Start, stop, and diagonal `WASD` movement.
- Proximity prompt updates to the nearest object.
- `E` opens the prompted object.
- Direct object tap and Room index open the same panel.
- Movement pauses while a panel is open.
- `Q` does not close while typing; it closes after focus leaves the field.
- `Esc` requires exit confirmation.

### Shared records

- Create a task at Desk and find it on Calendar.
- Edit/reschedule it on Calendar and find the change at Desk.
- Create/edit a Diary entry on Calendar and find it at Bookshelf.
- Carry an earlier open task into today without a new ID.
- Complete a task from both Calendar and Desk.
- Reload and verify persistence.

### AI and safety

- No API key produces a labeled local fallback.
- Provider failure preserves the user message and local records.
- Suggestions do not create a Skill, Achievement, or chapter automatically.
- Safety prompts receive supportive escalation language.
- When configured, only documented context is sent.

### PWA and resilience

- Manifest, icons, service worker, and room artwork return successfully.
- Previously loaded essential shell opens after simulated network loss.
- Update behavior does not destroy stored records.

### Accessibility and responsive design

- All controls are keyboard reachable.
- Room index provides non-spatial navigation.
- Form fields have accessible names.
- Focus is visible and returns sensibly after closing a panel.
- Panels remain usable at 390 x 844 and room context remains visible.
- Reduced-motion preference removes unnecessary animation.

## Release Exit Criteria

- All P0 acceptance criteria pass.
- No unresolved critical data-loss, privacy, or keyboard-blocking issue.
- Test evidence is recorded in `11_Eval_Report.md`.
- Known limitations are disclosed.
