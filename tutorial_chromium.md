# Tutorial — Instalar Spritenote con Chromium (sin npm, sin Electron)

## Requisitos

Si no tienes Chromium instalado:

```bash
sudo pacman -S chromium
```

---

## Instalación

```bash
cd ~/Downloads/spritenote-app
./install.sh
spritenote
```

Eso es todo. El script:
- Copia la app a `~/.local/share/spritenote-app`
- Crea el comando `spritenote` en `~/.local/bin`
- Registra el ícono y la entrada en el menú de aplicaciones

---

## Si `spritenote` no se reconoce

Significa que `~/.local/bin` no está en tu PATH. Un solo comando lo arregla:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
spritenote
```

---

## Desinstalar

```bash
cd ~/Downloads/spritenote-app
./uninstall.sh
```

Tus datos se guardan en `~/.local/share/spritenote/` y **no se borran** al desinstalar.
Para borrarlos también:

```bash
rm -rf ~/.local/share/spritenote
```


---

# Windows 10/11

Spritenote también puede correr en Windows sin Node ni Electron porque sigue siendo una app web local sobre Chromium.

## Probar portable

1. Descomprime `spritenote-app`.
2. Entra a la carpeta.
3. Haz doble clic en `spritenote-launch.cmd`, o ejecútalo desde PowerShell:

```powershell
.\spritenote-launch.ps1
```

El lanzador buscará Chrome, Edge, Brave, Chromium o Vivaldi y abrirá Spritenote en modo app.

## Instalar en el menú Inicio

Compila el instalador oficial con Inno Setup. Con Inno Setup instalado, haz doble
clic en `Build-Installer.cmd` (o abre `installer\Spritenote.iss` y presiona
**Compile**). El `.exe` resultante:

```text
installer\Output\SpritenoteSetup-1.0.2.exe
```

copia la app a:

```text
%LOCALAPPDATA%\Programs\Spritenote
```

y crea el acceso directo **Spritenote** en el menú Inicio.

## Desinstalar en Windows

```text
Configuración > Aplicaciones > Spritenote > Desinstalar
```

Tus datos quedan en:

```text
%LOCALAPPDATA%\Spritenote\ChromiumProfile
```
