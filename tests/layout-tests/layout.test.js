/* Layout engine: finite geometry, dimensional relations, hit testing, preview. */
'use strict';
const { layoutFinite } = require('../harness.js');
module.exports = function (t) {
  const M = t.load();
  const set = M.Formatting.defaults();
  const lay = (s, st) => M.Layout.compute(M.Parser.parse(s).root, st || set);
  const reg = (L, type, root) => { let id = null; M.AST.walk(root, n => { if (!id && n.type === type) { id = n.id; } }); return M.Layout.regionOf(L, id); };

  t.test('every template lays out with finite geometry and positive size', () => {
    M.Templates.items.forEach(tp => {
      const L = lay(tp.latex);
      t.eq(layoutFinite(L), [], tp.name);
      t.ok(L.width > 0 && L.ascent + L.descent > 0, tp.name);
    });
  });
  t.test('every symbol lays out with finite geometry', () => {
    M.Symbols.list.forEach(s => { const L = lay(s.ins); t.eq(layoutFinite(L), [], s.id); });
  });
  t.test('fraction is taller than its parts and centred on the math axis', () => {
    const a = lay('a'), f = lay('\\frac{a}{b}');
    t.ok(f.ascent > a.ascent && f.descent > a.descent);
    const bar = f.prims.find(p => p.k === 'rule');
    t.ok(bar && bar.y > 0 && bar.y < f.ascent, 'bar above baseline');
    t.ok(Math.abs(bar.y + bar.h / 2 - M.Layout.AXIS * 24) < 1.5, 'bar on axis');
  });
  t.test('superscript raised, subscript lowered, both smaller', () => {
    const L = lay('x^{2}_{i}');
    const tx = L.prims.filter(p => p.k === 'text');
    const x = tx.find(p => p.t === 'x' || /x/.test(p.t)), two = tx.find(p => p.t === '2'), i = tx.find(p => p.t === 'i' || /i/.test(p.t) && p !== x);
    t.ok(two.y > x.y && i.y < x.y, 'raised/lowered');
    t.ok(two.size < x.size && i.size < x.size, 'script size');
    t.ok(two.x > x.x && i.x > x.x, 'to the right');
  });
  t.test('display style enlarges big operators and limits go above/below', () => {
    const d = lay('\\sum_{i=1}^{n} i', M.Formatting.merge(set, { displayStyle: true }));
    const tx = d.prims.filter(p => p.k === 'text');
    const n = tx.find(p => p.t === 'n');
    const sigma = tx.find(p => p.t === '\u2211');
    t.ok(sigma && n && n.y > sigma.y + 5, 'upper limit above the sigma');
  });
  t.test('radical covers its radicand; delimiters stretch with content', () => {
    const r = lay('\\sqrt{\\frac{a}{b}}');
    const path = r.prims.find(p => p.k === 'path' && /radical/i.test(p.role || ''));
    t.ok(path, 'radical path drawn');
    const small = lay('\\left( x \\right)'), big = lay('\\left( \\frac{\\frac{a}{b}}{c} \\right)');
    const h = L => { const ys = []; L.prims.filter(p => p.k === 'path').forEach(p => p.pts.forEach(q => ys.push(q.a[1]))); return Math.max(...ys) - Math.min(...ys); };
    t.ok(h(big) > h(small) * 1.8, 'paren grows: ' + h(small) + ' -> ' + h(big));
  });
  t.test('matrix cell spacing setting widens the matrix', () => {
    const a = lay('\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}');
    const b = lay('\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}', M.Formatting.merge(set, { matrixColGap: 3 }));
    t.ok(b.width > a.width, a.width + ' vs ' + b.width);
  });
  t.test('font size scales geometry linearly', () => {
    const a = lay('\\frac{x}{y}'), b = lay('\\frac{x}{y}', M.Formatting.merge(set, { fontSize: 48 }));
    t.ok(Math.abs(b.width / a.width - 2) < 0.02 && Math.abs(b.ascent / a.ascent - 2) < 0.02);
  });
  t.test('fraction bar thickness and script scale settings are honoured', () => {
    const thick = lay('\\frac{a}{b}', M.Formatting.merge(set, { barThickness: 0.2 })).prims.find(p => p.k === 'rule');
    const thin = lay('\\frac{a}{b}').prims.find(p => p.k === 'rule');
    t.ok(thick.h > thin.h);
    const s1 = lay('x^{2}').prims.find(p => p.t === '2').size, s2 = lay('x^{2}', M.Formatting.merge(set, { scriptScale: 0.5 })).prims.find(p => p.t === '2').size;
    t.ok(s2 < s1);
  });
  t.test('colour settings reach the primitives', () => {
    const L = lay('\\color{#FF0000}{a}+b', M.Formatting.merge(set, { color: '#0000FF' }));
    t.eq(L.prims.find(p => p.t === 'a').color, '#FF0000');
    t.eq(L.prims.find(p => p.t === 'b').color, '#0000FF');
  });
  t.test('hit testing returns the smallest region containing the point', () => {
    const root = M.Parser.parse('\\frac{a}{b}+c').root;
    const L = M.Layout.compute(root, set);
    const ra = M.Layout.regionOf(L, root.items[0].num.items[0].id);
    const hit = M.Layout.hitTest(L, ra.x + ra.w / 2, ra.y + ra.a / 2);
    t.eq(hit.id, root.items[0].num.items[0].id);
    t.eq(M.Layout.hitTest(L, -1000, -1000), null);
  });
  t.test('placeholders are drawn for empty slots only when requested', () => {
    const r = M.Parser.parse('\\frac{}{}').root;
    const on = M.Layout.compute(r, set, { placeholders: true }), off = M.Layout.compute(r, set, {});
    t.ok(on.prims.some(p => p.role === 'placeholder'));
    t.ok(!off.prims.some(p => p.role === 'placeholder'));
  });
  t.test('bounds include all ink', () => {
    const L = lay('\\overbrace{a+b+c}^{n}');
    const b = M.Layout.bounds(L);
    t.ok(b.top >= L.ascent - 0.01 && b.left <= 0.01 && b.right >= L.width - 0.01);
  });
  t.test('preview renderer draws every template with finite coordinates', () => {
    const { Graphics } = require('../mocks/scriptui.js');
    M.Templates.items.slice(0, 120).forEach(tp => {
      const g = new Graphics();
      const L = lay(tp.latex);
      const tr = M.PreviewRenderer.draw(g, L, { width: 500, height: 150, zoom: 1, fit: true, plan: M.Renderer.fontPlan(set) });
      t.ok(g.calls.length > 0, tp.name);
      const p = tr.toLayout(250, 75); t.finite(p[0]); t.finite(p[1]);
    });
  });
};
