# Life as a Room — Game Version PRD_g

Version: g0.1  
Date: 2026-08-30  
Status: Current implementation scope; background story deferred  
Project folder: `game-version/`  
Local URL: http://localhost:3001

## 1. Product concept

A personal room that becomes more visible and expressive when its user records their life. Diary entries are the primary input. Saving an entry produces an immediate, understandable change in the room, including lighting based on the weather the user recorded for that day.

The AI remains a companion and gentle guide. The room also retains Skill Tree, Achievement Wall, Hero, and Life Novel functions. The game direction emphasizes exploration, spatial interaction, personal memories, and visual feedback rather than a productivity dashboard.

Product promise: **Write a day. Save a moment. See your room respond.**

This PRD supersedes the inherited room-version scope only inside game-version. The original room-version folder and its records must remain unchanged.

## 2. Confirmed decisions

- Copy the complete current room-version folder to game-version; develop only in game-version.
- Use port 3001 for both development and production start scripts.
- Keep exactly six primary functions: Diary, AI Guidance, Skill Tree, Achievement Wall, Hero, and Life Novel.
- Remove To-do List, Calendar, and Main Quests from active navigation, hotspots, data, and AI context.
- User-entered weather influences room lighting.
- Apply room changes when a diary is explicitly saved, never while typing or selecting weather in a draft.
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
| Diary | Bookshelf and direct Diary button | Create, read, edit, date, and explicitly save entries; record weather; optionally associate a skill. |
| AI Guidance | Mirror | Support reflection and conversational continuity; optional saved-record context; clearly identify local fallback responses. |
| Skill Tree | Plant | Create skills, adjust user-confirmed progress, and review diary evidence linked to a skill. |
| Achievement Wall | Wall frames | Create meaningful achievements and confirm suggested candidates. |
| Hero | Bed / bedside profile | Edit name, pronouns, current theme, and self-reflection. |
| Life Novel | Room / Room index | Generate an editable draft from saved material, approve a chapter, and revisit saved chapters. |

Keep furniture geometry and the existing room artwork for this milestone. The old Calendar, vision board, and desk may remain decorative elements; they no longer open removed tools.

All six functions must also be available through a labeled Room index. Movement must not be required for access.

## 5. Core journey

1. Enter the room and see the last saved atmosphere, or neutral light for a new game.
2. Open Diary from the bookshelf, header button, or Room index.
3. Write an entry, choose its date, and record that day's weather.
4. Read a short explanation of what the chosen weather will do to the light.
5. Select **Save diary & see room**.
6. Save the entry and its atmosphere state together in this version's local record.
7. Close the diary panel automatically so the result is visible.
8. Transition room lighting and briefly highlight the bookshelf.
9. Show a textual save confirmation and the date/weather responsible for the light.
10. Reopen the diary to read or explicitly edit an entry; reload to restore the saved room.

A successful edit follows the same flow with **Save changes & see room**. Draft changes must not alter the committed diary, room weather, or save-feedback revision.

## 6. Diary requirements

### Input

- Body: required; whitespace-only entries cannot be saved.
- Title: optional; use a short excerpt of the body if omitted.
- Date: required, defaults to the local current date, and must be a valid calendar date.
- Weather: manually selected from the supported choices, defaulting to Not recorded.
- Related skill: optional, selected from existing skills.
- Difficult, uneventful, and positive experiences are equally valid diary content.

### Save and editing

- Validate before changing committed records.
- Persist weather on each diary entry.
- Saving an existing entry updates that record without creating a duplicate.
- Preserve the original creation timestamp on edits.
- An explicit save is required for edits; do not write through on every keystroke.
- Retain unsaved fields as separate temporary drafts for up to seven days.
- Keep the draft and show a clear error if browser storage rejects the diary save.
- A save increments a room-feedback revision even if the selected weather is unchanged.
- Diary saves do not automatically award skill progress or achievements.

### Which day's weather controls the room?

The **most recently successfully saved entry** controls the room's lighting, including when the user edits or backdates an entry. The room displays that entry's date, so an older day's weather is not presented as today's weather.

Multiple entries for the same date may record different weather observations; the last successful save takes precedence. Reload restores the committed atmosphere and must not recompute it from array order or the current date.

There is no automatic midnight reset, weather-service lookup, geolocation, or sentiment-based weather inference.

## 7. Weather-to-light mapping

| Recorded weather | Room response |
| --- | --- |
| Not recorded | Gentle neutral room light. |
| Sunny | Brighter warm color, golden light from the window, less prominent lamp. |
| Cloudy | Muted cool daylight, softer shadows, gently visible lamp. |
| Rainy | Cooler blue daylight with a contrasting warm pool of lamplight. |
| Snowy | Pale reflected window light with a soft warm lamp. |
| Foggy | Diffused silver light and reduced contrast. |
| Stormy | Deeper violet-blue light and a steady, more prominent warm lamp. No flashing or lightning. |

These are artistic lighting presets, not a physical weather simulation or an assessment of emotion. The user may choose Not recorded without losing access to any function.

Keep interfaces readable independently of the scene lighting. Provide names and explanations as well as colors.

## 8. Other room feedback

- Each new diary adds a small visible book marker to the shelf, up to a bounded display of twelve; all diary entries remain in the archive.
- A successful save briefly glows at the bookshelf, including edits and repeated weather choices.
- Saved diary count and room memory feedback remain visible through labeled UI.
- Confirmed achievements and saved chapters continue to contribute to the inherited room memory effect.
- Prefer reduced-motion behavior when requested by the operating system: apply lighting directly without pulsing or moving particles.
- Do not simulate decay, loneliness, or damage after inactivity.
- Do not punish rainy or stormy weather with lost progress.

This milestone reuses the existing bitmap and adds controlled light layers and small canvas marks. Fully separated furniture illustrations, extensive animation, decoration systems, and generated room images remain future work.

## 9. AI companionship

- Keep a warm, non-judgmental companion in the Mirror.
- Use recent conversational context for continuity.
- Share saved Diary, Hero, Skill, confirmed Achievement, and room-weather context only when the user checks the explicit context option.
- Do not send removed To-do, Calendar, or Main Quest records.
- Do not infer emotional state from physical weather.
- Do not invent the background story or characterize the user as a traveler or space explorer yet.
- AI conversation cannot directly change the room, skill progress, achievements, or approved writing.
- Do not invent memories or claim external actions.
- Keep provider calls server-side and retain the clearly labeled local fallback when no provider key is configured.
- Diary saving and weather effects must work without AI or a network response.

This is a reflective game prototype, not therapy, diagnosis, or emergency care. The companion must not encourage dependence or emotional exclusivity.

## 10. Retained growth and narrative functions

### Skill Tree

Users create skills and explicitly adjust confirmed progress. A diary may link to a skill as readable evidence without automatically changing its progress. No task completion dependency remains.

### Achievement Wall

Users create or confirm meaningful milestones. Saving an ordinary diary entry alone does not create an achievement or score its value.

### Hero

Keep editable identity and self-reflection fields, without imposing the deferred story background. No health, stamina, combat, or mandatory leveling is introduced.

### Life Novel

Keep the inherited editable local drafting and approval workflow. Drafting uses saved diary material, weather, Hero themes, skills, and confirmed achievements instead of removed goals/tasks. The current generator is a local template, not a model-generated novel. Full AI chapter generation is a later enhancement, not a claim of this milestone.

Keep authored background fiction distinct from the user's Life Novel. Background fiction is deferred; the user's writing remains accessible now.

## 11. Technical and data boundaries

- Preserve the existing Next.js / React / TypeScript / Phaser / Zustand structure and npm lockfile.
- Development: `npm run dev` -> port 3001.
- Production: `npm run build`, then `npm run start` -> port 3001.
- Use `.next-game/` for new generated output, independent of copied room-version build artifacts.
- Use a separate persistent key: `life-as-a-room-game-v1`.
- Use a separate temporary draft prefix: `life-as-a-room-game-draft:`.
- Use a game-specific PWA name, cache namespace, and manifest identity.
- Browser records from room-version are not copied, migrated, or deleted.
- Keep the existing local-only prototype behavior; no account, cloud backup, or sync is added.

A DiaryEntry contains id, date, title, body, weather, optional skillId, createdAt, and updatedAt.

RoomAtmosphere contains weather, sourceEntryId, sourceDate, and revision. Persist it alongside the diary so the source and visual state remain consistent.

## 12. Privacy and accessibility

- Clearly explain that records are local to this browser/origin and are not cloud-backed up.
- Retain control over what saved context is sent to AI.
- No automatic weather API or location permission is needed.
- Keep buttons, weather choices, forms, and Room index accessible by keyboard.
- Pause character input while a panel or menu is open so writing cannot move the Hero.
- Support click/tap navigation and labeled non-canvas controls.
- Do not communicate a save or weather state only with color or motion.
- Confirm destructive game resets and restrict them to game-version keys.
- Complete export/deletion controls and broader privacy review are still required before a public release using personal diary data; this task does not authorize deployment.

## 13. Acceptance criteria

1. room-version source files remain byte-for-byte unchanged by this task.
2. game-version contains the copied project and this new PRD_g.md.
3. Both development and production start scripts use port 3001.
4. Navigation and room hotspots expose exactly the six retained functions.
5. To-do, Calendar, and Main Quest modules are not active in the game data or AI context.
6. Each supported weather choice maps to a distinct documented lighting preset.
7. Typing, selecting weather, closing, and reopening an unsaved draft do not change the saved room.
8. A valid diary save commits the record, weather, source date, and increased revision; the panel closes and confirms the visual response.
9. An edit preserves the entry id and count while updating the room on explicit Save.
10. Saving identical weather still gives save feedback.
11. Backdated saves show the correct source date and control the room by the latest-save rule.
12. Reload restores the committed diary and atmosphere, not unsaved draft weather.
13. Blank or invalid-date entries fail validation without changing the room.
14. Failure to persist a diary keeps the draft and does not apply a new room state.
15. The six retained functions remain usable without removed task/goal dependencies.
16. No story setting or puzzle prologue is introduced.
17. Type checking, focused automated tests, and the production build pass.
18. Browser usability, visual weather differentiation, and reduced-motion presentation need a separate hands-on validation before claiming user-tested quality.

## 14. Deferred discussion

- Story background and the user's fictional role.
- Puzzle onboarding, puzzle mechanics, and authored story length.
- How the authored prologue hands over to the user's personal story.
- Richer furniture transformation, music, and ambient sound.
- AI-generated Life Novel chapters.
- Accounts, cloud synchronization, full export/delete controls, and public release.

The next conversation about the background must not silently change the six retained functions or the explicit diary-save rule.
