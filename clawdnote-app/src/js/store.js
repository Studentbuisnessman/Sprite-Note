// store.js — capa de datos local (localStorage). Sin backend.
// Reemplaza el antiguo api.js basado en fetch/FastAPI.

const STORE_KEY = 'clawdnote:data:v1';

const SEED = {
  tasks: [
    { id: 't1', text: 'Leer capítulo 4 de Sistemas Operativos', done: false, pri: 'hi' },
    { id: 't2', text: 'Entregar reporte de laboratorio de Redes', done: false, pri: 'hi' },
    { id: 't3', text: 'Responder correo del coordinador', done: true,  pri: 'lo' },
    { id: 't4', text: 'Hacer backup de dotfiles', done: false, pri: 'lo' },
    { id: 't5', text: 'Repasar apuntes de Cálculo', done: false, pri: 'lo' },
  ],
  dates: [
    { id: 'd1', title: 'Examen parcial — Estructuras de Datos', date: isoInDays(3),  note: 'Aula B-204 · 09:00' },
    { id: 'd2', title: 'Entrega proyecto final — Bases de Datos', date: isoInDays(12), note: 'Subir a la plataforma antes de las 23:59' },
    { id: 'd3', title: 'Inscripción de materias', date: isoInDays(21), note: 'Periodo de altas y bajas' },
    { id: 'd4', title: 'Cumpleaños de mamá', date: isoInDays(34), note: 'Comprar algo bonito' },
  ],
  notes: [
    {
      id: 'n1',
      title: 'Apuntes — Sistemas Operativos',
      tag: 'clase',
      updated: Date.now() - 1000 * 60 * 60 * 2,
      content: `# Planificación de procesos

El **planificador** (scheduler) decide qué proceso usa la CPU.

## Algoritmos vistos
- [x] FCFS — first come, first served
- [x] SJF — shortest job first
- [ ] Round Robin — repasar el *quantum*
- [ ] Colas multinivel

> El objetivo es maximizar el uso de CPU y minimizar el tiempo de espera.

### Fórmula de tiempo de espera promedio
\`\`\`python
def avg_wait(burst_times):
    wait, total = 0, 0
    for i, b in enumerate(burst_times):
        total += wait
        wait += b
    return total / len(burst_times)

print(avg_wait([5, 3, 8, 6]))  # FCFS
\`\`\`

Recordar: \`quantum\` muy pequeño → mucho overhead de contexto.`
    },
    {
      id: 'n2',
      title: 'Redes — modelo OSI',
      tag: 'clase',
      updated: Date.now() - 1000 * 60 * 60 * 26,
      content: `# Modelo OSI — 7 capas

1. Física
2. Enlace de datos
3. Red
4. Transporte
5. Sesión
6. Presentación
7. Aplicación

## Mnemotecnia
> *"Para Estudiar Redes Toda Su Pinche Aplicación"*

| Capa | PDU | Ejemplo |
|------|-----|---------|
| Red | Paquete | IP |
| Transporte | Segmento | TCP/UDP |
| Aplicación | Datos | HTTP, DNS |

Pendiente: comparar con el modelo **TCP/IP** (4 capas).`
    },
    {
      id: 'n3',
      title: 'Dotfiles — config rápida',
      tag: 'rice',
      updated: Date.now() - 1000 * 60 * 60 * 70,
      content: `# Mi setup

\`\`\`bash
# instalar lo básico
sudo pacman -S neovim tmux kitty
# fuente
yay -S ttf-ibm-plex
\`\`\`

- [x] Instalar window manager
- [x] Configurar tmux status bar
- [ ] Terminar tema de neovim
- [ ] Subir dotfiles a git

*Rice en progreso...* 🦀`
    },
  ],
};

function isoInDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const Store = {
  _data: null,

  _load() {
    if (this._data) return this._data;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      this._data = raw ? JSON.parse(raw) : structuredClone(SEED);
    } catch (e) {
      this._data = structuredClone(SEED);
    }
    return this._data;
  },

  _save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this._data)); }
    catch (e) { console.warn('No se pudo guardar', e); }
  },

  _id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },

  reset() {
    this._data = structuredClone(SEED);
    this._save();
  },

  // ── TAREAS ──────────────────────────────────────────────
  tasks: {
    list() { return Store._load().tasks; },
    add(text, pri = 'lo') {
      const t = { id: Store._id(), text, done: false, pri };
      Store._load().tasks.unshift(t);
      Store._save();
      return t;
    },
    toggle(id) {
      const t = Store._load().tasks.find(x => x.id === id);
      if (t) { t.done = !t.done; Store._save(); }
      return t;
    },
    setPri(id, pri) {
      const t = Store._load().tasks.find(x => x.id === id);
      if (t) { t.pri = pri; Store._save(); }
      return t;
    },
    remove(id) {
      const d = Store._load();
      d.tasks = d.tasks.filter(x => x.id !== id);
      Store._save();
    },
  },

  // ── FECHAS IMPORTANTES ─────────────────────────────────
  dates: {
    list() {
      return Store._load().dates
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    add(title, date, note = '') {
      const d = { id: Store._id(), title, date, note };
      Store._load().dates.push(d);
      Store._save();
      return d;
    },
    remove(id) {
      const data = Store._load();
      data.dates = data.dates.filter(x => x.id !== id);
      Store._save();
    },
  },

  // ── NOTAS ──────────────────────────────────────────────
  notes: {
    list() {
      return Store._load().notes
        .slice()
        .sort((a, b) => b.updated - a.updated);
    },
    get(id) { return Store._load().notes.find(n => n.id === id); },
    create(title = 'Nota sin título') {
      const n = { id: Store._id(), title, tag: '', updated: Date.now(), content: '' };
      Store._load().notes.unshift(n);
      Store._save();
      return n;
    },
    update(id, patch) {
      const n = Store._load().notes.find(x => x.id === id);
      if (n) { Object.assign(n, patch, { updated: Date.now() }); Store._save(); }
      return n;
    },
    remove(id) {
      const d = Store._load();
      d.notes = d.notes.filter(x => x.id !== id);
      Store._save();
    },
  },
};

window.Store = Store;
