# spritenote-launch.ps1 — abre Spritenote como "app" en Windows usando Chrome/Edge/Brave/Chromium.
# Mantiene un perfil propio para que localStorage persista entre sesiones.
# También recolecta datos básicos reales del sistema y los pasa a la app por el hash de la URL.

$ErrorActionPreference = 'Stop'

# Carpeta donde está este script, para resolver src\index.html.
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Perfil persistente de Chromium/Chrome/Edge para Spritenote.
# Vive en %APPDATA% (datos de roaming) para que sobreviva reinstalaciones.
$DataDir = Join-Path $env:APPDATA 'Spritenote\ChromiumProfile'
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

# Migrar perfil antiguo de %LOCALAPPDATA% si existe y el nuevo destino esta vacio.
$OldDataDir = Join-Path $env:LOCALAPPDATA 'Spritenote\ChromiumProfile'
if ((Test-Path $OldDataDir) -and -not (Test-Path (Join-Path $DataDir 'Default'))) {
  try { Move-Item -Path $OldDataDir -Destination $DataDir -Force } catch {}
}

function Get-SafeCimInstance {
  param([string]$ClassName)
  try { Get-CimInstance -ClassName $ClassName -ErrorAction Stop } catch { $null }
}

# ── Recolectar datos reales del sistema ───────────────────────────
$osInfo = Get-SafeCimInstance 'Win32_OperatingSystem'
$cpuInfo = Get-SafeCimInstance 'Win32_Processor' | Select-Object -First 1

$sysUser = if ($env:USERNAME) { $env:USERNAME } else { [Environment]::UserName }
$sysHost = if ($env:COMPUTERNAME) { $env:COMPUTERNAME } else { [Environment]::MachineName }
$sysArch = if ([Environment]::Is64BitOperatingSystem) { 'x64' } else { $env:PROCESSOR_ARCHITECTURE }
$sysOs = if ($osInfo -and $osInfo.Caption) { $osInfo.Caption } else { 'Windows' }

$sysCpu = ''
if ($cpuInfo -and $cpuInfo.Name) {
  $sysCpu = ($cpuInfo.Name -replace '\s+', ' ').Trim()
  if ($cpuInfo.NumberOfLogicalProcessors) {
    $sysCpu = "$sysCpu ($($cpuInfo.NumberOfLogicalProcessors))"
  }
} elseif ($env:PROCESSOR_IDENTIFIER) {
  $sysCpu = $env:PROCESSOR_IDENTIFIER
}

$sysRam = ''
if ($osInfo -and $osInfo.TotalVisibleMemorySize) {
  $gb = [Math]::Round(([double]$osInfo.TotalVisibleMemorySize / 1048576), 0)
  $sysRam = "$gb GB"
}

$sysUptime = 0
try {
  if ($osInfo -and $osInfo.LastBootUpTime) {
    $boot = $osInfo.LastBootUpTime
    $sysUptime = [int64]([DateTimeOffset]::Now - $boot).TotalSeconds
  }
} catch { $sysUptime = 0 }

$sysNow = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()

$payload = [ordered]@{
  user = $sysUser
  hostname = $sysHost
  os = $sysOs
  arch = $sysArch
  cpu = $sysCpu
  ram = $sysRam
  uptimeAtLaunch = $sysUptime
  capturedAt = $sysNow
}

$json = $payload | ConvertTo-Json -Compress
$encodedJson = [System.Uri]::EscapeDataString($json)

$IndexPath = (Resolve-Path (Join-Path $AppDir 'src\index.html')).Path
$IndexUri = ([System.Uri]::new($IndexPath)).AbsoluteUri
$Page = "$IndexUri#sysinfo=$encodedJson"

# ── Detectar navegador Chromium disponible ────────────────────────
function Find-ChromiumBrowser {
  $commands = @('chrome.exe', 'msedge.exe', 'brave.exe', 'chromium.exe', 'vivaldi.exe')
  foreach ($cmd in $commands) {
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($found -and $found.Source) { return $found.Source }
  }

  $candidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe",
    "${env:ProgramFiles(x86)}\BraveSoftware\Brave-Browser\Application\brave.exe",
    "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\Application\brave.exe",
    "$env:ProgramFiles\Chromium\Application\chrome.exe",
    "$env:LOCALAPPDATA\Chromium\Application\chrome.exe",
    "$env:LOCALAPPDATA\Vivaldi\Application\vivaldi.exe"
  )

  foreach ($path in $candidates) {
    if ($path -and (Test-Path $path)) { return $path }
  }
  return $null
}

$Browser = Find-ChromiumBrowser
if (-not $Browser) {
  Write-Error 'No encontré Chrome, Microsoft Edge, Brave, Chromium o Vivaldi. Instala un navegador Chromium y vuelve a intentar.'
  exit 1
}

$browserArgs = @(
  ('--app="{0}"' -f $Page),
  ('--user-data-dir="{0}"' -f $DataDir)
)

if ($args.Count -gt 0) {
  $browserArgs += $args
}

Start-Process -FilePath $Browser -ArgumentList $browserArgs
