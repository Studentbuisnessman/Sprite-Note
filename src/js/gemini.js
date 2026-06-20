// gemini.js — integración con la API de Gemini (generateContent) + herramientas.
//
// • Sin dependencias ni SDK: usa fetch() directo contra el endpoint REST,
//   para mantener la app dependency-free y compatible con file:// + Chromium.
// • La API key se guarda en localStorage (perfil del navegador, en
//   ~/.local/share/spritenote) junto al resto de la configuración persistente
//   del proyecto. Nunca se hardcodea, ni va al repo, ni a la URL, ni a logs.
// • Modelo por defecto: gemini-3.5-flash (DG). Sigue las recomendaciones de
//   Gemini 3.x: no se envían temperature/top_p/top_k; el esfuerzo de
//   razonamiento se controla con thinkingLevel.
// • CAPACIDADES AGÉNTICAS (function calling): Gemini puede pedir ejecutar
//   herramientas locales (agregar fechas, tareas, hábitos o consultar la
//   agenda). La app ejecuta la acción contra Store y devuelve el resultado.
//   Reglas Gemini 3.x respetadas: cada functionResponse incluye el id y name
//   de su functionCall, una respuesta por llamada, y se reenvía el historial
//   completo (con thoughtSignatures).
//   Docs: https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5

const GEMINI_CFG_KEY = 'spritenote:gemini:v1';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_MODEL = 'gemini-3.5-flash';
// 'low' = buena calidad con baja latencia/costo para tareas de escritura y
// análisis ligeros (ideal para un companion de notas). Override con :ai level.
const DEFAULT_LEVEL = 'low';
const VALID_LEVELS = ['minimal', 'low', 'medium', 'high'];
const MAX_TOOL_STEPS = 5; // tope de iteraciones del bucle agéntico

// Catálogo de modelos conocidos (se pueden elegir por id o por alias corto).
// Igual se admite cualquier id personalizado vía :ai model <id>.
const MODELS = [
  { id: 'gemini-3.5-flash',      label: 'Gemini 3.5 Flash',      family: '3', aliases: ['3.5', '3.5-flash', 'flash', 'flash3.5', '3.5flash'] },
  { id: 'gemini-2.5-flash',      label: 'Gemini 2.5 Flash',      family: '2.5', aliases: ['2.5', '2.5-flash', 'flash2.5', '2.5flash'] },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', family: '2.5', aliases: ['2.5-lite', 'flash-lite', 'lite', 'flashlite'] },
  { id: 'gemini-2.5-pro',        label: 'Gemini 2.5 Pro',        family: '2.5', aliases: ['2.5-pro', 'pro', 'pro2.5'] },
];

function resolveModelId(input) {
  input = (input || '').trim();
  if (!input) return null;
  const low = input.toLowerCase();
  const hit = MODELS.find(m => m.id.toLowerCase() === low || (m.aliases || []).includes(low));
  return hit ? hit.id : input; // permite ids personalizados que no estén en la lista
}

// El razonamiento se configura distinto según la familia del modelo:
//  • Gemini 3.x  → thinkingConfig.thinkingLevel ('LOW' | 'MEDIUM' | 'HIGH' ...)
//  • Gemini 2.5  → thinkingConfig.thinkingBudget (entero; 0 = sin pensar, -1 = dinámico)
function buildThinkingConfig(model, level) {
  const m = String(model || '');
  if (/^gemini-2\.5/i.test(m)) {
    const isPro = /pro/i.test(m);
    // mapeo de nivel → presupuesto de tokens (clamp a rangos válidos)
    const budget = {
      minimal: isPro ? 128 : 0, // Pro no permite 0 (mínimo 128); Flash/Lite sí desactivan
      low: 1024,
      medium: 8192,
      high: 24576,
    };
    const b = budget[level] != null ? budget[level] : -1; // desconocido → dinámico
    return { thinkingBudget: b };
  }
  // 3.x (y por defecto): thinkingLevel
  return { thinkingLevel: String(level || DEFAULT_LEVEL).toUpperCase() };
}

// ── Fecha ISO local helpers ──────────────────────────────────────
function gemIsoToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Normaliza una fecha a YYYY-MM-DD (o null si no es válida).
function normalizeIsoDate(s) {
  s = (s || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00');
    if (!isNaN(d.getTime())) return s;
    return null;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

// ── Declaración de herramientas (function declarations) ──────────
// Tipos en MAYÚSCULAS según el enum Type del REST de Gemini.
function toolDeclarations() {
  return [{
    functionDeclarations: [
      {
        name: 'agregar_fecha',
        description: 'Agrega una fecha o evento importante al calendario de Spritenote. Resuelve expresiones relativas ("el viernes", "en dos semanas") a una fecha ISO concreta antes de llamar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            titulo: { type: 'STRING', description: 'Título del evento. Ej.: "Examen de Redes".' },
            fecha:  { type: 'STRING', description: 'Fecha del evento en formato ISO YYYY-MM-DD.' },
            nota:   { type: 'STRING', description: 'Detalle opcional: lugar, hora, etc.' },
          },
          required: ['titulo', 'fecha'],
        },
      },
      {
        name: 'agregar_tarea',
        description: 'Agrega una tarea o pendiente a la lista de tareas.',
        parameters: {
          type: 'OBJECT',
          properties: {
            texto: { type: 'STRING', description: 'Descripción de la tarea.' },
            prioridad: { type: 'STRING', enum: ['alta', 'baja'], description: 'Prioridad. Por defecto baja.' },
          },
          required: ['texto'],
        },
      },
      {
        name: 'agregar_habito',
        description: 'Agrega un hábito o meta diaria a la sección "Mejoras de hábitos".',
        parameters: {
          type: 'OBJECT',
          properties: {
            texto: { type: 'STRING', description: 'Descripción del hábito. Ej.: "Meditar 10 min".' },
          },
          required: ['texto'],
        },
      },
      {
        name: 'consultar_agenda',
        description: 'Devuelve la fecha de hoy, las próximas fechas importantes, las tareas pendientes y los hábitos. Úsalo para responder preguntas sobre la agenda o para evitar duplicados antes de agregar algo.',
        parameters: { type: 'OBJECT', properties: {} },
      },
      {
        name: 'analizar_habitos',
        description: 'Analiza el cumplimiento de los hábitos del usuario en los últimos días (por defecto 14). Devuelve, por hábito, cuántos días se cumplió y su porcentaje, además de cuáles son los más difíciles (los que más batalla). Úsalo cuando el usuario pida consejos, quiera mejorar sus hábitos, pregunte cómo va, o cuando notes que conviene una sugerencia proactiva. Con esos datos da recomendaciones concretas, empáticas y accionables.',
        parameters: {
          type: 'OBJECT',
          properties: {
            dias: { type: 'NUMBER', description: 'Cuántos días hacia atrás analizar (3 a 60). Por defecto 14.' },
          },
        },
      },
    ],
  }];
}

// ── Implementación local de cada herramienta (ejecuta contra Store) ──
const TOOL_IMPLS = {
  agregar_fecha(args) {
    const titulo = (args.titulo || '').trim();
    const iso = normalizeIsoDate(args.fecha);
    if (!titulo) return { ok: false, error: 'Falta el título del evento.' };
    if (!iso) return { ok: false, error: 'Fecha inválida; usa formato YYYY-MM-DD.' };
    const d = window.Store.dates.add(titulo, iso, (args.nota || '').trim());
    return { ok: true, kind: 'fecha', summary: `Fecha agregada: ${titulo} · ${iso}`, data: d };
  },
  agregar_tarea(args) {
    const texto = (args.texto || '').trim();
    if (!texto) return { ok: false, error: 'Falta el texto de la tarea.' };
    const pri = args.prioridad === 'alta' ? 'hi' : 'lo';
    const t = window.Store.tasks.add(texto, pri);
    return { ok: true, kind: 'tarea', summary: `Tarea agregada: ${texto}`, data: t };
  },
  agregar_habito(args) {
    const texto = (args.texto || '').trim();
    if (!texto) return { ok: false, error: 'Falta el texto del hábito.' };
    const h = window.Store.habits.add(texto);
    return { ok: true, kind: 'habito', summary: `Hábito agregado: ${texto}`, data: h };
  },
  consultar_agenda() {
    const today = gemIsoToday();
    const proximas_fechas = window.Store.dates.list()
      .filter(d => d.date >= today).slice(0, 10)
      .map(d => ({ titulo: d.title, fecha: d.date, nota: d.note || '' }));
    const tareas_pendientes = window.Store.tasks.list()
      .filter(t => !t.done).map(t => t.text).slice(0, 20);
    const habitos = window.Store.habits.list().map(h => h.text);
    return { ok: true, kind: 'consulta', summary: 'Agenda consultada', data: { hoy: today, proximas_fechas, tareas_pendientes, habitos } };
  },

  analizar_habitos(args) {
    let days = parseInt(args && args.dias, 10);
    if (!Number.isFinite(days)) days = 14;
    days = Math.min(Math.max(days, 3), 60);

    const habits = window.Store.habits.list();
    if (!habits.length) {
      return { ok: true, kind: 'analisis', summary: 'Sin hábitos para analizar',
        data: { dias: days, habitos: [], nota: 'El usuario aún no tiene hábitos. Sugiere empezar con 1 o 2 hábitos pequeños y concretos.' } };
    }

    const today = new Date();
    const acc = habits.map(h => ({ id: h.id, texto: h.text, cumplidos: 0, total: 0 }));
    const byId = {};
    acc.forEach((p, i) => { byId[p.id] = i; });

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const done = new Set(window.Store.log.get(iso).done);
      acc.forEach(p => { p.total++; if (done.has(p.id)) p.cumplidos++; });
    }

    const habitos = acc
      .map(p => ({ habito: p.texto, cumplidos: p.cumplidos, total: p.total, porcentaje: Math.round((p.cumplidos / p.total) * 100) }))
      .sort((a, b) => a.porcentaje - b.porcentaje);
    const mas_dificiles = habitos.filter(h => h.porcentaje < 60).map(h => h.habito);
    const consistentes  = habitos.filter(h => h.porcentaje >= 80).map(h => h.habito);
    const promedio = Math.round(habitos.reduce((s, h) => s + h.porcentaje, 0) / habitos.length);

    return { ok: true, kind: 'analisis', summary: `Hábitos analizados (${days} días)`,
      data: { dias: days, promedio, mas_dificiles, consistentes, habitos } };
  },
};

// Instrucción de sistema: companion breve, en el idioma del usuario, con fecha
// de hoy y guía de uso de herramientas. `persona` = 'gemini' (estándar) o
// 'character' (rol de la mascota activa: Claw'd o Femme Soule).
function systemInstruction(toolsOn, opts) {
  opts = opts || {};
  const persona = opts.persona === 'character' ? 'character' : 'gemini';
  const petKey = opts.petKey || 'clawd';
  const petProfile = (window.PETS && window.PETS[petKey]) || null;

  const name = (window.SysInfo && window.SysInfo.user) ? window.SysInfo.user : null;
  const now = new Date();
  const DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
  const fecha = `Hoy es ${DOW[now.getDay()]} ${gemIsoToday()} (zona horaria ${tz}). `;

  let s;
  if (persona === 'character' && petProfile && petProfile.persona) {
    s = petProfile.persona + ' Estás integrado en Spritenote, una app local de notas, tareas, fechas y hábitos con estética de terminal. ' +
      (name ? `El usuario se llama ${name}. ` : '') + fecha +
      'Mantente SIEMPRE en personaje. Escribe como en un chat de mensajería: cálido, cercano y no muy largo, en el idioma del usuario (por defecto español). Evita el Markdown pesado (nada de tablas ni encabezados); frases naturales y, si acaso, **negritas** puntuales.';
  } else {
    s = 'Eres el asistente de IA integrado en Spritenote, una app local de notas, tareas, fechas y hábitos con estética de terminal. ' +
      (name ? `El usuario se llama ${name}. ` : '') + fecha +
      'Responde de forma clara y concisa, en el mismo idioma en que te escriben (por defecto, español). Usa Markdown cuando ayude, sin extenderte de más.';
  }

  if (toolsOn) {
    s += ' Tienes herramientas para modificar la app: agregar_fecha, agregar_tarea, ' +
      'agregar_habito, consultar_agenda y analizar_habitos. Úsalas cuando el usuario te pida ' +
      'agregar o consultar algo. Para las fechas, convierte expresiones relativas ' +
      '("el viernes", "el próximo martes", "en 2 semanas") a una fecha ISO ' +
      'YYYY-MM-DD usando la fecha de hoy indicada arriba. ' +
      'Cuando el usuario quiera mejorar sus hábitos, pregunte cómo va, o notes que sería útil, ' +
      'usa analizar_habitos y ofrece de forma PROACTIVA sugerencias concretas, empáticas y accionables ' +
      'sobre los hábitos que más batalla (p. ej. reducir la meta, encadenarlo con un hábito ya consistente, ' +
      'fijar un horario/recordatorio, o dividirlo en pasos pequeños). Nunca juzgues ni regañes. ' +
      'Tras ejecutar una acción, confirma brevemente en lenguaje natural lo que hiciste. Si dudas ' +
      'de los datos, pregunta antes de agregar.';
  }
  return s;
}

const Gemini = {
  _cfg: null,
  // Historiales SEPARADOS por modo: el chat de personaje y el de Gemini
  // estándar son conversaciones independientes (no se mezclan).
  histories: { gemini: [], character: [] },

  // Historial activo según el modo actual (referencia mutable: push/length ok).
  get history() {
    const p = this.getPersona();
    if (!Array.isArray(this.histories[p])) this.histories[p] = [];
    return this.histories[p];
  },

  // ── Configuración persistente ─────────────────────────────────
  _load() {
    if (this._cfg) return this._cfg;
    try {
      const raw = localStorage.getItem(GEMINI_CFG_KEY);
      this._cfg = raw ? JSON.parse(raw) : {};
    } catch (e) {
      this._cfg = {};
    }
    return this._cfg;
  },

  _save() {
    try { localStorage.setItem(GEMINI_CFG_KEY, JSON.stringify(this._load())); }
    catch (e) { console.warn('Gemini: no se pudo guardar la config', e); }
  },

  getConfig() {
    const c = this._load();
    return {
      hasKey: !!c.apiKey,
      model: c.model || DEFAULT_MODEL,
      level: c.level || DEFAULT_LEVEL,
      toolsEnabled: c.toolsEnabled !== false, // por defecto activadas
      persona: c.persona === 'character' ? 'character' : 'gemini',
      userAvatar: c.userAvatar || null,
    };
  },

  getPersona() { return this._load().persona === 'character' ? 'character' : 'gemini'; },
  setPersona(p) {
    p = p === 'character' ? 'character' : 'gemini';
    this._load().persona = p;
    this._save();
    return p;
  },

  getUserAvatar() { return this._load().userAvatar || null; },
  setUserAvatar(dataUrl) {
    if (!dataUrl) return false;
    this._load().userAvatar = dataUrl;
    this._save();
    return true;
  },
  clearUserAvatar() { delete this._load().userAvatar; this._save(); },

  hasKey() { return !!this._load().apiKey; },

  maskedKey() {
    const k = this._load().apiKey;
    if (!k) return null;
    if (k.length <= 10) return '••••';
    return k.slice(0, 4) + '…' + k.slice(-4);
  },

  setKey(key) {
    key = (key || '').trim();
    if (!key) return false;
    this._load().apiKey = key;
    this._save();
    return true;
  },

  clearKey() {
    delete this._load().apiKey;
    this._save();
  },

  setModel(model) {
    model = resolveModelId(model);
    if (!model) return false;
    this._load().model = model;
    this._save();
    return model;
  },

  // Lista de modelos conocidos (para el comando :ai model).
  modelList() { return MODELS.map(m => ({ id: m.id, label: m.label, aliases: (m.aliases || []).slice() })); },
  resolveModel(input) { return resolveModelId(input); },
  modelFamily(id) {
    id = String(id || '');
    if (/^gemini-2\.5/i.test(id)) return '2.5';
    if (/^gemini-3/i.test(id)) return '3';
    const hit = MODELS.find(m => m.id === id);
    return hit ? hit.family : 'other';
  },

  setLevel(level) {
    level = (level || '').trim().toLowerCase();
    if (!VALID_LEVELS.includes(level)) return false;
    this._load().level = level;
    this._save();
    return true;
  },

  setTools(on) {
    this._load().toolsEnabled = !!on;
    this._save();
    return !!on;
  },

  validLevels() { return VALID_LEVELS.slice(); },

  // ── Conversación ──────────────────────────────────────────────
  resetHistory(which) {
    if (which === 'all') { this.histories = { gemini: [], character: [] }; return; }
    this.histories[this.getPersona()] = [];
  },

  // Una llamada HTTP a generateContent. Devuelve el candidate o lanza Error tipado.
  async _call(body, apiKey, model) {
    const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`;
    let resp;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
      });
    } catch (netErr) {
      throw new Error('NETWORK');
    }
    let data = null;
    try { data = await resp.json(); } catch (_) { data = null; }

    if (!resp.ok) {
      const apiMsg = data && data.error && data.error.message;
      if (resp.status === 400 && /API key not valid|API_KEY_INVALID/i.test(apiMsg || '')) throw new Error('BAD_KEY');
      if (resp.status === 401 || resp.status === 403) throw new Error('BAD_KEY');
      if (resp.status === 429) throw new Error('RATE_LIMIT');
      throw new Error(apiMsg ? 'API: ' + apiMsg : `HTTP ${resp.status}`);
    }
    const cand = data && data.candidates && data.candidates[0];
    if (!cand) {
      const blocked = data && data.promptFeedback && data.promptFeedback.blockReason;
      throw new Error(blocked ? 'BLOCKED: ' + blocked : 'EMPTY');
    }
    return cand;
  },

  // Pregunta a Gemini. Maneja el bucle de function calling.
  // Devuelve { text, actions }, donde actions = [{ kind, summary }].
  async ask(prompt) {
    const cfg = this._load();
    if (!cfg.apiKey) throw new Error('NO_KEY');
    const model = cfg.model || DEFAULT_MODEL;
    const level = (cfg.level || DEFAULT_LEVEL).toLowerCase();
    const toolsOn = cfg.toolsEnabled !== false;

    const startLen = this.history.length;
    this.history.push({ role: 'user', parts: [{ text: prompt }] });

    const persona = cfg.persona === 'character' ? 'character' : 'gemini';
    const petKey = (window.clawd && window.clawd.getPetKey) ? window.clawd.getPetKey() : 'clawd';
    const sysOpts = { persona, petKey };

    const actions = [];
    let finalText = '';

    try {
      for (let step = 0; step < MAX_TOOL_STEPS; step++) {
        const body = {
          systemInstruction: { parts: [{ text: systemInstruction(toolsOn, sysOpts) }] },
          contents: this.history,
          generationConfig: { thinkingConfig: buildThinkingConfig(model, level) },
        };
        if (toolsOn) body.tools = toolDeclarations();

        const cand = await this._call(body, cfg.apiKey, model);
        // Guarda el turno del modelo TAL CUAL (con functionCall y thoughtSignature).
        if (cand.content) this.history.push(cand.content);

        const parts = (cand.content && cand.content.parts) || [];
        const calls = parts.filter(p => p.functionCall).map(p => p.functionCall);

        if (!calls.length) {
          finalText = parts
            .filter(p => typeof p.text === 'string' && !p.thought)
            .map(p => p.text).join('').trim();
          break;
        }

        // Ejecuta cada llamada y construye una functionResponse por cada una,
        // con id + name coincidentes (requisito de Gemini 3.x).
        const responseParts = calls.map(fc => {
          const impl = TOOL_IMPLS[fc.name];
          let result;
          try { result = impl ? impl(fc.args || {}) : { ok: false, error: 'función desconocida: ' + fc.name }; }
          catch (e) { result = { ok: false, error: String((e && e.message) || e) }; }
          if (result.ok && result.kind && result.kind !== 'consulta' && result.kind !== 'analisis') {
            actions.push({ kind: result.kind, summary: result.summary });
          }
          return { functionResponse: { name: fc.name, id: fc.id, response: { result } } };
        });
        this.history.push({ role: 'user', parts: responseParts });
        // continúa el bucle: nueva llamada para que el modelo confirme/continúe
      }
    } catch (err) {
      if (!actions.length) {
        // nada se ejecutó → rollback total y propaga el error
        this.history.length = startLen;
        throw err;
      }
      // ya hubo acciones reales: no abortes todo, informa y conserva el historial
      return {
        text: 'Hice los cambios solicitados, pero la respuesta final de Gemini falló (' +
          this.friendlyError(err).replace(/<[^>]+>/g, '') + ').',
        actions,
      };
    }

    if (!finalText) finalText = actions.length ? 'Listo ✓' : '';
    if (!finalText && !actions.length) throw new Error('EMPTY');
    return { text: finalText, actions };
  },

  // Traduce un Error de ask() a un mensaje amable para el usuario.
  friendlyError(err) {
    const m = (err && err.message) || '';
    if (m === 'NO_KEY')     return 'No hay API key. Usa <b>:ai key &lt;tu_api_key&gt;</b> para configurarla.';
    if (m === 'BAD_KEY')    return 'La API key no es válida o no tiene permisos. Revísala con <b>:ai key &lt;nueva_key&gt;</b>.';
    if (m === 'RATE_LIMIT') return 'Límite de solicitudes alcanzado (429). Espera un momento e intenta de nuevo.';
    if (m === 'NETWORK')    return 'No se pudo conectar con la API de Gemini. Revisa tu conexión.';
    if (m === 'EMPTY')      return 'El modelo no devolvió texto. Intenta reformular tu pregunta.';
    if (m.startsWith('BLOCKED')) return 'La solicitud fue bloqueada por las políticas de seguridad de Gemini.';
    if (m.startsWith('EMPTY:'))  return 'Respuesta vacía (' + escHtml(m.slice(6).trim()) + '). Intenta de nuevo.';
    if (m.startsWith('API:'))    return escHtml(m.slice(4).trim());
    return escHtml(m || 'Error desconocido.');
  },
};

window.Gemini = Gemini;
