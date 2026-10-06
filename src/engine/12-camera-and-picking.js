/* ════════════════════════════════════════════════════════════
   CAMERA RIG — damped orbit with inertia, zoom toward the cursor
   ════════════════════════════════════════════════════════════ */
const cam = {yaw:0, pitch:0, dist:0, target:new V3(), g:{yaw:0, pitch:0, dist:0, target:new V3()}, vy:0, vp:0};
const LIM = {pmin:0.05, pmax:1.36, dmin:1.3, dmax:44};
const TMIN = new V3(-15, -0.5, -10), TMAX = new V3(15, 5, 10), HOME_T = new V3(0, 0.6, -0.9);
const INSET = {l:0, b:0};
function shiftAcross(t, yaw, dist, px){
  /* move the look-at point sideways so the subject sits px further left on screen */
  const halfW = dist*Math.tan(camera.fov*Math.PI/360)*camera.aspect, w = halfW*2*px/innerWidth;
  t.x += Math.cos(yaw)*w; t.z -= Math.sin(yaw)*w;
  return t;
}
function shiftUp(t, yaw, pitch, dist, px){
  /* move the look-at point down the screen so the subject sits px higher */
  const halfH = dist*Math.tan(camera.fov*Math.PI/360), w = halfH*2*px/innerHeight;
  t.x += Math.sin(pitch)*Math.sin(yaw)*w; t.y -= Math.cos(pitch)*w; t.z += Math.sin(pitch)*Math.cos(yaw)*w;
  return t;
}
function homePose(){
  const visW = Math.max(320, innerWidth - INSET.l), visH = Math.max(240, innerHeight - INSET.b), a = visW / visH;
  const dist = clamp(23*Math.max(1, 1.5/a)*(INSET.b ? 1.08 : 1), 12, 46), t = HOME_T.clone();
  shiftAcross(t, 0.2, dist, -INSET.l/2); shiftUp(t, 0.2, 0.52, dist, INSET.b/2);
  return {yaw:0.2, pitch:0.52, dist, target:t};
}
function lookPose(k){
  const w = keyTopWorld(k), yaw = clamp(cam.g.yaw, -0.6, 0.6), pitch = 0.82, dist = 5.2;
  return {yaw, pitch, dist, target:shiftUp(shiftAcross(w.clone(), yaw, dist, -INSET.l/2), yaw, pitch, dist, INSET.b/2)};
}
const INTRO_POSE = META.street === 'kyoto' ? {yaw:0.75, pitch:0.5, dist:66, target:new V3(-6, 2, -18)} : {yaw:0.95, pitch:0.07, dist:58, target:new V3(-8, 2.5, -14)};
function setPose(p){
  cam.yaw = cam.g.yaw = p.yaw; cam.pitch = cam.g.pitch = p.pitch; cam.dist = cam.g.dist = p.dist;
  cam.target.copy(p.target); cam.g.target.copy(p.target);
}
function applyCam(){
  const cp = Math.cos(cam.pitch);
  camera.position.set(cam.target.x + Math.sin(cam.yaw)*cp*cam.dist, cam.target.y + Math.sin(cam.pitch)*cam.dist,
                      cam.target.z + Math.cos(cam.yaw)*cp*cam.dist);
  if (camera.position.y < 0.35) camera.position.y = 0.35;
  camera.lookAt(cam.target);
  /* keep the near plane in proportion to the zoom so depth precision follows the camera */
  const near = clamp(cam.dist*0.02, 0.05, 0.9);
  if (Math.abs(near - camera.near) > camera.near*0.05){ camera.near = near; camera.updateProjectionMatrix(); }
  fitShadow(cam.dist);
}
let flight = null;
function flyTo(to, dur, onDone){
  const from = {yaw:cam.g.yaw, pitch:cam.g.pitch, dist:cam.g.dist, target:cam.g.target.clone()};
  let dy = (to.yaw - from.yaw) % (Math.PI*2);
  if (dy > Math.PI) dy -= Math.PI*2; if (dy < -Math.PI) dy += Math.PI*2;
  flight = {t:0, dur:REDUCED ? 0.001 : dur, from, to:{yaw:from.yaw + dy, pitch:to.pitch, dist:to.dist, target:to.target.clone()}, done:onDone || null};
  cam.vy = cam.vp = 0;
}
function clampTarget(t){ t.x = clamp(t.x, TMIN.x, TMAX.x); t.y = clamp(t.y, TMIN.y, TMAX.y); t.z = clamp(t.z, TMIN.z, TMAX.z); }
const drag = {active:false, mode:'orbit', lx:0, ly:0, lt:0, t0:0, moved:0, vx:0, vy:0};
function updateCamera(dt){
  if (flight){
    flight.t += dt / flight.dur;
    const k = Math.min(1, flight.t), e = easeInOut(k), f = flight.from, to = flight.to;
    cam.g.yaw = lerp(f.yaw, to.yaw, e); cam.g.pitch = lerp(f.pitch, to.pitch, e);
    cam.g.dist = Math.exp(lerp(Math.log(f.dist), Math.log(to.dist), e));
    cam.g.target.lerpVectors(f.target, to.target, e);
    if (k >= 1){ const d = flight.done; flight = null; if (d) d(); }
  } else if (!drag.active){
    cam.g.yaw += cam.vy*dt; cam.g.pitch += cam.vp*dt;
    const k = Math.exp(-3.8*dt); cam.vy *= k; cam.vp *= k;
    if (cam.g.pitch < LIM.pmin){ cam.g.pitch = lerp(cam.g.pitch, LIM.pmin, 1 - Math.exp(-10*dt)); cam.vp = 0; }
    if (cam.g.pitch > LIM.pmax){ cam.g.pitch = lerp(cam.g.pitch, LIM.pmax, 1 - Math.exp(-10*dt)); cam.vp = 0; }
    if (!focused && idleT > 8 && !REDUCED) cam.g.yaw += Math.sin(T*0.05)*0.012*dt;
  }
  const kr = 1 - Math.exp(-(flight ? 14 : 11)*dt), kd = 1 - Math.exp(-9*dt);
  const py = cam.yaw, pp = cam.pitch;
  cam.yaw += (cam.g.yaw - cam.yaw)*kr; cam.pitch += (cam.g.pitch - cam.pitch)*kr;
  cam.dist += (cam.g.dist - cam.dist)*kd; cam.target.lerp(cam.g.target, kd);
  angSpeed = dt > 0 ? Math.hypot(cam.yaw - py, cam.pitch - pp)/dt : 0;
  applyCam();
}

/* ════════════════════════════════════════════════════════════
   PICKING
   ════════════════════════════════════════════════════════════ */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function hitAt(x, y, list){ ndc.set((x/innerWidth)*2 - 1, -(y/innerHeight)*2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects(list, false)[0] || null; }
function keyFromHit(h){
  if (!h) return null;
  if (h.object.userData.key) return h.object.userData.key;
  if (h.object.isInstancedMesh && h.instanceId !== undefined && h.object.userData.keys) return h.object.userData.keys[h.instanceId];
  return null;
}
const zoomables = [PLAT.slab, matMesh, caseMesh, plate, ...hoverables, ...villageMerged.children, ...WORLD.zoom];
const zoomPlane = new THREE.Plane(new V3(0, 1, 0), -1.4), _hp = new V3();
function pointUnder(x, y){
  const h = hitAt(x, y, zoomables);
  if (h) return h.point.clone();
  return ray.ray.intersectPlane(zoomPlane, _hp) ? _hp.clone() : null;
}
function zoomAt(x, y, f){
  const old = cam.g.dist, nd = clamp(old*f, LIM.dmin, LIM.dmax), k = nd/old;
  if (Math.abs(k - 1) < 1e-5) return;
  if (k < 1){ const p = pointUnder(x, y); if (p) cam.g.target.lerp(p, 1 - k); }
  else cam.g.target.lerp(HOME_T, clamp((k - 1)*0.7, 0, 1)*smooth(8, 30, nd));
  clampTarget(cam.g.target);
  cam.g.dist = nd;
}
function panBy(dx, dy){
  const s = cam.dist*0.0011, c = Math.cos(cam.yaw), sn = Math.sin(cam.yaw);
  cam.g.target.x += (-dx*c - dy*sn)*s;
  cam.g.target.z += (dx*sn - dy*c)*s;
  clampTarget(cam.g.target);
}
const _pv = new V3();
function panOf(k){
  _pv.set(k.x, KEY_BASE, k.z); deck.localToWorld(_pv); _pv.project(camera);
  return clamp(_pv.x*0.8, -0.9, 0.9);
}

/* ════════════════════════════════════════════════════════════
   KEY PHYSICS — a spring that bottoms out, then bounces back up
   ════════════════════════════════════════════════════════════ */
const ACTIVE = new Set(), TRAVEL = 0.17;
let pressed = null, bellAmp = 0, bellPh = 0;
const activate = k => ACTIVE.add(k);
function ringBell(){ bellAmp = 0.6; SFX.bell(); }
function keyDown(k){
  if (k.removed){ ringBell(); return; }
  if (k.down) return;
  k.down = true; activate(k);
  SFX.thock(panOf(k), k.prod ? 1.15 : 1, k.w);
  if (COARSE && navigator.vibrate) navigator.vibrate(8);
  if (k.id === 'caps'){ capsOn = !capsOn; ledMats[0].emissiveIntensity = capsOn ? 2.2 : 0.15; }
}
function keyUp(k){ if (!k || k.removed || !k.down) return; k.down = false; activate(k); SFX.release(panOf(k)); }
function releasePressed(silent){
  if (!pressed) return;
  const k = pressed; pressed = null;
  if (silent){ k.down = false; activate(k); } else keyUp(k);
}
function stepKeys(dt){
  const K = 1500, C = 2*Math.sqrt(K)*0.42;
  for (const k of ACTIVE){
    const goal = k.down ? 1 : (k.hold ? 0.62 : -k.hover*0.28);
    let rem = dt;
    while (rem > 1e-6){
      const h = Math.min(rem, 1/240);
      k.v += ((goal - k.p)*K - k.v*C)*h; k.p += k.v*h;
      if (k.p > 1){ k.p = 1; if (k.v > 0) k.v *= -0.18; }
      rem -= h;
    }
    k.press = k.p*TRAVEL; writeKey(k);
    if (Math.abs(goal - k.p) < 5e-4 && Math.abs(k.v) < 5e-3){ k.p = goal; k.v = 0; k.press = k.p*TRAVEL; writeKey(k); ACTIVE.delete(k); }
  }
}

