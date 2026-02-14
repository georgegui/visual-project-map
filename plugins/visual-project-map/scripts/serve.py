#!/usr/bin/env python3
"""Start a local server for the graph viewer.

Usage:
  python3 serve.py [port] [graph_path]

  graph_path can be:
    - Absolute path: /Users/.../project/.graphs/my-graph.json
      (auto-copied to examples/ so the server can serve it)
    - Relative to viewer: ../examples/minimal.json
      (used as-is)

  If omitted, defaults to ../examples/minimal.json
"""
import http.server
import os
import shutil
import sys
import webbrowser

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
graph_arg = sys.argv[2] if len(sys.argv) > 2 else None
plugin_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
examples_dir = os.path.join(plugin_dir, "examples")

if graph_arg and os.path.isabs(graph_arg):
    src = os.path.expanduser(graph_arg)
    if not os.path.isfile(src):
        print(f"Error: {src} not found")
        sys.exit(1)
    basename = os.path.basename(src)
    dest = os.path.join(examples_dir, basename)
    shutil.copy2(src, dest)
    graph_url = f"../examples/{basename}"
    print(f"Copied {src} → {dest}")
elif graph_arg:
    graph_url = graph_arg
else:
    graph_url = "../examples/minimal.json"

os.chdir(plugin_dir)
url = f"http://localhost:{port}/viewer/?graph={graph_url}"
print(f"Serving viewer at {url}")
webbrowser.open(url)
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=port)
