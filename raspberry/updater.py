"""Opt-in local updates from this project's public GitHub releases."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import secrets
import shutil
import stat
import tempfile
import threading
import urllib.request
import zipfile

API = "https://api.github.com/repos/molcarang/app-nav-marina/releases?per_page=100"
DOWNLOAD_PREFIX = "https://github.com/molcarang/app-nav-marina/releases/download/"
PACKAGE = "navmarina-raspberry.zip"
MAX_DOWNLOAD = 100 * 1024 * 1024
MAX_UNPACKED = 250 * 1024 * 1024
PROTOCOL = 1


def read_info(home):
    return json.loads((Path(home) / "current" / "buildInfo.json").read_text(encoding="utf-8"))


def download(url, destination, limit=MAX_DOWNLOAD):
    if not url.startswith(DOWNLOAD_PREFIX):
        raise ValueError("Untrusted download location")
    request = urllib.request.Request(url, headers={"User-Agent": "NavMarina-Updater"})
    with urllib.request.urlopen(request, timeout=30) as response, open(destination, "wb") as output:
        total = 0
        while True:
            chunk = response.read(65536)
            if not chunk:
                break
            total += len(chunk)
            if total > limit:
                raise ValueError("Download too large")
            output.write(chunk)


def resolve_release(releases, release_id, current):
    for release in releases:
        if release.get("id") != release_id or release.get("draft") or release.get("prerelease"):
            continue
        try:
            info = json.loads(release.get("body", ""))
        except (ValueError, TypeError):
            continue
        if not isinstance(info, dict) or info.get("app") != "navmarina" or info.get("schema") != 1:
            continue
        number = info.get("buildNumber")
        if type(number) is not int or number <= current["buildNumber"] or info.get("channel") != current["channel"]:
            continue
        assets = {asset.get("name"): asset for asset in release.get("assets", []) if asset.get("state") == "uploaded"}
        package, checksums = assets.get(PACKAGE), assets.get("SHA256SUMS")
        if not package or not checksums:
            continue
        for asset in [package, checksums]:
            if not asset.get("browser_download_url", "").startswith(DOWNLOAD_PREFIX):
                raise ValueError("Untrusted release asset")
        return info, package["browser_download_url"], checksums["browser_download_url"]
    raise ValueError("Release unavailable or not newer")


def verify_checksum(archive, checksums):
    expected = None
    for line in Path(checksums).read_text(encoding="utf-8").splitlines():
        parts = line.split()
        if len(parts) == 2 and parts[1] == PACKAGE:
            expected = parts[0]
    actual = hashlib.sha256(Path(archive).read_bytes()).hexdigest()
    if not expected or not secrets.compare_digest(actual, expected):
        raise ValueError("Package checksum mismatch")


def unpack_package(archive, destination, expected):
    destination = Path(destination).resolve()
    with zipfile.ZipFile(archive) as bundle:
        entries = bundle.infolist()
        if len(entries) > 5000 or sum(entry.file_size for entry in entries) > MAX_UNPACKED:
            raise ValueError("Package too large")
        for entry in entries:
            path = PurePosixPath(entry.filename)
            if path.is_absolute() or ".." in path.parts or "\\" in entry.filename or ":" in entry.filename:
                raise ValueError("Unsafe archive path")
            if not path.parts or path.parts[0] != "navmarina-raspberry":
                raise ValueError("Unexpected package layout")
            if stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError("Archive links are forbidden")
            relative = Path(*path.parts[1:])
            if not relative.parts:
                continue
            if relative.parts[0] != "web" and str(relative) not in {
                "server.py", "updater.py", "buildInfo.json", "icon.png", "install.sh", "README.md"
            }:
                raise ValueError("Unexpected package file")
            target = (destination / relative).resolve()
            if not target.is_relative_to(destination):
                raise ValueError("Archive escapes staging directory")
            if entry.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with bundle.open(entry) as source, target.open("wb") as output:
                    shutil.copyfileobj(source, output)
    for name in ["web/index.html", "server.py", "updater.py", "buildInfo.json", "icon.png"]:
        if not (destination / name).is_file():
            raise ValueError("Incomplete package")
    info = json.loads((destination / "buildInfo.json").read_text(encoding="utf-8"))
    for key in ["version", "buildNumber", "channel", "commit"]:
        if info.get(key) != expected.get(key):
            raise ValueError("Package version does not match release")
    if info.get("schema") != 1 or info.get("target") != "raspberry" or info.get("updaterProtocol") != PROTOCOL:
        raise ValueError("Incompatible updater protocol")
    # Syntax-check future backend files without executing downloaded code here.
    for name in ["server.py", "updater.py"]:
        compile((destination / name).read_text(encoding="utf-8"), name, "exec")
    if not (destination / "web/index.html").stat().st_size:
        raise ValueError("Empty application")
    return info


def activate_version(home, version):
    home, version = Path(home).resolve(), Path(version).resolve()
    if not version.is_relative_to(home / "releases"):
        raise ValueError("Version must be inside releases")
    pending = home / (".current-" + secrets.token_hex(8))
    try:
        pending.symlink_to(version, target_is_directory=True)
        os.replace(pending, home / "current")
    finally:
        pending.unlink(missing_ok=True)


class Updater:
    def __init__(self, home):
        self.home = Path(home).resolve()
        self.token = secrets.token_urlsafe(32)
        self.lock = threading.Lock()
        self.state = {"state": "idle"}

    def snapshot(self):
        with self.lock:
            return {**self.state, "protocol": PROTOCOL, "token": self.token, "installed": read_info(self.home)}

    def start(self, release_id):
        with self.lock:
            if self.state["state"] in ["downloading", "verifying", "installing"]:
                return False
            self.state = {"state": "downloading", "releaseId": release_id}
        threading.Thread(target=self._run, args=(release_id,), daemon=True).start()
        return True

    def _set(self, state):
        with self.lock:
            self.state = {**self.state, "state": state}

    def _run(self, release_id):
        try:
            current = read_info(self.home)
            request = urllib.request.Request(API, headers={"User-Agent": "NavMarina-Updater", "Accept": "application/vnd.github+json"})
            with urllib.request.urlopen(request, timeout=15) as response:
                raw = response.read(5 * 1024 * 1024 + 1)
                if len(raw) > 5 * 1024 * 1024:
                    raise ValueError("Release metadata too large")
                releases = json.loads(raw)
            info, package_url, sums_url = resolve_release(releases, release_id, current)
            releases_dir = self.home / "releases"
            releases_dir.mkdir(exist_ok=True)
            with tempfile.TemporaryDirectory(prefix="download-", dir=releases_dir) as temporary:
                archive, sums = Path(temporary) / "package.zip", Path(temporary) / "SHA256SUMS"
                download(package_url, archive)
                download(sums_url, sums, 65536)
                self._set("verifying")
                verify_checksum(archive, sums)
                staged = Path(temporary) / "staged"
                staged.mkdir()
                unpack_package(archive, staged, info)
                self._set("installing")
                version = releases_dir / (str(info["buildNumber"]) + "-" + secrets.token_hex(6))
                staged.rename(version)
                activate_version(self.home, version)
            self._set("ready")
        except Exception as error:
            # Current version stays selected until the complete package has passed validation.
            print("NavMarina update failed:", type(error).__name__, str(error), flush=True)
            self._set("error")
