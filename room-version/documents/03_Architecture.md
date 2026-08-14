# Architecture - MVP

## System Context

```text
User
  -> Next.js PWA shell
      -> Phaser room and character
      -> React furniture panels
      -> Zustand shared record store
          -> browser-local persistence
      -> /api/guide
          -> OpenAI Responses API when configured
          -> local observer fallback otherwise
```

## Responsibilities

| Component | Responsibility |
| --- | --- |
| Next.js App Router | Page shell, metadata, PWA manifest, and server route |
| Phaser scene | Room rendering, `WASD` movement, proximity, `E`, and tap interaction |
| React components | Object panels, forms, Calendar, Help, Room index, and exit flow |
| Zustand store | Shared domain state and local persistence |
| `/api/guide` | Server-only AI request, safety instruction, fallback response |
| Service worker | Cache the shell and essential room artwork for return visits |

## Runtime Boundaries

- Phaser emits room events; React opens and closes the corresponding panel.
- React panels never keep independent copies of tasks or diary records.
- The OpenAI key is server-only and must not appear in client bundles or local storage.
- AI output is conversational content, not an authorized domain mutation.
- The MVP has no account system or cloud synchronization.

## Current Deployment Shape

- One Next.js application
- One dynamic API route: `/api/guide`
- Static room artwork and PWA assets under `public/`
- Browser-local persistence key: `life-as-a-room-v1`
- Environment configuration documented in `.env.example`

## Quality Attributes

- Local-first continuity
- Accessible alternative to spatial navigation
- Responsive panels that remain smaller than the viewport
- Reduced-motion support
- Graceful AI failure
- No hidden transmission of personal records

## Future Extension Points

- Repository interface for authenticated cloud synchronization
- Object-native furniture UI skins
- Furniture inventory/store
- Desk radio and lamp Focus Mode
- Optional room rotation, only after usability validation
