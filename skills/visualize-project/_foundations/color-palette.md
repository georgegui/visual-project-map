# Color Palette

## Module Colors (12 slots)

Assign in directory order. Terminals always use Slate (#11).

| # | Name | Background | Border |
|---|------|-----------|--------|
| 0 | Blue | `#dbeafe` | `#93c5fd` |
| 1 | Indigo | `#e0e7ff` | `#a5b4fc` |
| 2 | Red | `#fef2f2` | `#fca5a5` |
| 3 | Orange | `#fff7ed` | `#fdba74` |
| 4 | Yellow | `#fefce8` | `#fde047` |
| 5 | Green | `#f0fdf4` | `#86efac` |
| 6 | Sky | `#eff6ff` | `#93c5fd` |
| 7 | Violet | `#f5f3ff` | `#c4b5fd` |
| 8 | Teal | `#f0fdfa` | `#5eead4` |
| 9 | Rose | `#fff1f2` | `#fda4af` |
| 10 | Amber | `#fffbeb` | `#fcd34d` |
| 11 | Slate | `#f1f5f9` | `#94a3b8` |

## Phase Colors (4 slots, desaturated)

Used for parent phase modules when `--depth 2`.

| # | Background | Border |
|---|-----------|--------|
| 0 | `#e8edf3` | `#a8b8cc` |
| 1 | `#f3ede8` | `#ccb8a8` |
| 2 | `#e8f3ed` | `#a8ccb8` |
| 3 | `#f3e8f3` | `#ccb8cc` |

## Terminal Node Color Overrides

| State | Background | Border |
|-------|-----------|--------|
| Success (COMPLETE, INCLUDED, DONE) | `#d1fae5` | `#6ee7b7` |
| Failure (FAILED, EXCLUDED, ERROR) | `#fee2e2` | `#fca5a5` |
| Decision gate | `#faf5ff` | `#a78bfa` |

## Assignment Rules

1. Assign module colors 0-10 in directory/workflow order
2. If >11 modules, wrap around (mod 11) — but prefer `--focus` to reduce
3. Terminal/sink modules always get Slate (#11)
4. Phase colors assigned 0-3 in order, wrap if >4 phases
5. Never assign the same color to adjacent modules if avoidable
