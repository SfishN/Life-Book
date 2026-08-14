# Life as a Room - MVP Implementation Scheme

## 1. Product Goal

Build a 2D Progressive Web App that helps people record and improve their lives with an AI companion. It is a reflective life-recording space, not a game: there are no energy bars, movement points, combat systems, or task punishments.

The AI appears through the Mirror as a friendly observer inside the user's dream. It may help the user reflect and draft ideas, but it must never save an interpretation, achievement, skill change, or Life Novel passage without the user's approval.

## 2. Technical Structure

| Layer | Responsibility |
| --- | --- |
| Next.js and TypeScript | PWA shell, installability, UI, and server endpoint |
| Phaser | Fixed 2D room, character movement, proximity, and interaction |
| React | Transparent object-shaped panels and editable records |
| Zustand persistence | One shared local source of truth with offline retention |
| OpenAI Responses API | Optional server-side Mirror conversation |

Phaser controls the room, React controls panels, and the shared store controls records.

## 3. Main Experience

- Fill the viewport with one fixed 2D room in an original American-cartoon-inspired style.
- Keep a movable character visible in the room.
- Highlight a nearby interactive object and show `E - Open [object]`.
- Open each feature in a translucent panel smaller than the viewport, leaving the room visible.
- Pause character movement while a panel is open.
- Support direct clicking or tapping for pointer and touch users.

### Controls

| Control | Action |
| --- | --- |
| `W`, `A`, `S`, `D` | Move the character |
| `E` | Interact with the nearest object |
| `Q` | Close the active panel |
| `Esc` | Open the confirmed exit screen |
| Click or tap | Move toward a point or open an object |

## 4. Object Mapping

| Room object | Feature | MVP panel metaphor |
| --- | --- | --- |
| Desk | To-do List | Desk papers and checklist |
| Bookshelf | Success Diary | Open book |
| Vision board | Main Quest | Pinned cards |
| Mirror | AI Guidance | Reflective framed conversation |
| Plant | Skill Tree | Growing branches |
| Bed | Character/Hero | Dream profile card |
| Calendar | Calendar | Physical month sheet |
| Achievement wall | Achievements | Frames and keepsakes |
| Room | Life Novel/Home | Story fragments belonging to the room |

## 5. Shared Calendar Records

Calendar, Desk, and Bookshelf must edit the same records rather than copies.

From the Calendar, the user can:

- select a day;
- write a free-form annotation;
- create, edit, complete, or reschedule to-do items;
- create or edit Success Diary entries;
- create calendar events; and
- open the complete To-do List.

An incomplete task scheduled before today appears in today's list as `Carried forward`. It keeps the same ID and original date, so inheritance never creates duplicates. The user may complete or reschedule it without punitive language.

## 6. Record and Reflection Loop

```text
Create a Main Quest and Skill
-> create and schedule a task
-> complete it or carry it forward
-> optionally create a Success Diary entry
-> reflect with the Mirror
-> accept, edit, or reject AI suggestions
-> confirm Skill or Achievement growth
-> approve material for the Life Novel
-> return to a room that visibly remembers it
```

## 7. Core Data

- Hero profile
- To-do items with original and scheduled dates
- Day annotations
- Calendar events
- Main Quests
- Success Diary entries
- Skills
- Achievements and confirmation state
- Mirror messages
- Life Novel chapters

## 8. Delivery Order

1. Create the fixed room and character controls.
2. Add translucent object-inspired panel foundations.
3. Implement Desk, Vision Board, Plant, and Bookshelf records.
4. Connect Calendar annotations, events, tasks, diary entries, and Desk navigation.
5. Add unfinished-task carryover without duplication.
6. Add Bed/Hero, Achievement Wall, and Life Novel.
7. Add the optional Mirror AI endpoint with an offline fallback.
8. Add PWA manifest, service worker, local persistence, and responsive behavior.
9. Verify keyboard, pointer, touch, mobile layout, reduced motion, and production build.

## 9. MVP Acceptance Scenario

The user can move through the room; open every object; create quests, skills, and tasks; edit shared tasks and diary entries from the Calendar; annotate dates; see an earlier unfinished task carried into today without duplication; complete a task; reflect with the Mirror; confirm an Achievement; approve a Life Novel chapter; and return to a room that remembers progress.

## 10. Future Assumptions

- Panels should become more fully integrated with the physical appearance of each object.
- A desk radio may play music.
- A lamp may control Focus Mode.
- A store may allow furniture, decorations, and character appearance to change.
- Room rotation may be explored only if it improves the experience.
- Cloud accounts and private multi-device synchronization may be added behind the existing data boundary.

These are outside the MVP. The MVP remains one fixed, original 2D room.
