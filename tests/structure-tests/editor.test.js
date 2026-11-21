/* Structural editing (Equation Builder operations), model, undo/redo and history. */
'use strict';
module.exports = function (t) {
  const M = t.load();
  const model = (src) => { const m = new M.Model({}); if (src) { m.setLatex(src); } return m; };
  const first = (m, type) => { let id = null; M.AST.walk(m.root, n => { if (!id && n.type === type) { id = n.id; } }); return id; };

  t.test('insert into empty slots fills the slot then appends after', () => {
    const m = model();
    m.insertLatex('\\frac{}{}');
    t.eq(m.latex(), '\\frac{}{}');
    const fr = m.root.items[0];
    m.select(fr.num.id); m.insertLatex('a');
    m.select(fr.den.id); m.insertLatex('b');
    t.eq(m.latex(), '\\frac{a}{b}');
    m.select(null); m.insertLatex('+1');
    t.eq(m.latex(), '\\frac{a}{b}+1');
  });
  t.test('wrap, unwrap-by-delete, duplicate, move', () => {
    const m = model('a+b');
    const a = m.root.items[0].id;
    m.apply('wrap', r => M.Editor.wrap(r, a, 'sqrt'));
    t.eq(m.latex(), '\\sqrt{a}+b');
    m.apply('dup', r => M.Editor.duplicate(r, m.root.items[0].id));
    t.eq(m.latex(), '\\sqrt{a}\\sqrt{a}+b');
    m.apply('move', r => M.Editor.move(r, m.root.items[3].id, -1));
    t.eq(m.latex(), '\\sqrt{a}\\sqrt{a}b+');
    m.apply('del', r => M.Editor.remove(r, m.root.items[0].id));
    t.eq(m.latex(), '\\sqrt{a}b+');
    Object.keys(M.Editor.WRAPS).forEach(k => { const mm = model('x'); mm.apply('w', r => M.Editor.wrap(r, mm.root.items[0].id, k)); M.AST.validate(mm.root); t.ok(mm.latex() !== 'x', k); });
  });
  t.test('toggle optional slots on scripts, roots and big operators', () => {
    const m = model('x');
    m.apply('t', r => M.Editor.toggleSlot(r, m.root.items[0].id, 'sup'));
    t.eq(m.root.items[0].type, 'scripts');
    m.apply('t', r => M.Editor.toggleSlot(r, m.root.items[0].id, 'sub'));
    m.select(m.root.items[0].sup.id); m.insertLatex('2');
    m.select(m.root.items[0].sub.id); m.insertLatex('i');
    t.eq(m.latex(), 'x_{i}^{2}');
    const r = model('\\sqrt{y}');
    r.apply('t', root => M.Editor.toggleSlot(root, root.items[0].id, 'index'));
    t.ok(r.root.items[0].index, 'root index added');
    const s = model('\\sum x');
    s.apply('t', root => M.Editor.toggleSlot(root, root.items[0].id, 'lower'));
    t.ok(s.root.items[0].lower, 'lower limit added');
    s.apply('l', root => M.Editor.cycleLimits(root, root.items[0].id));
  });
  t.test('matrix row/column operations and environment change', () => {
    const m = model('\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}');
    const cell = m.root.items[0].rows[0][0].id;
    m.apply('r', r => M.Editor.matrixOp(r, cell, 'rowBelow'));
    t.eq(m.root.items[0].rows.length, 3);
    m.apply('c', r => M.Editor.matrixOp(r, m.root.items[0].rows[0][0].id, 'colRight'));
    t.eq(m.root.items[0].rows[0].length, 3);
    m.apply('dr', r => M.Editor.matrixOp(r, m.root.items[0].rows[1][0].id, 'delRow'));
    m.apply('dc', r => M.Editor.matrixOp(r, m.root.items[0].rows[0][1].id, 'delCol'));
    t.eq(m.latex().replace(/\s/g, ''), '\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}');
    m.apply('e', r => M.Editor.matrixOp(r, m.root.items[0].id, 'env', 'vmatrix'));
    t.eq(m.latex().replace(/\s/g, ''), '\\begin{vmatrix}1&2\\\\3&4\\end{vmatrix}');
    t.throws(() => m.apply('x', r => M.Editor.matrixOp(r, m.root.id, 'rowBelow')), /matrix/i);
  });
  t.test('multiline add/delete line and tag', () => {
    const m = model('\\begin{aligned}a&=b\\\\c&=d\\end{aligned}');
    const L = m.root.items[0];
    const cellId = L.rows[0].cells ? L.rows[0].cells[0].id : M.AST.childRows(L)[0].row.id;
    m.apply('add', r => M.Editor.linesOp(r, cellId, 'add'));
    t.eq(m.root.items[0].rows.length, 3);
    m.apply('del', r => M.Editor.linesOp(r, cellId, 'del'));
    t.eq(m.root.items[0].rows.length, 2);
  });
  t.test('setContent replaces an element; invalid syntax leaves the model untouched', () => {
    const m = model('x+y');
    m.apply('set', r => M.Editor.setContent(r, m.root.items[0].id, '\\alpha^{2}', m.parseOptions));
    t.eq(m.latex(), '\\alpha^{2}+y');
    const before = m.latex();
    t.throws(() => m.apply('set', r => M.Editor.setContent(r, m.root.items[2].id, '\\frac{', m.parseOptions)));
    t.eq(m.latex(), before);
    t.eq(m.history.undoStack.length, 2, 'failed edit not recorded');
  });
  t.test('per-element style set/clear round-trips through syntax', () => {
    const m = model('a+b');
    m.apply('s', r => M.Editor.setStyle(r, m.root.items[2].id, { color: '#0055AA', bold: true, scale: 1.2, dy: 0.1, font: 'Arial' }));
    const src = m.latex();
    t.ok(/\\style\{/.test(src), src);
    const re = M.Parser.parse(src).root;
    t.eq(M.Serializer.toLatex(re), src, 'style survives a round-trip');
    m.apply('c', r => M.Editor.clearStyle(r, m.root.id));
    t.eq(m.latex(), 'a+b');
  });
  t.test('undo/redo restores content, selection and settings; redo cleared by new edit', () => {
    const m = model();
    m.setLatex('a'); m.setLatex('b'); m.setSettings({ fontSize: 40 });
    t.eq(m.settings.fontSize, 40);
    m.undo(); t.eq(m.settings.fontSize, 24); t.eq(m.latex(), 'b');
    m.undo(); t.eq(m.latex(), 'a');
    m.redo(); t.eq(m.latex(), 'b');
    m.setLatex('c');
    t.ok(!m.redo(), 'redo stack cleared');
    t.eq(m.latex(), 'c');
  });
  t.test('history is bounded by its limit', () => {
    const m = new M.Model({ historyLimit: 10 });
    for (let i = 0; i < 50; i++) { m.setLatex('x_{' + i + '}'); }
    t.eq(m.history.undoStack.length, 10);
    let n = 0; while (m.undo()) { n++; }
    t.eq(n, 10);
    t.eq(m.latex(), 'x_{39}');
  });
  t.test('no-op edits are not recorded in history', () => {
    const m = model('a');
    const n = m.history.undoStack.length;
    m.setLatex('a');
    t.eq(m.history.undoStack.length, n);
  });
  t.test('semantic validation reports empty slots and the analyzer classifies rows', () => {
    const issues = M.Semantics.validate(M.Parser.parse('\\frac{}{b}+\\sqrt{}').root);
    t.ok(issues.length >= 2, JSON.stringify(issues));
    t.eq(M.Semantics.validate(M.Parser.parse('\\frac{a}{b}').root).length, 0);
    const a = M.Semantics.analyzeRow(M.Parser.parse('-a+b').root);
    t.ok(a, 'analyzeRow returns a result');
  });
  t.test('structure helpers: describe, count, depth, find, clone, equal', () => {
    const r = M.Parser.parse('\\frac{a}{\\sqrt{b}}').root;
    t.ok(/Fraction/i.test(M.AST.describe(r.items[0])));
    t.ok(M.AST.count(r) >= 5);
    t.ok(M.AST.depth(r) >= 3);
    const c = M.AST.clone(r, true);
    t.ok(M.AST.equal(r, c));
    t.ok(M.AST.find(r, r.items[0].id).node === r.items[0]);
  });
};
