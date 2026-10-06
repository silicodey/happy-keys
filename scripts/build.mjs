// Builds the single-file pages from src/.
//   npm run build                          → index.html (the studio) + examples/*.html
//   node scripts/build.mjs portfolios/x.json → examples/x.html (one finished portfolio)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
const engine = () => fs.readdirSync(path.join(ROOT, 'src/engine')).filter(f => f.endsWith('.js')).sort()
  .map(f => src('engine/' + f)).join('');

export function assemble(portfolio, {studio = true} = {}){
  const data = portfolio == null ? '' : JSON.stringify(portfolio, null, 2).replace(/<\//g, '<\\/');
  const tag = '<script type="application/json" id="portfolio">' + (data ? '\n' + data + '\n' : '') + '</script>';
  let studioParts = '';
  if (studio){
    /* the studio exports the exact viewer page, so it carries that page as a template rather than
       serializing the live document (which a host may have added its own elements to) */
    const tpl = assemble(null, {studio:false});
    studioParts = '<script>window.KS_TEMPLATE = ' + JSON.stringify(tpl).replace(/</g, '\\u003c') + ';</script>\n' + src('studio.html');
  }
  return src('head.html').replace('<!--PORTFOLIO-->', tag)
    .replace('<title>Portfolio</title>', studio ? '<title>Keystreet Studio</title>' : '<title>Portfolio</title>')
    + '<script>\n' + src('module.js') + src('loader.js') + engine()
    + '}\nwindow.Keystreet = {validate:validatePortfolio, boot, applyMeta, settings:SETTINGS_INFO, miniatures:MINIATURES,\n'
    + '  colors:FALLBACK_COLORS, usableKeys, keyLabels:KEY_LABELS, tods:TOD_NAMES, max:MAX_PROJECTS};\n'
    + "if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);\n})();\n</script>\n"
    + studioParts + '</body>\n</html>\n';
}

function buildExample(file){
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = path.join(ROOT, 'examples', path.basename(file, '.json') + '.html');
  fs.mkdirSync(path.dirname(out), {recursive:true});
  fs.writeFileSync(out, assemble(json, {studio:false}));
  console.log('wrote', path.relative(ROOT, out));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  const arg = process.argv[2];
  if (arg) buildExample(arg);
  else {
    fs.writeFileSync(path.join(ROOT, 'index.html'), assemble(null));
    console.log('wrote index.html');
    for (const f of fs.readdirSync(path.join(ROOT, 'portfolios')).filter(f => f.endsWith('.json')).sort())
      buildExample(path.join(ROOT, 'portfolios', f));
  }
}
