# Life Room — Product Requirements Document

**Version:** 0.4
**Status:** Current MVP definition
**Platform:** Progressive Web App (PWA)
**MVP presentation:** Fixed-view 2D room

## 1. Product Summary

**Life Room** is a personal life-record and self-management PWA presented as a quiet, interactive dream room. A movable character represents the user. By approaching or selecting room objects, the user opens practical tools for diary writing, skill records, achievements, an AI companion, personal attributes, and a personal life novel.

The room is not a game world. It is a visual record of the user's life. Actions, reflections, skills, and milestones gradually give the room more meaning.

The project also investigates how people record, understand, and improve themselves with long-term AI companionship. In this version, the AI appears inside the user's dream as a friend and gentle observer. It helps the user notice patterns and reflect without acting as a manager, judge, therapist, or authority.

**Product promise:** Your life becomes a room you can return to, understand, and grow over time.

## 2. Product Goals

- Make everyday planning and reflection calm, personal, and visually memorable.
- Connect short-term actions with long-term goals and personal growth.
- Let the user see their life history through the room and its objects.
- Provide fast, practical tools without feeling like a productivity dashboard.
- Support short daily visits and deeper weekly or monthly reflection.
- Work well on desktop and mobile as an installable PWA.

## 3. Non-Goals

- Life Room is not a role-playing game, life simulator, or virtual-pet game.
- There is no combat, health, energy bar, stamina, action-point system, or movement cost.
- The user is never punished for inactivity or missed tasks.
- Character movement is not limited by points, timers, or daily allowances.
- The MVP will not include room rotation, 3D graphics, a furniture store, or room decoration controls.

Room geometry may prevent the character from walking through walls or furniture, but movement itself is always free.

## 4. Core Experience

1. The user enters a fixed-view 2D room.
2. Their character is visible and can move using `W`, `A`, `S`, and `D`, with equivalent touch and mouse controls.
3. Interactive furniture is identifiable through subtle highlights and labels.
4. When the character is near an item, pressing `E` opens its related page. Mouse and touch users receive an equivalent visible interaction control.
5. The page appears as a translucent panel smaller than the viewport.
6. The room remains visible behind and around the panel.
7. Closing the panel returns the user to the same room position.

Character movement should add personality, not friction. Frequently used actions must remain quick, and users should not be forced to manually walk across the room for every small update.

### 4.1 Keyboard Controls

| Input | Action |
| --- | --- |
| `W`, `A`, `S`, `D` | Move the character up, left, down, and right. |
| `E` | Interact with a nearby furniture item or room element. |
| `Q` | Close the active function panel and return focus to the room. Unsaved work requires confirmation. |
| `Esc` | Start the app-exit flow. Confirm the exit and save pending local changes before attempting to close. |

Because a browser may prevent a PWA from closing its own window, `Esc` must close the app where the platform permits it. Otherwise, it must show a clear “Safe to close” exit screen and let the user close the browser tab or app window manually.

## 5. Room and Furniture Mapping

| Room element | Product function | Purpose |
| --- | --- | --- |
| **Room** | **Life Novel / Home** | The main interface and the cumulative visual record of the user's life. Opens the Life Novel overview and its chapters. |
| **Bookshelf** | **Diary / Skill Record** | Records moods, reflections, meaningful moments, and evidence of skill practice. |
| **Little Crow** | **AI Companion** | The room's small eight-legged crow listens, replies briefly, and carries the user's current exchange. |
| **Plant** | **Skill Tree** | Represents skills and learning paths; visible plant growth reflects confirmed progress. |
| **Bed** | **Profile** | Represents the dreamer and opens the user's identity, avatar, motto, attributes, and growth summary. |
| **Achievement wall** | **Achievement Wall** | Displays confirmed milestones, memories, awards, and important life moments. |

The mapping must remain stable so users can build spatial memory.

## 6. Functional Requirements

### 6.1 Room / Life Novel

- Serve as the Home screen and persistent background for all major functions.
- Show the character, furniture states, and recent meaningful changes.
- Provide an entry to Life Novel chapters.
- Let the user create a chapter by choosing a diary start date and end date.
- Show every diary entry found in the selected range and let the user include or exclude individual entries before generation.
- Save the exact source Diary IDs and source-update timestamps used for each generated chapter.
- Generate a chapter as a draft first; generation must never approve a chapter automatically.
- Let the user inspect source entries, edit the generated text, regenerate the same draft, or approve it.
- Clearly mark Draft and Approved chapters and preserve previously approved chapters.
- Allow the user to edit, approve, regenerate, or delete AI-generated writing.
- Never present AI interpretation as fact without user confirmation.

### 6.2 Bookshelf / Success Diary

- Provide two tabs: **Write diary** and **Skill record**.
- Allow manual recording of reflections, ordinary moments, victories, and important experiences.
- Ask the user to choose one Mood for a Diary entry: Calm, Happy, Neutral, Tired, or Stressed.
- Treat Mood as the single atmosphere value for the entry. There is no second atmosphere question in the interface.
- Saving the Diary commits the Mood and updates the room lighting from that Mood in the same operation.
- Unsaved Mood changes must not affect the room.
- This MVP starts a fresh Life Room record store; the product owner explicitly approved discarding the current development-only atmosphere records rather than migrating them.
- Support date, Mood, title, body, and related Skills.
- Allow entries to become source material for the Life Novel.
- Show recent Diary and Skill records and allow the original record to be opened and edited without duplication.

### 6.3 Vision Board / Main Quest

Main Quest is deferred and is not part of the current six-function MVP. The vision board may remain decorative and must not imply that an unavailable feature can be opened.

### 6.4 Desk / To-do List

To-do List is deferred and is not part of the current six-function MVP. The desk may remain decorative.

### 6.5 Little Crow / AI Companion

- Present the AI through the Little Crow as a friend and gentle observer within the user's dream.
- Keep the mirror decorative after onboarding; it is not an AI entry point and has no standard click panel.
- Open a scene-like companion view with the Crow illustration and its current reply in one large speech bubble, not the standard oval furniture panel.
- Show the user's input and the day's earlier exchanges in a right-side conversation rail. The Crow's large bubble shows only the current reply; when the user asks again, the previous exchange moves into the rail.
- Begin with `...`, limit every Crow response to 55 words and three sentences, and retain conversation history only for the current local day.
- Provide conversational guidance, goal clarification, task breakdown, and reflection prompts.
- Use the user's approved history to provide continuity.
- Ask more than command and avoid judgmental language.
- Require confirmation before saving memories, evaluations, or generated plans.
- Allow the user to inspect, edit, or delete saved AI memories.
- Keep **Include room records** off by default. Only include saved Profile, Diary, Skill, Achievement, and room-lighting context in the current request when the user explicitly enables it.

### 6.6 Plant / Skill Tree

- Create, organize, and review skills and learning paths.
- Let the user save a Skill Record containing date, selected skill, practice description, optional duration, and perceived difficulty.
- Allow a Skill Record to link to an existing Diary entry without duplicating the Diary text.
- Derive visible progress such as `3 / 5` from linked, user-saved Skill Records and explain the contributing records through **Why this progress?**.
- Connect completed tasks and diary evidence to skills.
- Let AI suggest progress with an explanation.
- Require user confirmation before AI suggestions change skill progress.
- Reflect confirmed progress through gentle visual plant growth.

### 6.7 Bed / Character

- Display and edit the user's name, gender preference, motto, and profile.
- Derive the room character from Gender instead of offering a separate avatar selector: Male uses the boy character; Female, Non-binary, and Prefer not to say use the girl character.
- Let the user add and remove personal Attributes and show their user-confirmed levels in a radar chart.
- AI may suggest Attribute evidence but must not silently change an Attribute level.
- Establish the user as the dreamer whose life is represented by the room.
- Summarize current goals, skills, achievements, and recent growth.
- Represent identity and progress without health, energy, or combat statistics.
- Support deeper visual character customization in a future version.

### 6.8 Calendar

Calendar is deferred and is not part of the current six-function MVP. Diary and Skill Record dates remain available inside their own panels.

### 6.9 Achievement Wall

- Display meaningful confirmed milestones rather than repetitive badges.
- Allow achievements to be created manually or suggested by AI.
- Require user confirmation for AI-suggested achievements.
- Separate **Pinned** achievements from **AI suggestions**.
- Let the user Pin, Unpin, or Dismiss a suggestion while preserving its source link and avoiding repeated dismissed suggestions.
- Let achievements become Life Novel source material.

## 7. Overlay Interface Requirements

- Function pages open as centered or object-anchored translucent panels over the room.
- Panels must remain smaller than the viewport, with the room visible around their edges.
- Recommended maximum size is approximately `88vw × 82vh` on desktop and `92vw × 82vh` on mobile.
- Panels may use background blur, but text contrast must remain accessible.
- The Little Crow companion is the deliberate exception to the standard panel shell: it uses a full-viewport frosted scene while keeping the room visibly blurred behind it.
- Long content scrolls inside the panel; the room itself does not scroll underneath it.
- Opening and closing animations should be brief and support reduced-motion preferences.
- Every panel must be closable by `Q`, a visible Close control, or tapping outside where appropriate.
- Pressing `Q` closes the active panel and returns focus to the room; `Esc` is reserved for the app-exit flow.
- Core functions must also be keyboard accessible and available through an optional compact navigation menu.
- Even in the MVP, each panel should use a subtle visual motif from its furniture rather than appearing as a generic dashboard or business website.
- Practical readability and accessibility take priority over decorative resemblance.

## 8. MVP Visual Direction

- Use an original **American-cartoon-inspired 2D animation style**.
- Favor expressive silhouettes, clean line art, readable shapes, warm colors, and gentle squash-and-stretch animation.
- Keep the room cozy, personal, and suitable for reflective use rather than visually resembling an action game.
- Use a consistent original art direction; do not imitate a specific studio, series, artist, or protected character design.
- Furniture must remain recognizable and interactive at both desktop and mobile sizes.
- Character and furniture animation should reinforce meaning without delaying practical actions.

## 9. MVP Scope

The MVP includes:

- An installable PWA.
- One fixed-view 2D room with no camera rotation.
- One movable 2D character.
- `W`, `A`, `S`, and `D` keyboard movement, with equivalent click/tap movement controls.
- Proximity interaction using the `E` key, with equivalent touch and mouse controls.
- `Q` to close an active function panel.
- `Esc` to start the confirmed app-exit flow, with a browser-compatible exit-screen fallback.
- Original American-cartoon-inspired 2D character, room, furniture, and animation assets.
- The six defined room-element interactions.
- Translucent overlay panels for every core function.
- Browser-local persistence. The current MVP has no account system or cloud synchronization.
- A complete core record loop:

```text
Write a Diary entry or Skill Record
→ save the chosen Mood and update the room light
→ review linked Skill evidence
→ pin a meaningful Achievement when appropriate
→ choose a Diary date range for Life Novel
→ generate, review, and approve a chapter
```

The MVP should prioritize a clear, reliable record loop over elaborate animation or decoration.

## 10. Future Scope

- **Desk radio:** play user-selected music or ambient sound.
- **Desk lamp:** enter and adjust Focus Mode for a selected task.
- **Furniture customization:** replace furniture, colors, materials, and decorative objects.
- **Furniture store or catalogue:** obtain new room items; pricing and real-money use remain undecided.
- Character clothing and appearance customization.
- Seasonal room themes and meaningful visual changes based on confirmed records.
- Optional room rotation after usability testing; rotation is not assumed to be necessary.
- Additional rooms only if they improve clarity rather than fragmenting navigation.
- Replace simplified MVP panels with richer **diegetic object interfaces** that visually behave like the furniture itself rather than conventional website pages.

### 10.1 Future Object-Interface Assumption

The long-term interface should feel as though the user is interacting with each object directly:

| Object | Future interface assumption |
| --- | --- |
| **Desk / To-do List** | Tasks appear as papers, cards, or a notebook arranged on the desk. |
| **Bookshelf / Success Diary** | Diary entries appear as books and readable open-book pages. |
| **Vision board / Main Quest** | Goals appear as pinned notes, images, strings, and progress markers on the board. |
| **Little Crow / AI Companion** | The Crow appears as an illustrated room character with one current speech bubble and a separate one-day conversation rail. |
| **Plant / Skill Tree** | Skills appear as stems, branches, leaves, flowers, or fruit that respond to confirmed growth. |
| **Bed / Character** | Character identity appears through a dream journal, quilt, bedside portrait, or dreamlike profile scene. |
| **Calendar** | Dates, annotations, tasks, and diary links appear as marks and notes on a physical wall calendar. |
| **Achievement wall** | Achievements appear as framed memories, medals, photographs, or meaningful objects on the wall. |
| **Room / Life Novel** | Life Novel chapters are experienced through changes, memories, and story fragments embedded throughout the room. |

The MVP may use simplified translucent panels, but its data, routing, and feature logic must remain separate from panel presentation. This allows each panel to be replaced by a richer object interface later without rewriting the underlying feature.

Future customization must not hide, rename, or break the learned relationship between furniture and functions.

## 11. Data and Privacy Requirements

- User records are private by default.
- AI receives only the context necessary for the requested function.
- AI-generated memories, evaluations, achievements, and novel passages require user control.
- Users can export and delete their data.
- Core records should remain readable offline. Cloud synchronization is future scope and must not be implied until accounts, conflict resolution, deletion, and recovery have been implemented and verified.
- Current personal records use the `life-room-v1` browser-local namespace; onboarding uses `life-room-onboarding-v1`; temporary drafts use the `life-room-draft:` prefix.
- The 2026-10-17 development reset is an explicitly approved one-time exception because the previous local records contained no useful user data. No automatic legacy-atmosphere migration is included.
- After this reset, future schema or namespace changes must preserve stable IDs, timestamps, Diary content, Skill links, confirmed Achievements, Guide messages, Life Novel chapters, onboarding state, and room-lighting state unless the product owner explicitly authorizes another reset.
- The OpenAI credential must exist only as the server-side `OPENAI_API_KEY` environment variable. It must never be embedded in client JavaScript, committed to Git, stored in localStorage, or returned by an API response.
- The current MVP remains browser-local: each browser has its own Life Room, and clearing browser data can remove it until export or cloud sync is implemented.

## 12. Accessibility and Usability

- Furniture interactions must have labels and non-visual alternatives.
- Support mouse, touch, and keyboard navigation.
- Never require the `E` key as the only interaction method; provide accessible mouse, touch, and keyboard alternatives.
- Provide visible alternatives for `Q` and `Esc`, including panel Close and app Exit controls.
- Do not rely on color alone to communicate interactive states.
- Provide readable typography, sufficient contrast, and reduced-motion support.
- The user should understand the main furniture mappings within three minutes.
- A task should be addable or completable in only a few interactions.

## 13. MVP Success Criteria

The MVP is successful when:

- Users understand that the room is both Home and a record of their life.
- Users can move the character without any energy or movement restrictions.
- Every core page opens from its assigned room element.
- A nearby object can be opened with `E`, and the equivalent control works with touch or mouse.
- The character responds correctly to `W`, `A`, `S`, and `D`; `Q` closes panels; and `Esc` begins a safe exit flow.
- Every page remains readable while the room stays visibly present.
- Users can save a Diary Mood and see the corresponding room light after Save.
- Users can create a Skill Record and inspect why it contributes to visible Skill progress.
- Users can pin or dismiss an Achievement suggestion without altering its source record.
- Users can choose a Diary date range, select exact source entries, generate a Life Novel Draft, inspect its sources, and approve it.
- Users can complete the full Diary-to-Life-Novel record loop.
- Returning users can recognize meaningful changes created by their own records.
- The room feels calm and personal without being mistaken for a game that must be won.

## 14. Official Product Name

**Official name:** **Life Room**

The former working title is retired from product-facing copy. **Life Room** is the name used in the interface, metadata, install manifest, documentation, and future releases. The room remains the central metaphor: a person's life can be visited, understood, and gradually changed through their own records.

**Suggested tagline:** *A room shaped by the life you live.*
