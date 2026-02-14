# Design: Open-Source Plugin for visual-project-map

**Date**: 2026-02-13
**Status**: Approved

## Goal

Transform the graph-viewer from an rct_data subdirectory into a standalone
GitHub repo (`visual-project-map`) installable as a Claude Code plugin via
`claude install username/visual-project-map`.

## Decisions

- **Repo strategy**: Fresh repo (no rct_data git history)
- **Distribution**: Claude Code plugin (`plugin.json` + skill)
- **Name**: `visual-project-map` (plugin), `visualize-project` (skill/slash command)
- **Examples**: Replace RCT-specific examples with generic ones; archive originals in rct_data
- **License**: MIT

## Repository Structure

```
visual-project-map/
├── plugin.json                     # Plugin manifest
├── LICENSE                         # MIT
├── README.md                       # Public-facing docs
├── CLAUDE.md                       # AI operational guidance
├── CHANGELOG.md                    # Version history (start at 1.0.0)
├── .gitignore                      # OS/editor files
├── schema.json                     # Graph JSON schema
│
├── skills/
│   └── visualize-project/
│       ├── SKILL.md                # Skill definition (adapted paths)
│       └── _foundations/
│           ├── graph-schema.md
│           ├── color-palette.md
│           └── inference-rules.md
│
├── viewer/                         # Static viewer app
│   ├── index.html
│   └── src/
│       ├── expand-collapse.js
│       ├── viewer.js
│       └── interactions.js
│
├── examples/
│   ├── minimal.json                # Simple 3-module example (existing)
│   ├── data-pipeline.json          # NEW: ETL pipeline (~5 modules, ~15 nodes)
│   └── ci-cd-workflow.json         # NEW: CI/CD flow (~5 modules, ~12 nodes)
│
├── scripts/
│   └── serve.py                    # Local dev server helper
│
├── spec/
│   ├── features.md
│   ├── graph-properties.md
│   └── references/
│
└── screenshots/                    # Trimmed to 5-8 key images
```

## Plugin Manifest

```json
{
  "name": "visual-project-map",
  "version": "1.0.0",
  "description": "Auto-generate interactive workflow graphs from project structure",
  "skills": [
    {
      "name": "visualize-project",
      "path": "skills/visualize-project"
    }
  ]
}
```

## Skill Adaptations

1. **Rename**: `visualize-workflow` -> `visualize-project`
2. **Output path**: Write JSON to user's project dir (not `tools/graph-viewer/examples/`)
3. **Viewer launch**: Locate plugin install dir, serve `viewer/` via `python3 -m http.server`
4. **Arguments**: `/visualize-project [directory] [--focus subdir] [--depth N] [--title "..."]`
5. **Foundation files**: No changes needed (already project-agnostic)

## New Generic Examples

1. **data-pipeline.json**: Ingest -> Transform -> Validate -> Load -> Report
   - Demonstrates trust levels, actor annotations, edge details
   - ~5 modules, ~15 nodes

2. **ci-cd-workflow.json**: Commit -> Build -> Test -> Stage -> Deploy
   - Demonstrates diamond decision nodes, dashed conditional edges
   - ~5 modules, ~12 nodes

## Viewing Flow

1. Skill generates `workflow-graph.json` in user's project
2. Claude starts local server: `python3 -m http.server 8080 --directory <plugin-path>/viewer/`
3. Opens `http://localhost:8080?graph=<path-to-json>`

## Excluded from v1.0

- No npm/package.json (vanilla JS, no build)
- No tests (visual tool, hard to unit test)
- No CI/CD (static files, no build)
- No TypeScript
- No dark mode
