/* Parser, serializer and round-trip tests (Direct Input <-> AST <-> text). */
'use strict';
module.exports = function (t) {
  const M = t.load();
  const P = (s, o) => M.Parser.parse(s, o).root;
  const L = (s, o) => M.Serializer.toLatex(P(s, o));
  const rt = (s) => { const a = P(s); const b = P(M.Serializer.toLatex(a)); return M.AST.equal(a, b); };
  const top = (s) => P(s).items.map(n => n.type);

  t.test('fractions, roots and scripts build the expected structure', () => {
    t.eq(top('\\frac{a}{b}'), ['frac']);
    t.eq(top('\\sqrt{x}'), ['root']);
    const r = P('\\sqrt[3]{x}').items[0]; t.eq(r.index.items.length, 1);
    t.eq(top('x^{2}'), ['scripts']);
    const s = P('x_i^2').items[0]; t.ok(s.sub && s.sup && s.sub.items.length === 1 && s.sup.items.length === 1);
    t.eq(L('x^2_i'), L('x_i^2'), 'script order normalised');
    t.eq(L('\\dfrac12'), '\\dfrac{1}{2}');
  });
  t.test('big operators, limits, integrals', () => {
    const s = P('\\sum_{i=1}^{n} i').items[0]; t.eq(s.type, 'bigop'); t.ok(s.lower.items.length === 3 && s.upper.items.length === 1);
    t.eq(P('\\int_0^1 f').items[0].type, 'bigop');
    t.eq(P('\\iiint_V').items[0].type, 'bigop');
    t.eq(P('\\oint_C').items[0].type, 'bigop');
    t.eq(P('\\lim_{x\\to0} f').items[0].type, 'func');
    t.ok(rt('\\int_{0}^{\\infty} e^{-x^{2}}\\,\\mathrm{d}x = \\frac{\\sqrt{\\pi}}{2}'));
  });
  t.test('matrices and determinants of every environment', () => {
    ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix', 'smallmatrix'].forEach(env => {
      const m = P('\\begin{' + env + '}1&2\\\\3&4\\end{' + env + '}').items[0];
      t.eq(m.type, 'matrix', env); t.eq(m.rows.length, 2); t.eq(m.rows[0].length, 2);
      t.ok(rt('\\begin{' + env + '}a&b\\\\c&d\\end{' + env + '}'), env + ' round-trip');
    });
    const a = P('\\begin{array}{c|c}1&2\\\\3&4\\end{array}').items[0]; t.eq(a.colspec, 'c|c');
    const ragged = P('\\begin{pmatrix}1&2&3\\\\4\\end{pmatrix}').items[0]; t.eq(ragged.rows[1].length, 3, 'ragged rows padded');
  });
  t.test('piecewise, aligned and multiline', () => {
    t.eq(P('\\begin{cases}x&x>0\\\\-x&x\\le0\\end{cases}').items[0].type, 'matrix');
    const al = P('\\begin{aligned}a&=b\\\\&=c\\end{aligned}').items[0]; t.eq(al.type, 'lines');
    t.eq(P('a&=b\\\\c&=d').items[0].type, 'lines', 'bare multiline');
    t.ok(rt('\\begin{align}x&=1\\tag{1}\\\\y&=2\\end{align}'));
  });
  t.test('delimiters: \\left/\\right, auto-fence, invisible, middle', () => {
    t.eq(P('\\left( \\frac{a}{b} \\right)').items[0].type, 'fenced');
    t.eq(P('(a+b)', { autoFence: true }).items[0].type, 'fenced');
    t.eq(P('\\left. \\frac{df}{dx} \\right|_{x=0}').items[0].type, 'scripts');
    t.ok(rt('\\left\\langle \\psi \\middle| \\phi \\right\\rangle'));
    t.ok(rt('\\abs{x}+\\norm{v}'));
  });
  t.test('Greek, operators, accents, fonts, text, colour', () => {
    t.eq(M.Serializer.plain(P('\\alpha\\beta\\Gamma\\Omega')), 'αβΓΩ');
    t.ok(rt('\\vec{F}=m\\vec{a}'));
    t.ok(rt('\\hat{x}\\bar{y}\\dot{z}\\ddot{w}\\tilde{u}\\overline{AB}'));
    t.ok(rt('\\mathbf{v}\\mathbb{R}\\mathcal{L}\\mathfrak{g}\\mathrm{d}'));
    t.ok(rt('\\text{if } x>0'));
    t.ok(rt('\\color{red}{x}+y'));
    t.ok(rt('\\overbrace{a+b}^{n}\\underbrace{c}_{m}'));
    t.ok(rt('\\nabla\\cdot\\vec{E}=\\frac{\\rho}{\\varepsilon_{0}}'));
    t.ok(rt('\\partial_{\\mu}F^{\\mu\\nu}=\\mu_{0}J^{\\nu}'));
  });
  t.test('physics notation: derivatives, bra-ket, units, scientific notation', () => {
    t.ok(rt('\\pdv{f}{x}')); t.ok(rt('\\dv{f}{t}')); t.ok(rt('\\pdv[2]{f}{x}'));
    t.ok(rt('\\bra{\\psi}\\ket{\\phi}')); t.ok(rt('\\braket{\\psi}{\\phi}'));
    t.ok(rt('9.81\\,\\unit{m/s^2}')); t.ok(rt('\\sci{6.022}{23}\\,\\unit{mol^{-1}}'));
    t.eq(M.Serializer.plain(P('\\sci{6.022}{23}')), '6.022 \u00D7 10\u00B2\u00B3');
  });
  t.test('smart input: ASCII operators and bare function names', () => {
    t.eq(M.Serializer.plain(P('a <= b != c -> d', { smartOps: true })).replace(/\s/g, ''), 'a≤b≠c→d');
    t.eq(P('sin x', { smartFuncs: true }).items[0].type, 'func');
    t.eq(P('sin x', { smartFuncs: false }).items[0].type, 'variable');
  });
  t.test('errors carry kind, message and position', () => {
    const cases = [['\\frac{a}{', /closing brace/], ['x^', /Missing|expected|script/i], ['\\left( x', /\\right|right/], ['\\foo', /Unknown command/],
      ['\\begin{pmatrix} 1 \\end{bmatrix}', /end|bmatrix|pmatrix/], ['}', /Unexpected|brace/i], ['\\sqrt[3', /\]|bracket|closing/i], ['a^^b', /script|Double|superscript/i]];
    cases.forEach(([src, re]) => {
      const e = t.throws(() => M.Parser.parse(src), re, src);
      t.eq(e.kind, M.ErrorKind.PARSER, src);
      t.ok(e.pos >= 0 && e.pos <= src.length, src + ' pos ' + e.pos);
    });
    const loc = M.Parser.location('ab\ncd\\frac{', 7); t.eq(JSON.stringify(loc), JSON.stringify({ line: 2, col: 5 }));
  });
  t.test('input limits: oversize and pathological nesting are rejected cleanly', () => {
    t.throws(() => M.Parser.parse(new Array(200002).join('x')), /long|limit|large/i);
    t.throws(() => M.Parser.parse(new Array(600).join('{') + 'x' + new Array(600).join('}')), /deep|nest/i);
  });
  t.test('all 383 templates parse, round-trip and validate', () => {
    let n = 0;
    M.Templates.items.forEach(tp => { const a = P(tp.latex); M.AST.validate(a); t.ok(rt(tp.latex), tp.name); n++; });
    t.eq(n, M.Templates.items.length); t.ok(n >= 380);
  });
  t.test('every symbol insertion snippet parses and round-trips', () => {
    let n = 0;
    M.Symbols.list.forEach(s => { t.ok(rt(s.ins), s.id + ' ' + s.ins); n++; });
    t.ok(n >= 700, 'symbol count ' + n);
  });
  t.test('serializer output is canonical and idempotent', () => {
    ['\\frac{a}{b}+\\sqrt[n]{x}', '\\sum_{k=0}^{\\infty}\\frac{x^{k}}{k!}', '\\ce{2H2 + O2 -> 2H2O}', '\\langle E\\rangle'].forEach(s => {
      const once = L(s), twice = L(once); t.eq(twice, once, s);
    });
    t.eq(L('\\langle E \\rangle'), '\\langle E\\rangle', 'control word followed by a letter keeps a space');
  });
  t.test('plain-text and single-text conversion', () => {
    t.eq(M.Serializer.plain(P('E=mc^2')), 'E = mc²');
    t.ok(M.Serializer.toSingleText(P('x_1^2+y^2')).ok);
    const no = M.Serializer.toSingleText(P('\\frac{a}{b}')); t.ok(!no.ok && no.reason.length > 0);
  });
};
