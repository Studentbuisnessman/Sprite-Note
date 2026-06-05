// app.js — router, vistas, neofetch, frase random, comandos. Pega todo.

const $ = (id) => document.getElementById(id);
const qsa = (s) => [...document.querySelectorAll(s)];

const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_UP = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const SESSION_START = Date.now();

// ── Frases motivacionales / tips / poemas ───────────────────────
const QUOTES = [
  { kind: 'frase', text: 'La disciplina es elegir entre lo que quieres ahora y lo que quieres más.', author: 'Abraham Lincoln' },
  { kind: 'frase', text: 'No cuentes los días, haz que los días cuenten.', author: 'Muhammad Ali' },
  { kind: 'tip', text: 'Divide la tarea grande en pasos de 25 minutos. El método Pomodoro existe por algo.', author: 'tip de estudio' },
  { kind: 'poema', text: 'Caminante, no hay camino,\nse hace camino al andar.', author: 'Antonio Machado' },
  { kind: 'frase', text: 'El que mucho abarca, poco aprieta — enfócate en una cosa a la vez.', author: 'refrán' },
  { kind: 'tip', text: 'Explicar un tema en voz alta como si enseñaras revela lo que aún no entiendes.', author: 'técnica Feynman' },
  { kind: 'frase', text: 'La constancia vence lo que la dicha no alcanza.', author: 'Simón Bolívar' },
  { kind: 'poema', text: 'Aunque la mar esté brava\ny el viento sople al revés,\nrema, que la orilla espera.', author: 'anónimo' },
  { kind: 'tip', text: 'Guarda tus apuntes en markdown: simple hoy, portable siempre.', author: 'tip rice' },
  { kind: 'frase', text: 'Hecho es mejor que perfecto. Entrega y mejora después.', author: 'Sheryl Sandberg' },
  { kind: 'frase', text: 'Un río corta la roca no por su fuerza, sino por su persistencia.', author: 'proverbio' },
  { kind: 'tip', text: 'Revisa tus fechas importantes cada mañana. El futuro-tú lo agradecerá.', author: 'Clawdnote' },
];

const App = {
  currentView: 'home',
  currentNoteId: null,
  noteViewMode: 'split', // split | edit | read
  _saveTimer: null,

  init() {
    Themes.init();

    // sprite
    window.clawd = new ClawdSprite('clawd-canvas', (mood) => {
      const seg = $('sb-clawd-mood');
      if (seg) seg.textContent = '🦀 ' + mood;
      const lbl = $('sb-sprite-mood');
      if (lbl) lbl.textContent = mood;
      const cp = $('cp-mood');
      if (cp) cp.textContent = mood;
    });
    window.clawd.addMirror($('cp-sprite'));
    this._initPhrase();
    this._initCompact();

    Command.init();
    this._registerCommands();
    Mode.set('NORMAL');

    this._applyUserToDOM();
    this._buildNeofetch();
    this._wireNav();
    this._wireThemeDots();
    this._startClock();
    this._renderQuote();

    Themes.set(Themes.current, false);

    this.navigate('home');
  },

  // ── NEOFETCH (sidebar) ────────────────────────────────────────
  _buildNeofetch() {
    const el = $('neofetch');
    if (!el) return;

    // Longitud del separador = user@host
    const sepLen = Math.min((SysInfo.user ?? '?').length + SysInfo.hostname.length + 1, 22);
    const sep = '─'.repeat(sepLen);

    const nfRow = (key, val, cls = 'nf-row') =>
      val != null
        ? `<span class="nf-key">${key}</span><span class="nf-sep"> · </span><span class="${cls}">${val}</span><br>`
        : '';

    const render = () => {
      const tasks = Store.tasks.list();
      const done  = tasks.filter(t => t.done).length;
      const notes = Store.notes.list().length;
      const pct   = tasks.length ? Math.round(done / tasks.length * 100) : 0;
      const barLen = 10;
      const filled = Math.round(pct / 100 * barLen);
      const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

      el.innerHTML =
        `<span class="nf-user">${SysInfo.user ?? '?'}</span><span class="nf-sep">@</span><span class="nf-user">${SysInfo.hostname}</span><br>` +
        `<span class="nf-sep">${sep}</span><br>` +
        (!SysInfo.user
          ? `<span class="nf-key">user</span><span class="nf-sep"> · </span><span class="nf-hint">:user &lt;nombre&gt;</span><br>`
          : '') +
        nfRow('os',    escHtml(SysInfo.os)) +
        (SysInfo.arch    ? nfRow('arch',   escHtml(SysInfo.arch))   : '') +
        nfRow('cpu',   escHtml(SysInfo.cpu)) +
        (SysInfo.ram     ? nfRow('ram',    escHtml(SysInfo.ram))    : '') +
        (SysInfo.gpu     ? nfRow('gpu',    escHtml(SysInfo.gpu))    : '') +
        nfRow('res',   escHtml(SysInfo.resolution)) +
        (SysInfo.colorDepth ? nfRow('color', escHtml(SysInfo.colorDepth)) : '') +
        nfRow('locale', escHtml(SysInfo.locale)) +
        nfRow('tz',    escHtml(SysInfo.tz)) +
        `<span class="nf-sep">──────────────</span><br>` +
        nfRow('thm',   escHtml(Themes.label(Themes.current))) +
        nfRow('up',    escHtml(SysInfo.uptime())) +
        nfRow('notes', notes) +
        `<span class="nf-key">todo</span><span class="nf-sep"> · </span><span class="nf-bar">${bar}</span> <span class="nf-row">${pct}%</span>`;
    };
    render();
    this._neofetchRender = render;
    setInterval(render, 30000);
  },

  _refreshNeofetch() { if (this._neofetchRender) this._neofetchRender(); },

  // ── Aplica usuario real a todos los prompts del DOM ──────────
  _applyUserToDOM() {
    const u = SysInfo.user ?? '?';
    // Prompts de vista (user@clawdnote ~/inicio …)
    document.querySelectorAll('.nf-prompt-user').forEach(el => { el.textContent = u; });
  },

  // ── nav ───────────────────────────────────────────────────────
  _wireNav() {
    qsa('.nav-btn').forEach(b =>
      b.addEventListener('click', () => this.navigate(b.dataset.view)));
  },

  _wireThemeDots() {
    qsa('.theme-dot').forEach(d =>
      d.addEventListener('click', () => Themes.set(d.dataset.t)));
  },

  navigate(view) {
    this.currentView = view;
    qsa('.view').forEach(v => v.classList.remove('active'));
    qsa('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $(`view-${view}`).classList.add('active');

    const labels = { home: 'inicio', notes: 'notas', tasks: 'tareas', dates: 'fechas' };
    $('sb-view').textContent = labels[view] || view;

    if (view === 'home') this.renderHome();
    if (view === 'notes') this.renderNotes();
    if (view === 'tasks') this.renderTasks();
    if (view === 'dates') this.renderDates();
  },

  // ── clock + status bar ────────────────────────────────────────
  _startClock() {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      $('sb-clock').textContent = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${hh}:${mm}`;
    };
    tick();
    setInterval(tick, 1000 * 20);
  },

  // ── quote ─────────────────────────────────────────────────────
  _renderQuote() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const box = $('home-quote');
    if (!box) return;
    box.innerHTML =
      `<div class="q-kind">${q.kind} del día</div>` +
      `<div class="q-text">${escHtml(q.text).replace(/\n/g, '<br>')}</div>` +
      `<div class="q-author">— ${escHtml(q.author)}</div>`;
  },

  // ── Vista compacta (Hyprland / ventana pequeña) ──────────────
  _initCompact() {
    const cpClock = $('cp-clock');
    const cpDate  = $('cp-date');
    const cpUp    = $('cp-uptime');
    const cpMode  = $('cp-mode-label');

    // reloj compacto
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      if (cpClock) cpClock.textContent = `${hh}:${mm}`;
      if (cpDate) {
        const days = ['dom','lun','mar','mié','jue','vie','sáb'];
        const mon  = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
        cpDate.textContent = `${days[d.getDay()]} ${String(d.getDate()).padStart(2,'0')} ${mon[d.getMonth()]}`;
      }
    };
    tick();
    setInterval(tick, 10000);

    // uptime de sesión
    setInterval(() => {
      const ms = Date.now() - SESSION_START;
      const m  = Math.floor(ms / 60000);
      if (cpUp) cpUp.textContent = m < 60 ? `up ${m}m` : `up ${Math.floor(m/60)}h ${m%60}m`;
    }, 30000);

    // modo sincronizado con el global
    const origSet = Mode.set.bind(Mode);
    Mode.set = (m) => {
      origSet(m);
      if (cpMode) cpMode.textContent = m;
    };

    // input de comandos compacto
    const input = $('cp-input');
    const send  = $('cp-send');
    if (!input) return;

    const run = () => {
      const v = input.value.trim();
      if (!v) return;
      input.value = '';
      const isCmd = v.startsWith(':') || v.startsWith('/');
      if (isCmd) {
        const cmd = v.startsWith('/') ? ':' + v.slice(1) : v;
        Command._run(cmd);
      } else {
        // texto plano → agregar tarea
        this.addTask(v);
        Toast.show('info', 'tarea', `"${escHtml(v)}" agregada`);
        clawd.setState('coffee');
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); run(); }
    });
    if (send) send.addEventListener('click', run);

    // usuario real en vista compacta
    const cpUser = $('cp-user');
    if (cpUser) cpUser.textContent = SysInfo.user ?? '?';

    // clic en sprite
    $('cp-sprite')?.addEventListener('click', () => window.clawd.poke());
  },

  greeting() {
    const h = new Date().getHours();
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  },

  // frase personalizable bajo el gif del banner
  _initPhrase() {
    const el = $('clawd-phrase');
    if (!el) return;
    const saved = localStorage.getItem('clawdnote:phrase');
    el.textContent = saved != null ? saved : 'reporta listo.';
    const save = () => localStorage.setItem('clawdnote:phrase', el.textContent.trim());
    el.addEventListener('input', save);
    el.addEventListener('blur', save);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    });

    // Restaurar gif personalizado si fue guardado previamente
    const savedGif = localStorage.getItem('clawdnote:banner-gif');
    if (savedGif) {
      const heroEl = $('clawd-hero-gif');
      if (heroEl) heroEl.src = savedGif;
    }
  },

  // ════════════════════ HOME ════════════════════
  renderHome() {
    this._refreshNeofetch();
    $('home-greet-title').textContent = this.greeting() + ', ' + (SysInfo.user ?? 'estudiante');

    // tareas de hoy
    const tasks = Store.tasks.list();
    const tdone = tasks.filter(t => t.done).length;
    const tl = $('home-tasks');
    tl.innerHTML = tasks.length
      ? tasks.slice(0, 5).map(t => `
        <div class="mini-row ${t.done ? 'done' : ''}" data-id="${t.id}">
          <span class="mr-check ${t.done ? 'done' : ''}">${t.done ? '✓' : ''}</span>
          <span class="mr-text">${escHtml(t.text)}</span>
        </div>`).join('')
      : '<div class="mini-empty">— sin tareas, agrega una en :tasks —</div>';
    $('home-tasks-count').textContent = `${tdone}/${tasks.length}`;
    tl.querySelectorAll('.mini-row').forEach(r =>
      r.addEventListener('click', () => { Store.tasks.toggle(r.dataset.id); clawd.setState('heart'); this.renderHome(); }));

    // próximas fechas
    const dates = Store.dates.list();
    const dl = $('home-dates');
    dl.innerHTML = dates.length
      ? dates.slice(0, 4).map(d => {
          const cd = this._countdown(d.date);
          return `<div class="mini-row">
            <span class="mr-text">${escHtml(d.title)}</span>
            <span class="countdown ${cd.cls}">${cd.label}</span>
          </div>`;
        }).join('')
      : '<div class="mini-empty">— sin fechas importantes —</div>';

    // notas recientes
    const notes = Store.notes.list();
    const nl = $('home-notes');
    nl.innerHTML = notes.length
      ? notes.slice(0, 4).map(n => `
        <div class="mini-row" data-id="${n.id}">
          <span class="mr-text">${escHtml(n.title)}</span>
          <span class="mr-meta">${n.tag ? '#' + escHtml(n.tag) : ''}</span>
        </div>`).join('')
      : '<div class="mini-empty">— sin notas —</div>';
    nl.querySelectorAll('.mini-row').forEach(r =>
      r.addEventListener('click', () => { this.navigate('notes'); this._selectNote(r.dataset.id); }));
  },

  _countdown(iso) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(iso + 'T00:00:00');
    const days = Math.round((target - today) / 86400000);
    if (days < 0) return { label: 'pasó', cls: '' };
    if (days === 0) return { label: 'HOY', cls: 'today' };
    if (days === 1) return { label: 'mañana', cls: 'soon' };
    if (days <= 7) return { label: `en ${days} días`, cls: 'soon' };
    return { label: `en ${days} días`, cls: '' };
  },

  // ════════════════════ TAREAS ════════════════════
  renderTasks() {
    const tasks = Store.tasks.list();
    const done = tasks.filter(t => t.done).length;
    const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    $('tasks-progress-fill').style.width = pct + '%';
    $('tasks-progress-label').textContent = `${done}/${tasks.length}`;

    const list = $('tasks-list');
    list.innerHTML = tasks.length
      ? tasks.map(t => `
        <div class="task-row ${t.done ? 'done' : ''}" data-id="${t.id}">
          <span class="t-check ${t.done ? 'done' : ''}">${t.done ? '✓' : ''}</span>
          <span class="t-text">${escHtml(t.text)}</span>
          <button class="t-pri ${t.pri === 'hi' ? 'hi' : ''}" data-id="${t.id}" title="prioridad">${t.pri === 'hi' ? '!alta' : 'baja'}</button>
          <button class="t-del" data-id="${t.id}" title="eliminar">×</button>
        </div>`).join('')
      : '<div class="empty-state"><span class="es-glyph">◇</span>sin tareas — escribe arriba y Enter</div>';

    list.querySelectorAll('.task-row').forEach(row => {
      row.querySelector('.t-check').addEventListener('click', () => {
        const t = Store.tasks.toggle(row.dataset.id);
        if (t && t.done) clawd.setState('heart');
        this.renderTasks();
      });
      row.querySelector('.t-text').addEventListener('click', () => {
        Store.tasks.toggle(row.dataset.id); this.renderTasks();
      });
    });
    list.querySelectorAll('.t-pri').forEach(btn =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = Store.tasks.list().find(x => x.id === btn.dataset.id);
        Store.tasks.setPri(btn.dataset.id, t.pri === 'hi' ? 'lo' : 'hi');
        this.renderTasks();
      }));
    list.querySelectorAll('.t-del').forEach(btn =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Store.tasks.remove(btn.dataset.id);
        this.renderTasks();
      }));
  },

  addTask(text) {
    if (!text || !text.trim()) return;
    Store.tasks.add(text.trim());
    clawd.setState('coffee');
    this._refreshNeofetch();
    if (this.currentView === 'tasks') this.renderTasks();
    if (this.currentView === 'home') this.renderHome();
  },

  // ════════════════════ FECHAS ════════════════════
  renderDates() {
    const dates = Store.dates.list();
    const list = $('dates-list');
    list.innerHTML = dates.length
      ? dates.map(d => {
          const dt = new Date(d.date + 'T00:00:00');
          const cd = this._countdown(d.date);
          return `<div class="date-row" data-id="${d.id}">
            <div class="d-cal">
              <div class="d-day">${dt.getDate()}</div>
              <div class="d-mon">${MONTHS_UP[dt.getMonth()]}</div>
            </div>
            <div class="d-info">
              <div class="d-title">${escHtml(d.title)}</div>
              <div class="d-note">${escHtml(d.note || '')}</div>
            </div>
            <span class="countdown ${cd.cls}">${cd.label}</span>
            <button class="d-del" data-id="${d.id}" title="eliminar">×</button>
          </div>`;
        }).join('')
      : '<div class="empty-state"><span class="es-glyph">▣</span>sin fechas — agrega una arriba</div>';

    list.querySelectorAll('.d-del').forEach(btn =>
      btn.addEventListener('click', () => { Store.dates.remove(btn.dataset.id); this.renderDates(); }));
  },

  addDate() {
    const title = $('date-title-input').value.trim();
    const date = $('date-date-input').value;
    const note = $('date-note-input').value.trim();
    if (!title || !date) { Toast.show('warn', 'falta', 'pon título y fecha'); return; }
    Store.dates.add(title, date, note);
    $('date-title-input').value = '';
    $('date-date-input').value = '';
    $('date-note-input').value = '';
    clawd.setState('coffee');
    this.renderDates();
  },

  // ════════════════════ NOTAS (mini-Notion) ════════════════════
  renderNotes() {
    const notes = Store.notes.list();
    if (!this.currentNoteId || !Store.notes.get(this.currentNoteId)) {
      this.currentNoteId = notes.length ? notes[0].id : null;
    }
    this._renderNoteList();
    this._renderNoteEditor();
  },

  _renderNoteList() {
    const notes = Store.notes.list();
    const list = $('notes-list-items');
    list.innerHTML = notes.length
      ? notes.map(n => `
        <div class="nl-item ${n.id === this.currentNoteId ? 'active' : ''}" data-id="${n.id}">
          <div class="nl-title"><span class="nl-glyph">▸</span>${escHtml(n.title)}</div>
          <div class="nl-meta">${this._relTime(n.updated)}${n.tag ? ' · <span class="nl-tag">#' + escHtml(n.tag) + '</span>' : ''}</div>
        </div>`).join('')
      : '<div class="mini-empty" style="padding:14px">sin notas</div>';
    list.querySelectorAll('.nl-item').forEach(it =>
      it.addEventListener('click', () => this._selectNote(it.dataset.id)));
  },

  _selectNote(id) {
    this.currentNoteId = id;
    if (this.currentView !== 'notes') this.navigate('notes');
    else { this._renderNoteList(); this._renderNoteEditor(); }
  },

  _renderNoteEditor() {
    const pane = $('note-pane');
    const note = this.currentNoteId ? Store.notes.get(this.currentNoteId) : null;
    if (!note) {
      pane.innerHTML = `<div class="note-empty"><span style="font-size:24px">◉</span>
        <div>sin nota seleccionada</div>
        <button class="btn btn-primary btn-sm" onclick="App.newNote()">+ nueva nota</button></div>`;
      return;
    }
    pane.innerHTML = `
      <div class="note-toolbar">
        <input class="note-title" id="ed-title" value="${escHtml(note.title).replace(/"/g, '&quot;')}" placeholder="Título...">
        <input class="note-tag" id="ed-tag" value="${escHtml(note.tag || '').replace(/"/g, '&quot;')}" placeholder="#tag">
        <div class="seg-toggle" id="ed-seg">
          <button data-m="edit"  class="${this.noteViewMode === 'edit' ? 'active' : ''}">edit</button>
          <button data-m="split" class="${this.noteViewMode === 'split' ? 'active' : ''}">split</button>
          <button data-m="read"  class="${this.noteViewMode === 'read' ? 'active' : ''}">leer</button>
        </div>
        <button class="btn btn-danger btn-sm" id="ed-del">eliminar</button>
      </div>
      <div class="note-body ${this.noteViewMode}" id="ed-body">
        <textarea class="note-editor-ta" id="ed-content" spellcheck="false" placeholder="Escribe en markdown...  # título, - [ ] tarea, \`\`\`código\`\`\`">${escHtml(note.content)}</textarea>
        <div class="note-preview md" id="ed-preview"></div>
      </div>`;

    const ta = $('ed-content');
    const prev = $('ed-preview');
    const updatePreview = () => { prev.innerHTML = renderMarkdown(ta.value); };
    updatePreview();

    ta.addEventListener('input', () => {
      updatePreview();
      this._debouncedSave();
    });
    $('ed-title').addEventListener('input', () => this._debouncedSave());
    $('ed-tag').addEventListener('input', () => this._debouncedSave());

    $('ed-seg').querySelectorAll('button').forEach(b =>
      b.addEventListener('click', () => {
        this.noteViewMode = b.dataset.m;
        $('ed-body').className = 'note-body ' + this.noteViewMode;
        $('ed-seg').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      }));

    $('ed-del').addEventListener('click', () => {
      if (confirm('¿Eliminar esta nota?')) {
        Store.notes.remove(this.currentNoteId);
        this.currentNoteId = null;
        this._refreshNeofetch();
        this.renderNotes();
      }
    });
  },

  _debouncedSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      if (!this.currentNoteId) return;
      Store.notes.update(this.currentNoteId, {
        title: $('ed-title').value.trim() || 'Nota sin título',
        tag: $('ed-tag').value.trim().replace(/^#/, ''),
        content: $('ed-content').value,
      });
      this._renderNoteList();
    }, 400);
  },

  newNote() {
    const n = Store.notes.create();
    this.currentNoteId = n.id;
    this._refreshNeofetch();
    if (this.currentView !== 'notes') this.navigate('notes');
    else { this._renderNoteList(); this._renderNoteEditor(); }
    setTimeout(() => $('ed-title')?.select(), 50);
    clawd.setState('coffee');
  },

  _relTime(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'ahora';
    if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
    if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
    return `hace ${Math.floor(s / 86400)} d`;
  },

  // ════════════════════ COMANDOS ════════════════════
  _registerCommands() {
    const C = Command;
    C.register({ name: 'home', alias: ['h', 'inicio'], desc: 'ir al inicio', run: () => this.navigate('home') });
    C.register({ name: 'notes', alias: ['n', 'notas'], desc: 'ir a notas', run: () => this.navigate('notes') });
    C.register({ name: 'tasks', alias: ['t', 'tareas'], desc: 'ir a tareas', run: () => this.navigate('tasks') });
    C.register({ name: 'dates', alias: ['d', 'fechas'], desc: 'ir a fechas importantes', run: () => this.navigate('dates') });
    C.register({ name: 'new', alias: ['nueva'], desc: 'crear una nota nueva', run: () => this.newNote() });
    C.register({ name: 'add', argHint: '<tarea>', desc: 'agregar tarea rápida', run: (a) => { if (a) { this.addTask(a); Toast.show('info', 'tarea', 'agregada: ' + escHtml(a)); } } });
    C.register({
      name: 'gif', argHint: '<url|reset>', alias: ['banner'],
      desc: 'cambiar el gif del banner de inicio (url o "reset")',
      run: (a) => {
        a = a.trim();
        const heroEl = $('clawd-hero-gif');
        if (!heroEl) { Toast.show('warn', 'gif', 'elemento banner no encontrado'); return; }
        if (!a || a === 'reset') {
          localStorage.removeItem('clawdnote:banner-gif');
          heroEl.src = 'assets/banner.gif';
          Toast.show('info', 'gif', 'banner restaurado al original 🦀');
          return;
        }
        // Validación básica de URL o ruta
        const isUrl = /^https?:\/\//i.test(a) || /^file:\/\//i.test(a) || /\.(gif|png|jpg|jpeg|webp|svg)(\?.*)?$/i.test(a);
        if (!isUrl) {
          Toast.show('warn', 'gif', 'usa una URL válida (.gif/.png/…) o "reset"');
          return;
        }
        // Prueba que carga antes de guardar
        const tmp = new Image();
        tmp.onload = () => {
          heroEl.src = a;
          localStorage.setItem('clawdnote:banner-gif', a);
          Toast.show('info', 'gif', 'banner actualizado ✓ — se recordará en futuras sesiones');
          clawd.setState('heart');
        };
        tmp.onerror = () => {
          Toast.show('warn', 'gif', `no se pudo cargar: ${escHtml(a)}`);
        };
        tmp.src = a;
      },
    });
    C.register({
      name: 'theme', argHint: '<tema>', alias: ['tema'],
      desc: 'cambiar tema: ember/catppuccin/dracula/gruvbox/tokyonight',
      run: (a) => {
        a = a.trim().toLowerCase();
        if (!a) { Themes.next(); Toast.show('info', 'tema', '→ ' + Themes.label(Themes.current)); return; }
        const map = { tokyo: 'tokyonight', 'tokyo-night': 'tokyonight', cat: 'catppuccin', dr: 'dracula', gru: 'gruvbox' };
        const t = THEMES.includes(a) ? a : map[a];
        if (t) { Themes.set(t); Toast.show('info', 'tema', '→ ' + Themes.label(t)); }
        else Toast.show('warn', 'tema', 'no existe: ' + a);
      },
    });
    C.register({
      name: 'ai', argHint: '<prompt>', alias: ['gemini', 'g'],
      desc: 'preguntar a Gemini (próximamente)',
      run: (a) => {
        if (!a) { Toast.show('ai', 'gemini', 'uso: :ai <tu pregunta> — integración en camino 🦀'); return; }
        clawd.setState('coffee');
        Toast.show('ai', 'gemini · stub', `“${escHtml(a)}”<br><span style="color:var(--text-faint)">La conexión con la API de Gemini se habilitará pronto.</span>`, 6000);
      },
    });
    C.register({ name: 'help', alias: ['?'], desc: 'ver todos los comandos', run: () => this._showHelp() });
    if (!SysInfo.isNative || !SysInfo.user) {
      C.register({
        name: 'user', argHint: '<nombre>', alias: ['usuario'],
        desc: 'definir tu nombre de usuario',
        run: (a) => {
          a = a.trim();
          if (!a) {
            Toast.show('info', 'usuario', `usuario actual: <b>${escHtml(SysInfo.user ?? '?')}</b><br><span style="color:var(--text-faint)">:user &lt;nombre&gt; para cambiar</span>`);
            return;
          }
          localStorage.setItem('clawdnote:username', a);
          SysInfo.user = a;
          this._applyUserToDOM();
          const cpUser = $('cp-user');
          if (cpUser) cpUser.textContent = a;
          $('home-greet-title').textContent = this.greeting() + ', ' + a;
          this._refreshNeofetch();
          Toast.show('info', 'usuario', `→ <b>${escHtml(a)}</b> guardado`);
          clawd.setState('heart');
        },
      });
    }
    C.register({
      name: 'reset', desc: 'restaurar datos de ejemplo',
      run: () => { if (confirm('¿Borrar todo y restaurar ejemplos?')) { Store.reset(); this.currentNoteId = null; this._refreshNeofetch(); this.navigate(this.currentView); Toast.show('warn', 'reset', 'datos restaurados'); } },
    });
  },

  _showHelp() {
    const rows = Command.registry.map(c =>
      `<div style="display:flex;gap:12px;margin:3px 0">
        <span style="color:var(--accent);min-width:120px">:${c.name}${c.argHint ? ' ' + c.argHint : ''}</span>
        <span style="color:var(--text-dim)">${c.desc}</span>
      </div>`).join('');
    Toast.show('info', 'comandos', rows +
      `<div style="margin-top:8px;color:var(--text-faint);font-size:11px">teclas 1-4 cambian de vista · : abre comandos · Esc cierra</div>`, 9000);
  },
};

// ── init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  window.App = App;

  // Toast de bienvenida si no hay nombre de usuario definido
  if (!SysInfo.user) {
    setTimeout(() => {
      Toast.show('info', '👋 bienvenido',
        'escribe <b>:user &lt;tu nombre&gt;</b> para personalizar tu neofetch',
        7000);
    }, 800);
  }

  // inputs de tareas / fechas
  $('task-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { App.addTask(e.target.value); e.target.value = ''; }
  });
  $('date-add-btn').addEventListener('click', () => App.addDate());
  $('notes-new-btn').addEventListener('click', () => App.newNote());
  $('cmd-open-btn')?.addEventListener('click', () => Command.open());
});
window.App = App;
