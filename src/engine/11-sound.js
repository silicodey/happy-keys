/* ════════════════════════════════════════════════════════════
   SOUND — everything synthesised in the browser, no audio files
   ════════════════════════════════════════════════════════════ */
const SFX = (function(PROF){
  let ctx = null, out = null, wet = null, noise = null, ready = false, on = false;
  let windG = null, windF = null, seaG = null, crickG = null, chimeT = 7;
  const canPan = typeof StereoPannerNode !== 'undefined';
  const live = () => ready && on && ctx.state !== 'closed';
  function impulse(sec, decay){
    const n = Math.floor(ctx.sampleRate*sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++){ const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, decay); }
    return b;
  }
  function cricketBuffer(){
    const sr = ctx.sampleRate, n = Math.floor(sr*3.4), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    if (PROF.insect === 'suzumushi'){
      /* bell crickets: a pure, held ring that swells and fades */
      let t = 0.15;
      while (t < 3.1){
        const len = Math.floor(rr(0.35, 0.8)*sr), st = Math.floor(t*sr), f = rr(4050, 4250);
        for (let i = 0; i < len && st + i < n; i++){
          const e = Math.sin(Math.PI*i/len), tr = 0.6 + 0.4*Math.sin(2*Math.PI*38*i/sr);
          d[st + i] += Math.sin(2*Math.PI*f*i/sr)*e*tr*0.42;
        }
        t += len/sr + rr(0.25, 0.7);
      }
      return b;
    }
    for (const [start, f, amp] of [[0.1, 4500, 0.5], [0.31, 4950, 0.3]]){
      let t = start;
      while (t < 3.2){
        for (let p = 0; p < 3; p++){
          const st = Math.floor((t + p*0.034)*sr), len = Math.floor(0.022*sr);
          for (let i = 0; i < len && st + i < n; i++) d[st + i] += Math.sin(2*Math.PI*f*i/sr)*Math.sin(Math.PI*i/len)*amp;
        }
        t += 0.42 + Math.random()*0.5;
      }
    }
    return b;
  }
  function loopNoise(rate){
    const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.playbackRate.value = rate || 1;
    s.start(0, Math.random()*1.5); return s;
  }
  function panNode(p){
    if (canPan){ const n = ctx.createStereoPanner(); n.pan.value = clamp(p || 0, -1, 1); return n; }
    return ctx.createGain();
  }
  function init(){
    if (ready) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e){ return false; }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.003; comp.release.value = 0.25;
    out = ctx.createGain(); out.gain.value = 0; out.connect(comp); comp.connect(ctx.destination);
    const n = ctx.sampleRate*2; noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const nd = noise.getChannelData(0); for (let i = 0; i < n; i++) nd[i] = Math.random()*2 - 1;
    const conv = ctx.createConvolver(); conv.buffer = impulse(2.8, 3.2);
    wet = ctx.createGain(); wet.gain.value = 0.55; wet.connect(conv); conv.connect(out);
    /* the bed: the sea far below, or wind in the trees over a distant city */
    const lp = ctx.createBiquadFilter();
    if (PROF.bed === 'valley'){ lp.type = 'bandpass'; lp.frequency.value = 900; lp.Q.value = 0.45; }
    else { lp.type = 'lowpass'; lp.frequency.value = 460; lp.Q.value = 0.3; }
    seaG = ctx.createGain(); seaG.gain.value = 0; loopNoise(1).connect(lp); lp.connect(seaG); seaG.connect(out);
    for (const [f, a] of [[0.07, 0.016], [0.113, 0.01]]){
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = a; o.connect(g); g.connect(seaG.gain); o.start();
    }
    /* wind that follows how fast you drag */
    windF = ctx.createBiquadFilter(); windF.type = 'bandpass'; windF.frequency.value = 650; windF.Q.value = 0.7;
    windG = ctx.createGain(); windG.gain.value = 0; loopNoise(0.7).connect(windF); windF.connect(windG); windG.connect(out);
    /* crickets after dark */
    const cb = ctx.createBufferSource(); cb.buffer = cricketBuffer(); cb.loop = true;
    const chp = ctx.createBiquadFilter(); chp.type = 'highpass'; chp.frequency.value = 2500;
    crickG = ctx.createGain(); crickG.gain.value = 0; cb.connect(chp); chp.connect(crickG); crickG.connect(out);
    const cs = ctx.createGain(); cs.gain.value = 0.25; crickG.connect(cs); cs.connect(wet); cb.start();
    ready = true;
    return true;
  }
  function setEnabled(b){
    on = !!b;
    if (!ready) return;
    if (on && ctx.state === 'suspended') ctx.resume();
    out.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.12);
  }
  function env(g, t, peak, attack, decay){
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  }
  function thock(pan, weight, width){
    if (!live()) return;
    const t = ctx.currentTime + 0.002, v = 0.92 + Math.random()*0.16, wf = 1/Math.sqrt(Math.max(1, width || 1));
    const P = panNode(pan); P.connect(out);
    const o = ctx.createOscillator(), f0 = 165*v*wf*(weight > 1 ? 0.88 : 1);
    o.frequency.setValueAtTime(f0*1.7, t); o.frequency.exponentialRampToValueAtTime(f0, t + 0.012); o.frequency.exponentialRampToValueAtTime(f0*0.72, t + 0.1);
    const g = ctx.createGain(); env(g, t, 0.28*weight, 0.003, 0.12); o.connect(g); g.connect(P); o.start(t); o.stop(t + 0.14);
    const s = ctx.createBufferSource(); s.buffer = noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2100*v*Math.sqrt(wf); bp.Q.value = 1.2;
    const sg = ctx.createGain(); env(sg, t, 0.5*weight, 0.0015, 0.05); s.connect(bp); bp.connect(sg); sg.connect(P); s.start(t, Math.random()*1.8, 0.07);
    const s2 = ctx.createBufferSource(); s2.buffer = noise;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5500;
    const hg = ctx.createGain(); env(hg, t, 0.13, 0.001, 0.016); s2.connect(hp); hp.connect(hg); hg.connect(P); s2.start(t, Math.random()*1.8, 0.03);
    const w = ctx.createGain(); w.gain.value = 0.05; sg.connect(w); w.connect(wet);
  }
  function release(pan){
    if (!live()) return;
    const t = ctx.currentTime + 0.002, P = panNode(pan); P.connect(out);
    const s = ctx.createBufferSource(); s.buffer = noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3400 + Math.random()*400; bp.Q.value = 1.4;
    const g = ctx.createGain(); env(g, t, 0.16, 0.0015, 0.03); s.connect(bp); bp.connect(g); g.connect(P); s.start(t, Math.random()*1.8, 0.04);
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.03);
    const og = ctx.createGain(); env(og, t, 0.05, 0.002, 0.035); o.connect(og); og.connect(P); o.start(t); o.stop(t + 0.05);
  }
  function tone(f, t, peak, decay, dest, type){
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = f;
    const g = ctx.createGain(); env(g, t, peak, 0.004, decay); o.connect(g); g.connect(dest); o.start(t); o.stop(t + decay + 0.05);
    return g;
  }
  function tick(pan){
    if (!live()) return;
    const t = ctx.currentTime + 0.002, P = panNode(pan); P.connect(out);
    tone(1760, t, 0.03, 0.07, P); tone(2640, t, 0.015, 0.05, P);
  }
  function fmBell(f, gain, dur, t, toWet){
    const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    c.frequency.value = f; m.frequency.value = f*2.76;
    mg.gain.setValueAtTime(f*1.6, t); mg.gain.exponentialRampToValueAtTime(f*0.02, t + dur*0.6);
    m.connect(mg); mg.connect(c.frequency);
    env(g, t, gain, 0.008, dur); c.connect(g); g.connect(out);
    const w = ctx.createGain(); w.gain.value = toWet; g.connect(w); w.connect(wet);
    c.start(t); m.start(t); c.stop(t + dur + 0.05); m.stop(t + dur + 0.05);
  }
  const NOTES = PROF.notes;
  function chime(i){
    if (!live()) return;
    const t = ctx.currentTime + 0.08, f = NOTES[((i % NOTES.length) + NOTES.length) % NOTES.length];
    fmBell(f, 0.05, 1.9, t, 0.5); fmBell(f*1.5, 0.022, 1.5, t + 0.07, 0.6);
  }
  function whoosh(dur, pan){
    if (!live()) return;
    const t = ctx.currentTime + 0.01, s = ctx.createBufferSource(); s.buffer = noise; s.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(1500, t + dur*0.45); bp.frequency.exponentialRampToValueAtTime(320, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + dur*0.42); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const P = panNode(-(pan || 0)*0.6);
    if (P.pan){ P.pan.setValueAtTime(-(pan || 0)*0.6, t); P.pan.linearRampToValueAtTime((pan || 0)*0.6, t + dur); }
    s.connect(bp); bp.connect(g); g.connect(P); P.connect(out); s.start(t, Math.random()*1.5); s.stop(t + dur + 0.05);
  }
  function closeSound(){
    if (!live()) return;
    whoosh(0.9, 0);
    const t = ctx.currentTime + 0.02, o = ctx.createOscillator();
    o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(300, t + 0.25);
    const g = ctx.createGain(); env(g, t, 0.025, 0.01, 0.3); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.35);
  }
  function dial(){ if (!live()) return; tone(1400, ctx.currentTime + 0.002, 0.018, 0.03, out); }
  function bonsho(){
    /* a temple bell: a deep strike that beats as it fades */
    if (!live()) return;
    const t = ctx.currentTime + 0.01, f = 98;
    for (const [r, a, dur] of [[1, 1, 9], [1.007, 0.8, 9], [2.0, 0.35, 6], [2.42, 0.45, 5.5], [2.98, 0.3, 4.5], [4.1, 0.2, 3], [5.3, 0.12, 2.2]]){
      const g = tone(f*r, t, a*0.07, dur, out);
      const w = ctx.createGain(); w.gain.value = 0.55; g.connect(w); w.connect(wet);
    }
    const s = ctx.createBufferSource(); s.buffer = noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 600;
    const g = ctx.createGain(); env(g, t, 0.08, 0.002, 0.12); s.connect(bp); bp.connect(g); g.connect(out); s.start(t, Math.random(), 0.15);
  }
  function bell(){ if (PROF.bell === 'bonsho') bonsho(); else churchBell(); }
  function churchBell(){
    if (!live()) return;
    const t = ctx.currentTime + 0.01, f = 294;
    for (const [r, a, d] of [[0.5, 0.5, 4.5], [1, 1, 3.5], [1.19, 0.45, 2.6], [1.5, 0.35, 2.2], [2, 0.4, 1.8], [2.52, 0.25, 1.4], [2.66, 0.2, 1.2], [3.01, 0.12, 1.0]]){
      const g = tone(f*r, t, a*0.06, d, out);
      const w = ctx.createGain(); w.gain.value = 0.7; g.connect(w); w.connect(wet);
    }
  }
  function koto(){
    /* a koto phrase in the miyako-bushi scale over a quiet drone */
    const t0 = ctx.currentTime + 0.1, scale = [293.66, 311.13, 392.0, 440.0, 466.16, 587.33, 622.25, 783.99];
    [0, 2, 3, 4, 5, 7, 5, 3].forEach((n, i) => {
      const t = t0 + i*0.24 + (i > 5 ? 0.18 : 0), f = scale[n];
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f*6, t); lp.frequency.exponentialRampToValueAtTime(f*1.5, t + 0.6);
      const g = ctx.createGain(); env(g, t, 0.06, 0.004, 1.6);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + 1.7);
      const w = ctx.createGain(); w.gain.value = 0.5; g.connect(w); w.connect(wet);
    });
    const d = ctx.createOscillator(); d.frequency.value = 146.83;
    const dg = ctx.createGain(); dg.gain.setValueAtTime(0.0001, t0); dg.gain.exponentialRampToValueAtTime(0.03, t0 + 1.5); dg.gain.exponentialRampToValueAtTime(0.0001, t0 + 6);
    d.connect(dg); dg.connect(out); d.start(t0); d.stop(t0 + 6.1);
  }
  function swell(){
    if (!live()) return;
    if (PROF.swell === 'koto'){ koto(); return; }
    const t = ctx.currentTime + 0.05;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(1800, t + 2.4); lp.frequency.exponentialRampToValueAtTime(500, t + 5.5);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + 1.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
    lp.connect(g); g.connect(out);
    const w = ctx.createGain(); w.gain.value = 0.8; g.connect(w); w.connect(wet);
    [196, 246.94, 293.66, 369.99, 440].forEach((f, i) => {
      for (const det of [-7, 7]){
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det + i*1.3;
        o.connect(lp); o.start(t + i*0.12); o.stop(t + 6.2);
      }
    });
  }
  function furin(){
    /* a glass wind bell: bright, inharmonic, quick to fade */
    const t0 = ctx.currentTime + 0.05;
    for (let k = 0, n = 1 + ((Math.random()*2)|0); k < n; k++){
      const t = t0 + k*rr(0.25, 0.6), f = rr(2150, 2550);
      for (const [r, a, dur] of [[1, 1, 1.9], [2.32, 0.45, 1.2], [4.25, 0.25, 0.7], [6.1, 0.12, 0.45]]){
        const g = tone(f*r, t, a*0.012, dur, out);
        const w = ctx.createGain(); w.gain.value = 0.6; g.connect(w); w.connect(wet);
      }
    }
  }
  function windChime(){
    const t0 = ctx.currentTime + 0.05, pent = [1046.5, 1174.66, 1318.5, 1568, 1760];
    for (let i = 0, n = 2 + ((Math.random()*3)|0); i < n; i++)
      fmBell(pent[(Math.random()*pent.length)|0], 0.011, 2.6, t0 + i*(0.12 + Math.random()*0.2), 0.65);
  }
  function update(dt, speed, night, lamp, todv){
    if (!ready) return;
    const t = ctx.currentTime;
    windG.gain.setTargetAtTime(on ? clamp(speed*0.05, 0, 0.07) : 0, t, 0.08);
    windF.frequency.setTargetAtTime(500 + clamp(speed, 0, 3)*500, t, 0.1);
    seaG.gain.setTargetAtTime(on ? (PROF.bed === 'valley' ? 0.03 : 0.045) : 0, t, 0.5);
    crickG.gain.setTargetAtTime(on ? 0.022*night : 0, t, 0.8);
    if (on && todv > 0.3 && todv < 0.9){ chimeT -= dt; if (chimeT <= 0){ chimeT = 9 + Math.random()*14; if (PROF.chime === 'furin') furin(); else windChime(); } }
  }
  function visibility(hidden){ if (!ready) return; if (hidden) ctx.suspend(); else if (on) ctx.resume(); }
  function dispose(){ if (ready){ try { ctx.close(); } catch (_){} } ready = false; on = false; }
  return {init, setEnabled, isOn:() => on, isReady:() => ready, thock, release, tick, whoosh, chime, closeSound, dial,
          bell, swell, update, visibility, dispose};
})(SET.sound);

