import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request
import zipfile
from functools import partial
from http.server import ThreadingHTTPServer

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "raspberry"))
import updater
from server import DashboardHandler

INFO = {"schema": 1, "app": "navmarina", "version": "1.0.2", "buildNumber": 12, "channel": "main", "commit": "abc"}
CURRENT = {**INFO, "buildNumber": 11}
BASE = updater.DOWNLOAD_PREFIX + "build-12/"


def package_bytes(info=None, extra=None):
    content = io.BytesIO()
    with zipfile.ZipFile(content, "w") as archive:
        files = {"web/index.html": "<html>new version</html>", "server.py": "pass", "updater.py": "pass", "icon.png": "icon",
                 "buildInfo.json": json.dumps(info or {**INFO, "target": "raspberry", "updaterProtocol": 1})}
        for name, value in files.items():
            archive.writestr("navmarina-raspberry/" + name, value)
        for name, value in (extra or {}).items():
            archive.writestr(name, value)
    return content.getvalue()


def release():
    return {"id": 22, "draft": False, "prerelease": False, "body": json.dumps(INFO), "assets": [
        {"name": name, "state": "uploaded", "browser_download_url": BASE + name}
        for name in [updater.PACKAGE, "SHA256SUMS"]]}


class PackageTests(unittest.TestCase):
    def test_selection_rejects_downgrades_other_channels_and_missing_checksums(self):
        self.assertEqual(updater.resolve_release([release()], 22, CURRENT)[0], INFO)
        with self.assertRaises(ValueError): updater.resolve_release([release()], 22, INFO)
        with self.assertRaises(ValueError): updater.resolve_release([release()], 22, {**CURRENT, "channel": "Develop"})
        invalid = release()
        invalid["assets"].pop()
        with self.assertRaises(ValueError): updater.resolve_release([invalid], 22, CURRENT)
        invalid = release()
        invalid["assets"][0]["browser_download_url"] = "https://example.com/other.zip"
        with self.assertRaises(ValueError): updater.resolve_release([invalid], 22, CURRENT)

    def test_checksum_and_metadata_are_required(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive, sums = root / "package.zip", root / "SHA256SUMS"
            archive.write_bytes(package_bytes())
            sums.write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + "  " + updater.PACKAGE)
            updater.verify_checksum(archive, sums)
            info = updater.unpack_package(archive, root / "staged", INFO)
            self.assertEqual(info["buildNumber"], 12)
            sums.write_text("0" * 64 + "  " + updater.PACKAGE)
            with self.assertRaises(ValueError): updater.verify_checksum(archive, sums)
            with self.assertRaises(ValueError): updater.unpack_package(archive, root / "mismatch", {**INFO, "commit": "other"})

    def test_archive_cannot_escape_or_inject_links_or_skip_backend_compatibility(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "package.zip"
            for index, name in enumerate(["navmarina-raspberry/../../escape", "/escape", "other/file", "navmarina-raspberry/browser/settings"]):
                archive.write_bytes(package_bytes(extra={name: "bad"}))
                with self.assertRaises(ValueError): updater.unpack_package(archive, root / str(index), INFO)
            self.assertFalse((root / "escape").exists())
            archive.write_bytes(package_bytes(info={**INFO, "target": "raspberry", "updaterProtocol": 99}))
            with self.assertRaises(ValueError): updater.unpack_package(archive, root / "incompatible", INFO)
            archive.write_bytes(package_bytes())
            with zipfile.ZipFile(archive, "a") as bundle:
                link = zipfile.ZipInfo("navmarina-raspberry/web/link")
                link.create_system = 3
                link.external_attr = 0o120777 << 16
                bundle.writestr(link, "/etc/passwd")
            with self.assertRaises(ValueError): updater.unpack_package(archive, root / "link", INFO)

    def test_complete_download_is_validated_before_switching_and_settings_are_untouched(self):
        for corrupt in [False, True]:
            with self.subTest(corrupt=corrupt), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                (root / "current").mkdir()
                (root / "current/buildInfo.json").write_text(json.dumps(CURRENT))
                (root / "browser").mkdir()
                settings = root / "browser/settings"
                settings.write_text("keep me")
                payload = package_bytes()
                sums = (hashlib.sha256(payload).hexdigest() if not corrupt else "0" * 64) + "  " + updater.PACKAGE
                def fake_download(url, destination, limit=0):
                    Path(destination).write_bytes(sums.encode() if url.endswith("SHA256SUMS") else payload)
                manager = updater.Updater(root)
                with patch.object(updater.urllib.request, "urlopen", return_value=io.BytesIO(json.dumps([release()]).encode())), \
                     patch.object(updater, "download", side_effect=fake_download), \
                     patch.object(updater, "activate_version") as activate:
                    manager._run(22)
                    self.assertEqual(manager.snapshot()["state"], "error" if corrupt else "ready")
                    self.assertEqual(activate.call_count, 0 if corrupt else 1)
                self.assertEqual(settings.read_text(), "keep me")
                self.assertEqual(updater.read_info(root)["buildNumber"], 11)

    def test_atomic_switch_keeps_previous_version(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "releases/old").mkdir(parents=True)
            (root / "releases/new").mkdir()
            try: (root / "current").symlink_to(root / "releases/old", target_is_directory=True)
            except OSError: self.skipTest("Symlinks unavailable on this host")
            updater.activate_version(root, root / "releases/new")
            self.assertEqual((root / "current").resolve(), root / "releases/new")
            self.assertTrue((root / "releases/old").is_dir())
            with self.assertRaises(ValueError): updater.activate_version(root, root.parent)


class FakeUpdater:
    token = "local-test-token"
    def __init__(self): self.calls = []
    def snapshot(self): return {"token": self.token, "protocol": 1, "state": "idle"}
    def start(self, release_id):
        self.calls.append(release_id)
        return len(self.calls) == 1


class QuietHandler(DashboardHandler):
    def log_message(self, *args): pass


class HttpTests(unittest.TestCase):
    def test_install_requires_local_host_origin_and_token_and_rejects_concurrent_requests(self):
        with tempfile.TemporaryDirectory() as temporary:
            manager = FakeUpdater()
            server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, home=temporary, updater=manager))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            url = "http://127.0.0.1:" + str(server.server_port)
            try:
                with urllib.request.urlopen(url + "/api/updates") as response:
                    self.assertEqual(json.load(response)["token"], manager.token)
                def post(headers):
                    request = urllib.request.Request(url + "/api/updates", data=b'{"releaseId":22}', headers={"Content-Type": "application/json", **headers})
                    try:
                        with urllib.request.urlopen(request) as response: return response.status
                    except urllib.error.HTTPError as error:
                        code = error.code
                        error.close()
                        return code
                valid = {"Origin": url, "X-NavMarina-Token": manager.token}
                self.assertEqual(post({}), 403)
                self.assertEqual(post({**valid, "Origin": "https://other.test"}), 403)
                self.assertEqual(post({**valid, "Host": "other.test"}), 403)
                self.assertEqual(post({**valid, "X-NavMarina-Token": "wrong"}), 403)
                self.assertEqual(post(valid), 202)
                self.assertEqual(post(valid), 409)
                self.assertEqual(manager.calls, [22, 22])
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


if __name__ == "__main__": unittest.main()
