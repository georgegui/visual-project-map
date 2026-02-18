# Scripts

Development utilities for serving and testing the graph viewer locally.

## Executor
Script (serve.py) — automated server startup and viewer deployment.

## Status
tested.ai

## Inputs
- **port number**: Optional HTTP server port, default 8080 (integer, positional arg)
- **graph path**: Optional path to a graph JSON file to serve (filesystem path, positional arg)

## Outputs
- **local HTTP server**: Serves the viewer with the specified graph at `http://localhost:{port}/.graphs/_viewer/` (HTTP)

## Files
- **`serve.py`** — Copies viewer into `{project}/.graphs/_viewer/`, starts HTTP server rooted at the project directory, opens browser. Handles absolute and relative graph paths, auto-detects `.graphs/*.json`.
