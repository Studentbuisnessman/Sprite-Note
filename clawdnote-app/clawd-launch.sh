#!/usr/bin/env bash
# clawdnote-launch.sh — abre Clawdnote como "app" en un navegador Chromium.
# Usa modo --app con un perfil propio para que localStorage (tus notas/tareas/
# fechas) persista entre sesiones.
#
# Además, recolecta datos reales del sistema (usuario, host, distro, CPU, RAM,
# uptime) y se los pasa a la app por el hash de la URL, para que el "fastfetch"
# muestre información auténtica sin necesidad de Electron ni Node.

set -euo pipefail

# Carpeta donde está este script (para resolver src/index.html)
APPDIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"

# Perfil persistente para guardar localStorage
DATADIR="${XDG_DATA_HOME:-$HOME/.local/share}/clawdnote"
mkdir -p "$DATADIR"

# ── Recolectar datos reales del sistema ───────────────────────────
sys_user="$(id -un 2>/dev/null || whoami 2>/dev/null || echo "${USER:-user}")"
sys_host="$(uname -n 2>/dev/null || echo clawdnote)"
sys_arch="$(uname -m 2>/dev/null || echo '')"

# Distro: PRETTY_NAME de /etc/os-release
sys_os="Linux"
if [ -r /etc/os-release ]; then
  # shellcheck disable=SC1091
  sys_os="$(. /etc/os-release 2>/dev/null && echo "${PRETTY_NAME:-${NAME:-Linux}}")"
fi

# CPU: primer "model name" de /proc/cpuinfo, núcleos vía nproc
sys_cpu=""
if [ -r /proc/cpuinfo ]; then
  sys_cpu="$(grep -m1 'model name' /proc/cpuinfo 2>/dev/null | sed 's/.*: //; s/(TM)//gi; s/(R)//gi; s/  */ /g' || true)"
fi
sys_cores="$(nproc 2>/dev/null || echo '')"
if [ -n "$sys_cpu" ] && [ -n "$sys_cores" ]; then
  sys_cpu="$sys_cpu ($sys_cores)"
elif [ -z "$sys_cpu" ] && [ -n "$sys_cores" ]; then
  sys_cpu="$sys_cores cores"
fi

# RAM total en GB (desde /proc/meminfo, kB → GB redondeado)
sys_ram=""
if [ -r /proc/meminfo ]; then
  kb="$(grep -m1 MemTotal /proc/meminfo 2>/dev/null | grep -o '[0-9]*' || true)"
  if [ -n "$kb" ]; then
    sys_ram="$(( (kb + 524288) / 1048576 )) GB"
  fi
fi

# Uptime del sistema en segundos (entero) + timestamp de captura (ms)
sys_uptime="0"
if [ -r /proc/uptime ]; then
  sys_uptime="$(cut -d' ' -f1 /proc/uptime 2>/dev/null | cut -d. -f1 || echo 0)"
fi
sys_now="$(date +%s%3N 2>/dev/null || echo 0)"

# ── Construir JSON (con escape básico de \ y ") ───────────────────
esc() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

json="{\"user\":\"$(esc "$sys_user")\",\"hostname\":\"$(esc "$sys_host")\",\"os\":\"$(esc "$sys_os")\",\"arch\":\"$(esc "$sys_arch")\",\"cpu\":\"$(esc "$sys_cpu")\",\"ram\":\"$(esc "$sys_ram")\",\"uptimeAtLaunch\":$sys_uptime,\"capturedAt\":$sys_now}"

# URL-encode del JSON para el hash (espacios, paréntesis, etc.)
urlenc() {
  local s="$1" out="" c i
  for (( i=0; i<${#s}; i++ )); do
    c="${s:$i:1}"
    case "$c" in
      [a-zA-Z0-9.~_-]) out+="$c" ;;
      *) out+="$(printf '%%%02X' "'$c")" ;;
    esac
  done
  printf '%s' "$out"
}

PAGE="file://$APPDIR/src/index.html#sysinfo=$(urlenc "$json")"

# ── Detectar el primer navegador Chromium disponible ──────────────
BROWSER=""
for b in chromium chromium-browser google-chrome-stable google-chrome \
         brave brave-browser vivaldi-stable vivaldi microsoft-edge-stable; do
  if command -v "$b" >/dev/null 2>&1; then BROWSER="$b"; break; fi
done

if [ -z "$BROWSER" ]; then
  echo "No encontré ningún navegador Chromium (chromium / chrome / brave / vivaldi)." >&2
  echo "Instala uno, p.ej.:  sudo pacman -S chromium" >&2
  exit 1
fi

exec "$BROWSER" \
  --app="$PAGE" \
  --user-data-dir="$DATADIR" \
  --class=Clawdnote \
  --name=clawdnote \
  "$@"
