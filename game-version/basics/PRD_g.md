# Life Room — Game Version PRD_g

Version: g0.1  
Date: 2026-08-30  
Status: Current implementation scope; background story deferred  
Project folder: `game-version/`  
Local URL: http://localhost:3001

## 1. Product concept

A personal room that becomes more visible and expressive when its user records their life. Diary entries are the primary input. Saving an entry produces an immediate, understandable change in the room, including lighting based on the Mood the user chose for that entry.

The AI remains a companion and gentle guide. The room also retains Skill Tree, Achievement Wall, Hero, and Life Novel functions. The game direction emphasizes exploration, spatial interaction, personal memories, and visual feedback rather than a productivity dashboard.

Product promise: **Write a day. Save a moment. See your room respond.**

This PRD supersedes the inherited room-version scope only inside game-version. The original room-version folder and its records must remain unchanged.

## 2. Confirmed decisions

- Copy the complete current room-version folder to game-version; develop only in game-version.
- Use port 3001 for both development and production start scripts.
- Keep exactly six primary functions: Diary, AI Companion, Skill Tree, Achievement Wall, Hero, and Life Novel.
- Remove To-do List, Calendar, and Main Quests from active navigation, hotspots, data, and AI context.
- User-chosen Mood influences room lighting.
- Apply room changes when a diary is explicitly saved, never while typing or selecting Mood in a draft.
- Retain AI companionship.
- Discuss background, traveler identity, space-base setting, and authored story later.
- Do not add a puzzle prologue or choose a story in this milestone.

## 3. Goals

1. Make the connection between diary input and visual output obvious.
2. Keep the room visible and meaningful, not merely a menu for unrelated tools.
3. Reduce the number of functions without removing the six selected functions.
4. Preserve user control over reflections, progress, achievements, and generated writing.
5. Maintain a working local prototype independent of room-version.

## 4. Six functions and furniture

| Function | Room access | Required behavior |
| --- | --- | --- |
| Diary | Bookshelf and direct Diary button | Create, read, edit, date, and explicitly save entries; choose a Mood; optionally associate a skill. |
| AI Companion | Little Crow and direct Room index button | Support brief reflection and conversational continuity; optional saved-record context; clearly identify local fallback responses. The mirror is decorative outside the introduction. |
| Skill Tree | Plant | Create skills, adjust user-confirmed progress, and review diary evidence linked to a skill. |
| Achievement Wall | Wall frames | Create meaningful achievements and confirm suggested candidates. |
| Hero | Bed / bedside profile | Edit name, gender, current theme, and self-reflection. Character art is derived from Gender: Male uses the boy character; all other choices use the girl character. |
| Life Novel | Room / Room index | Generate an editable draft from saved material, approve a chapter, and revisit saved chapters. |

Keep furniture geometry and the existing room artwork for this milestone. The old Calendar, vision board, and desk may remain decorative elements; they no longer open removed tools.

All six functions must also be available through a labeled Room index. Movement must not be required for access.

## 5. Core journey

1. Enter the room and see the last saved atmosphere, or neutral light for a new game.
2. Open Diary from the bookshelf, header button, or Room index.
3. Write an entry, choose its date, and record one Mood.
4. Read a short explanation of what the chosen Mood will do to the light.
5. Select **Save diary & see room**.
6. Save the entry and its atmosphere state together in this version's local record.
7. Close the diary panel automatically so the result is visible.
8. Transition room lighting and briefly highlight the bookshelf.
9. Show a textual save confirmation and the date/Mood responsible for the light.
10. Reopen the diary to read or explicitly edit an entry; reload to restore the saved room.

A successful edit follows the same flow with **Save changes & see room**. Draft changes must not alter the committed diary, room Mood, or save-feedback revision.

## 6. Diary requirements

### Input

- Body: required; whitespace-only entries cannot be saved.
- Title: optional; use a short excerpt of the body if omitted.
- Date: required, defaults to the local current date, and must be a valid calendar date.
- Mood: manually selected from Calm, Happy, Neutral, Tired, or Stressed; default to Neutral for a new entry.
- Mood is the single diary atmosphere value and controls room lighting after Save. Do not ask for a second atmosphere value.
- Related skill: optional, selected from existing skills.
- Difficult, uneventful, and positive experiences are equally valid diary content.

### Save and editing

- Validate before changing committed records.
- Persist Mood on each diary entry.
- Saving an existing entry updates that record without creating a duplicate.
- Preserve the original creation timestamp on edits.
- An explicit save is required for edits; do not write through on every keystroke.
- Retain unsaved fields as separate temporary drafts for up to seven days.
- Keep the draft and show a clear error if browser storage rejects the diary save.
- A save increments a room-feedback revision even if the selected Mood is unchanged.
- Diary saves do not automatically award skill progress or achievements.

### Which saved Mood controls the room?

The **most recently successfully saved entry** controls the room's lighting, including when the user edits or backdates an entry. The room displays that entry's date, so an older entry's Mood is not presented as today's Mood.

Multiple entries for the same date may record different Moods; the last successful save takes precedence. Reload restores the committed atmosphere and must not recompute it from array order or the current date.

There is no automatic midnight reset, external-condition lookup, geolocation, or sentiment-based Mood inference. Mood is always chosen by the user.

## 7. Mood-to-light mapping

| Recorded Mood | Room response |
| --- | --- |
| Calm | Soft lavender-neutral daylight with low contrast and a quiet lamp. |
| Happy | Brighter warm color, golden window light, and a less prominent lamp. |
| Neutral | Gentle balanced room light with no dramatic tint. |
| Tired | Cooler blue daylight with a warm, supportive pool of lamplight. |
| Stressed | Deeper muted violet-blue light and a steady, prominent warm lamp. No flashing or alarming effects. |

### Fresh Mood baseline

This MVP starts with the approved fresh `life-room-v1` record store. It does not import or convert development-only atmosphere values. Future schema changes must preserve Mood, record IDs, text, dates, timestamps, skill links, and the atmosphere source entry.

These are artistic lighting presets, not an assessment of emotional health. Every Mood remains valid and has no effect on access or progress.

Keep interfaces readable independently of the scene lighting. Provide names and explanations as well as colors.

## 8. Other room feedback

- Each new diary adds a small visible book marker to the shelf, up to a bounded display of twelve; all diary entries remain in the archive.
- A successful save briefly glows at the bookshelf, including edits and repeated Mood choices.
- Saved diary count and room memory feedback remain visible through labeled UI.
- Confirmed achievements and saved chapters continue to contribute to the inherited room memory effect.
- Prefer reduced-motion behavior when requested by the operating system: apply lighting directly without pulsing or moving particles.
- Do not simulate decay, loneliness, or damage after inactivity.
- Do not reward or punish any Mood with progress changes.

This milestone reuses the existing bitmap and adds controlled light layers and small canvas marks. Fully separated furniture illustrations, extensive animation, decoration systems, and generated room images remain future work.

## 9. AI companionship

- Keep a warm, non-judgmental companion in the Little Crow.
- Open a scene-like interface with the Crow illustration, one large current-reply bubble, and a right-side rail for the user's input and earlier exchanges.
- Start the large bubble with `...`; keep each reply to no more than 55 words and three sentences.
- Retain only the current local day's conversation. A new question moves the previous Crow reply into the Today rail.
- Use recent same-day conversational context for continuity.
- Share saved Diary, Hero, Skill, confirmed Achievement, and room-Mood context only when the user checks the explicit context option.
- Do not send removed To-do, Calendar, or Main Quest records.
- Do not infer or overwrite Mood from the user's writing.
- Do not invent the A/B background story, timeline facts, crimes, or explanations for the Crow during ordinary companion chat.
- AI conversation cannot directly change the room, skill progress, achievements, or approved writing.
- Do not invent memories or claim external actions.
- Keep provider calls server-side and retain the clearly labeled local fallback when no provider key is configured.
- Diary saving and Mood lighting must work without AI or a network response.

This is a reflective game prototype, not therapy, diagnosis, or emergency care. The companion must not encourage dependence or emotional exclusivity.

## 10. Retained growth and narrative functions

### Skill Tree

Users create skills and explicitly adjust confirmed progress. A diary may link to a skill as readable evidence without automatically changing its progress. No task completion dependency remains.

### Achievement Wall

Users create or confirm meaningful milestones. Saving an ordinary diary entry alone does not create an achievement or score its value.

### Hero

Keep editable identity and self-reflection fields, without imposing the deferred story background. No health, stamina, combat, or mandatory leveling is introduced.

### Life Novel

Let the user choose a Diary start date and end date, inspect the entries found in that range, and include or exclude individual entries. Store the selected source IDs and their update timestamps with the generated Draft. Regeneration updates the Draft; only **Approve chapter** makes it an approved chapter. Drafting may use saved Diary material, Mood, Profile themes, Skills, and confirmed Achievements.

Keep authored background fiction distinct from the user's Life Novel. Background fiction is deferred; the user's writing remains accessible now.

## 11. Technical and data boundaries

- Preserve the existing Next.js / React / TypeScript / Phaser / Zustand structure and npm lockfile.
- Development: `npm run dev` -> port 3001.
- Production: `npm run build`, then `npm run start` -> port 3001.
- Use `.next-game/` for new generated output, independent of copied room-version build artifacts.
- Use the `life-room-*` namespace for new persisted records, drafts, onboarding state, and PWA cache identity.
- Treat previous production keys as read-only migration sources until every record and temporary draft has been copied and verified.
- Do not remove a previous key during the same transaction that creates migrated data; retain it as a rollback source until the new store has loaded successfully.
- Use the **Life Room** PWA name, cache namespace, and manifest identity.
- Keep the existing local-only prototype behavior; no account, cloud backup, or sync is added.

A DiaryEntry contains id, date, title, body, Mood, optional skill links, createdAt, and updatedAt.

RoomAtmosphere contains Mood, sourceEntryId, sourceDate, and revision. Persist it alongside the Diary so the source and visual state remain consistent.

## 12. Privacy and accessibility

- Clearly explain that records are local to this browser/origin and are not cloud-backed up.
- Retain control over what saved context is sent to AI.
- No external atmosphere API or location permission is needed.
- Keep buttons, Mood choices, forms, and Room index accessible by keyboard.
- Pause character input while a panel or menu is open so writing cannot move the Hero.
- Support click/tap navigation and labeled non-canvas controls.
- Do not communicate a save or Mood state only with color or motion.
- Confirm destructive game resets and restrict them to game-version keys.
- Complete export/deletion controls and broader privacy review are still required before a public release using personal diary data; this task does not authorize deployment.

## 13. Acceptance criteria

1. room-version source files remain byte-for-byte unchanged by this task.
2. game-version contains the copied project and this new PRD_g.md.
3. Both development and production start scripts use port 3001.
4. Navigation and room hotspots expose exactly the six retained functions.
5. To-do, Calendar, and Main Quest modules are not active in the game data or AI context.
6. Each supported Mood maps to a distinct documented lighting preset.
7. Typing, selecting Mood, closing, and reopening an unsaved draft do not change the saved room.
8. A valid diary save commits the record, Mood, source date, and increased revision; the panel closes and confirms the visual response.
9. An edit preserves the entry id and count while updating the room on explicit Save.
10. Saving an identical Mood still gives save feedback.
11. Backdated saves show the correct source date and control the room by the latest-save rule.
12. Reload restores the committed diary and atmosphere, not an unsaved draft Mood.
13. Blank or invalid-date entries fail validation without changing the room.
14. Failure to persist a diary keeps the draft and does not apply a new room state.
15. The six retained functions remain usable without removed task/goal dependencies.
16. No story setting or puzzle prologue is introduced.
17. Type checking, focused automated tests, and the production build pass.
18. Browser usability, visual Mood differentiation, and reduced-motion presentation need a separate hands-on validation before claiming user-tested quality.

## 14. Deferred discussion

- Story background and the user's fictional role.
- Puzzle onboarding, puzzle mechanics, and authored story length.
- How the authored prologue hands over to the user's personal story.
- Richer furniture transformation, music, and ambient sound.
- AI-generated Life Novel chapters.
- Accounts, cloud synchronization, full export/delete controls, and public release.

The next conversation about the background must not silently change the six retained functions or the explicit diary-save rule.
