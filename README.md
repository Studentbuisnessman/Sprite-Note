# Spritenote — companion local de notas, tareas y fechas

Tu compañero local de notas, tareas y fechas, con estética de terminal CRT.
Incluye capa CRT con toggle, secuencia Boot/POST, 7 vistas, 11 temas phosphor de alto contraste, Claw'd como mascota interactiva, monitor CPU/Osciloscope/Grid y command-line estilo vim.
Todo es **local**: tus datos se guardan en tu equipo (`localStorage`), sin
servidor. Corre en cualquier navegador **Chromium** — no necesita Node ni
Electron.

```
spritenote-app/
├── src/                 ← la app (index.html, css, js, assets)
├── build/icon.png       ← ícono del crab 🦀
├── spritenote-launch.sh      ← lanzador Linux (Chromium --app)
├── spritenote-launch.ps1     ← lanzador Windows oficial (PowerShell oculto)
├── spritenote-launch.cmd     ← wrapper Windows de doble clic para pruebas
├── spritenote-launch.js      ← lanzador Windows legacy, no usado por el instalador
├── Build-Installer.cmd  ← compila el instalador .exe con Inno Setup
├── install.sh           ← instala el comando `spritenote` + ícono en Linux
├── installer/           ← script Inno Setup para generar SpritenoteSetup.exe
├── uninstall.sh
├── spritenote.desktop        ← entrada de menú
└── package.json         ← metadata del proyecto
```

---

## Requisitos

Un navegador basado en Chromium. En Linux instálalo según tu distro:

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

**Windows 10/11**

No necesitas Node ni Electron. Usa cualquiera de estos navegadores Chromium:
Chrome, Microsoft Edge, Brave, Chromium o Vivaldi. Microsoft Edge normalmente ya viene instalado.

---

## Probar al instante

**Linux / Arch**
```bash
cd spritenote-app
./spritenote-launch.sh
```

**Windows**

Haz doble clic en:
```text
spritenote-launch.cmd
```

El lanzador oficial de Windows es PowerShell:
```powershell
.\spritenote-launch.ps1
```

En la instalación final, el acceso directo lo ejecuta oculto; el usuario no tiene que escribir comandos.

## Instalar

**Linux** — instala el comando `spritenote` + ícono en el menú:
```bash
cd spritenote-app
./install.sh
spritenote      # ← tu comando
```

Desinstalar en Linux:
```bash
./uninstall.sh
```

**Windows — instalador oficial `.exe`**

Para distribuir Spritenote como app de Windows, compila el instalador de Inno Setup incluido. En Windows, con Inno Setup instalado, puedes hacer doble clic en:
```text
Build-Installer.cmd
```

O abrir manualmente:
```text
installer\Spritenote.iss
```

El resultado será:
```text
installer\Output\SpritenoteSetup-1.0.2.exe
```

Ese instalador crea entrada en el menú Inicio, acceso opcional en el escritorio y desinstalador en Configuración > Aplicaciones. No requiere permisos de administrador porque instala por usuario en:
```text
%LOCALAPPDATA%\Programs\Spritenote
```

Desinstalar en Windows:
```text
Configuración > Aplicaciones > Spritenote > Desinstalar
```

---

## Compatibilidad Windows

Spritenote no necesita reescribirse para Windows porque la app principal ya es una página local (`src/index.html`). Lo que cambia es el lanzador:

- Linux usa `spritenote-launch.sh` y guarda el perfil Chromium en `~/.local/share/spritenote`.
- Windows usa `spritenote-launch.ps1` desde un acceso directo con PowerShell oculto. `spritenote-launch.cmd` queda para pruebas manuales. El perfil Chromium se guarda en `%LOCALAPPDATA%\Spritenote\ChromiumProfile`.
- En ambos casos, el navegador se abre con `--app` y `--user-data-dir`, por lo que las notas, tareas, hábitos, API key local y preferencias quedan aisladas del perfil normal del navegador.
- El neofetch recibe datos reales del sistema desde el lanzador. Si abres `src/index.html` manualmente, la app sigue funcionando, pero con datos limitados del navegador.

## Comandos disponibles (presiona `:` dentro de la app)

| Comando | Descripción |
|---|---|
| `:home` / `1` | Ir al inicio |
| `:notes` / `2` | Ir a notas |
| `:tasks` / `3` | Ir a tareas |
| `:habits` / `4` | Ir a **Mejoras de hábitos** |
| `:dates` / `5` | Ir a fechas importantes |
| `:calendar` / `:cal` / `6` | Ir al **calendario** |
| `:gemini` / `:ai` / `7` | Abrir el chat de Gemini |
| `:compact [on\|off\|auto]` | Forzar/alternar la vista compacta (widget) |
| `:habit <texto>` | Agregar un hábito / meta diaria |
| `:eval` / `:checkin` | **Evaluar tu día** (Claw'd aparece al centro) |
| `:ai key <API_KEY>` | **Guardar tu API key de Gemini** (local, no se expone) |
| `:ai key` | Ver el estado de la key (enmascarada) |
| `:ai key clear` | Borrar la key de este equipo |
| `:ai <pregunta>` | Preguntarle algo a Gemini |
| `:ai model <id>` | Cambiar el modelo (def. `gemini-3.5-flash`) |
| `:ai level <minimal\|low\|medium\|high>` | Nivel de razonamiento (def. `low`) |
| `:ai tools <on\|off>` | Activar/desactivar acciones agénticas (def. on) |
| `:ai clear` | Reiniciar la conversación |
| `:new` | Crear nota nueva |
| `:add <tarea>` | Agregar tarea rápida |
| `:gif <url>` | **Cambiar el gif del banner de inicio** |
| `:gif reset` | Restaurar el gif original |
| `:user <nombre>` | Definir tu nombre de usuario en el neofetch |
| `:theme <nombre>` | Cambiar tema (green/amber/mono/cyan/ember/synth/vapor/outrun/dos/matrix/lime) |
| `:crt [on\|off]` | Activar/desactivar la capa CRT |
| `:pet [clawd\|femme]` | Cambiar entre Claw'd y Femme Soule |
| `:help` | Ver todos los comandos |
| `:reset` | Restaurar datos de ejemplo |



### Mascotas seleccionables

Spritenote ahora permite alternar entre la mascota original **Claw'd** y la mascota anime **Femme Soule**.

```bash
:pet clawd
:pet femme
:mascota anime
```

- **Femme Soule** incluye animaciones completas para idle, celebración, confusión, ejercicio, idea, salto, sueño, sonrojo y teléfono.
- Cuando Femme Soule está activa, sus 3 variantes de idle rotan de forma aleatoria mientras no haces nada.
- En la vista compacta, al hacer una petición a Gemini, Femme Soule se queda visible con el GIF de texteo en celular mientras el chat compacto permanece abierto.

### Rediseño CRT integrado

- **Boot/POST sequence** al abrir la app, saltable con click o cualquier tecla.
- **Capa CRT completa**: scanlines, grille RGB, viñeta, flicker, sweep y brillo curvo.
- **11 temas de alto contraste**: `green`, `amber`, `mono`, `cyan`, `ember`, `synth`, `vapor`, `outrun`, `dos`, `matrix`, `lime`.
- **Monitor visual**: `CPU` con barras, `OSCILOSCOPE` como línea vibrando y `GRID` como cuadrícula vaporwave animada.
- **Claw'd protagonista** con GIFs interactivos y mood sincronizado en sidebar, inicio, compact view y statusbar.
- **Statusbar tipo lualine** + command-line estilo vim (`:`) + atajos `1-7`.

```bash
:theme vapor
:theme matrix
:crt off
:crt on
```

### El neofetch usa datos reales del sistema

Cuando abres la app con `spritenote`, `./spritenote-launch.sh` o `./spritenote-launch.ps1`, el lanzador
recolecta datos reales de tu equipo —usuario, hostname, sistema operativo, CPU, RAM,
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

## Mejoras de hábitos y calificación del día

La vista **Mejoras de hábitos** (`:habits` o tecla `4`) es tu checklist diario
de metas. Vienen unos hábitos de ejemplo (ejercicio, guitarra, sin refrescos de
cola, lectura, hábitos emocionales) que puedes editar, eliminar o ampliar con
`:habit <texto>` o el campo de la vista.

Cada día, según cuántos hábitos cumplas, Spritenote te da una **calificación**:

| Nota | Significado | Cumplimiento |
|---|---|---|
| **P** | Perfecto | 100 % |
| **A** | Casi perfecto | ≥ 75 % |
| **B** | A medias | ≥ 50 % |
| **C** | Flojo | 1–49 % |
| **D** | Desalineado | 0 % |

### Check-in diario (Claw'd al centro)

Una vez al día, al abrir la app, **Claw'd aparece en el centro de la pantalla**
para que marques tus hábitos y te entrega la calificación del día. Claw'd
**reacciona con una animación distinta según tu nota**, y va cambiando en vivo
conforme marcas los hábitos:

| Nota | Reacción de Claw'd |
|---|---|
| **P** | 🎉 celebración |
| **A** | 💪 modo ejercicio (un último empujón) |
| **B** | 😳 tímido |
| **C** | ❓ confundido |
| **D** | 😵 mareado |
| sin hábitos | 💡 idea (agrega tus metas) |

Puedes invocarlo cuando quieras con `:eval` o el botón **«evaluar mi día»**.

> Claw'd (el de la esquina y el del banner) también **reacciona a lo que haces**
> en el resto de la app: celebra 🎉 cuando logras una **P** del día o cuando
> Gemini agrega algo por ti, saca su 💡 al crear una nota o recibir una
> respuesta, se pone en modo 💪 al agregar una tarea, se confunde ❓ ante un
> comando desconocido o un error, se marea 😵 al hacer `:reset`, y se pone
> tímido 😳 si le haces clic.

## Calendario

La vista **Calendario** (`:cal` o tecla `6`) muestra el mes completo con todo a la vez:

- Las **fechas importantes** aparecen como pequeñas etiquetas con su título
  dentro del día correspondiente (hasta 2 por día, y «+N más» si hay varias).
- La **calificación de cada día** (P/A/B/C/D) en la esquina de la casilla.
- Los días del **mes anterior y siguiente** se muestran atenuados para
  completar las semanas.
- Una tira con la **calificación de la semana completa** (Lun → Dom) y una
  **calificación acumulada** (promedio de los días con registro).
- La lista de **próximas fechas** con su cuenta regresiva, debajo del mes.

Así ves de un vistazo lo que tienes pendiente y tu rendimiento al mismo tiempo.
Usa `‹` / `›` para cambiar de mes (se muestra el **mes y año**) y **hoy** para
volver al mes actual. Todo se guarda localmente, igual que el resto de tus datos.

---

## Gemini (asistente integrado)

Spritenote incluye un chat con **Gemini** (modelo `gemini-3.5-flash`). La
integración llama directamente a la API REST de Google desde el navegador
(`fetch`), sin SDK ni servidor: sigue siendo todo local.

### Configurar tu API key

1. Obtén una API key gratis en **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**.
2. Dentro de la app, abre la línea de comandos con `:` y escribe:

```
:ai key TU_API_KEY_AQUI
```

La key se guarda **solo en tu equipo**, en el mismo almacenamiento local
(`localStorage`, dentro de `~/.local/share/spritenote/`) que el resto de la
configuración del proyecto. **Nunca** se incluye en el código, ni en el repo,
ni en la URL, ni en logs. Para verla (enmascarada) usa `:ai key`; para
borrarla, `:ai key clear`.

### Usar el chat

- Abre la vista con `:ai`, `:gemini` o la tecla `7`.
- Escribe directamente en el chat, o lanza una pregunta rápida desde cualquier
  vista con `:ai <tu pregunta>`.
- `:ai level <minimal|low|medium|high>` ajusta el esfuerzo de razonamiento
  (más bajo = más rápido y económico; más alto = mejor para problemas
  complejos). Por defecto es `low`.
- `:ai clear` reinicia la conversación.

### Capacidades agénticas (agregar cosas por chat)

Gemini puede **actuar sobre la app**, no solo responder. Usa *function calling*
(llamada a funciones) de `gemini-3.5-flash`: declara herramientas locales y tu
navegador las ejecuta contra tus datos. Funciona sin servidor ni dependencias.

Herramientas disponibles:

- **agregar_fecha** — pone un evento en el calendario.
- **agregar_tarea** — crea una tarea.
- **agregar_habito** — crea un hábito en «Mejoras de hábitos».
- **consultar_agenda** — lee hoy + próximas fechas, tareas y hábitos.

Ejemplos de lo que puedes pedirle:

```
agrega el examen de redes el próximo viernes en el aula B-204
recuérdame entregar el proyecto en dos semanas
crea una tarea de prioridad alta: pagar inscripción
¿qué tengo próximamente?
```

Gemini resuelve fechas relativas («el viernes», «en dos semanas») a una fecha
real usando la fecha de hoy. Cada acción que ejecuta se muestra como una
**ficha** dentro del chat y como un *toast*, y los cambios aparecen al instante
en el calendario / la vista correspondiente. Si prefieres que solo conteste
texto, desactiva las herramientas con `:ai tools off` (y `:ai tools on` para
reactivarlas).

> Las acciones son aditivas y reversibles: si agrega algo que no querías, puedes
> borrarlo desde la vista de fechas, tareas o hábitos.

> Nota: la API de Gemini se llama por HTTPS. Si abres la app sin conexión a
> internet, el chat no podrá responder (notas, tareas y fechas siguen
> funcionando offline).

---

## Vista compacta (widget)

Cuando la ventana se hace **pequeña** —angosta (menos de 760px de ancho) **o**
baja (menos de 480px de alto)— Spritenote cambia automáticamente a una **vista
compacta** tipo widget: reloj grande, Claw'd, fecha y una mini línea de
comandos. Es ideal como tile en gestores de ventanas (Hyprland, sway, etc.).

La activación la controla el JS midiendo el tamaño real de la ventana, así que
responde al instante al redimensionar (con una media query CSS como respaldo por
si el JS no cargara). Si quieres forzarla manualmente —por ejemplo para usarla
como widget en una ventana grande— usa:

- `:compact on` — fuerza la vista compacta
- `:compact off` — fuerza la vista normal
- `:compact auto` — vuelve al comportamiento automático según el tamaño

### Chat de Gemini en la vista compacta

El cuadro de texto de la vista compacta es un **chat con Gemini**: escribe
cualquier cosa y se envía como *prompt* (los comandos siguen funcionando con `:`
o `/` al inicio). Al enviar, el **reloj se encoge** y aparece una **ventana de
chat**; pulsa `×` o `Esc` para volver al reloj.

Como Gemini tiene herramientas, puedes pedirle que **registre tareas, fechas o
hábitos** desde ahí (p. ej. «agrega tarea comprar cuerdas» o «recuérdame el
examen el viernes») y él los guarda. Necesitas haber configurado tu API key con
`:ai key <tu_api_key>`.

---

## ¿Dónde se guardan mis datos?

En el perfil del navegador que usa la app:
`~/.local/share/spritenote/`

Tus notas, tareas, fechas, **hábitos y calificaciones diarias** viven ahí
(`localStorage`), junto con tu configuración (tema, nombre de usuario, gif del
banner y la **API key de Gemini**). El desinstalador **no** borra esa carpeta
por defecto.

---

## Licencia

MIT.


### Ajuste visual Femme Soule

- Femme Soule ahora usa un tamaño mayor en el sidebar para igualar mejor el peso visual de Claw'd.
- El ajuste es responsivo en pantallas bajas para no tapar navegación o selector de tema.

### Patch 2.8.1 — Compact anime layout

- Evita que el rotador de idles de Femme Soule interrumpa animaciones temporales como `jump`, `idea` o `celebrate`.
- En modo compacto, la mascota queda a la izquierda y el reloj a la derecha para separar mejor los elementos visuales.
- Femme Soule y Claw'd vuelven a tener mayor presencia visual en el compacto; Femme mantiene `phone_transparent.gif` durante el chat de Gemini.


### Nota Windows 1.0.2

El acceso directo oficial en Windows usa `spritenote-launch.ps1` con PowerShell oculto. Ya no se usa `wscript.exe` / Windows Script Host para abrir la app, evitando errores de JScript antiguo y ventanas intermedias de CMD. El usuario final solo abre Spritenote desde el menú Inicio o el escritorio.
