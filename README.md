# Clawdnote — companion local de notas, tareas y fechas

Tu compañero local de notas, tareas y fechas, con estética basada en terminal.
Todo es **local**: tus datos se guardan en tu equipo (`localStorage`), sin
servidor. Corre en **Chromium** —
Clawdnote es un mini notion para Linux, pero mas sencillo y con varios presets visuales. basado en la mascota "Claw'd" de anthropic.
# Tutorial — Instalar Clawdnote con Chromium (sin npm, sin Electron)

## Requisitos

Un navegador basado en Chromium. Si no tienes ninguno, instálalo según tu distro:

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

> Unico requisito

---

## Instalación

```bash
cd ~/Downloads/clawdnote-app
./install.sh
clawdnote
```

Eso es todo. ahora podras ejecutarlo en tu sistema usando el comando "clawdnote"

---

## Si `clawdnote` no se reconoce

Significa que `~/.local/bin` no está en tu PATH. Un solo comando lo arregla:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
clawdnote
```

---

## Desinstalar

```bash
cd ~/Downloads/clawdnote-app
./uninstall.sh
```

Tus datos se guardan en `~/.local/share/clawdnote/` y **no se borran** al desinstalar.
Para borrarlos también:

```bash
rm -rf ~/.local/share/clawdnote
```
