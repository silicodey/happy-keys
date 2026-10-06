/* ════════════════════════════════════════════════════════════
   BROOKLYN — a rooftop over brownstones, Manhattan across the river
   ════════════════════════════════════════════════════════════ */
const BK = {};
function brooklynMats(){
  if (BK.m) return BK.m;
  BK.m = {
    brown: std('#6B4334', 0.9), brownD: std('#553326', 0.9), brick: std('#8A4A3A', 0.92), brickD: std('#6A3428', 0.92),
    paint: std('#9C9A92', 0.9), cream: std('#C8B79A', 0.9), trim: std('#D9CEBB', 0.85), cornice: std('#3A302A', 0.75),
    iron: std('#1E1F22', 0.6, 0.4), door: std('#2A1E18', 0.7), wood: std('#6E4A33', 0.85), woodL: std('#8A6446', 0.8),
    roof: std('#2E2C2B', 0.95), steel: std('#4A4E54', 0.5, 0.6), ground: std('#8C8781', 0.95), step: std('#77736E', 0.92),
    leafA: std('#4F6B3A', 0.95), leafB: std('#5E7D45', 0.95), leafC: std('#7A8F4A', 0.95), bark: std('#4A3E33', 0.9),
    awnG: std('#2F5D46', 0.85, 0, {side:THREE.DoubleSide}), awnR: std('#8E2F2A', 0.85, 0, {side:THREE.DoubleSide}),
    hydrant: std('#B8322A', 0.6), mailbox: std('#2C4C8C', 0.6), slate: std('#3B3F45', 0.8),
    win: new THREE.MeshStandardMaterial({color:col('#232A33'), emissive:col('#FFB869'), emissiveIntensity:0, roughness:0.35}),
    bulb: new THREE.MeshStandardMaterial({color:col('#F4E6CC'), emissive:col('#FFC27A'), emissiveIntensity:0, roughness:0.5}),
    rose: new THREE.MeshStandardMaterial({color:col('#3B2A4A'), emissive:col('#FF9E5E'), emissiveIntensity:0, roughness:0.4})
  };
  return BK.m;
}
/* brick, drawn once: running bond with uneven tones and soft mortar */
function brickTexture(rx, ry, dark){
  if (!BK.brickCv){
    const c = makeCanvas(512, 512), x = c.getContext('2d'), bh = 512/24, bw = 512/8;
    x.fillStyle = '#9C8E80'; x.fillRect(0, 0, 512, 512);
    for (let r = 0; r < 24; r++) for (let i = -1; i < 9; i++){
      const off = r % 2 ? bw/2 : 0, h = hash2(i*7 + 3, r*13 + 1);
      const R0 = 120 + h*40, G0 = 56 + h*22, B0 = 42 + h*16;
      x.fillStyle = 'rgb(' + (R0|0) + ',' + (G0|0) + ',' + (B0|0) + ')';
      x.fillRect(i*bw + off + 1.5, r*bh + 1.5, bw - 3, bh - 3);
    }
    BK.brickCv = c;
  }
  const t = new THREE.CanvasTexture(BK.brickCv); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry); t.anisotropy = 8;
  return new THREE.MeshStandardMaterial({color:dark ? col('#B59A8E') : 0xffffff, map:t, roughness:0.95});
}
/* a gabled roof: two pitched planes, a ridge, and the gable ends filled; shared with Lofoten */
function gableRoof(g, w, d, y, a, mat, wallMat, ridgeMat){
  const half = d/2 + 0.03, slope = half/Math.cos(a);
  for (const s of [1, -1]){
    const pl = mb(w + 0.05, 0.014, slope, mat);
    pl.position.set(0, y + Math.tan(a)*half/2 - 0.004, s*half/2); pl.rotation.x = s*a; g.add(pl);
  }
  const ridge = mb(w + 0.06, 0.02, 0.024, ridgeMat || mat); ridge.position.y = y + Math.tan(a)*half; g.add(ridge);
  const tri = new THREE.Shape(); tri.moveTo(-d/2, 0); tri.lineTo(d/2, 0); tri.lineTo(0, Math.tan(a)*d/2); tri.lineTo(-d/2, 0);
  const tg = new THREE.ExtrudeGeometry(tri, {depth:w - 0.004, bevelEnabled:false}); tg.rotateY(Math.PI/2); tg.translate(-(w - 0.004)/2, 0, 0);
  const fill = new THREE.Mesh(tg, wallMat); fill.position.y = y; fill.castShadow = true; fill.receiveShadow = true; g.add(fill);
  return y + Math.tan(a)*half;
}
/* a rooftop water tower: a cedar barrel on a steel stand, about one unit tall */
function waterTower(m){
  const g = new THREE.Group();
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){
    const leg = mb(0.035, 0.46, 0.035, m.steel); leg.position.set(sx*0.17, 0.23, sz*0.17); g.add(leg);
  }
  for (const y of [0.16, 0.36]){
    for (const s of [1, -1]){
      const a = mb(0.36, 0.014, 0.014, m.steel); a.position.set(0, y, s*0.17); g.add(a);
      const b = mb(0.014, 0.014, 0.36, m.steel); b.position.set(s*0.17, y, 0); g.add(b);
    }
  }
  const deckP = mb(0.46, 0.025, 0.46, m.wood); deckP.position.y = 0.47; g.add(deckP);
  const barrel = mc(0.2, 0.21, 0.36, 18, m.woodL); barrel.position.y = 0.665; g.add(barrel);
  for (const y of [0.53, 0.62, 0.71, 0.8]){ const hoop = mtor(0.208, 0.006, 22, m.iron); hoop.rotation.x = Math.PI/2; hoop.position.y = y; g.add(hoop); }
  const cap = mcone(0.23, 0.17, 18, m.roof); cap.position.y = 0.93; g.add(cap);
  const fin = msph(0.018, 8, m.steel); fin.position.y = 1.02; g.add(fin);
  return g;
}

/* ── the city across the river ──────────────────────────── */
function worldBrooklyn(){
  const m = brooklynMats(), Y0 = -40, WY = -40.8;
  /* the river, drawn with the sea shader */
  const riverU = {uTime:{value:0}, uTop:skyU.uTop, uHor:skyU.uHor, uSunCol:skyU.uSunCol, uSunDir:skyU.uSunDir,
    uMoonDir:skyU.uMoonDir, uSunVis:skyU.uSunVis, uNight:skyU.uNight, uSea:{value:new THREE.Color()}};
  const river = new THREE.Mesh(new THREE.PlaneGeometry(7000, 396), new THREE.ShaderMaterial({uniforms:riverU, vertexShader:SEA_VS, fragmentShader:SEA_FS, fog:false}));
  river.geometry.rotateX(-Math.PI/2); river.position.set(0, WY, -234); river.frustumCulled = false; scene.add(river);
  const groundMat = new THREE.MeshStandardMaterial({color:col('#3A3836'), roughness:1});
  const bkGround = new THREE.Mesh(new THREE.PlaneGeometry(7000, 940), groundMat);
  bkGround.geometry.rotateX(-Math.PI/2); bkGround.position.set(0, Y0, 434); scene.add(bkGround);
  const mhGround = new THREE.Mesh(new THREE.PlaneGeometry(7000, 2600), groundMat);
  mhGround.geometry.rotateX(-Math.PI/2); mhGround.position.set(0, Y0, -1732); scene.add(mhGround);
  /* the building under the roof */
  const body = new THREE.Mesh(new THREE.BoxGeometry(38.6, 40, 25.6), brickTexture(9, 9, true));
  body.position.set(0, -20.6, 2); body.receiveShadow = true; scene.add(body);

  const d = new THREE.Object3D(), warm = [], cool = [], lamps = [], mWarm = [], mCool = [];
  /* Brooklyn: rowhouse blocks between the roof and the river, water towers on some roofs */
  (function brooklyn(){
    const N = MOBILE ? 1300 : 2000, houses = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.95}), N);
    const NT = 220, barrels = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.05, 1, 10), new THREE.MeshStandardMaterial({color:col('#7A5A40'), roughness:0.9}), NT);
    const caps = new THREE.InstancedMesh(new THREE.ConeGeometry(1.1, 0.8, 10), new THREE.MeshStandardMaterial({color:col('#2E2C2B'), roughness:0.9}), NT);
    const stands = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color:col('#3F4247'), roughness:0.7, metalness:0.4}), NT);
    houses.frustumCulled = barrels.frustumCulled = caps.frustumCulled = stands.frustumCulled = false;
    const tones = ['#6B4334','#7E4A38','#8A4A3A','#6A3428','#9C9A92','#C8B79A','#5E4A42','#7D6A5A'].map(col);
    let n = 0, nt = 0;
    for (let bz = 196; bz > -12 && n < N; bz -= 34) for (let bx = -760; bx < 760 && n < N; bx += 64){
      for (const side of [1, -1]){
        let x = bx + 3;
        while (x < bx + 58 && n < N){
          const w = rr(5.5, 8.5), dp = rr(11, 14), z = bz + side*8, cx = x + w/2;
          x += w;
          if (Math.abs(cx) < 28 && z < 24) continue;
          if (z < -14 || (Math.abs(cx + 110) < 16 && z < 10)) continue;
          const tall = R() < 0.06, h = tall ? rr(30, 52) : rr(12, 26);
          d.position.set(cx, Y0 + h/2, z); d.rotation.set(0, 0, 0); d.scale.set(w - 0.15, h, dp); d.updateMatrix();
          houses.setMatrixAt(n, d.matrix); houses.setColorAt(n, tones[(R()*tones.length)|0]); n++;
          const face = z + side*dp/2 + side*0.2;
          if (side > 0) for (let k = 0, nk = 1 + ((h/6)|0); k < nk; k++) (R() < 0.22 ? cool : warm).push(cx + rr(-w/2 + 1, w/2 - 1), Y0 + rr(2, h - 1), face);
          if (nt < NT && R() < 0.14){
            const tr = rr(1.3, 1.9), ty = Y0 + h + 2.4, tx = cx + rr(-1, 1), tz = z + rr(-3, 3);
            d.position.set(tx, ty + 1.2, tz); d.scale.set(tr, 2.4, tr); d.updateMatrix(); barrels.setMatrixAt(nt, d.matrix);
            d.position.set(tx, ty + 2.8, tz); d.scale.set(tr, 1, tr); d.updateMatrix(); caps.setMatrixAt(nt, d.matrix);
            d.position.set(tx, Y0 + h + 1.2, tz); d.scale.set(tr*1.5, 2.4, tr*1.5); d.updateMatrix(); stands.setMatrixAt(nt, d.matrix); nt++;
          }
        }
      }
      for (let z = bz + 16; z > bz - 18; z -= 11) lamps.push(bx - 1, Y0 + 5, z);
      for (let x = bx; x < bx + 64; x += 13) lamps.push(x, Y0 + 5, bz - 17);
    }
    houses.count = n; barrels.count = caps.count = stands.count = nt;
    scene.add(houses, barrels, caps, stands);
    /* the promenade along the water: trees and a railing of lamps */
    const NTR = 150, trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({color:0xffffff, roughness:1, flatShading:true}), NTR);
    trees.frustumCulled = false;
    const greens = ['#3F5A32','#4F6B3A','#5E7D45','#46602F'].map(col);
    for (let i = 0; i < NTR; i++){
      const r = rr(2.4, 3.6); d.position.set(rr(-760, 760), Y0 + r + 1.5, rr(-22, -30)); d.rotation.set(R()*3, R()*6, R()*3); d.scale.set(r, r*0.85, r); d.updateMatrix();
      trees.setMatrixAt(i, d.matrix); trees.setColorAt(i, greens[(R()*greens.length)|0]);
    }
    scene.add(trees);
    for (let x = -760; x < 760; x += 9) lamps.push(x, Y0 + 4, -33);
  })();

  /* Manhattan: towers on a grid, two clusters rising out of it */
  const crownMat = new THREE.MeshStandardMaterial({color:col('#CFC6B4'), emissive:col('#FFD9A0'), emissiveIntensity:0, roughness:0.6});
  const glassMat = new THREE.MeshStandardMaterial({color:col('#7E8EA0'), emissive:col('#DDE8FF'), emissiveIntensity:0, roughness:0.25, metalness:0.6});
  (function manhattan(){
    const N = MOBILE ? 900 : 1500, bld = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.6, metalness:0.15}), N);
    bld.frustumCulled = false;
    const tones = ['#7D8794','#8E959E','#6B7480','#A39C90','#5E6672','#B4B0A8','#8B8478','#6F7A86'].map(col);
    const beacons = [];
    const cluster = (x, z) => Math.max(Math.exp(-((x + 130)**2 + (z + 580)**2)/(2*150*150)), 0.85*Math.exp(-((x - 250)**2 + (z + 1120)**2)/(2*230*230)));
    for (let i = 0; i < N; i++){
      const z = -462 - Math.pow(R(), 0.85)*1240, spread = 520 + (-z - 462)*0.6, x = rr(-spread, spread);
      const c = cluster(x, z), w = rr(16, 34), dp = rr(16, 34);
      const h = rr(18, 55) + c*rr(60, 300)*Math.pow(R(), 0.6);
      d.position.set(x, Y0 + h/2, z); d.rotation.set(0, (R() - 0.5)*0.03, 0); d.scale.set(w, h, dp); d.updateMatrix();
      bld.setMatrixAt(i, d.matrix); bld.setColorAt(i, tones[(R()*tones.length)|0]);
      const face = z + dp/2 + 0.3, nk = Math.min(40, 2 + ((h*w)/220)|0);
      for (let k = 0; k < nk; k++) (R() < 0.3 ? mCool : mWarm).push(x + rr(-w/2 + 1, w/2 - 1), Y0 + rr(3, h - 2), face);
      if (h > 170) beacons.push(x, Y0 + h + 1.5, z);
    }
    scene.add(bld);
    const bp = glowPoints(beacons, beacons.map(() => 2.4), '#FF4A3A'); scene.add(bp); GLOWS.push(bp);
  })();
  /* two towers that give the skyline its shape: a glass needle downtown, a stepped crown uptown */
  (function landmarks(){
    const a = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(15, 24, 320, 4, 1), glassMat); shaft.rotation.y = Math.PI/4; shaft.position.y = 160; a.add(shaft);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(11, 15, 26, 4, 1), crownMat); top.rotation.y = Math.PI/4; top.position.y = 333; a.add(top);
    const mast = mc(0.8, 1.6, 120, 8, m.steel); mast.position.y = 406; a.add(mast);
    a.position.set(-120, Y0, -600); scene.add(mergedAt(a));
    const b = new THREE.Group(); let y = 0;
    for (const [w, h, mat] of [[46, 190, null], [34, 60, null], [24, 40, null], [16, 34, crownMat], [10, 22, crownMat]]){
      const o = mb(w, h, w, mat || std('#A39C90', 0.7)); o.position.y = y + h/2; b.add(o); y += h;
    }
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 5, 26, 12), crownMat); dome.position.y = y + 13; b.add(dome);
    const spire = mc(0.4, 1.2, 60, 8, m.steel); spire.position.y = y + 56; b.add(spire);
    b.position.set(280, Y0, -1140); scene.add(mergedAt(b));
  })();

  /* the bridge: two stone towers with pointed arches, four cables, a web of stays */
  (function bridge(){
    const BX = -110, DY = Y0 + 30, TOP = WY + 91, ZA = -32, Z1 = -122, Z2 = -340, ZB = -436;
    const stone = std('#B9A88E', 0.9);
    const s = new THREE.Shape(); s.moveTo(-16, 0); s.lineTo(16, 0); s.lineTo(16, 92); s.lineTo(-16, 92); s.lineTo(-16, 0);
    for (const cx of [-7, 7]){
      const h = new THREE.Path(), hw = 4.4, b0 = DY - WY - 1;
      h.moveTo(cx - hw, b0); h.lineTo(cx + hw, b0); h.lineTo(cx + hw, 56); h.quadraticCurveTo(cx + hw, 66, cx, 70); h.quadraticCurveTo(cx - hw, 66, cx - hw, 56); h.lineTo(cx - hw, b0);
      s.holes.push(h);
    }
    const tg = new THREE.ExtrudeGeometry(s, {depth:12, bevelEnabled:false}); tg.translate(0, 0, -6);
    for (const z of [Z1, Z2]){
      const t = new THREE.Mesh(tg, stone); t.position.set(BX, WY, z); t.castShadow = false; scene.add(t);
      const cap = mb(33, 2.2, 13.4, stone); cap.position.set(BX, WY + 93, z); cap.castShadow = false; scene.add(cap);
    }
    const deckMat = std('#4A4642', 0.8);
    for (const cx of [-7, 7]){ const dk = mb(8, 2.2, ZA - ZB + 60, deckMat); dk.position.set(BX + cx, DY, (ZA + ZB)/2); dk.castShadow = false; scene.add(dk); }
    const cableMat = std('#3A3A3E', 0.6, 0.3), cy = (z0, y0, z1, y1, sag, t) => lerp(y0, y1, t) - sag*4*t*(1 - t);
    const spans = [[ZA - 20, DY + 3, Z1, TOP, 5], [Z1, TOP, Z2, TOP, TOP - DY - 4], [Z2, TOP, ZB + 20, DY + 3, 5]];
    const necklace = [], deckLights = [], hang = [];
    for (const x of [-15, -2, 2, 15]){
      for (const [z0, y0, z1, y1, sag] of spans){
        const pts = []; for (let i = 0; i <= 40; i++){ const t = i/40; pts.push(new V3(BX + x, cy(z0, y0, z1, y1, sag, t), lerp(z0, z1, t))); }
        const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, Math.abs(x) > 10 ? 0.55 : 0.4, 5, false), cableMat);
        tube.castShadow = false; scene.add(tube);
        if (Math.abs(x) > 10){
          for (let i = 1; i < 40; i++){ const p = pts[i]; necklace.push(p.x, p.y + 0.6, p.z); }
          for (let i = 2; i < 40; i += 2){ const p = pts[i]; if (p.y - DY > 3) hang.push(p.x, p.y, p.z, p.x, DY + 1, p.z); }
        }
      }
      for (const zt of [Z1, Z2]) for (let k = 1; k <= 7; k++) for (const dir of [1, -1]){
        if (Math.abs(x) < 10) continue;
        hang.push(BX + x, TOP - 2, zt, BX + x*0.8, DY + 1, zt + dir*k*13);
      }
    }
    for (let z = ZA - 20; z > ZB + 20; z -= 9) for (const x of [-11, 11]) deckLights.push(BX + x, DY + 2.2, z);
    const lines = new THREE.BufferGeometry(); lines.setAttribute('position', new THREE.Float32BufferAttribute(hang, 3));
    const web = new THREE.LineSegments(lines, new THREE.LineBasicMaterial({color:col('#4A4A52'), transparent:true, opacity:0.55}));
    scene.add(web);
    const np = glowPoints(necklace, necklace.map(() => 2.4), '#FFF1D6'), dp = glowPoints(deckLights, deckLights.map(() => 2.2), '#FFC27A');
    scene.add(np, dp); GLOWS.push(np, dp);
  })();

  /* the far shore highway: headlights one way, tail lights the other */
  const traffic = (function(){
    const n = MOBILE ? 60 : 110, head = [], tail = [];
    for (let i = 0; i < n; i++){ head.push(rr(-900, 900), Y0 + 1.2, -444); tail.push(rr(-900, 900), Y0 + 1.2, -450); }
    const hp = glowPoints(head, head.map(() => 2.2), '#F4F2FF'), tp = glowPoints(tail, tail.map(() => 2.2), '#FF3B2E');
    scene.add(hp, tp); GLOWS.push(hp, tp);
    const sp = []; for (let i = 0; i < n; i++) sp.push(rr(14, 22));
    return {step(dt){
      const a = hp.geometry.attributes.position, b = tp.geometry.attributes.position;
      for (let i = 0; i < n; i++){
        let x = a.getX(i) + sp[i]*dt; if (x > 900) x -= 1800; a.setX(i, x);
        let y = b.getX(i) - sp[i]*dt; if (y < -900) y += 1800; b.setX(i, y);
      }
      a.needsUpdate = b.needsUpdate = true;
    }};
  })();

  /* a ferry working across the water */
  const ferry = (function(){
    const g = new THREE.Group();
    const hull = mb(26, 3.2, 8, std('#E8E2D6', 0.6)); hull.position.y = 1.6; g.add(hull);
    const band = mb(26.2, 0.8, 8.2, std('#C8642C', 0.6)); band.position.y = 0.6; g.add(band);
    const cabin = mb(16, 3, 6.4, std('#F2EEE6', 0.6)); cabin.position.y = 4.6; g.add(cabin);
    const roofF = mb(17, 0.4, 7, std('#3A3E44', 0.6)); roofF.position.y = 6.3; g.add(roofF);
    const merged = mergedAt(g); merged.traverse(o => { o.castShadow = false; });
    const lights = []; for (let i = 0; i < 9; i++) lights.push(-7.2 + i*1.8, 4.8, 3.3);
    const lp = glowPoints(lights, lights.map(() => 2.4), '#FFD38F'); merged.add(lp); GLOWS.push(lp);
    scene.add(merged);
    return {g:merged, x:-700};
  })();

  const sz = a => { const s = []; for (let i = 0; i < a.length/3; i++) s.push(rr(1.1, 2.4)); return s; };
  const big = a => { const s = []; for (let i = 0; i < a.length/3; i++) s.push(rr(2.2, 4.4)); return s; };
  [glowPoints(warm, sz(warm), '#FFC98A'), glowPoints(cool, sz(cool), '#E3ECFF'), glowPoints(lamps, sz(lamps), '#FFB46B'),
   glowPoints(mWarm, big(mWarm), '#FFD7A0'), glowPoints(mCool, big(mCool), '#E6EEFF')]
    .forEach(p => { scene.add(p); GLOWS.push(p); });

  /* the far shore beyond the city */
  const ridgeMat = new THREE.MeshBasicMaterial({color:0xffffff, side:THREE.DoubleSide, fog:false});
  (function(){
    const s = new THREE.Shape(), x0 = -3200, x1 = 3200; s.moveTo(x0, Y0 - 4);
    for (let i = 0; i <= 80; i++){ const x = lerp(x0, x1, i/80); s.lineTo(x, Y0 + 26 + 18*fbm(x*0.004, 3.1)); }
    s.lineTo(x1, Y0 - 4);
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(s), ridgeMat); mesh.position.z = -2700; scene.add(mesh);
  })();

  return {
    zoom:[bkGround, river, mhGround],
    applyTOD(P){
      riverU.uSea.value.copy(P.sea);
      ridgeMat.color.copy(P.isl);
      crownMat.emissiveIntensity = lampOn*0.7;
      glassMat.emissiveIntensity = lampOn*0.12;
    },
    animate(dt){
      riverU.uTime.value = T;
      traffic.step(dt);
      ferry.x += dt*9; if (ferry.x > 760) ferry.x = -760;
      ferry.g.position.set(ferry.x, WY + Math.sin(T*0.7)*0.12, -236);
    }
  };
}

/* ── the roof the keyboard sits on ──────────────────────── */
function platformBrooklyn(){
  const m = brooklynMats();
  /* tar roof with seams, then a deck of ipe boards under the desk */
  const tar = (function(){
    const c = makeCanvas(512, 512), x = c.getContext('2d');
    x.fillStyle = '#3A3937'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++){ const v = 40 + ((R()*30)|0); x.fillStyle = 'rgb(' + v + ',' + v + ',' + (v - 2) + ')'; x.fillRect(R()*512, R()*512, 2, 2); }
    x.fillStyle = 'rgba(20,20,20,0.6)'; for (let k = 0; k < 4; k++) x.fillRect(0, k*128, 512, 3);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 3.4); return t;
  })();
  const roofMat = new THREE.MeshStandardMaterial({color:0xffffff, map:tar, roughness:0.97});
  const slab = new THREE.Mesh(new THREE.BoxGeometry(38, 0.5, 25), [m.roof, m.roof, roofMat, m.roof, m.roof, m.roof]);
  slab.position.set(0, -0.35, 2); slab.receiveShadow = true; scene.add(slab);
  const planks = (function(){
    const c = makeCanvas(1024, 1024), x = c.getContext('2d'), bw = 1024/34;
    for (let i = 0; i < 34; i++){
      const tone = 104 + ((hash2(i, 9)*34)|0);
      x.fillStyle = 'rgb(' + tone + ',' + ((tone*0.66)|0) + ',' + ((tone*0.46)|0) + ')'; x.fillRect(0, i*bw, 1024, bw);
      x.globalAlpha = 0.16; for (let k = 0; k < 12; k++){ x.fillStyle = k % 2 ? '#2b1a10' : '#c99a70'; x.fillRect(0, i*bw + rr(2, bw - 3), 1024, 1); }
      x.globalAlpha = 1; x.fillStyle = 'rgba(18,10,6,0.7)'; x.fillRect(0, i*bw, 1024, 2.5);
    }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 1); t.anisotropy = 8; return t;
  })();
  const deckMat = new THREE.MeshStandardMaterial({color:0xffffff, map:planks, roughness:0.75});
  const deckB = new THREE.Mesh(new THREE.BoxGeometry(30, 0.1, 16.5), [m.wood, m.wood, deckMat, m.wood, m.wood, m.wood]);
  deckB.position.set(0, -0.05, 0.8); deckB.receiveShadow = true; scene.add(deckB);

  /* brick parapet on three sides with a stone coping */
  (function parapet(){
    const g = new THREE.Group(), H = 1.15, y = -0.1 + H/2;
    const back = new THREE.Mesh(new THREE.BoxGeometry(38.4, H, 0.5), brickTexture(14, 0.9)); back.position.set(0, y, -10.25); g.add(back);
    for (const sx of [-1, 1]){ const side = new THREE.Mesh(new THREE.BoxGeometry(0.5, H, 25), brickTexture(9, 0.9)); side.position.set(sx*19, y, 2); g.add(side); }
    const cope = std('#B8B0A2', 0.85);
    const cb = mb(38.9, 0.12, 0.7, cope); cb.position.set(0, -0.1 + H + 0.06, -10.25); g.add(cb);
    for (const sx of [-1, 1]){ const cs = mb(0.7, 0.12, 25.4, cope); cs.position.set(sx*19, -0.1 + H + 0.06, 2); g.add(cs); }
    g.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
  })();

  /* the water tower in the back corner, the stair bulkhead in the other */
  const wt = waterTower(m); wt.scale.setScalar(6.4); wt.position.set(14.6, -0.1, -6.6); scene.add(mergedAt(wt));
  const doorLamp = new THREE.MeshStandardMaterial({color:col('#F4E6CC'), emissive:col('#FFC27A'), emissiveIntensity:0, roughness:0.5});
  (function bulkhead(){
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.3, 3.6), brickTexture(1.6, 1.4)); box.position.y = 1.55; g.add(box);
    const top = mb(4.8, 0.18, 4.0, std('#B8B0A2', 0.85)); top.position.y = 3.27; g.add(top);
    const door = mb(1.15, 2.2, 0.08, std('#5E2A22', 0.6)); door.position.set(0.6, 1.0, 1.82); g.add(door);
    const knob = msph(0.05, 8, m.steel); knob.position.set(1.02, 1.0, 1.88); g.add(knob);
    const lamp = mb(0.32, 0.26, 0.2, doorLamp); lamp.position.set(0.6, 2.5, 1.9); g.add(lamp);
    const vent = mc(0.22, 0.22, 1.2, 10, m.steel); vent.position.set(-1.2, 3.9, -0.6); g.add(vent);
    const hat = mcone(0.38, 0.3, 10, m.steel); hat.position.set(-1.2, 4.6, -0.6); g.add(hat);
    g.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(-15.4, -0.1, -7.6); g.rotation.y = 0.05; scene.add(g);
  })();

  /* café string lights from the bulkhead to the tower stand */
  (function festoonBK(){
    const g = new THREE.Group(), a = new V3(-13.2, 3.1, -6.0), b = new V3(12.6, 3.0, -5.6), N = 22;
    const pts = []; for (let i = 0; i <= 30; i++){ const t = i/30; pts.push(new V3(lerp(a.x, b.x, t), lerp(a.y, b.y, t) - 1.1*4*t*(1 - t), lerp(a.z, b.z, t))); }
    const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.018, 4, false), m.iron); g.add(wire);
    for (let i = 1; i < N; i++){
      const t = i/N, x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t) - 1.1*4*t*(1 - t), z = lerp(a.z, b.z, t);
      const bulb = msph(0.085, 10, m.bulb); bulb.position.set(x, y - 0.14, z); bulb.castShadow = false; g.add(bulb);
    }
    scene.add(mergeByMaterial(g));
  })();

  /* two long planters of grasses along the sides */
  (function planters(){
    const g = new THREE.Group();
    for (const sx of [-1, 1]){
      const box = mb(1.0, 0.9, 6.2, m.wood); box.position.set(sx*17.6, 0.35, 4.6); g.add(box);
      for (let i = 0; i < 26; i++){
        const h = rr(0.8, 1.6), blade = mcone(0.09, h, 4, i % 3 ? m.leafB : m.leafC);
        blade.position.set(sx*17.6 + rr(-0.35, 0.35), 0.8 + h/2, 4.6 + rr(-2.9, 2.9)); blade.rotation.set(rr(-0.25, 0.25), 0, rr(-0.25, 0.25)); g.add(blade);
      }
    }
    scene.add(mergeByMaterial(g));
  })();

  /* desk mat: slate felt, copper stitch */
  const feltBump = tileNoise(256, 32, 0.9); feltBump.repeat.set(0.9, 0.9);
  const felt = std(SET.board.mat, 0.98, 0, {bumpMap:feltBump, bumpScale:0.02});
  const mat = new THREE.Mesh(chamferBox(24.5, 0.06, 11.4, 0.6, 0.025), felt);
  mat.position.set(0, 0.03, 0.4); mat.receiveShadow = true; scene.add(mat);
  const stitch = new THREE.Mesh(chamferBox(24.1, 0.004, 11.0, 0.45, 0.001), std(SET.board.stitch, 0.9));
  stitch.position.set(0, 0.062, 0.4); scene.add(stitch);
  const inner = new THREE.Mesh(chamferBox(23.9, 0.006, 10.8, 0.4, 0.001), felt);
  inner.position.set(0, 0.063, 0.4); scene.add(inner);

  return {
    slab, mat, warmPos:new V3(0, 4.0, -6.4),
    applyTOD(){ m.bulb.emissiveIntensity = lampOn*2.4; doorLamp.emissiveIntensity = lampOn*2.6; },
    animate(){}
  };
}

/* ── the lane inside the board ──────────────────────────── */
function streetBrooklyn(){
  const m = brooklynMats(), villageStatic = new THREE.Group();
  const BODY = [[m.brown, 0.3], [m.brownD, 0.12], [m.brick, 0.24], [m.brickD, 0.14], [m.paint, 0.1], [m.cream, 0.1]];
  const pickBody = () => { let r = R(); for (const [mt, p] of BODY){ if ((r -= p) < 0) return mt; } return m.brown; };
  function miniTower(){
    const g = new THREE.Group();
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){ const l = mb(0.004, 0.045, 0.004, m.iron); l.position.set(sx*0.022, 0.022, sz*0.022); g.add(l); }
    const b = mc(0.034, 0.036, 0.06, 10, m.woodL); b.position.y = 0.075; g.add(b);
    const c = mcone(0.04, 0.03, 10, m.roof); c.position.y = 0.12; g.add(c);
    return g;
  }
  /* a rowhouse: brownstone with a stoop, or brick with a fire escape; a cornice on top */
  function rowhouse(w, d, h, o){
    const g = new THREE.Group(), body = pickBody(), brick = body === m.brick || body === m.brickD;
    const n = h > 0.44 ? 4 : 3, base = 0.035, fh = (h - base)/n, front = d/2 + 0.003;
    const b = mb(w, h, d, body); b.position.y = h/2; g.add(b);
    const nw = w > 0.42 ? 3 : 2, ww = w*0.15, wh = fh*0.5;
    const shop = o.shop && n >= 3;
    for (let f = 0; f < n; f++){
      if (f === 0 && shop) continue;
      for (let i = 0; i < nw; i++){
        const x = -w/2 + w*(i + 0.5)/nw, y = base + fh*(f + 0.55);
        if (f === 0 && !brick && i === nw - 1) continue;
        const pane = mb(ww, wh, 0.006, m.win); pane.position.set(x, y, front); g.add(pane);
        const lint = mb(ww*1.3, 0.011, 0.012, m.trim); lint.position.set(x, y + wh/2 + 0.008, front + 0.004); g.add(lint);
        const sill = mb(ww*1.15, 0.007, 0.014, m.trim); sill.position.set(x, y - wh/2 - 0.005, front + 0.005); g.add(sill);
      }
    }
    if (shop){
      const glass = mb(w*0.8, fh*0.62, 0.006, m.win); glass.position.set(0, base + fh*0.42, front); g.add(glass);
      const awn = mb(w*0.88, 0.006, 0.07, o.red ? m.awnR : m.awnG); awn.position.set(0, base + fh*0.92, front + 0.03); awn.rotation.x = 0.38; g.add(awn);
    } else if (!brick){
      /* the stoop up to the parlour floor */
      const dx = w/2 - w/(2*nw), th = base + fh*0.25;
      for (let i = 0; i < 3; i++){
        const st = mb(0.07, th*(i + 1)/3, 0.026, m.step); st.position.set(dx, th*(i + 1)/6, front + 0.013 + (2 - i)*0.026); g.add(st);
      }
      const door = mb(0.05, fh*0.62, 0.006, m.door); door.position.set(dx, th + fh*0.31, front); g.add(door);
      for (const s of [-1, 1]){ const rail = mb(0.004, 0.05, 0.004, m.iron); rail.position.set(dx + s*0.04, th*0.5 + 0.025, front + 0.07); g.add(rail); }
    } else {
      const door = mb(0.05, fh*0.66, 0.006, m.door); door.position.set(w/2 - 0.06, base + fh*0.33, front); g.add(door);
    }
    if (brick && !shop && n >= 3){
      /* fire escape: a landing and a ladder per floor above the street */
      const fx = -w*0.12, fw = w*0.46;
      for (let f = 1; f < n; f++){
        const y = base + fh*f + 0.004;
        const land = mb(fw, 0.005, 0.045, m.iron); land.position.set(fx, y, front + 0.024); g.add(land);
        const rail = mb(fw, 0.028, 0.003, m.iron); rail.position.set(fx, y + 0.014, front + 0.046); g.add(rail);
        if (f < n - 1){ const lad = mb(0.005, fh*1.12, 0.005, m.iron); lad.position.set(fx + (f % 2 ? 0.06 : -0.06), y + fh*0.5, front + 0.03); lad.rotation.z = f % 2 ? 0.55 : -0.55; g.add(lad); }
      }
    }
    const cor = mb(w + 0.016, 0.02, 0.028, body === m.cream || body === m.paint ? m.cornice : m.trim);
    cor.position.set(0, h - 0.008, front + 0.01); g.add(cor);
    if (o.tower){ const t = miniTower(); t.position.set(rr(-w/4, w/4), h, -d*0.18); g.add(t); }
    else if (R() < 0.4){ const ac = mb(0.05, 0.03, 0.04, m.steel); ac.position.set(rr(-w/3, w/3), h + 0.015, -d*0.2); g.add(ac); }
    return g;
  }
  function tree(){
    const g = new THREE.Group(), h = rr(0.26, 0.34);
    const t = mc(0.006, 0.009, h*0.7, 6, m.bark); t.position.y = h*0.35; g.add(t);
    for (let i = 0; i < 5; i++){
      const s = rr(0.05, 0.08), b = msph(s, 7, [m.leafA, m.leafB, m.leafC][(R()*3)|0]);
      b.position.set(rr(-0.04, 0.04), h*rr(0.75, 1.0), rr(-0.04, 0.04)); b.scale.y = 0.8; g.add(b);
    }
    return g;
  }
  function bistro(){
    const g = new THREE.Group();
    const top = mc(0.032, 0.032, 0.006, 12, m.trim); top.position.y = 0.05; g.add(top);
    const leg = mc(0.003, 0.003, 0.05, 5, m.iron); leg.position.y = 0.025; g.add(leg);
    for (const s of [-1, 1]){ const ch = mb(0.024, 0.03, 0.024, m.iron); ch.position.set(s*0.05, 0.015, 0); g.add(ch); }
    return g;
  }
  function hydrant(){
    const g = new THREE.Group();
    const b = mc(0.008, 0.01, 0.03, 8, m.hydrant); b.position.y = 0.015; g.add(b);
    const c = msph(0.009, 8, m.hydrant); c.position.y = 0.032; g.add(c);
    const box = mb(0.024, 0.04, 0.02, m.mailbox); box.position.set(0.05, 0.02, 0); g.add(box);
    return g;
  }
  for (let r = 0; r < 6; r++){
    const v = VOID[r], x0 = LX(v.L), x1 = LX(v.R), z0 = STRIP[r], z1 = STRIP[r+1], h = LIFT[r];
    const gr = mb(x1 - x0, h, z1 - z0, m.ground); gr.position.set((x0 + x1)/2, PLATE_TOP + h/2, (z0 + z1)/2); gr.castShadow = false; villageStatic.add(gr);
    if (r < 5){ const lx = laneXAt(STRIP[r+1]), nose = mb(1.0, 0.014, 0.05, m.step); nose.position.set(lx, groundTop(r) + 0.007, STRIP[r+1] - 0.025); villageStatic.add(nose); }
  }
  function inner(r, side, cx, zc){
    const gy = groundTop(r), roll = R();
    if (r >= 2 && roll < 0.32){
      const t = bistro(); t.position.set(cx, gy, zc); villageStatic.add(t);
      CAFES.push({x:cx, y:gy, z:zc, bench:false, side});
    } else if (roll < 0.74){ const t = tree(); t.position.set(cx, gy, zc); villageStatic.add(t); }
    else { const hy = hydrant(); hy.position.set(cx, gy, zc); hy.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2; villageStatic.add(hy); }
  }
  function fillBand(r, side, xWall, edgeOverride){
    const z0 = STRIP[r] + 0.05, z1 = STRIP[r+1] - 0.05;
    let z = z0;
    while (z < z1 - 0.22){
      const len = Math.min(rr(0.34, 0.48), z1 - z), zc = z + len/2;
      const edge = edgeOverride !== undefined ? edgeOverride : laneXAt(zc) + side*0.5;
      const bw = side < 0 ? edge - xWall : xWall - edge;
      if (bw > 0.22){
        const dep = Math.min(bw, rr(0.36, 0.56)), rowF = (5 - r)/5;
        const h = rr(lerp(0.32, 0.4, rowF), lerp(0.46, 0.58, rowF));
        const hs = rowhouse(len, dep, h, {shop:R() < 0.2, red:R() < 0.5, tower:h > 0.42 && R() < 0.3});
        hs.position.set(side < 0 ? xWall + dep/2 : xWall - dep/2, groundTop(r), zc); hs.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2;
        villageStatic.add(hs);
        const rem = bw - dep - 0.04;
        if (rem > 0.18) inner(r, side, side < 0 ? xWall + dep + 0.04 + rem/2 : xWall - dep - 0.04 - rem/2, zc);
      }
      z += len + 0.02;
    }
  }
  /* a brownstone church at the top of the lane, its bell in the steeple */
  function church(bells){
    const g = new THREE.Group();
    const nave = mb(0.34, 0.34, 0.62, m.brownD); nave.position.set(0, 0.17, -0.06); g.add(nave);
    const rg = new THREE.Group(); rg.rotation.y = Math.PI/2; rg.position.z = -0.06; g.add(rg);
    gableRoof(rg, 0.62, 0.34, 0.34, 0.9, m.slate, m.brownD, m.slate);
    const tower = mb(0.17, 0.66, 0.17, m.brown); tower.position.set(0, 0.33, 0.3); g.add(tower);
    for (const s of [-1, 1]){ const bt = mb(0.035, 0.66, 0.035, m.brownD); bt.position.set(s*0.095, 0.33, 0.39); g.add(bt); }
    const belfry = mb(0.13, 0.08, 0.004, m.door); belfry.position.set(0, 0.56, 0.387); g.add(belfry);
    const rose = mc(0.045, 0.045, 0.006, 16, m.rose); rose.rotation.x = Math.PI/2; rose.position.set(0, 0.42, 0.388); g.add(rose);
    const door = mb(0.07, 0.12, 0.006, m.door); door.position.set(0, 0.06, 0.388); g.add(door);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.46, 4, 1), m.slate); spire.rotation.y = Math.PI/4; spire.position.set(0, 0.89, 0.3); spire.castShadow = true; g.add(spire);
    const cross = mb(0.006, 0.05, 0.006, m.steel); cross.position.set(0, 1.14, 0.3); g.add(cross);
    const arm = mb(0.028, 0.006, 0.006, m.steel); arm.position.set(0, 1.15, 0.3); g.add(arm);
    const bl = new THREE.Group(); bl.position.set(0, 0.6, 0.3);
    const bell = mcone(0.03, 0.04, 10, std('#7C6A45', 0.4, 0.6)); bell.position.y = -0.03; bl.add(bell);
    bells.push(bl); g.add(bl);
    return g;
  }
  const dyn = new THREE.Group(); deck.add(dyn);
  for (let r = 0; r < 6; r++){
    const v = VOID[r];
    fillBand(r, -1, LX(v.L) + 0.04);
    if (r === 0){
      const edge = laneXAt((STRIP[0] + STRIP[1])/2) + 0.5, xr = LX(v.R) - 0.04;
      const bells = [], c = church(bells);
      c.scale.setScalar(1.15); c.position.set(edge + 0.48, groundTop(0), (STRIP[0] + STRIP[1])/2); c.rotation.y = -Math.PI/2 + 0.08;
      const bellDyn = new THREE.Group();
      for (const b of bells){ c.remove(b); bellDyn.add(b); BELLS.push(b); }
      villageStatic.add(c);
      bellDyn.position.copy(c.position); bellDyn.rotation.copy(c.rotation); bellDyn.scale.copy(c.scale); dyn.add(bellDyn);
      fillBand(0, 1, xr, edge + 0.95);
    } else fillBand(r, 1, LX(v.R) - 0.04);
  }
  /* street lamps along the lane, each lighting on its own */
  [0.1, 0.27, 0.44, 0.61, 0.78, 0.93].forEach((t, i) => {
    const p = lane.getPointAt(t), side = i % 2 ? 1 : -1, x = p.x + side*0.42, gy = groundTop(rowAt(p.z));
    const glass = new THREE.MeshStandardMaterial({color:col('#F1E3C6'), emissive:col('#FFB55E'), emissiveIntensity:0, roughness:0.6});
    const g = new THREE.Group();
    const post = mb(0.01, 0.26, 0.01, m.iron); post.position.y = 0.13; g.add(post);
    const arm = mb(0.07, 0.006, 0.006, m.iron); arm.position.set(-side*0.03, 0.26, 0); g.add(arm);
    const head = mb(0.03, 0.022, 0.03, glass); head.position.set(-side*0.06, 0.245, 0); g.add(head);
    g.position.set(x, gy, p.z); villageStatic.add(g);
    LAMPS.push({mat:glass, th:0.47 + i*0.012, pos:new V3(x - side*0.06, gy + 0.245, p.z)});
  });
  /* bluestone paving */
  const N = 150, slab = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.016, 0.034), new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.9}), N);
  slab.frustumCulled = false; slab.receiveShadow = true;
  const d = new THREE.Object3D(), tones = ['#7C8590','#8E959C','#6F7881','#9AA0A6','#858C93'].map(col);
  for (let i = 0; i < N; i++){
    const t = i/(N - 1), p = lane.getPointAt(t), tg = lane.getTangentAt(t);
    d.position.set(p.x, groundTop(rowAt(p.z)) + 0.008, p.z); d.rotation.set(0, Math.atan2(tg.x, tg.z), 0);
    d.scale.set(0.86 + 0.08*Math.sin(t*9), 1, 1); d.updateMatrix();
    slab.setMatrixAt(i, d.matrix); slab.setColorAt(i, tones[(R()*tones.length)|0]);
  }
  deck.add(slab);
  /* café lights strung across the lane */
  [0.33, 0.66].forEach(t => {
    const p = lane.getPointAt(t), y = groundTop(rowAt(p.z)) + 0.42;
    const wire = mb(1.06, 0.003, 0.003, m.iron); wire.position.set(p.x, y, p.z); wire.castShadow = false; villageStatic.add(wire);
    for (let k = 0; k < 7; k++){ const b = msph(0.011, 8, m.bulb); b.position.set(p.x - 0.45 + k*0.15, y - 0.02 - 0.03*Math.sin(Math.PI*k/6), p.z); b.castShadow = false; villageStatic.add(b); }
  });
  const merged = mergeByMaterial(villageStatic);
  deck.add(merged);
  return {
    merged,
    applyTOD(){ m.win.emissiveIntensity = lampOn*2.0; m.rose.emissiveIntensity = lampOn*2.2; },
    animate(){}
  };
}
