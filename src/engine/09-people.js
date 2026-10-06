const STREET = PLACE.street();
const villageMerged = STREET.merged;

/* people: some walk the lane, two sit and watch it, one cat */
const walkers = [];
const SHIRTS = SET.shirts.map(col);
const skinM = std('#D9A882', 0.9), pantsM = std('#2E3240', 0.9);
const WALK_LEG = new THREE.BoxGeometry(0.009, 0.042, 0.009); WALK_LEG.translate(0, -0.021, 0);
function person(i){
  const g = new THREE.Group(), sm = new THREE.MeshStandardMaterial({color:SHIRTS[i % SHIRTS.length], roughness:0.9});
  const body = SET.robe ? mc(0.013, 0.022, 0.075, 8, sm) : mc(0.014, 0.018, 0.055, 7, sm);
  body.position.y = SET.robe ? 0.058 : 0.068; g.add(body);
  if (SET.robe){ const obi = mc(0.0145, 0.0155, 0.012, 8, std('#E8D9B0', 0.8)); obi.position.y = 0.074; g.add(obi); }
  const head = msph(0.012, 8, skinM); head.position.y = 0.106; g.add(head);
  const lL = new THREE.Mesh(WALK_LEG, pantsM), lR = new THREE.Mesh(WALK_LEG, pantsM);
  lL.position.set(-0.007, SET.robe ? 0.028 : 0.042, 0); lR.position.set(0.007, SET.robe ? 0.028 : 0.042, 0); lL.castShadow = lR.castShadow = true;
  if (SET.robe){ lL.scale.y = lR.scale.y = 0.62; }
  g.add(lL, lR);
  return {g, lL, lR};
}
for (let i = 0; i < (MOBILE ? 6 : 9); i++){
  const p = person(i); villageDyn.add(p.g);
  walkers.push(Object.assign(p, {t:rr(0.04, 0.96), dir:R() < 0.5 ? 1 : -1, spd:rr(0.009, 0.015), off:rr(-0.28, 0.28),
    ph:rr(0, 6), pause:0, y:groundTop(2)}));
}
CAFES.slice(0, 2).forEach((c, i) => {
  const p = person(i + 3);
  if (c.bench){ p.g.position.set(c.x, c.y + 0.012, c.z); p.g.rotation.y = c.side < 0 ? Math.PI/2 : -Math.PI/2; }
  else { p.g.position.set(c.x + 0.07, c.y, c.z); p.g.rotation.y = -Math.PI/2; }
  p.g.scale.y = 0.84;
  p.lL.rotation.x = p.lR.rotation.x = -1.3;
  villageDyn.add(p.g);
});
const cat = (function(){
  const g = new THREE.Group(), m = std(SET.cat || '#E4D6C2', 1);
  const b = mb(0.045, 0.017, 0.02, m); b.position.y = 0.018; g.add(b);
  const h = mb(0.018, 0.017, 0.018, m); h.position.set(0.028, 0.03, 0); g.add(h);
  const tail = mb(0.026, 0.006, 0.006, m); tail.position.set(-0.03, 0.028, 0); g.add(tail);
  villageDyn.add(g);
  return {g, tail, t:0.3, off:0.36, y:groundTop(3)};
})();

