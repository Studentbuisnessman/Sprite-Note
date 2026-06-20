// spritenote-launch.js — Windows Script Host launcher for Spritenote.
// Abre la app local en un navegador Chromium sin mostrar consola de PowerShell.
// Requiere Windows Script Host, incluido por defecto en Windows.

(function () {
  var shell = new ActiveXObject('WScript.Shell');
  var fso = new ActiveXObject('Scripting.FileSystemObject');

  var appDir = fso.GetParentFolderName(WScript.ScriptFullName);
  var localAppData = shell.ExpandEnvironmentStrings('%LOCALAPPDATA%');
  var programFiles = shell.ExpandEnvironmentStrings('%ProgramFiles%');
  var programFilesX86 = shell.ExpandEnvironmentStrings('%ProgramFiles(x86)%');
  var dataDir = fso.BuildPath(localAppData, 'Spritenote\\ChromiumProfile');

  function ensureFolder(path) {
    if (!fso.FolderExists(path)) {
      var parent = fso.GetParentFolderName(path);
      if (parent && !fso.FolderExists(parent)) ensureFolder(parent);
      fso.CreateFolder(path);
    }
  }

  function firstWmi(query) {
    try {
      var svc = GetObject('winmgmts:\\\\.\\root\\cimv2');
      var items = new Enumerator(svc.ExecQuery(query));
      if (!items.atEnd()) return items.item();
    } catch (e) {}
    return null;
  }

  function parseWmiDate(value) {
    try {
      if (!value || value.length < 14) return null;
      return new Date(
        parseInt(value.substr(0, 4), 10),
        parseInt(value.substr(4, 2), 10) - 1,
        parseInt(value.substr(6, 2), 10),
        parseInt(value.substr(8, 2), 10),
        parseInt(value.substr(10, 2), 10),
        parseInt(value.substr(12, 2), 10)
      );
    } catch (e) { return null; }
  }

  function round(value) {
    return Math.round(value);
  }

  function quote(value) {
    return '"' + String(value).replace(/"/g, '\\"') + '"';
  }



  function jsonQuote(value) {
    var s = String(value);
    var out = '"';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      var code = s.charCodeAt(i);
      if (c === '"') out += '\\"';
      else if (c === '\\') out += '\\\\';
      else if (c === '\b') out += '\\b';
      else if (c === '\f') out += '\\f';
      else if (c === '\n') out += '\\n';
      else if (c === '\r') out += '\\r';
      else if (c === '\t') out += '\\t';
      else if (code < 32) {
        var h = code.toString(16);
        while (h.length < 4) h = '0' + h;
        out += '\\u' + h;
      } else {
        out += c;
      }
    }
    return out + '"';
  }

  function jsonStringify(value) {
    if (value === null) return 'null';
    var t = typeof value;
    if (t === 'string') return jsonQuote(value);
    if (t === 'number') return isFinite(value) ? String(value) : 'null';
    if (t === 'boolean') return value ? 'true' : 'false';
    if (value instanceof Array) {
      var a = [];
      for (var i = 0; i < value.length; i++) {
        a.push(jsonStringify(value[i]));
      }
      return '[' + a.join(',') + ']';
    }
    if (t === 'object') {
      var parts = [];
      for (var k in value) {
        if (Object.prototype.hasOwnProperty.call(value, k)) {
          var encoded = jsonStringify(value[k]);
          if (encoded !== undefined) parts.push(jsonQuote(k) + ':' + encoded);
        }
      }
      return '{' + parts.join(',') + '}';
    }
    return undefined;
  }

  function findOnPath(exeName) {
    try {
      var cmd = '%ComSpec% /c where ' + exeName + ' 2>nul';
      var exec = shell.Exec(cmd);
      while (exec.Status === 0) WScript.Sleep(20);
      if (!exec.StdOut.AtEndOfStream) {
        var line = exec.StdOut.ReadLine();
        if (line && fso.FileExists(line)) return line;
      }
    } catch (e) {}
    return null;
  }

  function findBrowser() {
    var commands = ['chrome.exe', 'msedge.exe', 'brave.exe', 'chromium.exe', 'vivaldi.exe'];
    for (var i = 0; i < commands.length; i++) {
      var fromPath = findOnPath(commands[i]);
      if (fromPath) return fromPath;
    }

    var candidates = [
      programFiles + '\\Google\\Chrome\\Application\\chrome.exe',
      programFilesX86 + '\\Google\\Chrome\\Application\\chrome.exe',
      localAppData + '\\Google\\Chrome\\Application\\chrome.exe',
      programFiles + '\\Microsoft\\Edge\\Application\\msedge.exe',
      programFilesX86 + '\\Microsoft\\Edge\\Application\\msedge.exe',
      localAppData + '\\Microsoft\\Edge\\Application\\msedge.exe',
      programFiles + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      programFilesX86 + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      localAppData + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      programFiles + '\\Chromium\\Application\\chrome.exe',
      localAppData + '\\Chromium\\Application\\chrome.exe',
      localAppData + '\\Vivaldi\\Application\\vivaldi.exe'
    ];

    for (var j = 0; j < candidates.length; j++) {
      if (candidates[j] && fso.FileExists(candidates[j])) return candidates[j];
    }
    return null;
  }

  ensureFolder(dataDir);

  var os = firstWmi('SELECT Caption, TotalVisibleMemorySize, LastBootUpTime FROM Win32_OperatingSystem');
  var cpu = firstWmi('SELECT Name, NumberOfLogicalProcessors FROM Win32_Processor');

  var uptime = 0;
  if (os && os.LastBootUpTime) {
    var boot = parseWmiDate(String(os.LastBootUpTime));
    if (boot) uptime = Math.max(0, round((new Date().getTime() - boot.getTime()) / 1000));
  }

  var cpuName = '';
  if (cpu && cpu.Name) {
    cpuName = String(cpu.Name).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    if (cpu.NumberOfLogicalProcessors) cpuName += ' (' + cpu.NumberOfLogicalProcessors + ')';
  }

  var ram = '';
  if (os && os.TotalVisibleMemorySize) {
    ram = round(Number(os.TotalVisibleMemorySize) / 1048576) + ' GB';
  }

  var payload = {
    user: shell.ExpandEnvironmentStrings('%USERNAME%'),
    hostname: shell.ExpandEnvironmentStrings('%COMPUTERNAME%'),
    os: os && os.Caption ? String(os.Caption) : 'Windows',
    arch: shell.ExpandEnvironmentStrings('%PROCESSOR_ARCHITECTURE%'),
    cpu: cpuName,
    ram: ram,
    uptimeAtLaunch: uptime,
    capturedAt: new Date().getTime()
  };

  var indexPath = fso.BuildPath(appDir, 'src\\index.html');
  if (!fso.FileExists(indexPath)) {
    WScript.Echo('No encontré src\\index.html. Reinstala Spritenote o verifica la carpeta de la app.');
    WScript.Quit(1);
  }

  var indexUri = encodeURI('file:///' + indexPath.replace(/\\/g, '/'));
  var page = indexUri + '#sysinfo=' + encodeURIComponent(jsonStringify(payload));

  var browser = findBrowser();
  if (!browser) {
    WScript.Echo('No encontré Chrome, Microsoft Edge, Brave, Chromium o Vivaldi. Instala un navegador Chromium y vuelve a intentar.');
    WScript.Quit(1);
  }

  var args = '--app=' + quote(page) + ' --user-data-dir=' + quote(dataDir);
  shell.Run(quote(browser) + ' ' + args, 0, false);
})();
