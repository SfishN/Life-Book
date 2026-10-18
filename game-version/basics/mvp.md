# Life Room — Mystery Introduction MVP

Version: g0.3  
Date: 2026-10-18  
Depends on: `PRD_g.md` and `background.md`  
Status: Proposed implementation scope

## 1. MVP outcome

Use an optional, resettable mystery introduction set entirely inside the existing room. The introduction teaches movement, interaction, the Diary save-to-room loop, and the purpose and limits of all six retained self-management functions through a sequential in-world instruction flow.

The MVP ends after the rounded and sharp hands reveal their future/past positions, agree that the one in the middle will raise the little crow, and unlock free exploration. The room's larger history and temporal mechanism remain unresolved.

Target first-run duration: **8–12 minutes**.  
Target replay duration with known actions: **4–6 minutes**.

## 2. Current project baseline

The current `game-version` provides:

- Next.js, React, TypeScript, Phaser, Zustand, and browser-local persistence.
- One fixed 1536 × 1024 isometric room image: `public/room/dream-room.png`.
- A procedurally drawn movable Hero and room light overlays.
- WASD movement, E interaction, click/tap movement and object access, Esc close/exit, and an accessible Room Index.
- Six active functions only: Diary, AI Companion, Skill Tree, Achievement Wall, Hero, and Life Novel.
- An explicit Diary save that commits the entry and Mood, closes the panel, changes the room light, and marks the bookshelf.
- Five user-chosen Mood states: Calm, Happy, Neutral, Tired, and Stressed.
- Optional AI use through the Little Crow; all other functions work without AI or network access.

The introduction must preserve these behaviours. To-do List, Calendar, and Main Quests must not return.

## 3. In scope

### 3.1 First-run sequence

Implement the stages defined in `background.md`:

1. Arrival and basic movement.
2. Envelope inspection and two conflicting unsigned hands.
3. Window, leaf, glowing mark, and net pickup.
4. Accessible no-fail net minigame.
5. The small form moving behind the mirror.
6. The unitless “Eight” exchange and handoff to the Diary.
7. Optional first Diary record and visible save response.
8. Sequential Skill Tree, Profile, Achievement Wall, and Life Novel instruction, each linked to its real panel.
9. Little Crow companion introduction and visual reveal that “Eight” meant its legs.
10. Final future/past identity reveal.
11. Both hands decide that the one in the middle will raise the little crow.
12. Room Index unlock and free exploration.

### 3.2 Six-function introduction

The MVP must teach the purpose and control boundary of each function without forcing the user to create data in every panel.

| Function | Required teaching point |
| --- | --- |
| Diary | Record a dated moment and chosen Mood; only explicit Save changes the room |
| AI Companion | Little Crow conversation supports brief reflection; same-day history is retained; saved context is included only with user opt-in; suggestions do not modify records |
| Skill Tree | User creates skills and manually confirms progress; linked Diary entries are evidence only |
| Achievement Wall | User creates or confirms milestones; importance is never assigned automatically |
| Profile | Name, Gender, Motto, and Attributes are editable present descriptions; character art follows Gender |
| Life Novel | Saved material can produce an editable draft; only user-approved chapters become lasting narrative |

### 3.3 Guidance behaviour

Store one explicit preference:

- `quiet`: no unsolicited route; respond when the user requests help;
- `nudge`: show a small environmental cue after a configurable hesitation;
- `lead`: show the next interactable and a short route.

For the MVP, guidance uses deterministic local cues. It must not require an AI call. The remaining form may look, hop, leave a short trail, or carry a scrap toward the relevant object. It must not speak or receive a product label.

The player can change the preference from Help or the Room Index.

## 4. Interaction specification

### Controls

- Add Arrow Keys as equivalents to WASD.
- Keep E for proximity interaction.
- Keep click/tap for direct object access and movement.
- Keep Esc for closing a note/panel and opening exit confirmation.
- Pause Hero and minigame input while a note, form, menu, or consent control is open.
- The Room Index must remain usable without character movement.

### Narrative objects

| Object | States | Required interaction |
| --- | --- | --- |
| Envelope | closed glow, opened, final added lines | Inspect from desk; open readable note overlay |
| Window mark | hidden, faint, fractured, resolved | Activate after envelope; launches crossing sequence |
| Leaf note | attached, inspected | Read B's warning in accessible note view |
| Net | resting, equipped, sweeping, returned/hidden | Pick up and use with keyboard or pointer |
| Flying shapes | distant, approach, caught, released | Three escalating no-fail targets |
| Mirror | normal, scratch, note visible | Inspect after the remaining form disappears behind it |
| Little crow | distant silhouette, hidden extra legs, full eight-legged portrait, hint actions | Named during the companion stage; persists as the optional AI companion |

### Net minigame

- Remain inside the room scene; do not load a separate level.
- Use the same movement boundaries as the room where practical.
- Spawn one slow target, one turning target, then a small flock.
- E/click/tap performs a generous net sweep with clear anticipation and recovery frames.
- A miss creates no negative sound, score, health loss, or reset.
- Missed targets loop back; after repeated misses, reduce speed and enlarge the success window.
- Provide a Skip action in the note/accessibility menu. Skip must lead to the same story state.
- Reduced-motion mode replaces fast flock movement with slow gliding paths and removes shake.

### Diary handoff

- Highlight the Bookshelf only after the mirror exchange.
- Reuse the current Diary editor and explicit save rules.
- Offer neutral wording: write a real moment, use a practice sentence, or continue without writing.
- Do not create a permanent sample entry automatically.
- A draft must not change lighting or onboarding completion.
- A successful save must show the source date and Mood in text as well as visual light.
- Continuing without a save keeps neutral/current committed lighting and explains the save effect.

### Completion and replay

- Mark onboarding complete only after the function instructions, temporal reveal, and decision to leave the little crow with the one in the middle.
- Returning users enter free exploration; Help contains **Reset introduction** and **Review room functions**.
- Provide **Skip introduction** from the beginning. Skipping enters free exploration without changing any personal records.
- Resetting onboarding must not reset Diary, Hero, Skill, Achievement, Guide, Chapter, or atmosphere data.

## 5. Data additions

Add a small persisted onboarding record, either inside the game store or under a separate game-version key:

```ts
interface OnboardingState {
  version: 1;
  status: "not-started" | "in-progress" | "complete";
  step: "arrival" | "envelope" | "window" | "net" | "mirror" | "diary" | "skills" | "profile" | "achievements" | "novel" | "companion" | "reveal" | "adoption" | "complete";
  guidanceMode: "quiet" | "nudge" | "lead";
  completedAt: string | null;
}
```

Requirements:

- Never store which writer the user appeared to trust as a psychological profile.
- Do not send onboarding choices, note interactions, or net performance to the Little Crow API.
- Preserve all existing personal records, onboarding progress, and temporary drafts through a versioned, non-destructive migration into the `life-room-*` namespace.
- Keep temporary Diary drafts under the existing game-specific draft namespace.
- Narrative progress and guidance mode must work offline.

## 6. Art direction

Keep the current warm isometric room. Suspense comes from impossible timing, empty space, shadows, restrained sound, and changes to familiar objects—not from turning the room into horror scenery.

### Visual rules

- Preserve the existing camera, furniture positions, and dominant mauve/gold palette.
- Use cool silver-violet light for cross-time traces and warm paper/gold for readable interaction cues.
- The future hand is rounded and flowing; the past hand is narrow, angular, and heavily corrected. Player-facing notes have no names, initials, or signatures.
- Identify A/B with shape marks as well as handwriting and colour so the distinction survives transcription and colour-vision differences.
- Avoid blood, police tape, weapons, visible bodies, occult clichés, and explicit crime imagery.
- The remaining form should be ugly-cute only on close inspection. At a distance its outline must remain ambiguous.
- The large threatening impression should come from a distorted shadow, not a separate monster asset.

## 7. Art resources

### Existing resources to reuse

| Resource | Current use | MVP use |
| --- | --- | --- |
| `public/room/dream-room.png` | 1536 × 1024 room background | Preserve as the only environment; place onboarding art as aligned transparent overlays |
| Procedural Hero | Player character | Reuse without redesign |
| Procedural ambient/window/lamp light | Mood response | Reuse; add restrained cross-time glow values |
| Procedural bookshelf markers and particles | Saved-memory feedback | Reuse for first-record payoff |
| Lucide interface icons | Six function panels and controls | Reuse in Room Index and accessible prompts |

### New required visual assets

All scene assets should match the 1536 × 1024 base composition and be delivered as transparent PNG/WebP overlays or Phaser sprite sheets at sufficient resolution for the current canvas.

| Asset | Quantity / states | Notes |
| --- | --- | --- |
| Envelope and paper | 3 scene states + 1 inspect layout | Closed/glowing, opened, later writing added; paper should accept both handwriting layers |
| A handwriting set | 1 authored lettering sheet or note images | Include uppercase, lowercase, numerals, punctuation, and A's identifying mark |
| B handwriting set | 1 authored lettering sheet or note images | Angular corrections, strike-throughs, numerals, punctuation, and B's identifying mark |
| Accessible note skin | 1 scalable UI frame | Clean text transcription shown beside or instead of handwriting |
| Leaf note | 2 states | At window and close inspect view; readable without relying on green/brown contrast |
| Window sign | 4 states | Hidden, faint, complete, fractured into moving light |
| Hand net | 1 pickup image + 6–8 frame sweep sheet | Resting, held, anticipation, sweep, recovery; align with both Hero facing directions |
| Ordinary flying shapes | 3 silhouettes, 4–6 flight frames each | Recolour/scale for flock variation; avoid detailed species design |
| Distorted window/room shadow | 1–2 overlays | Suggests a much larger many-part form without showing a monster |
| Internal asset codename `S8` | 5 animation groups | Distant idle, hop, scuttle, short flight, hide/emerge; keep small and visually unexplained |
| `S8` hint gestures | 3 short actions | Look/point, leave trail, carry scrap; used by Quiet/Nudge/Lead modes |
| Footprint/trail marks | 3–4 decals | Ambiguous repeated marks; fade and support reduced-motion replacement |
| Mirror writing/reveal | 3 overlays | Normal reflection, backing scratches, A/B exchange; no real-time reflection required |
| Interaction highlights | 4 reusable overlays/VFX | Envelope, window, mirror, bookshelf; readable without colour alone |
| Function-map marks | 6 simple symbols | Pair with existing text labels for Diary, Guidance, Skills, Hero, Achievements, Novel |

### New required audio

| Asset | Quantity | Use |
| --- | --- | --- |
| Room ambience | 1 seamless loop | Quiet interior, nearly still air |
| Paper/envelope sounds | 3–4 one-shots | Shift, open, turn, new writing |
| Temporal/window tone | 1 loop + 2 transitions | Glowing mark and fracture; musical rather than alarming |
| Net sounds | 2–3 one-shots | Equip, sweep, gentle catch |
| Flock movement | 2 layers | Distant crossing and release |
| Mirror sounds | 2–3 one-shots | Scratch, glass resonance, silence cut |
| `S8` sounds | 3–4 restrained one-shots | Movement, landing, one indistinct call; no speech |
| Diary save response | 1 short cue | Reinforces explicit commit and room-light change |

No voice acting is required for MVP. Silence between note sounds is part of the atmosphere.

### Explicitly out of scope art

- Additional rooms, exterior locations, or alternate timelines.
- Visible character portraits or bodies for A and B.
- Full-screen cinematics.
- Real-time mirror reflection.
- A separate boss/monster design.
- Detailed creature customization or cosmetics.
- More than the current five Mood-light presets.

## 8. UI and accessibility

- Every handwritten note requires a clean, screen-reader-readable transcription.
- Never encode A/B identity only through colour or handwriting; add distinct author marks and text labels in transcription.
- Notes, net actions, guidance choice, Skip, and Replay must be keyboard and pointer accessible.
- Respect `prefers-reduced-motion`; disable rapid flocking, pulses, particles, and screen shake.
- Do not use flashing light. Stressed Mood lighting remains steady.
- Keep the existing direct Room Index so spatial navigation is never mandatory.
- Preserve explicit local-storage and AI-context explanations outside the fiction. Mystery must not obscure consent or data behaviour.
- The introduction must not describe the user as guilty, damaged, chosen, trapped, or under surveillance as fact.

## 9. Technical work areas

| Area | MVP change |
| --- | --- |
| `src/room/RoomGame.tsx` | Add Arrow Keys, onboarding scene state, narrative objects, net sequence, `S8` actor, and local hint actions |
| `src/components/LifeRoomApp.tsx` | Replace first-run help card with onboarding controller; retain concise Help, Skip, Replay, and Room Index access |
| `src/furniture/FurniturePanel.tsx` | Reuse Diary; add first-use explanation hooks without changing six-function behaviour |
| `src/domain/types.ts` | Add onboarding and guidance-mode types if stored in the main persisted state |
| `src/store/useLifeRoomStore.ts` | Persist/migrate onboarding state without modifying existing records; provide onboarding-only reset |
| New note/dialogue component | Render authored paper, clean transcription, focus trapping, and step advancement |
| New onboarding domain module | Define state transitions independently of rendering for focused tests |

The onboarding must not depend on `/api/guide`. The Little Crow AI remains optional and server-mediated.

## 10. Recommended implementation order

1. Add the onboarding state model, persistence migration, Skip, Replay, and tests.
2. Greybox envelope, window, net, mirror, and completion transitions with placeholder shapes.
3. Implement keyboard/pointer net play, no-fail assistance, and reduced-motion behaviour.
4. Connect the mirror beat to the existing Diary and verify save-to-light feedback.
5. Add six-function Room Index introduction and guidance preference.
6. Add final art, handwriting transcription, sound, and `S8` hint actions.
7. Run automated checks and complete hands-on keyboard, touch, visual, reduced-motion, offline, and persistence validation.

## 11. MVP acceptance criteria

1. The entire introduction occurs in the existing room and uses no second scene or location.
2. A is never identified as future, B as past, or the user as present in player-facing opening text.
3. The opening does not reveal the joke or explain/name the remaining form.
4. WASD, Arrow Keys, E, click/tap, Esc, Skip, and Room Index paths are usable as specified.
5. The net sequence has no score, punishment, hard failure, or mandatory fast motion.
6. A player can finish the introduction without providing personal writing.
7. An unsaved Diary draft causes no room change.
8. A successful Diary save closes the panel, changes lighting from the recorded Mood, marks the bookshelf, and shows the source date.
9. All six retained functions receive a clear purpose and user-control explanation.
10. No removed To-do, Calendar, or Main Quest function appears.
11. Quiet, Nudge, and Lead work locally and can be changed later.
12. Guidance behaviour does not edit or confirm any personal record.
13. Existing game-version records survive the onboarding data migration and Replay/Reset actions.
14. Handwritten content has accessible transcription and does not rely on colour alone.
15. Reduced-motion mode removes rapid movement, shake, and non-essential particles without blocking progress.
16. Offline use supports the complete opening, Diary save, function summary, and deterministic guidance.
17. `npm run typecheck`, `npm test`, and `npm run build` pass after implementation.

## 12. MVP boundary

This milestone builds the doorway into the guidance story. It does not write or implement the complete A/B plot, reveal the real temporal structure, explain the number eight, resolve the missing page, or show why the remaining form selected the user's present. Those are later narrative milestones and must remain compatible with the rules in `background.md`.

