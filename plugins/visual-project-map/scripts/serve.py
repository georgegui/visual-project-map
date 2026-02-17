#!/usr/bin/env python3
"""Start a local server for the graph viewer, rooted at the project directory.

Usage:
  python3 serve.py [port] [graph_path]

  graph_path can be:
    - Absolute path: /Users/.../project/.graphs/my-graph.json
      (project root inferred as parent of .graphs/)
    - Relative path: .graphs/my-graph.json
      (project root = cwd)

  If omitted, looks for the first .json in .graphs/ or uses a bundled example.

How it works:
  1. Copies the viewer (HTML + JS) into {project}/.graphs/_viewer/
  2. Starts an HTTP server rooted at the project directory
  3. Opens the browser at .graphs/_viewer/?graph=../name.json

  Because the server root is the project directory, docs paths in the graph
  JSON (like ../CLAUDE.md relative to .graphs/) resolve to actual project files.
"""
import http.server
import glob
import os
import shutil
import sys
import webbrowser

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
graph_arg = sys.argv[2] if len(sys.argv) > 2 else None

plugin_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
viewer_src = os.path.join(plugin_dir, "viewer")

# --- Determine project root and graph path ---

if graph_arg and os.path.isabs(graph_arg):
    graph_abs = os.path.abspath(graph_arg)
    if not os.path.isfile(graph_abs):
        print(f"Error: {graph_abs} not found")
        sys.exit(1)
    # Infer project root: if graph is in .graphs/, go up one level
    graph_dir = os.path.dirname(graph_abs)
    if os.path.basename(graph_dir) == ".graphs":
        project_root = os.path.dirname(graph_dir)
    else:
        project_root = graph_dir
    graph_name = os.path.basename(graph_abs)
    # Ensure graph is in .graphs/
    graphs_dir = os.path.join(project_root, ".graphs")
    os.makedirs(graphs_dir, exist_ok=True)
    dest = os.path.join(graphs_dir, graph_name)
    if os.path.abspath(graph_abs) != os.path.abspath(dest):
        shutil.copy2(graph_abs, dest)
        print(f"Copied {graph_abs} → {dest}")
elif graph_arg:
    graph_abs = os.path.abspath(graph_arg)
    if not os.path.isfile(graph_abs):
        print(f"Error: {graph_abs} not found")
        sys.exit(1)
    graph_dir = os.path.dirname(graph_abs)
    if os.path.basename(graph_dir) == ".graphs":
        project_root = os.path.dirname(graph_dir)
    else:
        project_root = os.getcwd()
        # Copy into .graphs/ if not already there
        graphs_dir = os.path.join(project_root, ".graphs")
        os.makedirs(graphs_dir, exist_ok=True)
        dest = os.path.join(graphs_dir, os.path.basename(graph_abs))
        if os.path.abspath(graph_abs) != os.path.abspath(dest):
            shutil.copy2(graph_abs, dest)
    graph_name = os.path.basename(graph_abs)
else:
    project_root = os.getcwd()
    graphs_dir = os.path.join(project_root, ".graphs")
    # Auto-detect: first .json in .graphs/
    if os.path.isdir(graphs_dir):
        jsons = sorted(glob.glob(os.path.join(graphs_dir, "*.json")))
        if jsons:
            graph_name = os.path.basename(jsons[0])
        else:
            graph_name = None
    else:
        graph_name = None
    if not graph_name:
        # Fall back to bundled example
        os.makedirs(graphs_dir, exist_ok=True)
        example = os.path.join(plugin_dir, "examples", "minimal.json")
        if os.path.isfile(example):
            shutil.copy2(example, os.path.join(graphs_dir, "minimal.json"))
            graph_name = "minimal.json"
        else:
            print("Error: no graph found. Pass a graph path or create .graphs/*.json")
            sys.exit(1)

# --- Copy viewer into .graphs/_viewer/ ---

viewer_dest = os.path.join(project_root, ".graphs", "_viewer")
viewer_src_dir = os.path.join(viewer_src, "src")
viewer_dest_src = os.path.join(viewer_dest, "src")

os.makedirs(viewer_dest_src, exist_ok=True)

# Copy index.html and all JS files
shutil.copy2(os.path.join(viewer_src, "index.html"), os.path.join(viewer_dest, "index.html"))
for js_file in os.listdir(viewer_src_dir):
    if js_file.endswith(".js"):
        shutil.copy2(os.path.join(viewer_src_dir, js_file), os.path.join(viewer_dest_src, js_file))

print(f"Viewer synced to .graphs/_viewer/")

# --- Start server from project root ---

os.chdir(project_root)
graph_url = f"../{graph_name}"
url = f"http://localhost:{port}/.graphs/_viewer/?graph={graph_url}"
print(f"Project root: {project_root}")
print(f"Graph: .graphs/{graph_name}")
print(f"Serving at {url}")
webbrowser.open(url)
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=port)
