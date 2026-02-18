# Worked Example — Refactor Mode

> Reference example for `/visualize-project . --refactor --objective "..."`. Shows the complete output for restructuring a flat scripts directory into stage-specific directories.

---

**Existing project** at `/path/to/pipeline/`:
```
pipeline/
  scripts/
    download.py     # fetches from API → data/raw/
    clean.py        # data/raw/ → data/clean/
    export.py       # data/clean/ → output/
  data/
    raw/
    clean/
  output/
  CLAUDE.md         # "Pipeline: download → clean → export"
```

**Command:** `/visualize-project . --refactor --objective "Group scripts by pipeline stage"`

**Phase 1C analysis:**
- Step 1C.1 (scan): flat `scripts/` directory with 3 scripts, `data/` with raw/clean, `output/`
- Step 1C.2 (objective): structural goal is to move scripts from flat `scripts/` into stage-specific directories
- Step 1C.3 (target): proposed structure — `scripts/ingest/download.py`, `scripts/clean/clean.py`, `scripts/export/export.py`
- Step 1C.4 (diff): `mod_scripts` splits into `mod_ingest`, `mod_clean`, `mod_export`

**Output** (abbreviated — base graph + plan overlay):

```json
{
  "title": "Pipeline Workflow",
  "description": "Download-clean-export pipeline, with proposed restructuring into stage-specific directories.",
  "_generationMode": "refactor",
  "_objective": "Group scripts by pipeline stage",
  "_generatedAt": "2026-02-16T16:00:00Z",
  "modules": [
    { "id": "mod_scripts", "label": "Scripts", "color": "#dbeafe", "borderColor": "#93c5fd",
      "status": "ai-tested",
      "description": "Flat scripts directory (current). Refactoring proposes splitting by stage." },
    { "id": "mod_ingest", "label": "Ingest", "color": "#e0f2fe", "borderColor": "#7dd3fc",
      "status": "planned",
      "description": "Proposed: stage-specific directory for data acquisition scripts." },
    { "id": "mod_clean", "label": "Clean", "color": "#e0e7ff", "borderColor": "#a5b4fc",
      "status": "planned",
      "description": "Proposed: stage-specific directory for data cleaning scripts." },
    { "id": "mod_export", "label": "Export", "color": "#fef2f2", "borderColor": "#fca5a5",
      "status": "planned",
      "description": "Proposed: stage-specific directory for export scripts." }
  ],
  "nodes": [
    { "id": "scr_dl", "module": "mod_scripts", "label": "scripts.download" },
    { "id": "scr_cln", "module": "mod_scripts", "label": "scripts.clean" },
    { "id": "scr_exp", "module": "mod_scripts", "label": "scripts.export" },
    { "id": "ing_dl", "module": "mod_ingest", "label": "ingest.download" },
    { "id": "cln_cln", "module": "mod_clean", "label": "clean.clean" },
    { "id": "exp_exp", "module": "mod_export", "label": "export.export" }
  ],
  "edges": [
    { "source": "scr_dl", "target": "scr_cln", "label": "clean", "style": "solid", "actor": "script" },
    { "source": "scr_cln", "target": "scr_exp", "label": "export", "style": "solid", "actor": "script" },
    { "source": "ing_dl", "target": "cln_cln", "label": "clean", "style": "solid", "actor": "script" },
    { "source": "cln_cln", "target": "exp_exp", "label": "export", "style": "solid", "actor": "script" }
  ],
  "plan": {
    "summary": {
      "goal": "Group scripts by pipeline stage",
      "tasks": [
        { "id": "t1", "title": "Create scripts/ingest/ and move download.py", "nodeIds": ["ing_dl"] },
        { "id": "t2", "title": "Create scripts/clean/ and move clean.py", "nodeIds": ["cln_cln"] },
        { "id": "t3", "title": "Create scripts/export/ and move export.py", "nodeIds": ["exp_exp"] },
        { "id": "t4", "title": "Remove flat scripts/ directory", "nodeIds": ["scr_dl", "scr_cln", "scr_exp"] }
      ]
    },
    "annotations": {
      "modules": {
        "mod_scripts": { "status": "remove", "description": "Flat scripts/ directory replaced by stage-specific directories" },
        "mod_ingest": { "status": "add", "description": "New directory: scripts/ingest/" },
        "mod_clean": { "status": "add", "description": "New directory: scripts/clean/" },
        "mod_export": { "status": "add", "description": "New directory: scripts/export/" }
      },
      "nodes": {
        "scr_dl": { "status": "remove", "description": "Moves to scripts/ingest/download.py" },
        "scr_cln": { "status": "remove", "description": "Moves to scripts/clean/clean.py" },
        "scr_exp": { "status": "remove", "description": "Moves to scripts/export/export.py" },
        "ing_dl": { "status": "add", "description": "download.py in new ingest directory" },
        "cln_cln": { "status": "add", "description": "clean.py in new clean directory" },
        "exp_exp": { "status": "add", "description": "export.py in new export directory" }
      },
      "edges": {}
    }
  }
}
```

4 modules (1 current + 3 proposed), 6 nodes (3 current + 3 proposed), 4 edges. The plan overlay shows `mod_scripts` in red (remove) and the three new modules in green (add). The viewer renders the refactoring plan as a visual diff.
