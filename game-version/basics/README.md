# Life Room — Game Version

A local, diary-led version of Life Room. Save a diary and the Mood you record changes the room's light. The background story and puzzle introduction are intentionally undecided.

**Current requirements:** [PRD_g.md](PRD_g.md)

## Run

```powershell
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). Production also uses port 3001:

```powershell
npm run build
npm run start
```

This folder was copied from the current room-version, including existing local changes and assets. Changes here do not modify that original. Generated game builds use `.next-game/`; the copied `.next/` cache is not used.

## Six retained functions

- Diary: create, date, read, and explicitly edit entries; choose one Mood and optionally associate Skills.
- AI Companion: the Little Crow, with a large current-reply bubble, one-day history, opt-in saved-record context, and a labeled local fallback.
- Skill Tree: skills, user-confirmed progress, and linked diary evidence.
- Achievement Wall: create and confirm meaningful milestones.
- Hero: identity, current theme, and self-reflection.
- Life Novel: editable local draft generation, chapter approval, and saved chapters.

To-do List, Calendar, and Main Quests are removed from the active game. Their furniture may remain decorative.

## Try the save-to-room loop

1. Enter the room and open Diary.
2. Write a moment and choose Calm, Happy, Neutral, Tired, or Stressed.
3. Nothing in the room changes while the entry is a draft.
4. Select **Save diary & see room**: the panel closes, lighting changes, and the bookshelf responds.
5. Edit an entry with **Edit entry** and commit with **Save changes & see room**.
6. Reload: the last saved atmosphere and its source date remain.

The most recently saved entry controls lighting, even for an older diary date. Mood is always chosen by the user: it is never inferred, scored, or fetched from an external service. Stressed light remains steady and never flashes.

## Controls

- WASD: move.
- E: interact near an object.
- Click/tap an object or use Room index for direct access.
- Esc: close a panel or start the exit confirmation.
- Character input pauses while writing; lighting can still render.
- Reduced-motion preferences disable save pulses and particle movement.

## Local data and AI

Life Room uses a `life-room-*` namespace for new data. Previous production keys remain migration inputs until saved records, onboarding progress, atmosphere, and temporary drafts have been copied and verified. Unsaved fields are temporary seven-day drafts. Records are browser-local, not cloud-backed up.

Optional Little Crow AI uses the copied server-side configuration: set `OPENAI_API_KEY` in this folder's `.env.local` to enable it. Without a key, a local observer replies. Saved diary/profile/growth context is opt-in; only the current day's conversation is retained and used when you speak.

Life Novel generation remains the inherited editable **local template**, not model-generated chapters. Skill progress and achievements remain user-controlled.

## Checks

```powershell
npm run typecheck
npm test
npm run build
```

The copied documents in `documents/` are historical room-version references. [PRD_g.md](PRD_g.md) and [process.md](process.md) govern this version.
