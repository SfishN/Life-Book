# Iteration Log

## 2026-09-12 - Mystery introduction rebuild (implemented)

### Iteration objective

Add the opening guidance story to the current `game-version` without replacing stable work. The rebuild keeps the existing Phaser room, procedural Hero, six furniture functions, Zustand records, Diary save flow, weather lighting, bookshelf feedback, Mirror boundary, and local persistence, then places a replayable first-run sequence around them.

### Hypothesis

A short false-crime mystery can teach movement, interaction, explicit saving, and the six self-management functions with less exposition, while the unresolved small creature can become a nonverbal carrier for later customized guidance.

### Reused baseline

- Kept the existing 1536 × 1024 room, camera, furniture positions, procedural character, light overlays, memory particles, and bookshelf markers.
- Reused the complete Diary, AI Guidance, Skill Tree, Hero, Achievement Wall, and Life Novel panels rather than rebuilding their forms or records.
- Preserved `life-as-a-room-game-v1` as the authoritative personal-record store and retained its explicit Diary save-to-light behavior.
- Reused the approved art package under `basics/settings`; source materials were not moved or edited.

### Changes

- Replaced the generic first-run welcome with: arrival → glowing envelope → conflicting A/B note → window and leaf → no-fail net sequence → small form behind the mirror → Diary handoff → six-function summary → Quiet/Nudge/Lead choice.
- Added a focused onboarding domain model with a separate `life-as-a-room-game-onboarding-v1` key. Replay and onboarding reset do not modify Diary, Hero, skill, achievement, conversation, chapter, or atmosphere records.
- Added WASD and Arrow Key movement, E interaction, direct object click/tap, an accessible net-sweep button, Esc handling, Skip, Replay, and a no-personal-writing completion path.
- Implemented three required catches with returning targets, no score, no damage, no hard failure, and time-based catch assistance.
- Added the approved envelope, net, leaf, note paper, two handwriting fonts, pet flutter sheet, footprints, and threatening shadow to `public/onboarding` for runtime use. The window mark, ordinary crossings, glow, and release effects are procedural Phaser elements.
- Added readable A/B transcriptions with distinct author marks in addition to font and color differences.
- Kept the remaining form unnamed in the story. After onboarding, it uses deterministic local footprints and cues according to Quiet, Nudge, or Lead; it cannot edit or confirm user records.
- Updated the service worker cache to version 2 so the introduction's required assets and fonts remain available offline.
- Added reduced-motion handling for flocking, pulses, particles, the threatening reveal, and pet movement.

### Evidence

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 23 of 23 tests passed, including onboarding namespace isolation, replay/completion state, malformed-state fallback, and source/runtime asset presence.
- `npm run build`: production build passed on Next.js 16.3.1; `/`, `/manifest.webmanifest`, and `/api/guide` were generated successfully.
- Manual browser playthrough on `http://localhost:3001`: verified direct envelope/window interaction, both handwriting styles, three-catch no-fail play, creature reveal, mirror note, existing Diary handoff, close-without-writing route, six-function explanation, guidance selection, completion, persistence, and Replay.
- Existing browser records remained unchanged during the playthrough; onboarding was returned to the arrival screen afterward.

### Decisions

- Keep onboarding persistence separate from personal records to minimize migration and replay risk.
- Use Phaser for room effects and crossing behavior; do not add Three.js to the current stack.
- Use the existing Diary as the introduction's real product payoff rather than a tutorial-only copy.
- Present the six functions with direct product language while keeping A/B's narrative language vague.
- Keep the approved creature small and ambiguous in the room; the threatening impression comes from its brief distorted shadow.

### Follow-up

- Add authored ambience, paper, window, net, flock, mirror, creature, and Diary-save audio; no new audio was added in this iteration.
- Add the delayed envelope-back line and richer Quiet/Nudge/Lead creature gestures when their timing can be user-tested.
- Perform mobile touch, offline-install, screen-reader, and extended reduced-motion testing on reference devices.
- Continue the performance baseline, collision, analytics-consent, and user-study work from the 2026-08-26 planned iteration.

## 2026-08-26 - Performance, input safety, and evidence plan (planned)

### Iteration objective

Make the existing experience responsive and keyboard-safe before expanding its functions, while adding the minimum evidence needed to test the product's core hypothesis:

> A connected record-reflect-act loop becomes more useful and sustainable when AI accompanies the user as a gentle observer, while the user controls what becomes a lasting record.

This is a plan only. None of the tasks below are implemented yet.

### Working hypotheses

- Functional panels already read the shared Zustand store directly; they are not waiting for other furniture panels.
- Perceived slowness is more likely caused by rendering/GPU work and synchronous persistence than by a long data-request chain.
- The room renderer, particles, full-screen blur, and panel blur continue to create work while a panel is visible.
- Diary, Hero, and Calendar edits can update and persist shared state on every keystroke.
- Keyboard conflicts occur because Phaser captures `W`, `A`, `S`, `D`, and `E` globally even when a form is active, while the app shell also handles `Q` and `Esc`.
- Product practicality should be measured through completion of the record-reflect-act loop, not AI message volume alone.

### P0 - Establish a performance baseline

- Measure the production build rather than relying on development-mode impressions.
- Record p50 and p95 panel-open latency for every furniture panel.
- Record input latency while typing in Diary, Calendar, Hero, and Mirror fields.
- Record room frame rate and main-thread/GPU activity with panels closed and open.
- Measure local persistence duration and store-update frequency during typing.
- Separate Mirror network/model latency from local panel-render latency.
- Save the baseline, device/browser details, and commit hash in `11_Eval_Report.md`.

### P0 - Reduce panel rendering cost

- Pause or sleep the Phaser scene while a functional panel is open; stop particles and unnecessary room updates.
- Compare the current full-screen and panel `backdrop-filter` effects with a simple translucent background.
- Keep the room visible, but use the cheapest treatment that still communicates the design.
- Profile after each change rather than combining several changes before measurement.
- Optimize the room image format/size if startup remains slow after runtime work is addressed.

### P0 - Separate editing state from persistence

- Preserve the shared store as the single source of truth; do not make panels request data from each other.
- Give each feature a focused selector or repository function for only the records it needs.
- Keep unsaved text in local component state while the user types.
- Save on explicit action, blur, or a short debounce instead of writing the complete persisted state on every keystroke.
- Pre-index Calendar records by date so month cells do not repeatedly scan every task.
- Evaluate asynchronous IndexedDB persistence if record volume makes localStorage writes measurable.

### P0 - Introduce explicit keyboard modes

- Define three input modes: `room`, `panel`, and `text-edit`.
- In `room` mode, enable `WASD` movement, `E` interaction, and the confirmed exit shortcut.
- When any panel opens, disable Phaser keyboard capture and clear held movement keys.
- In `text-edit` mode, route all printable keys, including `W`, `A`, `S`, `D`, `Q`, and `E`, exclusively to the focused field.
- Ignore application shortcuts while an `input`, `textarea`, `select`, or editable element is focused or an IME composition is active.
- Define an `Esc` hierarchy: leave text editing first, close the top panel second, and offer app exit only from the room.
- Restore room controls only after the panel closes and focus returns safely.
- Add automated tests that type sentences containing `wasd qe`, use uppercase keys, paste text, and exercise IME composition.

### P1 - Instrument the core product loop

- Define a privacy-preserving event taxonomy with no raw task, Diary, annotation, or Mirror text.
- Consider events for room entry, furniture opened, task created, task completed, task carried forward, Diary entry created, Mirror request completed, suggestion accepted/edited/rejected, chapter approved, and session returned.
- Include anonymous session/user ID, timestamp, app version/commit, event name, object/feature ID, latency, result, and error/fallback code.
- Keep product analytics separate from personal life records.
- Add an explicit analytics consent and deletion/export policy before collecting production-user data.

### P1 - Define the feedback study

- Ask users about perceived usefulness, support, judgment, control, privacy comfort, feature clarity, and whether the room makes reflection easier.
- Do not infer wellbeing, emotional state, or genuine self-improvement from clicks alone.
- Compare a record-only experience with an AI-accompanied experience to isolate the value of AI.
- Use task completion and return behavior from logs, and use questionnaires/interviews for meaning, trust, and perceived improvement.
- Record the study plan and findings in `12_User_Test_Report.md`.

### P1 - Clarify each furniture feature before redesign

- Create one feature specification for each object before changing its interface.
- Define its user problem, primary action, required information, read/edit states, success state, errors, cross-feature links, AI role, and measurable outcome.
- Keep one visually dominant primary action per panel and progressively disclose secondary actions.
- Validate low-fidelity flows before investing in richer object-shaped UI.

### P2 - Carry forward the room-collision requirement

- Define invisible floor-footprint obstacles for fixed furniture.
- Use a small collision shape at the character's feet and keep interaction zones outside obstacle boundaries.
- Add sliding collision for keyboard movement and reachable-path behavior for click/tap movement.
- Verify that every object remains approachable and that the character cannot overlap furniture or become trapped.

### Acceptance criteria for this iteration

- Panel-open latency has a recorded production baseline and meets an agreed p95 target on the reference desktop and mobile devices.
- Typing latency remains below the agreed threshold as record volume increases.
- Opening a panel measurably reduces room-rendering work.
- Calendar, Desk, and Bookshelf remain immediately consistent after the persistence changes.
- A user can type `wasd qe` into every relevant field without movement, interaction, closing, or exit behavior.
- `Esc` never exits the app directly while the user is editing text or while a furniture panel is open.
- Analytics events contain no raw personal content.
- AI practicality is evaluated against the complete record-reflect-act loop, not total chat count.

### Required evidence before closing the iteration

- Before/after performance trace and metric table
- Keyboard-mode test results
- Shared-record regression results
- Event taxonomy and privacy review
- Feature-specification drafts
- Updated Evaluation Report, User Test Report, RAID Log, and Decision Log

## 2026-08-14 - MVP implementation

### Added

- Next.js/TypeScript PWA shell with Phaser room and React panels
- Original fixed 2D room artwork
- Movable character, `WASD`, `E`, `Q`, `Esc`, click/tap, and Room index
- All nine agreed furniture/object mappings
- Shared Calendar, Desk, and Success Diary records
- Non-duplicating unfinished-task carryover
- Main Quests, Skill Tree, Hero, Achievements, and Life Novel
- Mirror API boundary with local fallback
- Local persistence, manifest, and service worker

### Product changes incorporated

- Product name changed to Life as a Room.
- Mirror represents AI Guidance; Bed represents Character/Hero.
- Calendar can edit tasks and Diary entries and navigate to the complete To-do List.
- Panels use object-inspired treatments and keep the room visible.
- Future radio, lamp Focus Mode, furniture customization, and possible rotation documented outside MVP.

### Verification

Type check, lint, production build, desktop/mobile interaction, shared-record workflow, fallback Mirror, and PWA resource checks passed. See `11_Eval_Report.md`.

## Entry Template

### YYYY-MM-DD - Iteration name

- Hypothesis:
- Changes:
- Evidence:
- Decision:
- Follow-up:
