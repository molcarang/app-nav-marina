"""Copy selected release files into a versioned Google Drive folder using rclone."""
import hashlib
import os
from pathlib import Path
import re
import subprocess
import tempfile


def main():
    root = Path(__file__).resolve().parents[1]
    folder = os.environ.get('GDRIVE_FOLDER_ID', '')
    tag = os.environ.get('RELEASE_TAG', '')
    mode = os.environ.get('GDRIVE_UPLOAD_FILES', '')
    config = os.environ.get('GDRIVE_RCLONE_CONFIG', '')
    if not re.fullmatch(r'[A-Za-z0-9_-]+', folder):
        raise ValueError('GDRIVE_FOLDER_ID must contain the folder ID, not its URL')
    if not re.fullmatch(r'[A-Za-z0-9._-]+', tag) or tag in ('.', '..'):
        raise ValueError('Invalid release tag')
    if mode not in ('pdf', 'raspberry', 'both'):
        raise ValueError('GDRIVE_UPLOAD_FILES must be pdf, raspberry or both')
    if not config.strip():
        raise ValueError('Configure the GDRIVE_RCLONE_CONFIG repository secret first')
    files = []
    if mode in ('pdf', 'both'):
        files.append(root / 'docs/Instalar-OpenBoat-en-Raspberry.pdf')
    if mode in ('raspberry', 'both'):
        archive = root / 'artifacts/navmarina-raspberry.zip'
        sums = root / 'artifacts/SHA256SUMS'
        expected = dict(line.split(None, 1)[::-1] for line in sums.read_text().splitlines() if line.strip())
        if hashlib.sha256(archive.read_bytes()).hexdigest() != expected.get(archive.name):
            raise ValueError('Published Raspberry package checksum mismatch')
        files.extend([archive, sums])
    for path in files:
        if not path.is_file():
            raise FileNotFoundError(path.name)
    with tempfile.TemporaryDirectory(prefix='openboat-drive-') as temporary:
        config_path = Path(temporary) / 'rclone.conf'
        config_path.write_text(config, encoding='utf-8')
        config_path.chmod(0o600)
        # Keep credentials out of child-process environment and command arguments.
        environment = {key: value for key, value in os.environ.items() if key != 'GDRIVE_RCLONE_CONFIG'}
        for path in files:
            subprocess.run([
                'rclone', 'copyto', str(path), f'gdrive:{tag}/{path.name}',
                '--config', str(config_path), '--drive-root-folder-id', folder,
                '--retries', '3', '--log-level', 'ERROR',
            ], env=environment, check=True)
    print(f'Google Drive copy complete: {len(files)} file(s), release {tag}')


if __name__ == '__main__':
    main()
