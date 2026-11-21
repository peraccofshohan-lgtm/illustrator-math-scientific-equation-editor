/* Renderer logic against the Illustrator DOM mock: object creation, naming,
 * notes, placement, document safety and rollback. (Mock-based: verifies the
 * script's calls and bookkeeping, not Illustrator's actual output.) */
'use strict';
const ai = require('../mocks/illustrator.js');

function setup(opts) {
  const sandbox = {};
  const env = ai.install(sandbox, opts);
  const { load } = require('../load.js');
  const M = load(sandbox);
  return { M, env, doc: env.docs[0] };
}
function parse(M, s) { return M.Parser.parse(s).root; }

module.exports = function (t) {
  t.test('editable group: named group with text frames, rule, note', () => {
    const { M, doc } = setup();
    const r = M.Renderer.insert(parse(M, '\\frac{a+b}{c}'), M.Formatting.defaults(), { latex: '\\frac{a+b}{c}', mode: 'group' });
    t.eq(r.mode, 'group');
    t.eq(doc.activeLayer.groupItems.length, 1);
    const g = doc.activeLayer.groupItems[0];
    t.ok(/^Equation: /.test(g.name), g.name);
    t.eq(g.textFrames.length, 4, 'a + b c');
    t.eq(g.pathItems.length, 1, 'fraction bar');
    t.ok(/Fraction bar/i.test(g.pathItems[0].name), g.pathItems[0].name);
    t.eq(JSON.stringify(r.stats), JSON.stringify({ text: 4, paths: 0, rules: 1 }));
    const d = M.Renderer.decodeNote(g.note);
    t.eq(d.latex, '\\frac{a+b}{c}');
    t.eq(d.mode, 'group');
    t.ok(!g.textFrames._items.some(f => /temporary/.test(f.name)), 'measurement frame removed');
    t.ok(g.selected, 'new group selected');
  });

  t.test('numerator is above denominator and the bar lies between them (y up)', () => {
    const { M, doc } = setup();
    M.Renderer.insert(parse(M, '\\frac{a}{b}'), M.Formatting.defaults(), { mode: 'group' });
    const g = doc.activeLayer.groupItems[0];
    const fa = g.textFrames._items.find(f => /a$/.test(f.name)), fb = g.textFrames._items.find(f => /b$/.test(f.name));
    const bar = g.pathItems[0]._bounds();
    t.ok(fa.anchor[1] > bar[1], 'numerator baseline above bar');
    t.ok(fb.anchor[1] + 0.75 * 24 < bar[3] + 24, 'denominator below');
    t.ok(fa.anchor[1] > fb.anchor[1]);
  });

  t.test('radicals, delimiters and big operators produce vector paths', () => {
    const { M, doc } = setup();
    const r = M.Renderer.insert(parse(M, '\\sqrt{\\left(\\sum_{i=1}^{n} x_i\\right)}'), M.Formatting.defaults(), { mode: 'group' });
    t.ok(r.stats.paths >= 3, 'radical + two parens: ' + JSON.stringify(r.stats));
    doc.activeLayer.groupItems[0].pathItems._items.forEach(p => p.points.forEach(q => { t.finite(q[0]); t.finite(q[1]); }));
  });

  t.test('separate components mode leaves ungrouped items on the layer', () => {
    const { M, doc } = setup();
    const r = M.Renderer.insert(parse(M, 'x^{2}+1'), M.Formatting.defaults(), { mode: 'components' });
    t.eq(doc.activeLayer.groupItems.length, 0);
    t.ok(doc.activeLayer.textFrames.length >= 4);
    t.ok(r.warnings.some(w => /cannot be re-edited/.test(w)));
  });

  t.test('single text mode for plain-compatible input, refused otherwise', () => {
    const { M, doc } = setup();
    const r = M.Renderer.insert(parse(M, 'E=mc^{2}'), M.Formatting.defaults(), { latex: 'E=mc^{2}', mode: 'single' });
    t.eq(r.item.typename, 'TextFrame');
    t.eq(doc.activeLayer.groupItems.length, 0, 'wrapper group removed');
    t.ok(/E\s*=\s*mc\u00B2/.test(r.item.contents.replace(/[\uD835][\uDC00-\uDFFF]/g, function (x) { return x; })) || /\uD835/.test(r.item.contents), r.item.contents);
    t.eq(M.Renderer.decodeNote(r.item.note).mode, 'single');
    t.throws(() => M.Renderer.insert(parse(M, '\\frac{a}{b}'), M.Formatting.defaults(), { mode: 'single' }), /Single text mode is not possible/);
    t.eq(doc.activeLayer.groupItems.length, 0, 'nothing left behind after refusal');
  });

  t.test('outlines mode converts text frames, keeps note for re-edit', () => {
    const { M, doc } = setup();
    const r = M.Renderer.insert(parse(M, 'a+b'), M.Formatting.defaults(), { mode: 'outlines' });
    const g = doc.activeLayer.groupItems[0];
    t.eq(g.textFrames.length, 0);
    t.ok(g.groupItems.length >= 3, 'outline groups created');
    t.eq(M.Renderer.decodeNote(g.note).mode, 'outlines');
  });

  t.test('no document / locked layer / hidden layer are refused before creating anything', () => {
    let s = setup({ noDocument: true });
    t.throws(() => s.M.Renderer.insert(parse(s.M, 'x'), {}, {}), /No document is open/);
    s = setup();
    s.doc.activeLayer.locked = true;
    t.throws(() => s.M.Renderer.insert(parse(s.M, 'x'), {}, {}), /locked/);
    t.eq(s.env.env.created, 0);
    s = setup();
    s.doc.activeLayer.visible = false;
    t.throws(() => s.M.Renderer.insert(parse(s.M, 'x'), {}, {}), /hidden/);
    s = setup();
    t.throws(() => s.M.Renderer.insert(s.M.AST.row(), {}, {}), /empty/);
  });

  t.test('locked parent layer is detected', () => {
    const s = setup();
    const parent = new ai.Layer(s.env.env, s.doc, 'Parent');
    parent.locked = true;
    s.doc.activeLayer.parent = parent;
    t.throws(() => s.M.Renderer.insert(parse(s.M, 'x'), {}, {}), /locked/);
  });

  t.test('failure mid-insertion rolls back every created object', () => {
    /* failAt 2 is the temporary measurement frame: that failure is tolerated (approximate metrics) */
    const ok = setup({ failAt: 2 });
    const r = ok.M.Renderer.insert(parse(ok.M, 'a+b'), ok.M.Formatting.defaults(), { mode: 'group' });
    t.ok(r.ok && !r.item.textFrames._items.some(f => /temporary/.test(f.name)), 'measurement failure tolerated');
    for (const failAt of [1, 3, 5, 8]) {
      const s = setup({ failAt });
      const e = t.throws(() => s.M.Renderer.insert(parse(s.M, '\\frac{a+b}{\\sqrt{c}}'), s.M.Formatting.defaults(), { mode: 'group' }), /rolled back|Simulated/);
      t.eq(s.doc.activeLayer.groupItems.length, 0, 'group removed (failAt ' + failAt + ')');
      t.eq(s.doc.activeLayer.textFrames.length, 0);
      t.eq(s.doc.activeLayer.pathItems.length, 0);
      t.ok(e.kind === 'Rendering error' || /RENDER|Render/i.test(e.kind), 'error kind ' + e.kind);
    }
  });

  t.test('replace: new version takes the old position, old one removed; failure restores it', () => {
    const s = setup();
    const r1 = s.M.Renderer.insert(parse(s.M, 'x'), s.M.Formatting.defaults(), { mode: 'group' });
    r1.item.translate(100, -50);
    const before = r1.item.geometricBounds;
    const r2 = s.M.Renderer.insert(parse(s.M, 'x+y'), s.M.Formatting.defaults(), { mode: 'group', replaceItem: r1.item });
    t.ok(r1.item.removed, 'old removed');
    t.eq(s.doc.activeLayer.groupItems.length, 1);
    const xOld = r1.item.textFrames[0].anchor, xNew = r2.item.textFrames._items.find(f => /: x$/.test(f.name)).anchor;
    t.ok(Math.abs(xOld[0] - xNew[0]) < 0.01 && Math.abs(xOld[1] - xNew[1]) < 0.01, 'baseline origin preserved after move: ' + xOld + ' vs ' + xNew);
    t.ok(before[0] > 350, 'old item had been moved');
    /* failure during replacement keeps the old item visible */
    s.env.env.failAt = s.env.env.created + 3;
    t.throws(() => s.M.Renderer.insert(parse(s.M, 'a+b+c'), s.M.Formatting.defaults(), { mode: 'group', replaceItem: r2.item }));
    t.ok(!r2.item.removed && r2.item.hidden === false, 'old equation restored');
    t.eq(s.doc.activeLayer.groupItems.length, 1);
  });

  t.test('findSelectedEquation walks from a selected child to the group note', () => {
    const s = setup();
    t.eq(s.M.Renderer.findSelectedEquation(), null);
    const r = s.M.Renderer.insert(parse(s.M, '\\sqrt{2}'), s.M.Formatting.merge(s.M.Formatting.defaults(), { fontSize: 40 }), { latex: '\\sqrt{2}', mode: 'group' });
    s.doc.selection = [r.item.textFrames[0]];
    const f = s.M.Renderer.findSelectedEquation();
    t.eq(f.latex, '\\sqrt{2}');
    t.eq(f.settings.fontSize, 40);
    t.ok(f.item === r.item);
  });

  t.test('notes are data only: malformed or hostile notes are rejected without execution', () => {
    const { M } = setup();
    t.eq(M.Renderer.decodeNote('random note'), null);
    t.eq(M.Renderer.decodeNote('MSEE:1:{bad json'), null);
    t.eq(M.Renderer.decodeNote('MSEE:1:(function(){throw 1})()'), null);
    const d = M.Renderer.decodeNote('MSEE:1:{"latex":"x","settings":{"fontSize":"9e9","color":"javascript:alert(1)"},"mode":"evil"}');
    t.eq(d.mode, 'group');
    t.ok(d.settings.fontSize <= 1296);
    t.ok(/^#[0-9A-F]{6}$/.test(d.settings.color));
  });

  t.test('CMYK documents receive CMYK colors; RGB documents RGB', () => {
    let s = setup({ cmyk: true });
    let r = s.M.Renderer.insert(parse(s.M, 'x'), s.M.Formatting.merge(s.M.Formatting.defaults(), { color: '#FF0000' }), { mode: 'group' });
    let ca = r.item.textFrames[0].characterAttributes;
    t.eq(ca.fillColor.typename, 'CMYKColor');
    t.ok(ca.fillColor.magenta > 90 && ca.fillColor.yellow > 90, JSON.stringify(ca.fillColor));
    s = setup();
    r = s.M.Renderer.insert(parse(s.M, 'x'), s.M.Formatting.merge(s.M.Formatting.defaults(), { color: '#336699' }), { mode: 'group' });
    ca = r.item.textFrames[0].characterAttributes;
    t.eq([ca.fillColor.red, ca.fillColor.green, ca.fillColor.blue], [51, 102, 153]);
  });

  t.test('placement: view centre and artboard centre', () => {
    let s = setup({ center: [500, -300] });
    let r = s.M.Renderer.insert(parse(s.M, 'x'), s.M.Formatting.defaults(), { mode: 'group', position: 'view' });
    let b = r.item.geometricBounds;
    t.ok(Math.abs((b[0] + b[2]) / 2 - 500) < 15, 'x centred ' + b);
    s = setup({ artboard: [0, 0, 1000, -1000] });
    r = s.M.Renderer.insert(parse(s.M, 'x'), s.M.Formatting.defaults(), { mode: 'group', position: 'artboard' });
    b = r.item.geometricBounds;
    t.ok(Math.abs((b[0] + b[2]) / 2 - 500) < 15 && Math.abs((b[1] + b[3]) / 2 + 500) < 20, 'artboard centred ' + b);
  });

  t.test('missing fonts fall back with a warning instead of failing', () => {
    const s = setup({ fonts: [] });
    const r = s.M.Renderer.insert(parse(s.M, '\\alpha+\\beta'), s.M.Formatting.merge(s.M.Formatting.defaults(), { mathFont: 'STIX Two Math' }), { mode: 'group' });
    t.ok(r.ok);
    t.ok(r.item.textFrames.length >= 3);
  });

  t.test('every template inserts into the mock document without error', () => {
    const s = setup();
    let n = 0;
    s.M.Templates.items.forEach(tp => {
      const r = s.M.Renderer.insert(parse(s.M, tp.latex), s.M.Formatting.defaults(), { latex: tp.latex, mode: 'group', name: tp.name });
      t.ok(r.item.descendants().length > 0, tp.name);
      r.item.remove();
      n++;
    });
    t.eq(n, s.M.Templates.items.length);
  });
};
