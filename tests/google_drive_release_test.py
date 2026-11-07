import contextlib
import hashlib
import importlib.util
import io
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('drive_upload', Path(__file__).resolve().parents[1] / 'scripts/upload-release-to-drive.py')
UPLOAD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(UPLOAD)


class DriveReleaseTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / 'artifacts').mkdir()
        (self.root / 'docs').mkdir()
        (self.root / 'docs/Instalar-OpenBoat-en-Raspberry.pdf').write_bytes(b'pdf')
        self.archive = self.root / 'artifacts/navmarina-raspberry.zip'
        self.archive.write_bytes(b'zip-content')
        (self.root / 'artifacts/SHA256SUMS').write_text(hashlib.sha256(self.archive.read_bytes()).hexdigest() + '  navmarina-raspberry.zip\n')
        self.environment = {
            'GDRIVE_FOLDER_ID': 'folder-id', 'RELEASE_TAG': 'release-12',
            'GDRIVE_UPLOAD_FILES': 'raspberry',
            'GDRIVE_RCLONE_CONFIG': '[gdrive]\ntype = drive\ntoken = private-test-token\n',
        }

    def execute(self, changes=None):
        calls = []
        def run(command, **kwargs):
            config = Path(command[command.index('--config') + 1])
            self.assertEqual(config.read_text(), self.environment['GDRIVE_RCLONE_CONFIG'])
            self.assertNotIn('GDRIVE_RCLONE_CONFIG', kwargs['env'])
            self.assertNotIn('private-test-token', ' '.join(command))
            calls.append((command, config))
        with patch.dict(os.environ, {**self.environment, **(changes or {})}, clear=True), \
                patch.object(UPLOAD, '__file__', str(self.root / 'scripts/upload-release-to-drive.py')), \
                patch.object(UPLOAD.subprocess, 'run', side_effect=run), \
                contextlib.redirect_stdout(io.StringIO()):
            UPLOAD.main()
        for _, config in calls:
            self.assertFalse(config.exists())
        return [command for command, _ in calls]

    def test_zip_and_checksum_use_versioned_destination(self):
        calls = self.execute()
        self.assertEqual(len(calls), 2)
        self.assertEqual(calls[0][3], 'gdrive:release-12/navmarina-raspberry.zip')
        self.assertIn('folder-id', calls[0])

    def test_pdf_only_and_both(self):
        self.assertEqual(len(self.execute({'GDRIVE_UPLOAD_FILES': 'pdf'})), 1)
        self.assertEqual(len(self.execute({'GDRIVE_UPLOAD_FILES': 'both'})), 3)

    def test_corrupt_package_is_not_uploaded(self):
        self.archive.write_bytes(b'corrupt')
        with self.assertRaisesRegex(ValueError, 'checksum'):
            self.execute()

    def test_missing_credentials_fail_before_upload(self):
        with self.assertRaisesRegex(ValueError, 'secret'):
            self.execute({'GDRIVE_RCLONE_CONFIG': ''})

    def test_invalid_destination_mode_and_tag(self):
        for changes in [{'GDRIVE_FOLDER_ID': 'https://drive.google.com/folder'},
                        {'RELEASE_TAG': '../other'}, {'GDRIVE_UPLOAD_FILES': 'all'}]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                self.execute(changes)


if __name__ == '__main__':
    unittest.main()
