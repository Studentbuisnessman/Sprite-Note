#!/usr/bin/env bash
# uninstall.sh — quita Clawdnote (ruta ligera). No borra tus datos por defecto.
set -euo pipefail
PREFIX="$HOME/.local"

rm -f  "$PREFIX/bin/clawdnote"
rm -rf "$PREFIX/share/clawdnote-app"
rm -f  "$PREFIX/share/icons/hicolor/512x512/apps/clawdnote.png"
rm -f  "$PREFIX/share/applications/clawdnote.desktop"

echo ">> Clawdnote desinstalado."
echo "Tus datos siguen en: ${XDG_DATA_HOME:-$HOME/.local/share}/clawdnote"
echo "Para borrarlos también:  rm -rf \"${XDG_DATA_HOME:-$HOME/.local/share}/clawdnote\""
