"""Local dashboard and opt-in updater, bound exclusively to loopback."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import secrets
from urllib.parse import urlsplit
from updater import Updater


class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, home, updater, **kwargs):
        self.home, self.updater = Path(home), updater
        super().__init__(*args, directory=str(self.home / "current" / "web"), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def _local_host(self):
        port = self.server.server_port
        return self.headers.get("Host") in {f"127.0.0.1:{port}", f"localhost:{port}"}

    def _json(self, value, code=200):
        body = json.dumps(value).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not self._local_host():
            return self._json({"error": "Invalid host"}, 403)
        if urlsplit(self.path).path == "/api/updates":
            return self._json(self.updater.snapshot())
        super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != "/api/updates":
            return self._json({"error": "Not found"}, 404)
        if not self._local_host() or self.headers.get("Origin") != "http://" + self.headers.get("Host", ""):
            return self._json({"error": "Invalid origin"}, 403)
        token = self.headers.get("X-NavMarina-Token", "")
        if not secrets.compare_digest(token, self.updater.token):
            return self._json({"error": "Invalid token"}, 403)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 4096 or self.headers.get("Content-Type") != "application/json":
                raise ValueError("Invalid request")
            body = json.loads(self.rfile.read(length))
            release_id = body.get("releaseId")
            if type(release_id) is not int or release_id <= 0:
                raise ValueError("Invalid release ID")
        except (ValueError, TypeError, AttributeError):
            return self._json({"error": "Invalid request"}, 400)
        if not self.updater.start(release_id):
            return self._json({"error": "Update already running"}, 409)
        self._json({"state": "downloading"}, 202)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--home", type=Path, required=True)
    args = parser.parse_args()
    if not (args.home / "current/web/index.html").is_file():
        raise SystemExit("Missing web/index.html; install the complete package")
    updater = Updater(args.home)
    ThreadingHTTPServer(("127.0.0.1", 8765), partial(DashboardHandler, home=args.home, updater=updater)).serve_forever()
