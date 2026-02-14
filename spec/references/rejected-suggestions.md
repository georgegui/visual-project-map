# Rejected GPT Pro Suggestions

Decisions made 2026-02-13 during triage of `gpt-pro-suggestions.md`. Recorded
here so future discussions don't re-litigate the same questions.

---

## Rejected from Section 1 (Data Model)

| Suggestion | Reason |
|------------|--------|
| `owner` attribute | Project management concern. The viewer renders a JSON snapshot; it doesn't track who owns what. Put it in the JSON if you want; it shouldn't be a first-class schema field. |
| `churn` / `last updated` | Same — live project state, not graph structure. |
| `test coverage` / `checks passed` | Same — runtime pipeline state, not visualization schema. |
| Edge `failure mode` | Overcomplicates the edge model. We deliberately keep edges simple (source, target, label, style). |
| Edge `strength` / `reliability` | Same — edge style already encodes flow type (P2.4). Adding a second dimension to edges creates visual clutter. |

## Rejected from Section 2 (Multi-scale Visualization)

| Suggestion | Reason |
|------------|--------|
| Nested modules | **Directly contradicts P1.2** (single-level hierarchy). Deliberate simplicity constraint. Nested modules create layout complexity, ambiguous collapse semantics, and harder-to-read graphs. |
| Semantic zoom | High implementation complexity, low payoff. Our graphs have 8-40 nodes per module, not hundreds. Standard zoom + collapse/expand already provides progressive disclosure. |

## Rejected from Section 3 (Multiple Views)

| Suggestion | Reason |
|------------|--------|
| Matrix view | Our graphs are sparse DAGs. A dependency matrix would be mostly empty, adding no insight over the DAG layout. |
| Kanban / checklist view | Project management tool, not graph visualization. Use a task tracker for this. |
| Diff view | Interesting but very complex to build. Our graphs represent workflow structure that changes slowly, not live data. Low priority relative to implementation cost. |

## Rejected from Section 4 (Weakest Links)

| Suggestion | Reason |
|------------|--------|
| Risk scoring (confidence x impact) | Requires rich attributes we don't have. The viewer doesn't compute risk — it visualizes structure. Risk assessment belongs in the pipeline that generates the JSON. |
| Output disagreement signals | Domain-specific logic that belongs in the pipeline, not the viewer. |

## Rejected: Section 5 (Checkpoints) — Entirely

Trust levels (P2.2) already encode provenance visually. The viewer shows
which nodes are AI-generated vs human-verified. Policy enforcement ("any AI
edge must pass 2 checks") belongs in the pipeline that generates the JSON,
not in the viewer.

## Rejected: Section 6 (What Should I Do Next?) — Entirely

The graph viewer is a **read-only visualization tool**. It renders a JSON
file. Scheduling, prioritization, and critical-path computation are project
management concerns that belong in separate tooling. The viewer's job is to
make the graph legible, not to give advice.

## Rejected from Section 7 (Progressive Disclosure)

| Suggestion | Reason |
|------------|--------|
| Heatmap overlay | Visual encoding channels are already allocated (color = module, border = trust, shape = role). Adding opacity or color-temperature for a 4th dimension risks overloading P2.1-P2.3. Defer unless a clean encoding is found. |
| Notifications | Viewer is stateless — no live updates, no push mechanism. |
| Pinned / saved views | URL-persisted collapse state could partially address this. Low priority. |

## Rejected: Section 8 (Provenance) — Entirely

Provenance belongs in the pipeline. The viewer can display provenance data
if it's in the JSON (via tooltips or a detail panel), but shouldn't own
versioning, checksums, or logging.

## Rejected: Section 9 (Ingestion / Graph Editing) — Entirely

The viewer is **read-only by design**. Graph authoring is a separate concern.
JSON files are hand-authored or script-generated.
