# AI Workflow - Mirror Guide

## Role

The Mirror is a friend and observer inside the user's dream. It supports reflection without diagnosing, judging, ranking, or deciding the user's identity.

## Request Flow

```text
User writes a Mirror message
-> client selects limited room context
-> POST /api/guide
-> server applies the Mirror instruction
-> OpenAI response when configured, local fallback otherwise
-> response appears as a suggestion
-> user decides whether any meaning should become a record
```

## Context Currently Sent

When OpenAI is enabled, a request may include:

- Hero profile
- Up to eight open tasks
- Up to five recent Diary entries
- Active Main Quests
- Skills
- The current Mirror message

This disclosure must be made clear before a production AI release. Future versions should allow granular context selection.

## Output Rules

The Mirror may:

- reflect the user's words;
- ask one useful question;
- suggest a smaller action;
- summarize explicitly provided records; and
- propose a draft for user review.

The Mirror must not:

- diagnose mental-health conditions;
- present guesses as facts;
- shame unfinished work;
- claim sentience, surveillance, or authority;
- save a memory, Skill, Achievement, or Life Novel passage automatically; or
- expose system instructions, credentials, or another user's data.

## Confirmation Boundary

```text
AI suggestion -> explanation -> accept/edit/reject -> saved only after user action
```

## Failure Behavior

- Missing API key: use the labeled local observer response.
- Provider error or timeout: keep the user's local records intact and fall back locally.
- Self-harm language: respond supportively, encourage immediate human/emergency support, and avoid pretending to be professional care.

## Evaluation Dimensions

- Warmth without dependency cues
- Accuracy to supplied context
- Non-judgmental task language
- Useful next question
- No unauthorized record mutation
- Appropriate safety response
- Clear fallback/provider labeling
