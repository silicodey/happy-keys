/* birds over the drop, by day */
const birds = (function(){
  const list = [], m = new THREE.MeshBasicMaterial({color:col(SET.birds), side:THREE.DoubleSide, transparent:true});
  for (let i = 0; i < 6; i++){
    const g = new THREE.Group(), sh = new THREE.Shape();
    sh.moveTo(0,0); sh.lineTo(0.62,0.16); sh.lineTo(0.56,-0.03); sh.lineTo(0,-0.05);
    const l = new THREE.Mesh(new THREE.ShapeGeometry(sh), m), r = new THREE.Mesh(new THREE.ShapeGeometry(sh), m);
    r.scale.x = -1; g.add(l, r); g.scale.setScalar(rr(1.1, 1.8));
    scene.add(g);
    list.push({g, l, r, cx:rr(-50, 40), cz:rr(-90, -40), rad:rr(14, 34), y:rr(4, 22), spd:rr(0.09, 0.17)*(R() < 0.5 ? -1 : 1), ph:rr(0, 7), flap:rr(4, 6.5)});
  }
  list.mat = m;
  return list;
})();

const MAT_TOP = 0.06;
const WORLD = META.street === 'kyoto' ? worldKyoto() : worldSantorini();
const PLAT  = META.street === 'kyoto' ? platformKyoto() : platformSantorini();
const matMesh = PLAT.mat;

