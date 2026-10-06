// Compiles every custom shader in a built page with glslangValidator, wrapped the way three r128 wraps them.
const fs = require('fs'), {execFileSync} = require('child_process');
const THREE = require('three');
const html = fs.readFileSync(process.argv[2], 'utf8');
const C = THREE.ShaderChunk;
const resolve = s => s.replace(/#include <(\w+)>/g, (_, n) => { if (!(n in C)) throw new Error('missing chunk ' + n); return resolve(C[n]); });
const VPRE = `#version 300 es
#define attribute in
#define varying out
#define texture2D texture
precision highp float; precision highp int;
#define HIGH_PRECISION
uniform mat4 modelMatrix; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat3 normalMatrix; uniform vec3 cameraPosition; uniform bool isOrthographic;
attribute vec3 position; attribute vec3 normal; attribute vec2 uv;
`;
const FPRE = `#version 300 es
#define varying in
out highp vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
#define texture2D texture
precision highp float; precision highp int;
#define HIGH_PRECISION
uniform mat4 viewMatrix; uniform vec3 cameraPosition; uniform bool isOrthographic;
#define TONE_MAPPING
${C.tonemapping_pars_fragment}
vec3 toneMapping( vec3 color ) { return ACESFilmicToneMapping( color ); }
${C.encodings_pars_fragment}
vec4 linearToOutputTexel( vec4 value ) { return LinearTosRGB( value ); }
`;
fs.mkdirSync('/tmp/glsl', {recursive:true});
const re = /const (\w+_(VS|FS)) = `([\s\S]*?)`;/g;
let m, n = 0, fail = 0;
while ((m = re.exec(html))){
  const [, name, kind, body] = m, f = `/tmp/glsl/${name}.${kind === 'VS' ? 'vert' : 'frag'}`;
  fs.writeFileSync(f, (kind === 'VS' ? VPRE : FPRE) + resolve(body)); n++;
  try { execFileSync('glslangValidator', [f], {stdio:'pipe'}); }
  catch (e){ fail++; console.log('FAIL', name, String(e.stdout).split('\n').filter(l => /ERROR/.test(l)).slice(0, 3).join(' | ')); }
}
console.log(n + ' shaders, ' + (n - fail) + ' compile');
