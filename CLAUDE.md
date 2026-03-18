# Signal

AI-powered outbound sales platform for SMBs. Monitors the web for buying signals, finds contacts, generates personalized outreach.

**Stack:** Next.js App Router · TypeScript · Tailwind · shadcn/ui · Supabase · Anthropic API · Apollo API

## Docs

```
CLAUDE.md                          ← You are here
docs/
├── ARCHITECTURE.md                ← Domain layers, data flow, service interfaces
├── PRODUCT.md                     ← User flows, business domain, current limitations
├── CONVENTIONS.md                 ← SSR boundary, TypeScript, Tailwind, component rules
└── CODE-CLEANUP.md                ← Post-iteration cleanup checklist
.claude/skills/
├── research-pipeline/skill.md     ← Pipeline deep-dive: types, APIs, config, Apollo integration
└── theme-framework/skill.md       ← Token system, adding themes, font system
```

## Key Files

```
lib/types.ts                       ← All TypeScript interfaces
lib/services/config.ts             ← Models, limits, thresholds (one file to tune)
lib/services/interfaces.ts         ← Swappable service contracts
lib/services/pipeline.ts           ← Pipeline orchestrator
lib/services/gmail.ts              ← Gmail OAuth + sending
lib/store/research-store.ts        ← Zustand store (all state + actions)
lib/store/profile-store.ts         ← Profile modal state
lib/api.ts                         ← Client-side fetch wrappers
middleware.ts                      ← Supabase auth + route protection
```

## Rules

1. `/app` is routing only — zero `'use client'`, zero logic, `page.tsx` ≤ 40 lines
2. Interactivity → `<Name>.client.tsx` in `@/components`
3. No `any`, no `as`, no `enum`
4. Semantic tokens only — no hardcoded colors
5. `shadcn/ui` first — before custom primitives
6. Components organized by feature domain — never by type
7. Run `npx prettier --write .` after code changes

## Principles

- Simplicity first — smallest change, touch only what's necessary
- No laziness — root causes, no temp fixes, staff engineer standards
- No side effects — changes must not introduce regressions

## Workflow

- Plan mode first for 3+ step tasks. Re-plan if something breaks.
- Use subagents liberally. One task per subagent.
- Never mark complete without verification.

## Lessons

- `page.tsx` is a shell — 40 lines max, composition only, never `'use client'`. Extract all logic into named components.
