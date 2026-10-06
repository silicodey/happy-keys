/* ════════════════════════════════════════════════════════════
   KYOTO — a temple stage above the city, a lantern lane through the board
   ════════════════════════════════════════════════════════════ */
const KYO = {};
function kyotoMats(){
  if (KYO.m) return KYO.m;
  KYO.m = {
    woodD: std('#3A2A20', 0.82), woodM: std('#5B3F2C', 0.8), woodW: std('#7A5A40', 0.78),
    plaster: std('#E8E0D0', 0.9), tile: std('#3C4148', 0.55, 0.1), tileD: std('#2C3036', 0.6, 0.1),
    stone: std('#8C8A82', 0.95), stoneD: std('#6B6862', 0.95), ground: std('#9A9286', 0.96), step: std('#76726A', 0.92),
    bamboo: std('#8E7F4C', 0.7), bambooG: std('#6F8A45', 0.75),
    noren: std('#2E3F66', 0.9, 0, {side:THREE.DoubleSide}), norenR: std('#9E2F2F', 0.9, 0, {side:THREE.DoubleSide}),
    felt: std('#B3262C', 0.95), umbrella: std('#B3262C', 0.8, 0, {side:THREE.DoubleSide}),
    vermilion: std('#B4432F', 0.7), trim: std('#EDE6D8', 0.85), bronze: std('#7C6A45', 0.4, 0.6), dark: std('#1E1A17', 0.8),
    mapleR: std('#B32E25', 0.9), mapleO: std('#D1602A', 0.9), mapleG: std('#D49A33', 0.9), mapleL: std('#5E7A3C', 0.95),
    shoji: new THREE.MeshStandardMaterial({color:col('#E9DFC9'), emissive:col('#FFC27A'), emissiveIntensity:0, roughness:0.85}),
    lanternR: new THREE.MeshStandardMaterial({color:col('#B8322A'), emissive:col('#FF5A2C'), emissiveIntensity:0, roughness:0.7}),
    lanternC: new THREE.MeshStandardMaterial({color:col('#EADCC0'), emissive:col('#FFB866'), emissiveIntensity:0, roughness:0.7}),
    toro: new THREE.MeshStandardMaterial({color:col('#F2E6CC'), emissive:col('#FFB55E'), emissiveIntensity:0, roughness:0.8})
  };
  return KYO.m;
}
/* merge a placed group into one mesh per material, keeping where it was placed */
function mergedAt(g){ const out = mergeByMaterial(g); out.position.copy(g.position); out.rotation.copy(g.rotation); out.scale.copy(g.scale); return out; }
const MAPLE_MIX = m => [m.mapleR, m.mapleR, m.mapleR, m.mapleO, m.mapleO, m.mapleG, m.mapleL];

/* five-storey pagoda, normalised to about one unit tall */
function kPagoda(m, bells){
  const g = new THREE.Group();
  const pod = mb(0.62, 0.05, 0.62, m.stone); pod.position.y = 0.025; g.add(pod);
  let y = 0.05;
  for (let i = 0; i < 5; i++){
    const f = 1 - i*0.085, bw = 0.3*f, bh = i === 0 ? 0.095 : 0.07, ex = 0.31*f;
    const body = mb(bw, bh, bw, m.vermilion); body.position.y = y + bh/2; g.add(body);
    const band = mb(bw*1.03, 0.014, bw*1.03, m.trim); band.position.y = y + bh - 0.01; g.add(band);
    y += bh;
    const eave = mb(ex*2, 0.012, ex*2, m.tileD); eave.position.y = y + 0.006; g.add(eave);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(ex*Math.SQRT2*0.96, 0.07, 4, 1), m.tile);
    roof.rotation.y = Math.PI/4; roof.position.y = y + 0.047; roof.castShadow = true; g.add(roof);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){
      const tip = mb(0.06*f, 0.011, 0.016, m.tileD);
      tip.position.set(sx*(ex - 0.015), y + 0.02, sz*(ex - 0.015));
      tip.rotation.set(0, Math.atan2(-sz, sx), 0.38);
      g.add(tip);
      if (bells && i === 0){
        const b = new THREE.Group(); b.position.set(sx*(ex + 0.004), y + 0.004, sz*(ex + 0.004));
        const chain = mc(0.0018, 0.0018, 0.022, 4, m.bronze); chain.position.y = -0.011; b.add(chain);
        const bell = mcone(0.0085, 0.016, 8, m.bronze); bell.position.y = -0.028; b.add(bell);
        bells.push(b); g.add(b);
      }
    }
    y += 0.05;
  }
  const spire = mc(0.008, 0.012, 0.22, 8, m.bronze); spire.position.y = y + 0.11; g.add(spire);
  for (let k = 0; k < 9; k++){ const ring = mtor(0.022 - k*0.0012, 0.004, 12, m.bronze); ring.rotation.x = Math.PI/2; ring.position.y = y + 0.05 + k*0.016; g.add(ring); }
  const jewel = msph(0.014, 8, m.bronze); jewel.position.y = y + 0.235; g.add(jewel);
  return g;
}
/* kasuga stone lantern, about one unit tall; the fire box glows at dusk */
function kToro(m, glow){
  const g = new THREE.Group();
  const add = (geo, mat, y) => { const o = new THREE.Mesh(geo, mat); o.position.y = y; o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.CylinderGeometry(0.24, 0.27, 0.08, 6), m.stone, 0.04);
  add(new THREE.CylinderGeometry(0.075, 0.085, 0.38, 10), m.stone, 0.27);
  add(new THREE.CylinderGeometry(0.2, 0.17, 0.07, 6), m.stone, 0.495);
  add(new THREE.CylinderGeometry(0.13, 0.13, 0.17, 6), glow, 0.615);
  for (let i = 0; i < 6; i++){
    const a = i*Math.PI/3, post = mb(0.03, 0.18, 0.03, m.stone);
    post.position.set(Math.cos(a)*0.14, 0.615, Math.sin(a)*0.14); g.add(post);
  }
  add(new THREE.CylinderGeometry(0.035, 0.31, 0.15, 6), m.stoneD, 0.775);
  add(new THREE.SphereGeometry(0.045, 10, 8), m.stone, 0.885);
  add(new THREE.ConeGeometry(0.03, 0.05, 8), m.stone, 0.94);
  return g;
}
/* a maple: trunk, a few limbs, and a crown of autumn clusters */
function kMaple(m, h, n, spread, lean){
  const g = new THREE.Group(), mix = MAPLE_MIX(m);
  const trunk = mc(h*0.025, h*0.04, h*0.55, 7, m.woodD); trunk.position.y = h*0.275; trunk.rotation.z = (lean || 0)*0.3; g.add(trunk);
  for (let i = 0; i < 3; i++){
    const limb = mc(h*0.012, h*0.018, h*0.35, 5, m.woodD), a = i*2.1 + R();
    limb.position.set(Math.cos(a)*h*0.08, h*0.58, Math.sin(a)*h*0.08); limb.rotation.set(Math.sin(a)*0.7, 0, -Math.cos(a)*0.7); g.add(limb);
  }
  for (let i = 0; i < n; i++){
    const a = R()*Math.PI*2, rad = Math.pow(R(), 0.6)*spread*h, s = h*(0.07 + R()*0.09);
    const b = msph(s, 7, mix[(R()*mix.length)|0]);
    b.position.set(Math.cos(a)*rad + (lean || 0)*h*0.25, h*(0.62 + R()*0.32) - rad*0.25, Math.sin(a)*rad);
    b.scale.y = 0.72; g.add(b);
  }
  return g;
}

/* ── the world beyond the stage ─────────────────────────── */
function worldKyoto(){
  const m = kyotoMats();
  const kH = (x, z) => {
    const n = fbm(x*0.02, z*0.02);
    if (z > -12) return -17 + (z + 12)*0.42 + n*1.2 + Math.pow(x/420, 2)*30;
    const d = -12 - z;
    const side = Math.pow(x/520, 2)*60*(1 - smooth(60, 260, d));
    return -17 - 45*smooth(0, 240, d) + n*4*(1 - smooth(180, 260, d)) + side;
  };
  KYO.kH = kH;

  /* hillside and basin floor */
  const terrain = (function(){
    const g = new THREE.PlaneGeometry(1400, 960, 140, 96);
    g.rotateX(-Math.PI/2); g.translate(0, 0, -440);
    const p = g.attributes.position, c = new Float32Array(p.count*3), tmp = new THREE.Color();
    const forest = col('#2F3A27'), soil = col('#4A3A2C'), basin = col('#6A655E');
    for (let i = 0; i < p.count; i++){
      const x = p.getX(i), z = p.getZ(i), y = kH(x, z);
      p.setY(i, y);
      tmp.copy(forest).lerp(soil, (vnoise(x*0.08, z*0.08)*0.5 + 0.5)*0.35).lerp(basin, smooth(-58, -61.5, y));
      c[i*3] = tmp.r; c[i*3+1] = tmp.g; c[i*3+2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({vertexColors:true, roughness:1, flatShading:true}));
    scene.add(mesh); return mesh;
  })();
  const plainMat = new THREE.MeshStandardMaterial({color:col('#625D57'), roughness:1});
  const plain = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), plainMat);
  plain.geometry.rotateX(-Math.PI/2); plain.position.y = -62.3; plain.frustumCulled = false; scene.add(plain);

  /* forest: autumn broadleaves and dark cedars on the slope and the ridge */
  (function forest(){
    const NB = MOBILE ? 650 : 1000, NC = MOBILE ? 240 : 380;
    const leafy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({color:0xffffff, roughness:1, flatShading:true}), NB);
    const cedar = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), new THREE.MeshStandardMaterial({color:0xffffff, roughness:1, flatShading:true}), NC);
    leafy.frustumCulled = cedar.frustumCulled = false;
    const red = ['#A92E24','#B8392A','#C5532B','#D0702E','#D59A38','#7A3324','#5D6F3A','#4B5E33'].map(col);
    const greens = ['#24331F','#2C3B26','#33432B','#1F2C1C'].map(col);
    const d = new THREE.Object3D();
    const spot = () => {
      for (;;){
        const x = rr(-420, 420), z = rr(-250, 30);
        if (Math.abs(x) < 26 && z > -12.5) continue;
        const y = kH(x, z);
        if (y < -58.5) continue;
        if (z > -12 && R() < 0.5) continue;
        return {x, y, z};
      }
    };
    let ib = 0, ic = 0;
    while (ib < NB || ic < NC){
      const s = spot(), near = 1 - smooth(20, 140, Math.hypot(s.x, s.z + 10));
      if (ic < NC && R() < 0.3 - near*0.2){
        const h = rr(9, 17), r = h*rr(0.2, 0.26);
        d.position.set(s.x, s.y + h*0.5 - 1, s.z); d.rotation.set(0, R()*6, 0); d.scale.set(r, h, r); d.updateMatrix();
        cedar.setMatrixAt(ic, d.matrix); cedar.setColorAt(ic, greens[(R()*greens.length)|0]); ic++;
      } else if (ib < NB){
        const r = rr(2.6, 5.4);
        d.position.set(s.x, s.y + r*0.9 + rr(0.5, 3), s.z); d.rotation.set(R()*3, R()*6, R()*3); d.scale.set(r, r*0.82, r); d.updateMatrix();
        leafy.setMatrixAt(ib, d.matrix);
        const pick = R() < 0.55 + near*0.35 ? red[(R()*6)|0] : red[6 + ((R()*2)|0)];
        leafy.setColorAt(ib, d.scale.x > 4.8 ? pick.clone().multiplyScalar(0.85) : pick); ib++;
      }
    }
    scene.add(leafy, cedar);
  })();

  /* temple halls among the trees */
  [[-95, -62, 26, 0.5], [118, -92, 30, -0.4], [-178, -150, 22, 0.2], [230, -40, 18, 0.9]].forEach(([x, z, s, ry]) => {
    const g = new THREE.Group(), y = kH(x, z);
    const body = mb(s, s*0.32, s*0.66, m.woodD); body.position.y = s*0.16; g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(s*0.78, s*0.36, 4, 1), m.tile);
    roof.rotation.y = Math.PI/4; roof.scale.z = 0.72; roof.position.y = s*0.32 + s*0.18; roof.castShadow = true; g.add(roof);
    g.position.set(x, y - 1, z); g.rotation.y = ry; scene.add(mergedAt(g));
  });

  /* the pagoda in the middle distance, floodlit after dark */
  const pagodaMat = new THREE.MeshStandardMaterial({color:col('#B4432F'), emissive:col('#FF9A55'), emissiveIntensity:0, roughness:0.7});
  (function(){
    const mats = Object.assign({}, m, {vermilion:pagodaMat});
    const p = kPagoda(mats, null);
    const x = -58, z = -168; p.scale.setScalar(36); p.position.set(x, kH(x, z) - 0.5, z); p.rotation.y = 0.3;
    scene.add(mergedAt(p));
  })();

  /* the city: buildings on a grid, the Kamo river, and Kyoto Tower */
  (function city(){
    const N = MOBILE ? 1100 : 1700;
    const bld = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.95}), N);
    bld.frustumCulled = false;
    const tones = ['#9C978F','#B2ADA4','#8A867F','#C4BFB5','#7E7A74','#A69E92'].map(col);
    const d = new THREE.Object3D(), win = [], street = [], cool = [];
    for (let i = 0; i < N; i++){
      const z = -262 - Math.pow(R(), 0.8)*1250, spread = 260 + (-z - 262)*0.75;
      const x = rr(-spread, spread), w = rr(6, 16), dp = rr(6, 16);
      const tall = Math.abs(x - 70) < 160 && z < -620 && z > -900;
      const h = (tall ? rr(10, 34) : rr(3, 12))*(R() < 0.06 ? 2 : 1);
      d.position.set(x, -62.3 + h/2, z); d.rotation.set(0, (R() - 0.5)*0.08, 0); d.scale.set(w, h, dp); d.updateMatrix();
      bld.setMatrixAt(i, d.matrix); bld.setColorAt(i, tones[(R()*tones.length)|0]);
      for (let k = 0, nk = 1 + ((h/5)|0); k < nk; k++) (R() < 0.25 ? cool : win).push(x + rr(-w/2, w/2), -62 + rr(1, h), z + dp/2 + 0.2);
    }
    scene.add(bld);
    for (let gx = -1100; gx <= 1100; gx += 42) for (let z = -270; z > -1500; z -= 7){
      if (Math.abs(gx) > 280 + (-z - 262)*0.8) continue;
      street.push(gx + rr(-0.8, 0.8), -61.8, z);
    }
    for (let gz = -280; gz > -1500; gz -= 46) for (let x = -1100; x <= 1100; x += 8){
      if (Math.abs(x) > 280 + (-gz - 262)*0.8) continue;
      street.push(x, -61.8, gz + rr(-0.8, 0.8));
    }
    const sz = a => { const s = []; for (let i = 0; i < a.length/3; i++) s.push(rr(1.1, 2.6)); return s; };
    [glowPoints(win, sz(win), '#FFC98A'), glowPoints(street, sz(street), '#FFB46B'), glowPoints(cool, sz(cool), '#E3ECFF')]
      .forEach(p => { scene.add(p); GLOWS.push(p); });

    const river = new THREE.Mesh(new THREE.PlaneGeometry(2600, 15), new THREE.MeshStandardMaterial({color:col('#1C2733'), roughness:0.12, metalness:0.9}));
    river.geometry.rotateX(-Math.PI/2); river.position.set(0, -62.05, -430); scene.add(river);
    const bridges = [];
    for (const bx of [-220, -96, 30, 158, 300]) for (let k = -8; k <= 8; k += 2) bridges.push(bx + rr(-0.4, 0.4), -60.6, -430 + k);
    const bp = glowPoints(bridges, null, '#FFD9A3'); scene.add(bp); GLOWS.push(bp);
  })();

  const towerMat = new THREE.MeshStandardMaterial({color:col('#F1EEE8'), emissive:col('#FFFFFF'), emissiveIntensity:0, roughness:0.6});
  (function tower(){
    const g = new THREE.Group(), red = std('#C2412F', 0.6);
    const base = mb(64, 20, 30, std('#CFCAC1', 0.9)); base.position.y = 10; g.add(base);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 6, 78, 18), towerMat); shaft.position.y = 20 + 39; g.add(shaft);
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(9, 7, 9, 24), towerMat); deck.position.y = 20 + 72; g.add(deck);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 12, 12), towerMat); crown.position.y = 20 + 82; g.add(crown);
    const spire = mc(0.4, 1.2, 16, 8, red); spire.position.y = 20 + 96; g.add(spire);
    g.position.set(70, -62.3, -780); scene.add(mergedAt(g));
  })();

  /* western mountains, layered into the haze */
  const ridgeMats = [];
  function ridge(z, x0, x1, h, seed, dark){
    const s = new THREE.Shape(), N = 90, base = -63;
    s.moveTo(x0, base - 4);
    for (let i = 0; i <= N; i++){
      const t = i/N, x = lerp(x0, x1, t), e = Math.pow(Math.sin(t*Math.PI), 0.4);
      s.lineTo(x, base + h*e*(0.7 + 0.3*fbm(x*0.006 + seed, seed)));
    }
    s.lineTo(x1, base - 4);
    const mt = new THREE.MeshBasicMaterial({color:0xffffff, side:THREE.DoubleSide, fog:false}); mt.userData.dark = dark;
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(s), mt); mesh.position.z = z; scene.add(mesh); ridgeMats.push(mt);
  }
  ridge(-1750, -2800, 2800, 230, 2.2, 0);
  ridge(-1380, -2200, -150, 150, 5.1, 0.16);
  ridge(-1300, 350, 2300, 128, 8.3, 0.22);

  return {
    zoom:[terrain],
    applyTOD(P){
      plainMat.color.copy(P.sea);
      for (const mt of ridgeMats) mt.color.copy(P.isl).multiplyScalar(1 - mt.userData.dark);
      pagodaMat.emissiveIntensity = lampOn*0.32;
      towerMat.emissiveIntensity = lampOn*0.55;
    },
    animate(){}
  };
}

/* ── the stage the keyboard sits on ─────────────────────── */
function platformKyoto(){
  const m = kyotoMats();
  /* hinoki planks, drawn once into a texture */
  const planks = (function(){
    const c = makeCanvas(1024, 1024), x = c.getContext('2d'), bw = 1024/40;
    for (let i = 0; i < 40; i++){
      const tone = 150 + ((hash2(i, 3)*40)|0);
      x.fillStyle = 'rgb(' + tone + ',' + ((tone*0.78)|0) + ',' + ((tone*0.56)|0) + ')';
      x.fillRect(i*bw, 0, bw, 1024);
      x.globalAlpha = 0.18;
      for (let k = 0; k < 14; k++){ x.fillStyle = k % 2 ? '#3b2516' : '#e7c9a0'; x.fillRect(i*bw + rr(2, bw - 3), 0, 1, 1024); }
      x.globalAlpha = 1; x.fillStyle = 'rgba(30,18,10,0.55)'; x.fillRect(i*bw, 0, 2, 1024);
      const joint = rr(0, 1024); x.fillRect(i*bw, joint, bw, 2);
    }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(38/12.8, 25/12.8);
    t.anisotropy = 8; return t;
  })();
  const deckMat = new THREE.MeshStandardMaterial({color:0xffffff, map:planks, roughness:0.72});
  const deckMesh = new THREE.Mesh(new THREE.BoxGeometry(38, 0.5, 25), [m.woodD, m.woodD, deckMat, m.woodD, m.woodD, m.woodD]);
  deckMesh.position.set(0, -0.25, 2); deckMesh.receiveShadow = true; scene.add(deckMesh);

  const kH = KYO.kH || ((x, z) => -17);
  /* the stilt lattice under the stage */
  (function stilts(){
    const pts = [];
    for (let x = -18.4; x <= 18.41; x += 3.68) pts.push([x, -10.2], [x, -5.6]);
    for (let z = -6.4; z <= 14; z += 4.1) pts.push([-18.6, z], [18.6, z]);
    const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.46, 1, 10), m.woodM, pts.length);
    const d = new THREE.Object3D();
    pts.forEach(([x, z], i) => {
      const bot = kH(x, z) - 1, top = -0.5, h = top - bot;
      d.position.set(x, bot + h/2, z); d.scale.set(1, h, 1); d.rotation.set(0, 0, 0); d.updateMatrix(); pil.setMatrixAt(i, d.matrix);
    });
    pil.castShadow = true; pil.receiveShadow = true; scene.add(pil);
    const beams = new THREE.Group();
    for (const y of [-4.2, -9.4, -14.4]){
      for (const z of [-10.2, -5.6]){ const b = mb(37.6, 0.42, 0.3, m.woodD); b.position.set(0, y, z); beams.add(b); }
      for (const x of [-18.6, 18.6]){ const b = mb(0.3, 0.42, 25, m.woodD); b.position.set(x, y, 2); beams.add(b); }
    }
    scene.add(mergeByMaterial(beams));
  })();

  /* railing on three sides, bronze giboshi caps on the corners */
  (function railing(){
    const g = new THREE.Group(), H = 1.05;
    const run = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(len/2.1)), ang = Math.atan2(z1 - z0, x1 - x0);
      for (let i = 0; i <= n; i++){
        const t = i/n, p = mb(0.17, H, 0.17, m.woodM); p.position.set(lerp(x0, x1, t), H/2, lerp(z0, z1, t)); g.add(p);
      }
      for (const [y, th] of [[H - 0.05, 0.12], [0.55, 0.07], [0.12, 0.09]]){
        const r = mb(len, th, th, m.woodD); r.position.set((x0 + x1)/2, y, (z0 + z1)/2); r.rotation.y = -ang; g.add(r);
      }
    };
    run(-18.9, -10.15, 18.9, -10.15); run(-18.9, -10.15, -18.9, 14.3); run(18.9, -10.15, 18.9, 14.3);
    for (const [x, z] of [[-18.9, -10.15], [18.9, -10.15], [-18.9, 14.3], [18.9, 14.3]]){
      const cap = msph(0.15, 10, m.bronze); cap.position.set(x, H + 0.1, z); g.add(cap);
      const tip = mcone(0.07, 0.16, 8, m.bronze); tip.position.set(x, H + 0.3, z); g.add(tip);
    }
    scene.add(mergeByMaterial(g));
  })();

  /* a beam of paper lanterns along the back of the stage */
  const lanterns = [];
  (function(){
    const g = new THREE.Group(), H = 5.6, X = 16.6, Z = -9.55;
    for (const sx of [-1, 1]){ const p = mb(0.26, H, 0.26, m.woodD); p.position.set(sx*X, H/2, Z); g.add(p); }
    const beam = mb(2*X + 0.6, 0.24, 0.26, m.woodD); beam.position.set(0, H - 0.25, Z); g.add(beam);
    scene.add(mergeByMaterial(g));
    for (let i = 0; i < 9; i++){
      const L = new THREE.Group(); L.position.set(lerp(-14.4, 14.4, i/8), H - 0.38, Z);
      const cord = mc(0.012, 0.012, 0.34, 4, m.dark); cord.position.y = -0.17; L.add(cord);
      const body = msph(0.33, 18, i % 2 ? m.lanternC : m.lanternR); body.scale.y = 1.28; body.position.y = -0.34 - 0.42; L.add(body);
      for (const s of [1, -1]){ const cap = mc(0.2, 0.2, 0.07, 14, m.dark); cap.position.y = -0.76 + s*0.43; L.add(cap); }
      scene.add(L); lanterns.push({g:L, ph:i*0.7 + R()});
    }
  })();

  /* a great stone lantern and an old maple at the corners */
  const big = kToro(m, m.toro); big.scale.setScalar(2.6); big.position.set(-15.6, 0, -7.4); scene.add(mergedAt(big));
  const maple = kMaple(m, 6.6, 150, 0.55, -0.4); maple.position.set(15.4, 0, -8.6); scene.add(mergedAt(maple));

  /* desk mat: indigo felt, stitched */
  const feltBump = tileNoise(256, 32, 0.9); feltBump.repeat.set(0.9, 0.9);
  const felt = std(SET.board.mat, 0.98, 0, {bumpMap:feltBump, bumpScale:0.02});
  const mat = new THREE.Mesh(chamferBox(24.5, 0.06, 11.4, 0.6, 0.025), felt);
  mat.position.set(0, 0.03, 0.4); mat.receiveShadow = true; scene.add(mat);
  const stitch = new THREE.Mesh(chamferBox(24.1, 0.004, 11.0, 0.45, 0.001), std(SET.board.stitch, 0.9));
  stitch.position.set(0, 0.062, 0.4); scene.add(stitch);
  const inner = new THREE.Mesh(chamferBox(23.9, 0.006, 10.8, 0.4, 0.001), felt);
  inner.position.set(0, 0.063, 0.4); scene.add(inner);

  /* maple leaves drifting down past the stage and settling on its front */
  const leaves = (function(){
    const s = new THREE.Shape(), N = 10;
    for (let i = 0; i <= N; i++){
      const a = Math.PI/2 + i/N*Math.PI*2, r = i % 2 ? 0.42 : 1;
      const px = Math.cos(a)*r*0.17, py = Math.sin(a)*r*0.17;
      i ? s.lineTo(px, py) : s.moveTo(px, py);
    }
    const geo = new THREE.ShapeGeometry(s); geo.rotateX(-Math.PI/2);
    const cnt = MOBILE ? 40 : 64, mesh = new THREE.InstancedMesh(geo, std('#FFFFFF', 0.7, 0, {side:THREE.DoubleSide}), cnt);
    mesh.frustumCulled = false; mesh.castShadow = true;
    const tones = ['#B32E25','#C9442A','#D1602A','#D49A33','#A62A2A'].map(col), L = [];
    for (let i = 0; i < cnt; i++){
      const lf = {front: i % 5 < 2, ph:R()*10, spin:rr(0.6, 1.8)*(R() < 0.5 ? -1 : 1), fall:rr(0.35, 0.7), drift:rr(0.15, 0.5), rest:0, shrink:1, s:rr(0.8, 1.25)};
      spawn(lf, true); L.push(lf); mesh.setColorAt(i, tones[(R()*tones.length)|0]);
    }
    function spawn(lf, any){
      if (lf.front){ lf.x = rr(-17, 17); lf.z = rr(6.6, 13.6); lf.y = any ? rr(0.5, 9) : rr(7, 10); }
      else { lf.x = rr(-24, 24); lf.z = rr(-30, -9.5); lf.y = any ? rr(-14, 12) : rr(8, 13); }
      lf.rest = 0; lf.shrink = 1;
    }
    const d = new THREE.Object3D();
    function step(dt){
      L.forEach((lf, i) => {
        if (lf.rest > 0){
          lf.rest -= dt; if (lf.rest < 0.6) lf.shrink = Math.max(0, lf.rest/0.6);
          if (lf.rest <= 0) spawn(lf, false);
          d.position.set(lf.x, 0.035, lf.z); d.rotation.set(0, lf.ph, 0);
        } else {
          lf.y -= lf.fall*dt; lf.x += (lf.drift + Math.sin(T*1.3 + lf.ph)*0.5)*dt; lf.z += Math.cos(T*0.9 + lf.ph)*0.25*dt;
          if (lf.front && lf.y <= 0.035){ lf.y = 0.035; lf.rest = rr(3, 7); }
          if (!lf.front && lf.y < -20) spawn(lf, false);
          d.position.set(lf.x, lf.y, lf.z);
          d.rotation.set(Math.sin(T*1.7 + lf.ph)*1.1, T*lf.spin + lf.ph, Math.cos(T*1.3 + lf.ph)*0.6);
        }
        d.scale.setScalar(lf.s*lf.shrink); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    scene.add(mesh);
    return {step};
  })();

  return {
    slab:deckMesh, mat, warmPos:new V3(0, 4.3, -7.2),
    applyTOD(){
      m.lanternR.emissiveIntensity = lampOn*1.7; m.lanternC.emissiveIntensity = lampOn*1.5; m.toro.emissiveIntensity = lampOn*2.2;
    },
    animate(dt){
      for (const L of lanterns) L.g.rotation.z = Math.sin(T*0.9 + L.ph)*0.035;
      leaves.step(dt);
    }
  };
}

/* ── the lane inside the board ──────────────────────────── */
function streetKyoto(){
  const m = kyotoMats();
  const villageStatic = new THREE.Group();
  /* a gabled roof: two pitched planes, a ridge, and the gable ends filled */
  function gable(g, w, d, y, mat, wallMat){
    const a = 0.46, half = d/2 + 0.035, slope = half/Math.cos(a);
    for (const s of [1, -1]){
      const pl = mb(w + 0.06, 0.016, slope, mat);
      pl.position.set(0, y + Math.tan(a)*half/2 - 0.004, s*half/2); pl.rotation.x = s*a; g.add(pl);
    }
    const ridge = mb(w + 0.07, 0.022, 0.026, m.tileD); ridge.position.y = y + Math.tan(a)*half; g.add(ridge);
    const tri = new THREE.Shape(); tri.moveTo(-d/2, 0); tri.lineTo(d/2, 0); tri.lineTo(0, Math.tan(a)*d/2); tri.lineTo(-d/2, 0);
    const tg = new THREE.ExtrudeGeometry(tri, {depth:w - 0.004, bevelEnabled:false}); tg.rotateY(Math.PI/2); tg.translate(-(w - 0.004)/2, 0, 0);
    const fill = new THREE.Mesh(tg, wallMat); fill.position.y = y; fill.castShadow = true; fill.receiveShadow = true; g.add(fill);
  }
  /* a machiya townhouse: dark lattice below, plaster above, tiled roofs */
  function machiya(w, d, h, o){
    const g = new THREE.Group(), h1 = Math.min(h, 0.25), two = h > 0.34;
    const low = mb(w, h1, d, m.woodD); low.position.y = h1/2; g.add(low);
    const front = d/2 + 0.004;
    const pane = mb(w*0.58, h1*0.56, 0.006, m.shoji); pane.position.set(w*0.12, h1*0.48, front); g.add(pane);
    for (let sx = w*0.12 - w*0.29 + 0.012; sx < w*0.12 + w*0.29; sx += 0.021){ const sl = mb(0.006, h1*0.6, 0.008, m.woodM); sl.position.set(sx, h1*0.48, front + 0.004); g.add(sl); }
    const door = mb(0.075, 0.14, 0.008, m.dark); door.position.set(-w/2 + 0.07, 0.07, front); g.add(door);
    const nr = mb(0.085, 0.05, 0.004, o.red ? m.norenR : m.noren); nr.position.set(-w/2 + 0.07, 0.115, front + 0.008); g.add(nr);
    const hisashi = mb(w + 0.02, 0.012, 0.075, m.tile); hisashi.position.set(0, h1 + 0.008, front + 0.03); hisashi.rotation.x = 0.36; g.add(hisashi);
    if (o.inuyarai){
      const iy = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, w*0.6, 10, 1, true, 0, Math.PI/2), m.bamboo);
      iy.material.side = THREE.DoubleSide; iy.rotation.z = Math.PI/2; iy.position.set(w*0.12, 0, front); g.add(iy);
    }
    let top = h1;
    if (two){
      const h2 = h - h1, up = mb(w*0.97, h2, d*0.88, m.plaster); up.position.set(0, h1 + h2/2, -d*0.04); g.add(up);
      const win = mb(w*0.44, h2*0.36, 0.006, m.shoji); win.position.set(0, h1 + h2*0.52, d*0.4 + 0.004); g.add(win);
      for (let sx = -w*0.2; sx <= w*0.2; sx += 0.02){ const sl = mb(0.008, h2*0.38, 0.008, m.woodD); sl.position.set(sx, h1 + h2*0.52, d*0.4 + 0.008); g.add(sl); }
      top = h;
      gable(g, w*0.97, d*0.88, top, m.tile, m.plaster);
    } else gable(g, w, d, top, m.tile, m.woodD);
    if (o.lantern){
      const lt = msph(0.02, 10, m.lanternR); lt.scale.y = 1.3; lt.position.set(-w/2 + 0.14, h1*0.82, front + 0.03); g.add(lt);
    }
    return g;
  }
  function teaStand(){
    const g = new THREE.Group();
    const top = mb(0.15, 0.012, 0.055, m.felt); top.position.y = 0.05; g.add(top);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const l = mb(0.008, 0.045, 0.008, m.woodD); l.position.set(sx*0.065, 0.022, sz*0.022); g.add(l); }
    const pole = mc(0.004, 0.004, 0.29, 6, m.bamboo); pole.position.set(0.05, 0.145, -0.04); g.add(pole);
    const um = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.055, 18, 1, true), m.umbrella); um.position.set(0.05, 0.3, -0.04); um.castShadow = true; g.add(um);
    return g;
  }
  function bamboo(){
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++){ const h = rr(0.32, 0.5), c = mc(0.006, 0.007, h, 6, m.bambooG); c.position.set(rr(-0.04, 0.04), h/2, rr(-0.04, 0.04)); c.rotation.z = rr(-0.08, 0.08); g.add(c); }
    return g;
  }
  for (let r = 0; r < 6; r++){
    const v = VOID[r], x0 = LX(v.L), x1 = LX(v.R), z0 = STRIP[r], z1 = STRIP[r+1], h = LIFT[r];
    const g = mb(x1 - x0, h, z1 - z0, m.ground); g.position.set((x0 + x1)/2, PLATE_TOP + h/2, (z0 + z1)/2); g.castShadow = false; villageStatic.add(g);
    if (r < 5){ const lx = laneXAt(STRIP[r+1]), nose = mb(1.0, 0.014, 0.05, m.step); nose.position.set(lx, groundTop(r) + 0.007, STRIP[r+1] - 0.025); villageStatic.add(nose); }
  }
  function building(r, side, cx, zc, len, dep){
    const gy = groundTop(r), rowF = (5 - r)/5, h = rr(lerp(0.27, 0.36, rowF), lerp(0.4, 0.52, rowF));
    const hs = machiya(len, dep, h, {red:R() < 0.3, inuyarai:R() < 0.45, lantern:R() < 0.5});
    hs.position.set(cx, gy, zc); hs.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2; villageStatic.add(hs);
  }
  function inner(r, side, cx, zc, len, w){
    const gy = groundTop(r), roll = R();
    if (r >= 2 && roll < 0.42){
      const t = teaStand(); t.position.set(cx, gy, zc); t.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2; villageStatic.add(t);
      CAFES.push({x:cx, y:gy, z:zc, bench:true, side});
    } else if (roll < 0.72){
      const mp = kMaple(m, rr(0.42, 0.62), 9, 0.32, 0); mp.position.set(cx, gy, zc); villageStatic.add(mp);
    } else if (roll < 0.86){
      const t = kToro(m, m.toro); t.scale.setScalar(rr(0.17, 0.22)); t.position.set(cx, gy, zc); villageStatic.add(t);
    } else { const b = bamboo(); b.position.set(cx, gy, zc); villageStatic.add(b); }
  }
  function fillBand(r, side, xWall, edgeOverride){
    const z0 = STRIP[r] + 0.05, z1 = STRIP[r+1] - 0.05;
    let z = z0;
    while (z < z1 - 0.22){
      const len = Math.min(rr(0.36, 0.5), z1 - z), zc = z + len/2;
      const edge = edgeOverride !== undefined ? edgeOverride : laneXAt(zc) + side*0.5;
      const bw = side < 0 ? edge - xWall : xWall - edge;
      if (bw > 0.22){
        const dep = Math.min(bw, rr(0.36, 0.58));
        building(r, side, side < 0 ? xWall + dep/2 : xWall - dep/2, zc, len, dep);
        const rem = bw - dep - 0.04;
        if (rem > 0.2) inner(r, side, side < 0 ? xWall + dep + 0.04 + rem/2 : xWall - dep - 0.04 - rem/2, zc, len, rem);
      }
      z += len + 0.025;
    }
  }
  const dyn = new THREE.Group(); deck.add(dyn);
  for (let r = 0; r < 6; r++){
    const v = VOID[r];
    fillBand(r, -1, LX(v.L) + 0.04);
    if (r === 0){
      /* the lane climbs to a pagoda, as Ninenzaka climbs to Yasaka */
      const edge = laneXAt((STRIP[0] + STRIP[1])/2) + 0.5, xr = LX(v.R) - 0.04;
      const pagodaDyn = new THREE.Group(), bells = [];
      const p = kPagoda(m, bells); p.scale.setScalar(1.25);
      p.position.set(edge + 0.42, groundTop(0), (STRIP[0] + STRIP[1])/2); p.rotation.y = 0.12;
      for (const b of bells){ p.remove(b); pagodaDyn.add(b); BELLS.push(b); }
      villageStatic.add(p);
      pagodaDyn.position.copy(p.position); pagodaDyn.rotation.copy(p.rotation); pagodaDyn.scale.copy(p.scale); dyn.add(pagodaDyn);
      fillBand(0, 1, xr, edge + 0.86);
    } else fillBand(r, 1, LX(v.R) - 0.04);
  }
  /* andon lamps along the lane, each lighting on its own */
  [0.1, 0.27, 0.44, 0.61, 0.78, 0.93].forEach((t, i) => {
    const p = lane.getPointAt(t), side = i % 2 ? 1 : -1, x = p.x + side*0.42, gy = groundTop(rowAt(p.z));
    const paper = new THREE.MeshStandardMaterial({color:col('#F1E3C6'), emissive:col('#FFB55E'), emissiveIntensity:0, roughness:0.8});
    const g = new THREE.Group();
    const post = mb(0.012, 0.22, 0.012, m.woodD); post.position.y = 0.11; g.add(post);
    const box = mb(0.034, 0.05, 0.034, paper); box.position.y = 0.245; g.add(box);
    const cap = mb(0.046, 0.009, 0.046, m.woodD); cap.position.y = 0.275; g.add(cap);
    g.position.set(x, gy, p.z); villageStatic.add(g);
    LAMPS.push({mat:paper, th:0.47 + i*0.012, pos:new V3(x, gy + 0.245, p.z)});
  });
  /* ishidatami: the stone paving of the lane */
  const N = 150, slab = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.016, 0.034), new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.9}), N);
  slab.frustumCulled = false; slab.receiveShadow = true;
  const d = new THREE.Object3D(), tones = ['#8E8A82','#A29D93','#7F7B74','#B0AA9F','#96918A'].map(col);
  for (let i = 0; i < N; i++){
    const t = i/(N - 1), p = lane.getPointAt(t), tg = lane.getTangentAt(t);
    d.position.set(p.x, groundTop(rowAt(p.z)) + 0.008, p.z); d.rotation.set(0, Math.atan2(tg.x, tg.z), 0);
    d.scale.set(0.86 + 0.08*Math.sin(t*9), 1, 1); d.updateMatrix();
    slab.setMatrixAt(i, d.matrix); slab.setColorAt(i, tones[(R()*tones.length)|0]);
  }
  deck.add(slab);
  /* strings of small lanterns across the lane */
  [0.19, 0.5, 0.72].forEach(t => {
    const p = lane.getPointAt(t), y = groundTop(rowAt(p.z)) + 0.44;
    const rope = mb(1.06, 0.004, 0.004, m.dark); rope.position.set(p.x, y, p.z); rope.castShadow = false; villageStatic.add(rope);
    for (let k = 0; k < 5; k++){
      const lt = msph(0.024, 10, k % 2 ? m.lanternC : m.lanternR); lt.scale.y = 1.3;
      lt.position.set(p.x - 0.4 + k*0.2, y - 0.04, p.z); villageStatic.add(lt);
    }
  });
  const merged = mergeByMaterial(villageStatic);
  deck.add(merged);
  return {
    merged,
    applyTOD(){ m.shoji.emissiveIntensity = lampOn*1.9; },
    animate(){}
  };
}
