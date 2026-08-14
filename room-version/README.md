# Life as a Room

A fixed-view 2D PWA for recording daily life through an interactive dream room. It is a reflective tool rather than a game: movement is unrestricted, and there are no energy, health, or punishment systems.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production check

```powershell
npm run typecheck
npm run lint
npm run build
npm run start
```

## Controls

- `W`, `A`, `S`, `D`: move
- `E`: interact with a nearby object
- `Q`: close an object panel
- `Esc`: open the exit confirmation
- Click or tap: move or interact directly

The Room index is an accessible alternative to character movement.

## Optional Mirror AI

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` to enable the server-side Mirror response. The key is never exposed to the browser. Without a key, the Mirror uses the built-in local observer response.

The AI can suggest and draft, but the user must approve anything that becomes a lasting record.

## Data and PWA behavior

MVP records stay in browser-local persistent storage and work without an account. The production build registers `public/sw.js` to cache the room shell and artwork for return visits. The shared store ensures Calendar, Desk, and Bookshelf edit the same task and diary records.

See `process.md` for the implementation scheme and `documents/01_PRD_MVP.md` for the frozen MVP requirements. The remaining product and delivery records are indexed in `documents/00_Document_Index.md`.
