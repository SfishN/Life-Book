# Acceptance Criteria - MVP

## Release Criteria

| ID | Criterion | Verification |
| --- | --- | --- |
| AC-01 | The room fills the app with one fixed 2D view and an original cartoon-inspired style. | Visual check |
| AC-02 | The character moves with `WASD` without energy or movement limits. | Keyboard test |
| AC-03 | `E` opens the nearby object; click/tap and Room index provide alternatives. | Interaction test |
| AC-04 | `Q` closes a panel when the user is not typing; `Esc` opens exit confirmation. | Keyboard test |
| AC-05 | Every agreed room object opens the correct feature. | Mapping matrix test |
| AC-06 | Panels are translucent, smaller than the viewport, and preserve room visibility. | Desktop/mobile visual test |
| AC-07 | Calendar can create/edit tasks, Diary entries, annotations, and events. | Functional test |
| AC-08 | Calendar can open the complete To-do List. | Navigation test |
| AC-09 | Calendar, Desk, and Bookshelf edit the same records. | Cross-feature test |
| AC-10 | An earlier unfinished task appears today without changing ID or original date. | State test |
| AC-11 | The Mirror works with a local fallback and never auto-saves interpretation. | API/fallback test |
| AC-12 | Completing actions can create visible room-memory feedback. | State and visual test |
| AC-13 | Local records survive a reload. | Persistence test |
| AC-14 | Manifest, service worker, and essential room assets are available in production. | PWA endpoint test |
| AC-15 | Type check, lint, production build, and supported-browser smoke tests pass. | Release pipeline |

## Object Mapping

| Object | Required feature |
| --- | --- |
| Desk | To-do List |
| Bookshelf | Success Diary |
| Vision board | Main Quests |
| Mirror | AI Guidance |
| Plant | Skill Tree |
| Bed | Character/Hero |
| Calendar | Calendar |
| Achievement wall | Achievements |
| Room | Life Novel/Home |

## Out of MVP Scope

Cloud accounts, furniture store, radio/music, lamp Focus Mode, room rotation, multiple rooms, 3D, energy, combat, points, and task punishment.
