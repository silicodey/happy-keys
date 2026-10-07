/* ════════════════════════════════════════════════════════════
   ENTRANCE
   ════════════════════════════════════════════════════════════ */
function enter(withSound){
  if (started || !introReady) return;
  started = true; introRunning = true;
  if (withSound && SFX.init()) SFX.setEnabled(true);
  syncSnd();
  $('intro').classList.add('gone'); document.body.classList.add('live');
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  try { cv.focus({preventScroll:true}); } catch (_){}
  setPose(INTRO_POSE); applyCam();
  todIntro = {from:META.introFrom, to:META.tod, t:0};
  flyTo(homePose(), REDUCED ? 0.01 : 5.2, () => { introRunning = false; });
  SFX.swell();
  setTimeout(hideHint, 18000);
}
on($('goSound'), 'click', () => enter(true));
on($('goQuiet'), 'click', () => enter(false));

/* ════════════════════════════════════════════════════════════
   LIFE + LOOP
   ════════════════════════════════════════════════════════════ */
function animate(dt){
  stars.material.uniforms.uTime.value = T;
  for (const p of GLOWS) p.material.uniforms.uTime.value = T;
  sky.position.copy(camera.position); stars.position.copy(camera.position);
  WORLD.animate(dt); PLAT.animate(dt); STREET.animate(dt);
  KEYFX.step(dt);

  for (const s of SWAY){ s.ph = (s.ph || s.p) + dt*s.s*speedOf(s); s.o.rotation.z = s.base + Math.sin(s.ph)*s.a; }
  for (const s of SPIN) s.o.rotation.y += dt*s.spd*speedOf(s);
  for (const s of ORBIT){ s.ph += dt*s.spd*speedOf(s); s.o.rotation.y = s.ph; }

  bellPh += dt*5.5; bellAmp *= Math.exp(-0.45*dt);
  BELLS.forEach((b, i) => { b.rotation.z = Math.sin(bellPh + i*0.7)*(bellAmp + 0.02); });

  for (const L of LAMPS){
    let v = smooth(L.th, L.th + 0.035, tod);
    if (v > 0.02 && v < 0.98 && Math.sin(T*47 + L.th*311) < -0.2) v *= 0.25;
    L.mat.emissiveIntensity = v*3.0;
  }

  for (const k of productKeys){
    k.focus += ((focused === k ? 1 : 0) - k.focus)*(1 - Math.exp(-5*dt));
    k.glow  += ((k.hover ? 1 : 0) - k.glow)*(1 - Math.exp(-8*dt));
    k.baseMat.emissiveIntensity  = 0.22 + lampOn*1.05 + k.glow*0.7 + k.focus*1.3;
    k.shellMat.emissiveIntensity = 0.03 + lampOn*0.1 + k.glow*0.12 + k.focus*0.22;
  }

  for (const w of walkers){
    if (w.pause > 0) w.pause -= dt;
    else {
      w.t += w.spd*w.dir*dt;
      if (w.t > 0.985){ w.t = 0.985; w.dir = -1; w.pause = 1 + Math.random()*2.5; }
      if (w.t < 0.015){ w.t = 0.015; w.dir = 1; w.pause = 1 + Math.random()*2.5; }
      if (Math.random() < 0.0015) w.pause = 1.2 + Math.random()*3;
    }
    const p = lane.getPointAt(w.t), tg = lane.getTangentAt(w.t), gy = groundTop(rowAt(p.z));
    w.y += (gy - w.y)*(1 - Math.exp(-14*dt));
    w.g.position.set(p.x - tg.z*w.off, w.y, p.z + tg.x*w.off);
    w.g.rotation.y = Math.atan2(tg.x*w.dir, tg.z*w.dir);
    const st = w.pause > 0 ? 0 : Math.sin(T*9 + w.ph)*0.55;
    w.lL.rotation.x = st; w.lR.rotation.x = -st;
  }
  cat.t += dt*0.018; if (cat.t > 0.97) cat.t = 0.03;
  {
    const p = lane.getPointAt(cat.t), tg = lane.getTangentAt(cat.t);
    cat.y += (groundTop(rowAt(p.z)) - cat.y)*(1 - Math.exp(-14*dt));
    cat.g.position.set(p.x - tg.z*cat.off, cat.y, p.z + tg.x*cat.off);
    cat.g.rotation.y = Math.atan2(tg.x, tg.z) - Math.PI/2;
    cat.tail.rotation.z = 0.5 + Math.sin(T*3.1)*0.45;
  }

  for (const g of birds){
    const a = T*g.spd + g.ph;
    g.g.position.set(g.cx + Math.cos(a)*g.rad, g.y + Math.sin(a*2.1)*1.6, g.cz + Math.sin(a)*g.rad*0.7);
    g.g.rotation.y = -a + (g.spd > 0 ? Math.PI/2 : -Math.PI/2);
    const f = Math.sin(T*g.flap + g.ph)*0.55; g.l.rotation.z = f; g.r.rotation.z = -f;
  }
}

/* first paint */
applyTOD(tod);
updateEnv();
setPose(INTRO_POSE); applyCam();
setTodGoal(todGoal, true);
syncSnd(); updateProgress();
if (document.fonts && document.fonts.load){
  Promise.all([document.fonts.load('500 64px "Instrument Sans"'), document.fonts.load('500 38px "Instrument Sans"')])
    .then(drawAtlas).catch(() => {});
}
$('loadBar').style.transform = 'scaleX(0.6)';
function startPreview(){
  started = true; introRunning = false; todIntro = null;
  document.body.classList.add('live');
  setPose(homePose()); applyCam();
}
if (META.preview) startPreview();

const clock = new THREE.Clock();
let frames = 0, perfAcc = 0, perfN = 0;
renderer.setAnimationLoop(() => {
  const raw = clock.getDelta(), dt = Math.min(raw, 1/20);
  T += dt; idleT += dt; frames++;
  if (started) liveT += dt;
  if (todIntro){
    todIntro.t += dt/4.6;
    setTodGoal(lerp(todIntro.from, todIntro.to, easeInOut(Math.min(1, todIntro.t))), true);
    if (todIntro.t >= 1) todIntro = null;
  }
  tod += (todGoal - tod)*(1 - Math.exp(-(todDrag ? 10 : 4)*dt));
  if (Math.abs(tod - todShown) > 0.0004) applyTOD(tod);
  updateCamera(dt);
  updateHover();
  stepKeys(dt);
  animate(dt);
  envAge += dt;
  if (envDirty && envAge > (todDrag || todIntro ? 0.25 : 0.12)) updateEnv();
  SFX.update(dt, started ? angSpeed : 0, nightF, lampOn, tod);
  render(dt);
  if (frames === 2) cv.style.opacity = '';
  if (!introReady && frames >= 3){ introReady = true; $('loadBar').style.transform = 'scaleX(1)'; $('intro').classList.add('ready'); }
  if (liveT > 6 && qIdx < QUALITY.length - 1 && !RECORDING){   // a recording keeps full sharpness even if the recorder slows the frame rate
    perfAcc += raw;
    if (++perfN >= 120){
      const avg = perfAcc/perfN; perfAcc = 0; perfN = 0;
      if (avg > 0.024){ qIdx++; renderer.setPixelRatio(prFor(qIdx)); onResize(); }
    }
  }
});

/* ════════════════════════════════════════════════════════════
   TEARDOWN + STUDIO HANDLE
   ════════════════════════════════════════════════════════════ */
function dispose(){
  if (disposed) return;
  disposed = true;
  renderer.setAnimationLoop(null);
  for (const [t, ev, fn, o] of LISTENERS) t.removeEventListener(ev, fn, o);
  LISTENERS.length = 0;
  SFX.dispose();
  const seen = new Set();
  const drop = mt => {
    if (!mt || seen.has(mt)) return; seen.add(mt);
    for (const key in mt){ const v = mt[key]; if (v && v.isTexture) v.dispose(); }
    if (mt.uniforms) for (const key in mt.uniforms){ const v = mt.uniforms[key] && mt.uniforms[key].value; if (v && v.isTexture) v.dispose(); }
    mt.dispose();
  };
  scene.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(drop);
  });
  if (ATLAS.tex) ATLAS.tex.dispose();
  if (envRT) envRT.dispose();
  pmrem.dispose();
  if (composer){ composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  renderer.dispose();
  try { renderer.forceContextLoss(); } catch (_){}
  cv.remove();
  panel.classList.remove('open', 'show'); panel.setAttribute('aria-hidden', 'true');
  PEEK.hide(true); $('pPeek').innerHTML = ''; $('pPeek').classList.remove('ready');
  hideTag(); closeIndex(true);
  idxList.innerHTML = ''; dotsEl.innerHTML = '';
}
return {
  dispose,
  setting: META.street,
  setInsets(l, b, now){ INSET.l = l || 0; INSET.b = b || 0; if (focused) return; if (now){ setPose(homePose()); applyCam(); } else flyTo(homePose(), 0.6); },
  look(i){
    const k = KEY_BY_ID[ORDER[i]]; if (!k) return;
    if (focused) close();
    for (const pk of productKeys){ pk.hold = pk === k; activate(pk); }
    flyTo(lookPose(k), 1.1);
  },
  release(){ for (const pk of productKeys){ pk.hold = false; activate(pk); } },
  setTod(v){ todIntro = null; setTodGoal(v, true); },
  focus(i){ const id = ORDER[i]; if (id) open(id); },
  home(){ if (focused) close(); else flyTo(homePose(), 0.9); },
  sound(onOff){ if (onOff){ if (!SFX.isReady()) SFX.init(); SFX.setEnabled(true); } else SFX.setEnabled(false); syncSnd(); },
  update(products){
    for (const id of ORDER){
      const P = PRODUCTS[id], N = products[id];
      if (!N) continue;
      const recol = P.color !== N.color;
      Object.assign(P, N);
      if (recol) recolor(KEY_BY_ID[id]);
    }
    buildIndex(); updateProgress();
    if (focused) fillPanel(focused);
  }
};
