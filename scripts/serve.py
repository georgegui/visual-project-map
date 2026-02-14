#!/usr/bin/env python3
"""Start a local server for the graph viewer."""
import http.server
import os
import sys
import webbrowser

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
graph = sys.argv[2] if len(sys.argv) > 2 else "../examples/minimal.json"

os.chdir(repo_root)
url = f"http://localhost:{port}/viewer/?graph={graph}"
print(f"Serving viewer at {url}")
webbrowser.open(url)
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=port)
