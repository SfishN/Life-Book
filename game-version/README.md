# Life Room — Current App

This folder contains the current Life Room Progressive Web App. The [main README](../README.md) introduces the project, shows all six function pages, and explains how AI was used.

[Open the live preview](https://game-version-beta.vercel.app/) · [Read the development weblog](../files/weblog-completed.md) · [Read the AI disclosure](../README.md#ai-disclosure)

## Run locally

```powershell
npm ci
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

For a production build:

```powershell
npm run build
npm run start
```

## Optional AI setup

The app works without an API key. The Little Crow then uses local fallback replies. To use OpenAI, create `.env.local` in this folder and set `OPENAI_API_KEY`. See [`.env.example`](.env.example) for the available settings. Do not put the key in a `NEXT_PUBLIC_` variable.

Room records are saved in this browser. Sharing saved records with the Little Crow is off until the user enables it. There is no account or automatic cross-device backup in this version.

## Checks

```powershell
npm run typecheck
npm test
npm run build
```

The current six-function scope is in [PRD_g.md](basics/PRD_g.md). The [iteration log](documents/13_Iteration_Log.md) tracks later changes, including the story, mobile controls, and panel redesign. The [development weblog](../files/weblog-completed.md) records the design process by date. The documents copied from `room-version/` are historical references.
