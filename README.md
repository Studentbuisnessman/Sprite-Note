# clawd-note
Clawdnote es un mini notion para Linux, pero mas sencillo y con varios presets visuales. basado en la mascota "Claw'd" de anthropic.
# Tutorial — Instalar Clawdnote con Chromium (sin npm, sin Electron)

## Requisitos

Si no tienes Chromium instalado:

```bash
sudo pacman -S chromium
```

---

## Instalación

```bash
cd ~/Downloads/clawdnote-app
./install.sh
clawdnote
```

Eso es todo. El script:
- Copia la app a `~/.local/share/clawdnote-app`
- Crea el comando `clawdnote` en `~/.local/bin`
- Registra el ícono y la entrada en el menú de aplicaciones

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
