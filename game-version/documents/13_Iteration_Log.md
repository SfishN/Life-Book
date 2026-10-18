# Iteration Log

## 2026-10-18 — Approved full introduction and API connection check (implemented)

### Objective

Replace the short six-function summary with the approved room-bound instruction sequence, preserve existing user records during introduction resets, and verify the server-only OpenAI connection without exposing the credential.

### Changes

- Implemented the persisted sequence: arrival → unsigned envelope → window/net → unitless “Eight” mirror exchange → Diary → Skill Tree → Profile → Achievement Wall → Life Novel → Little Crow → future/past reveal → joint decision that the one in the middle will raise the crow.
- Connected each function instruction to its existing real panel and allowed the user to continue without creating personal data.
- Removed visible A/B initials and signatures; the two writers are distinguished only by rounded and sharp typography.
- Revealed that “Eight” means the crow's eight legs only when the full AI Companion portrait appears.
- Replaced the record-deletion action with **Reset introduction**. It resets only onboarding progress and preserves Diary, Profile, Skills, Skill Records, Achievements, companion history, chapters, and Mood lighting.
- Moved the real API credential out of tracked `.env.example` into ignored `.env.local`; restored the example file to a non-secret placeholder.
- Centralized the OpenAI client with zero automatic retries and a 12-second timeout so missing credit falls back to the local crow response promptly.

### Evidence

- OpenAI authentication endpoint returned HTTP 200 and the configured model was visible.
- A minimal Responses API call reached OpenAI and returned HTTP 429 with `insufficient_quota` / `credit_balance_exhausted`, confirming the integration and identifying the expected no-credit limitation.
- The project's `/api/guide` route returned HTTP 200 in `local` mode with a valid fallback reply.
- `npm run typecheck` and the automated test suite passed after implementation.

## 2026-10-18 — Little Crow companion transfer (implemented)

### Objective

Move AI companionship from the mirror to the Little Crow without rebuilding the reusable room, record store, or server boundary. Keep the redesigned opening separate until its Chinese narrative draft receives product-owner approval.

### Changes

- Moved the `guide` room hotspot and Room Index label to the Little Crow. The normal mirror hotspot and standard AI panel entry were removed; the current onboarding-only mirror beat remains temporarily until the replacement opening is approved.
- Replaced the generic furniture modal with a full-viewport frosted companion scene: Crow illustration and one large current-reply bubble on the left, Today history and player input on the right.
- Added the required `...` initial state. A new question moves the previous Crow reply into the Today rail while the large bubble waits for the new response.
- Retained only the current local day's companion messages, pruning earlier dates during rehydration, snapshots, and subsequent writes.
- Kept room-record context opt-in and off by default. The server still owns the model credential and now caps Crow responses at 55 words, three sentences, and 360 characters.
- Added desktop, tablet, and mobile layout rules while preserving the blurred room behind the interface.
- Generated concepts in `documents/ui-concepts`: a polished Crow companion concept and a transparent twilight-scenery window candidate.
- Replaced the runtime window layer with the approved twilight-scenery candidate and bumped the offline cache so installed PWAs receive the new art.
- Replaced Phaser's broad cursor-key helper with explicit uncaptured WASD/Arrow/E keys, preventing its hidden Space and Shift bindings from blocking companion input. The Crow input also stops keyboard-event propagation as a second boundary.
- Increased first-run movement from the normal `300` world units per second to `420` during onboarding, keeping regular room navigation controlled after the introduction.
- Refined the Crow speech bubble into a smaller left-pointing speech card with a clean clipped tail and corrected desktop/tablet/mobile positioning.
- Bound room-character art to Profile Gender and removed the separate avatar selector: Male uses the boy character; Female, Non-binary, and Prefer not to say use the girl character.
- Repositioned and enlarged Diary book markers into twelve visible shelf slots, with shadow, border, and spine details so a successful Diary save creates an obvious new book.

### Evidence

- `npm run typecheck`: passed.
- `npm test`: 28 of 28 tests passed, covering gender-derived character art, visible Diary book markers, one-day conversation pruning, Crow hotspot ownership, companion panel routing, text-input keyboard isolation, faster onboarding movement, mobile controls, storage isolation, and server-only AI boundaries.
- `npm run build`: production build passed on Next.js 16.3.1 with the updated room asset and companion UI.

### Approval boundary

- Do not replace the current opening or write the proposed version into `basics/background.md` until the product owner approves the Chinese review draft.
- After approval, store the finalized opening in English and then update the onboarding implementation and mirror behavior together.

## 2026-10-17 - Life Room functional UI and fresh storage baseline (implemented)

### Iteration objective

Adopt **Life Room** as the official product name and implement the new Diary, Skill Record, Profile, Achievement Wall, AI Guidance, Skill Tree, and Life Novel interface concepts on top of the reusable room and onboarding code.

### Decisions

- The official product name is **Life Room**. The former working title is retired from product-facing copy, application metadata, the install manifest, and current documentation.
- Diary uses one **Mood** value: Calm, Happy, Neutral, Tired, or Stressed. It is the only atmosphere question and changes the room lighting after an explicit Diary save.
- A Mood change remains a draft until Save. Saving commits the Diary record and matching lighting state together so the written record and visible room cannot diverge.
- The product owner confirmed that current local records contain no useful data and explicitly approved a one-time reset. No legacy-atmosphere migration or fallback is required for this development baseline.
- The new personal-record namespace is `life-room-v1`; onboarding uses `life-room-onboarding-v1`; temporary unsaved drafts use `life-room-draft:`. Old development namespaces are no longer read.
- A Life Novel draft stores the selected date range and exact source Diary references. Generation creates a Draft; only the user can approve it.
- Skill Records are first-class records linked by ID to a Skill and optionally to an existing Diary. They do not duplicate Diary text.

### Implemented changes

- Rebuilt the six functional overlays in the warm ivory and muted-plum UI direction while preserving the Phaser room, furniture hotspots, character movement, and mystery onboarding.
- Added Diary date navigation, Mood choices, related Skills, recent records, explicit Save, and Mood-driven light updates.
- Added a separate Skill Record tab with selected Skill, practice, duration, perceived difficulty, optional Diary link, and saved-record history.
- Added Life Novel date-range selection, exact Diary-source selection, server generation, editable Draft state, source inspection, regeneration, save, and explicit approval.
- Added pinned and suggested Achievement states with Pin, Unpin, Dismiss, manual creation, and source references.
- Added editable Profile fields, user Attributes, levels, and a radar-chart view.
- Added Skill Tree records, generated growth-plan extension point, record-derived progress, and visible progress evidence.
- Added AI Guidance quick prompts, chat history, explicit **Include room records** consent, and a server-side request boundary.
- Added server-only OpenAI extension points at `/api/guide`, `/api/novel`, and `/api/insights`. They read `OPENAI_API_KEY` only on the server and use local fallbacks when it is absent.
- Updated product-facing metadata and copy to **Life Room** and standardized Diary atmosphere wording as Mood.
- Updated `01_PRD_MVP.md` to document the fresh storage baseline, Mood lighting, Skill Records, Life Novel source traceability, AI consent, and user-approval boundaries.

### Evidence

- `npm run typecheck`: passed.
- `npm run lint`: passed with no errors; warnings were corrected before release verification.
- `npm test`: 22 of 22 tests passed, covering Mood lighting, atomic Diary save, storage isolation, Skill Records, user-controlled chapters and suggestions, onboarding separation, assets, and server-only AI boundaries.
- `npm run build`: production build passed on Next.js 16.3.1; `/`, `/manifest.webmanifest`, `/api/guide`, `/api/insights`, and `/api/novel` were generated successfully.
- Manual browser verification on `http://localhost:3001`: verified the updated product name and Mood caption; opened Diary and Skill Record, AI Guidance with local fallback, Profile, Skill Tree, Achievement Wall, and Life Novel; confirmed both compact mobile and 1440 × 900 desktop layout branches. A transient selector-caching error found during testing was corrected before final verification.
- Added a mobile-only two-circle virtual joystick. Dragging its inner circle sends a normalized continuous movement vector into the existing Phaser movement and collision system; releasing, opening an overlay, or losing pointer capture returns it to center and stops movement.
- Kept **Life Room** on one line at the 390 × 844 mobile breakpoint, collapsed header actions to labeled icon buttons, and saved the verified preview as `documents/mobile-preview-life-room.jpg`.
- Added room-scoped two-finger pinch zoom from `1×` to `1.8×` while preserving single-finger tap-to-walk and tap-to-open interactions. The canvas disables browser-native touch gestures so the pinch controls the room camera rather than zooming the page.
- Verified responsive control visibility: the joystick and touch hint are visible at 390 × 844 and hidden at 1440 × 900.

### Decisions and boundaries

- The old browser records may be deleted once on the current development preview, as explicitly requested. Future records created under `life-room-v1` must be preserved.
- AI output is always a suggestion or Draft. Attribute levels, Achievement status, Skill evidence, and Life Novel approval remain user actions.
- No API secret is stored in repository files or sent to the browser. The key pasted in chat is treated as exposed and is not used; a rotated key must be configured through `.env.local` and the deployment environment.
- Life Room remains browser-local in this MVP. Vercel visitors do not share records with one another and do not need to install anything to use the web version.

## 2026-09-12 - Mystery introduction rebuild (implemented)

### Iteration objective

Add the opening guidance story to the current `game-version` without replacing stable work. The rebuild keeps the existing Phaser room, procedural Hero, six furniture functions, Zustand records, Diary save flow, Mood lighting, bookshelf feedback, Mirror boundary, and local persistence, then places a replayable first-run sequence around them.

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

- Product name changed to Life Room.
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
