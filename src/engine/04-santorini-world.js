/* ════════════════════════════════════════════════════════════
   SANTORINI — the caldera, the town on its rim, the sea far below
   ════════════════════════════════════════════════════════════ */
const SEA_VS = `
varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SEA_FS = `
uniform float uTime;
uniform vec3 uTop;
uniform vec3 uHor;
uniform vec3 uSea;
uniform vec3 uSunCol;
uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform float uSunVis;
uniform float uNight;
varying vec3 vW;
vec2 wv(vec2 p, vec2 dir, float f, float a, float s){
  float ph = dot(p, dir) * f + uTime * s;
  return dir * cos(ph) * f * a;
}
void main(){
  vec2 p = vW.xz;
  vec2 g = wv(p, vec2(0.287, 0.958), 0.045, 0.9, 0.7);
  g += wv(p, vec2(-0.759, 0.651), 0.09, 0.45, 1.1);
  g += wv(p, vec2(0.976, -0.217), 0.19, 0.2, 1.7);
  g += wv(p, vec2(-0.196, -0.981), 0.41, 0.09, 2.5);
  g += wv(p, vec2(0.6, 0.8), 0.83, 0.045, 3.4);
  float dist = length(cameraPosition.xz - vW.xz);
  float fl = smoothstep(120.0, 1400.0, dist);
  vec3 N = normalize(vec3(-g.x * (1.0 - fl), 1.0, -g.y * (1.0 - fl)));
  vec3 V = normalize(cameraPosition - vW);
  vec3 Rf = reflect(-V, N);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 skyc = mix(uHor, uTop, smoothstep(0.0, 0.55, max(Rf.y, 0.0)));
  vec3 c = mix(uSea, skyc, fres);
  float s = max(dot(Rf, uSunDir), 0.0);
  c += uSunCol * (pow(s, 420.0) * 6.0 + pow(s, 30.0) * 0.12) * uSunVis;
  float m = max(dot(Rf, uMoonDir), 0.0);
  c += vec3(0.82, 0.88, 1.0) * pow(m, 320.0) * 2.4 * uNight;
  c = mix(c, uHor, smoothstep(300.0, 3200.0, dist));
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
function worldSantorini(){
const seaU = {
  uTime:{value:0}, uTop:skyU.uTop, uHor:skyU.uHor, uSunCol:skyU.uSunCol, uSunDir:skyU.uSunDir,
  uMoonDir:skyU.uMoonDir, uSunVis:skyU.uSunVis, uNight:skyU.uNight, uSea:{value:new THREE.Color()}
};
const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000),
  new THREE.ShaderMaterial({uniforms:seaU, vertexShader:SEA_VS, fragmentShader:SEA_FS, fog:false}));
sea.geometry.rotateX(-Math.PI/2);
sea.position.y = SEA_Y; sea.frustumCulled = false;
scene.add(sea);

/* ════════════════════════════════════════════════════════════
   THE CALDERA — a striped volcanic cliff with the town on its rim
   ════════════════════════════════════════════════════════════ */
const CAL = {x:-12, z:-212, R:196};
function landH(x, z){
  const dx = x - CAL.x, dz = z - CAL.z, e = Math.sqrt(dx*dx + dz*dz) - CAL.R;
  const n = fbm(x*0.045, z*0.045);
  if (e >= 0) return -1.4 + n*0.8 + Math.min(e, 80)*0.035;
  const drop = -e;
  const y = -1.4 - Math.pow(drop, 1.12)*3.6 + n*2.6*smooth(0, 8, drop);
  return Math.max(y, SEA_Y - 6);
}
(function terrain(){
  const S = 620, N = 150, g = new THREE.PlaneGeometry(S, S, N, N);
  g.rotateX(-Math.PI/2); g.translate(-40, 0, -60);
  const p = g.attributes.position, c = new Float32Array(p.count*3), tmp = new THREE.Color();
  const bands = ['#3F322B','#8F4F36','#B88B63','#2C2420','#A86B46','#6B4A3A'].map(col);
  const topC = col('#8E7558'), crust = col('#D6CBBB');
  for (let i = 0; i < p.count; i++){
    const x = p.getX(i), z = p.getZ(i), y = landH(x, z);
    p.setY(i, y);
    if (y > -3.2){ tmp.copy(topC).lerp(crust, (vnoise(x*0.2, z*0.2)*0.5 + 0.5)*0.4); }
    else {
      const b = Math.floor(-y*0.085 + vnoise(x*0.04, z*0.04)*0.8);
      tmp.copy(bands[((b % bands.length) + bands.length) % bands.length]).multiplyScalar(0.82 + R()*0.3);
    }
    c[i*3] = tmp.r; c[i*3+1] = tmp.g; c[i*3+2] = tmp.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({vertexColors:true, roughness:1, flatShading:true}));
  scene.add(m);
})();

/* the town spilling down the rim on both sides of the terrace */
const townLights = GLOWS;
(function town(){
  const spots = [];
  for (let i = 0; i < 92; i++){
    const left = i < 68;
    const th = left ? rr(-0.44, -0.095) : rr(0.11, 0.3);
    const drop = rr(-3, 13) * (left ? 1 : 0.8);
    const rad = CAL.R - drop;
    const x = CAL.x + rad*Math.sin(th), z = CAL.z + rad*Math.cos(th);
    if (Math.abs(x) < 22 && z > -16) continue;
    spots.push({x, z, y: landH(x, z), th});
  }
  const box = new THREE.BoxGeometry(1,1,1);
  const houses = new THREE.InstancedMesh(box, std('#F4F1EA', 0.9), spots.length);
  houses.frustumCulled = false;
  const domes = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI*2, 0, Math.PI/2), std('#2C6DAA', 0.4), spots.length);
  domes.frustumCulled = false;
  const d = new THREE.Object3D(), tint = new THREE.Color(); let nd = 0;
  const lights = [];
  spots.forEach((s, i) => {
    const w = rr(3, 7), h = rr(2.6, 5), dp = rr(3, 6);
    d.position.set(s.x, s.y + h/2 - 0.6, s.z);
    d.rotation.set(0, Math.atan2(CAL.x - s.x, CAL.z - s.z), 0);
    d.scale.set(w, h, dp); d.updateMatrix();
    houses.setMatrixAt(i, d.matrix);
    houses.setColorAt(i, tint.setRGB(1, 1, 1).multiplyScalar(rr(0.9, 1.04)));
    if (R() < 0.13){
      const r = Math.min(w, dp)*0.4;
      d.position.y = s.y + h - 0.6; d.scale.set(r, r, r); d.updateMatrix();
      domes.setMatrixAt(nd++, d.matrix);
    }
    const fx = Math.sin(d.rotation.y), fz = Math.cos(d.rotation.y);
    for (let k = 0, nk = 1 + ((R()*2.4)|0); k < nk; k++){
      const off = rr(-w*0.3, w*0.3);
      lights.push(s.x + fx*dp*0.52 + fz*off, s.y + rr(0.4, h*0.8) - 0.6, s.z + fz*dp*0.52 - fx*off);
    }
  });
  domes.count = nd;
  scene.add(houses, domes);
  const sizes = []; for (let i = 0; i < lights.length/3; i++) sizes.push(rr(1.6, 3.2));
  const pts = glowPoints(lights, sizes, '#FFC27A');
  scene.add(pts); townLights.push(pts);
})();

/* far islands across the caldera, hazed into the horizon */
const islandMats = [];
(function islands(){
  function ridge(z, x0, x1, h, seed, dark){
    const s = new THREE.Shape(), N = 70;
    s.moveTo(x0, SEA_Y - 4);
    const tops = [];
    for (let i = 0; i <= N; i++){
      const t = i/N, x = lerp(x0, x1, t), e = Math.pow(Math.sin(t*Math.PI), 0.55);
      const y = SEA_Y + h*e*(0.78 + 0.22*fbm(x*0.012 + seed, seed));
      s.lineTo(x, y); tops.push(x, y);
    }
    s.lineTo(x1, SEA_Y - 4);
    const m = new THREE.MeshBasicMaterial({color:0xffffff, side:THREE.DoubleSide});
    m.userData.dark = dark;
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(s), m);
    mesh.position.z = z; scene.add(mesh); islandMats.push(m);
    return tops;
  }
  const t1 = ridge(-620, -560, -70, 72, 1.3, 0);
  ridge(-720, 140, 560, 46, 4.1, 0.12);
  ridge(-330, 70, 250, 20, 7.7, 0.45);
  const lights = [];
  for (let i = 0; i < t1.length; i += 2){
    if (R() < 0.55) continue;
    lights.push(t1[i] + rr(-3, 3), t1[i+1] - rr(0.5, 4), -618);
  }
  const p = glowPoints(lights, null, '#FFC888'); scene.add(p); townLights.push(p);
})();

/* a cruise ship crossing the caldera, lit at night */
const ship = (function(){
  const g = new THREE.Group();
  const hull = new THREE.Mesh(chamferBox(30, 4.2, 5.4, 1.4, 0.5), std('#F2F2EE', 0.6));
  hull.position.y = 2; g.add(hull);
  const deckB = new THREE.Mesh(chamferBox(20, 3, 4.4, 0.8, 0.3), std('#F7F7F2', 0.6));
  deckB.position.set(-2, 5.4, 0); g.add(deckB);
  const funnel = new THREE.Mesh(chamferBox(2.2, 3, 2.2, 0.5, 0.2), std('#1F3E73', 0.5));
  funnel.position.set(4, 8.2, 0); g.add(funnel);
  const winMat = new THREE.MeshStandardMaterial({color:col('#1C2333'), emissive:col('#FFD08C'), emissiveIntensity:0});
  for (const [y, w, x] of [[2.8, 27, 0], [5.6, 18, -2]]){
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, 5.5), winMat);
    strip.position.set(x, y, 0); g.add(strip);
  }
  g.position.set(-260, SEA_Y, -340);
  g.scale.setScalar(1.3);
  scene.add(g);
  return {g, winMat, x:-260};
})();

  return {
    zoom:[],
    applyTOD(P){
      seaU.uSea.value.copy(P.sea);
      ship.winMat.emissiveIntensity = lampOn*2.4;
      for (const m of islandMats) m.color.copy(P.isl).multiplyScalar(1 - m.userData.dark);
    },
    animate(dt){
      seaU.uTime.value = T;
      sea.position.x = camera.position.x; sea.position.z = camera.position.z;
      ship.x += dt*1.5; if (ship.x > 320) ship.x = -320;
      ship.g.position.x = ship.x; ship.g.position.y = SEA_Y + Math.sin(T*0.6)*0.15;
    }
  };
}
function platformSantorini(){
/* ════════════════════════════════════════════════════════════
   THE TERRACE — whitewash, a parapet, string lights, bougainvillea
   ════════════════════════════════════════════════════════════ */
const stuccoBump = tileNoise(256, 16, 0.5); stuccoBump.repeat.set(0.22, 0.22);
const feltBump   = tileNoise(256, 32, 0.9); feltBump.repeat.set(0.9, 0.9);
const MAT_TERRACE = std('#F2EFE8', 0.94, 0, {bumpMap:stuccoBump, bumpScale:0.035});
const terraceSlab = new THREE.Mesh(chamferBox(38, 4, 25, 0.5, 0.14), MAT_TERRACE);
terraceSlab.position.set(0, -2, 2); terraceSlab.receiveShadow = true;
scene.add(terraceSlab);
(function parapet(){
  const wall = new THREE.Mesh(chamferBox(37, 1.0, 0.62, 0.24, 0.08), MAT_TERRACE);
  wall.position.set(0, 0.5, -10.05); wall.castShadow = wall.receiveShadow = true; scene.add(wall);
  const cap = new THREE.Mesh(chamferBox(37.4, 0.13, 0.86, 0.3, 0.05), MAT_TERRACE);
  cap.position.set(0, 1.065, -10.05); cap.castShadow = cap.receiveShadow = true; scene.add(cap);
})();

const festoon = {bulbs:null, mat:null};
(function stringLights(){
  const poleM = std('#2B2A2D', 0.5, 0.6);
  const H = 5.4, X = 16.6, Z = -9.55, sag = 1.9;
  for (const sx of [-1, 1]){
    const p = mc(0.06, 0.07, H, 10, poleM); p.position.set(sx*X, H/2, Z); scene.add(p);
  }
  const pts = [];
  for (let i = 0; i <= 60; i++){ const t = i/60, x = lerp(-X, X, t); pts.push(new V3(x, H - 0.15 - sag*(1 - Math.pow(x/X, 2)), Z)); }
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.016, 5, false), poleM);
  scene.add(wire);
  const N = 28;
  festoon.mat = new THREE.MeshStandardMaterial({color:col('#FFE2B8'), emissive:col('#FFB566'), emissiveIntensity:0, roughness:0.3});
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 10, 8), festoon.mat, N);
  bulbs.frustumCulled = false;
  const d = new THREE.Object3D();
  for (let i = 0; i < N; i++){
    const t = (i + 0.5)/N, x = lerp(-X, X, t);
    d.position.set(x, H - 0.15 - sag*(1 - Math.pow(x/X, 2)) - 0.16, Z); d.updateMatrix();
    bulbs.setMatrixAt(i, d.matrix);
  }
  scene.add(bulbs); festoon.bulbs = bulbs;
})();

(function bougainvillea(){
  const root = new THREE.Group();
  const bloom = std('#D2447F', 0.8), bloom2 = std('#E5679B', 0.8), leaf = std('#46663A', 1);
  const trunk = mc(0.07, 0.11, 1.6, 7, std('#5B4430', 0.9)); trunk.position.set(-15.6, 0.8, -9.6); trunk.rotation.z = 0.12; root.add(trunk);
  for (let i = 0; i < 120; i++){
    const a = R(), x = -16.8 + Math.pow(a, 0.8)*6.2, spill = R() < 0.45;
    const y = spill ? rr(0.15, 1.1) : rr(1.1, 2.0) - (x + 16.8)*0.08;
    const z = spill ? rr(-9.75, -9.6) : rr(-10.5, -9.6);
    const s = msph(rr(0.08, 0.17)*(1 - (x + 16.8)/9), 7, R() < 0.25 ? leaf : (R() < 0.5 ? bloom : bloom2));
    s.position.set(x, y, z); s.scale.y = 0.75; root.add(s);
  }
  scene.add(mergeByMaterial(root));
})();

/* desk mat: navy felt with a stitched edge */
const matMesh = new THREE.Mesh(chamferBox(24.5, 0.06, 11.4, 0.6, 0.025), std(SET.board.mat, 0.98, 0, {bumpMap:feltBump, bumpScale:0.02}));
matMesh.position.set(0, 0.03, 0.4); matMesh.receiveShadow = true; scene.add(matMesh);
const stitch = new THREE.Mesh(chamferBox(24.1, 0.004, 11.0, 0.45, 0.001), std(SET.board.stitch, 0.9));
stitch.position.set(0, 0.062, 0.4); scene.add(stitch);
const stitchIn = new THREE.Mesh(chamferBox(23.9, 0.006, 10.8, 0.4, 0.001), std(SET.board.mat, 0.98, 0, {bumpMap:feltBump, bumpScale:0.02}));
stitchIn.position.set(0, 0.063, 0.4); scene.add(stitchIn);

  return {
    slab:terraceSlab, mat:matMesh, warmPos:new V3(0, 4.3, -7.2),
    applyTOD(){ festoon.mat.emissiveIntensity = lampOn*3.2; },
    animate(){}
  };
}
