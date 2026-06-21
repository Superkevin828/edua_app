#!/usr/bin/env python3
"""
cf_pages_server.py
A local dev server that mimics Cloudflare Pages' static-asset routing,
so `frontend/` behaves locally the same way it does on cloudflare.

Cloudflare Pages resolution rules implemented here:
  /                -> index.html
  /foo             -> foo.html        (if it exists)   <-- clean URLs
  /foo             -> foo/index.html  (if foo/ is a dir)
  /foo/            -> foo/index.html
  exact file paths (css/js/images/...) served as-is
  no match         -> 404.html if it exists, else a plain 404
  every response sent with no-cache headers (so edits always show up)

Usage (run from inside your frontend folder):
    python3 cf_pages_server.py            # port 3000
    python3 cf_pages_server.py 8080       # custom port
"""

import http.server
import os
import sys
import urllib.parse
from pathlib import Path

ROOT = Path.cwd().resolve()
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000


class CFPagesHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def resolve_path(self, raw_path):
        parsed = urllib.parse.urlsplit(raw_path)
        path = urllib.parse.unquote(parsed.path)
        rel = path.lstrip("/")

        # block path traversal
        if ".." in rel.split("/"):
            return None

        # root
        if rel == "":
            candidate = ROOT / "index.html"
            return candidate if candidate.is_file() else None

        fs_path = ROOT / rel

        # 1. exact file match
        if fs_path.is_file():
            return fs_path

        # 2. directory -> index.html (with or without trailing slash)
        if fs_path.is_dir():
            candidate = fs_path / "index.html"
            return candidate if candidate.is_file() else None

        # 3. clean URL: extensionless path -> append .html
        if fs_path.suffix == "":
            candidate = fs_path.with_suffix(".html")
            if candidate.is_file():
                return candidate

        return None

    def send_head(self):
        resolved = self.resolve_path(self.path)
        if resolved is None:
            return self.serve_404()
        rel = resolved.relative_to(ROOT)
        self.path = "/" + str(rel).replace(os.sep, "/")
        print(f"  200 -> {rel}")
        return super().send_head()

    def serve_404(self):
        custom_404 = ROOT / "404.html"
        if custom_404.is_file():
            self.path = "/404.html"
            print("  404 -> 404.html (custom page)")
            return super().send_head()
        body = b"<h1>404 Not Found</h1>"
        self.send_response(404)
        self.send_header("Content-Type", "text/html")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        print("  404 -> no 404.html found, sent generic page")
        return None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {self.address_string()} {format % args}")


def main():
    if not (ROOT / "index.html").exists():
        print(f"⚠️  No index.html in {ROOT} — run this from inside your frontend folder.")
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), CFPagesHandler)
    print(f"Serving {ROOT}")
    print(f"Cloudflare-Pages-style routing on http://localhost:{PORT}/  (Ctrl+C to stop)\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
