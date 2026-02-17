# Design: Implementation Status Visual Encoding

**Date:** 2026-02-16
**Status:** Approved

## Problem

No visual distinction between components that are already implemented vs being planned vs needing review. In an AI-assisted workflow, users need to see at a glance which parts are real and which are aspirational.

## Status Values

| Status | Meaning |
|---|---|
| `verified` | Human reviewed and approved |
| `ai-tested` | AI iterated and tests pass (default if omitted) |
| `needs-review` | AI flags for human attention |
| `draft` | AI wrote first pass, untested |
| `planned` | Described but no code yet |

## Visual Encoding (MVP: opacity + border)

| Status | Opacity | Border |
|---|---|---|
| `verified` | 100% | Solid, 3px, green (#16a34a) |
| `ai-tested` | 85% (default) | Normal (no change) |
| `needs-review` | 100% | Dashed, 2.5px, orange (#f59e0b) |
| `draft` | 50% | Solid, 1px |
| `planned` | 25% | Dotted, 1px |

## Schema Change

Add to both module and node properties:
```json
"status": {
  "type": "string",
  "enum": ["planned", "draft", "ai-tested", "needs-review", "verified"]
}
```

## Files Changed

| File | Change |
|---|---|
| `schema.json` | Add `status` to module and node properties |
| `viewer.js` | Pass `status` through buildElements, add 4 style selectors |
| `examples/visual-project-map.json` | Add status values to demo variety |
| `spec/features.md` | Add F75 |
