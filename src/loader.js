/* ════════════════════════════════════════════════════════════
   PORTFOLIO LOADER — reads the portfolio, checks it, fills gaps,
   and explains problems in plain words instead of a blank screen
   ════════════════════════════════════════════════════════════ */
const MINIATURES = ['house','vault','forge','orbit','ledger','blueprint','palette','telescope','compass','loom','ship','sapling','gears','scales','lantern'];
const SETTINGS_INFO = {
  santorini: {label:'Santorini', line:'a small street above the caldera', ready:true},
  kyoto:     {label:'Kyoto', line:'a lantern-lit lane up to the pagoda', ready:true},
  brooklyn:  {label:'Brooklyn', line:'a brownstone block above the river', ready:false},
  lofoten:   {label:'Lofoten', line:'a harbour lane under the northern lights', ready:false}
};
const TOD_NAMES = {afternoon:0.12, golden:0.42, 'golden hour':0.42, blue:0.64, 'blue hour':0.64, night:0.92};
const NUM_WORDS = ['No','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve'];
const FALLBACK_COLORS = ['#E5865A','#9A7DEB','#45A87C','#EAAE45','#6585EA','#33AACB','#DE5C94','#C9A23A','#5FB3A8','#D9705B','#7C93C9','#B7789E'];
const RESERVED_KEYS = new Set(['esc','left','right','up','down']);
const KEY_LABELS = {home:'Home', end:'End', ins:'Ins', del:'Del', pgup:'PgUp', pgdn:'PgDn', prt:'PrtSc', scr:'ScrLk', pau:'Pause'};
const FALLBACK_ORDER = 'ASDFLQWERTOPZXCV1234502'.split('').concat(['F1','F2','F3','F4','F9','F10','F11','F12','home','end','pgup','pgdn','ins','del']);
const MAX_PROJECTS = 12;

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isStr = v => typeof v === 'string' && v.trim().length > 0;

/* which keys can hold a project: single-width, not swallowed by the street, not used for navigation */
function usableKeys(){
  const ok = new Map(), swallowed = new Set();
  LAYOUT.forEach((row, r) => {
    const c = LANE_C[r];
    row.forEach(([id, label, x, w]) => {
      if (x < c + LANE_HW && x + w > c - LANE_HW){ swallowed.add(id.toLowerCase()); return; }
      if (w === 1 && !RESERVED_KEYS.has(id)) ok.set(id.toLowerCase(), id);
    });
  });
  return {ok, swallowed};
}

/* Checks a portfolio. In preview (the studio), nothing blocks the scene:
   unusable fields fall back to defaults and each problem is reported
   against the project and field it belongs to. */
function validatePortfolio(raw, opts){
  const preview = !!(opts && opts.preview);
  const errors = [], fields = [];
  const flag = (i, field, msg) => { fields.push({index:i, field, message:msg}); if (!preview) errors.push(msg); };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {errors:['The portfolio must be a JSON object.'], fields};
  const owner = raw.owner || {}, scene = raw.scene || {}, intro = raw.intro || {};
  const ownerName = isStr(owner.name) ? owner.name.trim() : (preview ? 'Your name' : '');
  if (!ownerName) errors.push('owner.name is missing. Every portfolio needs the name of the person or studio it belongs to.');
  if ((scene.theme || 'keyboard') !== 'keyboard') errors.push('scene.theme "' + scene.theme + '" is not available yet. Available: keyboard.');
  let street = String(scene.setting || scene.street || 'santorini').toLowerCase();
  if (!SETTINGS_INFO[street] || !SETTINGS_INFO[street].ready){
    const ok = Object.keys(SETTINGS_INFO).filter(k => SETTINGS_INFO[k].ready);
    if (preview) street = 'santorini';
    else errors.push('scene.setting "' + street + '" is not available yet. Available: ' + ok.join(', ') + '.');
  }
  let tod = 0.64;
  if (scene.timeOfDay !== undefined){
    const v = scene.timeOfDay;
    if (typeof v === 'number' && v >= 0 && v <= 1) tod = v;
    else if (typeof v === 'string' && TOD_NAMES[v.toLowerCase()] !== undefined) tod = TOD_NAMES[v.toLowerCase()];
    else if (!preview) errors.push('scene.timeOfDay should be a number from 0 to 1, or one of: afternoon, golden, blue, night.');
  }

  const list = Array.isArray(raw.projects) ? raw.projects : (preview ? [] : null);
  if (!list) errors.push('projects is missing. It should be a list of the things you want on the board.');
  else if (list.length === 0 && !preview) errors.push('projects is empty. Add at least one.');
  else if (list.length > MAX_PROJECTS) errors.push('There are ' + list.length + ' projects. The keyboard holds up to ' + MAX_PROJECTS + '; pick your strongest.');
  if (!list || (list.length === 0 && !preview) || list.length > MAX_PROJECTS) return {errors, fields};

  const {ok, swallowed} = usableKeys(), taken = new Map(), items = [];
  list.forEach((p, i) => {
    const where = 'Project ' + (i + 1) + (isStr(p && p.name) ? ' (' + p.name + ')' : '');
    if (!p || typeof p !== 'object'){ flag(i, 'name', where + ' is not an object.'); return; }
    if (!isStr(p.name)){ flag(i, 'name', where + ' needs a name.'); return; }
    const it = {p, key:null, i, url:null, color:null, arche:null};
    if (p.name.length > 40) flag(i, 'name', where + ': the name is longer than 40 characters.');
    if (isStr(p.url)){
      if (/^https?:\/\/[^\s]+\.[^\s]+/i.test(p.url.trim())) it.url = p.url.trim();
      else flag(i, 'url', where + ': the link should be a full web address starting with https://');
    }
    if (p.color != null && p.color !== ''){
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(p.color)) it.color = p.color;
      else flag(i, 'color', where + ': color "' + p.color + '" should be a hex colour like #4C6FD1.');
    }
    if (p.miniature != null && p.miniature !== ''){
      if (MINIATURES.indexOf(String(p.miniature).toLowerCase()) >= 0) it.arche = String(p.miniature).toLowerCase();
      else flag(i, 'miniature', where + ': miniature "' + p.miniature + '" is not one of: ' + MINIATURES.join(', ') + '.');
    }
    if (p.key != null && p.key !== ''){
      const k = String(p.key).toLowerCase();
      if (swallowed.has(k)) flag(i, 'key', where + ': the ' + p.key + ' key sits where the street runs through the board. Choose another.');
      else if (!ok.has(k)) flag(i, 'key', where + ': the ' + p.key + ' key cannot hold a project. Use a letter, a digit, an F-key, or Home, End, Ins, Del, PgUp, PgDn.');
      else if (taken.has(k)) flag(i, 'key', where + ': the ' + p.key + ' key is already used by ' + taken.get(k) + '.');
      else { it.key = ok.get(k); taken.set(k, p.name); }
    }
    items.push(it);
  });
  if (errors.length) return {errors, fields};

  /* projects without a key get the first free letter of their own name, then sensible fallbacks */
  for (const it of items){
    if (it.key) continue;
    const cands = it.p.name.toUpperCase().replace(/[^A-Z0-9]/g, '').split('').concat(FALLBACK_ORDER);
    for (const c of cands){ const k = c.toLowerCase(); if (ok.has(k) && !taken.has(k)){ it.key = ok.get(k); taken.set(k, it.p.name); break; } }
    if (!it.key){ errors.push('Ran out of keys for ' + it.p.name + '.'); return {errors, fields}; }
  }

  const products = {}, order = [], keyOf = {}, slotOf = {};
  const txt = (v, max) => isStr(v) ? v.trim().slice(0, max) : '';
  items.forEach(({p, key, i, url, color, arche}) => {
    const body = Array.isArray(p.body) ? p.body.filter(isStr).map(s => s.trim().slice(0, 900)) : (isStr(p.body) ? [p.body.trim().slice(0, 900)] : []);
    const facts = (Array.isArray(p.facts) ? p.facts : []).map(f => Array.isArray(f) ? f : (f && typeof f === 'object' ? [f.label, f.value] : null))
      .filter(f => f && isStr(String(f[0] == null ? '' : f[0])) && f[1] != null && String(f[1]).trim()).slice(0, 6).map(f => [String(f[0]).slice(0, 40), String(f[1]).slice(0, 80)]);
    const tags = (Array.isArray(p.tags) ? p.tags : []).filter(isStr).slice(0, 8).map(t => t.trim().slice(0, 30));
    const label = KEY_LABELS[key] || key;
    products[key] = {key:label, name:p.name.trim(), cat:txt(p.category, 60), color:color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      url, arche:arche || 'lantern', lede:txt(p.lede, 160), body, facts, tags};
    slotOf[i] = order.length; order.push(key); keyOf[i] = label;
  });
  const n = order.length, word = NUM_WORDS[n] || String(n);
  const meta = {
    name:ownerName, subtitle:txt(owner.subtitle, 80), title:txt(owner.title, 80) || ownerName + ' | Portfolio',
    description:txt(owner.description, 300) || ownerName + ' — an explorable keyboard portfolio.',
    kicker:txt(intro.kicker, 60) || 'Portfolio',
    line:txt(intro.line, 120) || word + ' glowing ' + (n === 1 ? 'key' : 'keys') + ', and ' + SETTINGS_INFO[street].line + '.',
    indexLine:n ? word + ' ' + (n === 1 ? 'key on this board opens' : 'keys on this board open') + ' something.' : 'Nothing on this board yet.',
    street, tod, introFrom:Math.max(0, tod - 0.18), preview
  };
  return {errors:[], fields, products, order, keyOf, slotOf, meta};
}

function applyMeta(m){
  document.title = m.title;
  const d = document.querySelector('meta[name="description"]'); if (d) d.setAttribute('content', m.description);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('brandName', m.name); set('brandSub', m.subtitle); set('introKick', m.kicker); set('introName', m.name);
  set('introLine', m.line); set('idxKick', m.indexLine);
  const s = document.getElementById('brandSub'); if (s) s.style.display = m.subtitle ? '' : 'none';
}

function showErrors(list){
  const intro = document.getElementById('intro');
  intro.classList.add('broken');
  const box = document.getElementById('introErr');
  box.innerHTML = '<p class="eh">This portfolio could not be built yet.</p><ul>' + list.map(e => '<li>' + esc(e) + '</li>').join('') +
    '</ul><p class="ef">Fix these in the portfolio and reload.</p>';
  if (window.console) console.warn('[portfolio]', list.join('\n'));
}

function hasPortfolio(el){
  if (!el) return false;
  if (el.getAttribute('data-src')) return true;
  const t = el.textContent.trim();
  return t.length > 0 && t !== '{}';
}

function start(){
  const el = document.getElementById('portfolio');
  if (!hasPortfolio(el)){
    if (window.KeystreetStudio) return window.KeystreetStudio.init(window.Keystreet);
    return showErrors(['This file has no portfolio in it yet. Open it with the studio to build one.']);
  }
  const run = raw => {
    const res = validatePortfolio(raw);
    if (res.errors.length) return showErrors(res.errors);
    applyMeta(res.meta);
    try { boot(res.products, res.order, res.meta); }
    catch (e){ showErrors(['The scene failed to start: ' + e.message]); if (window.console) console.error(e); }
  };
  const src = el.getAttribute('data-src');
  if (src){
    fetch(src).then(r => { if (!r.ok) throw new Error('Could not load ' + src + ' (HTTP ' + r.status + ').'); return r.json(); })
      .then(run).catch(e => showErrors([e.message]));
    return;
  }
  let raw;
  try { raw = JSON.parse(el.textContent); }
  catch (e){ return showErrors(['The portfolio is not valid JSON: ' + e.message]); }
  run(raw);
}

function boot(PRODUCTS, ORDER, META){
