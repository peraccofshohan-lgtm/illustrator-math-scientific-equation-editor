/* Runs the release script in a sandbox stripped of every ES5+ built-in
 * (ExtendScript provides an ES3 standard library) and drives the main code
 * paths. Test code here only uses index loops on sandbox arrays. */
'use strict';
const sui = require('../mocks/scriptui.js');
const ai = require('../mocks/illustrator.js');
module.exports = function (t) {
  const sandbox = { __es3: true };
  const log = sui.install(sandbox, { prompts: ['Saved', 'General'] });
  const env = ai.install(sandbox, {});
  let M;
  t.test('script loads with ES5 built-ins removed', () => {
    M = t.load(sandbox);
    t.ok(M && M.VERSION);
    t.eq(typeof sandbox.JSON, 'undefined');
  });
  t.test('ES3: every template parses, serialises, round-trips and lays out', () => {
    const items = M.Templates.items;
    for (let i = 0; i < items.length; i++) {
      const r = M.Parser.parse(items[i].latex).root;
      t.ok(M.AST.equal(r, M.Parser.parse(M.Serializer.toLatex(r)).root), items[i].name);
      M.Layout.compute(r, M.Formatting.defaults());
      M.Serializer.plain(r);
    }
  });
  t.test('ES3: every symbol snippet parses and lays out', () => {
    for (let i = 0; i < M.Symbols.list.length; i++) { M.Layout.compute(M.Parser.parse(M.Symbols.list[i].ins).root, M.Formatting.defaults()); }
    t.ok(M.Symbols.search('integral', 'all').length > 0);
    t.ok(M.Templates.search('maxwell', 'all').length > 0);
  });
  t.test('ES3: chemistry balancing and molar mass', () => {
    t.eq(M.Chem.balance('KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2').text, '2KMnO4 + 16HCl -> 2KCl + 2MnCl2 + 8H2O + 5Cl2');
    t.ok(M.Chem.molarMass('CuSO4.5H2O').mass > 249);
  });
  t.test('ES3: JSONX, store save/load/import/export', () => {
    const lib = new M.Store.Library(M.Store.MemoryAdapter()); lib.load();
    lib.addFormula({ name: 'a', latex: '\\frac{1}{2}', tags: ['x'] });
    lib.save();
    const l2 = new M.Store.Library(lib.adapter); l2.load();
    t.eq(l2.data.formulas.length, 1);
    const rep = l2.importText(lib.exportText({ formulas: true }));
    t.eq(rep.skipped, 1);
  });
  t.test('ES3: model editing, undo/redo and all editor operations', () => {
    const m = new M.Model({});
    m.setLatex('\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}+x^{2}');
    const cell = m.root.items[0].rows[0][0].id;
    m.apply('r', r => M.Editor.matrixOp(r, cell, 'rowBelow'));
    m.apply('w', r => M.Editor.wrap(r, m.root.items[2].id, 'sqrt'));
    m.apply('s', r => M.Editor.setStyle(r, m.root.items[2].id, { color: 'red', scale: 1.2 }));
    for (const k in M.Editor.SNIPPETS) { if (Object.prototype.hasOwnProperty.call(M.Editor.SNIPPETS, k)) { m.insertLatex(M.Editor.SNIPPETS[k]); } }
    while (m.undo()) { /* all the way back */ }
    t.eq(m.latex(), '');
  });
  t.test('ES3: full UI launch, preview drawing and insertion into the mock document', () => {
    const adapter = M.Store.MemoryAdapter();
    M.UI.launch({ adapter });
    t.eq(log.alerts.length, 0, log.alerts.join('\n'));
    M.UI.c.src.text = '\\int_{0}^{1} \\frac{\\sqrt{x}}{1+x^{2}}\\,\\mathrm{d}x';
    M.UI.applySource(true);
    M.UI.c.pv.onDraw();
    t.ok(M.UI.c.pv.graphics.calls.length > 10);
    M.UI.insert(false);
    t.eq(env.docs[0].activeLayer.groupItems.length, 1);
    M.UI.saveFormula();
    t.eq(M.UI.lib.data.formulas.length, 1);
    const tabs = ['Home', 'Formula Library', 'Favorites', 'Recent'];
    for (let i = 0; i < tabs.length; i++) { M.UI.onTabShown(tabs[i]); }
    M.UI.c.gsearch.text = 'sum'; M.UI.globalSearch();
    M.UI.c.chemIn.text = 'H2 + O2 -> H2O'; M.UI.chemBalance(true);
    M.UI.c.fmt.fontSize.text = '30'; M.UI.applyFormatting();
    t.eq(M.UI.model.settings.fontSize, 30);
    M.UI.win.close();
    t.ok(adapter.files['library.json'].length > 100);
  });
};
