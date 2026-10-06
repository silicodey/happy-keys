/* ════════════════════════════════════════════════════════════
   SANTORINI LANE — whitewash, blue domes, cafés and laundry
   ════════════════════════════════════════════════════════════ */
const LAUNDRY_VS = `
attribute vec3 aCol;
attribute float aHang;
attribute float aSeed;
uniform float uTime;
varying vec3 vC;
varying float vS;
void main(){
  vec3 p = position;
  float w = sin(p.x * 18.0 + uTime * 2.4 + aSeed) * 0.6 + sin(p.x * 41.0 - uTime * 3.3 + aSeed * 1.7) * 0.3;
  p.z += w * 0.022 * aHang * aHang;
  vS = 0.82 + 0.18 * w;
  vC = aCol;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const LAUNDRY_FS = `
uniform vec3 uTint;
varying vec3 vC;
varying float vS;
void main(){
  gl_FragColor = vec4(vC * vS * uTint, 1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
function streetSantorini(){
const MAT = {
  wall:std('#F7F3EC', 0.92), wallB:std('#EEE6D9', 0.93), dome:std('#2C6DAA', 0.38, 0.05), door:std('#2A6496', 0.55),
  shutter:std('#3A85BC', 0.55), ground:std('#E8DDC9', 0.95), step:std('#FBF9F4', 0.88), terra:std('#C46A45', 0.85),
  wood:std('#7E5B3C', 0.85), iron:std('#2A2723', 0.6, 0.4), cyp:std('#2F4A36', 1), leaf:std('#4F6D3E', 1),
  bloom:std('#D2447F', 0.8), white:std('#FFFFFF', 0.8), canvasW:std('#F4EEE2', 0.9, 0, {side:THREE.DoubleSide}),
  canvasB:std('#3C7FB4', 0.85, 0, {side:THREE.DoubleSide}), canvasT:std('#C9673F', 0.85, 0, {side:THREE.DoubleSide}),
  rope:std('#3A332C', 0.9),
  win:new THREE.MeshStandardMaterial({color:col('#253041'), emissive:col('#FFB25E'), emissiveIntensity:0, roughness:0.35})
};
function vHouse(w, d, h, o){
  const g = new THREE.Group();
  const body = mb(w, h, d, o.alt ? MAT.wallB : MAT.wall); body.position.y = h/2; g.add(body);
  if (o.stack){
    const w2 = w*0.6, d2 = d*0.58, h2 = h*0.42, sx = (o.sx || 0)*w*0.16;
    const up = mb(w2, h2, d2, MAT.wall); up.position.set(sx, h + h2/2, -d*0.16); g.add(up);
    const pane = mb(0.05, 0.06, 0.008, MAT.win); pane.position.set(sx, h + h2*0.55, -d*0.16 + d2/2 + 0.004); g.add(pane);
    const rail = mb(w*0.95, 0.03, 0.012, MAT.wall); rail.position.set(0, h + 0.015, d/2 - 0.006); g.add(rail);
  }
  if (o.dome){
    const r = Math.min(w, d)*0.36;
    const drum = mc(r*1.04, r*1.04, 0.035, 18, MAT.wall); drum.position.y = h + 0.0175; g.add(drum);
    const dm = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI*2, 0, Math.PI/2), MAT.dome);
    dm.position.y = h + 0.035; dm.castShadow = true; g.add(dm);
    const cross = mb(0.008, 0.05, 0.008, MAT.white); cross.position.y = h + 0.035 + r + 0.025; g.add(cross);
    const bar = mb(0.03, 0.008, 0.008, MAT.white); bar.position.y = h + 0.035 + r + 0.035; g.add(bar);
  } else if (o.barrel){
    const br = new THREE.Mesh(new THREE.CylinderGeometry(d*0.48, d*0.48, w, 16, 1, false, 0, Math.PI), o.alt ? MAT.wallB : MAT.wall);
    br.rotation.z = Math.PI/2; br.scale.x = 0.55; br.position.y = h; br.castShadow = br.receiveShadow = true; g.add(br);
  } else {
    const par = mb(w + 0.016, 0.022, d + 0.016, MAT.wall); par.position.y = h + 0.011; g.add(par);
  }
  const door = mb(0.064, 0.12, 0.01, MAT.door); door.position.set(-w*0.22, 0.06, d/2 + 0.005); g.add(door);
  const nWin = o.windows === undefined ? 1 : o.windows;
  for (let i = 0; i < nWin; i++){
    const wx = w*0.08 + i*0.11; if (wx > w/2 - 0.05) break;
    const pane = mb(0.054, 0.064, 0.008, MAT.win); pane.position.set(wx, h*0.58, d/2 + 0.004); g.add(pane);
    for (const s of [-1, 1]){ const sh = mb(0.024, 0.068, 0.006, MAT.shutter); sh.position.set(wx + s*0.04, h*0.58, d/2 + 0.006); g.add(sh); }
  }
  if (o.stairs){
    for (let i = 0; i < 5; i++){
      const st = mb(0.07, 0.02, 0.06, MAT.wall);
      st.position.set(w/2 + 0.035, 0.01 + i*(h/5), d/2 - 0.05 - i*((d - 0.1)/5)); g.add(st);
    }
  }
  if (o.bloom){
    for (let i = 0; i < 9; i++){
      const b = msph(rr(0.018, 0.034), 6, R() < 0.2 ? MAT.leaf : MAT.bloom);
      b.position.set(w/2 - rr(0, 0.12), rr(h*0.35, h + 0.02), d/2 + rr(-0.02, 0.025)); g.add(b);
    }
  }
  return g;
}
function vCafe(canopy){
  const g = new THREE.Group();
  const leg = mc(0.006, 0.01, 0.07, 6, MAT.iron); leg.position.y = 0.035; g.add(leg);
  const top = mc(0.042, 0.042, 0.006, 14, MAT.white); top.position.y = 0.072; g.add(top);
  for (const a of [0.2, Math.PI + 0.2]){
    const ch = new THREE.Group();
    const seat = mb(0.04, 0.006, 0.04, MAT.canvasB); seat.position.y = 0.04; ch.add(seat);
    const back = mb(0.04, 0.045, 0.006, MAT.canvasB); back.position.set(0, 0.062, -0.018); ch.add(back);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const l = mb(0.005, 0.04, 0.005, MAT.iron); l.position.set(sx*0.016, 0.02, sz*0.016); ch.add(l); }
    ch.position.set(Math.cos(a)*0.075, 0, Math.sin(a)*0.075); ch.rotation.y = -a - Math.PI/2; g.add(ch);
  }
  const pole = mc(0.004, 0.004, 0.26, 6, MAT.wood); pole.position.y = 0.13; g.add(pole);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.06, 12, 1, true), canopy);
  cone.position.y = 0.27; cone.castShadow = true; g.add(cone);
  return g;
}
function vCypress(h){
  const g = new THREE.Group();
  const t = mc(0.008, 0.01, h*0.2, 5, MAT.wood); t.position.y = h*0.1; g.add(t);
  const c = mcone(h*0.15, h*0.85, 9, MAT.cyp); c.position.y = h*0.2 + h*0.42; g.add(c);
  return g;
}
function vPlanter(){
  const g = new THREE.Group();
  const p = mc(0.03, 0.022, 0.05, 9, MAT.terra); p.position.y = 0.025; g.add(p);
  for (let i = 0; i < 5; i++){ const b = msph(rr(0.016, 0.026), 6, R() < 0.5 ? MAT.bloom : MAT.leaf); b.position.set(rr(-0.025, 0.025), rr(0.05, 0.085), rr(-0.025, 0.025)); g.add(b); }
  return g;
}
function vChapel(dyn){
  const g = new THREE.Group();
  const body = mb(0.62, 0.36, 0.46, MAT.wall); body.position.y = 0.18; g.add(body);
  const drum = mc(0.18, 0.18, 0.04, 20, MAT.wall); drum.position.y = 0.38; g.add(drum);
  const dm = new THREE.Mesh(new THREE.SphereGeometry(0.175, 24, 12, 0, Math.PI*2, 0, Math.PI/2), MAT.dome);
  dm.position.y = 0.4; dm.castShadow = true; g.add(dm);
  const cr = mb(0.01, 0.07, 0.01, MAT.white); cr.position.y = 0.61; g.add(cr);
  const crb = mb(0.04, 0.01, 0.01, MAT.white); crb.position.y = 0.625; g.add(crb);
  const tower = mb(0.34, 0.74, 0.07, MAT.wall); tower.position.set(0.12, 0.37, 0.265); g.add(tower);
  for (const x of [0.04, 0.2]){ const niche = mb(0.06, 0.1, 0.02, MAT.iron); niche.position.set(x, 0.6, 0.29); g.add(niche); }
  const tcr = mb(0.01, 0.06, 0.01, MAT.white); tcr.position.set(0.12, 0.77, 0.265); g.add(tcr);
  const door = mb(0.08, 0.15, 0.01, MAT.door); door.position.set(-0.16, 0.075, 0.235); g.add(door);
  for (const x of [0.04, 0.2]){
    const b = new THREE.Group(); b.position.set(x, 0.645, 0.31);
    const bell = mcone(0.024, 0.04, 10, AM.gold); bell.position.y = -0.03; b.add(bell);
    dyn.add(b); BELLS.push(b);
  }
  return g;
}

const villageStatic = new THREE.Group();
(function buildVillage(){
  for (let r = 0; r < 6; r++){
    const v = VOID[r], x0 = LX(v.L), x1 = LX(v.R), z0 = STRIP[r], z1 = STRIP[r+1], h = LIFT[r];
    const m = mb(x1 - x0, h, z1 - z0, MAT.ground); m.position.set((x0 + x1)/2, PLATE_TOP + h/2, (z0 + z1)/2); m.castShadow = false;
    villageStatic.add(m);
    if (r < 5){
      const zx = STRIP[r+1], lx = laneXAt(zx);
      const nose = mb(1.0, 0.012, 0.045, MAT.step); nose.position.set(lx, groundTop(r) + 0.006, zx - 0.0225); villageStatic.add(nose);
    }
  }
  function building(r, side, cx, zc, len, dep){
    const gy = groundTop(r), rowF = (5 - r)/5, hmin = lerp(0.3, 0.44, rowF), h = rr(hmin, hmin + 0.24);
    const o = {dome:R() < 0.18, stack:R() < 0.38, sx:R() < 0.5 ? -1 : 1, stairs:R() < 0.22, bloom:R() < 0.3,
      windows:1 + ((R()*2)|0), alt:R() < 0.3};
    if (o.dome) o.stack = false;
    if (!o.dome && !o.stack) o.barrel = R() < 0.3;
    const hs = vHouse(len, dep, h, o);
    hs.position.set(cx, gy, zc); hs.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2;
    villageStatic.add(hs);
  }
  function inner(r, side, cx, zc, len, w){
    const gy = groundTop(r), roll = R();
    if (r >= 3 && roll < 0.5){
      const c = vCafe(R() < 0.33 ? MAT.canvasW : (R() < 0.5 ? MAT.canvasB : MAT.canvasT));
      c.position.set(cx, gy, zc); c.rotation.y = R()*6; villageStatic.add(c);
      CAFES.push({x:cx, y:gy, z:zc});
    } else if (roll < 0.7){
      const hs = vHouse(len*0.9, Math.max(0.16, w*0.9), rr(0.16, 0.24), {windows:1, bloom:R() < 0.4});
      hs.position.set(cx, gy, zc); hs.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2; villageStatic.add(hs);
    } else if (roll < 0.86){
      const c = vCypress(rr(0.34, 0.5)); c.position.set(cx, gy, zc); villageStatic.add(c);
    } else {
      const p = vPlanter(); p.position.set(cx, gy, zc); villageStatic.add(p);
    }
  }
  function fillBand(r, side, xWall, edgeOverride){
    const z0 = STRIP[r] + 0.05, z1 = STRIP[r+1] - 0.05;
    let z = z0;
    while (z < z1 - 0.22){
      const len = Math.min(rr(0.34, 0.5), z1 - z), zc = z + len/2;
      const edge = edgeOverride !== undefined ? edgeOverride : laneXAt(zc) + side*0.5;
      const bw = side < 0 ? edge - xWall : xWall - edge;
      if (bw > 0.22){
        const dep = Math.min(bw, rr(0.36, 0.6));
        building(r, side, side < 0 ? xWall + dep/2 : xWall - dep/2, zc, len, dep);
        const rem = bw - dep - 0.04;
        if (rem > 0.2) inner(r, side, side < 0 ? xWall + dep + 0.04 + rem/2 : xWall - dep - 0.04 - rem/2, zc, len, rem);
      }
      z += len + 0.03;
    }
  }
  for (let r = 0; r < 6; r++){
    const v = VOID[r];
    fillBand(r, -1, LX(v.L) + 0.04);
    if (r === 0){
      /* the chapel at the top of the climb, bells facing the lane */
      const edge = laneXAt((STRIP[0] + STRIP[1])/2) + 0.5, xr = LX(v.R) - 0.04;
      const chapelDyn = new THREE.Group(); villageDyn.add(chapelDyn);
      const ch = vChapel(chapelDyn);
      ch.position.set(edge + 0.36, groundTop(0), (STRIP[0] + STRIP[1])/2); ch.rotation.y = -Math.PI/2;
      villageStatic.add(ch);
      chapelDyn.position.copy(ch.position); chapelDyn.rotation.copy(ch.rotation);
      fillBand(0, 1, xr, edge + 0.8);
    } else fillBand(r, 1, LX(v.R) - 0.04);
  }

  /* lamps — each with its own material so they come on one by one */
  [0.1, 0.27, 0.44, 0.61, 0.78, 0.93].forEach((t, i) => {
    const p = lane.getPointAt(t), side = i % 2 ? 1 : -1, x = p.x + side*0.42, gy = groundTop(rowAt(p.z));
    const head = new THREE.MeshStandardMaterial({color:col('#FFE7C2'), emissive:col('#FFB25E'), emissiveIntensity:0, roughness:0.4});
    const g = new THREE.Group();
    const post = mc(0.007, 0.01, 0.3, 6, MAT.iron); post.position.y = 0.15; g.add(post);
    const arm = mb(0.05, 0.006, 0.006, MAT.iron); arm.position.set(-side*0.022, 0.295, 0); g.add(arm);
    const lamp = mb(0.026, 0.034, 0.026, head); lamp.position.set(-side*0.044, 0.27, 0); g.add(lamp);
    g.position.set(x, gy, p.z); villageStatic.add(g);
    LAMPS.push({mat:head, th:0.47 + i*0.012, pos:new V3(x - side*0.044, gy + 0.27, p.z)});
  });

  /* cobbled lane */
  const N = 150, slab = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.016, 0.034),
    new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.92}), N);
  slab.frustumCulled = false; slab.receiveShadow = true;
  const d = new THREE.Object3D(), tones = ['#D9C9AE','#CDBB9C','#E2D4BC','#D3C3A6'].map(col);
  for (let i = 0; i < N; i++){
    const t = i/(N - 1), p = lane.getPointAt(t), tg = lane.getTangentAt(t);
    d.position.set(p.x, groundTop(rowAt(p.z)) + 0.008, p.z); d.rotation.set(0, Math.atan2(tg.x, tg.z), 0);
    d.scale.set(0.86 + 0.08*Math.sin(t*9), 1, 1); d.updateMatrix();
    slab.setMatrixAt(i, d.matrix); slab.setColorAt(i, tones[(R()*tones.length)|0]);
  }
  deck.add(slab);

  /* laundry ropes across the lane */
  [0.19, 0.5, 0.72].forEach(t => {
    const p = lane.getPointAt(t), y = groundTop(rowAt(p.z)) + 0.43;
    const rope = mb(1.06, 0.004, 0.004, MAT.rope); rope.position.set(p.x, y, p.z); rope.castShadow = false; villageStatic.add(rope);
    LAUNDRY.push({x0:p.x - 0.5, x1:p.x + 0.5, y, z:p.z});
  });
})();
const merged = mergeByMaterial(villageStatic);
deck.add(merged);

const laundryMat = new THREE.ShaderMaterial({uniforms:{uTime:{value:0}, uTint:{value:new THREE.Color(1,1,1)}},
  vertexShader:LAUNDRY_VS, fragmentShader:LAUNDRY_FS, side:THREE.DoubleSide});
(function laundry(){
  const pos = [], colr = [], hang = [], seed = [], idx = [];
  const palette = ['#FBF7F0','#A9CFE2','#F1C4AC','#EDE6D6','#BFDCE3','#E7A9C2'].map(col);
  let base = 0;
  for (const L of LAUNDRY){
    let x = L.x0 + 0.05;
    while (x < L.x1 - 0.06){
      const w = rr(0.045, 0.085), h = rr(0.06, 0.1), c = palette[(R()*palette.length)|0], s = R()*20;
      const g = new THREE.PlaneGeometry(w, h, 3, 3), P = g.attributes.position, U = g.attributes.uv;
      for (let i = 0; i < P.count; i++){
        pos.push(x + w/2 + P.getX(i), L.y - h/2 - 0.003 + P.getY(i), L.z);
        colr.push(c.r, c.g, c.b); hang.push(1 - U.getY(i)); seed.push(s);
      }
      for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base);
      base += P.count; x += w + 0.022;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aCol', new THREE.Float32BufferAttribute(colr, 3));
  geo.setAttribute('aHang', new THREE.Float32BufferAttribute(hang, 1));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  geo.setIndex(idx); geo.computeBoundingSphere();
  const m = new THREE.Mesh(geo, laundryMat); m.frustumCulled = false; deck.add(m);
})();

  return {
    merged,
    applyTOD(P){
      MAT.win.emissiveIntensity = lampOn * 2.3;
      _c.copy(WHITE).lerp(P.hs, 0.4).multiplyScalar(lerp(1, 0.32, nightF));
      laundryMat.uniforms.uTint.value.setRGB(_c.r + 0.14*lampOn, _c.g + 0.09*lampOn, _c.b + 0.03*lampOn);
    },
    animate(){ laundryMat.uniforms.uTime.value = T; }
  };
}
const _c = new THREE.Color(), WHITE = new THREE.Color(1, 1, 1);
