/* Mandatory extreme tests A-H (stress and robustness). */
'use strict';
const { layoutFinite } = require('../harness.js');
module.exports = function (t) {
  const M = t.load();
  const set = M.Formatting.defaults();
  const full = (src) => {
    const r = M.Parser.parse(src).root;
    const s = M.Serializer.toLatex(r);
    t.ok(M.AST.equal(r, M.Parser.parse(s).root), 'round-trip');
    const L = M.Layout.compute(r, set);
    t.eq(layoutFinite(L), [], 'finite layout');
    return { r, s, L };
  };
  const timed = (ms, fn, label) => { const t0 = Date.now(); const v = fn(); const d = Date.now() - t0; t.ok(d < ms, label + ' took ' + d + ' ms (limit ' + ms + ')'); return v; };

  t.test('A: deep nesting - 40-level nested fractions, roots and scripts', () => {
    let f = 'x', r = 'y', s = 'z';
    for (let i = 0; i < 40; i++) { f = '\\frac{1}{1+' + f + '}'; r = '\\sqrt{1+' + r + '}'; s = 'e^{' + s + '}'; }
    const { L } = timed(3000, () => full(f + '+' + r + '+' + s), 'nested');
    t.ok(L.width > 0 && L.ascent > 0);
    const sz = L.prims.filter(p => p.k === 'text').map(p => p.size);
    t.ok(Math.min(...sz) > 0, 'script sizes stay positive');
    const wraps = [x => '\\left(' + x + '\\right)', x => '\\hat{' + x + '}', x => '\\overbrace{' + x + '}^{k}', x => '\\begin{pmatrix}' + x + '&1\\\\1&1\\end{pmatrix}',
      x => '\\sum_{i=1}^{' + x + '}i', x => 'x_{' + x + '}', x => '\\binom{' + x + '}{2}', x => '\\text{a}\\boxed{' + x + '}', x => '\\begin{cases}' + x + '&1\\end{cases}', x => '\\lim_{' + x + '}f'];
    wraps.forEach((w, k) => { let e = 'q'; for (let i = 0; i < 30; i++) { e = w(e); } timed(3000, () => full(e), 'nest kind ' + k); });
  });
  t.test('B: large structures - 100x100 matrix and 20x20 determinant', () => {
    const mat = (n, env) => '\\begin{' + env + '}' + Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => String((i * 7 + j) % 10)).join('&')).join('\\\\') + '\\end{' + env + '}';
    const { r } = timed(15000, () => full(mat(100, 'bmatrix')), '100x100');
    t.eq(r.items[0].rows.length, 100); t.eq(r.items[0].rows[0].length, 100);
    timed(5000, () => full(mat(20, 'vmatrix')), '20x20');
    t.ok(M.Editor.matrixSnippet(500, 500, 'pmatrix').split('\\\\').length === 100, 'builder clamps to 100 rows');
  });
  t.test('C: long equation - 2000-term polynomial and 300-line aligned system', () => {
    const poly = Array.from({ length: 2000 }, (_, i) => (i % 7 + 1) + 'x^{' + i + '}').join('+');
    const { L } = timed(10000, () => full(poly), 'polynomial');
    t.ok(L.width > 10000);
    const sys = Array.from({ length: 300 }, (_, i) => 'x_{' + i + '}&=' + i).join('\\\\');
    timed(10000, () => full('\\begin{aligned}' + sys + '\\end{aligned}'), 'aligned');
  });
  t.test('D: malformed input fuzzing - truncations and mutations never crash', () => {
    let errors = 0, parsed = 0, internal = [];
    const sources = M.Templates.items.map(x => x.latex);
    let seed = 12345; const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
    const junk = ['{', '}', '\\', '^', '_', '&', '\\\\', '\\left(', '\\right)', '\\begin{pmatrix}', '\\end{bmatrix}', '\\frac', '[', ']', '$', '#', '%', '\u0000', '\uD835'];
    sources.forEach(src => {
      const variants = [src.slice(0, rnd(src.length + 1)), src.slice(rnd(src.length + 1))];
      for (let k = 0; k < 4; k++) { const p = rnd(src.length + 1); variants.push(src.slice(0, p) + junk[rnd(junk.length)] + src.slice(p)); }
      variants.forEach(v => {
        try {
          const r = M.Parser.parse(v).root; parsed++;
          const L = M.Layout.compute(r, set); if (layoutFinite(L).length) { internal.push('NaN: ' + v); }
          M.Serializer.toLatex(r);
        } catch (e) {
          errors++;
          if (e.name !== 'MathError' || e.kind !== M.ErrorKind.PARSER || !(e.pos >= 0 && e.pos <= v.length)) { internal.push(v + ' => ' + (e.kind || e.name) + ': ' + e.message + ' @' + e.pos); }
        }
      });
    });
    t.eq(internal.slice(0, 10), [], 'only clean parser errors with positions');
    t.ok(errors > 100 && parsed > 100, 'errors ' + errors + ', parsed ' + parsed);
  });
  t.test('E: Unicode - astral-plane math letters, combining marks, all symbols in one row', () => {
    full('\uD835\uDC65+\uD835\uDD38+\u2124+x\u0302+\u00C5+\u2211+\u222E+\u2207');
    const all = M.Symbols.list.filter(s => s.kind === 'symbol').map(s => '{' + s.ins + '}').join(' ');
    const { r } = timed(10000, () => full(all), 'all symbols');
    t.ok(M.AST.count(r) > 400);
    t.eq(M.U.codePoints('\uD835\uDC65a').length, 2);
  });
  t.test('F: complex chemistry - large redox, organic combustion, ionic charges', () => {
    const cases = ['K4Fe(CN)6 + KMnO4 + H2SO4 -> KHSO4 + Fe2(SO4)3 + MnSO4 + HNO3 + CO2 + H2O',
      'C57H110O6 + O2 -> CO2 + H2O', 'As2S3 + HNO3 + H2O -> H3AsO4 + H2SO4 + NO',
      'Cr2O7^2- + Fe^2+ + H^+ -> Cr^3+ + Fe^3+ + H2O', 'P4 + OH^- + H2O -> PH3 + H2PO2^-'];
    cases.forEach(c => {
      const r = M.Chem.balance(c);
      Object.keys(r.check).forEach(el => t.eq(r.check[el][0], r.check[el][1], c + ' ' + el));
      t.eq(r.charge[0], r.charge[1], c + ' charge');
      full(r.latex);
    });
  });
  t.test('G: persistence stress - hostile and huge data never executes, limits hold', () => {
    const lib = new M.Store.Library(M.Store.MemoryAdapter()); lib.load();
    const hostile = { format: 'MSEE-Library', version: 1, formulas: [] };
    for (let i = 0; i < 6000; i++) { hostile.formulas.push({ name: 'n' + i + '");alert(1);//', latex: 'x_{' + i + '}', tags: ['<script>'], settings: { fontSize: i } }); }
    hostile.formulas.push({ name: 'constructor', latex: 'constructor' }, { name: 'toString', latex: '\\text{toString}' });
    const rep = timed(20000, () => lib.importText(JSON.stringify(hostile)), 'import 6000');
    t.eq(lib.data.formulas.length, M.Store.LIMITS.formulas, 'capped at the limit');
    t.ok(rep.invalid.some(x => /full/.test(x.reason)));
    const saved = lib.adapter.files; lib.save();
    const again = new M.Store.Library(lib.adapter); again.load();
    t.eq(again.data.formulas.length, M.Store.LIMITS.formulas);
    t.ok(again.data.formulas.every(f => typeof f.latex === 'string' && f.settings.fontSize >= 2 && f.settings.fontSize <= 1296));
  });
  t.test('H: undo/redo stress - 1000 random edits fully reversible, history bounded', () => {
    const m = new M.Model({ historyLimit: 1000 });
    const snippets = ['x', '+', '\\frac{a}{b}', '\\sqrt{2}', '^{2}', '\\alpha', '\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}', '\\sum_{i=1}^{n} i'];
    const states = [m.latex()];
    let seed = 7; const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
    timed(30000, () => {
      for (let i = 0; i < 1000; i++) {
        const op = rnd(4);
        try {
          if (op === 0 || !m.root.items.length) { m.insertLatex(snippets[rnd(snippets.length)]); }
          else if (op === 1) { m.apply('del', r => M.Editor.remove(r, r.items[rnd(r.items.length)].id)); }
          else if (op === 2) { m.apply('wrap', r => M.Editor.wrap(r, r.items[rnd(r.items.length)].id, 'paren')); }
          else { m.setSettings({ fontSize: 10 + rnd(50) }); }
        } catch (e) { /* invalid random op rejected and rolled back */ }
        M.AST.validate(m.root);
        if (states[states.length - 1] !== m.latex() + '|' + m.settings.fontSize) { states.push(m.latex() + '|' + m.settings.fontSize); }
      }
    }, '1000 edits');
    const end = m.latex();
    let n = 0; while (m.undo()) { n++; }
    t.eq(m.latex(), '', 'back to the empty start');
    t.ok(n <= 1000);
    while (m.redo()) { /* replay */ }
    t.eq(m.latex(), end, 'redo replays everything');
    const small = new M.Model({ historyLimit: 5 }); for (let i = 0; i < 100; i++) { small.setLatex('y_{' + i + '}'); }
    t.eq(small.history.undoStack.length, 5);
  });
};
