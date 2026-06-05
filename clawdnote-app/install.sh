#!/usr/bin/env bash
# install.sh — instala Clawdnote (comando + ícono de menú).
# Copia la app a ~/.local/share/clawdnote-app, crea el comando `clawdnote`
# en ~/.local/bin y registra el ícono + entrada de menú.

set -euo pipefail

SRC="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"

PREFIX="$HOME/.local"
APPHOME="$PREFIX/share/clawdnote-app"
BIN="$PREFIX/bin"
ICONS="$PREFIX/share/icons/hicolor/512x512/apps"
DESKTOPS="$PREFIX/share/applications"

echo ">> Instalando Clawdnote en $APPHOME"
mkdir -p "$APPHOME" "$BIN" "$ICONS" "$DESKTOPS"

# Copiar app (src + launcher + icono)
cp -r "$SRC/src" "$APPHOME/"
cp "$SRC/clawd-launch.sh" "$APPHOME/"
chmod +x "$APPHOME/clawd-launch.sh"

# Comando `clawd`
ln -sf "$APPHOME/clawd-launch.sh" "$BIN/clawdnote"

# Ícono + entrada de menú
cp "$SRC/build/icon.png" "$ICONS/clawdnote.png"
cp "$SRC/clawd.desktop" "$DESKTOPS/clawdnote.desktop"

# Refrescar caches (si las herramientas existen)
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DESKTOPS" || true
command -v gtk-update-icon-cache    >/dev/null 2>&1 && gtk-update-icon-cache -f "$PREFIX/share/icons/hicolor" >/dev/null 2>&1 || true

echo ">> Listo."
echo ""
case ":$PATH:" in
  *":$BIN:"*) echo "Ejecuta:  clawdnote" ;;
  *) echo "Agrega ~/.local/bin al PATH y luego ejecuta 'clawd':"
     echo '  echo '"'"'export PATH="$HOME/.local/bin:$PATH"'"'"' >> ~/.bashrc && source ~/.bashrc' ;;
esac
echo "O búscalo como "Clawdnote" en tu menú de aplicaciones."
