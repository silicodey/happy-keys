// Loads a built page in jsdom with a stub WebGL renderer and returns a driver.
const fs = require('fs'), path = require('path');
const {JSDOM, VirtualConsole} = require('jsdom');
const nm = p => fs.readFileSync(path.join(__dirname, '..', 'node_modules/three', p), 'utf8');
function load(file, {fetchJSON, width = 1280, height = 720} = {}){
  let html = fs.readFileSync(file, 'utf8');
  const STUB = fs.readFileSync(path.join(__dirname, 'stub.js'), 'utf8');
  html = html.replace(/<script src="https:\/\/cdnjs[^"]+three\.min\.js"><\/script>/, () => '<script>' + nm('build/three.min.js') + '</script><script>' + STUB + '</script>');
  html = html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/(examples\/js\/[^"]+)"><\/script>/g, (m, p) => '<script>' + nm(p) + '</script>');
  html = html.replace(/<link[^>]+googleapis[^>]*>/g, '');
  const errors = [], warns = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail && e.detail.stack || e.stack || e.message)));
  vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
  vc.on('warn', (...a) => warns.push(a.join(' ')));
  const clock = {now:0};
  const dom = new JSDOM(html, {runScripts:'dangerously', pretendToBeVisual:true, virtualConsole:vc, url:'https://example.org/',
    beforeParse(w){
      w.innerWidth = width; w.innerHeight = height;
      w.performance.now = () => clock.now;
      w.matchMedia = q => ({matches:false, media:q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}});
      w.HTMLCanvasElement.prototype.getContext = function(){
        const grad = {addColorStop(){}};
        const base = {canvas:this, measureText:t => ({width:String(t).length*20}), createRadialGradient:() => grad, createLinearGradient:() => grad,
          createImageData:(a,b) => ({width:a, height:b, data:new Uint8ClampedArray(a*b*4)}), putImageData(){}};
        return new Proxy(base, {get:(t,p) => p in t ? t[p] : function(){}, set:(t,p,v) => { t[p] = v; return true; }});
      };
      w.HTMLElement.prototype.setPointerCapture = function(){};
      w.HTMLElement.prototype.getBoundingClientRect = function(){ return {left:100, top:0, width:128, height:28, right:228, bottom:28}; };
      const param = () => ({value:0, setValueAtTime(){}, exponentialRampToValueAtTime(){}, linearRampToValueAtTime(){}, setTargetAtTime(){}});
      const node = () => ({connect(){}, disconnect(){}, start(){}, stop(){}, gain:param(), frequency:param(), detune:param(), Q:param(), pan:param(),
        playbackRate:param(), threshold:param(), knee:param(), ratio:param(), attack:param(), release:param()});
      w.__audio = {contexts:0, closed:0};
      w.AudioContext = function(){ w.__audio.contexts++; this.state = 'running'; this.currentTime = 0; this.sampleRate = 44100; this.destination = {};
        this.createBuffer = (c, n) => ({getChannelData:() => new Float32Array(n)});
        ['createGain','createOscillator','createBiquadFilter','createBufferSource','createConvolver','createDynamicsCompressor','createStereoPanner'].forEach(f => { this[f] = node; });
        this.resume = () => Promise.resolve(); this.suspend = () => Promise.resolve(); this.close = () => { w.__audio.closed++; return Promise.resolve(); }; };
      w.StereoPannerNode = function(){};
      if (fetchJSON) w.fetch = url => Promise.resolve({ok:true, status:200, json:() => Promise.resolve(fetchJSON)});
      w.requestAnimationFrame = () => 0;
    }});
  const w = dom.window, d = w.document;
  const api = {
    w, d, errors, warns, clock,
    async settle(ms = 30){ await new Promise(r => setTimeout(r, ms)); },
    step(n, ms = 16.7){ for (let i = 0; i < n; i++){ clock.now += ms; if (w.__loop) w.__loop(clock.now); } },
    ev(el, type, o){ const e = new w.MouseEvent(type, Object.assign({bubbles:true, cancelable:true, clientX:640, clientY:360, button:0}, o)); e.pointerId = 1; el.dispatchEvent(e); },
    key(type, code){ w.dispatchEvent(new w.KeyboardEvent(type, {code, bubbles:true})); },
    R(){ return w.__renderer(); }
  };
  return api;
}
const codeFor = label => /^[A-Z]$/.test(label) ? 'Key' + label : /^[0-9]$/.test(label) ? 'Digit' + label : /^F\d+$/.test(label) ? label :
  ({Home:'Home', End:'End', Ins:'Insert', Del:'Delete', PgUp:'PageUp', PgDn:'PageDown'})[label];
async function viewerSuite(file, extra){
  const h = load(file, extra), log = [];
  await h.settle();
  const {d, w} = h;
  try {
    if (d.getElementById('intro').classList.contains('broken')){
      log.push('ERROR SCREEN: ' + [...d.querySelectorAll('#introErr li')].map(li => li.textContent).join(' | '));
      return {log, errors:h.errors};
    }
    h.step(5);
    log.push('title: ' + d.title + ' | intro line: ' + d.getElementById('introLine').textContent);
    d.getElementById('goSound').click(); h.step(400);
    const items = [...d.querySelectorAll('#idxList li')].map(li => [li.querySelector('.k').textContent, li.querySelector('.n').textContent]);
    log.push('keys: ' + items.map(([k, n]) => k + '=' + n).join(', '));
    let ok = 0;
    for (const [label, name] of items){
      const c = codeFor(label); h.key('keydown', c); h.step(2); h.key('keyup', c); h.step(95);
      if (d.getElementById('pName').textContent === name && d.getElementById('panel').classList.contains('open')) ok++;
    }
    log.push('physical keys open the right project: ' + ok + '/' + items.length);
    h.key('keydown', 'Escape'); h.key('keyup', 'Escape'); h.step(100);
    h.key('keydown', 'KeyH'); h.key('keyup', 'KeyH'); h.step(5);
    const cvs = d.getElementById('gl');
    cvs.dispatchEvent(new w.MouseEvent('dblclick', {bubbles:true, clientX:20, clientY:700})); h.step(120);
    const found = new Set();
    for (let y = 140; y < 640; y += 9) for (let x = 40; x < 1260; x += 9){
      h.ev(cvs, 'pointermove', {clientX:x, clientY:y}); h.clock.now += 16; w.__loop(h.clock.now);
      if (d.getElementById('tag').classList.contains('on')) found.add(d.querySelector('#tag .nm').textContent);
    }
    log.push('hover sweep finds: ' + found.size + '/' + items.length);
    let clicked = '';
    for (let y = 140; y < 640 && !clicked; y += 9) for (let x = 40; x < 1260 && !clicked; x += 9){
      h.ev(cvs, 'pointermove', {clientX:x, clientY:y}); h.clock.now += 16; w.__loop(h.clock.now);
      if (d.getElementById('tag').classList.contains('on')){ h.ev(cvs, 'pointerdown', {clientX:x, clientY:y}); h.clock.now += 60; w.__loop(h.clock.now); h.ev(cvs, 'pointerup', {clientX:x, clientY:y}); h.step(90); clicked = d.getElementById('pName').textContent; }
    }
    log.push('mouse click opens: ' + clicked);
    const tr = d.getElementById('todTrack');
    h.ev(tr, 'pointerdown', {clientX:225}); h.ev(tr, 'pointerup', {clientX:225}); h.step(150);
    log.push('slider to night: ' + d.getElementById('todLabel').textContent);
    w.innerWidth = 390; w.innerHeight = 844; w.dispatchEvent(new w.Event('resize')); h.step(30);
    log.push('budget: ' + JSON.stringify(h.R().budget) + ' frames: ' + h.R().frames);
    log.push('objects intruding into the board: ' + (h.R().collisions.length ? h.R().collisions.slice(0, 6).join(' | ') : 'none'));
  } catch (e){ h.errors.push('HARNESS: ' + e.stack); }
  return {log, errors:h.errors};
}
module.exports = {load, viewerSuite, codeFor};
if (require.main === module){
  (async () => {
    for (const f of process.argv.slice(2)){
      const {log, errors} = await viewerSuite(f);
      console.log('===== ' + f + '\n' + log.join('\n') + '\nERRORS (' + errors.length + ')' + (errors.length ? ':\n' + errors.slice(0, 6).join('\n---\n') : ''));
      const bad = errors.length || log.some(l => /: (\d+)\/(\d+)$/.test(l) && RegExp.$1 !== RegExp.$2) || !log.some(l => l === 'objects intruding into the board: none');
      if (bad) process.exitCode = 1;
    }
  })();
}
