# Research Pipeline — Architecture & Cost Optimization

## Pipeline Overview

The research pipeline takes an ICP (Ideal Customer Profile) and produces structured company research with signals, contacts, and personalized outreach hooks. It streams results to the UI via SSE as each company completes.

### Flow

```
User Input (transcript or ICP)
  → ICPParser (Claude Haiku)
    → CompanyDiscovery (Parallel FindAll)
      → CompanyResearcher × N in parallel (Claude Haiku + web_search tool)
        → Stream each CompanyResult to UI via SSE
```

### Three Service Interfaces

The pipeline is built on three swappable interfaces defined in `lib/services/interfaces.ts`:

1. **ICPParser** — Parses natural language into structured ICP criteria
   - Current: `claudeICPParser` (Claude Haiku) in `lib/services/ai.ts`
   - Alternatives: GPT-4, local model, manual form

2. **CompanyDiscovery** — Finds companies matching an ICP
   - Current: `parallelCompanyDiscovery` (Parallel FindAll API) in `lib/services/parallel.ts`
   - Alternatives: Crunchbase, PitchBook, custom scraper

3. **CompanyResearcher** — Deep-researches a single company
   - Current: `claudeResearchAgent` (Claude + built-in web_search tool) in `lib/services/research-agent.ts`
   - Alternatives: Multi-agent system, Perplexity, Parallel Task API

To swap a provider, implement the interface and pass it to `runResearchPipeline()` in `lib/services/pipeline.ts`.

### Key Files

```
lib/services/
├── interfaces.ts      # ICPParser, CompanyDiscovery, CompanyResearcher
├── config.ts          # Models, limits, tiers — one file to tune
├── pipeline.ts        # Orchestrator — wires services + streams results
├── ai.ts              # claudeICPParser
├── parallel.ts        # parallelCompanyDiscovery
└── research-agent.ts  # claudeResearchAgent

lib/prompts/
├── parse-icp.ts       # ICP extraction prompt
└── research-agent.ts  # Research agent prompt

app/api/research/
└── route.ts           # SSE endpoint — just plumbing, no business logic
```

## Configuration

All tunable parameters live in `lib/services/config.ts`:

| Parameter               | Current Value               | Purpose                                                                                |
| ----------------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| `fastModel`             | `claude-haiku-4-5-20251001` | ICP parsing (lightweight)                                                              |
| `researchModel`         | `claude-haiku-4-5-20251001` | Per-company research with web search                                                   |
| `maxSearchesPerCompany` | 5                           | Cap on web searches per research agent call                                            |
| `researchMaxTokens`     | 4096                        | Max output tokens for research                                                         |
| `parseMaxTokens`        | 1024                        | Max output tokens for ICP parsing                                                      |
| `findAllLimit`          | 5                           | Max companies from FindAll (minimum is 5)                                              |
| `findAllGenerator`      | `preview`                   | FindAll tier: preview ($0.10) / base ($2) / core ($2+$0.15/match) / pro ($10+$1/match) |

## Cost Breakdown (Current)

| Step         | Provider                      | Cost per request            |
| ------------ | ----------------------------- | --------------------------- |
| ICP parsing  | Claude Haiku                  | ~$0.001                     |
| FindAll      | Parallel `preview`            | ~$0.10                      |
| Research × 5 | Claude Haiku + web_search × 5 | ~$0.05/company × 5 = ~$0.25 |
| **Total**    |                               | **~$0.35/request**          |

## Cost Optimization Decisions & History

### What we tried and why

**1. Started with Sonnet for everything (~$5/request)**

- Sonnet for ICP parsing, summarization, and email hooks
- Too expensive for an MVP

**2. Switched ICP parsing + summarization to Haiku (~20x cheaper)**

- Claude Haiku handles structured JSON extraction well
- Quality difference is minimal for parsing and formatting tasks
- Kept Sonnet only where reasoning quality matters (research)

**3. Parallel FindAll: `core` → `preview` generator**

- `core` ($2.00 + $0.15/match) does deeper web crawl
- `preview` ($0.10 flat) is near-instant, good enough for MVP
- Can upgrade to `core` later for better candidate quality

**4. Match conditions: many AND conditions → single consolidated condition**

- Originally built 3-4 separate match conditions (funding, hiring, tech, stage)
- FindAll treats these as AND — a company matching 3/4 gets rejected
- Consolidated into one "ICP fit" condition with attributes listed as "not all required"
- Dramatically improved match rate

**5. Removed the ranking step**

- Had a Claude call to rank FindAll results by ICP fit before researching
- Added latency and cost without clear quality improvement
- All matched companies now go straight to research

**6. Parallel Search API → Claude web_search tool**

- Originally used Parallel's Search API for per-company research (3 predefined searches)
- Search API returned unreliable/empty URLs, no iteration ability
- Switched to Claude's built-in `web_search_20250305` tool
- Claude decides what to search, follows threads, iterates — much better quality
- Response includes verified URLs from actual Brave Search results

**7. Sonnet research agent → Haiku research agent**

- Sonnet + 8 web searches hit the 30K input token/min rate limit
- Haiku has a higher rate limit and lower token cost
- Reduced max searches from 8 → 5 to further reduce token usage
- Enables parallel processing of all companies (Sonnet required sequential)

**8. Apollo contact enrichment → Claude-inferred contacts**

- Apollo's People Search API requires a $60/month subscription
- Instead, Claude infers contacts from research data (names found in articles, press releases)
- Contacts are filtered server-side: must have real first+last name, not just a title
- LinkedIn search URLs generated per person (name + company) for manual verification
- Emails inferred from domain patterns (first@domain.com, first.last@domain.com)

### What we kept

- **Parallel FindAll for discovery** — hard to replicate company matching at scale
- **Haiku for ICP parsing** — fast, cheap, reliable for structured extraction
- **Concurrent processing** — all companies researched in parallel
- **SSE streaming** — results appear as each company completes

## URL Verification

Claude can hallucinate URLs even when told not to. Two defenses:

1. **Server-side verification** — After Claude responds, we extract every URL from actual `web_search_tool_result` blocks (real Brave Search results). Any URL in Claude's JSON output not in this verified set gets stripped.

2. **Fallback links** — If a source category (jobs/funding/news) has no verified URLs, we generate safe search URLs (LinkedIn Jobs, Crunchbase, Google News) that always work.

3. **Prompt instruction** — Explicitly tells Claude "ONLY use URLs from search results, set null if unsure, a null URL is better than a broken one."

## Potential Future Upgrades

| Change                                     | Cost Impact        | Quality Impact                                                |
| ------------------------------------------ | ------------------ | ------------------------------------------------------------- |
| FindAll `preview` → `base`                 | +$1.90/request     | Better candidate generation                                   |
| Research Haiku → Sonnet                    | +$0.50/request     | Deeper reasoning, better signals (must go sequential)         |
| Increase `maxSearchesPerCompany` to 8      | +$0.03/company     | More thorough research                                        |
| Add Apollo/Hunter for contact enrichment   | +$60/month         | Real verified emails and LinkedIn profiles                    |
| Cache FindAll results by ICP hash          | Saves $0.10/repeat | Skip discovery for similar ICPs                               |
| Multi-agent research (parallel sub-agents) | Complex            | Could specialize: one for jobs, one for funding, one for news |
