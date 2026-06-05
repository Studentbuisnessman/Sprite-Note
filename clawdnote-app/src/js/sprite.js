// sprite.js — Claw'd con gifs animados (reemplaza el pixel-art en canvas).
// Estados: idle (laptop) · coffee · heart · sleep. Mantiene la API setState().

const CLAWD_GIFS = {
  idle:   'assets/clawd-laptop.gif',
  coffee: 'assets/clawd-coffee.gif',
  heart:  'assets/clawd-heart.gif',
  sleep:  'assets/clawd-sleep.gif',
};
const CLAWD_MOOD = {
  idle: 'coding', coffee: 'caffeine++', heart: '<3', sleep: 'zZz',
};
// estados transitorios → vuelven a idle tras X ms
const CLAWD_TEMP = { coffee: 4500, heart: 3000 };

class ClawdSprite {
  constructor(imgId, onMood) {
    this.img = document.getElementById(imgId);
    this.onMood = onMood || (() => {});
    this.mirrors = [];
    this.state = 'idle';
    this.idleMs = 0;
    this._tempTimer = null;

    this.setState('idle');

    // auto-comportamiento: ocioso → dormido; de vez en cuando café
    setInterval(() => {
      if (this.state !== 'idle') { this.idleMs = 0; return; }
      this.idleMs += 1000;
      if (this.idleMs > 22000) { this.setState('sleep'); this.idleMs = 0; }
      else if (this.idleMs % 9000 === 0 && Math.random() < 0.4) {
        this.setState('coffee');
      }
    }, 1000);

    // click → interactuar
    this.img.addEventListener('click', () => this.poke());
  }

  poke() {
    if (this.state === 'sleep') this.setState('idle');
    else this.setState(Math.random() < 0.5 ? 'coffee' : 'heart');
  }

  // registra otra <img> que refleje el mismo estado (ej. banner del inicio)
  addMirror(el) {
    if (!el) return;
    this.mirrors.push(el);
    el.src = CLAWD_GIFS[this.state];
    el.addEventListener('click', () => this.poke());
  }

  setState(s) {
    if (!CLAWD_GIFS[s]) return;
    this.state = s;
    this.idleMs = 0;
    this.img.src = CLAWD_GIFS[s];
    this.mirrors.forEach(m => { m.src = CLAWD_GIFS[s]; });
    this.onMood(CLAWD_MOOD[s] || s);

    clearTimeout(this._tempTimer);
    if (CLAWD_TEMP[s]) {
      this._tempTimer = setTimeout(() => {
        if (this.state === s) this.setState('idle');
      }, CLAWD_TEMP[s]);
    }
  }

  // compatibilidad con themes.js (los gifs no se re-tintan)
  refreshPalette() {}
}

window.ClawdSprite = ClawdSprite;
