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
import atexit
import http.client
import http.server
import glob
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
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


# --- Custom handler with API endpoints ---

class ViewerHandler(http.server.SimpleHTTPRequestHandler):
    """Extends SimpleHTTPRequestHandler with API endpoints for terminal launch."""

    def do_GET(self):
        if self.path == "/api/terminal-status":
            self._handle_terminal_status()
        elif self.path.startswith("/ttyd/") or self.path == "/ttyd":
            self._proxy_ttyd()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/open-terminal":
            self._handle_open_terminal()
        elif self.path == "/api/start-terminal":
            self._handle_start_terminal()
        elif self.path.startswith("/ttyd/"):
            self._proxy_ttyd()
        else:
            self.send_error(404)

    def _handle_open_terminal(self):
        # Read optional JSON body for context (selected node, file paths)
        content_len = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_len)) if content_len else {}

        cd_path = project_root
        cmd = body.get("command", "claude")

        # Build the terminal command
        terminal_cmd = f"cd {_shell_quote(cd_path)} && {cmd}"

        if sys.platform == "darwin":
            # macOS: use osascript to open Terminal.app with command
            apple_script = (
                f'tell application "Terminal"\n'
                f'  do script "{terminal_cmd}"\n'
                f'  activate\n'
                f'end tell'
            )
            subprocess.Popen(["osascript", "-e", apple_script])
        elif sys.platform == "linux":
            # Linux: try common terminal emulators
            for term in ["gnome-terminal", "xterm", "konsole"]:
                if shutil.which(term):
                    subprocess.Popen([term, "--", "bash", "-c", terminal_cmd])
                    break
        else:
            # Windows or other
            subprocess.Popen(["cmd", "/c", "start", "cmd", "/k", terminal_cmd])

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "path": cd_path}).encode())

    def _handle_start_terminal(self):
        """Start ttyd and return its port for iframe embedding."""
        content_len = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_len)) if content_len else {}
        command = body.get("command", "claude")

        try:
            proc, port = _start_ttyd(project_root, command)
        except FileNotFoundError:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "error",
                "error": "ttyd_not_installed",
                "message": "ttyd is not installed. Install with: brew install ttyd"
            }).encode())
            return

        # Brief wait for ttyd to bind its port
        time.sleep(0.3)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "port": port,
            "url": f"http://localhost:{port}"
        }).encode())

    def _handle_terminal_status(self):
        """Return ttyd installation and running status."""
        installed = shutil.which('ttyd') is not None
        running = _ttyd_process is not None and _ttyd_process.poll() is None
        port = _ttyd_port if running else None

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({
            "installed": installed,
            "running": running,
            "port": port
        }).encode())

    # --- ttyd reverse proxy (same-origin) ---

    def _proxy_ttyd(self):
        """Proxy HTTP/WebSocket requests to ttyd for same-origin embedding."""
        print(f"[ttyd-proxy] {self.command} {self.path}", flush=True)
        if _ttyd_port is None:
            print("[ttyd-proxy] ERROR: ttyd not running", flush=True)
            self.send_error(502, 'ttyd not running')
            return

        # WebSocket upgrade — relay raw sockets
        if self.headers.get('Upgrade', '').lower() == 'websocket':
            print(f"[ttyd-proxy] WebSocket upgrade for {self.path}", flush=True)
            self._proxy_websocket()
            return

        # Regular HTTP proxy
        body = None
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length)

        try:
            conn = http.client.HTTPConnection('localhost', _ttyd_port, timeout=10)
            conn.putrequest(self.command, self.path,
                            skip_host=True, skip_accept_encoding=True)
            for key, val in self.headers.items():
                if key.lower() == 'host':
                    conn.putheader(key, f'localhost:{_ttyd_port}')
                elif key.lower() not in ('connection',):
                    conn.putheader(key, val)
            conn.endheaders(body)
            resp = conn.getresponse()

            self.send_response(resp.status)
            for key, val in resp.getheaders():
                if key.lower() not in ('transfer-encoding', 'connection'):
                    self.send_header(key, val)
            self.end_headers()
            self.wfile.write(resp.read())
            conn.close()
        except Exception as e:
            self.send_error(502, str(e))

    def _proxy_websocket(self):
        """Relay a WebSocket connection to ttyd bidirectionally."""
        try:
            print(f"[ttyd-ws] Connecting to ttyd on port {_ttyd_port}...", flush=True)
            ttyd_sock = socket.create_connection(('localhost', _ttyd_port), timeout=10)

            # Forward the upgrade request to ttyd
            req_lines = [f'GET {self.path} HTTP/1.1']
            for key, val in self.headers.items():
                if key.lower() == 'host':
                    req_lines.append(f'Host: localhost:{_ttyd_port}')
                else:
                    req_lines.append(f'{key}: {val}')
            ttyd_sock.sendall(('\r\n'.join(req_lines) + '\r\n\r\n').encode())

            # Read ttyd's upgrade response (ends with \r\n\r\n)
            buf = b''
            while b'\r\n\r\n' not in buf:
                chunk = ttyd_sock.recv(4096)
                if not chunk:
                    ttyd_sock.close()
                    return
                buf += chunk

            # Forward the full response (including any data after headers) to client
            self.wfile.write(buf)
            self.wfile.flush()

            # Bidirectional relay until either side closes
            client_sock = self.request
            self.close_connection = True

            def relay(src, dst):
                try:
                    while True:
                        data = src.recv(65536)
                        if not data:
                            break
                        dst.sendall(data)
                except (OSError, ConnectionError):
                    pass

            t1 = threading.Thread(target=relay, args=(client_sock, ttyd_sock), daemon=True)
            t2 = threading.Thread(target=relay, args=(ttyd_sock, client_sock), daemon=True)
            t1.start()
            t2.start()
            t1.join()
            t2.join()
            ttyd_sock.close()
        except Exception:
            pass

    def do_OPTIONS(self):
        """Handle CORS preflight for API endpoints."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


def _shell_quote(s):
    """Quote a string for safe shell use."""
    return "'" + s.replace("'", "'\\''") + "'"


# --- ttyd process management ---

_ttyd_process = None
_ttyd_port = None


def _find_free_port():
    """Find an available port by binding an ephemeral socket."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]


def _start_ttyd(cwd, command='claude'):
    """Spawn ttyd on a free port. Returns (process, port) or raises."""
    global _ttyd_process, _ttyd_port

    # Guard against double-start
    if _ttyd_process is not None and _ttyd_process.poll() is None:
        return _ttyd_process, _ttyd_port

    ttyd_path = shutil.which('ttyd')
    if not ttyd_path:
        raise FileNotFoundError('ttyd not installed')

    _ttyd_port = _find_free_port()
    _ttyd_process = subprocess.Popen(
        [ttyd_path, '-W', '-p', str(_ttyd_port), '-w', cwd,
         '--base-path', '/ttyd/', command],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return _ttyd_process, _ttyd_port


def _cleanup_ttyd():
    """Terminate the ttyd process if running."""
    global _ttyd_process
    if _ttyd_process is None:
        return
    try:
        _ttyd_process.terminate()
        _ttyd_process.wait(timeout=3)
    except Exception:
        try:
            _ttyd_process.kill()
        except Exception:
            pass
    _ttyd_process = None


atexit.register(_cleanup_ttyd)
signal.signal(signal.SIGTERM, lambda *_: (_cleanup_ttyd(), sys.exit(0)))


webbrowser.open(url)
http.server.test(HandlerClass=ViewerHandler, port=port)
