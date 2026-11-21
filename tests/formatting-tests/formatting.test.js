/* Formatting model and font resolution. */
'use strict';
module.exports = function (t) {
  const M = t.load();
  t.test('defaults are complete and valid', () => {
    const d = M.Formatting.defaults();
    M.Formatting.SPEC.forEach(sp => t.ok(sp[0] in d, sp[0]));
    t.eq(M.Formatting.clean(d), d);
  });
  t.test('clean() clamps numbers, normalises colours, rejects junk', () => {
    const c = M.Formatting.clean({ fontSize: 99999, color: 'red', bold: 'yes', barThickness: -5, alignment: 'diagonal', scriptScale: 'abc', mathFont: 42, extra: 'x' });
    t.eq(c.fontSize, 1296); t.eq(c.color, '#E00000'); t.eq(c.bold, false); t.eq(c.barThickness, 0.01); t.eq(c.alignment, 'center');
    t.eq(c.scriptScale, 0.7); t.eq(c.mathFont, 'auto'); t.ok(!('extra' in c));
    t.eq(M.Formatting.clean(null), M.Formatting.defaults());
    t.eq(M.Formatting.clean({ fontSize: 'NaN' }).fontSize, 24);
    t.eq(M.Formatting.clean({ fontSize: '12abc' }).fontSize, 24);
  });
  t.test('colour parsing: hex short/long, rgb(), names; invalid rejected', () => {
    t.eq(M.U.normalizeColor('#abc'), '#AABBCC'); t.eq(M.U.normalizeColor('0055aa'), '#0055AA');
    t.eq(M.U.normalizeColor('rgb(1, 2, 3)'), '#010203'); t.eq(M.U.normalizeColor('blue') !== null, true);
    t.eq(M.U.normalizeColor('javascript:alert(1)'), null); t.eq(M.U.normalizeColor('#GGGGGG'), null);
  });
  t.test('presets merge onto defaults and stay valid', () => {
    Object.keys(M.Formatting.PRESETS).forEach(k => { const s = M.Formatting.merge(M.Formatting.defaults(), M.Formatting.PRESETS[k]); t.eq(M.Formatting.clean(s), s, k); });
  });
  t.test('font detection without Illustrator reports no math font and warns', () => {
    M.Fonts.scan(true);
    const eff = M.Fonts.effective(M.Formatting.defaults());
    t.ok(Array.isArray(eff.warnings));
    t.ok(M.Fonts.recommendations().every(r => r.installed === false));
  });
  t.test('font detection with a mocked app.textFonts list', () => {
    const sandbox = { app: { textFonts: [ { name: 'CambriaMath', family: 'Cambria Math', style: 'Regular' }, { name: 'ArialMT', family: 'Arial', style: 'Regular' }, { name: 'Arial-BoldMT', family: 'Arial', style: 'Bold' } ], documents: { length: 0 } } };
    sandbox.app.textFonts.getByName = function (n) { const f = this.find(x => x.name === n); if (!f) { throw new Error('none'); } return f; };
    const M2 = t.load(sandbox);
    M2.Fonts.scan(true);
    t.ok(M2.Fonts.isInstalled('Cambria Math'));
    t.ok(!M2.Fonts.isInstalled('STIX Two Math'));
    const eff = M2.Fonts.effective(M2.Formatting.defaults());
    t.eq(eff.math, 'Cambria Math');
    t.eq(M2.Fonts.resolve('Arial', true, false), 'Arial-BoldMT');
    const missing = M2.Fonts.effective(M2.Formatting.merge(M2.Formatting.defaults(), { mathFont: 'STIX Two Math' }));
    t.ok(missing.warnings.some(w => /STIX Two Math/.test(w)), JSON.stringify(missing.warnings));
    t.eq(missing.math, 'Cambria Math', 'falls back to an installed math font');
    const plan = M2.Renderer.fontPlan(M2.Formatting.defaults());
    t.ok(plan.mathIsMathFont);
    const run = M2.Renderer.resolveRun(plan, 'x', 'math', false, true);
    t.eq(run.contents, '\uD835\uDC65', 'italic x mapped to U+1D465 in a math font');
  });
};
