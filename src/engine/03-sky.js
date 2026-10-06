/* ════════════════════════════════════════════════════════════
   SKY
   ════════════════════════════════════════════════════════════ */
const skyU = {
  uTop:{value:new THREE.Color()}, uHor:{value:new THREE.Color()}, uSunCol:{value:new THREE.Color()},
  uSunDir:{value:SUN_DIR}, uMoonDir:{value:MOON_DIR}, uSunVis:{value:1}, uNight:{value:0}, uGlow:{value:1}, uCity:{value:new THREE.Color(0, 0, 0)}
};
const SKY_VS = `
varying vec3 vDir;
void main(){
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SKY_FS = `
uniform vec3 uTop;
uniform vec3 uHor;
uniform vec3 uSunCol;
uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform float uSunVis;
uniform float uNight;
uniform float uGlow;
uniform vec3 uCity;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 c = mix(uHor, uTop, pow(smoothstep(-0.02, 0.6, h), 0.55));
  c = mix(c, uHor * 0.6, 1.0 - smoothstep(-0.3, 0.0, h));
  vec2 dz = normalize(d.xz + vec2(1e-4));
  vec2 sz = normalize(uSunDir.xz + vec2(1e-4));
  float az = max(dot(dz, sz), 0.0);
  c += uSunCol * pow(az, 4.0) * exp(-abs(h - 0.02) * 7.0) * 0.45 * uGlow;
  float s = max(dot(d, uSunDir), 0.0);
  c += uSunCol * (pow(s, 8.0) * 0.28 + pow(s, 90.0) * 0.7) * uSunVis;
  c += uSunCol * smoothstep(0.99935, 0.9997, s) * 5.0 * uSunVis;
  c += uCity * exp(-max(h, 0.0) * 16.0) * smoothstep(-0.25, 0.02, h);
  float m = max(dot(d, uMoonDir), 0.0);
  c += vec3(0.86, 0.9, 1.0) * smoothstep(0.99955, 0.99975, m) * 2.2 * uNight;
  c += vec3(0.45, 0.55, 0.85) * pow(m, 60.0) * 0.18 * uNight;
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
function skyMaterial(){
  return new THREE.ShaderMaterial({uniforms:skyU, vertexShader:SKY_VS, fragmentShader:SKY_FS, side:THREE.BackSide, depthWrite:false, fog:false});
}
const sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 48, 24), skyMaterial());
sky.renderOrder = -10; sky.frustumCulled = false;
scene.add(sky);

/* stars: twinkle, fade in with the night */
const STAR_VS = `
attribute float aPh;
attribute float aSz;
uniform float uTime;
uniform float uOn;
uniform float uPR;
varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSz * uPR;
  vA = uOn * (0.6 + 0.4 * sin(uTime * (0.8 + fract(aPh) * 1.6) + aPh * 6.283));
}`;
const STAR_FS = `
uniform vec3 uColor;
varying float vA;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float a = exp(-dot(c, c) * 18.0) * vA;
  gl_FragColor = vec4(uColor * a, a);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
function glowPoints(positions, sizes, hex, radius){
  const n = positions.length / 3, ph = new Float32Array(n), sz = new Float32Array(n);
  for (let i = 0; i < n; i++){ ph[i] = R() * 10; sz[i] = sizes ? sizes[i] : 2; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aSz', new THREE.BufferAttribute(sz, 1));
  if (radius) g.boundingSphere = new THREE.Sphere(new V3(), radius);
  const mat = new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}, uOn:{value:0}, uPR:{value:renderer.getPixelRatio()}, uColor:{value:col(hex)}},
    vertexShader:STAR_VS, fragmentShader:STAR_FS, transparent:true, depthWrite:false,
    blending:THREE.AdditiveBlending, fog:false });
  const p = new THREE.Points(g, mat); p.frustumCulled = false;
  return p;
}
const stars = (function(){
  const N = 1500, pos = [], sz = [];
  for (let i = 0; i < N; i++){
    const th = R() * Math.PI * 2, y = 0.04 + Math.pow(R(), 0.8) * 0.96, rxz = Math.sqrt(1 - y*y);
    pos.push(Math.cos(th)*rxz*2100, y*2100, Math.sin(th)*rxz*2100);
    sz.push(1.1 + Math.pow(R(), 5) * 3.2);
  }
  const p = glowPoints(pos, sz, '#DCE6FF');
  p.renderOrder = -9; scene.add(p); return p;
})();

/* clouds: a few soft banks on the horizon, tinted by the hour */
const clouds = [];
(function(){
  const tex = cloudTexture();
  for (let i = 0; i < 9; i++){
    const m = new THREE.SpriteMaterial({map:tex, transparent:true, opacity:rr(0.4, 0.7), depthWrite:false, fog:false});
    const s = new THREE.Sprite(m), a = rr(-1.25, 1.25), d = rr(1400, 1900);
    s.position.set(Math.sin(a)*d, rr(60, 260), -Math.cos(a)*d);
    const w = rr(420, 860); s.scale.set(w, w*rr(0.22, 0.34), 1);
    s.renderOrder = -8; s.userData.base = m.opacity;
    scene.add(s); clouds.push(s);
  }
})();

