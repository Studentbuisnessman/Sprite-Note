// themes.js — conmutador de temas (rices) + persistencia.
// El sprite de Claw'd adopta el acento del tema activo.

const THEMES = ['ember', 'catppuccin', 'dracula', 'gruvbox', 'tokyonight'];
const THEME_LABEL = {
  ember: 'ember', catppuccin: 'catppuccin', dracula: 'dracula',
  gruvbox: 'gruvbox', tokyonight: 'tokyo-night',
};
const THEME_KEY = 'clawdnote:theme';

const Themes = {
  current: 'ember',

  init() {
    const saved = localStorage.getItem(THEME_KEY);
    this.set(THEMES.includes(saved) ? saved : 'ember', false);
  },

  set(name, animate = true) {
    if (!THEMES.includes(name)) return;
    this.current = name;
    document.documentElement.setAttribute('data-theme', name);
    localStorage.setItem(THEME_KEY, name);

    // marca el dot activo
    document.querySelectorAll('.theme-dot').forEach(d =>
      d.classList.toggle('active', d.dataset.t === name));

    // status bar label
    const seg = document.getElementById('sb-theme');
    if (seg) seg.textContent = THEME_LABEL[name];

    // re-tinta el sprite (espera a que las CSS vars apliquen)
    requestAnimationFrame(() => {
      if (window.clawd && window.clawd.refreshPalette) window.clawd.refreshPalette();
    });

    if (animate && window.clawd) window.clawd.setState('heart');
  },

  next() {
    const idx = THEMES.indexOf(this.current);
    this.set(THEMES[(idx + 1) % THEMES.length]);
  },

  label(name) { return THEME_LABEL[name] || name; },
};

window.Themes = Themes;
window.THEMES = THEMES;
