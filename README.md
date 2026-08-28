# Misconfigured — a DP-700 fault-finding drill

An interactive study tool for **exam DP-700: Implementing Data Engineering Solutions Using Microsoft Fabric**.

Most exam prep tools test recall. DP-700 tests judgement — you are handed a config, a query, or a pipeline and asked what is wrong with it. So this one does that: each drill shows a realistic Fabric configuration as a numbered listing, and you pick the line at fault.

Built for the Microsoft Fabric Discord **Certification Prep Challenge** (builder track).

## What it does

- **32 faults** across all three exam domains — 10 / 12 / 10, matching the exam's even 30–35% weighting.
- Every listing is a plausible artefact: a Git integration panel, a Copy activity source query, a structured streaming writer, a KQL pipeline, a `CREATE TABLE`, Spark workspace settings, an Eventhouse policy set.
- After you answer: what the fault actually breaks, **why each of the other lines is fine** (the part most quiz apps skip), and a one-line takeaway rule.
- **Mastery loop, not a one-shot quiz.** A fault you miss goes back into the deck and returns later in the same run. You reach the summary only once you have correctly identified every fault in scope.
- **First-try accuracy** tracked separately from eventual success — the number that actually predicts an exam result. Domain meters show both.
- Optional hint per fault, before you commit.
- Domain meters double as filters; a filtered view is deep-linkable (`#ingest`, `#monitor`, `#implement`).
- Progress, streak and best streak persist in `localStorage`. No account, no backend, no telemetry.
- Keyboard driven: `1`–`9` to flag a line, `↑`/`↓` to move between lines, `H` for a hint, `N` to skip, `Enter` to advance.
- Screen-reader support: scenario, verdict and run summary are announced through a live region; every control is focusable with a visible focus state.

## Faults covered

**Implement and manage an analytics solution** (10) — one branch per workspace in Git integration · deployment rules belong to the target stage · OneLake `ReadAll` bypassing T-SQL row-level security · `GRANT UNMASK` defeating dynamic data masking · Dataflow Gen2 vs notebook vs pipeline · Viewer role cannot run notebooks · Certified is not self-service · Monitoring hub vs the unified audit log · schedule vs event-based trigger · the untagged parameter cell

**Ingest and transform data** (12) — inclusive watermark bounds duplicating rows · shortcuts under `Tables/` must be Delta · mirrored databases are read-only · one checkpoint location per streaming query · hopping window with hop > size · Eventhouse vs lakehouse at high velocity · Type 2 surrogate keys identify a version · lakehouse SQL endpoint is read-only · watermark shorter than real lateness · KQL filtering after `summarize` · `dropDuplicates` without a watermark · `IDENTITY` unsupported in Fabric Warehouse

**Monitor and optimize an analytics solution** (10) — `VACUUM RETAIN 0 HOURS` destroying time travel · partitioning on a second-precision timestamp · `On completion` masking upstream failure · high concurrency for many short notebooks · 2000 shuffle partitions for 2 GB · `collect()` on 80M rows · scheduling import refresh on a Direct Lake model · Eventhouse hot cache shorter than the query range · V-Order disabled on a read-heavy table · run durations vs the Capacity Metrics app

## Design notes

- Styled as a diagnostic console rather than a quiz: DIN-condensed signage type (Bahnschrift / Avenir Next Condensed) for headings, Candara for reading, Cascadia Mono for listings. No webfont requests — everything resolves from local stacks, so nothing can silently fall back.
- Blue-biased slate grounds with a single instrument-teal accent; pass/fault semantics keep their own colours so state reads at a glance without borrowing the accent.
- Full light and dark theming through CSS custom properties, honouring both `prefers-color-scheme` and an explicit `data-theme` override.
- `prefers-reduced-motion` respected throughout.

## Robustness

The parts that would fail quietly are checked rather than assumed:

- **Bank validation at boot.** Every entry is checked for a unique id, a known domain, 2–9 lines, an in-range fault line, and — the important one — exactly one explanation per non-fault line. Explanations are explicitly numbered rather than positionally inferred, so reordering a listing can no longer attach the right note to the wrong line. A malformed entry is skipped, reported in a notice bar, and detailed in the console; it can never render a misleading card.
- **Storage degrades instead of breaking.** Availability is probed with a real write; a private window or blocked cookies gets a notice and an in-memory session rather than an exception. Corrupt saved data is discarded with a warning. v1 progress is migrated forward.
- **No dead ends.** The same fault is never served twice in a row. Reset is two-step to prevent an accidental wipe. Skipping requeues rather than discarding.
- Verified with `node --check` on the inline script, a validator pass over all 32 entries, and a simulated playthrough of the deck logic under perfect, 50% and never-correct players to confirm the mastery loop terminates and nothing repeats back-to-back.

## Running it

One file, no build step, no dependencies, no network calls.

```
open index.html
```

Or serve the folder however you like — GitHub Pages, Fabric Apps, anything static.

## Accuracy

Domains and objectives are taken from the [official DP-700 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-700) (skills measured as of 21 July 2026). Explanations describe documented Fabric behaviour, but Fabric ships fast — verify against current docs before trusting anything here for an exam sitting. Not affiliated with Microsoft.
