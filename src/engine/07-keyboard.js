/* ════════════════════════════════════════════════════════════
   KEYBOARD CASE — a wedge of champagne aluminium
   ════════════════════════════════════════════════════════════ */
const CASE = {W:19.65, D:7.65, hf:0.92, hb:1.38, b:0.1};
const SLOPE = Math.atan((CASE.hb - CASE.hf) / (CASE.D - 2*CASE.b));
function wedgeGeometry(){
  const {W, D, hf, hb, b} = CASE, d = D - 2*b, f = hf - 2*b, k = hb - 2*b, r = 0.22;
  const zf = d/2, zb = -d/2, sl = (k - f)/d, yAt = z => f + (zf - z)*sl;
  const s = new THREE.Shape();
  s.moveTo(zb + r, 0); s.lineTo(zf - r, 0); s.quadraticCurveTo(zf, 0, zf, r);
  s.lineTo(zf, f - r); s.quadraticCurveTo(zf, f, zf - r, yAt(zf - r));
  s.lineTo(zb + r, yAt(zb + r)); s.quadraticCurveTo(zb, k, zb, k - r);
  s.lineTo(zb, r); s.quadraticCurveTo(zb, 0, zb + r, 0);
  const g = new THREE.ExtrudeGeometry(s, {depth:W - 2*b, bevelEnabled:true, bevelThickness:b, bevelSize:b,
    bevelOffset:0, bevelSegments:4, curveSegments:10, steps:1});
  g.translate(0, b, -(W - 2*b)/2);
  g.rotateY(-Math.PI/2);
  g.computeVertexNormals();
  return g;
}
const MAT_CASE = (function(){
  const b = SET.board, extra = {envMapIntensity: b.grain ? 0.6 : 1.25};
  if (b.grain){
    const c = makeCanvas(512, 512), x = c.getContext('2d');
    x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 260; i++){
      const y = R()*512, a = rr(0.04, 0.16);
      x.strokeStyle = R() < 0.5 ? 'rgba(0,0,0,' + a + ')' : 'rgba(255,255,255,' + a*0.7 + ')';
      x.lineWidth = rr(0.6, 2.2); x.beginPath(); x.moveTo(0, y);
      for (let px = 0; px <= 512; px += 32) x.lineTo(px, y + Math.sin(px*0.012 + i)*rr(1, 5));
      x.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 0.6);
    extra.bumpMap = t; extra.bumpScale = 0.012;
  }
  return std(b.caseHex, b.caseRough, b.caseMetal, extra);
})();
const caseMesh = new THREE.Mesh(wedgeGeometry(), MAT_CASE);
caseMesh.position.y = MAT_TOP; caseMesh.castShadow = caseMesh.receiveShadow = true;
scene.add(caseMesh);
const underglowMat = new THREE.MeshStandardMaterial({color:col('#FFE1BE'), emissive:col('#FFB061'), emissiveIntensity:0});
const underglow = new THREE.Mesh(new THREE.BoxGeometry(CASE.W - 1.4, 0.03, 0.03), underglowMat);
underglow.position.set(0, MAT_TOP + 0.07, CASE.D/2 + 0.02); scene.add(underglow);

const deck = new THREE.Group();
deck.position.set(0, MAT_TOP + (CASE.hf + CASE.hb)/2, 0);
deck.rotation.x = SLOPE;
scene.add(deck);
deck.userData.board = true; caseMesh.userData.board = true;
const PLATE_TOP = 0.1, KEY_BASE = PLATE_TOP + CAP.gap;
const plate = new THREE.Mesh(chamferBox(18.6, 0.1, 6.6, 0.14, 0.03), std(SET.board.plate, 0.5, 0.3));
plate.position.y = 0.05; plate.receiveShadow = true; deck.add(plate);

const ledMats = [0,1,2].map(() => new THREE.MeshStandardMaterial({color:col('#C9F2D2'), emissive:col('#5BDB7C'), emissiveIntensity:0.15}));
ledMats.forEach((m, i) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12), m); l.position.set(7.7 + i*0.32, 0.012, -3.56); deck.add(l); });
let capsOn = false;

/* ════════════════════════════════════════════════════════════
   KEYS
   ════════════════════════════════════════════════════════════ */
const KEYS = [], KEY_BY_ID = {}, VOID = [], hoverables = [];
LAYOUT.forEach((row, r) => {
  const c = LANE_C[r], lo = c - LANE_HW, hi = c + LANE_HW;
  let L = -1e9, Rr = 1e9;
  row.forEach(([id, label, x, w, kind]) => {
    const removed = x < hi && x + w > lo;
    const k = {id, label, row:r, kind, w, removed, x:LX(x + w/2), z:LZ(ROWZ[r]), tilt:ROW_TILT[r], sy:ROW_H[r]/CAP.H,
      prod:PRODUCTS[id] || null, p:0, v:0, press:0, down:false, hover:0, hold:false, focus:0, glow:0,
      mesh:null, idx:-1, legMesh:null, legIdx:-1, group:null};
    KEYS.push(k); KEY_BY_ID[id] = k;
    if (!removed){ if (x + w <= c) L = Math.max(L, x + w); else Rr = Math.min(Rr, x); }
  });
  VOID.push({L, R:Rr, c});
});

const MAT_ALPHA = std(SET.board.alpha, 0.6, 0, {envMapIntensity:0.7});
const MAT_MOD   = std(SET.board.mod, 0.55, 0, {envMapIntensity:0.85});
const keyMeshes = [];
(function buildKeys(){
  const groups = {};
  for (const k of KEYS){ if (k.removed || k.prod) continue; const gk = k.w.toFixed(2) + '|' + k.kind; (groups[gk] = groups[gk] || []).push(k); }
  for (const gk in groups){
    const list = groups[gk], [ws, kind] = gk.split('|');
    const mesh = new THREE.InstancedMesh(capGeometry(parseFloat(ws)), kind === 'm' ? MAT_MOD : MAT_ALPHA, list.length);
    mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
    mesh.userData.keys = list;
    list.forEach((k, i) => { k.mesh = mesh; k.idx = i; });
    deck.add(mesh); keyMeshes.push(mesh); hoverables.push(mesh);
  }
})();

/* legends: one instanced quad per key, each sampling its own atlas cell */
for (const k of KEYS) if (!k.removed && !k.prod && k.label) k.cell = atlasCell(k.label);
drawAtlas();
ATLAS.tex = new THREE.CanvasTexture(ATLAS.cv);
ATLAS.tex.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
const LEG_GEO = new THREE.PlaneGeometry(1, 1); LEG_GEO.rotateX(-Math.PI/2);
const legendMats = [];
function legendMesh(list, hex, glowHex){
  const geo = LEG_GEO.clone();
  const aUV = new THREE.InstancedBufferAttribute(new Float32Array(list.length*4), 4);
  geo.setAttribute('aUV', aUV);
  const mat = new THREE.MeshStandardMaterial({color:col(hex), map:ATLAS.tex, emissiveMap:ATLAS.tex, emissive:col(glowHex),
    emissiveIntensity:0, transparent:true, depthWrite:false, roughness:0.55,
    polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-4});
  mat.onBeforeCompile = sh => {
    sh.vertexShader = 'attribute vec4 aUV;\n' + sh.vertexShader.replace('#include <uv_vertex>',
      '#ifdef USE_UV\n\tvUv = uv * aUV.zw + aUV.xy;\n#endif');
  };
  legendMats.push(mat);
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  mesh.frustumCulled = false; mesh.renderOrder = 2;
  list.forEach((k, i) => { const c = cellUV(k.cell); aUV.setXYZW(i, c.u0, c.v0, c.du, c.dv); k.legMesh = mesh; k.legIdx = i; });
  deck.add(mesh);
  return mesh;
}
const LEG_Y = CAP.H - CAP.dish*0.3 + 0.004;
const _q0 = new THREE.Quaternion();
for (const k of KEYS){
  if (k.cell === undefined) continue;
  const size = k.kind === 'm' ? 0.36 : 0.34;
  k.legLocal = new THREE.Matrix4().compose(new V3(0, LEG_Y, 0), _q0, new V3(size, 1, size));
}
legendMesh(KEYS.filter(k => k.cell !== undefined && k.kind === 'a'), SET.board.legA, SET.board.glowA);
legendMesh(KEYS.filter(k => k.cell !== undefined && k.kind === 'm'), SET.board.legM, SET.board.glowM);

const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new V3(), _s = new V3();
function keyMatrix(k, out){
  _p.set(k.x, KEY_BASE - k.press, k.z); _e.set(k.tilt, 0, 0); _q.setFromEuler(_e); _s.set(1, k.sy, 1);
  return out.compose(_p, _q, _s);
}
function writeKey(k){
  if (k.mesh){
    keyMatrix(k, _m); k.mesh.setMatrixAt(k.idx, _m); k.mesh.instanceMatrix.needsUpdate = true;
    if (k.legMesh){ _m2.multiplyMatrices(_m, k.legLocal); k.legMesh.setMatrixAt(k.legIdx, _m2); k.legMesh.instanceMatrix.needsUpdate = true; }
  } else if (k.group){ k.group.position.y = KEY_BASE - k.press; }
}

/* ── resin artisan caps for the seven project keys ─────────── */
const AM = {
  wall: std('#F5EEDF', 0.85), roof: std('#B5432E', 0.7), wood: std('#8A6440', 0.85), dark: std('#2A241D', 0.68),
  glow: new THREE.MeshStandardMaterial({color:col('#FFE7B0'), emissive:col('#FFC060'), emissiveIntensity:1.0, roughness:0.5}),
  glass: new THREE.MeshStandardMaterial({color:col('#9CC4D6'), roughness:0.1, metalness:0.1, transparent:true, opacity:0.55}),
  gold: std('#E0B24A', 0.3, 0.8), steel: std('#B7BABF', 0.28, 0.85), paper: std('#F3EEE1', 0.92), ink: std('#3E5A6E', 0.6),
  planetA: std('#5A7BE0', 0.5), planetB: std('#C3D3F2', 0.6),
  brass: std('#C79A4B', 0.32, 0.75), ribbon: std('#9E3B4A', 0.55), green: std('#53703F', 1), terra: std('#C1663F', 0.86),
  sea: std('#1E6E8C', 0.35),
  glowCool: new THREE.MeshStandardMaterial({color:col('#CDEBF2'), emissive:col('#8FD4E8'), emissiveIntensity:1.2, roughness:0.4})
};
const ARCH = {
  house(o){
    const g = new THREE.Group();
    const body = mb(0.30, 0.16, 0.24, AM.wall); body.position.y = 0.08; g.add(body);
    const roof = mcone(0.225, 0.14, 4, AM.roof); roof.rotation.y = Math.PI/4; roof.position.y = 0.23; g.add(roof);
    const door = mb(0.05, 0.075, 0.012, AM.dark); door.position.set(-0.07, 0.0375, 0.121); g.add(door);
    for (const s of [-1, 1]){ const w = mb(0.05, 0.05, 0.012, AM.glow); w.position.set(s*0.09, 0.09, 0.121); g.add(w); }
    const chim = mb(0.025, 0.09, 0.025, AM.dark); chim.position.set(0.08, 0.24, 0.03); g.add(chim);
    return g;
  },
  vault(o){
    const g = new THREE.Group();
    const body = mb(0.20, 0.13, 0.16, AM.dark); body.position.y = 0.065; g.add(body);
    const door = mc(0.06, 0.06, 0.02, 20, AM.gold); door.rotation.x = Math.PI/2; door.position.set(0, 0.07, 0.085); g.add(door);
    const dial = mc(0.02, 0.02, 0.024, 10, AM.steel); dial.rotation.x = Math.PI/2; dial.position.set(0, 0.07, 0.10); g.add(dial);
    SPIN.push({o:dial, spd:0.6, owner:o});
    return g;
  },
  forge(o){
    const g = new THREE.Group();
    const base = mc(0.10, 0.13, 0.05, 10, AM.dark); base.position.y = 0.025; g.add(base);
    const body = mb(0.16, 0.05, 0.08, AM.steel); body.position.y = 0.075; g.add(body);
    const horn = mcone(0.03, 0.11, 8, AM.steel); horn.rotation.z = Math.PI/2; horn.position.set(0.11, 0.09, 0); g.add(horn);
    const hammer = new THREE.Group();
    const handle = mc(0.008, 0.008, 0.16, 6, AM.wood); handle.position.y = 0.08; hammer.add(handle);
    const head = mb(0.045, 0.03, 0.03, AM.dark); head.position.y = 0.16; hammer.add(head);
    hammer.position.set(-0.05, 0.10, 0.05); hammer.rotation.z = 0.75; g.add(hammer);
    SWAY.push({o:hammer, a:0.14, s:1.3, p:R()*6, base:0.75, owner:o});
    return g;
  },
  orbit(o){
    const g = new THREE.Group();
    const planet = msph(0.085, 16, AM.planetA); planet.position.y = 0.15; g.add(planet);
    const ring = mtor(0.15, 0.008, 32, AM.steel); ring.rotation.x = Math.PI/2 + 0.32; ring.position.y = 0.15; g.add(ring);
    const orbitGrp = new THREE.Group(); orbitGrp.position.y = 0.15;
    const moon = msph(0.022, 10, AM.planetB); moon.position.x = 0.16; orbitGrp.add(moon); g.add(orbitGrp);
    SPIN.push({o:ring, spd:0.35, owner:o}); ORBIT.push({o:orbitGrp, spd:0.85, ph:R()*6, owner:o});
    return g;
  },
  ledger(o){
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++){ const c = mc(0.055, 0.055, 0.02, 16, AM.gold); c.position.y = 0.011 + i*0.021; c.rotation.y = i*0.4; g.add(c); }
    const slipG = new THREE.Group(); slipG.position.set(0.075, 0.09, 0);
    const slip = mb(0.12, 0.005, 0.16, AM.paper); slip.position.x = 0.055; slipG.add(slip);
    const line = mb(0.08, 0.006, 0.006, AM.ink); line.position.set(0.035, 0.005, 0.04); slipG.add(line);
    const line2 = mb(0.06, 0.006, 0.006, AM.ink); line2.position.set(0.025, 0.005, 0.0); slipG.add(line2);
    g.add(slipG); SWAY.push({o:slipG, a:0.07, s:0.9, p:R()*6, base:0.06, owner:o});
    return g;
  },
  blueprint(o){
    const g = new THREE.Group();
    const table = mb(0.20, 0.01, 0.14, AM.wood); table.position.y = 0.05; g.add(table);
    const blue = mb(0.16, 0.006, 0.11, AM.ink); blue.position.y = 0.057; g.add(blue);
    const bld = new THREE.Group(); bld.position.set(0.10, 0.06, -0.02);
    const tower = mb(0.05, 0.14, 0.05, AM.wall); tower.position.y = 0.07; bld.add(tower);
    const roofB = mb(0.056, 0.02, 0.056, AM.roof); roofB.position.y = 0.15; bld.add(roofB);
    g.add(bld); SPIN.push({o:bld, spd:0.3, owner:o});
    return g;
  },
  palette(o){
    const g = new THREE.Group();
    const pal = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.015, 24, 1, false, 0, Math.PI*1.6), AM.wood);
    pal.position.y = 0.03; pal.rotation.y = -0.4; pal.castShadow = true; g.add(pal);
    [0xC6427A, 0xE0A23A, 0x3E9AC0, 0x53703F].forEach((c, i) => {
      const d0 = msph(0.014, 8, new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(), roughness:0.6}));
      const a = -0.6 + i*0.5; d0.position.set(Math.cos(a)*0.075, 0.04, Math.sin(a)*0.075); g.add(d0);
    });
    const dropper = new THREE.Group(); dropper.position.set(0.02, 0.10, -0.05);
    const tube = mc(0.006, 0.006, 0.14, 8, AM.glass); dropper.add(tube);
    const bulb = msph(0.012, 8, AM.dark); bulb.position.y = 0.075; dropper.add(bulb);
    dropper.rotation.z = 0.5; g.add(dropper);
    SWAY.push({o:dropper, a:0.12, s:1.1, p:R()*6, base:0.5, owner:o});
    return g;
  },
  telescope(o){
    const g = new THREE.Group();
    const hub = mc(0.02, 0.02, 0.02, 10, AM.brass); hub.position.y = 0.11; g.add(hub);
    for (let i = 0; i < 3; i++){
      const a = i*Math.PI*2/3, leg = mc(0.008, 0.008, 0.13, 6, AM.wood);
      leg.position.set(Math.cos(a)*0.05, 0.055, Math.sin(a)*0.05); leg.rotation.set(Math.sin(a)*0.35, 0, -Math.cos(a)*0.35); g.add(leg);
    }
    const tube = new THREE.Group(); tube.position.y = 0.13; tube.rotation.z = -0.55;
    const barrel = mc(0.018, 0.024, 0.2, 14, AM.brass); barrel.rotation.z = Math.PI/2; barrel.position.x = 0.1; tube.add(barrel);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.019, 14), AM.glowCool); lens.rotation.y = Math.PI/2; lens.position.x = 0.2; tube.add(lens);
    g.add(tube); SWAY.push({o:tube, a:0.1, s:0.5, p:R()*6, base:-0.55, owner:o});
    return g;
  },
  compass(o){
    const g = new THREE.Group();
    const body = mc(0.1, 0.105, 0.03, 24, AM.brass); body.position.y = 0.015; g.add(body);
    const face = mc(0.088, 0.088, 0.006, 24, AM.paper); face.position.y = 0.033; g.add(face);
    const needle = new THREE.Group(); needle.position.y = 0.04;
    const nN = mcone(0.01, 0.07, 6, AM.ribbon); nN.rotation.x = Math.PI/2; nN.position.z = -0.035; needle.add(nN);
    const nS = mcone(0.01, 0.07, 6, AM.steel); nS.rotation.x = -Math.PI/2; nS.position.z = 0.035; needle.add(nS);
    g.add(needle); SPIN.push({o:needle, spd:0.22, owner:o});
    const scroll = mc(0.014, 0.014, 0.13, 10, AM.paper); scroll.rotation.z = Math.PI/2; scroll.position.set(0.02, 0.014, 0.12); g.add(scroll);
    const band = mc(0.0145, 0.0145, 0.012, 10, AM.ribbon); band.rotation.z = Math.PI/2; band.position.set(0.0, 0.014, 0.12); g.add(band);
    return g;
  },
  loom(o){
    const g = new THREE.Group();
    const top = mb(0.22, 0.014, 0.014, AM.wood); top.position.y = 0.2; g.add(top);
    const bot = mb(0.22, 0.014, 0.014, AM.wood); bot.position.y = 0.02; g.add(bot);
    for (const s of [-1, 1]){ const side = mb(0.014, 0.19, 0.014, AM.wood); side.position.set(s*0.1, 0.11, 0); g.add(side); }
    for (let i = 0; i < 7; i++){ const th = mc(0.0025, 0.0025, 0.17, 5, AM.paper); th.position.set(-0.08 + i*0.0267, 0.11, 0); g.add(th); }
    const shuttle = mb(0.075, 0.018, 0.018, AM.dark); shuttle.position.set(0, 0.11, 0.02); g.add(shuttle);
    SWAY.push({o:shuttle, a:0.06, s:1.6, p:R()*6, base:0, owner:o});
    return g;
  },
  ship(o){
    const g = new THREE.Group(), rock = new THREE.Group(); g.add(rock);
    const glass = mc(0.05, 0.05, 0.22, 16, AM.glass); glass.rotation.z = Math.PI/2; glass.position.y = 0.06; glass.castShadow = false; rock.add(glass);
    const cork = mc(0.02, 0.022, 0.03, 10, AM.wood); cork.rotation.z = Math.PI/2; cork.position.set(0.125, 0.06, 0); rock.add(cork);
    const sea = mb(0.19, 0.012, 0.07, AM.sea); sea.position.y = 0.022; rock.add(sea);
    const hull = mb(0.07, 0.014, 0.024, AM.wood); hull.position.y = 0.035; rock.add(hull);
    const mast = mc(0.003, 0.003, 0.06, 6, AM.wood); mast.position.y = 0.066; rock.add(mast);
    const sail = mb(0.035, 0.04, 0.002, AM.paper); sail.position.set(0.012, 0.07, 0); rock.add(sail);
    SWAY.push({o:rock, a:0.05, s:0.9, p:R()*6, base:0, owner:o});
    return g;
  },
  sapling(o){
    const g = new THREE.Group();
    const pot = mc(0.05, 0.038, 0.06, 12, AM.terra); pot.position.y = 0.03; g.add(pot);
    const trunk = mc(0.006, 0.008, 0.1, 6, AM.wood); trunk.position.y = 0.1; g.add(trunk);
    const stake = mc(0.004, 0.004, 0.13, 5, AM.wood); stake.position.set(0.025, 0.115, 0); g.add(stake);
    const foliage = new THREE.Group();
    for (let i = 0; i < 5; i++){ const b = msph(0.026 + R()*0.01, 8, AM.green); b.position.set((R() - 0.5)*0.06, 0.17 + R()*0.03, (R() - 0.5)*0.06); foliage.add(b); }
    g.add(foliage); SWAY.push({o:foliage, a:0.05, s:1.1, p:R()*6, base:0, owner:o});
    return g;
  },
  gears(o){
    const g = new THREE.Group();
    const gear = (r, teeth, m) => {
      const gg = new THREE.Group(); gg.add(mc(r, r, 0.03, 20, m));
      for (let i = 0; i < teeth; i++){ const a = i*Math.PI*2/teeth, t = mb(0.018, 0.03, 0.02, m); t.position.set(Math.cos(a)*(r + 0.005), 0, Math.sin(a)*(r + 0.005)); t.rotation.y = -a; gg.add(t); }
      return gg;
    };
    const p1 = new THREE.Group(); p1.rotation.x = Math.PI/2; p1.position.set(-0.05, 0.1, 0);
    const g1 = gear(0.075, 10, AM.steel); p1.add(g1); g.add(p1);
    const p2 = new THREE.Group(); p2.rotation.x = Math.PI/2; p2.position.set(0.075, 0.1, 0);
    const g2 = gear(0.05, 7, AM.brass); p2.add(g2); g.add(p2);
    SPIN.push({o:g1, spd:0.5, owner:o}); SPIN.push({o:g2, spd:-0.75, owner:o});
    return g;
  },
  scales(o){
    const g = new THREE.Group();
    const base = mc(0.05, 0.06, 0.02, 14, AM.dark); base.position.y = 0.01; g.add(base);
    const pole = mc(0.008, 0.008, 0.19, 8, AM.brass); pole.position.y = 0.1; g.add(pole);
    const beam = new THREE.Group(); beam.position.y = 0.195;
    beam.add(mb(0.22, 0.012, 0.012, AM.brass));
    for (const s of [-1, 1]){
      const chain = mc(0.003, 0.003, 0.06, 5, AM.steel); chain.position.set(s*0.1, -0.03, 0); beam.add(chain);
      const pan = mc(0.035, 0.035, 0.006, 16, AM.brass); pan.position.set(s*0.1, -0.062, 0); beam.add(pan);
    }
    g.add(beam); SWAY.push({o:beam, a:0.09, s:0.9, p:R()*6, base:0, owner:o});
    return g;
  },
  lantern(o){
    const g = new THREE.Group();
    const hook = mtor(0.012, 0.003, 10, AM.dark); hook.position.y = 0.28; g.add(hook);
    const swing = new THREE.Group(); swing.position.y = 0.27;
    const chain = mc(0.003, 0.003, 0.05, 5, AM.dark); chain.position.y = -0.025; swing.add(chain);
    const cap = mcone(0.05, 0.03, 6, AM.dark); cap.position.y = -0.055; swing.add(cap);
    const body = mc(0.045, 0.05, 0.11, 6, AM.glow); body.position.y = -0.12; swing.add(body);
    const base = mcone(0.05, 0.025, 6, AM.dark); base.rotation.x = Math.PI; base.position.y = -0.182; swing.add(base);
    g.add(swing); SWAY.push({o:swing, a:0.06, s:0.8, p:R()*6, base:0, owner:o});
    return g;
  }
};
const productKeys = [];
for (const k of KEYS){
  if (!k.prod || k.removed) continue;
  const g = new THREE.Group();
  g.position.set(k.x, KEY_BASE, k.z); g.rotation.x = k.tilt;
  deck.add(g); k.group = g;
  const tint = col(k.prod.color);
  const base = new THREE.Mesh(chamferBox(0.76, 0.06, 0.76, 0.1, 0.02),
    new THREE.MeshStandardMaterial({color:tint, emissive:tint, emissiveIntensity:0.3, roughness:0.4}));
  base.position.y = 0.03; base.castShadow = true; g.add(base); k.baseMat = base.material;
  const mini = ARCH[k.prod.arche](k); mini.scale.setScalar(1.08); mini.position.y = 0.06; g.add(mini); k.mini = mini;
  const shellMat = new THREE.MeshPhysicalMaterial({color:tint.clone().lerp(new THREE.Color(1,1,1), 0.55), emissive:tint,
    emissiveIntensity:0.05, roughness:0.06, metalness:0, clearcoat:1, clearcoatRoughness:0.04, transparent:true,
    opacity:0.34, depthWrite:false, side:THREE.DoubleSide, envMapIntensity:1.5});
  const shell = new THREE.Mesh(capGeometry(k.w), shellMat);
  shell.scale.y = k.sy; shell.renderOrder = 3; shell.userData.key = k;
  g.add(shell); k.shellMat = shellMat;
  hoverables.push(shell); productKeys.push(k);
}
for (const k of KEYS) if (!k.removed) writeKey(k);
const _white = new THREE.Color(1, 1, 1);
function recolor(k){
  const tint = col(k.prod.color);
  k.baseMat.color.copy(tint); k.baseMat.emissive.copy(tint);
  k.shellMat.color.copy(tint).lerp(_white, 0.55); k.shellMat.emissive.copy(tint);
}

const rowAt = z => { for (let r = 0; r < 6; r++) if (z < STRIP[r+1]) return r; return 5; };
const groundTop = r => PLATE_TOP + LIFT[r];

const lanePts = [new V3(LX(LANE_C[0]), 0, STRIP[0] + 0.02)];
for (let r = 0; r < 6; r++) lanePts.push(new V3(LX(LANE_C[r]), 0, LZ(ROWZ[r])));
lanePts.push(new V3(LX(LANE_C[5]), 0, STRIP[6] - 0.02));
const lane = new THREE.CatmullRomCurve3(lanePts, false, 'catmullrom', 0.5);
const LANE_SAMPLES = [];
for (let i = 0; i <= 240; i++){ const p = lane.getPointAt(i/240); LANE_SAMPLES.push({x:p.x, z:p.z}); }
function laneXAt(z){ let best = LANE_SAMPLES[0].x, bd = 1e9; for (const s of LANE_SAMPLES){ const d = Math.abs(s.z - z); if (d < bd){ bd = d; best = s.x; } } return best; }

const CAFES = [], LAMPS = [], LAUNDRY = [], BELLS = [];
const villageDyn = new THREE.Group(); deck.add(villageDyn);

