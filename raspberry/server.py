"""Serve the bundled dashboard on loopback only; Signal K remains on port 3000."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class DashboardHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    root = Path(__file__).resolve().parent / 'web'
    if not (root / 'index.html').is_file():
        raise SystemExit('Missing web/index.html; install the complete dashboard package.')
    ThreadingHTTPServer(('127.0.0.1', 8765), partial(DashboardHandler, directory=str(root))).serve_forever()
