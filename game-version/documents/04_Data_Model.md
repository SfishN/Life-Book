# Data Model - MVP

## Ownership

All MVP records belong to the current local user profile and are persisted together in the browser. Calendar, Desk, and Bookshelf query the same store.

## Entities

| Entity | Important fields | Relationships |
| --- | --- | --- |
| `HeroProfile` | name, pronouns, life theme, self-note | One per local room |
| `Todo` | title, status, original date, scheduled date, quest ID, skill ID, timestamps | May link to one Quest, Skill, and Diary entry |
| `MainQuest` | title, intention, progress, active | Has many linked Todos |
| `Skill` | name, progress, evidence | Has many linked Todos/Diary evidence |
| `DiaryEntry` | date, title, body, Todo ID, Skill ID, Quest ID | May be created independently or from a completed Todo |
| `DayAnnotation` | date, text | One value per calendar date |
| `CalendarEvent` | date, title | Belongs to one date |
| `Achievement` | title, description, date, confirmed | User confirmation controls permanence |
| `GuideMessage` | role, content, source, timestamp | Ordered Mirror conversation |
| `LifeNovelChapter` | title, body, approved, updated timestamp | Only approved text is treated as lasting narrative |

## Core Relationships

```text
MainQuest 1 <- 0..* Todo 0..1 -> Skill
                       |
                       v
                  DiaryEntry

CalendarDate -> Todo, DayAnnotation, CalendarEvent, DiaryEntry
Approved records -> LifeNovelChapter draft -> user approval
```

## Invariants

1. A carried task keeps its ID and `originalScheduledDate`; it is not copied.
2. An open task scheduled before today appears in today's working view as carried forward.
3. Completing a task may create a linked Diary entry, but only through an explicit user action.
4. AI output cannot directly update Skills, Achievements, Hero identity, or Life Novel chapters.
5. Calendar, Desk, and Bookshelf edits must be immediately consistent.
6. Dates are stored as local calendar keys in `YYYY-MM-DD` form.

## Future Migration Needs

Before cloud sync, add user ownership, schema versioning, conflict resolution, deletion/export semantics, encrypted transport, and migration tests. Do not imply backup until synchronization is implemented and verified.
