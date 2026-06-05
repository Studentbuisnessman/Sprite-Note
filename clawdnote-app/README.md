# Clawdnote — companion local de notas, tareas y fechas

Tu compañero local de notas, tareas y fechas, con estética de terminal.
Todo es **local**: tus datos se guardan en tu equipo (`localStorage`), sin
servidor. Corre en cualquier navegador **Chromium** — no necesita Node ni
Electron.

```
clawdnote-app/
├── src/                 ← la app (index.html, css, js, assets)
├── build/icon.png       ← ícono del crab 🦀
├── clawd-launch.sh      ← lanzador (abre la app en Chromium en modo --app)
├── install.sh           ← instala el comando `clawdnote` + ícono en el menú
├── uninstall.sh
├── clawd.desktop        ← entrada de menú
└── package.json         ← metadata del proyecto
```

---

## Requisitos

Un navegador basado en Chromium. Instálalo según tu distro:

**Arch / Manjaro / EndeavourOS**
```bash
sudo pacman -S chromium
```

**Debian / Ubuntu / Linux Mint / Pop!_OS**
```bash
sudo apt update && sudo apt install -y chromium
```

**Kali Linux**
```bash
sudo apt update && sudo apt install -y chromium
```

**Fedora**
```bash
sudo dnf install -y chromium
```

**openSUSE Leap / Tumbleweed**
```bash
sudo zypper install -y chromium
```
---

## Probar al instante

```bash
cd clawdnote-app
./clawd-launch.sh
```

## Instalar (comando `clawdnote` + ícono en el menú)

```bash
cd clawdnote-app
./install.sh
clawdnote      # ← tu comando
```

Desinstalar:
```bash
./uninstall.sh
```

---

## Comandos disponibles (presiona `:` dentro de la app)

| Comando | Descripción |
|---|---|
| `:home` / `1` | Ir al inicio |
| `:notes` / `2` | Ir a notas |
| `:tasks` / `3` | Ir a tareas |
| `:dates` / `4` | Ir a fechas importantes |
| `:new` | Crear nota nueva |
| `:add <tarea>` | Agregar tarea rápida |
| `:gif <url>` | **Cambiar el gif del banner de inicio** |
| `:gif reset` | Restaurar el gif original |
| `:user <nombre>` | Definir tu nombre de usuario en el neofetch |
| `:theme <nombre>` | Cambiar tema (ember/catppuccin/dracula/gruvbox/tokyonight) |
| `:help` | Ver todos los comandos |
| `:reset` | Restaurar datos de ejemplo |

### El neofetch usa datos reales del sistema

Cuando abres la app con `clawdnote` (o `./clawd-launch.sh`), el lanzador
recolecta datos reales de tu equipo —usuario, hostname, distro, CPU, RAM,
uptime— y se los pasa a la app. La GPU, resolución, locale y zona horaria se
detectan desde el navegador.

Si en cambio abres `src/index.html` directamente en el navegador (sin el
lanzador), no hay acceso a esos datos del sistema; en ese caso define tu
nombre con `:user <nombre>` (se guarda en `localStorage`).

### Cambiar el gif del banner

El gif de la pantalla de inicio es reemplazable en vivo:

```
:gif https://media.giphy.com/media/xxxxxxxxxxx/giphy.gif
:gif reset    ← vuelve al original
```

La URL se guarda automáticamente en `localStorage` y persiste entre sesiones.

---

## ¿Dónde se guardan mis datos?

En el perfil del navegador que usa la app:
`~/.local/share/clawdnote/`

Tus notas, tareas y fechas viven ahí (`localStorage`). El desinstalador
**no** borra esa carpeta por defecto.

---

## Licencia

MIT.
