# Life as a Room — Product Requirements Document

**Version:** 0.1
**Status:** MVP definition
**Platform:** Progressive Web App (PWA)
**MVP presentation:** Fixed-view 2D room

## 1. Product Summary

**Life as a Room** is a personal life-record and self-management PWA presented as a quiet, interactive dream room. A movable character represents the user. By approaching or selecting furniture, the user opens practical tools such as tasks, goals, a calendar, a success diary, skills, achievements, AI guidance, and a personal life novel.

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

- Life as a Room is not a role-playing game, life simulator, or virtual-pet game.
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
| **Bookshelf** | **Success Diary** | Records completed actions, small victories, reflections, and meaningful moments. |
| **Vision board** | **Main Quest** | Shows the user's most important long-term goals and their progress. |
| **Desk** | **To-do List** | Creates, organizes, schedules, completes, postpones, or archives practical actions. |
| **Mirror** | **AI Guidance** | A storybook-inspired talking mirror through which the dream's AI friend and observer speaks with the user. |
| **Plant** | **Skill Tree** | Represents skills and learning paths; visible plant growth reflects confirmed progress. |
| **Bed** | **Character / Hero** | Represents the dreamer and opens the user's identity, avatar, profile, current themes, strengths, and growth summary. |
| **Calendar** | **Calendar** | Displays events, dated tasks, milestones, and completed records by day. |
| **Achievement wall** | **Achievement Wall** | Displays confirmed milestones, memories, awards, and important life moments. |

The mapping must remain stable so users can build spatial memory.

## 6. Functional Requirements

### 6.1 Room / Life Novel

- Serve as the Home screen and persistent background for all major functions.
- Show the character, furniture states, and recent meaningful changes.
- Provide an entry to Life Novel chapters.
- Generate periodic chapters from confirmed tasks, diary entries, goals, skills, and achievements.
- Allow the user to edit, approve, regenerate, or delete AI-generated writing.
- Never present AI interpretation as fact without user confirmation.

### 6.2 Bookshelf / Success Diary

- Automatically offer to create an entry when a task is completed.
- Allow manual recording of victories, reflections, and important moments.
- Support date, related Main Quest, related skill, tags, and optional media.
- Allow entries to become source material for the Life Novel.
- Allow diary entries to be created, opened, and edited from their corresponding date in the Calendar.
- Keep Calendar and Bookshelf views synchronized so an edit in either location updates the same diary record.

### 6.3 Vision Board / Main Quest

- Create and edit long-term goals.
- Keep the number of active Main Quests intentionally small; the recommended maximum is three.
- Connect tasks, calendar milestones, skills, and diary entries to a Main Quest.
- Show progress through evidence and completed actions, not pressure or punishment.

### 6.4 Desk / To-do List

- Create, edit, schedule, complete, postpone, and archive tasks.
- Connect a task to a Main Quest, skill, or calendar date.
- Provide a low-friction quick-add action.
- Turn completed tasks into optional Success Diary entries.
- Avoid punitive overdue language.
- Allow tasks to be created, opened, edited, completed, postponed, or archived from the Calendar.
- Automatically carry an unfinished task from a previous day into the next day's To-do List.
- Carry forward the same task record rather than creating a duplicate.
- Preserve the task's original scheduled date and carryover history while showing it in the current day as “Carried forward.”
- Let the user reschedule, archive, or leave a carried-forward task active without penalty.

### 6.5 Mirror / AI Guidance

- Present the AI as a friend and gentle observer within the user's dream.
- Use a talking-mirror interaction inspired by familiar storybook conventions without copying a specific copyrighted character or visual design.
- Provide conversational guidance, goal clarification, task breakdown, and reflection prompts.
- Use the user's approved history to provide continuity.
- Ask more than command and avoid judgmental language.
- Require confirmation before saving memories, evaluations, or generated plans.
- Allow the user to inspect, edit, or delete saved AI memories.

### 6.6 Plant / Skill Tree

- Create, organize, and review skills and learning paths.
- Connect completed tasks and diary evidence to skills.
- Let AI suggest progress with an explanation.
- Require user confirmation before AI suggestions change skill progress.
- Reflect confirmed progress through gentle visual plant growth.

### 6.7 Bed / Character

- Display and edit the user's name, avatar, and profile.
- Establish the user as the dreamer whose life is represented by the room.
- Summarize current goals, skills, achievements, and recent growth.
- Represent identity and progress without health, energy, or combat statistics.
- Support deeper visual character customization in a future version.

### 6.8 Calendar

- Provide month and day views in the MVP.
- Create, edit, and remove events.
- Display dated tasks, Main Quest milestones, and completed actions.
- Link calendar items back to their related records.
- Allow the user to add and edit a free-form annotation for each date.
- Show unfinished tasks carried forward from previous days without duplicating the underlying task.
- Allow To-do List tasks to be created, opened, edited, completed, postponed, and archived from the selected date.
- Allow Success Diary entries to be created, opened, and edited from the selected date.
- Provide a clearly labeled link from each day view to the complete To-do List at the Desk.
- Synchronize Calendar edits immediately with the Desk and Bookshelf panels.

### 6.9 Achievement Wall

- Display meaningful confirmed milestones rather than repetitive badges.
- Allow achievements to be created manually or suggested by AI.
- Require user confirmation for AI-suggested achievements.
- Let achievements become Life Novel source material.

## 7. Overlay Interface Requirements

- Function pages open as centered or object-anchored translucent panels over the room.
- Panels must remain smaller than the viewport, with the room visible around their edges.
- Recommended maximum size is approximately `88vw × 82vh` on desktop and `92vw × 82vh` on mobile.
- Panels may use background blur, but text contrast must remain accessible.
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
- The nine defined room-element interactions.
- Translucent overlay panels for every core function.
- Local persistence and authenticated cloud synchronization.
- A complete core record loop:

```text
Create task
→ connect it to a goal or skill
→ complete it
→ create or confirm a Success Diary entry
→ update confirmed skill or goal progress
→ consider an achievement
→ add approved material to the Life Novel
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
| **Mirror / AI Guidance** | The AI friend appears and speaks through the mirror surface. |
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
- Core records should remain readable offline; changes made offline should synchronize when connectivity returns.

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
- Calendar changes update the same task and diary records shown at the Desk and Bookshelf.
- Users can annotate a date and reach the complete To-do List from the Calendar.
- An unfinished task appears on the next day as a carried-forward task without being duplicated or losing its original date.
- Users can complete the full task-to-Life-Novel record loop.
- Returning users can recognize meaningful changes created by their own records.
- The room feels calm and personal without being mistaken for a game that must be won.

## 14. Product Name Recommendation

**Recommended name:** **Life as a Room**

This is more natural in English than “Life as Room” and clearly expresses the central metaphor: a person's life is represented by a room that can be visited, understood, and gradually changed.

**Suggested tagline:** *A room shaped by the life you live.*
