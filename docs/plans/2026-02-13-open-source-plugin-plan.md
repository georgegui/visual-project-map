# visual-project-map: Open-Source Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform graph-viewer into a standalone GitHub repo (`visual-project-map`) installable as a Claude Code plugin.

**Architecture:** Fresh git repo with plugin.json manifest, skill directory at `skills/visualize-project/`, viewer at `viewer/`, and generic examples. No build step, no npm — vanilla JS served via CDN.

**Tech Stack:** Cytoscape.js (CDN), dagre (CDN), Python 3 (dev server), Claude Code plugin system

**Design doc:** `docs/plans/2026-02-13-open-source-plugin-design.md`

---

### Task 1: Archive RCT examples in parent repo

Save the RCT-specific examples somewhere in the rct_data repo before they're excluded from the new repo.

**Files:**
- Copy: `tools/graph-viewer/examples/rct-workflow.json` → `docs/workflow-graphs/rct-workflow.json`
- Copy: `tools/graph-viewer/examples/rct-workflow-nested.json` → `docs/workflow-graphs/rct-workflow-nested.json`

**Step 1: Create archive directory**

```bash
mkdir -p /Users/zg2467/Dropbox/rct_data/docs/workflow-graphs
```

**Step 2: Copy RCT examples**

```bash
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/examples/rct-workflow.json /Users/zg2467/Dropbox/rct_data/docs/workflow-graphs/
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/examples/rct-workflow-nested.json /Users/zg2467/Dropbox/rct_data/docs/workflow-graphs/
```

**Step 3: Verify**

```bash
ls -la /Users/zg2467/Dropbox/rct_data/docs/workflow-graphs/
```

Expected: Two JSON files present.

---

### Task 2: Create fresh repo with directory structure

Initialize a new git repo at `~/visual-project-map` with the target directory structure.

**Files:**
- Create: `~/visual-project-map/` (new git repo)

**Step 1: Create repo and directories**

```bash
mkdir -p ~/visual-project-map
cd ~/visual-project-map
git init
mkdir -p viewer/src
mkdir -p skills/visualize-project/_foundations
mkdir -p examples
mkdir -p scripts
mkdir -p spec/references
mkdir -p screenshots
mkdir -p docs/plans
```

**Step 2: Verify structure**

```bash
find ~/visual-project-map -type d | sort
```

Expected: All directories from the design doc present.

---

### Task 3: Copy viewer files

Copy the core viewer application (index.html + JS) into the new repo's `viewer/` directory. Update the default graph path in index.html from `examples/rct-workflow-nested.json` to `../examples/minimal.json` (relative to viewer/).

**Files:**
- Copy: `tools/graph-viewer/index.html` → `~/visual-project-map/viewer/index.html`
- Copy: `tools/graph-viewer/src/*.js` → `~/visual-project-map/viewer/src/`
- Modify: `~/visual-project-map/viewer/index.html` (default graph path)

**Step 1: Copy files**

```bash
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/index.html ~/visual-project-map/viewer/
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/src/*.js ~/visual-project-map/viewer/src/
```

**Step 2: Update default graph path in index.html**

In `~/visual-project-map/viewer/index.html`, change line 138:

```javascript
// OLD:
var graphUrl = params.get('graph') || 'examples/rct-workflow-nested.json';
// NEW:
var graphUrl = params.get('graph') || '../examples/minimal.json';
```

**Step 3: Verify JS files present**

```bash
ls ~/visual-project-map/viewer/src/
```

Expected: `expand-collapse.js`, `viewer.js`, `interactions.js`

---

### Task 4: Copy schema, spec, and foundation files

Copy the supporting reference files unchanged.

**Files:**
- Copy: `tools/graph-viewer/schema.json` → `~/visual-project-map/schema.json`
- Copy: `tools/graph-viewer/spec/features.md` → `~/visual-project-map/spec/features.md`
- Copy: `tools/graph-viewer/spec/graph-properties.md` → `~/visual-project-map/spec/graph-properties.md`
- Copy: `tools/graph-viewer/spec/references/` → `~/visual-project-map/spec/references/`
- Copy: `tools/graph-viewer/.claude/skills/_foundations/*` → `~/visual-project-map/skills/visualize-project/_foundations/`

**Step 1: Copy all files**

```bash
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/schema.json ~/visual-project-map/
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/spec/features.md ~/visual-project-map/spec/
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/spec/graph-properties.md ~/visual-project-map/spec/
cp -r /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/spec/references/* ~/visual-project-map/spec/references/ 2>/dev/null || true
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/.claude/skills/_foundations/*.md ~/visual-project-map/skills/visualize-project/_foundations/
```

**Step 2: Verify**

```bash
ls ~/visual-project-map/schema.json ~/visual-project-map/spec/ ~/visual-project-map/skills/visualize-project/_foundations/
```

---

### Task 5: Copy and keep minimal example

The minimal.json example is already generic — copy it as-is.

**Files:**
- Copy: `tools/graph-viewer/examples/minimal.json` → `~/visual-project-map/examples/minimal.json`

**Step 1: Copy**

```bash
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/examples/minimal.json ~/visual-project-map/examples/
```

---

### Task 6: Create data-pipeline.json example

Create a generic ETL pipeline example demonstrating trust levels, actor annotations, and edge details.

**Files:**
- Create: `~/visual-project-map/examples/data-pipeline.json`

**Step 1: Write the example**

Write a JSON file with this structure:
- **Title**: "Data Pipeline Workflow"
- **5 modules**: Ingest (Blue #0), Transform (Indigo #1), Validate (Orange #3), Load (Green #5), Report (Slate #11 terminal)
- **~15 nodes**: Covering fetch, parse, normalize, deduplicate, schema_check (diamond), type_check (diamond), load_staging, load_prod, generate_report, COMPLETE (green terminal), FAILED (red terminal)
- **~15 edges**: Sequential flow with decision branches at validation, dashed retry loops
- **Actor annotations**: script for automated steps, human for approval step before prod, ai for anomaly detection
- **Edge details**: Populated for 2-3 key edges with script paths, input/output arrays
- **Legend**: Full trust levels (normal, auto, ai, verified)

Follow color palette from `skills/visualize-project/_foundations/color-palette.md`. Follow node ID/label conventions from inference-rules.md.

**Step 2: Validate structure manually**

Check: every node.module references a valid module.id, every edge.source/target references a valid node.id, all colors are `#rrggbb`, shapes are valid enums.

---

### Task 7: Create ci-cd-workflow.json example

Create a generic CI/CD pipeline example demonstrating diamond decision nodes and dashed conditional edges.

**Files:**
- Create: `~/visual-project-map/examples/ci-cd-workflow.json`

**Step 1: Write the example**

Write a JSON file with this structure:
- **Title**: "CI/CD Pipeline"
- **2 phases** + **5 child modules**: Phase: Build & Test (Commit, Build, Test), Phase: Deploy (Stage, Production), plus Terminals module
- **~12 nodes**: commit_push, lint_check (diamond), compile, unit_test, integration_test, tests_pass (diamond), deploy_staging, smoke_test (diamond), approval_gate (diamond), deploy_prod, DEPLOYED (green), FAILED (red)
- **~14 edges**: Linear flow with decision branches, dashed rollback edge from smoke_test failure back to staging
- **Actor annotations**: script for CI steps, human for approval_gate, mixed for deploy_prod
- **No trust levels** (most CI/CD projects don't have provenance semantics) — omit `legend`

This example demonstrates: nested phases, diamond decision nodes, dashed conditional edges, actor colors, and a graph without trust levels.

**Step 2: Validate structure manually**

Same checks as Task 6.

---

### Task 8: Adapt SKILL.md for plugin distribution

Copy and modify the skill definition to work as a standalone plugin instead of embedded in rct_data.

**Files:**
- Create: `~/visual-project-map/skills/visualize-project/SKILL.md`
- Source: `tools/graph-viewer/.claude/skills/visualize-workflow/SKILL.md`

**Step 1: Copy base file**

```bash
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/.claude/skills/visualize-workflow/SKILL.md ~/visual-project-map/skills/visualize-project/SKILL.md
```

**Step 2: Update frontmatter**

Change:
```yaml
name: visualize-workflow
```
To:
```yaml
name: visualize-project
```

**Step 3: Update description line**

Change the opening line from:
```
The output is a JSON file loadable by the graph-viewer at
`tools/graph-viewer/index.html?graph=examples/{name}.json`.
```
To:
```
The output is a JSON file viewable in the visual-project-map viewer.
```

**Step 4: Update arguments section**

Change all `/visualize-workflow` references to `/visualize-project`.

**Step 5: Update Phase 3 — output path (Step 3.5)**

Replace the "Write File" section. Change:
```
Write to: `tools/graph-viewer/examples/{name}.json`
```
To:
```
Write to: `./{name}-graph.json` (in the project root)
```

**Step 6: Update Phase 3 — viewing instructions (Step 3.6)**

Replace the viewing instructions with:

```
Graph written to: ./{name}-graph.json

To view, run:
  python3 -m http.server 8080 --directory "$(dirname "$(claude skill-path visualize-project)")/../../viewer"
  open "http://localhost:8080?graph=$(pwd)/{name}-graph.json"

Or copy the JSON to the viewer's examples/ directory and open viewer/index.html directly.
```

**Step 7: Verify no remaining rct_data references**

Search the file for `rct`, `tools/graph-viewer`, `rct-workflow`, or any project-specific references. Remove or generalize any found.

---

### Task 9: Create plugin.json

**Files:**
- Create: `~/visual-project-map/plugin.json`

**Step 1: Write plugin.json**

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

---

### Task 10: Create LICENSE (MIT)

**Files:**
- Create: `~/visual-project-map/LICENSE`

**Step 1: Write MIT license**

Use 2026 as the year, "George Gui" as the copyright holder.

---

### Task 11: Create .gitignore

**Files:**
- Create: `~/visual-project-map/.gitignore`

**Step 1: Write .gitignore**

```
.DS_Store
*.swp
*.swo
*~
.idea/
.vscode/
__pycache__/
*.pyc
node_modules/
```

---

### Task 12: Create CHANGELOG.md

**Files:**
- Create: `~/visual-project-map/CHANGELOG.md`

**Step 1: Write CHANGELOG**

```markdown
# Changelog

## [1.0.0] - 2026-02-13

### Added
- Interactive DAG viewer with Cytoscape.js + dagre layout
- 2-level module hierarchy (phases contain modules contain nodes)
- Collapse/expand with meta-edge deduplication
- Trust level border encoding (normal/auto/AI/verified)
- Actor annotations on edges (human/AI/script/mixed)
- Edge detail panel (script path, inputs, outputs, docs)
- Path tracing (upstream/downstream BFS)
- Search by node label
- Edge label toggle (hidden by default)
- Keyboard shortcuts (F/E/C/L/Esc)
- JSON Schema for input validation
- `visualize-project` Claude Code skill for auto-generating graphs
- Three example graphs (minimal, data-pipeline, ci-cd-workflow)
```

---

### Task 13: Adapt CLAUDE.md for standalone repo

Rewrite the CLAUDE.md to remove rct_data-specific references and frame it for the standalone project.

**Files:**
- Create: `~/visual-project-map/CLAUDE.md`
- Source: `tools/graph-viewer/CLAUDE.md` (adapt, don't copy verbatim)

**Step 1: Write CLAUDE.md**

Keep the same sections (What This Is, Running, Architecture, Key Design Decisions, Spec Documents, Input JSON Schema) but:
- Update paths: `src/` → `viewer/src/`, `index.html` → `viewer/index.html`
- Update default graph reference: `examples/rct-workflow-nested.json` → `examples/minimal.json`
- Add section about plugin structure (`plugin.json`, `skills/`)
- Remove any rct_data references
- Add "Adding a New Feature" workflow pointing to `spec/`

---

### Task 14: Write public README.md

Create a polished README for the GitHub repo, targeted at developers who want to visualize their project workflows.

**Files:**
- Create: `~/visual-project-map/README.md`

**Step 1: Write README with these sections**

1. **Title + one-line description**: "visual-project-map — Interactive workflow graphs for any codebase"
2. **Screenshot**: Reference one key screenshot (collapsed view)
3. **Quick Start — Claude Code**: `claude install username/visual-project-map` then `/visualize-project`
4. **Quick Start — Manual**: How to create JSON and view it
5. **Features**: Bullet list of key capabilities
6. **Input Format**: Condensed schema docs (modules, nodes, edges, legend) — can be shorter than current README since schema.json exists
7. **Keyboard Shortcuts**: Table
8. **Examples**: List the 3 examples with one-line descriptions
9. **Architecture**: The 3-file explanation
10. **License**: MIT

Keep it under 200 lines. Link to `spec/features.md` for the full feature catalog.

---

### Task 15: Create serve.py helper script

A small Python script that starts the viewer server and prints the URL.

**Files:**
- Create: `~/visual-project-map/scripts/serve.py`

**Step 1: Write serve.py**

```python
#!/usr/bin/env python3
import http.server
import os
import sys
import webbrowser

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
viewer_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "viewer")
graph = sys.argv[2] if len(sys.argv) > 2 else "../examples/minimal.json"

os.chdir(viewer_dir)
url = f"http://localhost:{port}?graph={graph}"
print(f"Serving viewer at {url}")
webbrowser.open(url)
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=port)
```

---

### Task 16: Select and copy screenshots

Pick 5-6 key screenshots that showcase features without being RCT-specific. These will need to be regenerated from generic examples eventually, but for now copy the best existing ones.

**Files:**
- Copy selected screenshots to `~/visual-project-map/screenshots/`

**Step 1: Copy representative screenshots**

Select these (they demonstrate features, the RCT content is secondary):
- `nested-collapsed-initial.png` — shows collapsed overview
- `nested-expanded-all.png` — shows full expansion
- `nested-path-trace-scored.png` — shows path tracing
- `nested-search-marginal.png` — shows search
- `nested-labels-on.png` — shows edge labels
- `flat-collapsed.png` — shows flat (non-nested) mode

```bash
for f in nested-collapsed-initial nested-expanded-all nested-path-trace-scored nested-search-marginal nested-labels-on flat-collapsed; do
  cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/screenshots/${f}.png ~/visual-project-map/screenshots/
done
```

Note: These screenshots show RCT data. They should be regenerated from the generic examples before public release. Mark this as a follow-up task.

---

### Task 17: Update spec/features.md for rename

Update the feature catalog to reflect the rename from visualize-workflow to visualize-project.

**Files:**
- Modify: `~/visual-project-map/spec/features.md`

**Step 1: Update F39**

Change:
```
### F39: visualize-workflow skill (auto-generate graph JSON)
```
To:
```
### F39: visualize-project skill (auto-generate graph JSON)
```

And update the files reference from `.claude/skills/visualize-workflow/SKILL.md` to `skills/visualize-project/SKILL.md`.

Update any other path references in the file from `src/` to `viewer/src/` and `index.html` to `viewer/index.html`.

---

### Task 18: Copy design doc

Copy the design document into the new repo for reference.

**Files:**
- Copy: design doc to `~/visual-project-map/docs/plans/`

**Step 1: Copy**

```bash
cp /Users/zg2467/Dropbox/rct_data/tools/graph-viewer/docs/plans/2026-02-13-open-source-plugin-design.md ~/visual-project-map/docs/plans/
```

---

### Task 19: Initial commit

Stage all files and create the initial commit.

**Step 1: Stage all files**

```bash
cd ~/visual-project-map
git add -A
```

**Step 2: Review staged files**

```bash
git status
```

Expected: All files from the design doc structure listed as new files.

**Step 3: Commit**

```bash
git commit -m "Initial release: interactive DAG viewer + Claude Code skill

visual-project-map v1.0.0 — interactive workflow graph viewer built on
Cytoscape.js with collapse/expand, trust levels, actor annotations, and
a Claude Code skill for auto-generating graphs from project structure."
```

---

### Task 20: Create GitHub repo and push

Create the remote repo and push.

**Step 1: Create GitHub repo**

```bash
cd ~/visual-project-map
gh repo create visual-project-map --public --description "Interactive workflow graphs for any codebase" --source . --push
```

**Step 2: Verify**

```bash
gh repo view --web
```

---

### Task 21: Regenerate screenshots from generic examples (follow-up)

The current screenshots show RCT-specific data. After the repo is live, regenerate screenshots by:

1. Starting the viewer: `python3 scripts/serve.py`
2. Loading each example
3. Taking screenshots of key states (collapsed, expanded, path trace, search, labels)
4. Replacing the files in `screenshots/`

This can be done in a follow-up PR since it requires a running browser.

---

## Task Summary

| # | Task | Type |
|---|------|------|
| 1 | Archive RCT examples | file copy |
| 2 | Create fresh repo structure | git init |
| 3 | Copy viewer files | file copy + edit |
| 4 | Copy schema, spec, foundations | file copy |
| 5 | Copy minimal example | file copy |
| 6 | Create data-pipeline.json | content creation |
| 7 | Create ci-cd-workflow.json | content creation |
| 8 | Adapt SKILL.md | content edit |
| 9 | Create plugin.json | content creation |
| 10 | Create LICENSE | boilerplate |
| 11 | Create .gitignore | boilerplate |
| 12 | Create CHANGELOG.md | content creation |
| 13 | Adapt CLAUDE.md | content edit |
| 14 | Write public README.md | content creation |
| 15 | Create serve.py | code |
| 16 | Select and copy screenshots | file copy |
| 17 | Update spec/features.md | content edit |
| 18 | Copy design doc | file copy |
| 19 | Initial commit | git |
| 20 | Create GitHub repo and push | git + gh |
| 21 | Regenerate screenshots | follow-up |
