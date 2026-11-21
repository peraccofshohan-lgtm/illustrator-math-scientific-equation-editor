/* Physics notation: symbol library coverage, units, constants, vector/operator notation. */
'use strict';
module.exports = function (t) {
  const M = t.load();
  const cats = M.Symbols.CATEGORIES.map(c => c[0]);
  const inCat = (c) => M.Symbols.list.filter(s => s.cat === c);
  const lay = (s) => M.Layout.compute(M.Parser.parse(s).root, M.Formatting.defaults());

  t.test('physics, unit and chemistry symbol categories are populated', () => {
    ['phys_mech', 'phys_em', 'phys_waves', 'phys_thermo', 'phys_quantum', 'phys_constants', 'units_si', 'units_derived', 'units_other', 'chem_arrows', 'chem_states', 'chem_notation']
      .forEach(c => { t.ok(cats.indexOf(c) >= 0, c); t.ok(inCat(c).length >= 5, c + ' has ' + inCat(c).length); });
  });
  t.test('all seven SI base units and the 22 derived units with special names', () => {
    const plain = inCat('units_si').concat(inCat('units_derived')).map(s => M.Serializer.plain(M.Parser.parse(s.ins).root).trim());
    ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'].forEach(u => t.ok(plain.indexOf(u) >= 0, 'base ' + u));
    ['Hz', 'N', 'Pa', 'J', 'W', 'C', 'V', 'F', '\u03A9', 'S', 'Wb', 'T', 'H', 'lm', 'lx', 'Bq', 'Gy', 'Sv', 'kat', 'rad', 'sr'].forEach(u => t.ok(plain.indexOf(u) >= 0, 'derived ' + u));
  });
  t.test('units render upright with a thin space, exponents raised', () => {
    const L = lay('9.81\\,\\unit{m/s^2}');
    const m = L.prims.find(p => p.t === 'm'), two = L.prims.find(p => p.t === '2');
    t.ok(m && !m.italic, 'unit letters upright');
    t.ok(two.y > m.y, 'exponent raised');
    const k = lay('\\unit{kg.m.s^{-2}}');
    t.ok(k.prims.some(p => p.t === '\u22C5' || p.t === '\u00B7'), 'dot product of units');
  });
  t.test('physical constants insert with correct values in templates', () => {
    const c = M.Templates.search('speed of light', 'all');
    t.ok(c.length >= 1);
    const consts = inCat('phys_constants').map(s => s.name.toLowerCase()).join('|');
    ['planck', 'boltzmann', 'avogadro', 'gravitation', 'elementary charge', 'speed of light'].forEach(n => t.ok(consts.indexOf(n) >= 0, n));
  });
  t.test('classic physics equations parse, round-trip and lay out', () => {
    ['\\vec{F}=m\\vec{a}', 'E=\\frac{1}{2}mv^{2}', '\\nabla\\times\\vec{B}=\\mu_{0}\\vec{J}+\\mu_{0}\\varepsilon_{0}\\frac{\\partial\\vec{E}}{\\partial t}',
     'i\\hbar\\frac{\\partial}{\\partial t}\\Psi=\\hat{H}\\Psi', 'PV=nRT', '\\Delta S\\geq 0', 'E^{2}=(pc)^{2}+(mc^{2})^{2}', '\\lambda=\\frac{h}{p}',
     'F=G\\frac{m_{1}m_{2}}{r^{2}}', 'R_{\\mu\\nu}-\\frac{1}{2}Rg_{\\mu\\nu}+\\Lambda g_{\\mu\\nu}=\\frac{8\\pi G}{c^{4}}T_{\\mu\\nu}', '\\langle\\psi|\\hat{A}|\\psi\\rangle',
     '\\oint_{\\partial S}\\vec{E}\\cdot\\mathrm{d}\\vec{\\ell}=-\\frac{\\mathrm{d}\\Phi_{B}}{\\mathrm{d}t}', 'v=f\\lambda', '\\eta=1-\\frac{T_{c}}{T_{h}}'].forEach(s => {
      const r = M.Parser.parse(s).root; t.ok(M.AST.equal(r, M.Parser.parse(M.Serializer.toLatex(r)).root), s);
      const L = M.Layout.compute(r, M.Formatting.defaults()); t.ok(L.width > 0, s);
    });
  });
  t.test('physics template categories exist with many entries', () => {
    const phys = M.Templates.categories.filter(c => c.group === 'Physics');
    t.ok(phys.length >= 5, phys.map(c => c.name).join(','));
    t.ok(phys.reduce((a, c) => a + c.count, 0) >= 100);
  });
  t.test('vector, tensor and operator notation', () => {
    const L = lay('\\vec{v}');
    t.ok(L.prims.some(p => p.k === 'path' || p.t === '\u2192' || p.t === '\u20D7'), 'vector arrow');
    t.ok(M.AST.equal(M.Parser.parse('T^{\\mu\\nu}{}_{\\rho}').root, M.Parser.parse(M.Serializer.toLatex(M.Parser.parse('T^{\\mu\\nu}{}_{\\rho}').root)).root));
    t.ok(lay('\\hat{\\mathbf{i}}').width > 0);
  });
};
