(function(){
'use strict';

/* ════════════════════════════════════════════════════════════
   ENVIRONMENT + SMALL UTILITIES
   ════════════════════════════════════════════════════════════ */
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE  = matchMedia('(pointer: coarse)').matches;
const MOBILE  = COARSE || innerWidth <= 820;
const HAS_POST = !!(THREE.EffectComposer && THREE.RenderPass && THREE.ShaderPass &&
                    THREE.UnrealBloomPass && THREE.CopyShader && THREE.LuminosityHighPassShader);
const $ = id => document.getElementById(id);
const V3 = THREE.Vector3;

const clamp  = (v,a,b) => v < a ? a : (v > b ? b : v);
const lerp   = (a,b,t) => a + (b - a) * t;
const smooth = (a,b,x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
function rng(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R  = rng(80826);                 // deterministic: same village every visit
const rr = (a,b) => a + R() * (b - a);
const col = hex => new THREE.Color(hex).convertSRGBToLinear();

function hash2(x,y){ const s = Math.sin(x*127.1 + y*311.7) * 43758.5453123; return s - Math.floor(s); }
function vnoise(x,y,P){
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf*xf*(3 - 2*xf), v = yf*yf*(3 - 2*yf);
  const h = (a,b) => { if (P){ a = ((a % P) + P) % P; b = ((b % P) + P) % P; } return hash2(a,b); };
  return lerp(lerp(h(xi,yi), h(xi+1,yi), u), lerp(h(xi,yi+1), h(xi+1,yi+1), u), v) * 2 - 1;
}
function fbm(x,y,P){ let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++){ s += a * vnoise(x*f, y*f, P ? P*f : 0); f *= 2; a *= 0.5; } return s; }

/* ════════════════════════════════════════════════════════════
   LAYOUT — a tenkeyless board. A lane runs through the middle:
   any key that overlaps it was swallowed by the village.
   [id, legend, x (units), width (units), kind: a = alpha, m = modifier]
   ════════════════════════════════════════════════════════════ */
const LAYOUT = [
  [['esc','esc',0,1,'m'],['F1','F1',2,1,'a'],['F2','F2',3,1,'a'],['F3','F3',4,1,'a'],['F4','F4',5,1,'a'],
   ['F5','F5',6.5,1,'m'],['F6','F6',7.5,1,'m'],['F7','F7',8.5,1,'m'],['F8','F8',9.5,1,'m'],
   ['F9','F9',11,1,'a'],['F10','F10',12,1,'a'],['F11','F11',13,1,'a'],['F12','F12',14,1,'a'],
   ['prt','prt sc',15.25,1,'m'],['scr','scroll',16.25,1,'m'],['pau','pause',17.25,1,'m']],
  [['~','~',0,1,'a'],['1','1',1,1,'a'],['2','2',2,1,'a'],['3','3',3,1,'a'],['4','4',4,1,'a'],['5','5',5,1,'a'],
   ['6','6',6,1,'a'],['7','7',7,1,'a'],['8','8',8,1,'a'],['9','9',9,1,'a'],['0','0',10,1,'a'],['-','-',11,1,'a'],
   ['=','=',12,1,'a'],['bksp','back',13,2,'m'],['ins','ins',15.25,1,'m'],['home','home',16.25,1,'m'],['pgup','pg up',17.25,1,'m']],
  [['tab','tab',0,1.5,'m'],['Q','Q',1.5,1,'a'],['W','W',2.5,1,'a'],['E','E',3.5,1,'a'],['R','R',4.5,1,'a'],['T','T',5.5,1,'a'],
   ['Y','Y',6.5,1,'a'],['U','U',7.5,1,'a'],['I','I',8.5,1,'a'],['O','O',9.5,1,'a'],['P','P',10.5,1,'a'],
   ['[','[',11.5,1,'a'],[']',']',12.5,1,'a'],['\\','\\',13.5,1.5,'a'],
   ['del','del',15.25,1,'m'],['end','end',16.25,1,'m'],['pgdn','pg dn',17.25,1,'m']],
  [['caps','caps',0,1.75,'m'],['A','A',1.75,1,'a'],['S','S',2.75,1,'a'],['D','D',3.75,1,'a'],['F','F',4.75,1,'a'],
   ['G','G',5.75,1,'a'],['H','H',6.75,1,'a'],['J','J',7.75,1,'a'],['K','K',8.75,1,'a'],['L','L',9.75,1,'a'],
   [';',';',10.75,1,'a'],["'","'",11.75,1,'a'],['enter','enter',12.75,2.25,'m']],
  [['shift','shift',0,2.25,'m'],['Z','Z',2.25,1,'a'],['X','X',3.25,1,'a'],['C','C',4.25,1,'a'],['V','V',5.25,1,'a'],
   ['B','B',6.25,1,'a'],['N','N',7.25,1,'a'],['M','M',8.25,1,'a'],[',',',',9.25,1,'a'],['.','.',10.25,1,'a'],
   ['/','/',11.25,1,'a'],['rshift','shift',12.25,2.75,'m'],['up','↑',16.25,1,'m']],
  [['ctrl','ctrl',0,1.25,'m'],['win','cmd',1.25,1.25,'m'],['alt','alt',2.5,1.25,'m'],['space','',3.75,2.75,'a'],
   ['altgr','alt',10,1.25,'m'],['fn','fn',11.25,1.25,'m'],['menu','menu',12.5,1.25,'m'],['rctrl','ctrl',13.75,1.25,'m'],
   ['left','←',15.25,1,'m'],['down','↓',16.25,1,'m'],['right','→',17.25,1,'m']]
];
const ROWZ   = [-3.1, -1.85, -0.85, 0.15, 1.15, 2.15];
const LANE_C = [8.1, 8.0, 8.0, 8.15, 7.95, 8.25];       // lane centre per row (layout units)
const LANE_HW = 1.45;
const LX = x => x - 9.125;
const LZ = z => z + 0.475;
const STRIP = [-3.6, -2.475, -1.35, -0.35, 0.65, 1.65, 2.65].map(LZ);
const ROW_H    = [0.56, 0.54, 0.50, 0.48, 0.50, 0.50];    // sculpted, cylindrical-profile row heights
const ROW_TILT = [0.15, 0.10, 0.04, 0.0, -0.05, -0.09];
const LIFT     = [0.29, 0.24, 0.19, 0.14, 0.09, 0.045];   // village terraces step up toward the back

const CODE_TO_ID = {Escape:'esc',Backquote:'~',Minus:'-',Equal:'=',Backspace:'bksp',Tab:'tab',BracketLeft:'[',BracketRight:']',
  Backslash:'\\',IntlBackslash:'\\',CapsLock:'caps',Semicolon:';',Quote:"'",Enter:'enter',NumpadEnter:'enter',ShiftLeft:'shift',
  ShiftRight:'rshift',Comma:',',Period:'.',Slash:'/',ControlLeft:'ctrl',MetaLeft:'win',OSLeft:'win',AltLeft:'alt',Space:'space',
  AltRight:'altgr',MetaRight:'menu',OSRight:'menu',ContextMenu:'menu',ControlRight:'rctrl',ArrowUp:'up',ArrowDown:'down',
  ArrowLeft:'left',ArrowRight:'right',Insert:'ins',Home:'home',PageUp:'pgup',Delete:'del',End:'end',PageDown:'pgdn',
  PrintScreen:'prt',ScrollLock:'scr',Pause:'pau'};
for (let i = 0; i < 10; i++) CODE_TO_ID['Digit' + i] = String(i);
for (let i = 1; i <= 12; i++) CODE_TO_ID['F' + i] = 'F' + i;
for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') CODE_TO_ID['Key' + ch] = ch;

