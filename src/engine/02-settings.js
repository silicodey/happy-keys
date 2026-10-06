/* ════════════════════════════════════════════════════════════
   SHARED STATE
   ════════════════════════════════════════════════════════════ */
let started = false, introReady = false, introRunning = false, focused = null, preFocus = null, hoverKey = null;
let indexOpen = false, T = 0, liveT = 0, idleT = 0, angSpeed = 0;
let tod = META.preview ? META.tod : META.introFrom, todGoal = META.tod, todShown = -1, todIntro = null, todDrag = false;
let lampOn = 0, nightF = 0, disposed = false;
const visited = new Set();
const GLOWS = [];                       // every light-point cloud that switches on with the lamps

/* ════════════════════════════════════════════════════════════
   SETTINGS — each one is a complete place: the light through the
   day, the keyboard's materials, the world outside and its sound
   ════════════════════════════════════════════════════════════ */
const SETTING_DATA = {
  santorini: {
    tod: [
      {t:0.00, top:'#3E80C0', hor:'#CDE0EB', sea:'#1C5C82', sun:'#FFF1DA', sunI:2.6,  az:-0.55, el:0.95, hs:'#D5E8F4', hg:'#BCA27E', hi:0.82, exp:0.92, bloom:0.12, cloud:'#FFFFFF', isl:'#9FB7C8', city:0},
      {t:0.42, top:'#5677B0', hor:'#F4C08D', sea:'#2C5675', sun:'#FFBC78', sunI:2.3,  az:-0.20, el:0.20, hs:'#B6BFDA', hg:'#BC8862', hi:0.64, exp:0.98, bloom:0.24, cloud:'#FFD8B6', isl:'#8D93AE', city:0},
      {t:0.64, top:'#24326C', hor:'#E8906E', sea:'#1C3053', sun:'#FF9668', sunI:1.15, az:-0.05, el:0.03, hs:'#6874B2', hg:'#6E5048', hi:0.56, exp:1.10, bloom:0.46, cloud:'#E7A3A2', isl:'#40466B', city:0},
      {t:1.00, top:'#060B1E', hor:'#1A2343', sea:'#091327', sun:'#A9BCEB', sunI:0.5,  az:-0.05, el:-0.3, hs:'#283668', hg:'#18171F', hi:0.44, exp:1.30, bloom:0.66, cloud:'#2E3756', isl:'#151B31', city:0}
    ],
    fog:[170, 1250],
    board:{alpha:'#EFEBE4', mod:'#2B699F', plate:'#121A2D', legA:'#3A4254', legM:'#F2EFE9', glowA:'#FFD7A8', glowM:'#FFE3BF',
      caseHex:'#CDBFA4', caseRough:0.3, caseMetal:0.92, grain:false, mat:'#1E3557', stitch:'#3B5B86'},
    shirts:['#F2EEE6','#3A85BC','#D2447F','#4F6D3E','#E6A93E','#2A3A5E','#C46A45'],
    robe:false,
    birds:'#3E4654',
    sound:{bed:'sea', insect:'cricket', chime:'wind', bell:'church', swell:'pad',
      notes:[523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66]}
  },
  kyoto: {
    tod: [
      {t:0.00, top:'#5F8FB8', hor:'#D9DED7', sea:'#6E6A62', sun:'#FFF0D8', sunI:2.4,  az:-0.50, el:0.90, hs:'#D9E3E8', hg:'#8F7B5E', hi:0.80, exp:0.95, bloom:0.12, cloud:'#FFFFFF', isl:'#93A6B6', city:0},
      {t:0.42, top:'#6A7FAE', hor:'#F0B67E', sea:'#6A5E58', sun:'#FFB46A', sunI:2.2,  az:-0.16, el:0.18, hs:'#BDB8CF', hg:'#9A6E4E', hi:0.62, exp:1.00, bloom:0.26, cloud:'#FFD2A8', isl:'#8C7F96', city:0.05},
      {t:0.64, top:'#262F63', hor:'#E07A55', sea:'#3A3240', sun:'#FF8A55', sunI:1.05, az:-0.05, el:0.03, hs:'#6670AE', hg:'#5A4038', hi:0.55, exp:1.12, bloom:0.50, cloud:'#D98E8A', isl:'#3F3F67', city:0.35},
      {t:1.00, top:'#070B1F', hor:'#21233F', sea:'#16151E', sun:'#A9BCEB', sunI:0.45, az:-0.05, el:-0.3, hs:'#28325F', hg:'#171418', hi:0.42, exp:1.30, bloom:0.70, cloud:'#2C3352', isl:'#141830', city:1}
    ],
    fog:[150, 1900],
    board:{alpha:'#ECE4D3', mod:'#33302E', plate:'#16120F', legA:'#2F2A24', legM:'#EDE4D3', glowA:'#FFCF9A', glowM:'#FFE2BC',
      caseHex:'#6A4430', caseRough:0.46, caseMetal:0.0, grain:true, mat:'#1F2B47', stitch:'#B98A5A'},
    shirts:['#2D3E6B','#A8323B','#6B3A5B','#E2A3B5','#C8963E','#F1ECE2','#3E5A4A'],
    robe:true,
    birds:'#2E2723',
    sound:{bed:'valley', insect:'suzumushi', chime:'furin', bell:'bonsho', swell:'koto',
      notes:[587.33, 622.25, 783.99, 880.0, 932.33, 1174.66, 1244.51]}
  }
};
const SET = SETTING_DATA[META.street] || SETTING_DATA.santorini;
scene.fog.near = SET.fog[0]; scene.fog.far = SET.fog[1];
/* ════════════════════════════════════════════════════════════
   TIME OF DAY — one value drives sky, sea, light and every lamp
   ════════════════════════════════════════════════════════════ */
const SEA_Y = -75;
const SUN_DIR = new V3(0,1,0), MOON_DIR = new V3(0.42, 0.6, -0.68).normalize(), LIGHT_DIR = new V3(), _sunL = new V3();
const TOD = SET.tod.map(k => Object.assign({}, k));
const TOD_COLS = ['top','hor','sea','sun','hs','hg','cloud','isl'];
TOD.forEach(k => { for (const f of TOD_COLS) k[f + 'C'] = col(k[f]); });
const TODS = {};
for (const f of TOD_COLS) TODS[f] = new THREE.Color();
function sampleTOD(t){
  let i = 0; while (i < TOD.length - 2 && t > TOD[i+1].t) i++;
  const a = TOD[i], b = TOD[i+1], u = smooth(0, 1, (t - a.t) / (b.t - a.t));
  for (const f of TOD_COLS) TODS[f].copy(a[f + 'C']).lerp(b[f + 'C'], u);
  for (const f of ['sunI','az','el','hi','exp','bloom','city']) TODS[f] = lerp(a[f] || 0, b[f] || 0, u);
  return TODS;
}
const dirFromAzEl = (az, el, out) => out.set(Math.sin(az)*Math.cos(el), Math.sin(el), -Math.cos(az)*Math.cos(el));

