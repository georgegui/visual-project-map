# Worked Example — Scan Mode

> Reference example for `/visualize-project /path/to/project`. Shows the complete output for a scan of an existing data pipeline project.

---

Given a project at `/path/to/data-pipeline/`:
```
data-pipeline/
  CLAUDE.md          # Has "Workflow: Ingest → Clean → Export"
  scripts/
    ingest/
      download.py    # reads API, writes raw/*.json
      validate.py    # reads raw/*.json, writes validated/*.json
    clean/
      normalize.py   # reads validated/*.json, writes clean/*.csv
      deduplicate.py # reads clean/*.csv, writes deduped/*.csv
    export/
      build_db.py    # reads deduped/*.csv, writes output.sqlite
  Makefile           # all: ingest clean export
```

Running `/visualize-project /path/to/data-pipeline --depth 1` produces:

```json
{
  "title": "Data Pipeline Workflow",
  "description": "ETL pipeline that downloads records from an API, normalizes and deduplicates them, then loads the results into a SQLite database.",
  "_generationMode": "scan",
  "_generatedAt": "2026-02-16T14:30:00Z",
  "modules": [
    { "id": "mod_ingest", "label": "Ingest", "color": "#dbeafe", "borderColor": "#93c5fd",
      "status": "verified", "confidence": "high",
      "description": "Downloads raw JSON from the API and validates schema conformance.",
      "docPath": "scripts/ingest/CLAUDE.md",
      "interface": {
        "inputs": [{ "name": "api_config", "description": "Source API endpoints and credentials", "format": "YAML" }],
        "outputs": [{ "name": "validated_json", "description": "Schema-valid JSON files", "format": "JSON, one file per record" }]
      }
    },
    { "id": "mod_clean", "label": "Clean", "color": "#e0e7ff", "borderColor": "#a5b4fc",
      "status": "ai-tested", "confidence": "medium", "needsHumanReview": true,
      "checkpointReason": "Deduplication logic has no test coverage (no test_*.py found)",
      "description": "Normalizes field formats and removes duplicate records.",
      "interface": {
        "inputs": [{ "name": "validated_json", "description": "Schema-valid JSON files from ingest", "format": "JSON" }],
        "outputs": [{ "name": "deduped_csv", "description": "Deduplicated records in CSV format", "format": "CSV" }]
      }
    },
    { "id": "mod_export", "label": "Export", "color": "#fef2f2", "borderColor": "#fca5a5",
      "status": "draft", "confidence": "low", "needsHumanReview": true,
      "checkpointReason": "No tests, draft code only, contains TODO comments",
      "description": "Builds the final SQLite database from deduplicated CSV.",
      "interface": {
        "inputs": [{ "name": "deduped_csv", "description": "Deduplicated CSV records", "format": "CSV" }],
        "outputs": [{ "name": "sqlite_db", "description": "Final SQLite database", "format": "SQLite" }]
      }
    },
    { "id": "mod_term", "label": "Terminals", "color": "#f1f5f9", "borderColor": "#94a3b8" }
  ],
  "nodes": [
    { "id": "ing_in_api",   "module": "mod_ingest", "label": "api_config",
      "_isInterfacePort": true, "_portDirection": "input",
      "interfaceContract": { "name": "api_config", "description": "Source API endpoints and credentials", "format": "YAML" } },
    { "id": "ing_dl",       "module": "mod_ingest", "label": "ingest.download" },
    { "id": "ing_val",      "module": "mod_ingest", "label": "ingest.validate",
      "description": "Checks each JSON file against the expected schema. Invalid files are logged and skipped.",
      "io": {
        "inputs":  [{ "name": "raw_json", "description": "Raw API response files", "format": "JSON" }],
        "outputs": [{ "name": "validated_json", "description": "Schema-conformant records", "format": "JSON" }]
      } },
    { "id": "ing_out_json", "module": "mod_ingest", "label": "validated_json",
      "_isInterfacePort": true, "_portDirection": "output",
      "interfaceContract": { "name": "validated_json", "description": "Schema-valid JSON files", "format": "JSON" } },
    { "id": "cln_in_json",  "module": "mod_clean",  "label": "validated_json",
      "_isInterfacePort": true, "_portDirection": "input",
      "interfaceContract": { "name": "validated_json", "description": "Schema-valid JSON files", "format": "JSON" } },
    { "id": "cln_norm",     "module": "mod_clean",  "label": "clean.normalize" },
    { "id": "cln_dup",      "module": "mod_clean",  "label": "clean.deduplicate",
      "description": "Removes exact and fuzzy duplicates using title + DOI matching." },
    { "id": "cln_out_csv",  "module": "mod_clean",  "label": "deduped_csv",
      "_isInterfacePort": true, "_portDirection": "output",
      "interfaceContract": { "name": "deduped_csv", "description": "Deduplicated records", "format": "CSV" } },
    { "id": "exp_in_csv",   "module": "mod_export", "label": "deduped_csv",
      "_isInterfacePort": true, "_portDirection": "input",
      "interfaceContract": { "name": "deduped_csv", "description": "Deduplicated CSV records", "format": "CSV" } },
    { "id": "exp_db",       "module": "mod_export", "label": "export.build_db" },
    { "id": "exp_out_db",   "module": "mod_export", "label": "sqlite_db",
      "_isInterfacePort": true, "_portDirection": "output",
      "interfaceContract": { "name": "sqlite_db", "description": "Final SQLite database", "format": "SQLite" } },
    { "id": "DONE",         "module": "mod_term",   "label": "COMPLETE",
      "style": { "color": "#d1fae5", "borderColor": "#6ee7b7" } }
  ],
  "edges": [
    { "source": "ing_in_api",  "target": "ing_dl",      "style": "solid" },
    { "source": "ing_dl",      "target": "ing_val",      "label": "validate", "style": "solid", "actor": "script",
      "details": { "script": "scripts/ingest/validate.py", "input": ["raw/*.json"], "output": ["validated/*.json"] } },
    { "source": "ing_val",     "target": "ing_out_json", "style": "solid" },
    { "source": "ing_out_json","target": "cln_in_json",  "label": "normalize", "style": "solid", "actor": "script",
      "description": "Passes validated JSON files to the normalization step. Only schema-valid records cross this boundary.",
      "confidence": "high" },
    { "source": "cln_in_json", "target": "cln_norm",     "style": "solid" },
    { "source": "cln_norm",    "target": "cln_dup",      "label": "deduplicate", "style": "solid", "actor": "script" },
    { "source": "cln_dup",     "target": "cln_out_csv",  "style": "solid" },
    { "source": "cln_out_csv", "target": "exp_in_csv",   "label": "build DB", "style": "solid", "actor": "script",
      "confidence": "high" },
    { "source": "exp_in_csv",  "target": "exp_db",       "style": "solid" },
    { "source": "exp_db",      "target": "exp_out_db",   "style": "solid" },
    { "source": "exp_out_db",  "target": "DONE",         "label": "complete", "style": "solid",
      "confidence": "high" }
  ],
  "criticalPath": ["ing_in_api", "ing_dl", "ing_val", "ing_out_json",
    "cln_in_json", "cln_norm", "cln_dup", "cln_out_csv",
    "exp_in_csv", "exp_db", "exp_out_db", "DONE"]
}
```

4 modules, 12 nodes (6 internal + 6 ports), 11 edges (5 intra-module routing + 3 cross-module port-to-port + 3 internal processing). Demonstrates: interface ports on every non-terminal module, scan-mode confidence with `needsHumanReview` flags, `node.io` on a key processing node, edge confidence on cross-module connections, and `criticalPath` tracing the full pipeline.
