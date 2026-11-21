/* Chemistry: element data, formula parsing, charge handling, balancing with verification. */
'use strict';
module.exports = function (t) {
  const M = t.load();
  const B = (s) => M.Chem.balance(s);

  t.test('118 elements with consistent data', () => {
    t.eq(M.Elements.list.length, 118);
    M.Elements.list.forEach((e, i) => {
      t.eq(e.z, i + 1); t.ok(/^[A-Z][a-z]{0,2}$/.test(e.sym), e.sym); t.ok(e.mass > 0, e.sym); t.ok(e.period >= 1 && e.period <= 7);
    });
    t.eq(M.Elements.get('Og').z, 118); t.eq(M.Elements.get('Fe').name, 'Iron');
    t.ok(Math.abs(M.Elements.get('C').mass - 12.011) < 0.01);
    t.eq(M.Elements.search('79')[0].sym, 'Au');
  });
  t.test('balances molecular reactions', () => {
    const cases = {
      'H2 + O2 -> H2O': '2H2 + O2 -> 2H2O',
      'Fe + O2 -> Fe2O3': '4Fe + 3O2 -> 2Fe2O3',
      'C3H8 + O2 -> CO2 + H2O': 'C3H8 + 5O2 -> 3CO2 + 4H2O',
      'KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2': '2KMnO4 + 16HCl -> 2KCl + 2MnCl2 + 8H2O + 5Cl2',
      'Cu + HNO3 -> Cu(NO3)2 + NO + H2O': '3Cu + 8HNO3 -> 3Cu(NO3)2 + 2NO + 4H2O',
      'C6H12O6 + O2 -> CO2 + H2O': 'C6H12O6 + 6O2 -> 6CO2 + 6H2O',
      'Ca3(PO4)2 + SiO2 + C -> CaSiO3 + P4 + CO': '2Ca3(PO4)2 + 6SiO2 + 10C -> 6CaSiO3 + P4 + 10CO',
      'N2 + H2 <=> NH3': 'N2 + 3H2 <=> 2NH3'
    };
    Object.keys(cases).forEach(k => t.eq(B(k).text, cases[k], k));
  });
  t.test('balances ionic / redox equations with charge conservation', () => {
    t.eq(B('MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O').text, 'MnO4^- + 5Fe^2+ + 8H^+ -> Mn^2+ + 5Fe^3+ + 4H2O');
    t.eq(B('Cr2O7^2- + H^+ + e^- -> Cr^3+ + H2O').text, 'Cr2O7^2- + 14H^+ + 6e^- -> Cr^3+ + 7H2O'.replace('-> Cr', '-> 2Cr'));
    const r = B('MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O');
    t.eq(r.charge[0], r.charge[1]);
    Object.keys(r.check).forEach(el => t.eq(r.check[el][0], r.check[el][1], el));
  });
  t.test('states, hydrates and conditions are preserved', () => {
    t.eq(B('CaCO3(s) -> CaO(s) + CO2(g)').text, 'CaCO3(s) -> CaO(s) + CO2(g)');
    t.eq(B('CuSO4.5H2O -> CuSO4 + H2O').text, 'CuSO4.5H2O -> CuSO4 + 5H2O');
    t.ok(/->\[Fe\]/.test(B('N2 + H2 ->[Fe] NH3').text));
  });
  t.test('impossible, ambiguous and malformed reactions are rejected with explanations', () => {
    t.throws(() => B('H2 + O2 -> H2O2 + H2O'), /independent|ambiguous|unique|more than one/i);
    t.throws(() => B('Xx + O2 -> XxO'), /Unknown element|Xx/);
    t.throws(() => B('H2 + O2'), /arrow/i);
    t.throws(() => B('H2 -> O2'), /cannot|not balance|impossible|no solution/i);
    t.throws(() => B('H2 -> H2 -> H2'), /exactly one arrow/);
    t.throws(() => B(''), /Enter a reaction/);
  });
  t.test('molar mass with nested groups and hydrates', () => {
    t.ok(Math.abs(M.Chem.molarMass('H2SO4').mass - 98.072) < 0.01);
    t.ok(Math.abs(M.Chem.molarMass('Ca3(PO4)2').mass - 310.17) < 0.05);
    t.ok(Math.abs(M.Chem.molarMass('CuSO4.5H2O').mass - 249.68) < 0.05);
    t.ok(M.Chem.molarMass('Og').warnings.length === 1, 'isotope mass warning');
  });
  t.test('\\ce notation renders upright formulas with subscripts, charges and arrows', () => {
    const L = M.Layout.compute(M.Parser.parse('\\ce{SO4^2- + 2H^+ -> H2SO4}').root, M.Formatting.defaults());
    const tx = L.prims.filter(p => p.k === 'text');
    t.ok(tx.some(p => p.t === '4' && p.y < 0), 'subscript 4 lowered');
    t.ok(tx.some(p => /2/.test(p.t) && p.y > 0), 'charge raised');
    t.ok(tx.every(p => !p.italic || !/[A-Z]/.test(p.t)), 'element symbols upright');
    t.ok(L.prims.some(p => p.k === 'path' || p.t === '\u2192'), 'reaction arrow present');
    ['\\ce{^{14}_{6}C}', '\\ce{[Cu(NH3)4]^2+}', '\\ce{Fe^{3+}}', '\\ce{A <=> B}', '\\ce{A <-> B}', '\\ce{A <- B}', '\\ce{Na+ + Cl- -> NaCl(s)}'].forEach(s => {
      const r = M.Parser.parse(s).root; t.ok(M.AST.equal(r, M.Parser.parse(M.Serializer.toLatex(r)).root), s);
    });
  });
  t.test('exact rational arithmetic: large coefficients stay integral', () => {
    const r = B('K4Fe(CN)6 + KMnO4 + H2SO4 -> KHSO4 + Fe2(SO4)3 + MnSO4 + HNO3 + CO2 + H2O');
    t.ok(r.coefficients.every(c => Number.isInteger(c) && c > 0), r.text);
    t.ok(Math.max(...r.coefficients) >= 100, 'large coefficients: ' + r.coefficients);
    Object.keys(r.check).forEach(el => t.eq(r.check[el][0], r.check[el][1], el));
  });
};
