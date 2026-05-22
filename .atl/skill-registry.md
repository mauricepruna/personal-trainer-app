# Skill Registry — personal-trainer-app

Generated: 2026-05-22

## Project Conventions (from CLAUDE.md)

**Architecture rules** (enforce in every apply/verify phase):
- Server Components by default — `"use client"` only when hooks or browser APIs are needed
- DB access only through `lib/db/` — never call `getDb()` directly in components or pages
- All mutations via Server Actions (`"use server"`), never raw fetch or API routes
- No hardcoded user-facing strings — add keys to both `lib/i18n/dictionaries/en.json` and `es.json`

**Git workflow**:
- Feature branches: `feature/<issue-number>-<short-name>`
- Conventional commits (no AI attribution)

**Data flow**:
```
RSC page → lib/db/queries/<domain>.ts  (reads)
         → lib/actions/<domain>.ts      (mutations, "use server")
           ↓
         lib/db/index.ts (getDb singleton) → data/app.db
```

## Compact Rules

### branch-pr
- Every PR MUST link a GitHub issue
- One `type:*` label per PR
- Branch name: `feature/<issue-number>-<short-name>`
- Repo: https://github.com/mauricepruna/personal-trainer-app
- Issue board: https://github.com/users/mauricepruna/projects/4

### issue-creation
- File via GitHub CLI: `gh issue create`
- Add to project board: https://github.com/users/mauricepruna/projects/4
- Label: `bug` or `enhancement`

### judgment-day
- Trigger: user says "judgment day", "judgment-day", "juzgar", "doble review"
- Launches 2 independent blind reviewer agents simultaneously
- Reviews code, specs, or architecture — not just syntax

### verify
- Run `npm run lint` for type + lint verification (no test suite exists)
- Visual smoke test via `npm run dev`
- Check phase pill toggle (Phase 1 / 2 / 3) on the plan page

### simplify
- Prefer editing existing files over creating new ones
- No comments unless WHY is non-obvious
- No abstractions beyond what the task requires

## User Skills Index

| Skill | Trigger | Source |
|-------|---------|--------|
| branch-pr | Creating PRs, preparing changes for review | ~/.claude/skills/branch-pr/SKILL.md |
| issue-creation | Creating GitHub issues, bug reports, feature requests | ~/.claude/skills/issue-creation/SKILL.md |
| judgment-day | "judgment day", adversarial review, "juzgar" | ~/.claude/skills/judgment-day/SKILL.md |
| skill-creator | Creating new AI agent skills | ~/.claude/skills/skill-creator/SKILL.md |
| go-testing | Go tests, Bubbletea TUI testing (NOT this project) | ~/.claude/skills/go-testing/SKILL.md |

## Stack Context

- **Framework**: Next.js 14 App Router, TypeScript strict
- **Styling**: Tailwind CSS v3
- **DB**: SQLite via better-sqlite3 (`data/app.db`)
- **Auth**: JWT httpOnly cookie via jose
- **Forms**: React Hook Form + Zod
- **State**: Zustand (client-side)
- **Charts**: Recharts
- **PWA**: next-pwa
- **i18n**: en/es dictionaries in `lib/i18n/dictionaries/`
- **Host**: Coolify (self-hosted, persistent SQLite volume)

## Testing Capabilities

- **Test Runner**: ❌ None
- **Unit Tests**: ❌ Not available
- **Integration Tests**: ❌ Not available
- **E2E Tests**: ❌ Not available
- **Coverage**: ❌ Not available
- **Linter**: ✅ `npm run lint` (ESLint via next lint)
- **Type Checker**: ✅ `npx tsc --noEmit`
- **Strict TDD Mode**: ❌ Disabled (no test runner)
