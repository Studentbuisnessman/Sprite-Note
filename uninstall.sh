#!/usr/bin/env bash
# uninstall.sh — quita Spritenote (ruta ligera). No borra tus datos por defecto.
set -euo pipefail
PREFIX="$HOME/.local"

rm -f  "$PREFIX/bin/spritenote"
rm -rf "$PREFIX/share/spritenote-app"
rm -f  "$PREFIX/share/icons/hicolor/512x512/apps/spritenote.png"
rm -f  "$PREFIX/share/applications/spritenote.desktop"

echo ">> Spritenote desinstalado."
echo "Tus datos siguen en: ${XDG_DATA_HOME:-$HOME/.local/share}/spritenote"
echo "Para borrarlos también:  rm -rf \"${XDG_DATA_HOME:-$HOME/.local/share}/spritenote\""
