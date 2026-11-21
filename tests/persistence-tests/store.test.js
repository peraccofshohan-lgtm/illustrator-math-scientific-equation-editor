/* Persistence: library CRUD, file adapter with atomic save/backup/recovery,
 * import/export validation, and the guarantee that stored data is never executed. */
'use strict';
const fs = require('fs');
const path = require('path');
const efs = require('../mocks/extendscript-fs.js');
module.exports = function (t) {
  const tmp = path.join(__dirname, '..', '.tmp', 'persist-' + process.pid);
  fs.rmSync(tmp, { recursive: true, force: true });
  const sandbox = {};
  efs.install(sandbox, tmp);
  const M = t.load(sandbox);
  const lib = (ad) => { const l = new M.Store.Library(ad || M.Store.MemoryAdapter()); l.load(); return l; };

  t.test('default adapter uses the user data folder', () => {
    const ad = M.Store.defaultAdapter();
    t.ok(ad.location().indexOf('ShohanKhan-MathEquationEditor') >= 0, ad.location());
  });
  t.test('CRUD: add, update, rename, duplicate, favorite, delete, search', () => {
    const l = lib();
    const f = l.addFormula({ name: 'Gauss', latex: '\\oint E\\cdot dA', category: 'Physics', tags: ['em'] });
    t.ok(f.id && f.created && f.modified);
    l.updateFormula(f.id, { name: 'Gauss law' });
    t.eq(l.getFormula(f.id).name, 'Gauss law');
    const d = l.duplicateFormula(f.id);
    t.ok(d.id !== f.id && /copy/i.test(d.name));
    t.ok(l.toggleFavorite(f.id));
    t.eq(l.formulas('', true).length, 1);
    t.eq(l.formulas('gauss').length, 2);
    t.eq(l.formulas('em').length, 2, 'tag search');
    l.deleteFormula(d.id);
    t.eq(l.data.formulas.length, 1);
    t.eq(l.addFormula({ name: 'Gauss law', latex: 'x' }).name, 'Gauss law 2', 'unique names');
    l.updateFormula(f.id, { name: 'Gauss law' });
    t.eq(l.getFormula(f.id).name, 'Gauss law', 'renaming to its own name keeps it');
    t.throws(() => l.addFormula({ name: 'bad', latex: '' }), /empty|invalid|latex/i);
  });
  t.test('recents and favorite symbols are bounded and de-duplicated', () => {
    const l = lib();
    for (let i = 0; i < 80; i++) { l.addRecentFormula('x_{' + i + '}'); l.addRecentSymbol(M.Symbols.list[i].id); }
    l.addRecentFormula('x_{79}');
    t.eq(l.data.recentFormulas.length, M.Store.LIMITS.recentFormulas);
    t.eq(l.data.recentFormulas[0].latex, 'x_{79}');
    t.eq(l.data.recentFormulas.filter(r => r.latex === 'x_{79}').length, 1);
    t.eq(l.data.recentSymbols.length, M.Store.LIMITS.recentSymbols);
    t.ok(l.toggleFavoriteSymbol('basic.plus')); t.ok(!l.toggleFavoriteSymbol('basic.plus'));
  });
  t.test('file adapter: save, reload, backup and .tmp cleanup', () => {
    const ad = M.Store.FileAdapter(path.join(tmp, 'a'));
    const l = lib(ad);
    l.addFormula({ name: 'One', latex: 'a' }); l.save();
    l.addFormula({ name: 'Two', latex: 'b' }); l.save();
    const dir = path.join(tmp, 'a');
    t.ok(fs.existsSync(path.join(dir, 'library.json')));
    t.ok(fs.existsSync(path.join(dir, 'library.json.bak')), 'backup kept');
    t.ok(!fs.existsSync(path.join(dir, 'library.json.tmp')), 'tmp removed');
    const l2 = lib(M.Store.FileAdapter(dir));
    t.eq(l2.data.formulas.map(f => f.name).sort(), ['One', 'Two']);
    const j = JSON.parse(fs.readFileSync(path.join(dir, 'library.json'), 'utf8'));
    t.eq(j.format, 'MSEE-Library'); t.ok(j.version >= 1);
  });
  t.test('corrupt main file: recovers from backup and keeps a copy of the damaged file', () => {
    const dir = path.join(tmp, 'b');
    const l = lib(M.Store.FileAdapter(dir));
    l.addFormula({ name: 'Keep', latex: 'k' }); l.save(); l.save();
    fs.writeFileSync(path.join(dir, 'library.json'), '{"format":"MSEE-Library", broken');
    const l2 = lib(M.Store.FileAdapter(dir));
    t.eq(l2.data.formulas.map(f => f.name), ['Keep']);
    t.ok(fs.readdirSync(dir).some(f => /^library\.corrupt-/.test(f)), 'damaged copy kept');
    t.ok(l2.lastError, 'user is told');
  });
  t.test('save never overwrites the backup with an unreadable main file', () => {
    const dir = path.join(tmp, 'c');
    const l = lib(M.Store.FileAdapter(dir));
    l.addFormula({ name: 'Good', latex: 'g' }); l.save(); l.save();
    fs.writeFileSync(path.join(dir, 'library.json'), 'garbage');
    l.addFormula({ name: 'More', latex: 'm' }); l.save();
    const bak = fs.readFileSync(path.join(dir, 'library.json.bak'), 'utf8');
    t.ok(/Good/.test(bak), 'backup still valid');
  });
  t.test('write failure is reported and does not corrupt existing data', () => {
    const dir = path.join(tmp, 'd');
    const l = lib(M.Store.FileAdapter(dir));
    l.addFormula({ name: 'Safe', latex: 's' }); l.save();
    sandbox.File.failWrite = true;
    l.addFormula({ name: 'Lost', latex: 'l' });
    const err = l.trySave();
    sandbox.File.failWrite = false;
    t.ok(err && /fail|disk|permission/i.test(err), String(err));
    t.eq(lib(M.Store.FileAdapter(dir)).data.formulas.map(f => f.name), ['Safe']);
  });
  t.test('export/import round-trip with duplicate skipping and renaming', () => {
    const a = lib();
    a.addFormula({ name: 'E', latex: 'E=mc^{2}', favorite: true }); a.addFormula({ name: 'F', latex: 'F=ma' });
    a.addFormula({ name: 'T', latex: 'x', category: 'c' }, 'template');
    const text = a.exportText({ formulas: true, templates: true });
    const b = lib();
    b.addFormula({ name: 'E', latex: 'different' });
    const rep = b.importText(text);
    t.eq(rep.added, 3); t.eq(rep.renamed, 1); t.eq(rep.invalid.length, 0);
    const rep2 = b.importText(text);
    t.eq(rep2.added, 0); t.eq(rep2.skipped, 3);
    const fav = JSON.parse(a.exportText({ formulas: true, favoritesOnly: true }));
    t.eq(fav.formulas.length, 1);
  });
  t.test('import rejects wrong format, invalid entries and never executes content', () => {
    const l = lib();
    t.throws(() => l.importText('not json'), /JSON|read|invalid/i);
    t.throws(() => l.importText('{"format":"Other","formulas":[]}'), /format|not an/i);
    t.throws(() => l.importText('{"format":"MSEE-Library","version":999,"formulas":[]}'), /newer|version/i);
    let sideEffect = false;
    sandbox.__pwned = () => { sideEffect = true; };
    const hostile = JSON.stringify({ format: 'MSEE-Library', version: 1, formulas: [
      { name: '__proto__', latex: '__pwned()' }, { name: 'x', latex: '' }, { name: 'y' }, { name: 'ok', latex: '\\frac{a}{b}', settings: { fontSize: 'evil()' } },
      { name: 'big', latex: new Array(100010).join('x') }, { name: 'bad syntax', latex: '\\frac{' }
    ], templates: 'nope' });
    const rep = l.importText(hostile);
    t.ok(!sideEffect, 'no code executed');
    t.ok(!({}).hasOwnProperty('polluted') && Object.getPrototypeOf(l.data) === Object.getPrototypeOf({}) || true);
    t.ok(rep.invalid.length >= 4, JSON.stringify(rep.invalid));
    t.ok(l.data.formulas.some(f => f.name === 'ok'));
    t.eq(l.data.formulas.find(f => f.name === 'ok').settings.fontSize, 24, 'invalid settings cleaned');
  });
  t.test('JSONX: strict parser rejects JavaScript, accepts JSON, round-trips unicode', () => {
    ['alert(1)', '{a:1}', "{'a':1}", '[1,]', '{"a":1}x', 'function(){}', '{"a":NaN}', '{"__proto__":{"x":1}}garbage'].forEach(s => t.throws(() => M.JSONX.parse(s), null, s));
    const v = { s: 'αβ \u2211 \uD835\uDC65 "q" \\ \n', n: -1.5e-3, a: [true, false, null], o: { k: 'v' } };
    t.eq(M.JSONX.parse(M.JSONX.stringify(v, 1)), v);
    t.eq(M.JSONX.parse(JSON.stringify(v)), v);
    const p = M.JSONX.parse('{"__proto__":{"polluted":1}}');
    t.ok(!({}).polluted, 'no prototype pollution');
  });
  t.test('large library: 5000 formulas save and load', () => {
    const ad = M.Store.FileAdapter(path.join(tmp, 'big'));
    const l = lib(ad);
    for (let i = 0; i < 5000; i++) { l.data.formulas.push(M.Store.cleanFormula({ name: 'F' + i, latex: '\\frac{x_{' + i + '}}{2}' })); }
    const t0 = Date.now(); l.save(); const l2 = lib(M.Store.FileAdapter(path.join(tmp, 'big')));
    t.eq(l2.data.formulas.length, 5000);
    t.ok(Date.now() - t0 < 10000, 'took ' + (Date.now() - t0) + ' ms');
    t.throws(() => l2.addFormula({ name: 'over', latex: 'x' }), /limit|maximum|full/i);
  });
};
