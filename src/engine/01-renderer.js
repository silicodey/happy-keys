/* ════════════════════════════════════════════════════════════
   RENDERER
   ════════════════════════════════════════════════════════════ */
const renderer = new THREE.WebGLRenderer({antialias: !HAS_POST, powerPreference:'high-performance', stencil:false});
const QUALITY = MOBILE ? [1.5, 1.25, 1.0] : [1.75, 1.5, 1.25, 1.0];
let qIdx = 0;
const prFor = i => Math.min(window.devicePixelRatio || 1, QUALITY[i]);
renderer.setPixelRatio(prFor(0));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const LISTENERS = [];
function on(t, ev, fn, o){ t.addEventListener(ev, fn, o); LISTENERS.push([t, ev, fn, o]); }
const cv = renderer.domElement;
cv.id = 'gl'; cv.tabIndex = 0;
cv.setAttribute('aria-label', 'Interactive 3D keyboard portfolio. Drag to look around; the glowing keys open projects.');
document.body.insertBefore(cv, document.body.firstChild);
cv.style.opacity = '0';

const scene  = new THREE.Scene();
scene.fog    = new THREE.Fog(0xffffff, 170, 1250);
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.05, 6000);

/* ════════════════════════════════════════════════════════════
   CANVAS TEXTURES
   ════════════════════════════════════════════════════════════ */
function makeCanvas(w,h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tileNoise(size, freq, grain){
  const c = makeCanvas(size,size), x = c.getContext('2d'), img = x.createImageData(size,size), d = img.data;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++){
    const n = fbm(i/size*freq, j/size*freq, freq);
    const v = clamp(0.5 + n*0.42 + (R() - 0.5)*grain, 0, 1) * 255, o = (j*size + i) * 4;
    d[o] = d[o+1] = d[o+2] = v; d[o+3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function cloudTexture(){
  const c = makeCanvas(512,256), x = c.getContext('2d');
  for (let i = 0; i < 28; i++){
    const cx = rr(80,432), spread = 1 - Math.abs(cx - 256) / 300;
    const cy = rr(120,165) - spread*22, r = rr(36,92) * Math.max(0.35, spread);
    const g = x.createRadialGradient(cx,cy,0,cx,cy,r);
    g.addColorStop(0,'rgba(255,255,255,0.5)'); g.addColorStop(0.55,'rgba(255,255,255,0.16)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(cx - r, cy - r, r*2, r*2);
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}

/* legend atlas: one 2048² canvas, 16×16 cells, redrawn once the web fonts land */
const ATLAS = {cv: makeCanvas(2048,2048), cells:{}, next:0, tex:null};
function atlasCell(text){ if (ATLAS.cells[text] === undefined) ATLAS.cells[text] = ATLAS.next++; return ATLAS.cells[text]; }
function cellUV(i){ const c = i % 16, r = (i / 16) | 0; return {u0:c/16, v0:1 - (r+1)/16, du:1/16, dv:1/16}; }
function drawAtlas(){
  const x = ATLAS.cv.getContext('2d');
  x.clearRect(0,0,2048,2048); x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const text in ATLAS.cells){
    const i = ATLAS.cells[text], cx = (i % 16)*128 + 64, cy = ((i/16)|0)*128 + 64;
    const single = [...text].length === 1;
    let size = single ? 64 : 38;
    do { x.font = '500 ' + size + 'px "Instrument Sans","Helvetica Neue",Arial,sans-serif';
         if (x.measureText(text).width <= 104) break; size -= 2; } while (size > 14);
    x.fillText(text, cx, cy + 2);
  }
  if (ATLAS.tex) ATLAS.tex.needsUpdate = true;
}

/* ════════════════════════════════════════════════════════════
   GEOMETRY HELPERS
   ════════════════════════════════════════════════════════════ */
function rrect(w,d,r,seg){                     // flat [x,z,...] around a rounded rectangle
  r = Math.min(r, w/2 - 1e-3, d/2 - 1e-3);
  const pts = [], C = [[w/2-r,d/2-r,0],[-w/2+r,d/2-r,Math.PI/2],[-w/2+r,-d/2+r,Math.PI],[w/2-r,-d/2+r,Math.PI*1.5]];
  for (const c of C) for (let i = 0; i <= seg; i++){ const a = c[2] + i/seg*Math.PI/2; pts.push(c[0] + Math.cos(a)*r, c[1] + Math.sin(a)*r); }
  return pts;
}
function roundedRectShape(w,d,r){
  r = Math.min(r, w/2 - 1e-4, d/2 - 1e-4);
  const x = w/2, y = d/2, s = new THREE.Shape();
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r);
  s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y); s.lineTo(-x + r, y);
  s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y);
  return s;
}
/* rounded corners + chamfered top/bottom, exactly h tall, centred on the origin */
function chamferBox(w,h,d,r,bev,seg){
  bev = Math.min(bev, h/2 - 0.0005); r = Math.max(r, bev + 0.0005);
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w - 2*bev, d - 2*bev, r - bev), {
    depth: h - 2*bev, bevelEnabled:true, bevelThickness:bev, bevelSize:bev, bevelOffset:0,
    bevelSegments: seg || 3, curveSegments:6, steps:1 });
  g.rotateX(-Math.PI/2);
  g.translate(0, bev - h/2, 0);
  g.computeVertexNormals();
  return g;
}

/* Keycap: lofted rounded-rect rings with a taper, a soft top bevel and a
   spherical dish. One geometry per width so corner radii never stretch. */
const CAP = {gap:0.12, unit:0.86, dish:0.024, taper:0.12, H:0.5};
const capGeoCache = {};
function capGeometry(units){
  const key = units.toFixed(2);
  if (capGeoCache[key]) return capGeoCache[key];
  const H = CAP.H, W = CAP.unit + (units - 1), D = CAP.unit, t = CAP.taper, seg = 4;
  const rings = [
    [0,        W,             D,             0.07 ],
    [0.05,     W,             D,             0.07 ],
    [H*0.80,   W - 2*t*0.82,  D - 2*t*0.82,  0.095],
    [H*0.965,  W - 2*t,       D - 2*t,       0.10 ],
    [H,        W - 2*t - 0.045, D - 2*t - 0.045, 0.08]
  ];
  const pos = []; let n = 0;
  for (const [y,w,d,r] of rings){ const p = rrect(w,d,r,seg); n = p.length/2; for (let j = 0; j < n; j++) pos.push(p[j*2], y, p[j*2+1]); }
  const top = rings[rings.length - 1];
  const inner = rrect(top[1]*0.55, top[2]*0.55, top[3]*0.55, seg);
  for (let j = 0; j < n; j++) pos.push(inner[j*2], H - CAP.dish*0.62, inner[j*2+1]);
  pos.push(0, H - CAP.dish, 0);
  const idx = [], ringCount = rings.length + 1;
  for (let i = 0; i < ringCount - 1; i++) for (let j = 0; j < n; j++){
    const a = i*n + j, b = i*n + (j+1)%n, c = (i+1)*n + j, d = (i+1)*n + (j+1)%n;
    idx.push(a,c,d, a,d,b);
  }
  const ib = (ringCount - 1)*n, center = ringCount*n;
  for (let j = 0; j < n; j++) idx.push(ib + j, center, ib + (j+1)%n);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  capGeoCache[key] = g;
  return g;
}

/* Collapse a group of static meshes into one mesh per material. */
function mergeByMaterial(root){
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map(), m = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new V3(), nn = new V3();
  root.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry, P = g.attributes.position, N = g.attributes.normal;
    m.multiplyMatrices(inv, o.matrixWorld); nm.getNormalMatrix(m);
    let b = buckets.get(o.material);
    if (!b){ b = {pos:[], nor:[], idx:[], n:0, cast:false}; buckets.set(o.material, b); }
    b.cast = b.cast || o.castShadow;
    for (let i = 0; i < P.count; i++){
      v.fromBufferAttribute(P, i).applyMatrix4(m); b.pos.push(v.x, v.y, v.z);
      nn.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); b.nor.push(nn.x, nn.y, nn.z);
    }
    if (g.index){ for (let i = 0; i < g.index.count; i++) b.idx.push(g.index.getX(i) + b.n); }
    else { for (let i = 0; i < P.count; i++) b.idx.push(i + b.n); }
    b.n += P.count;
  });
  const out = new THREE.Group();
  for (const [mat, b] of buckets){
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    g.setIndex(b.idx); g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, mat); mesh.castShadow = b.cast; mesh.receiveShadow = true;
    out.add(mesh);
  }
  return out;
}

/* ════════════════════════════════════════════════════════════
   MATERIALS + ANIMATION REGISTRIES (one motion per object)
   ════════════════════════════════════════════════════════════ */
function std(hex, rough, metal, extra){
  return new THREE.MeshStandardMaterial(Object.assign({color:col(hex), roughness: rough === undefined ? 0.85 : rough, metalness: metal || 0}, extra || {}));
}
function mb(w,h,d,m){ const o = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m); o.castShadow = true; o.receiveShadow = true; return o; }
function mc(rt,rb,h,s,m){ const o = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s), m); o.castShadow = true; o.receiveShadow = true; return o; }
function mcone(r,h,s,m){ const o = new THREE.Mesh(new THREE.ConeGeometry(r,h,s), m); o.castShadow = true; return o; }
function msph(r,s,m){ const o = new THREE.Mesh(new THREE.SphereGeometry(r, s, Math.max(4, (s*0.7)|0)), m); o.castShadow = true; return o; }
function mtor(r,t,s,m){ const o = new THREE.Mesh(new THREE.TorusGeometry(r,t,8,s), m); o.castShadow = true; return o; }

const SWAY = [], SPIN = [], ORBIT = [];
const speedOf = e => 1 + (e.owner ? e.owner.focus * 1.6 : 0);

