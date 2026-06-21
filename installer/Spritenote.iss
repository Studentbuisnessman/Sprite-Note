; Spritenote — Inno Setup Script
; Compilar con: Inno Setup 6.x (https://jrsoftware.org/isinfo.php)
; No requiere privilegios de administrador (instalacion por usuario).

#define AppName      "Spritenote"
#define AppVersion   "1.0.2"
#define AppPublisher "studentbuisnessman"
#define AppURL       "https://github.com/studentbuisnessman/sprite-note"
#define AppExeName   "spritenote-launch.cmd"
#define AppDataDir   "Spritenote"

[Setup]
AppId={{F3A2C1D4-8B7E-4F6A-9C5D-2E1B0A3F4C8D}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}/issues
AppUpdatesURL={#AppURL}/releases

; Instalacion sin privilegios de administrador
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=

; Directorio de instalacion por usuario
DefaultDirName={localappdata}\Programs\{#AppDataDir}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes

; Permite al usuario elegir si quiere acceso directo en escritorio
AllowNoIcons=yes

; Archivos de salida
OutputDir=..\dist
OutputBaseFilename=Spritenote-installer-{#AppVersion}
SetupIconFile=..\build\icon.ico

; Compresion
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes

; Apariencia del instalador
WizardStyle=modern
WizardResizable=no
ShowLanguageDialog=no

; Informacion de version embebida en el .exe del instalador
VersionInfoVersion={#AppVersion}
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} Installer
VersionInfoProductName={#AppName}
VersionInfoProductVersion={#AppVersion}

; Desinstalador
UninstallDisplayName={#AppName}
UninstallDisplayIcon={app}\build\icon.ico
CreateUninstallRegKey=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear acceso directo en el &Escritorio"; GroupDescription: "Iconos adicionales:"; Flags: unchecked

[Files]
; Codigo fuente de la aplicacion
Source: "..\src\*"; DestDir: "{app}\src"; Flags: ignoreversion recursesubdirs createallsubdirs

; Scripts de lanzamiento Windows
Source: "..\spritenote-launch.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\spritenote-launch.cmd"; DestDir: "{app}"; Flags: ignoreversion

; Icono y recursos de construccion
Source: "..\build\icon.ico"; DestDir: "{app}\build"; Flags: ignoreversion
Source: "..\build\icon.png"; DestDir: "{app}\build"; Flags: ignoreversion

[Icons]
; Acceso directo en el menu Inicio
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\build\icon.ico"; Comment: "Abrir {#AppName}"

; Acceso directo en el Escritorio (opcional)
Name: "{userdesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\build\icon.ico"; Comment: "Abrir {#AppName}"; Tasks: desktopicon

[Run]
; Ofrecer abrir la app al terminar la instalacion
Filename: "{app}\{#AppExeName}"; Description: "Iniciar {#AppName} ahora"; Flags: nowait postinstall skipifsilent shellexec

[UninstallDelete]
; Limpiar el perfil de Chromium que crea la app al ejecutarse
Type: filesandordirs; Name: "{localappdata}\{#AppDataDir}\ChromiumProfile"
Type: dirifempty;     Name: "{localappdata}\{#AppDataDir}"
