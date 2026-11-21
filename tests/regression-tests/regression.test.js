/* Regression tests: each case reproduces a defect found during development. */
'use strict';
module.exports = function (t) {
  const M = t.load();
  const rt = (s) => { const a = M.Parser.parse(s).root; return M.AST.equal(a, M.Parser.parse(M.Serializer.toLatex(a)).root); };

  t.test('R1 serializer: control word followed by a letter keeps a separating space (\\langle E)', () => {
    t.ok(rt('\\langle E\\rangle')); t.ok(rt('\\alpha x')); t.ok(rt('\\partial f'));
  });
  t.test('R2 serializer: class-aware symbol commands (\\bigtriangleup, colon, \\unit dot)', () => {
    t.ok(rt('a\\bigtriangleup b')); t.ok(rt('f:A\\to B')); t.ok(rt('\\unit{kg.m}'));
    t.ok(!/\\colon/.test(M.Serializer.toLatex(M.Parser.parse('f:A').root)));
    t.ok(!/ldotp/.test(M.Serializer.toLatex(M.Parser.parse('\\unit{kg.m}').root)));
  });
  t.test('R3 chemistry: trailing charge signs and electrons counted correctly', () => {
    t.eq(M.Chem.count('SO4^2-').charge, -2); t.eq(M.Chem.count('Fe^3+').charge, 3); t.eq(M.Chem.count('e^-').charge, -1);
    t.eq(M.Chem.count('NH4+').charge, 1);
  });
  t.test('R4 ES3 build: reserved words used as keys are quoted (old ExtendScript parsers)', () => {
    const src = require('../../tools/build.js').build().out;
    t.ok(!/[{,]\s*(default|double|class|int|float|delete|new|function)\s*:/.test(src.replace(/'[^'\n]*'|"[^"\n]*"/g, "''")), 'unquoted reserved key');
  });
  t.test('R5 parser: long letter runs parse in linear time (smart function scan)', () => {
    const t0 = Date.now(); M.Parser.parse(new Array(50001).join('x')); t.ok(Date.now() - t0 < 3000, (Date.now() - t0) + ' ms');
  });
  t.test('R6 serializer: long rows serialise in linear time', () => {
    const r = M.Parser.parse(new Array(12001).join('\\alpha ')).root;
    const t0 = Date.now(); M.Serializer.toLatex(r); t.ok(Date.now() - t0 < 2000, (Date.now() - t0) + ' ms');
  });
  t.test('R7 U.toNumber: invalid input returns null (was undefined -> NaN font size)', () => {
    t.eq(M.U.toNumber('evil()'), null); t.eq(M.U.toNumber('12abc'), null); t.eq(M.U.toNumber(NaN), null);
    t.eq(M.Formatting.clean({ fontSize: 'x' }).fontSize, 24);
  });
  t.test('R8 renderer: CMYK conversion receives an RGB array', () => {
    t.eq(M.U.rgbToCmyk([255, 0, 0]), [0, 100, 100, 0]);
    t.eq(M.U.rgbToCmyk([0, 0, 0]), [0, 0, 0, 100]);
  });
  t.test('R9 store: re-importing the same file does not duplicate renamed items', () => {
    const a = new M.Store.Library(M.Store.MemoryAdapter()); a.load(); a.addFormula({ name: 'E', latex: 'x' });
    const txt = a.exportText({ formulas: true });
    const b = new M.Store.Library(M.Store.MemoryAdapter()); b.load(); b.addFormula({ name: 'E', latex: 'y' });
    b.importText(txt); const r = b.importText(txt);
    t.eq(r.added, 0); t.eq(b.data.formulas.length, 2);
  });
  t.test('R10 parser: input larger than the limit is refused with a clear message', () => {
    t.throws(() => M.Parser.parse(new Array(100002).join('x')), /too long/);
  });
  t.test('R11 serializer plain-text quirks are stable (documented limitations)', () => {
    t.eq(M.Serializer.plain(M.Parser.parse('\\log_2 x').root).replace(/\s/g, ''), 'log\u2082x');
  });
  t.test('R12 nested superscripts: layout and plain text are not exponential in depth', () => {
    let e = 'x'; for (let i = 0; i < 40; i++) { e = 'e^{' + e + '}'; }
    const r = M.Parser.parse(e).root;
    const t0 = Date.now(); M.Layout.compute(r, M.Formatting.defaults()); M.Serializer.plain(r);
    t.ok(Date.now() - t0 < 1000, (Date.now() - t0) + ' ms');
  });
  t.test('R13 node limit admits the largest matrix the builder can create (100 x 100)', () => {
    const src = M.Editor.matrixSnippet(100, 100, 'identity');
    t.eq(M.Parser.parse(src).root.items[0].rows.length, 100);
  });
};
