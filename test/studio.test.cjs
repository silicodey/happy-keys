// Drives the studio the way a person would, then opens the exported site in the viewer suite.
const fs = require('fs'), path = require('path'), os = require('os');
const {load, viewerSuite} = require('./harness.cjs');
(async () => {
  const log = [], h = load(path.join(__dirname, '..', 'index.html'));
  const {d, w} = h, $ = id => d.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', {bubbles:true})); };
  const click = sel => { const el = typeof sel === 'string' ? d.querySelector(sel) : sel; if (!el) throw new Error('no element ' + sel); el.click(); };
  const dbg = () => w.KeystreetStudio._debug();
  const check = (name, ok, extra) => log.push((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : ''));
  try {
    await h.settle(60); h.step(4);
    check('studio opens instead of an error', !$('ks').hidden && !$('intro').classList.contains('broken'));
    check('scene boots behind it in preview', !!dbg().engine && d.body.classList.contains('live'), 'setting ' + (dbg().engine && dbg().engine.setting));
    check('first question asked', /Whose keyboard/.test($('ks-body').textContent));

    type($('f-name'), 'Agon Aliu'); type($('f-sub'), 'Silicode · products for builders'); await wait(20); h.step(2);
    check('name reaches the page live', $('brandName').textContent === 'Agon Aliu' && /Agon Aliu/.test(d.title), d.title);

    click('#ks-next'); await wait(10);
    check('step 2 shows four places', d.querySelectorAll('.ks-place').length === 4 && d.querySelectorAll('.ks-place[disabled]').length === 2);
    const ctx0 = h.R().contexts;
    click('[data-setting="kyoto"]'); await wait(900); h.step(4);
    check('choosing Kyoto rebuilds the street', dbg().engine.setting === 'kyoto' && h.R().contexts === ctx0 + 1, 'contexts ' + ctx0 + '→' + h.R().contexts);
    check('old scene torn down', h.R().disposed >= 1 && d.querySelectorAll('canvas#gl').length === 1, 'canvases ' + d.querySelectorAll('canvas#gl').length);
    click('[data-tod="night"]'); await wait(20); h.step(60);
    check('time of day applies', $('todLabel').textContent === 'Night', $('todLabel').textContent);

    click('#ks-next'); await wait(10);
    check('empty state prompts for a first project', !!d.querySelector('[data-add]') && !!d.querySelector('[data-example]'));
    click('[data-add]'); await wait(10);
    check('new card opens with name focused', d.activeElement && d.activeElement.id === 'p0-name');
    type($('p0-name'), 'The Orbitale'); type($('p0-lede'), 'A planet-scale view of what you are building.');
    $('p0-name').dispatchEvent(new w.Event('change', {bubbles:true}));
    await wait(950); h.step(4);
    const idx = () => [...d.querySelectorAll('#idxList li')].map(li => li.querySelector('.k').textContent + '=' + li.querySelector('.n').textContent);
    check('first project appears on the board', idx().length === 1 && /The Orbitale/.test(idx()[0]), idx().join(', '));
    const ctx1 = h.R().contexts;
    type($('p0-name'), 'Orbitale'); await wait(30); h.step(2);
    check('text edits update without a rebuild', h.R().contexts === ctx1 && /=Orbitale$/.test(idx()[0]), idx().join(', '));
    click('.ks-card[data-i="0"] [data-color="' + w.Keystreet.colors[3] + '"]'); await wait(30); h.step(2);
    check('colour change without a rebuild', h.R().contexts === ctx1);
    click('.ks-card[data-i="0"] [data-mini="ship"]'); await wait(900); h.step(4);
    check('miniature change rebuilds', h.R().contexts === ctx1 + 1);

    for (const [n, mini] of [['Openpaga', 'blueprint'], ['Trezio', 'ledger'], ['Revaluatr', 'scales']]){
      click('[data-add]'); await wait(5);
      const i = dbg().state.projects.length - 1;
      type($('p' + i + '-name'), n); await wait(5); $('p' + i + '-name').dispatchEvent(new w.Event('change', {bubbles:true})); click('.ks-card[data-i="' + i + '"] [data-mini="' + mini + '"]');
    }
    type($('p3-url'), 'not a link'); await wait(900); h.step(4);
    check('bad link flagged on its field', !d.querySelector('[data-err="3:url"]').hidden, d.querySelector('[data-err="3:url"]').textContent);
    type($('p3-url'), 'https://revaluatr.com'); await wait(30);
    check('flag clears when fixed', d.querySelector('[data-err="3:url"]').hidden);
    const sel = $('p3-key'); sel.value = 'F4'; sel.dispatchEvent(new w.Event('input', {bubbles:true})); await wait(900); h.step(4);
    check('chosen key is used', /^F4=Revaluatr$/.test(idx().find(s => /Revaluatr/.test(s)) || ''), idx().join(', '));
    check('taken keys are disabled elsewhere', !!d.querySelector('#p2-key option[value="F4"][disabled]') || !d.querySelector('#p2-key'));
    click('.ks-card[data-i="1"] .ks-head'); await wait(10); h.step(90);
    check('opening a card focuses its key', $('panel').classList.contains('open') && $('pName').textContent === 'Openpaga', $('pName').textContent);
    click('.ks-card[data-i="1"] [data-move="-1"]'); await wait(900); h.step(4);
    check('reorder', dbg().state.projects[0].name === 'Openpaga');
    click('.ks-card[data-i="0"] [data-remove="ask"]'); await wait(5);
    check('remove asks first', !!d.querySelector('[data-remove="yes"]'));
    click('[data-remove="no"]'); await wait(5);
    check('keep it', dbg().state.projects.length === 4);

    let saved = null; try { saved = JSON.parse(w.localStorage.getItem('keystreet.draft.v1')); } catch (_){}
    await wait(400);
    try { saved = JSON.parse(w.localStorage.getItem('keystreet.draft.v1')); } catch (_){}
    check('draft saved in the browser', saved && saved.state.projects.length === 4);

    click('#ks-next'); await wait(10);
    check('publish step ready', /ready/.test(d.querySelector('.ks-q').textContent) && !d.querySelector('[data-dl="site"]').disabled, d.querySelector('.ks-q').textContent);
    const site = dbg().siteHTML();
    check('export has no studio in it', !/KeystreetStudio = |id="ks"|ks-fade|KS:STUDIO/.test(site), (site.length/1024).toFixed(0) + ' KB');
    check('export carries the portfolio', /"setting": "kyoto"/.test(site) && /Revaluatr/.test(site));
    fs.writeFileSync(path.join(os.tmpdir(), 'keystreet-exported.html'), site);

    click('[data-visitor]'); await wait(900); h.step(5);
    check('visitor view shows the welcome screen', d.body.classList.contains('visitor') && !$('intro').classList.contains('gone') && $('introName').textContent === 'Agon Aliu');
    $('ks-back').click(); await wait(900); h.step(4);
    check('back to the studio', !d.body.classList.contains('visitor') && $('intro').classList.contains('gone') === false && d.body.classList.contains('live'));

    log.push('audio contexts ' + w.__audio.contexts + ' closed ' + w.__audio.closed + ' | renderers ' + h.R().contexts + ' disposed ' + h.R().disposed);
  } catch (e){ h.errors.push('TEST: ' + e.stack); }
  console.log(log.join('\n') + '\nSTUDIO ERRORS (' + h.errors.length + ')' + (h.errors.length ? ':\n' + h.errors.slice(0, 5).join('\n---\n') : ''));
  const v = await viewerSuite(path.join(os.tmpdir(), 'keystreet-exported.html'));
  console.log('===== exported site\n' + v.log.join('\n') + '\nERRORS (' + v.errors.length + ')' + (v.errors.length ? ':\n' + v.errors.slice(0, 5).join('\n---\n') : ''));
  const failed = log.filter(l => l.startsWith('FAIL')).length + h.errors.length + v.errors.length + v.log.filter(l => /: (\d+)\/(\d+)$/.test(l) && RegExp.$1 !== RegExp.$2).length;
  console.log(failed ? '\n' + failed + ' problem(s)' : '\nall studio checks passed');
  process.exit(failed ? 1 : 0);
})();
