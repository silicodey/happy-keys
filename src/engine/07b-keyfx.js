/* ════════════════════════════════════════════════════════════
   KEY EFFECTS — the board becomes part of the place
   Brooklyn: an elevated train loops the board, a riveted case, keys
   that light up like apartment windows. Lofoten: snow on the keys that
   you knock off by typing, icicles on the case, aurora rolling across.
   ════════════════════════════════════════════════════════════ */
const KEYFX = (function(){
  const mode = META.street === 'brooklyn' ? 'brooklyn' : META.street === 'lofoten' ? 'lofoten' : null;
  const none = {step(){}};
  if (!mode) return none;

  /* a per-key emissive colour, added on top of the keycap material */
  const plain = KEYS.filter(k => k.mesh);
  const glowAttr = new Map();
  for (const mesh of keyMeshes){
    mesh.geometry = mesh.geometry.clone();
    const a = new THREE.InstancedBufferAttribute(new Float32Array(mesh.count*3), 3); a.setUsage(THREE.DynamicDrawUsage);
    mesh.geometry.setAttribute('aGlow', a); glowAttr.set(mesh, a);
  }
  for (const mt of [MAT_ALPHA, MAT_MOD]){
    mt.onBeforeCompile = sh => {
      sh.vertexShader = 'attribute vec3 aGlow;\nvarying vec3 vGlow;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvGlow = aGlow;');
      sh.fragmentShader = 'varying vec3 vGlow;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += vGlow;');
    };
    mt.needsUpdate = true;
  }
  const setGlow = (k, r, g, b) => glowAttr.get(k.mesh).setXYZ(k.idx, r, g, b);
  const flushGlow = () => { for (const a of glowAttr.values()) a.needsUpdate = true; };

  return mode === 'brooklyn' ? brooklynFX() : lofotenFX();

  function brooklynFX(){
    /* rivets along the front and sides of the case, like the bridge's girders */
    (function rivets(){
      const pts = [];
      for (let x = -9.4; x <= 9.41; x += 0.42) for (const y of [0.24, 0.72]) pts.push([x, MAT_TOP + y, CASE.D/2 + 0.004, 0]);
      for (let z = -3.4; z <= 3.41; z += 0.42) for (const sx of [-1, 1]) pts.push([sx*(CASE.W/2 + 0.004), MAT_TOP + 0.3, z, sx]);
      const geo = new THREE.SphereGeometry(0.034, 8, 5, 0, Math.PI*2, 0, Math.PI/2); geo.rotateX(Math.PI/2);
      const r = new THREE.InstancedMesh(geo, std('#2A2D31', 0.4, 0.8), pts.length), d = new THREE.Object3D();
      pts.forEach(([x, y, z, sx], i) => { d.position.set(x, y, z); d.rotation.set(0, sx ? sx*Math.PI/2 : 0, 0); d.updateMatrix(); r.setMatrixAt(i, d.matrix); });
      r.userData.board = true; scene.add(r);
    })();

    /* the el: a loop on the mat in front, climbing at the sides onto a trestle behind the board */
    const loop = (function(){
      const pts = [], X = 10.9, ZF = 4.75, ZB = -4.95, rc = 1.1, N = 96;
      const perim = []; /* rounded rectangle, counter-clockwise from the front right */
      const seg = (ax, az, bx, bz, n) => { for (let i = 0; i < n; i++){ const t = i/n; perim.push([lerp(ax, bx, t), lerp(az, bz, t)]); } };
      const arc = (cx, cz, a0, n) => { for (let i = 0; i < n; i++){ const a = a0 + (Math.PI/2)*i/n; perim.push([cx + Math.cos(a)*rc, cz + Math.sin(a)*rc]); } };
      seg(X, ZB + rc, X, ZF - rc, 10); arc(X - rc, ZF - rc, 0, 6);
      seg(X - rc, ZF, -X + rc, ZF, 22); arc(-X + rc, ZF - rc, Math.PI/2, 6);
      seg(-X, ZF - rc, -X, ZB + rc, 10); arc(-X + rc, ZB + rc, Math.PI, 6);
      seg(-X + rc, ZB, X - rc, ZB, 22); arc(X - rc, ZB + rc, -Math.PI/2, 6);
      for (const [x, z] of perim) pts.push(new V3(x, lerp(0.2, 2.15, smooth(3.4, -3.9, z)), z));
      return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.3);
    })();
    const LEN = loop.getLength();
    (function track(){
      const g = new THREE.Group(), steel = std('#3A3D42', 0.5, 0.7), tie = std('#4A3A2E', 0.9);
      for (const off of [-0.11, 0.11]){
        const pts = [];
        for (let i = 0; i <= 240; i++){
          const t = i/240, p = loop.getPointAt(t % 1), tg = loop.getTangentAt(t % 1), nx = tg.z, nz = -tg.x, nl = Math.hypot(nx, nz) || 1;
          pts.push(new V3(p.x + nx/nl*off, p.y, p.z + nz/nl*off));
        }
        g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 300, 0.022, 5, true), steel));
      }
      const nT = Math.floor(LEN/0.28), ties = new THREE.InstancedMesh(new THREE.BoxGeometry(0.36, 0.035, 0.07), tie, nT), d = new THREE.Object3D();
      for (let i = 0; i < nT; i++){
        const t = i/nT, p = loop.getPointAt(t), tg = loop.getTangentAt(t);
        d.position.set(p.x, p.y - 0.03, p.z); d.lookAt(p.x + tg.x, p.y + tg.y, p.z + tg.z); d.updateMatrix(); ties.setMatrixAt(i, d.matrix);
      }
      ties.userData.board = true; ties.castShadow = true; scene.add(ties);
      /* trestle bents wherever the track is up off the mat */
      for (let i = 0; i < 46; i++){
        const t = i/46, p = loop.getPointAt(t);
        if (p.y < 0.55) continue;
        const tg = loop.getTangentAt(t), nx = tg.z, nz = -tg.x, nl = Math.hypot(nx, nz) || 1, h = p.y - 0.06;
        for (const s of [-1, 1]){ const post = mb(0.05, h, 0.05, steel); post.position.set(p.x + nx/nl*0.2*s, 0.06 + h/2, p.z + nz/nl*0.2*s); g.add(post); }
        const cap = mb(0.5, 0.05, 0.06, steel); cap.position.set(p.x, p.y - 0.07, p.z); cap.lookAt(p.x + nx, p.y - 0.07, p.z + nz); cap.rotateY(Math.PI/2); g.add(cap);
        if (h > 0.9){ const brace = mb(0.03, h*0.9, 0.03, steel); brace.position.set(p.x, 0.06 + h/2, p.z); brace.lookAt(p.x + nx, 0.06 + h/2, p.z + nz); brace.rotateX(0.5); g.add(brace); }
      }
      const merged = mergeByMaterial(g);
      merged.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
      merged.userData.board = true; scene.add(merged);
    })();
    const winMat = new THREE.MeshStandardMaterial({color:col('#2A3038'), emissive:col('#FFE2AE'), emissiveIntensity:0.15, roughness:0.3});
    const headMat = new THREE.MeshStandardMaterial({color:col('#FFFFFF'), emissive:col('#FFF4D8'), emissiveIntensity:0.6});
    const cars = [];
    for (let i = 0; i < 4; i++){
      const g = new THREE.Group(), body = std('#B9BFC7', 0.32, 0.85);
      const b = mb(0.34, 0.3, 1.18, body); b.position.y = 0.2; g.add(b);
      const roofC = mb(0.3, 0.05, 1.12, std('#8E959E', 0.4, 0.6)); roofC.position.y = 0.375; g.add(roofC);
      const strip = mb(0.346, 0.09, 1.0, winMat); strip.position.y = 0.25; g.add(strip);
      const band = mb(0.346, 0.025, 1.12, std('#C2402F', 0.5)); band.position.y = 0.14; g.add(band);
      if (i === 0) for (const s of [-1, 1]){ const hl = mb(0.06, 0.04, 0.02, headMat); hl.position.set(s*0.1, 0.12, 0.6); g.add(hl); }
      for (const s of [-0.38, 0.38]){ const bogie = mb(0.26, 0.06, 0.28, std('#1E1F22', 0.6, 0.4)); bogie.position.set(0, 0.04, s); g.add(bogie); }
      const merged = mergedAt(g); merged.userData.board = true; scene.add(merged); cars.push(merged);
    }
    let u = 0.2;
    const SPACING = 1.3/LEN;
    function stepTrain(dt){
      u = (u + dt*1.7/LEN) % 1;
      cars.forEach((c, i) => {
        const t = ((u - i*SPACING) % 1 + 1) % 1, p = loop.getPointAt(t), a = loop.getPointAt((t + 0.004) % 1);
        c.position.copy(p); c.lookAt(a.x, a.y, a.z);
      });
    }

    /* windows: after dusk, keys light up and go dark like the flats across the street */
    const st = plain.map(k => ({k, on:R() < 0.4, v:0, th:rr(0.1, 0.9), next:rr(2, 30), warm:R() < 0.8}));
    function stepWindows(dt){
      for (const s of st){
        s.next -= dt; if (s.next <= 0){ s.on = !s.on; s.next = s.on ? rr(6, 40) : rr(4, 26); }
        const want = s.on && lampOn > s.th ? 1 : 0;
        s.v += (want - s.v)*(1 - Math.exp(-6*dt));
        const a = s.v*0.42*(s.k.kind === 'm' ? 1.25 : 0.8);
        if (s.warm) setGlow(s.k, a, a*0.68, a*0.32); else setGlow(s.k, a*0.7, a*0.8, a);
      }
      flushGlow();
    }
    stepTrain(0);
    return {step(dt){ stepTrain(dt); stepWindows(dt); winMat.emissiveIntensity = 0.15 + lampOn*1.9; headMat.emissiveIntensity = 0.6 + lampOn*2; }};
  }

  function lofotenFX(){
    /* snow drifted onto the back of each keycap */
    const snowMat = std('#F2F6FA', 0.85, 0, {envMapIntensity:0.4});
    const geo = new THREE.SphereGeometry(0.5, 14, 8, 0, Math.PI*2, 0, Math.PI/2);
    const snow = new THREE.InstancedMesh(geo, snowMat, plain.length);
    snow.frustumCulled = false; snow.castShadow = false; snow.receiveShadow = true; snow.renderOrder = 1;
    deck.add(snow);
    const S = plain.map((k, i) => ({k, i, max:rr(0.65, 1.15), amt:1, local:new THREE.Matrix4(), dirty:true}));
    const _mm = new THREE.Matrix4(), _mk = new THREE.Matrix4(), _pp = new V3(), _ss = new V3(), _qq = new THREE.Quaternion();
    function place(s){
      const k = s.k, a = s.amt*s.max, w = (CAP.unit + k.w - 1)*0.8;
      _pp.set(0, CAP.H - CAP.dish - 0.004, -0.14);
      _ss.set(Math.max(0.001, w*(0.6 + 0.4*s.amt)), Math.max(0.001, 0.13*a), Math.max(0.001, 0.4*(0.5 + 0.5*s.amt)));
      _mm.compose(_pp, _qq, _ss);
      keyMatrix(k, _mk); _mk.multiply(_mm); snow.setMatrixAt(s.i, _mk);
    }
    S.forEach(place); snow.instanceMatrix.needsUpdate = true;
    const byKey = new Map(S.map(s => [s.k, s]));

    /* the puff when a key knocks its snow off */
    const puff = (function(){
      const n = 90, pos = new Float32Array(n*3).fill(-50), vel = new Float32Array(n*3), life = new Float32Array(n);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({size:0.05, color:0xffffff, transparent:true, opacity:0.9, depthWrite:false}));
      pts.frustumCulled = false; deck.add(pts);
      let head = 0;
      return {
        burst(k){
          for (let j = 0; j < 10; j++){
            const i = head; head = (head + 1) % n;
            pos[i*3] = k.x + rr(-0.25, 0.25); pos[i*3+1] = KEY_BASE + CAP.H*k.sy; pos[i*3+2] = k.z - 0.1 + rr(-0.15, 0.15);
            vel[i*3] = rr(-0.5, 0.5); vel[i*3+1] = rr(0.6, 1.4); vel[i*3+2] = rr(-0.5, 0.3); life[i] = rr(0.5, 0.9);
          }
        },
        step(dt){
          let any = false;
          for (let i = 0; i < n; i++){
            if (life[i] <= 0) continue;
            any = true; life[i] -= dt; vel[i*3+1] -= 3.2*dt;
            pos[i*3] += vel[i*3]*dt; pos[i*3+1] += vel[i*3+1]*dt; pos[i*3+2] += vel[i*3+2]*dt;
            if (life[i] <= 0) pos[i*3+1] = -50;
          }
          if (any) g.attributes.position.needsUpdate = true;
        }
      };
    })();

    /* icicles hanging from the front lip of the case */
    (function icicles(){
      const n = 64, ice = new THREE.MeshStandardMaterial({color:col('#DCEBF7'), roughness:0.12, metalness:0.05, transparent:true, opacity:0.78, envMapIntensity:1.6});
      const geo = new THREE.ConeGeometry(1, 1, 6); geo.rotateX(Math.PI); geo.translate(0, -0.5, 0);
      const mesh = new THREE.InstancedMesh(geo, ice, n), d = new THREE.Object3D();
      for (let i = 0; i < n; i++){
        const x = -9.5 + 19*(i + R()*0.6)/n, len = 0.1 + Math.pow(R(), 2)*0.5, r = 0.025 + len*0.06;
        d.position.set(x, MAT_TOP + CASE.hf - 0.04, CASE.D/2 + 0.035); d.scale.set(r, len, r); d.rotation.set(0, R()*3, 0); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
      }
      mesh.userData.board = true; mesh.castShadow = false; scene.add(mesh);
      const lip = mb(CASE.W - 0.3, 0.05, 0.12, std('#F2F6FA', 0.85)); lip.position.set(0, MAT_TOP + CASE.hf + 0.005, CASE.D/2 - 0.03); lip.castShadow = false; lip.userData.board = true; scene.add(lip);
    })();

    const green = new THREE.Color(0.18, 1.0, 0.55), violet = new THREE.Color(0.62, 0.25, 0.9), _c = new THREE.Color();
    return {step(dt){
      /* snow: knocked off by a press, drifting back over half a minute */
      let moved = false;
      for (const s of S){
        const k = s.k;
        if ((k.down || k.p > 0.45) && s.amt > 0.3){ s.amt = 0; puff.burst(k); moved = true; }
        else if (s.amt < 1){ s.amt = Math.min(1, s.amt + dt/28); moved = true; }
        if (moved || ACTIVE.has(k)) place(s);
      }
      if (moved || ACTIVE.size) snow.instanceMatrix.needsUpdate = true;
      puff.step(dt);
      /* aurora: bands of green and violet rolling across the board after dark */
      const on = smooth(0.56, 0.86, tod);
      for (const k of plain){
        if (on <= 0.001){ setGlow(k, 0, 0, 0); continue; }
        const w = Math.sin(k.x*0.55 - k.z*0.35 - T*0.7) * 0.5 + 0.5, w2 = Math.sin(k.x*0.21 + T*0.33 + 1.7)*0.5 + 0.5;
        const a = Math.pow(w, 3)*on*0.55*(0.4 + 0.6*w2);
        _c.copy(green).lerp(violet, smooth(0.55, 1, w2)).multiplyScalar(a);
        setGlow(k, _c.r, _c.g, _c.b);
      }
      flushGlow();
    }};
  }
})();
