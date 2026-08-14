# Privacy and Safety Requirements

## Product Position

Life as a Room stores personal plans, reflections, identity notes, and inferred growth. Treat this as sensitive personal content even when it does not meet a legal special-category definition. The product is not therapy, diagnosis, or emergency support.

## Current MVP Data Behavior

- Records are stored in browser-local persistence under `life-as-a-room-v1`.
- There is no account, cloud backup, or multi-device synchronization.
- When no OpenAI key is configured, Mirror messages receive a local fallback response.
- When OpenAI is configured, the current message plus selected Hero, task, Diary, Quest, and Skill context is sent through the server route.
- The API key remains server-side.
- AI requests use `store: false` in the provider request.

## Required User Controls Before Broader Release

1. Explain local-only storage and loss risk during onboarding.
2. Add complete export and delete controls.
3. Show exactly which context will be sent before enabling model-backed Mirror responses.
4. Allow users to exclude categories of context.
5. Require approval before saving AI-derived memories, Skills, Achievements, or chapters.
6. Provide a clear way to disable AI while keeping all manual features.
7. Document retention, provider, deletion, and account behavior before cloud sync.

## Safety Rules

- Do not diagnose, score wellbeing, or infer personality as fact.
- Do not use shame, streak loss, scarcity, or manipulative rewards.
- Do not encourage emotional exclusivity or dependence on the Mirror.
- In crisis language, encourage immediate human and emergency support without claiming professional capability.
- Do not use personal records for advertising or unrelated model training.
- Furniture customization must not become a coercive or pay-to-progress economy.

## Threats to Review

- Shared-device exposure through local browser storage
- Accidental transmission of Diary content in AI context
- Cross-user data leakage after future authentication
- Prompt injection inside stored records
- Sync conflicts and silent overwrites
- Incomplete deletion or export
- Sensitive data in logs, analytics, crash reports, screenshots, or backups

## Release Gate

No public personal-data or AI release should proceed without privacy copy, export/delete, context consent, safety evaluation, and a documented incident path.
