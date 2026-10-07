/* ════════════════════════════════════════════════════════════
   INTERFACE
   ════════════════════════════════════════════════════════════ */
const panel = $('panel'), tagEl = $('tag'), hintEl = $('hint');
let hintGone = false;
if (COARSE) hintEl.textContent = 'Drag to look around, pinch to zoom, tap a glowing key.';
function hideHint(){ if (!hintGone){ hintGone = true; hintEl.classList.add('gone'); } }

panel.querySelectorAll('.fx').forEach((el, i) => el.style.setProperty('--d', (0.14 + i*0.06) + 's'));
function fillPanel(k){
  const P = k.prod;
  panel.style.setProperty('--accent', P.color);
  $('pKey').textContent = P.key; $('pCat').textContent = P.cat; $('pName').textContent = P.name; $('pLede').textContent = P.lede;
  $('pBody').innerHTML = P.body.map(t => '<p>' + esc(t) + '</p>').join('');
  $('pFacts').innerHTML = P.facts.map(([a, b]) => '<div><dt>' + esc(a) + '</dt><dd>' + esc(b) + '</dd></div>').join('');
  $('pFacts').style.display = P.facts.length ? '' : 'none';
  $('pTags').innerHTML = P.tags.map(t => '<span>' + esc(t) + '</span>').join('');
  $('pLede').style.display = P.lede ? '' : 'none';
  const v = $('pVisit');
  if (P.url){ v.href = P.url; $('pVisitTx').textContent = 'Visit ' + P.url.replace(/^https?:\/\//, '').replace(/\/$/, ''); v.style.display = ''; }
  else v.style.display = 'none';
  PEEK.prepare(P);
  $('pScroll').scrollTop = 0;
}
/* a look at where the link goes: the project's own preview, or a screenshot of the site taken on the fly */
const PEEK = (function(){
  const card = $('peek'), shot = $('peekShot'), wait = $('peekWait'), host = $('peekUrl'), inl = $('pPeek'), vis = $('pVisit');
  const cache = new Map();
  let cur = null, hideT = 0;
  const isVideo = s => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(s);
  const domain = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const inline = () => COARSE || innerWidth <= 820;
  function sourceFor(P){
    if (P.preview === false || (!P.url && !P.preview)) return null;
    if (P.preview) return {key:P.preview, video:isVideo(P.preview), shot:false};
    return {key:'https://s.wordpress.com/mshots/v1/' + encodeURIComponent(P.url) + '?w=1280&h=800', video:false, shot:true};
  }
  function load(P){
    const s = sourceFor(P); if (!s) return null;
    let e = cache.get(s.key); if (e) return e;
    e = {s, state:'loading', src:s.key, tries:0}; cache.set(s.key, e);
    if (s.video){ e.state = 'ready'; return e; }
    const attempt = () => {
      const im = new Image(); im.referrerPolicy = 'no-referrer'; im.decoding = 'async';
      const url = s.key + (e.tries ? (s.key.indexOf('?') >= 0 ? '&' : '?') + 'retry=' + e.tries : '');
      im.onload = () => {
        /* the screenshot service answers with a small placeholder while it is still taking the picture */
        if (s.shot && im.naturalWidth < 600 && e.tries < 6){ e.tries++; setTimeout(attempt, 2200 + e.tries*900); return; }
        e.state = 'ready'; e.src = url; refresh(e);
      };
      im.onerror = () => { e.state = 'fail'; refresh(e); };
      im.src = url;
    };
    attempt();
    return e;
  }
  function media(e){
    if (e.s.video){ const v = document.createElement('video'); v.src = e.src; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.setAttribute('muted', ''); return v; }
    const im = document.createElement('img'); im.src = e.src; im.alt = ''; im.referrerPolicy = 'no-referrer'; return im;
  }
  function fill(el, e){
    el.querySelectorAll('img,video').forEach(n => n.remove());
    if (e.state !== 'ready') return false;
    const m = media(e); el.appendChild(m); if (m.play) m.play().catch(() => {});
    return true;
  }
  function refresh(e){
    if (!cur || cur.e !== e) return;
    if (e.state === 'fail'){ hide(true); inl.classList.remove('ready'); inl.innerHTML = ''; return; }
    if (inline()){ inl.innerHTML = ''; if (fill(inl, e)) inl.classList.add('ready'); }
    else if (card.classList.contains('on') && e.state === 'ready' && !shot.classList.contains('ready')){ fill(shot, e); shot.classList.add('ready'); }
  }
  function prepare(P){
    hide(true);
    inl.classList.remove('ready'); inl.innerHTML = '';
    const e = load(P);
    cur = e ? {e, P} : null;
    if (!e) return;
    inl.href = P.url || P.preview;
    if (inline() && e.state === 'ready' && fill(inl, e)) inl.classList.add('ready');
  }
  function place(){
    const pr = panel.getBoundingClientRect(), vr = vis.getBoundingClientRect();
    const w = Math.min(500, innerWidth*0.34), h = 31 + w*0.625;
    card.style.left = Math.max(16, pr.left - w - 22) + 'px';
    card.style.top = clamp(vr.top + vr.height/2 - h/2, 16, innerHeight - h - 16) + 'px';
  }
  function show(){
    if (!cur || inline() || !focused || cur.e.state === 'fail') return;
    clearTimeout(hideT);
    if (card.classList.contains('on')) return;
    const {e, P} = cur;
    host.textContent = domain(P.url || P.preview);
    card.href = P.url || P.preview;
    card.style.setProperty('--accent', P.color);
    wait.textContent = 'Taking a look at ' + domain(P.url || P.preview) + '…';
    shot.classList.remove('ready'); shot.querySelectorAll('img,video').forEach(n => n.remove());
    if (fill(shot, e)) shot.classList.add('ready');
    place(); card.classList.add('on'); card.setAttribute('aria-hidden', 'false');
  }
  function hide(now){
    clearTimeout(hideT);
    const go = () => { card.classList.remove('on'); card.setAttribute('aria-hidden', 'true'); shot.querySelectorAll('video').forEach(v => v.pause()); };
    if (now) go(); else hideT = setTimeout(go, 220);
  }
  on(vis, 'pointerenter', show); on(vis, 'focus', show);
  on(vis, 'pointerleave', () => hide()); on(vis, 'blur', () => hide());
  on(card, 'pointerenter', () => clearTimeout(hideT)); on(card, 'pointerleave', () => hide());
  on(window, 'resize', () => { if (card.classList.contains('on')) place(); });
  return {prepare, hide};
})();
function keyTopWorld(k){ return deck.localToWorld(new V3(k.x, KEY_BASE + CAP.H*k.sy*0.6, k.z)); }
function focusPose(k){
  const w = keyTopWorld(k), yaw = clamp(cam.g.yaw, -0.6, 0.6), pitch = 0.8, dist = innerWidth > 820 ? 4.3 : 5.4, t = w.clone();
  if (innerWidth > 820){ const pw = (panel.offsetWidth || Math.min(440, innerWidth*0.37)) + 22; shiftAcross(t, yaw, dist, (pw - INSET.l)/2); }
  else { const s = dist*0.2; t.x += -Math.sin(yaw)*Math.sin(pitch)*s; t.y -= Math.cos(pitch)*s; t.z += -Math.cos(yaw)*Math.sin(pitch)*s; }
  return {yaw, pitch, dist, target:t};
}
function open(id){
  const k = KEY_BY_ID[id];
  if (!k || !k.prod || focused === k) return;
  if (!focused) preFocus = {yaw:cam.g.yaw, pitch:cam.g.pitch, dist:cam.g.dist, target:cam.g.target.clone()};
  else { focused.hold = false; activate(focused); }
  focused = k; k.hold = true; activate(k);
  visited.add(id); updateProgress();
  hideTag(); hideHint(); closeIndex(true);
  fillPanel(k);
  panel.classList.remove('show'); void panel.offsetWidth;
  panel.classList.add('open', 'show'); panel.setAttribute('aria-hidden', 'false');
  flyTo(focusPose(k), 1.35);
  SFX.whoosh(1.2, panOf(k)); SFX.chime(ORDER.indexOf(id));
}
function close(){
  if (!focused) return;
  focused.hold = false; activate(focused); focused = null;
  panel.classList.remove('open', 'show'); panel.setAttribute('aria-hidden', 'true');
  PEEK.hide(true);
  flyTo(preFocus || homePose(), 1.4); preFocus = null;
  SFX.closeSound();
  try { cv.focus({preventScroll:true}); } catch (_){}
}
function step(d){ if (!focused || !ORDER.length) return; const i = ORDER.indexOf(focused.id); open(ORDER[(i + d + ORDER.length) % ORDER.length]); }
on($('pPrev'), 'click', () => step(-1));
on($('pNext'), 'click', () => step(1));
on($('pClose'), 'click', close);

/* index */
const indexEl = $('index'), idxList = $('idxList');
function buildIndex(){
idxList.innerHTML = '';
ORDER.forEach(id => {
  const P = PRODUCTS[id], li = document.createElement('li');
  li.dataset.id = id;
  li.innerHTML = '<button><span class="k" style="background:' + esc(P.color) + '">' + esc(P.key) + '</span><span class="n">' + esc(P.name) +
                 '</span><span class="c">' + esc(P.cat) + '</span></button>';
  li.querySelector('button').addEventListener('click', () => { closeIndex(true); open(id); });
  idxList.appendChild(li);
});
}
buildIndex();
function openIndex(){ indexOpen = true; indexEl.classList.add('open'); indexEl.setAttribute('aria-hidden', 'false'); SFX.tick(0); hideTag(); const b = idxList.querySelector('button'); if (b) b.focus(); }
function closeIndex(silent){
  if (!indexOpen) return;
  indexOpen = false; indexEl.classList.remove('open'); indexEl.setAttribute('aria-hidden', 'true');
  if (!silent) try { cv.focus({preventScroll:true}); } catch (_){}
}
on($('idxBtn'), 'click', () => indexOpen ? closeIndex() : openIndex());
on($('idxClose'), 'click', () => closeIndex());
on(indexEl, 'click', e => { if (e.target === indexEl) closeIndex(); });

/* progress */
const dotsEl = $('dots');
dotsEl.innerHTML = '';
ORDER.forEach(id => { const i = document.createElement('i'); i.dataset.id = id; dotsEl.appendChild(i); });
function updateProgress(){
  dotsEl.querySelectorAll('i').forEach(el => {
    const on = visited.has(el.dataset.id), c = PRODUCTS[el.dataset.id].color;
    el.classList.toggle('on', on);
    el.style.background = on ? c : ''; el.style.boxShadow = on ? '0 0 10px ' + c : '';
  });
  $('ctr').textContent = ORDER.length ? visited.size + ' of ' + ORDER.length + ' opened' : '';
  idxList.querySelectorAll('li').forEach(li => li.classList.toggle('done', visited.has(li.dataset.id)));
}

/* cursor tag */
let pointerX = -9999, pointerY = -9999, pointerDirty = false;
function placeTag(){ tagEl.style.transform = 'translate3d(' + (pointerX + 16) + 'px,' + (pointerY - 46) + 'px,0)'; }
function showTag(k){
  const P = k.prod, sw = tagEl.querySelector('.sw');
  tagEl.querySelector('.nm').textContent = P.name; tagEl.querySelector('kbd').textContent = P.key;
  sw.style.background = P.color; sw.style.boxShadow = '0 0 10px ' + P.color;
  tagEl.classList.add('on'); placeTag();
}
function hideTag(){ tagEl.classList.remove('on'); }
function updateHover(){
  if (!started || drag.active || COARSE || indexOpen) return;
  if (!pointerDirty && angSpeed < 0.02 && !flight) return;
  pointerDirty = false;
  const k = keyFromHit(hitAt(pointerX, pointerY, hoverables)), prod = k && k.prod ? k : null;
  if (prod !== hoverKey){
    if (hoverKey){ hoverKey.hover = 0; activate(hoverKey); }
    hoverKey = prod;
    if (prod){ prod.hover = 1; activate(prod); SFX.tick(panOf(prod)); if (focused !== prod) showTag(prod); }
    else hideTag();
  }
  cv.classList.toggle('point', !!k);
  if (hoverKey && focused !== hoverKey) placeTag(); else if (hoverKey) hideTag();
}

/* time of day */
const todTrack = $('todTrack'), todKnob = $('todKnob'), todLabel = $('todLabel');
let lastDetent = -1;
const todName = t => t < 0.24 ? 'Afternoon' : t < 0.53 ? 'Golden hour' : t < 0.82 ? 'Blue hour' : 'Night';
function setTodGoal(v, silent){
  todGoal = clamp(v, 0, 1);
  todKnob.style.left = (todGoal*100) + '%'; todLabel.textContent = todName(todGoal);
  todTrack.setAttribute('aria-valuenow', String(Math.round(todGoal*100)));
  todTrack.setAttribute('aria-valuetext', todName(todGoal));
  const det = Math.round(todGoal*24);
  if (det !== lastDetent){ if (lastDetent >= 0 && !silent) SFX.dial(); lastDetent = det; }
}
function setTodFromX(x){ const r = todTrack.getBoundingClientRect(); if (r.width > 0) setTodGoal((x - r.left)/r.width); }
on(todTrack, 'pointerdown', e => {
  todDrag = true; todIntro = null; todTrack.classList.add('drag');
  try { todTrack.setPointerCapture(e.pointerId); } catch (_){}
  setTodFromX(e.clientX); e.stopPropagation();
});
on(todTrack, 'pointermove', e => { if (todDrag) setTodFromX(e.clientX); });
const endTod = () => { todDrag = false; todTrack.classList.remove('drag'); };
on(todTrack, 'pointerup', endTod); on(todTrack, 'pointercancel', endTod);
on(todTrack, 'keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
    e.preventDefault(); e.stopPropagation(); todIntro = null;
    setTodGoal(todGoal + (e.key === 'ArrowRight' ? 0.04 : -0.04));
  }
});

/* sound toggle */
const sndBtn = $('sndBtn');
function syncSnd(){
  const on = SFX.isOn();
  $('sndWave').style.display = on ? '' : 'none'; $('sndX').style.display = on ? 'none' : '';
  sndBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  sndBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
}
on(sndBtn, 'click', () => {
  if (!SFX.isReady()){ if (SFX.init()) SFX.setEnabled(true); }
  else SFX.setEnabled(!SFX.isOn());
  syncSnd();
});

/* ════════════════════════════════════════════════════════════
   INPUT
   ════════════════════════════════════════════════════════════ */
const touches = new Map();
let pinch = null;
const ROT = MOBILE ? 0.0062 : 0.0048;
on(cv, 'contextmenu', e => e.preventDefault());
on(cv, 'pointerdown', e => {
  if (!started) return;
  idleT = 0;
  try { cv.setPointerCapture(e.pointerId); } catch (_){}
  touches.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (touches.size === 2){
    const [a, b] = [...touches.values()];
    pinch = {d:Math.hypot(a.x - b.x, a.y - b.y), cx:(a.x + b.x)/2, cy:(a.y + b.y)/2};
    drag.active = false; releasePressed(true); return;
  }
  if (touches.size > 2) return;
  drag.active = true; drag.mode = (e.button === 2 || e.shiftKey) ? 'pan' : 'orbit';
  drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = drag.t0 = performance.now();
  drag.moved = 0; drag.vx = drag.vy = 0; cam.vy = cam.vp = 0;
  pointerX = e.clientX; pointerY = e.clientY;
  cv.classList.add('grabbing');
  if (e.button === 0 && !introRunning){
    const k = keyFromHit(hitAt(e.clientX, e.clientY, hoverables));
    if (k){ pressed = k; keyDown(k); }
  }
});
on(cv, 'pointermove', e => {
  pointerX = e.clientX; pointerY = e.clientY; pointerDirty = true; idleT = 0;
  if (touches.has(e.pointerId)) touches.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (pinch && touches.size === 2){
    const [a, b] = [...touches.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x)/2, cy = (a.y + b.y)/2;
    if (!introRunning){ if (d > 10 && pinch.d > 10) zoomAt(cx, cy, pinch.d/d); panBy(cx - pinch.cx, cy - pinch.cy); if (flight) flight = null; }
    pinch.d = d; pinch.cx = cx; pinch.cy = cy; hideHint();
    return;
  }
  if (!drag.active) return;
  const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
  drag.lx = e.clientX; drag.ly = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
  if (drag.moved > 7 && pressed) releasePressed(false);
  if (introRunning || drag.moved < 4) return;
  if (flight) flight = null;
  hideHint();
  const now = performance.now(), dts = Math.max(1, now - drag.lt)/1000; drag.lt = now;
  if (drag.mode === 'pan'){ panBy(dx, dy); return; }
  const dYaw = -dx*ROT;
  let dPitch = dy*ROT*0.8;
  if ((cam.g.pitch < LIM.pmin && dPitch < 0) || (cam.g.pitch > LIM.pmax && dPitch > 0)) dPitch *= 0.25;
  cam.g.yaw += dYaw; cam.g.pitch += dPitch;
  drag.vx = lerp(drag.vx, dYaw/dts, 0.35); drag.vy = lerp(drag.vy, dPitch/dts, 0.35);
});
function endPointer(e){
  touches.delete(e.pointerId);
  if (touches.size < 2) pinch = null;
  if (!drag.active){ if (touches.size === 0) cv.classList.remove('grabbing'); return; }
  if (touches.size > 0) return;
  drag.active = false; cv.classList.remove('grabbing');
  const now = performance.now(), downKey = pressed;
  if (e.type === 'pointerup' && drag.moved < 7 && now - drag.t0 < 500) handleClick(e.clientX, e.clientY, downKey);
  else if (now - drag.lt < 90 && drag.mode === 'orbit' && !introRunning){ cam.vy = clamp(drag.vx*0.6, -4.5, 4.5); cam.vp = clamp(drag.vy*0.6, -2, 2); }
  releasePressed(false);
}
on(cv, 'pointerup', endPointer);
on(cv, 'pointercancel', endPointer);
on(cv, 'pointerleave', () => { pointerX = pointerY = -9999; pointerDirty = true; });
function handleClick(x, y, downKey){
  if (introRunning) return;
  const k = downKey || keyFromHit(hitAt(x, y, hoverables));   // the key sinks on press, so trust the one pressed
  if (k && k.prod) open(k.id);
  else if (!k && focused) close();
}
on(cv, 'dblclick', e => {
  if (!started || introRunning || focused) return;
  if (!keyFromHit(hitAt(e.clientX, e.clientY, hoverables))) flyTo(homePose(), 1.4);
});
on(cv, 'wheel', e => {
  e.preventDefault();
  if (!started || introRunning) return;
  idleT = 0; hideHint();
  const dy = e.deltaY*(e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
  const f = e.ctrlKey ? Math.exp(clamp(dy, -60, 60)*0.012) : Math.exp(clamp(dy, -240, 240)*0.0016);
  if (flight) flight = null;
  zoomAt(e.clientX, e.clientY, f);
}, {passive:false});

const downCodes = new Set();
const NO_SCROLL = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End','Backspace','Quote','Slash']);
on(window, 'keydown', e => {
  if (!started){ if (e.code === 'Enter' && introReady){ e.preventDefault(); enter(true); } return; }
  idleT = 0;
  const tgt = e.target;
  if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.tagName === 'SELECT' || tgt.isContentEditable)){
    const kid = CODE_TO_ID[e.code], kk = kid ? KEY_BY_ID[kid] : null;
    if (kk && !kk.removed && !e.repeat && !downCodes.has(e.code)){ downCodes.add(e.code); keyDown(kk); }
    return;
  }
  if (indexOpen){ if (e.code === 'Escape') closeIndex(); return; }
  if (tgt && tgt !== cv && tgt !== document.body && (tgt.tagName === 'BUTTON' || tgt.tagName === 'A') && (e.code === 'Enter' || e.code === 'Space')) return;
  const id = CODE_TO_ID[e.code], k = id ? KEY_BY_ID[id] : null;
  if (k && !e.repeat && !downCodes.has(e.code)){ downCodes.add(e.code); keyDown(k); }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (NO_SCROLL.has(e.code)) e.preventDefault();
  if (e.repeat || introRunning) return;
  if (e.code === 'Escape'){ close(); return; }
  if (focused && e.code === 'ArrowRight'){ step(1); return; }
  if (focused && e.code === 'ArrowLeft'){ step(-1); return; }
  if (k && k.prod) open(k.id);
});
on(window, 'keyup', e => {
  downCodes.delete(e.code);
  const id = CODE_TO_ID[e.code], k = id ? KEY_BY_ID[id] : null;
  if (k) keyUp(k);
});
on(window, 'blur', () => { downCodes.clear(); for (const k of KEYS) if (k.down){ k.down = false; activate(k); } });
on(document, 'visibilitychange', () => SFX.visibility(document.hidden));

function onResize(){
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  const pr = renderer.getPixelRatio();
  if (composer){
    composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight);
    gradePass.uniforms.uRes.value.copy(renderer.getDrawingBufferSize(new THREE.Vector2()));
  }
  stars.material.uniforms.uPR.value = pr;
  GLOWS.forEach(p => { p.material.uniforms.uPR.value = pr; });
}
on(window, 'resize', onResize);

