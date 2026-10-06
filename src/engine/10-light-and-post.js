/* ════════════════════════════════════════════════════════════
   LIGHT
   ════════════════════════════════════════════════════════════ */
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
(function(){ const c = sun.shadow.camera; c.left = -15; c.right = 15; c.top = 11; c.bottom = -11; c.near = 1; c.far = 140; })();
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.015;
sun.target.position.set(0, 0.5, 0);
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6); scene.add(hemi);
const warmLight = new THREE.PointLight(col('#FFB870'), 0, 34, 2); warmLight.position.copy(PLAT.warmPos); scene.add(warmLight);
const lampLights = [0, 2, 4].map(i => {
  const L = new THREE.PointLight(col('#FFB25E'), 0, 1.6, 2);
  L.position.copy(LAMPS[i].pos); L.position.y += 0.05; deck.add(L); return L;
});

/* ════════════════════════════════════════════════════════════
   REFLECTIONS + POST
   ════════════════════════════════════════════════════════════ */
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMaterial()));
const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = null, envDirty = true, envAge = 99;
function updateEnv(){
  const rt = pmrem.fromScene(envScene, 0.035);
  if (envRT) envRT.dispose();
  envRT = rt; scene.environment = rt.texture; envDirty = false; envAge = 0;
}

const GRADE_VS = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const GRADE_FS = `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uVig;
uniform float uGrain;
uniform float uCA;
uniform vec3 uTint;
uniform vec2 uRes;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 c = vUv - 0.5;
  vec2 off = c * dot(c, c) * uCA;
  vec3 rgb;
  rgb.r = texture2D(tDiffuse, vUv + off).r;
  rgb.g = texture2D(tDiffuse, vUv).g;
  rgb.b = texture2D(tDiffuse, vUv - off).b;
  rgb *= uTint;
  vec2 q = c * vec2(uRes.x / uRes.y, 1.0);
  float vig = 1.0 - smoothstep(0.35, 1.05, length(q) * 1.15);
  rgb *= mix(1.0 - uVig, 1.0, vig);
  vec4 o = linearToOutputTexel(vec4(rgb, 1.0));
  o.rgb += (hash(vUv * uRes + fract(uTime * 7.13) * 91.7) - 0.5) * uGrain;
  gl_FragColor = o;
}`;
let composer = null, bloomPass = null, gradePass = null;
if (HAS_POST){
  const sz = renderer.getDrawingBufferSize(new THREE.Vector2()), gl2 = renderer.capabilities.isWebGL2;
  const rt = gl2 ? new THREE.WebGLMultisampleRenderTarget(sz.x, sz.y, {format:THREE.RGBAFormat})
                 : new THREE.WebGLRenderTarget(sz.x, sz.y, {format:THREE.RGBAFormat});
  if (gl2) rt.samples = 4;
  composer = new THREE.EffectComposer(renderer, rt);
  composer.addPass(new THREE.RenderPass(scene, camera));
  bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.4, 0.62, 0.78);
  composer.addPass(bloomPass);
  gradePass = new THREE.ShaderPass({
    uniforms:{tDiffuse:{value:null}, uTime:{value:0}, uVig:{value:0.34}, uGrain:{value:0.028}, uCA:{value:0.006},
      uTint:{value:new V3(1, 1, 1)}, uRes:{value:new THREE.Vector2(sz.x, sz.y)}},
    vertexShader:GRADE_VS, fragmentShader:GRADE_FS});
  composer.addPass(gradePass);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(innerWidth, innerHeight);
}
function render(dt){
  if (composer){ gradePass.uniforms.uTime.value = T; composer.render(dt); }
  else renderer.render(scene, camera);
}

/* ════════════════════════════════════════════════════════════
   APPLY TIME OF DAY
   ════════════════════════════════════════════════════════════ */
const CITY_HUE = new THREE.Color(1.0, 0.6, 0.32);
function applyTOD(t){
  const P = sampleTOD(t);
  skyU.uTop.value.copy(P.top); skyU.uHor.value.copy(P.hor); skyU.uSunCol.value.copy(P.sun);
  dirFromAzEl(P.az, P.el, SUN_DIR);
  skyU.uSunVis.value = smooth(-0.07, 0.03, P.el);
  nightF = smooth(0.66, 0.95, t);
  lampOn = smooth(0.46, 0.66, t);
  skyU.uNight.value = nightF;
  skyU.uGlow.value = 1 - nightF*0.8;
  skyU.uCity.value.copy(CITY_HUE).multiplyScalar(P.city*0.22);
  dirFromAzEl(P.az, Math.max(P.el, 0.22), _sunL);
  LIGHT_DIR.copy(_sunL).lerp(MOON_DIR, smooth(0.7, 0.88, t)).normalize();
  sun.position.copy(sun.target.position).addScaledVector(LIGHT_DIR, 60);
  sun.color.copy(P.sun); sun.intensity = P.sunI;
  hemi.color.copy(P.hs); hemi.groundColor.copy(P.hg); hemi.intensity = P.hi;
  scene.fog.color.copy(P.hor);
  renderer.toneMappingExposure = P.exp;
  if (bloomPass) bloomPass.strength = P.bloom * (MOBILE ? 0.85 : 1);
  if (gradePass) gradePass.uniforms.uTint.value.set(lerp(1, 1.025, smooth(0.3, 0.62, t)) * lerp(1, 0.95, nightF), 1, lerp(1, 1.06, nightF));
  AM.glow.emissiveIntensity = 0.5 + lampOn * 1.8;
  underglowMat.emissiveIntensity = lampOn * 2.2;
  warmLight.intensity = lampOn * 0.9;
  legendMats[0].emissiveIntensity = lampOn * 0.45;
  legendMats[1].emissiveIntensity = lampOn * 0.6;
  for (const L of lampLights) L.intensity = lampOn * 0.8;
  stars.material.uniforms.uOn.value = nightF;
  for (const p of GLOWS) p.material.uniforms.uOn.value = lampOn;
  for (const s of clouds){ s.material.color.copy(P.cloud); s.material.opacity = s.userData.base * (1 - nightF*0.55); }
  birds.mat.opacity = 1 - nightF;
  WORLD.applyTOD(P, t); PLAT.applyTOD(P, t); STREET.applyTOD(P, t);
  envDirty = true;
  todShown = t;
}

