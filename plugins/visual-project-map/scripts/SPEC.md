# Scripts — Specification

## Acceptance Criteria
- [ ] `serve.py` starts an HTTP server on the specified port (default 8080)
- [ ] `serve.py` copies viewer files into `{project}/.graphs/_viewer/` so the server can serve them
- [ ] `serve.py` opens the default browser with the correct `?graph=` URL
- [ ] Absolute and relative graph paths both resolve correctly
- [ ] Auto-detects `.graphs/*.json` when no graph path is specified
- [ ] Port conflict produces a clear error message, not a silent failure

## Edge Cases
- Port already in use (should suggest alternative or increment)
- Graph path does not exist (should error before starting server)
- No `.graphs/` directory exists (should create it or error clearly)
- Running from a different working directory than the project root

## Validation Checks
- `python3 serve.py 8080` starts server and opens browser
- `python3 serve.py 8080 /path/to/graph.json` serves the specified graph
- Kill server, restart on same port — no "address already in use" hang
