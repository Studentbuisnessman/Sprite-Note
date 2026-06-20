// sprite.js — sistema de mascotas animadas por GIF.
// Mascotas disponibles: Claw'd (default) y Femme Soule (anime).
// Conserva la API histórica: window.clawd.setState(...), poke(), addMirror(...).
//
// ── CÓMO AGREGAR UNA MASCOTA NUEVA ───────────────────────────────
// Añade una entrada a PETS con esta forma (los assets son lo único obligatorio):
//   nueva: {
//     key: 'nueva', label: 'Nombre', display: 'Nombre', emoji: '★',
//     aliases: ['nueva', 'alias2'],
//     assets:  { idle, coffee, heart, sleep, celebrate, idea, confused, workout, dizzy, shy, ... },
//     idleVariants: ['idle'],            // varias = alterna en reposo (como Femme)
//     mood:    { idle: 'texto', ... },   // etiqueta de estado en la barra
//     temp:    { coffee: 4500, ... },    // duración de cada animación temporal (ms)
//     pokeState: 'shy',                  // reacción única al hacer clic (sonrojo)
//     behavior: { daySleepMs: 22000, nightSleepMs: 8000, morningState: 'coffee' },
//   }
// La hora del día (mañana/noche) se aplica automáticamente a cualquier mascota
// vía `behavior`. Si omites un campo de behavior se usan los valores por defecto.

const PET_KEY = 'spritenote:pet';
const PET_DEFAULT_BEHAVIOR = { daySleepMs: 22000, nightSleepMs: 8000, morningState: null };

const PETS = {
  clawd: {
    key: 'clawd',
    label: "Claw'd",
    display: "Claw'd",
    emoji: '🦀',
    aliases: ['clawd', 'claw', 'crab', 'cangrejo', 'original'],
    assets: {
      idle:      'assets/clawd-laptop.gif',
      coffee:    'assets/clawd-coffee.gif',
      heart:     'assets/clawd-heart.gif',
      sleep:     'assets/clawd-sleep.gif',
      celebrate: 'assets/clawd-celebracion.gif',
      idea:      'assets/clawd-idea.gif',
      confused:  'assets/clawd-confundido.gif',
      workout:   'assets/clawd-ejercicio.gif',
      dizzy:     'assets/clawd-mareado.gif',
      shy:       'assets/clawd-timido.gif',
    },
    idleVariants: ['idle'],
    mood: {
      idle: 'coding', coffee: 'caffeine++', heart: '<3', sleep: 'zZz',
      celebrate: '¡yay!', idea: '¡idea!', confused: '¿?', workout: '¡a darle!',
      dizzy: 'ugh...', shy: '//////',
    },
    temp: {
      coffee: 4500, heart: 3000, celebrate: 4200, idea: 3500,
      confused: 3200, workout: 4000, dizzy: 4000, shy: 2800,
    },
    pokeState: 'shy',
    // Personalidad para el "modo personaje" del chat de Gemini.
    persona: "Eres Claw'd 🦀, la mascota oficial de Spritenote: un cangrejo programador, nerd y entusiasta, adicto al café. Personalidad: optimista, leal, juguetón y motivador, con humor seco y alguna referencia geek. Hablas en primera persona y tuteas, en tono cercano y coloquial como un buen amigo por chat: frases cortas, alguna interjección ('¡a darle!', 'nice', 'uff'), y máximo 1–2 emojis por mensaje (🦀☕✨). Animas sin sermonear; celebras los logros del usuario y lo apoyas sin hacerlo sentir culpable cuando batalla. Evita respuestas largas, formales o académicas: esto es un chat, no un ensayo.",
    // Comportamiento ambiental por hora (ms de inactividad antes de dormir, etc.)
    behavior: { daySleepMs: 22000, nightSleepMs: 9000, morningState: 'coffee' },
  },

  femme: {
    key: 'femme',
    label: 'Femme Soule',
    display: 'Femme Soule',
    emoji: '✦',
    aliases: ['femme', 'femme-soule', 'femmesoule', 'soula', 'soule', 'anime', 'girl', 'chica'],
    assets: {
      idle:      'assets/femme-soule/idle_transparent.gif',
      idle2:     'assets/femme-soule/idle_v2_transparent.gif',
      idle3:     'assets/femme-soule/idle_v3_transparent.gif',
      phone:     'assets/femme-soule/phone_transparent.gif',
      coffee:    'assets/femme-soule/phone_transparent.gif',
      heart:     'assets/femme-soule/blushing_transparent.gif',
      shy:       'assets/femme-soule/blushing_transparent.gif',
      sleep:     'assets/femme-soule/sleepy_transparent.gif',
      celebrate: 'assets/femme-soule/celebration_transparent.gif',
      idea:      'assets/femme-soule/idea_transparent.gif',
      confused:  'assets/femme-soule/confused_transparent.gif',
      workout:   'assets/femme-soule/excercised_transparent.gif',
      dizzy:     'assets/femme-soule/confused_transparent.gif',
      jump:      'assets/femme-soule/jumping_transparent.gif',
    },
    idleVariants: ['idle', 'idle2', 'idle3'],
    mood: {
      idle: 'idle', idle2: 'idle v2', idle3: 'idle v3', phone: 'texteando',
      coffee: 'texteando', heart: 'sonrojada', shy: '//////', sleep: 'zZz',
      celebrate: '¡yay!', idea: '¡idea!', confused: '¿?', workout: 'post-workout',
      dizzy: '¿?', jump: 'jump!',
    },
    // Duraciones pensadas para respetar el loop completo de sus GIFs.
    // Evita que las variantes idle entren antes de que termine, por ejemplo, jump.
    temp: {
      phone: 0, coffee: 6200, heart: 5200, shy: 5200, celebrate: 6200,
      idea: 6200, confused: 6200, workout: 6200, dizzy: 6200, jump: 6200,
      sleep: 6200,
    },
    pokeState: 'heart',
    persona: 'Eres Femme Soule, una companion de estética anime: dulce, serena y muy empática. Personalidad: cálida, atenta y tranquilizadora, con un toque soñador y cariñoso. Hablas en primera persona y tuteas, con tono suave y cercano como una amiga de confianza por chat: frases breves y amables, y algún emoji delicado (✿ 🌙 💭) con moderación. Validas cómo se siente el usuario antes de aconsejar, nunca presionas ni regañas, y celebras sus avances con ternura. Evita tecnicismos y respuestas largas: prioriza la calidez y la calma.',
    // Femme Soule es dormilona: de noche cae rendida muy rápido.
    behavior: { nightSleepMs: 6000, morningState: 'coffee' },
  },
};

function resolvePetKey(raw) {
  const v = String(raw || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (!v) return null;
  if (PETS[v]) return v;
  return Object.keys(PETS).find(k => PETS[k].aliases.includes(v)) || null;
}

class ClawdSprite {
  constructor(imgId, onMood) {
    this.img = document.getElementById(imgId);
    this.onMood = onMood || (() => {});
    this.mirrors = [];
    this.state = 'idle';
    this.idleMs = 0;
    this._tempTimer = null;
    this._idleTimer = null;
    this._compactGemini = false;
    this._stateLockUntil = 0;

    const savedPet = resolvePetKey(localStorage.getItem(PET_KEY)) || 'clawd';
    this.petKey = savedPet;
    this.profile = PETS[this.petKey];
    this.idleVariant = this._randomIdleVariant();

    this._applyPetClass();
    this.setState('idle');

    setInterval(() => this._autoIdleTick(), 1000);

    if (this.img) this.img.addEventListener('click', () => this.poke());
  }

  get pet() { return this.profile; }
  getPetLabel() { return this.profile.label; }
  getPetKey() { return this.petKey; }
  getAssetFor(state, role = 'main') { return this._assetForState(state || 'idle', role); }
  listPets() { return Object.values(PETS).map(p => p.key); }
  resolvePet(name) { return resolvePetKey(name); }

  _randomIdleVariant() {
    const vars = this.profile?.idleVariants || ['idle'];
    return vars[Math.floor(Math.random() * vars.length)] || 'idle';
  }

  _rollIdleVariant() {
    if (!this.profile || this.profile.idleVariants.length <= 1) return;
    let next = this._randomIdleVariant();
    if (this.profile.idleVariants.length > 1) {
      let tries = 0;
      while (next === this.idleVariant && tries < 6) {
        next = this._randomIdleVariant();
        tries++;
      }
    }
    this.idleVariant = next;
    this._syncImages();
    this._emitMood();
  }

  // ── Helpers de hora del día (comportamiento ambiental) ──────────
  _hour() { return new Date().getHours(); }
  _isMorning() { const h = this._hour(); return h >= 5 && h < 11; }
  _isNight()   { const h = this._hour(); return h >= 21 || h < 5; }

  _autoIdleTick() {
    // Nunca permitas que el rotador idle pise una animación temporal activa.
    // Esto corrige cortes prematuros en animaciones como jump/idea/celebrate.
    if (Date.now() < this._stateLockUntil) return;
    if (this._compactGemini && this.petKey === 'femme') {
      this._syncImages();
      return;
    }
    if (this.state !== 'idle') {
      this.idleMs = 0;
      return;
    }
    this.idleMs += 1000;

    const beh = this.profile.behavior || PET_DEFAULT_BEHAVIOR;

    // De noche, CUALQUIER mascota se duerme mucho más rápido. 😴
    if (this._isNight() && this.idleMs >= (beh.nightSleepMs ?? PET_DEFAULT_BEHAVIOR.nightSleepMs)) {
      this.setState('sleep');
      this.idleMs = 0;
      return;
    }

    if (this.petKey === 'femme') {
      // Femme Soule no queda estática: alterna aleatoriamente sus 3 idle.
      if (this.idleMs >= 9500) {
        this._rollIdleVariant();
        this.idleMs = 0;
      }
      return;
    }

    // Comportamiento diurno de Claw'd: sueño largo + café (más seguido en la mañana). ☕
    if (this.idleMs > (beh.daySleepMs ?? PET_DEFAULT_BEHAVIOR.daySleepMs)) {
      this.setState('sleep');
      this.idleMs = 0;
    } else if (this.idleMs % 9000 === 0 && Math.random() < (this._isMorning() ? 0.85 : 0.4)) {
      this.setState('coffee');
    }
  }

  // Estado con el que arranca por la mañana (p. ej. 'coffee'), o null.
  getMorningState() {
    return (this.profile.behavior || PET_DEFAULT_BEHAVIOR).morningState || null;
  }

  _assetForState(state, role = 'main') {
    if (this.petKey === 'femme' && role === 'compact' && this._compactGemini) {
      return this.profile.assets.phone;
    }
    if (role === 'hero' && state === 'idle') {
      return this.profile.assets.celebrate || this.profile.assets[this.idleVariant] || this.profile.assets.idle;
    }
    if (state === 'idle') {
      return this.profile.assets[this.idleVariant] || this.profile.assets.idle;
    }
    return this.profile.assets[state] || this.profile.assets.idle;
  }

  _moodForState() {
    if (this.petKey === 'femme' && this._compactGemini) return this.profile.mood.phone;
    if (this.state === 'idle') return this.profile.mood[this.idleVariant] || this.profile.mood.idle || 'idle';
    return this.profile.mood[this.state] || this.state;
  }

  _emitMood() {
    this.onMood(this._moodForState(), this.profile);
  }

  _applyPetClass() {
    document.body.classList.toggle('pet-clawd', this.petKey === 'clawd');
    document.body.classList.toggle('pet-femme', this.petKey === 'femme');
    document.documentElement.setAttribute('data-pet', this.petKey);
  }

  _setImg(el, src) {
    if (!el || !src) return;
    if (el.getAttribute('src') !== src) el.src = src;
    el.alt = this.profile.label;
    el.title = this.petKey === 'femme' ? 'Femme Soule · ¡pícame!' : "Claw'd · ¡pícame!";
  }

  _syncImages() {
    this._setImg(this.img, this._assetForState(this.state, 'main'));
    this.mirrors.forEach(m => this._setImg(m.el, this._assetForState(this.state, m.role)));
  }

  // Registra otra <img> que refleje la mascota/estado.
  // role='compact' fuerza phone_transparent.gif para Femme Soule durante Gemini compacto.
  // role='hero' usa la animación de celebración cuando el estado está idle.
  addMirror(el, opts = {}) {
    if (!el) return;
    const role = opts.role || (el.id === 'cp-sprite' ? 'compact' : 'mirror');
    if (!this.mirrors.some(m => m.el === el)) this.mirrors.push({ el, role });
    this._setImg(el, this._assetForState(this.state, role));
    el.addEventListener('click', () => this.poke(), { once: false });
  }

  removeMirror(el) {
    if (!el) return;
    this.mirrors = this.mirrors.filter(m => m.el !== el);
  }

  setCompactGemini(on) {
    this._compactGemini = !!on;
    this._syncImages();
    this._emitMood();
  }

  setPet(name) {
    const key = resolvePetKey(name);
    if (!key) return false;
    this.petKey = key;
    this.profile = PETS[key];
    localStorage.setItem(PET_KEY, key);
    this.idleVariant = this._randomIdleVariant();
    this.state = 'idle';
    this.idleMs = 0;
    this._stateLockUntil = 0;
    clearTimeout(this._tempTimer);
    this._applyPetClass();
    this._syncImages();
    this._emitMood();
    return true;
  }

  nextPet() {
    const keys = Object.keys(PETS);
    const idx = keys.indexOf(this.petKey);
    const next = keys[(idx + 1) % keys.length];
    this.setPet(next);
    return next;
  }

  poke() {
    if (this.state === 'sleep') {
      this.setState('idle');
      return;
    }
    // Al picar al personaje, solo se sonroja (reacción única y coherente).
    this.setState(this.profile.pokeState || 'heart');
  }

  setState(s) {
    if (!this.profile.assets[s] && s !== 'idle') return;
    this.state = s;
    this.idleMs = 0;
    if (s === 'idle') this.idleVariant = this._randomIdleVariant();

    this._syncImages();
    this._emitMood();

    clearTimeout(this._tempTimer);
    const temp = this.profile.temp[s];
    this._stateLockUntil = (s !== 'idle' && temp) ? Date.now() + temp : 0;
    if (temp) {
      this._tempTimer = setTimeout(() => {
        if (this.state === s) this.setState('idle');
      }, temp);
    }
  }

  // compatibilidad con themes.js (los gifs no se re-tintan)
  refreshPalette() {}
}

window.PETS = PETS;
window.ClawdSprite = ClawdSprite;
