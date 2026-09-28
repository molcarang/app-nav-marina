#!/usr/bin/env bash
set -euo pipefail
if [ "$(id -u)" = 0 ]; then
  echo "Run as the desktop user, without sudo." >&2
  exit 1
fi
command -v python3 >/dev/null || { echo "Install python3 first."; exit 1; }
browser="$(command -v chromium || command -v chromium-browser || true)"
[ -n "$browser" ] || { echo "Install Chromium first (sudo apt install chromium)."; exit 1; }
source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$source_dir/web/index.html" ] || { echo "Missing web/index.html"; exit 1; }
target="$HOME/.local/share/navmarina"
mkdir -p "$target/web" "$HOME/.local/bin" "$HOME/.config/systemd/user" "$HOME/.local/share/applications"
cp -R "$source_dir/web/." "$target/web/"
cp "$source_dir/server.py" "$target/server.py"
cat > "$HOME/.config/systemd/user/navmarina.service" <<'UNIT'
[Unit]
Description=NavMarina local dashboard
[Service]
ExecStart=/usr/bin/python3 %h/.local/share/navmarina/server.py
Restart=on-failure
RestartSec=3
[Install]
WantedBy=default.target
UNIT
cat > "$HOME/.local/bin/navmarina" <<'LAUNCH'
#!/usr/bin/env bash
set -euo pipefail
systemctl --user start navmarina.service
for attempt in {1..30}; do
  if python3 -c 'import urllib.request; urllib.request.urlopen("http://127.0.0.1:8765", timeout=1)' >/dev/null 2>&1; then break; fi
  sleep 1
done
browser="$(command -v chromium || command -v chromium-browser)"
exec "$browser" --user-data-dir="$HOME/.local/share/navmarina/browser" --app=http://127.0.0.1:8765 --start-maximized --no-first-run --autoplay-policy=no-user-gesture-required
LAUNCH
chmod +x "$HOME/.local/bin/navmarina"
cat > "$HOME/.local/share/applications/navmarina.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=NavMarina
Comment=Marine dashboard
Exec="$HOME/.local/bin/navmarina"
Icon=applications-internet
Terminal=false
Categories=Utility;
DESKTOP
desktop="$(xdg-user-dir DESKTOP 2>/dev/null || printf '%s/Desktop' "$HOME")"
mkdir -p "$desktop"
cp "$HOME/.local/share/applications/navmarina.desktop" "$desktop/navmarina.desktop"
chmod +x "$desktop/navmarina.desktop"
systemctl --user daemon-reload
systemctl --user enable --now navmarina.service
echo "Installed. Open NavMarina from the desktop or application menu."
