# AI Workflow — Little Crow Companion

## Role

The Little Crow is a warm, concise friend and observer inside Life Room. It supports reflection without diagnosing, judging, ranking, claiming authority, or deciding the user's identity. Ordinary companion replies must not invent facts about A, B, the timelines, a crime, or the opening mystery.

## Interface and request flow

```text
User opens the Little Crow
-> large bubble begins with "..."
-> user writes in the right-side rail
-> client optionally selects limited room context
-> POST /api/guide
-> server applies Crow voice and safety limits
-> OpenAI response when configured, local fallback otherwise
-> brief reply appears in the Crow's large bubble
-> previous exchange moves into Today when the user asks again
```

The mirror is not an AI entry point. The companion uses a full-viewport frosted scene rather than the standard furniture-panel shell.

## Retention

- Keep conversation only for the current local day.
- Prune older messages during store rehydration, snapshotting, and the next write.
- Show only the current Crow reply in the large bubble; keep earlier same-day user and Crow messages in the Today rail.
- This local one-day history is not cloud backup.

## Context currently sent

Every request may include the current user message and recent same-day conversation. Only when **Let it read selected room memories** is enabled may the request additionally include:

- Profile;
- up to eight recent Diary entries;
- Skills and up to twelve Skill Records;
- up to eight pinned Achievements; and
- current room Mood/lighting state.

The context option is off by default. The request must not include onboarding choices, A/B note interactions, net performance, or removed To-do, Calendar, and Main Quest records.

## Output rules

The Little Crow may reflect the user's words, ask one useful question, suggest one small action, summarize explicitly supplied records, or offer a draft for review. Each response is limited to 55 words and three sentences.

It must not diagnose, present guesses as facts, shame unfinished work, encourage dependence or exclusivity, claim sentience/surveillance/authority, mutate any record, expose credentials, or reveal another user's data.

## Confirmation boundary

```text
AI suggestion -> explanation -> accept/edit/reject -> saved only after user action
```

## Failure behavior

- Missing API key: use the labeled local reflection response.
- Provider error or timeout: preserve the user's local records and report that the Crow is quiet.
- High-risk language: respond supportively, encourage appropriate immediate human or emergency support, and never pretend to be professional care.

## Evaluation dimensions

- Warmth without dependency cues
- Accuracy to supplied context
- Brief, useful response within the length cap
- No unauthorized record mutation
- Appropriate safety response
- Clear local/AI labeling
