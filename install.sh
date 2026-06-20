#!/usr/bin/env bash
# install.sh — instala Spritenote (comando + ícono de menú).
# Copia la app a ~/.local/share/spritenote-app, crea el comando `spritenote`
# en ~/.local/bin y registra el ícono + entrada de menú.

set -euo pipefail

SRC="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"

PREFIX="$HOME/.local"
APPHOME="$PREFIX/share/spritenote-app"
BIN="$PREFIX/bin"
ICONS="$PREFIX/share/icons/hicolor/512x512/apps"
DESKTOPS="$PREFIX/share/applications"

echo ">> Instalando Spritenote en $APPHOME"
mkdir -p "$APPHOME" "$BIN" "$ICONS" "$DESKTOPS"

# Copiar app (src + launcher + icono)
cp -r "$SRC/src" "$APPHOME/"
cp "$SRC/spritenote-launch.sh" "$APPHOME/"
chmod +x "$APPHOME/spritenote-launch.sh"

# Comando `spritenote`
ln -sf "$APPHOME/spritenote-launch.sh" "$BIN/spritenote"

# Ícono + entrada de menú
cp "$SRC/build/icon.png" "$ICONS/spritenote.png"
cp "$SRC/spritenote.desktop" "$DESKTOPS/spritenote.desktop"

# Refrescar caches (si las herramientas existen)
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DESKTOPS" || true
command -v gtk-update-icon-cache    >/dev/null 2>&1 && gtk-update-icon-cache -f "$PREFIX/share/icons/hicolor" >/dev/null 2>&1 || true

echo ">> Listo."
echo ""
case ":$PATH:" in
  *":$BIN:"*) echo "Ejecuta:  spritenote" ;;
  *) echo "Agrega ~/.local/bin al PATH y luego ejecuta 'spritenote':"
     echo '  echo '"'"'export PATH="$HOME/.local/bin:$PATH"'"'"' >> ~/.bashrc && source ~/.bashrc' ;;
esac
echo "O búscalo como "Spritenote" en tu menú de aplicaciones."
