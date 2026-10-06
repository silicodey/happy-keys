// Real-browser screenshots: inlines three.js so no CDN is needed.
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright-core');
const nm = p => fs.readFileSync(path.join(__dirname, '..', 'node_modules/three', p), 'utf8');
function inline(file){
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<script src="https:\/\/cdnjs[^"]+three\.min\.js"><\/script>/, () => '<script>' + nm('build/three.min.js') + '</script>');
  html = html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/(examples\/js\/[^"]+)"><\/script>/g, (m, p) => '<script>' + nm(p) + '</script>');
  html = html.replace(/<link[^>]+googleapis[^>]*>/g, '');
  const out = file.replace(/\.html$/, '.inl.html'); fs.writeFileSync(out, html); return out;
}
(async () => {
  const [file, script] = [process.argv[2], process.argv[3]];
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const steps = require(path.resolve(script));
  for (const [name, w, h, fn] of steps){
    const pg = await b.newPage({viewport:{width:w, height:h}, deviceScaleFactor:1});
    const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await pg.goto('file://' + path.resolve(inline(file)));
    await pg.waitForTimeout(2500);
    if (fn) await fn(pg);
    await pg.screenshot({path:process.env.SHOTS + '/' + name + '.png', timeout:180000});
    console.log(name, errs.length ? 'ERRORS: ' + errs.slice(0,3).join(' | ') : 'ok');
    await pg.close();
  }
  await b.close();
})();
