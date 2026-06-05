// command.js — línea de comandos estilo vim (:) + indicador de modo.
// Modos: NORMAL · INSERT (editando) · COMMAND (línea : abierta).
// Incluye stub :ai / :gemini reservado para integración futura.

const Mode = {
  current: 'NORMAL',
  set(m) {
    this.current = m;
    const seg = document.getElementById('sb-mode');
    if (!seg) return;
    seg.textContent = m;
    seg.classList.remove('insert', 'command');
    if (m === 'INSERT') seg.classList.add('insert');
    if (m === 'COMMAND') seg.classList.add('command');
  },
};

const Command = {
  registry: [],
  suggestions: [],
  selIdx: 0,

  register(spec) { this.registry.push(spec); },

  init() {
    this.cmdline = document.getElementById('cmdline');
    this.input = document.getElementById('cmd-input');
    this.suggestEl = document.getElementById('cmd-suggest');

    this.input.addEventListener('input', () => this._renderSuggest());
    this.input.addEventListener('keydown', (e) => this._onKey(e));

    // abrir con ":" cuando no se está escribiendo en un campo
    document.addEventListener('keydown', (e) => {
      const a = document.activeElement;
      const typing = /^(INPUT|TEXTAREA)$/.test(a?.tagName) || a?.isContentEditable;
      if (e.key === ':' && !typing && !this.isOpen()) {
        e.preventDefault();
        this.open();
      } else if (e.key === 'Escape') {
        if (this.isOpen()) { e.preventDefault(); this.close(); }
        else if (typing) a.blur();
      } else if (!typing && !this.isOpen() && /^[1-9]$/.test(e.key)) {
        // navegación rápida por número (modo NORMAL)
        const nav = ['home', 'notes', 'tasks', 'dates'];
        if (nav[+e.key - 1]) { e.preventDefault(); window.App.navigate(nav[+e.key - 1]); }
      }
    });

    // INSERT cuando se enfoca un campo de texto editable
    document.addEventListener('focusin', (e) => {
      if (this.isOpen()) return;
      const t = e.target;
      if ((/^(INPUT|TEXTAREA)$/.test(t.tagName) && t.type !== 'date' && t.type !== 'checkbox')
          || t.isContentEditable) {
        Mode.set('INSERT');
      }
    });
    document.addEventListener('focusout', () => {
      if (!this.isOpen()) setTimeout(() => {
        const a = document.activeElement;
        if (!(/^(INPUT|TEXTAREA)$/.test(a?.tagName) || a?.isContentEditable)) Mode.set('NORMAL');
      }, 10);
    });
  },

  isOpen() { return this.cmdline.classList.contains('open'); },

  open(prefill = '') {
    this.cmdline.classList.add('open');
    this.input.value = prefill;
    Mode.set('COMMAND');
    this._renderSuggest();
    this.input.focus();
  },

  close() {
    this.cmdline.classList.remove('open');
    this.suggestEl.classList.remove('open');
    this.input.value = '';
    Mode.set('NORMAL');
  },

  _matches(q) {
    q = q.replace(/^:/, '').trim().toLowerCase();
    const head = q.split(/\s+/)[0];
    if (!head) return this.registry;
    return this.registry.filter(c =>
      c.name.startsWith(head) || (c.alias || []).some(a => a.startsWith(head)));
  },

  _renderSuggest() {
    const raw = this.input.value;
    this.suggestions = this._matches(raw);
    this.selIdx = 0;
    if (!this.suggestions.length) { this.suggestEl.classList.remove('open'); return; }
    this.suggestEl.innerHTML = this.suggestions.map((c, i) =>
      `<div class="cmd-sug-item ${i === 0 ? 'sel' : ''}">
        <span class="cs-cmd">:${c.name}${c.argHint ? ' ' + c.argHint : ''}</span>
        <span class="cs-desc">${c.desc}</span>
      </div>`).join('');
    this.suggestEl.classList.add('open');
  },

  _onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._run(this.input.value);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const c = this.suggestions[this.selIdx];
      if (c) {
        const rest = this.input.value.replace(/^:?\s*\S*/, '').trimStart();
        this.input.value = ':' + c.name + (c.argHint ? ' ' : (rest ? ' ' + rest : ''));
        this._renderSuggest();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selIdx = Math.min(this.selIdx + 1, this.suggestions.length - 1);
      this._updateSel();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selIdx = Math.max(this.selIdx - 1, 0);
      this._updateSel();
    }
  },

  _updateSel() {
    [...this.suggestEl.children].forEach((el, i) =>
      el.classList.toggle('sel', i === this.selIdx));
  },

  _run(raw) {
    const text = raw.replace(/^:/, '').trim();
    if (!text) { this.close(); return; }
    const [head, ...rest] = text.split(/\s+/);
    const args = rest.join(' ');
    const cmd = this.registry.find(c =>
      c.name === head || (c.alias || []).includes(head)) ||
      this.suggestions[this.selIdx];
    this.close();
    if (cmd) cmd.run(args);
    else Toast.show('warn', 'error', `comando desconocido: ${head} — escribe :help`);
  },
};

// ── Toasts ───────────────────────────────────────────────────────
const Toast = {
  show(kind, head, body, ms = 4200) {
    const wrap = document.getElementById('toast-wrap');
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.innerHTML = `<div class="t-head">${head}</div><div class="t-body">${body}</div>`;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .25s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 260);
    }, ms);
  },
};

window.Mode = Mode;
window.Command = Command;
window.Toast = Toast;
