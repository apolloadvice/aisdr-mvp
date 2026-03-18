# Code Cleanup

Guide for cleaning up code after iterative development. The goal: make the codebase look like it was written in one pass, not iterated on over multiple rounds.

## Philosophy

Code accumulates cruft during iteration — unused imports, dead components, duplicated logic, intermediate abstractions that outlived their purpose. Cleanup is not refactoring. It's removing the evidence of iteration so the next person reads clean, intentional code.

## Checklist

### 1. Dead Code

- **Orphaned components**: Search for components that are no longer imported anywhere. Delete them entirely — don't comment out or leave `// removed` markers.
- **Unused imports**: Check every file touched in the session. Remove imports that no longer have references.
- **Stale routes/pages**: If a page's responsibility moved elsewhere (e.g., into a modal), simplify or remove the page. If it must exist (e.g., as an OAuth redirect target), reduce it to the minimum — redirect and return null.

```
# Find orphaned exports
grep -r "export function ComponentName" --include="*.tsx" -l
# Then check if it's imported anywhere
grep -r "ComponentName" --include="*.tsx" --include="*.ts" -l
```

### 2. Duplicated Logic

- **Same UI in two places**: If a modal and a page render the same content, pick one as the source of truth. The other should delegate or redirect — never duplicate the JSX.
- **Repeated fetch patterns**: If multiple components fetch the same API on mount with the same `useState`/`useEffect` pattern, extract to a shared hook or have a parent fetch and pass as props.
- **Inline handlers that grew**: If an `onClick` handler became 10+ lines, extract it to a named function in the component body.

### 3. Convention Violations (per CLAUDE.md)

Run through each rule after every feature:

- **`/app` routing only**: No `'use client'` in any file under `/app`. `page.tsx` ≤ 40 lines, composition only.
- **No `any`, `as`, `enum`**: Use typed request interfaces for API route bodies instead of `as` casts. Use `unknown` + narrowing for parsed JSON.
- **Semantic tokens only**: No hardcoded hex/rgb values. All colors via Tailwind semantic tokens (`text-foreground`, `bg-muted`, etc.).
- **Feature-organized components**: Files live in `components/<feature>/`, not `components/buttons/` or `components/modals/`.

### 4. Simplify Interfaces

- **Remove intermediate abstractions**: If a wrapper function just calls another function with the same args, inline it.
- **Flatten unnecessary nesting**: If a component renders a single child wrapper div with no styling, remove the wrapper.
- **Consolidate state**: If a component has 4+ related `useState` calls (e.g., `loading`, `data`, `error`, `status`), consider whether a single state object or a reducer would be clearer.

### 5. Props and Data Flow

- **Remove prop drilling that's no longer needed**: If you added a prop during iteration that's now available from a store, use the store directly.
- **Default values over conditionals**: If a prop is optional and every call site passes the same default, make it the default in the component signature.
- **Guard clauses**: Replace `if (!x) return` silent failures with explicit fallbacks when the silent failure would confuse users (e.g., a button that does nothing when clicked).

### 6. Documentation Sync

After cleanup, verify docs reflect the current state:

- `CLAUDE.md` — Key Files section matches actual key files
- `docs/ARCHITECTURE.md` — Layers, routes, and external APIs are current
- `docs/PRODUCT.md` — Limitations section doesn't list solved problems
- `docs/CONVENTIONS.md` — No new patterns that should be documented

### 7. Final Verification

```bash
npm run build          # Zero type errors
npx prettier --write . # Consistent formatting
```

Build must pass clean. No warnings about missing modules or unused variables.

## Anti-patterns

- **Don't clean up code you didn't touch** — cleanup is scoped to the current feature's blast radius
- **Don't add abstractions during cleanup** — if three similar lines bother you, leave them; premature abstraction is worse than repetition
- **Don't rename things for style** — renaming creates noisy diffs and risks breaking imports
- **Don't add comments explaining what you removed** — the git history has that information
- **Don't add error handling "just in case"** — only add handling for errors that can actually occur
