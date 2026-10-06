/* ════════════════════════════════════════════════════════════
   LOFOTEN — a fishing quay in a fjord, red cabins, the northern lights
   ════════════════════════════════════════════════════════════ */
const AURORA_VS = `
uniform float uTime;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  p.z += sin(p.x * 0.0021 + uTime * 0.07) * 140.0 + sin(p.x * 0.0053 - uTime * 0.05) * 60.0;
  p.x += sin(p.y * 0.004 + uTime * 0.1) * 20.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const AURORA_FS = `
uniform float uTime;
uniform float uOn;
uniform float uSeed;
varying vec2 vUv;
float h1(float n){ return fract(sin(n) * 43758.5453); }
float n1(float x){ float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
void main(){
  float x = vUv.x * 60.0 + uSeed * 13.0;
  float y = vUv.y;
  float rays = n1(x * 1.7 + uTime * 0.35) * 0.65 + n1(x * 5.3 - uTime * 0.8) * 0.35;
  rays = pow(rays, 1.6);
  float curtain = smoothstep(0.0, 0.06, y) * pow(1.0 - y, 2.2);
  float hem = exp(-y * 9.0) * 0.8;
  float ends = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
  float band = 0.55 + 0.45 * n1(vUv.x * 6.0 + uTime * 0.05 + uSeed * 7.0);
  vec3 c = mix(vec3(0.18, 1.0, 0.55), vec3(0.1, 0.8, 0.75), n1(x * 0.3 + uSeed));
  c = mix(c, vec3(0.65, 0.25, 0.85), smoothstep(0.45, 0.95, y));
  float a = (curtain * rays + hem * rays * 0.6) * ends * band * uOn;
  gl_FragColor = vec4(c * a * 1.6, a);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
const LF = {LW:-4.5};
function lofotenMats(){
  if (LF.m) return LF.m;
  LF.m = {
    red: std('#9E2A22', 0.85), ochre: std('#C58B2C', 0.85), white: std('#E8E4DA', 0.85), trim: std('#F2EFE8', 0.8),
    roofD: std('#2C3034', 0.8), sod: std('#5C6B3A', 1), snow: std('#EEF2F6', 0.9), rock: std('#5A5E62', 0.95),
    wood: std('#6E6256', 0.9), woodD: std('#4A4038', 0.9), iron: std('#1E2024', 0.6, 0.4), fish: std('#9C8F7A', 0.85),
    spruce: std('#24382C', 0.95), crateB: std('#2E5C8A', 0.8), crateO: std('#D0642A', 0.8), ground: std('#C9D0D6', 0.95),
    step: std('#A7AFB6', 0.92), door: std('#2A2420', 0.7), buoy: std('#C8352C', 0.6),
    win: new THREE.MeshStandardMaterial({color:col('#232A33'), emissive:col('#FFBE73'), emissiveIntensity:0, roughness:0.35}),
    glass: new THREE.MeshStandardMaterial({color:col('#F4E6CC'), emissive:col('#FFD08A'), emissiveIntensity:0, roughness:0.4})
  };
  return LF.m;
}
/* the channel of the fjord: half width at a given depth */
function fjordW(z){
  if (z > 24) return -1;
  const w = z > -40 ? 58 : 58 + (-40 - z)*0.34;
  return w*smooth(-1300, -1020, z);   /* the fjord closes against a wall of peaks far up */
}
function lofotenH(x, z){
  const W = fjordW(z), dEdge = Math.abs(x) - W;
  const shore = LF.LW + 3 + 2.2*fbm(x*0.05, z*0.05);
  if (dEdge < 0) return lerp(LF.LW - 14, shore - 1, smooth(-26, 0, dEdge));
  let r = 0, a = 1, f = 0.0042;
  for (let i = 0; i < 4; i++){ const n = 1 - Math.abs(vnoise(x*f + 11.3, z*f - 4.7)); r += a*n*n; a *= 0.5; f *= 2.1; }
  const behind = z > 24 ? 0.18 : 1;
  const A = (30 + 560*smooth(30, 420, dEdge))*behind;
  return shore + r*A*smooth(0, 70, dEdge);
}
function rorbu(m, w, d, h, o){
  /* a fisherman's cabin: board walls, white corners and frames, a steep roof that holds the snow */
  const g = new THREE.Group(), body = o.body || m.red, front = d/2 + 0.003;
  const b = mb(w, h, d, body); b.position.y = h/2; g.add(b);
  for (const sx of [-1, 1]){ const c = mb(w*0.06, h, w*0.06, m.trim); c.position.set(sx*(w/2 - w*0.025), h/2, front - w*0.02); g.add(c); }
  const nw = w > 0.4 ? 2 : 1;
  for (let i = 0; i < nw; i++){
    const x = nw === 1 ? -w*0.2 : -w*0.25 + i*w*0.5, ww = w*0.16, wh = h*0.3;
    const fr = mb(ww*1.3, wh*1.3, 0.006, m.trim); fr.position.set(x, h*0.58, front); g.add(fr);
    const pane = mb(ww, wh, 0.006, m.win); pane.position.set(x, h*0.58, front + 0.003); g.add(pane);
  }
  const door = mb(w*0.16, h*0.62, 0.006, m.door); door.position.set(nw === 1 ? w*0.22 : 0, h*0.31, front); g.add(door);
  gableRoof(g, w, d, h, o.pitch || 0.62, o.roof || m.roofD, body, o.roof === m.snow ? m.snow : m.roofD);
  return g;
}
function hjell(m, len, hgt, fishN){
  /* a drying rack: leaning poles, a top rail, and pairs of stockfish hanging from it */
  const g = new THREE.Group(), n = Math.max(2, Math.round(len/(hgt*0.9)));
  for (let i = 0; i <= n; i++){
    const x = -len/2 + len*i/n;
    for (const s of [-1, 1]){ const p = mb(hgt*0.06, hgt*1.08, hgt*0.06, m.wood); p.position.set(x, hgt*0.5, s*hgt*0.14); p.rotation.x = s*0.28; g.add(p); }
  }
  for (const y of [hgt, hgt*0.62]){ const r = mb(len + hgt*0.1, hgt*0.05, hgt*0.05, m.woodD); r.position.y = y; g.add(r); }
  for (let i = 0; i < fishN; i++){
    const x = -len/2 + hgt*0.08 + (len - hgt*0.16)*(i + 0.5)/fishN, lower = i % 3 === 1;
    for (const s of [-1, 1]){
      const f = mb(hgt*0.05, hgt*0.3, hgt*0.025, m.fish); f.position.set(x + s*hgt*0.02, (lower ? hgt*0.62 : hgt) - hgt*0.17, s*hgt*0.025); g.add(f);
    }
  }
  return g;
}
function spruce(m, h){
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++){
    const r = h*(0.3 - i*0.07), c = mcone(r, h*0.42, 8, m.spruce); c.position.y = h*(0.28 + i*0.24); g.add(c);
    const s = mcone(r*0.55, h*0.14, 8, m.snow); s.position.y = h*(0.44 + i*0.24); g.add(s);
  }
  return g;
}

/* ── the fjord ──────────────────────────────────────────── */
function worldLofoten(){
  const m = lofotenMats(), LW = LF.LW;
  const seaU = {uTime:{value:0}, uTop:skyU.uTop, uHor:skyU.uHor, uSunCol:skyU.uSunCol, uSunDir:skyU.uSunDir,
    uMoonDir:skyU.uMoonDir, uSunVis:skyU.uSunVis, uNight:skyU.uNight, uSea:{value:new THREE.Color()}};
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.ShaderMaterial({uniforms:seaU, vertexShader:SEA_VS, fragmentShader:SEA_FS, fog:false}));
  sea.geometry.rotateX(-Math.PI/2); sea.position.y = LW; sea.frustumCulled = false; scene.add(sea);

  /* granite peaks straight out of the water, snow above the shoulders */
  const terrain = (function(){
    const g = new THREE.PlaneGeometry(4200, 3400, MOBILE ? 170 : 240, MOBILE ? 140 : 200);
    g.rotateX(-Math.PI/2); g.translate(0, 0, -1000);
    const p = g.attributes.position, c = new Float32Array(p.count*3), tmp = new THREE.Color();
    const sea0 = col('#1C2630'), shore = col('#4A4842'), moss = col('#4E5440'), rock = col('#3C4046'), rockL = col('#5B5F65'), snow = col('#E6ECF2');
    for (let i = 0; i < p.count; i++){
      const x = p.getX(i), z = p.getZ(i), y = lofotenH(x, z);
      p.setY(i, y);
      const n = vnoise(x*0.03, z*0.03), line = 95 + n*45;
      if (y < LW) tmp.copy(sea0);
      else if (y < LW + 6) tmp.copy(shore).lerp(moss, smooth(LW + 2, LW + 6, y));
      else tmp.copy(rock).lerp(rockL, n*0.5 + 0.5).lerp(moss, (1 - smooth(10, 40, y))*0.6);
      if (y > line) tmp.lerp(snow, smooth(line, line + 30, y)*0.95);
      c[i*3] = tmp.r; c[i*3+1] = tmp.g; c[i*3+2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.95, flatShading:true}));
    mesh.receiveShadow = false; scene.add(mesh); return mesh;
  })();

  /* the village: cabins along both shores, most of them red, windows lit through the long evening */
  const d = new THREE.Object3D(), warm = [], lamps = [];
  (function village(){
    const N = MOBILE ? 140 : 220, bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.85}), N);
    const roofGeo = new THREE.CylinderGeometry(0.75, 0.75, 1, 3); roofGeo.rotateZ(Math.PI/2); roofGeo.rotateX(Math.PI/2);
    const roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.9}), N);
    const stilts = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color:col('#3E352E'), roughness:0.9}), N);
    bodies.frustumCulled = roofs.frustumCulled = stilts.frustumCulled = false;
    const tones = [['#9E2A22', 0.66], ['#B0342A', 0.1], ['#C58B2C', 0.12], ['#E8E4DA', 0.12]].map(([h, p]) => [col(h), p]);
    const roofT = [col('#EEF2F6'), col('#2C3034'), col('#5C6B3A')];
    let n = 0;
    while (n < N){
      const z = rr(30, -420), W = fjordW(z), side = R() < 0.5 ? -1 : 1;
      if (W < 0) continue;
      const x = side*(W + rr(-6, 22)), yG = Math.max(lofotenH(x, z), LW + 0.6);
      if (yG > LW + 14) continue;
      if (Math.abs(x) < 26 && z > -20) continue;
      const w = rr(6, 10), dp = rr(5, 7), h = rr(4.5, 6.5), ry = side < 0 ? Math.PI/2 : -Math.PI/2;
      let pick = R(), tone = tones[0][0]; for (const [t, p] of tones){ if ((pick -= p) < 0){ tone = t; break; } }
      d.rotation.set(0, ry + rr(-0.2, 0.2), 0);
      d.position.set(x, yG + h/2, z); d.scale.set(w, h, dp); d.updateMatrix(); bodies.setMatrixAt(n, d.matrix); bodies.setColorAt(n, tone);
      d.position.set(x, yG + h + dp*0.22, z); d.scale.set(w*1.06, dp*0.5, dp*1.12); d.updateMatrix(); roofs.setMatrixAt(n, d.matrix); roofs.setColorAt(n, roofT[R() < 0.55 ? 0 : (R() < 0.6 ? 1 : 2)]);
      const sh = yG - LW + 1; d.position.set(x, LW + sh/2 - 1, z); d.scale.set(w*0.9, sh, dp*0.9); d.updateMatrix(); stilts.setMatrixAt(n, d.matrix);
      const fx = x - side*(dp/2 + 0.25);
      for (let k = 0; k < 2; k++) if (R() < 0.8) warm.push(fx, yG + rr(1.6, h - 1.2), z + rr(-w/3, w/3));
      if (R() < 0.3) lamps.push(fx, yG + 2.2, z + rr(-w/2, w/2));
      n++;
    }
    scene.add(bodies, roofs, stilts);
  })();
  const gp = [glowPoints(warm, warm.map(() => rr(1.6, 3.0)), '#FFC57E'), glowPoints(lamps, lamps.map(() => rr(2.2, 3.4)), '#FFB46B')];
  gp.forEach(p => { scene.add(p); GLOWS.push(p); });

  /* the northern lights: three curtains far up the fjord */
  const aurora = [];
  [[0, 300, -1250, 0, 2600, 560, 0.3], [520, 380, -1700, -0.15, 2200, 480, 1.7], [-640, 250, -980, 0.45, 1700, 420, 3.1]].forEach(([x, y, z, ry, w, h, seed]) => {
    const u = {uTime:{value:0}, uOn:{value:0}, uSeed:{value:seed}};
    const g = new THREE.PlaneGeometry(w, h, 180, 8); g.translate(0, h/2, 0);
    const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({uniforms:u, vertexShader:AURORA_VS, fragmentShader:AURORA_FS,
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, fog:false}));
    mesh.position.set(x, y, z); mesh.rotation.y = ry; mesh.frustumCulled = false; scene.add(mesh); aurora.push(u);
  });
  const glow = new THREE.Color(0.1, 0.55, 0.32);
  let auroraOn = 0;

  return {
    zoom:[terrain, sea],
    applyTOD(P, t){
      auroraOn = smooth(0.56, 0.86, t);
      for (const u of aurora) u.uOn.value = auroraOn;
      seaU.uSea.value.copy(P.sea).lerp(glow, auroraOn*0.04);
    },
    animate(){
      seaU.uTime.value = T;
      for (const u of aurora) u.uTime.value = T;
    }
  };
}

/* ── the quay the keyboard sits on ──────────────────────── */
function platformLofoten(){
  const m = lofotenMats(), LW = LF.LW;
  const planks = (function(){
    const c = makeCanvas(1024, 1024), x = c.getContext('2d'), bw = 1024/30;
    for (let i = 0; i < 30; i++){
      const tone = 112 + ((hash2(i, 5)*36)|0);
      x.fillStyle = 'rgb(' + tone + ',' + ((tone*0.9)|0) + ',' + ((tone*0.8)|0) + ')'; x.fillRect(0, i*bw, 1024, bw);
      x.globalAlpha = 0.2; for (let k = 0; k < 14; k++){ x.fillStyle = k % 2 ? '#3a332c' : '#d8d2c8'; x.fillRect(0, i*bw + rr(2, bw - 3), 1024, 1); }
      x.globalAlpha = 1; x.fillStyle = 'rgba(24,20,16,0.65)'; x.fillRect(0, i*bw, 1024, 3);
      x.fillStyle = 'rgba(240,244,248,0.35)'; for (let k = 0; k < 6; k++) x.fillRect(rr(0, 1000), i*bw + rr(0, bw - 6), rr(20, 90), rr(2, 5));
    }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.2, 1.4); t.anisotropy = 8; return t;
  })();
  const deckMat = new THREE.MeshStandardMaterial({color:0xffffff, map:planks, roughness:0.85});
  const deckMesh = new THREE.Mesh(new THREE.BoxGeometry(38, 0.5, 25), [m.woodD, m.woodD, deckMat, m.woodD, m.woodD, m.woodD]);
  deckMesh.position.set(0, -0.25, 2); deckMesh.receiveShadow = true; scene.add(deckMesh);

  /* piles into the water, a timber kerb on three sides, iron bollards */
  (function(){
    const pts = [];
    for (let x = -18.4; x <= 18.41; x += 3.07) pts.push([x, -10.2], [x, 14.2]);
    for (let z = -6.6; z <= 11; z += 3.5) pts.push([-18.6, z], [18.6, z]);
    const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.36, 0.4, 1, 10), m.woodD, pts.length), dd = new THREE.Object3D();
    pts.forEach(([x, z], i) => { const bot = LW - 9, top = -0.5, h = top - bot; dd.position.set(x, bot + h/2, z); dd.scale.set(1, h, 1); dd.updateMatrix(); pil.setMatrixAt(i, dd.matrix); });
    pil.castShadow = true; scene.add(pil);
    const g = new THREE.Group();
    const kb = mb(38, 0.32, 0.4, m.wood); kb.position.set(0, 0.16, -10.3); g.add(kb);
    for (const sx of [-1, 1]){ const ks = mb(0.4, 0.32, 24.6, m.wood); ks.position.set(sx*18.8, 0.16, 2); g.add(ks); }
    const sn = mb(38, 0.06, 0.42, m.snow); sn.position.set(0, 0.35, -10.3); g.add(sn);
    for (const sx of [-1, 1]){ const ss = mb(0.42, 0.06, 24.6, m.snow); ss.position.set(sx*18.8, 0.35, 2); g.add(ss); }
    for (const x of [-6, 6]){
      const b = mc(0.28, 0.34, 0.7, 12, m.iron); b.position.set(x, 0.35, -9.6); g.add(b);
      const cap = mc(0.4, 0.36, 0.14, 12, m.iron); cap.position.set(x, 0.74, -9.6); g.add(cap);
      const rope = mtor(0.5, 0.07, 18, std('#B9A27A', 0.95)); rope.rotation.x = Math.PI/2; rope.position.set(x + 1.2, 0.08, -8.8); g.add(rope);
    }
    scene.add(mergeByMaterial(g));
  })();

  /* a red cabin in the back corner, a drying rack in the other */
  const cabin = rorbu(m, 6.2, 4.6, 3.6, {body:m.red, roof:m.snow, pitch:0.66});
  cabin.position.set(14.4, 0, -6.8); cabin.rotation.y = 0.04; scene.add(mergedAt(cabin));
  const lampMat = new THREE.MeshStandardMaterial({color:col('#F4E6CC'), emissive:col('#FFC27A'), emissiveIntensity:0, roughness:0.5});
  (function(){
    const g = new THREE.Group();
    const lamp = mb(0.3, 0.42, 0.3, lampMat); lamp.position.set(13.2, 2.55, -4.25); g.add(lamp);
    const ring = mtor(0.42, 0.11, 18, m.buoy); ring.position.set(16.6, 1.9, -4.48); g.add(ring);
    scene.add(mergeByMaterial(g));
  })();
  const rack = hjell(m, 8.6, 4.4, 14); rack.position.set(-13.4, 0, -7.6); rack.rotation.y = 0.06; scene.add(mergedAt(rack));
  const tree = spruce(m, 5.4); tree.position.set(-17.2, 0, -3.2); scene.add(mergedAt(tree));

  /* desk mat: navy wool, pale stitch */
  const feltBump = tileNoise(256, 32, 0.9); feltBump.repeat.set(0.9, 0.9);
  const felt = std(SET.board.mat, 0.98, 0, {bumpMap:feltBump, bumpScale:0.02});
  const mat = new THREE.Mesh(chamferBox(24.5, 0.06, 11.4, 0.6, 0.025), felt);
  mat.position.set(0, 0.03, 0.4); mat.receiveShadow = true; scene.add(mat);
  const stitch = new THREE.Mesh(chamferBox(24.1, 0.004, 11.0, 0.45, 0.001), std(SET.board.stitch, 0.9));
  stitch.position.set(0, 0.062, 0.4); scene.add(stitch);
  const inner = new THREE.Mesh(chamferBox(23.9, 0.006, 10.8, 0.4, 0.001), felt);
  inner.position.set(0, 0.063, 0.4); scene.add(inner);

  /* light snow drifting across the quay */
  const snow = (function(){
    const n = MOBILE ? 380 : 700, pos = new Float32Array(n*3), sp = [];
    for (let i = 0; i < n; i++){ pos[i*3] = rr(-24, 24); pos[i*3+1] = rr(0, 16); pos[i*3+2] = rr(-16, 18); sp.push(rr(0.5, 1.0), rr(0, 6)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const c = makeCanvas(32, 32), x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    const pm = new THREE.PointsMaterial({size:0.11, map:new THREE.CanvasTexture(c), transparent:true, depthWrite:false, color:0xffffff, opacity:0.85});
    const pts = new THREE.Points(g, pm); pts.frustumCulled = false; scene.add(pts);
    return {step(dt){
      const a = g.attributes.position;
      for (let i = 0; i < n; i++){
        let y = a.array[i*3+1] - sp[i*2]*dt;
        a.array[i*3] += Math.sin(T*0.6 + sp[i*2+1])*0.25*dt + 0.12*dt;
        if (y < 0.05){ y = rr(13, 16); a.array[i*3] = rr(-24, 24); a.array[i*3+2] = rr(-16, 18); }
        a.array[i*3+1] = y;
      }
      a.needsUpdate = true;
    }};
  })();

  return {
    slab:deckMesh, mat, warmPos:new V3(4, 4.2, -6.4),
    applyTOD(){ lampMat.emissiveIntensity = lampOn*2.6; m.win.emissiveIntensity = lampOn*2.0; },
    animate(dt){ snow.step(dt); }
  };
}

/* ── the lane inside the board ──────────────────────────── */
function streetLofoten(){
  const m = lofotenMats(), villageStatic = new THREE.Group();
  const BODY = [[m.red, 0.62], [m.ochre, 0.2], [m.white, 0.18]];
  const pickBody = () => { let r = R(); for (const [mt, p] of BODY){ if ((r -= p) < 0) return mt; } return m.red; };
  const pickRoof = () => { const r = R(); return r < 0.5 ? m.snow : r < 0.8 ? m.roofD : m.sod; };
  function crates(){
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++){ const c = mb(0.05, 0.03, 0.04, i % 2 ? m.crateO : m.crateB); c.position.set(rr(-0.02, 0.02), 0.015 + i*0.03, rr(-0.01, 0.01)); c.rotation.y = rr(-0.3, 0.3); g.add(c); }
    return g;
  }
  function boat(){
    const g = new THREE.Group();
    const h = msph(0.05, 10, m.buoy); h.scale.set(1.9, 0.5, 0.7); h.position.y = 0.012; g.add(h);
    return g;
  }
  function bench(){
    const g = new THREE.Group();
    const seat = mb(0.13, 0.008, 0.035, m.wood); seat.position.y = 0.035; g.add(seat);
    for (const s of [-1, 1]){ const l = mb(0.008, 0.035, 0.03, m.woodD); l.position.set(s*0.05, 0.017, 0); g.add(l); }
    return g;
  }
  for (let r = 0; r < 6; r++){
    const v = VOID[r], x0 = LX(v.L), x1 = LX(v.R), z0 = STRIP[r], z1 = STRIP[r+1], h = LIFT[r];
    const gr = mb(x1 - x0, h, z1 - z0, m.ground); gr.position.set((x0 + x1)/2, PLATE_TOP + h/2, (z0 + z1)/2); gr.castShadow = false; villageStatic.add(gr);
    if (r < 5){ const lx = laneXAt(STRIP[r+1]), nose = mb(1.0, 0.014, 0.05, m.step); nose.position.set(lx, groundTop(r) + 0.007, STRIP[r+1] - 0.025); villageStatic.add(nose); }
  }
  function inner(r, side, cx, zc, room){
    const gy = groundTop(r), roll = R();
    let o;
    if (r >= 2 && roll < 0.3){ o = bench(); CAFES.push({x:cx, y:gy, z:zc, bench:true, side}); }
    else if (roll < 0.55){ o = spruce(m, rr(0.2, 0.3)); }
    else if (roll < 0.72 && room > 0.3){ o = hjell(m, 0.26, 0.16, 4); }
    else if (roll < 0.86){ o = crates(); }
    else o = boat();
    o.position.set(cx, gy, zc); o.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2; villageStatic.add(o);
  }
  function fillBand(r, side, xWall, edgeOverride){
    const z0 = STRIP[r] + 0.05, z1 = STRIP[r+1] - 0.05;
    let z = z0;
    while (z < z1 - 0.22){
      const len = Math.min(rr(0.34, 0.48), z1 - z), zc = z + len/2;
      const edge = edgeOverride !== undefined ? edgeOverride : laneXAt(zc) + side*0.5;
      const bw = side < 0 ? edge - xWall : xWall - edge;
      if (bw > 0.22){
        const dep = Math.min(bw, rr(0.34, 0.5)), rowF = (5 - r)/5, h = rr(lerp(0.2, 0.26, rowF), lerp(0.28, 0.36, rowF));
        const hs = rorbu(m, len, dep, h, {body:pickBody(), roof:pickRoof()});
        hs.position.set(side < 0 ? xWall + dep/2 : xWall - dep/2, groundTop(r), zc); hs.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2;
        villageStatic.add(hs);
        const rem = bw - dep - 0.04;
        if (rem > 0.18) inner(r, side, side < 0 ? xWall + dep + 0.04 + rem/2 : xWall - dep - 0.04 - rem/2, zc, rem);
      }
      z += len + 0.03;
    }
  }
  /* a lighthouse at the top of the lane, its beam sweeping over the keys after dark */
  const beamMat = new THREE.MeshBasicMaterial({color:col('#FFE2A8'), transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide});
  const beam = new THREE.Group();
  function lighthouse(){
    const g = new THREE.Group();
    const base = mc(0.1, 0.11, 0.05, 14, m.rock); base.position.y = 0.025; g.add(base);
    for (let i = 0; i < 4; i++){ const s = mc(0.07 - i*0.005, 0.075 - i*0.005, 0.14, 14, i % 2 ? m.trim : m.buoy); s.position.y = 0.05 + 0.07 + i*0.14; g.add(s); }
    const gallery = mc(0.085, 0.085, 0.012, 16, m.iron); gallery.position.y = 0.62; g.add(gallery);
    const lantern = mc(0.045, 0.045, 0.07, 12, m.glass); lantern.position.y = 0.665; g.add(lantern);
    const cap = mcone(0.06, 0.06, 12, m.buoy); cap.position.y = 0.73; g.add(cap);
    /* the keeper's cottage behind it */
    const hut = mb(0.2, 0.12, 0.16, m.white); hut.position.set(-0.02, 0.06, -0.17); g.add(hut);
    const rg = new THREE.Group(); rg.position.set(-0.02, 0, -0.17); g.add(rg);
    gableRoof(rg, 0.2, 0.16, 0.12, 0.6, m.buoy, m.white, m.buoy);
    return g;
  }
  const dyn = new THREE.Group(); deck.add(dyn);
  for (let r = 0; r < 6; r++){
    const v = VOID[r];
    fillBand(r, -1, LX(v.L) + 0.04);
    if (r === 0){
      const edge = laneXAt((STRIP[0] + STRIP[1])/2) + 0.5, xr = LX(v.R) - 0.04;
      const lh = lighthouse(); lh.scale.setScalar(1.35); lh.position.set(edge + 0.3, groundTop(0), (STRIP[0] + STRIP[1])/2);
      villageStatic.add(lh);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.4, 16, 1, true), beamMat);
      cone.rotation.z = Math.PI/2; cone.position.x = 0.7; cone.castShadow = false; beam.add(cone);
      beam.position.set(lh.position.x, lh.position.y + 0.665*1.35, lh.position.z); dyn.add(beam);
      fillBand(0, 1, xr, edge + 0.62);
    } else fillBand(r, 1, LX(v.R) - 0.04);
  }
  /* iron lantern posts along the lane */
  [0.1, 0.27, 0.44, 0.61, 0.78, 0.93].forEach((t, i) => {
    const p = lane.getPointAt(t), side = i % 2 ? 1 : -1, x = p.x + side*0.42, gy = groundTop(rowAt(p.z));
    const glass = new THREE.MeshStandardMaterial({color:col('#F1E3C6'), emissive:col('#FFB55E'), emissiveIntensity:0, roughness:0.6});
    const g = new THREE.Group();
    const post = mb(0.01, 0.22, 0.01, m.iron); post.position.y = 0.11; g.add(post);
    const box = mb(0.03, 0.045, 0.03, glass); box.position.y = 0.24; g.add(box);
    const cap = mcone(0.026, 0.022, 4, m.iron); cap.rotation.y = Math.PI/4; cap.position.y = 0.272; g.add(cap);
    g.position.set(x, gy, p.z); villageStatic.add(g);
    LAMPS.push({mat:glass, th:0.47 + i*0.012, pos:new V3(x, gy + 0.24, p.z)});
  });
  /* the boardwalk */
  const N = 150, slab = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.016, 0.034), new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.9}), N);
  slab.frustumCulled = false; slab.receiveShadow = true;
  const d = new THREE.Object3D(), tones = ['#6E6256','#7D7064','#5E544A','#857868','#736A60'].map(col);
  for (let i = 0; i < N; i++){
    const t = i/(N - 1), p = lane.getPointAt(t), tg = lane.getTangentAt(t);
    d.position.set(p.x, groundTop(rowAt(p.z)) + 0.008, p.z); d.rotation.set(0, Math.atan2(tg.x, tg.z), 0);
    d.scale.set(0.82, 1, 1); d.updateMatrix();
    slab.setMatrixAt(i, d.matrix); slab.setColorAt(i, tones[(R()*tones.length)|0]);
  }
  deck.add(slab);
  const merged = mergeByMaterial(villageStatic);
  deck.add(merged);
  return {
    merged,
    applyTOD(){ beamMat.opacity = lampOn*0.16; m.glass.emissiveIntensity = lampOn*3.0; },
    animate(dt){ beam.rotation.y += dt*0.8; }
  };
}
