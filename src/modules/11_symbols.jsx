/* ==========================================================================
 * Module 11 - Symbol & notation library
 * Each entry: id, ch (display), name, cat, desc, kw (keywords), ins (syntax
 * inserted, parsed into structure), cp (Unicode code point label), font
 * (font compatibility note), kind ('symbol' | 'structure' | 'function' |
 * 'unit' | 'notation').
 * ========================================================================== */
var Symbols = {};

Symbols.CATEGORIES = [
    ['basic', 'Basic Arithmetic', 'Mathematics'],
    ['greek_lower', 'Greek Lowercase', 'Mathematics'],
    ['greek_upper', 'Greek Uppercase', 'Mathematics'],
    ['algebra', 'Algebra', 'Mathematics'],
    ['relations', 'Relations & Inequalities', 'Mathematics'],
    ['calculus', 'Calculus', 'Mathematics'],
    ['sets', 'Set Theory', 'Mathematics'],
    ['logic', 'Logic', 'Mathematics'],
    ['geometry', 'Geometry', 'Mathematics'],
    ['trig', 'Trigonometry', 'Mathematics'],
    ['linalg', 'Linear Algebra', 'Mathematics'],
    ['probstat', 'Probability & Statistics', 'Mathematics'],
    ['numtheory', 'Number Theory & Discrete', 'Mathematics'],
    ['arrows', 'Arrows', 'Mathematics'],
    ['delimiters', 'Brackets & Delimiters', 'Mathematics'],
    ['accents', 'Accents & Decorations', 'Mathematics'],
    ['letterlike', 'Letterlike & Number Sets', 'Mathematics'],
    ['advanced', 'Advanced Mathematics', 'Mathematics'],
    ['phys_mech', 'Physics: Mechanics', 'Physics'],
    ['phys_em', 'Physics: Electricity & Magnetism', 'Physics'],
    ['phys_waves', 'Physics: Waves & Optics', 'Physics'],
    ['phys_thermo', 'Physics: Thermodynamics', 'Physics'],
    ['phys_quantum', 'Physics: Quantum & Modern', 'Physics'],
    ['phys_constants', 'Physics: Constants', 'Physics'],
    ['units_si', 'Units: SI Base', 'Units'],
    ['units_derived', 'Units: SI Derived', 'Units'],
    ['units_other', 'Units: Other & Compound', 'Units'],
    ['chem_arrows', 'Chemistry: Reaction Arrows', 'Chemistry'],
    ['chem_states', 'Chemistry: States & Signs', 'Chemistry'],
    ['chem_notation', 'Chemistry: Notation', 'Chemistry']
];
Symbols.categoryName = function (id) {
    for (var i = 0; i < Symbols.CATEGORIES.length; i++) { if (Symbols.CATEGORIES[i][0] === id) { return Symbols.CATEGORIES[i][1]; } }
    return id;
};

Symbols.list = [];
Symbols.byId = {};

/* Row format: [display, name, insertSyntax, keywords, description?] */
Symbols.add = function (cat, rows, kind) {
    var i, r, entry, id, single, cps;
    for (i = 0; i < rows.length; i++) {
        r = rows[i];
        cps = U.codePoints(r[0]);
        single = (cps.length === 1);
        id = cat + '.' + U.lower(r[1]).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        if (U.has(Symbols.byId, id)) { id += '_' + i; }
        entry = {
            id: id,
            ch: r[0],
            name: r[1],
            cat: cat,
            ins: r[2],
            kw: r[3] || '',
            kind: kind || (single ? 'symbol' : 'structure'),
            cp: single ? U.unicodeLabel(r[0]) : '',
            desc: ''
        };
        entry.font = Symbols.fontNote(entry);
        entry.desc = (r[4] ? r[4] + ' ' : '') + Symbols.autoDescription(entry);
        Symbols.list.push(entry);
        Symbols.byId[id] = entry;
    }
};
Symbols.fontNote = function (e) {
    var cps = U.codePoints(e.ch), worst = 0, i, c;
    for (i = 0; i < cps.length; i++) {
        c = U.codePointOf(cps[i]);
        if (c > 0xFFFF) { worst = 3; }
        else if (c >= 0x2190 && worst < 2) { worst = 2; }
        else if (c > 0x00FF && worst < 1) { worst = 1; }
    }
    if (e.kind === 'unit' || e.kind === 'function') { return 'Any text font (rendered upright).'; }
    if (worst === 0) { return 'Available in virtually all text fonts.'; }
    if (worst === 1) { return 'Available in most text fonts (Greek / Latin Extended / general punctuation).'; }
    if (worst === 2) { return 'Mathematical glyph: a math font is recommended (Cambria Math, STIX Two Math).'; }
    return 'Supplementary-plane glyph: requires a full math font such as STIX Two Math or Cambria Math.';
};
Symbols.autoDescription = function (e) {
    var s = '';
    if (e.cp) { s += 'Unicode ' + e.cp + '. '; }
    s += 'Syntax: ' + e.ins + '. Category: ' + Symbols.categoryName(e.cat) + '.';
    return s;
};

/* ---------------------------------------------------------------- MATH ---- */
Symbols.add('basic', [
    ['+', 'Plus', '+', 'add addition sum positive'],
    ['\u2212', 'Minus', '-', 'subtract subtraction negative difference'],
    ['\u00D7', 'Multiplication (times)', '\\times', 'multiply product cross'],
    ['\u00F7', 'Division (obelus)', '\\div', 'divide quotient'],
    ['\u22C5', 'Multiplication dot', '\\cdot', 'center dot multiply product'],
    ['/', 'Slash (solidus)', '/', 'divide fraction slash'],
    ['=', 'Equals', '=', 'equal equality'],
    ['\u2260', 'Not equal', '\\neq', 'unequal different inequality'],
    ['\u2248', 'Approximately equal', '\\approx', 'about approximation almost'],
    ['>', 'Greater than', '>', 'larger inequality'],
    ['<', 'Less than', '<', 'smaller inequality'],
    ['\u2265', 'Greater than or equal', '\\geq', 'at least inequality ge'],
    ['\u2264', 'Less than or equal', '\\leq', 'at most inequality le'],
    ['\u00B1', 'Plus-minus', '\\pm', 'plus or minus tolerance'],
    ['\u2213', 'Minus-plus', '\\mp', 'minus or plus'],
    ['\u221E', 'Infinity', '\\infty', 'infinite unbounded limit'],
    ['%', 'Percent', '\\%', 'percentage per cent'],
    ['\u2030', 'Per mille', '\\permil', 'per thousand promille'],
    ['\u2236', 'Ratio', '\\ratio', 'ratio colon proportion'],
    ['\u2237', 'Proportion', '\\Colon', 'proportion as double colon'],
    ['\u00B0', 'Degree', '^{\\circ}', 'angle temperature degrees'],
    ['\u2032', 'Prime', "'", 'derivative minute foot'],
    ['\u2033', 'Double prime', "''", 'second derivative second inch'],
    ['\u03C0', 'Pi', '\\pi', 'circle constant 3.14159'],
    ['e', "Euler's number", '\\mathrm{e}', 'exponential constant 2.71828 napier'],
    ['i', 'Imaginary unit', '\\mathrm{i}', 'complex sqrt -1'],
    ['x\u00B2', 'Square', '^{2}', 'squared power two'],
    ['x\u00B3', 'Cube', '^{3}', 'cubed power three'],
    ['x\u207F', 'Power n', '^{n}', 'exponent power'],
    ['!', 'Factorial', '!', 'factorial permutations'],
    ['|x|', 'Absolute value', '\\left| \\right|', 'abs modulus magnitude'],
    ['mod', 'Modulus (binary mod)', '\\bmod', 'modulo remainder'],
    ['\u221A', 'Square root', '\\sqrt{}', 'radical root'],
    ['a/b', 'Fraction', '\\frac{}{}', 'fraction ratio numerator denominator'],
    ['\u2026', 'Ellipsis', '\\ldots', 'dots continuation'],
    ['\u22EF', 'Centered ellipsis', '\\cdots', 'dots continuation centered'],
    ['\u2217', 'Asterisk operator', '\\ast', 'star convolution'],
    ['\u221D', 'Proportional to', '\\propto', 'varies as proportional']
]);

Symbols.add('greek_lower', (function () {
    var names = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta', 'iota',
        'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'varpi', 'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon',
        'phi', 'varphi', 'chi', 'psi', 'omega'];
    var out = [], i;
    for (i = 0; i < names.length; i++) {
        out.push([MathData.CMD[names[i]][0], 'Greek small ' + names[i].replace('var', 'variant '), '\\' + names[i], 'greek letter lowercase ' + names[i]]);
    }
    return out;
}()));
Symbols.add('greek_upper', (function () {
    var names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu',
        'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'];
    var out = [], i;
    for (i = 0; i < names.length; i++) {
        out.push([MathData.CMD[names[i]][0], 'Greek capital ' + names[i], '\\' + names[i], 'greek letter uppercase capital ' + names[i]]);
    }
    return out;
}()));

Symbols.add('algebra', [
    ['x', 'Variable x', 'x', 'unknown variable'],
    ['ax+b', 'Linear expression', 'ax+b', 'coefficient linear polynomial'],
    ['ax\u00B2+bx+c', 'Quadratic polynomial', 'ax^{2}+bx+c', 'polynomial quadratic coefficients'],
    ['a\u2099x\u207F', 'Polynomial term', 'a_{n}x^{n}', 'polynomial coefficient term'],
    ['x\u207F', 'Power', 'x^{n}', 'exponent power'],
    ['x\u207B\u00B9', 'Reciprocal', 'x^{-1}', 'inverse reciprocal'],
    ['\u221Ax', 'Square root', '\\sqrt{x}', 'root radical'],
    ['\u221Bx', 'Cube root', '\\sqrt[3]{x}', 'root radical third'],
    ['\u207F\u221Ax', 'nth root', '\\sqrt[n]{x}', 'root radical index'],
    ['e\u02E3', 'Exponential', '\\mathrm{e}^{x}', 'exponential function exp'],
    ['exp', 'Exponential function', '\\exp', 'exp function', 'Upright function name.'],
    ['log', 'Logarithm', '\\log', 'log logarithm function'],
    ['log\u2090', 'Logarithm base a', '\\log_{a}', 'logarithm base'],
    ['ln', 'Natural logarithm', '\\ln', 'natural log ln'],
    ['lg', 'Common logarithm', '\\lg', 'log base 10'],
    ['(\u207F\u2096)', 'Binomial coefficient', '\\binom{n}{k}', 'choose combination binomial'],
    ['\u2261', 'Identical to', '\\equiv', 'identity congruent equivalent'],
    ['\u225C', 'Defined as (delta equal)', '\\triangleq', 'definition'],
    ['\u2254', 'Defined as (colon equals)', '\\coloneqq', 'definition assign'],
    ['\u2243', 'Asymptotically equal', '\\simeq', 'similar equal'],
    ['\u226A', 'Much less than', '\\ll', 'much smaller'],
    ['\u226B', 'Much greater than', '\\gg', 'much larger'],
    ['|x|', 'Absolute value', '\\abs{x}', 'absolute modulus'],
    ['\u230Ax\u230B', 'Floor', '\\floor{x}', 'floor round down'],
    ['\u2308x\u2309', 'Ceiling', '\\ceil{x}', 'ceiling round up'],
    ['sgn', 'Sign function', '\\sgn', 'signum sign']
]);

Symbols.add('relations', [
    ['=', 'Equals', '=', 'equal'], ['\u2260', 'Not equal', '\\neq', 'unequal'],
    ['<', 'Less than', '<', 'less'], ['>', 'Greater than', '>', 'greater'],
    ['\u2264', 'Less or equal', '\\leq', 'le'], ['\u2265', 'Greater or equal', '\\geq', 'ge'],
    ['\u2A7D', 'Less or equal (slanted)', '\\leqslant', 'le slant'], ['\u2A7E', 'Greater or equal (slanted)', '\\geqslant', 'ge slant'],
    ['\u2261', 'Equivalent / identical', '\\equiv', 'congruent'], ['\u2262', 'Not equivalent', '\\nequiv', 'not identical'],
    ['\u2248', 'Approximately', '\\approx', 'approx'], ['\u2245', 'Congruent / isomorphic', '\\cong', 'congruent isomorphic'],
    ['\u223C', 'Similar / tilde', '\\sim', 'similar distributed'], ['\u221D', 'Proportional', '\\propto', 'proportional'],
    ['\u227A', 'Precedes', '\\prec', 'order'], ['\u227B', 'Succeeds', '\\succ', 'order'],
    ['\u2272', 'Less than or similar', '\\lesssim', 'less similar'], ['\u2273', 'Greater than or similar', '\\gtrsim', 'greater similar'],
    ['\u226E', 'Not less than', '\\nless', 'not less'], ['\u226F', 'Not greater than', '\\ngtr', 'not greater'],
    ['\u2250', 'Approaches the limit', '\\doteq', 'dot equal'], ['\u224D', 'Equivalent to (asymp)', '\\asymp', 'asymptotic']
]);

Symbols.add('calculus', [
    ['d', 'Differential operator (upright d)', '\\mathrm{d}', 'differential d'],
    ['d/dx', 'Derivative operator', '\\frac{\\mathrm{d}}{\\mathrm{d}x}', 'derivative leibniz'],
    ['dy/dx', 'Derivative (Leibniz)', '\\frac{\\mathrm{d}y}{\\mathrm{d}x}', 'derivative leibniz first'],
    ['d\u00B2y/dx\u00B2', 'Second derivative', '\\frac{\\mathrm{d}^{2}y}{\\mathrm{d}x^{2}}', 'second derivative'],
    ['d\u207Fy/dx\u207F', 'Higher-order derivative', '\\frac{\\mathrm{d}^{n}y}{\\mathrm{d}x^{n}}', 'nth derivative higher order'],
    ['\u2202', 'Partial derivative symbol', '\\partial', 'partial del'],
    ['\u2202f/\u2202x', 'Partial derivative', '\\frac{\\partial f}{\\partial x}', 'partial derivative'],
    ['\u2202\u00B2f/\u2202x\u00B2', 'Second partial derivative', '\\frac{\\partial^{2} f}{\\partial x^{2}}', 'second partial'],
    ['\u2202\u00B2f/\u2202x\u2202y', 'Mixed partial derivative', '\\frac{\\partial^{2} f}{\\partial x\\,\\partial y}', 'mixed partial multiple'],
    ['df/dt', 'Total derivative', '\\frac{\\mathrm{d}f}{\\mathrm{d}t}', 'total derivative time'],
    ["f\u2032", 'Prime notation', "f'(x)", 'prime derivative lagrange'],
    ["f\u2033", 'Second derivative (prime)', "f''(x)", 'double prime'],
    ['\u1E8B', 'Dot (time derivative)', '\\dot{x}', 'newton dot time derivative'],
    ['\u1E8D', 'Double dot (second time derivative)', '\\ddot{x}', 'acceleration double dot'],
    ['\u2207', 'Nabla / gradient', '\\nabla', 'del gradient nabla'],
    ['\u2207f', 'Gradient', '\\nabla f', 'gradient grad'],
    ['\u2207\u22C5F', 'Divergence', '\\nabla\\cdot\\vec{F}', 'divergence div'],
    ['\u2207\u00D7F', 'Curl', '\\nabla\\times\\vec{F}', 'curl rot rotation'],
    ['\u2207\u00B2', 'Laplacian', '\\nabla^{2}', 'laplacian laplace'],
    ['\u0394', 'Laplacian (Delta)', '\\Delta', 'laplace operator change'],
    ['\u222B', 'Indefinite integral', '\\int  \\,\\mathrm{d}x', 'integral antiderivative'],
    ['\u222B\u2090\u1D47', 'Definite integral', '\\int_{a}^{b}  \\,\\mathrm{d}x', 'integral definite limits'],
    ['\u222C', 'Double integral', '\\iint_{D}  \\,\\mathrm{d}A', 'double integral area'],
    ['\u222D', 'Triple integral', '\\iiint_{V}  \\,\\mathrm{d}V', 'triple integral volume'],
    ['\u222E', 'Contour integral', '\\oint_{C}  \\,\\mathrm{d}s', 'contour line closed integral'],
    ['\u222F', 'Surface integral (closed)', '\\oiint_{S}  \\,\\mathrm{d}S', 'surface integral flux'],
    ['\u2230', 'Volume integral (closed)', '\\oiiint_{V}  \\,\\mathrm{d}V', 'volume integral'],
    ['\u2211', 'Summation', '\\sum_{i=1}^{n}', 'sum sigma series'],
    ['\u220F', 'Product', '\\prod_{i=1}^{n}', 'product pi'],
    ['lim', 'Limit', '\\lim_{x \\to a}', 'limit approaches'],
    ['lim\u207B', 'Limit from the left', '\\lim_{x \\to a^{-}}', 'left limit one-sided'],
    ['lim\u207A', 'Limit from the right', '\\lim_{x \\to a^{+}}', 'right limit one-sided'],
    ['dx', 'Differential element dx', '\\,\\mathrm{d}x', 'differential element'],
    ['\u0394x', 'Increment', '\\Delta x', 'change increment delta'],
    ['\u03B4x', 'Variation / infinitesimal', '\\delta x', 'variation infinitesimal small'],
    ['\u03B5', 'Epsilon (small quantity)', '\\varepsilon', 'epsilon delta small'],
    ['\u2192', 'Tends to', '\\to', 'approaches tends limit'],
    ['F|\u2090\u1D47', 'Evaluation bar', '\\left. F(x) \\right|_{a}^{b}', 'evaluate bar limits']
]);

Symbols.add('sets', [
    ['\u2208', 'Element of', '\\in', 'member belongs'], ['\u2209', 'Not an element of', '\\notin', 'not member'],
    ['\u220B', 'Contains as member', '\\ni', 'owns contains'],
    ['\u2282', 'Subset', '\\subset', 'subset'], ['\u2286', 'Subset or equal', '\\subseteq', 'subset equal'],
    ['\u228A', 'Proper subset', '\\subsetneq', 'proper strict subset'], ['\u2283', 'Superset', '\\supset', 'superset'],
    ['\u2287', 'Superset or equal', '\\supseteq', 'superset equal'], ['\u2284', 'Not a subset', '\\nsubset', 'not subset'],
    ['\u222A', 'Union', '\\cup', 'union or'], ['\u2229', 'Intersection', '\\cap', 'intersection and'],
    ['\u22C3', 'Big union', '\\bigcup_{i}', 'union family'], ['\u22C2', 'Big intersection', '\\bigcap_{i}', 'intersection family'],
    ['\u2205', 'Empty set', '\\emptyset', 'null empty'], ['\uD835\uDCB0', 'Universal set', '\\mathcal{U}', 'universe universal'],
    ['\u2216', 'Set difference', '\\setminus', 'minus difference'], ['A\u1D9C', 'Complement', 'A^{c}', 'complement'],
    ['\u2201', 'Complement symbol', '\\complement', 'complement'],
    ['\u00D7', 'Cartesian product', 'A\\times B', 'cartesian product pairs'],
    ['\uD835\uDCAB(A)', 'Power set', '\\mathcal{P}(A)', 'power set subsets'],
    ['|A|', 'Cardinality', '\\left| A \\right|', 'cardinality size count'],
    ['{x|\u2026}', 'Set-builder notation', '\\{ x \\mid x > 0 \\}', 'set builder such that'],
    ['\u25B3', 'Symmetric difference', '\\triangle', 'symmetric difference'],
    ['\u2294', 'Disjoint union', '\\sqcup', 'disjoint union'], ['\u2135\u2080', 'Aleph null', '\\aleph_{0}', 'countable cardinality']
]);

Symbols.add('logic', [
    ['\u2227', 'Logical AND', '\\land', 'and conjunction wedge'], ['\u2228', 'Logical OR', '\\lor', 'or disjunction vee'],
    ['\u00AC', 'Logical NOT', '\\neg', 'not negation'], ['\u21D2', 'Implies', '\\Rightarrow', 'implication then'],
    ['\u2192', 'Implies (arrow)', '\\to', 'implication material conditional'],
    ['\u27F9', 'Implies (long)', '\\implies', 'implication long'], ['\u21D4', 'Equivalent (if and only if)', '\\Leftrightarrow', 'iff equivalence biconditional'],
    ['\u27FA', 'If and only if (long)', '\\iff', 'iff'], ['\u2194', 'Biconditional', '\\leftrightarrow', 'biconditional'],
    ['\u2261', 'Logical equivalence', '\\equiv', 'equivalent'], ['\u2200', 'For all', '\\forall', 'universal quantifier every'],
    ['\u2203', 'There exists', '\\exists', 'existential quantifier'], ['\u2203!', 'Unique existence', '\\exists!', 'exists unique'],
    ['\u2204', 'There does not exist', '\\nexists', 'not exists'], ['\u2234', 'Therefore', '\\therefore', 'hence so'],
    ['\u2235', 'Because', '\\because', 'since'], ['\u22A5', 'Contradiction (falsum)', '\\bot', 'false bottom contradiction'],
    ['\u21AF', 'Contradiction (lightning)', '\\lightning', 'contradiction'], ['\u22A4', 'True (verum)', '\\top', 'true top tautology'],
    ['\u22A2', 'Proves (turnstile)', '\\vdash', 'proves derives'], ['\u22A8', 'Models / entails', '\\models', 'entails satisfies'],
    ['\u22BB', 'Exclusive OR', '\\veebar', 'xor'], ['\u22BC', 'NAND', '\\barwedge', 'nand'],
    ['\u220E', 'End of proof (QED)', '\\qed', 'qed tombstone halmos'], ['\u25A1', 'Necessity (box)', '\\Box', 'modal box necessarily'],
    ['T', 'Truth value true', '\\mathrm{T}', 'true'], ['F', 'Truth value false', '\\mathrm{F}', 'false']
]);

Symbols.add('geometry', [
    ['\u2220', 'Angle', '\\angle', 'angle'], ['\u2221', 'Measured angle', '\\measuredangle', 'measured angle'],
    ['\u221F', 'Right angle', '\\rightangle', 'right angle 90'], ['\u2225', 'Parallel', '\\parallel', 'parallel lines'],
    ['\u22A5', 'Perpendicular', '\\perp', 'perpendicular orthogonal'], ['\u2245', 'Congruent', '\\cong', 'congruent'],
    ['\u223C', 'Similar', '\\sim', 'similar'], ['\u25B3', 'Triangle', '\\triangle', 'triangle'],
    ['\u25CB', 'Circle', '\\bigcirc', 'circle'], ['\u2299', 'Circle with center', '\\odot', 'circle center'],
    ['\u2300', 'Diameter', '\\diameter', 'diameter'], ['r', 'Radius', 'r', 'radius'],
    ['AB\u0311', 'Arc', '\\overarc{AB}', 'arc'], ['AB\u0305', 'Segment', '\\overline{AB}', 'line segment'],
    ['AB\u20D7', 'Vector', '\\overrightarrow{AB}', 'vector'], ['AB\u20E1', 'Line', '\\overleftrightarrow{AB}', 'line'],
    ['AB\u2192', 'Ray', '\\overrightarrow{AB}', 'ray half-line'], ['P', 'Point', 'P', 'point'],
    ['\u25A1ABCD', 'Quadrilateral notation', '\\square ABCD', 'quadrilateral polygon square'],
    ['\u25B1', 'Parallelogram', '\\parallelogram', 'parallelogram'], ['\u2B20', 'Pentagon', '\\pentagon', 'pentagon polygon'],
    ['\u2B21', 'Hexagon', '\\hexagon', 'hexagon polygon'], ['m\u2220', 'Measure of angle', 'm\\angle ABC', 'measure angle'],
    ['\u00B0', 'Degree', '^{\\circ}', 'degree']
]);

Symbols.add('trig', (function () {
    var f = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc',
        'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch', 'arsinh', 'arcosh', 'artanh', 'arcoth', 'arsech', 'arcsch'];
    var names = { sin: 'Sine', cos: 'Cosine', tan: 'Tangent', cot: 'Cotangent', sec: 'Secant', csc: 'Cosecant',
        sinh: 'Hyperbolic sine', cosh: 'Hyperbolic cosine', tanh: 'Hyperbolic tangent', coth: 'Hyperbolic cotangent',
        sech: 'Hyperbolic secant', csch: 'Hyperbolic cosecant' };
    var out = [], i, nm;
    for (i = 0; i < f.length; i++) {
        nm = names[f[i]];
        if (!nm) {
            if (f[i].indexOf('arc') === 0) { nm = 'Inverse ' + U.lower(names[f[i].substring(3)]); }
            else { nm = 'Inverse ' + U.lower(names[f[i].substring(2)]); }
        }
        out.push([f[i], nm, '\\' + f[i], 'trigonometric function ' + f[i] + (f[i].indexOf('h') > 2 ? ' hyperbolic' : '')]);
    }
    out.push(['sin\u207B\u00B9', 'Inverse sine (power notation)', '\\sin^{-1}', 'inverse arcsine']);
    out.push(['\u00B0', 'Degree', '^{\\circ}', 'degree angle']);
    out.push(['rad', 'Radian', '\\,\\mathrm{rad}', 'radian angle unit']);
    out.push(['\u03B8', 'Theta (angle)', '\\theta', 'angle theta']);
    return out;
}()), 'function');

Symbols.add('linalg', [
    ['(\u22EF)', 'Matrix (parentheses) 2\u00D72', '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', 'matrix pmatrix'],
    ['[\u22EF]', 'Matrix (brackets) 2\u00D72', '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', 'matrix bmatrix'],
    ['|\u22EF|', 'Determinant 2\u00D72', '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', 'determinant vmatrix'],
    ['det', 'Determinant function', '\\det', 'determinant det'],
    ['A\u1D40', 'Transpose', 'A^{\\mathrm{T}}', 'transpose'],
    ['A\u207B\u00B9', 'Inverse matrix', 'A^{-1}', 'inverse'],
    ['I\u2099', 'Identity matrix', 'I_{n}', 'identity unit matrix'],
    ['I\u2083', 'Identity matrix 3\u00D73', '\\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{pmatrix}', 'identity explicit'],
    ['0', 'Zero matrix', '\\mathbf{0}', 'zero null matrix'],
    ['rank', 'Rank', '\\rank(A)', 'rank'], ['tr', 'Trace', '\\tr(A)', 'trace'],
    ['\u03BB', 'Eigenvalue', '\\lambda', 'eigenvalue'], ['v', 'Eigenvector (bold)', '\\mathbf{v}', 'eigenvector vector bold'],
    ['Av=\u03BBv', 'Eigenvalue equation', 'A\\mathbf{v}=\\lambda\\mathbf{v}', 'eigen equation'],
    ['V', 'Vector space', 'V', 'vector space'], ['span', 'Span', '\\span', 'span linear combination'],
    ['T:V\u2192W', 'Linear transformation', 'T\\colon V\\to W', 'linear map transformation'],
    ['\u22C5', 'Dot product', '\\mathbf{a}\\cdot\\mathbf{b}', 'dot scalar product'],
    ['\u00D7', 'Cross product', '\\mathbf{a}\\times\\mathbf{b}', 'cross vector product'],
    ['\u2016v\u2016', 'Norm', '\\norm{\\mathbf{v}}', 'norm length magnitude'],
    ['\u27E8u,v\u27E9', 'Inner product', '\\langle \\mathbf{u},\\mathbf{v} \\rangle', 'inner product bracket'],
    ['\u2297', 'Tensor / Kronecker product', '\\otimes', 'tensor kronecker outer'],
    ['A\u2020', 'Conjugate transpose', 'A^{\\dagger}', 'hermitian adjoint dagger'],
    ['ker', 'Kernel', '\\ker', 'kernel null space'], ['dim', 'Dimension', '\\dim', 'dimension'],
    ['\u2295', 'Direct sum', '\\oplus', 'direct sum'], ['\u2218', 'Hadamard / composition', '\\circ', 'hadamard composition']
]);

Symbols.add('probstat', [
    ['P(A)', 'Probability', 'P(A)', 'probability'], ['P(A|B)', 'Conditional probability', 'P(A\\mid B)', 'conditional given'],
    ['E[X]', 'Expected value', '\\mathbb{E}[X]', 'expectation mean expected'], ['Var', 'Variance', '\\Var(X)', 'variance'],
    ['\u03C3', 'Standard deviation', '\\sigma', 'standard deviation sigma'], ['\u03C3\u00B2', 'Variance (sigma squared)', '\\sigma^{2}', 'variance'],
    ['x\u0304', 'Sample mean', '\\bar{x}', 'mean average sample'], ['\u03BC', 'Population mean', '\\mu', 'mean population'],
    ['x\u0303', 'Median', '\\tilde{x}', 'median'], ['Mo', 'Mode', '\\mathrm{Mo}', 'mode'],
    ['X\u223CD', 'Distributed as', 'X\\sim', 'distribution distributed'],
    ['N(\u03BC,\u03C3\u00B2)', 'Normal distribution', '\\mathcal{N}(\\mu,\\sigma^{2})', 'normal gaussian distribution'],
    ['B(n,p)', 'Binomial distribution', '\\mathrm{B}(n,p)', 'binomial distribution'],
    ['Pois(\u03BB)', 'Poisson distribution', '\\operatorname{Pois}(\\lambda)', 'poisson distribution'],
    ['\u2211x\u1D62', 'Summation of observations', '\\sum_{i=1}^{n} x_{i}', 'sum observations'],
    ['n', 'Sample size', 'n', 'sample size'], ['N', 'Population size', 'N', 'population size'],
    ['\u03C1', 'Correlation (population)', '\\rho', 'correlation'], ['r', 'Correlation (sample)', 'r', 'correlation sample'],
    ['Cov', 'Covariance', '\\Cov(X,Y)', 'covariance'], ['{x\u2081,\u2026,x\u2099}', 'Set of observations', '\\{x_{1},\\ldots,x_{n}\\}', 'observations data'],
    ['\u03B8\u0302', 'Estimator', '\\hat{\\theta}', 'estimator estimate hat'], ['p\u0302', 'Sample proportion', '\\hat{p}', 'proportion estimator'],
    ['\u03C7\u00B2', 'Chi-squared', '\\chi^{2}', 'chi squared test'], ['s\u00B2', 'Sample variance', 's^{2}', 'sample variance'],
    ['z', 'z-score', 'z=\\frac{x-\\mu}{\\sigma}', 'z score standard'], ['n!', 'Factorial', 'n!', 'factorial'],
    ['\u2AEB', 'Independence', '\\perp\\!\\!\\!\\perp', 'independent'], ['Pr', 'Probability operator', '\\Pr', 'probability']
]);

Symbols.add('numtheory', [
    ['\u2115', 'Natural numbers', '\\mathbb{N}', 'natural numbers counting'], ['\u2124', 'Integers', '\\mathbb{Z}', 'integers whole'],
    ['\u211A', 'Rational numbers', '\\mathbb{Q}', 'rational'], ['\u211D', 'Real numbers', '\\mathbb{R}', 'real'],
    ['\u2102', 'Complex numbers', '\\mathbb{C}', 'complex'], ['\u2119', 'Prime numbers', '\\mathbb{P}', 'primes'],
    ['\u2223', 'Divides', '\\mid', 'divides divisibility'], ['\u2224', 'Does not divide', '\\nmid', 'not divides'],
    ['mod', 'Modulo (parenthesized)', '\\pmod{n}', 'modulo congruence'],
    ['a\u2261b', 'Congruence', 'a\\equiv b\\pmod{n}', 'congruent modulo'],
    ['gcd', 'Greatest common divisor', '\\gcd(a,b)', 'gcd hcf'], ['lcm', 'Least common multiple', '\\lcm(a,b)', 'lcm'],
    ['\u230Ax\u230B', 'Floor', '\\lfloor x \\rfloor', 'floor'], ['\u2308x\u2309', 'Ceiling', '\\lceil x \\rceil', 'ceiling'],
    ['p\u2081\u1D49\u00B9', 'Prime factorization', 'p_{1}^{e_{1}}p_{2}^{e_{2}}\\cdots p_{k}^{e_{k}}', 'factorization primes'],
    ['P(n,k)', 'Permutations', 'P(n,k)=\\frac{n!}{(n-k)!}', 'permutations arrangements'],
    ['C(n,k)', 'Combinations', '\\binom{n}{k}=\\frac{n!}{k!(n-k)!}', 'combinations choose'],
    ['(a\u2099)', 'Sequence', '(a_{n})_{n\\geq 1}', 'sequence'], ['a\u2099\u208A\u2081', 'Recurrence relation', 'a_{n+1}=a_{n}+a_{n-1}', 'recurrence fibonacci'],
    ['G=(V,E)', 'Graph', 'G=(V,E)', 'graph vertices edges'], ['deg', 'Vertex degree', '\\deg(v)', 'degree vertex'],
    ['f:A\u2192B', 'Function', 'f\\colon A\\to B', 'function mapping'], ['\u21A6', 'Maps to', '\\mapsto', 'maps to'],
    ['\u2218', 'Composition', '\\circ', 'composition'], ['\u03C6(n)', 'Euler totient', '\\varphi(n)', 'totient phi'],
    ['n!!', 'Double factorial', 'n!!', 'double factorial'], ['\u03C3(n)', 'Divisor sum', '\\sigma(n)', 'sigma divisors']
]);

Symbols.add('arrows', [
    ['\u2192', 'Right arrow', '\\rightarrow', 'to arrow'], ['\u2190', 'Left arrow', '\\leftarrow', 'from arrow'],
    ['\u2194', 'Left-right arrow', '\\leftrightarrow', 'both'], ['\u21D2', 'Double right arrow', '\\Rightarrow', 'implies'],
    ['\u21D0', 'Double left arrow', '\\Leftarrow', 'implied'], ['\u21D4', 'Double left-right arrow', '\\Leftrightarrow', 'iff'],
    ['\u27F6', 'Long right arrow', '\\longrightarrow', 'long'], ['\u27F5', 'Long left arrow', '\\longleftarrow', 'long'],
    ['\u21A6', 'Maps to', '\\mapsto', 'mapsto'], ['\u2191', 'Up arrow', '\\uparrow', 'up'], ['\u2193', 'Down arrow', '\\downarrow', 'down'],
    ['\u2197', 'North-east arrow', '\\nearrow', 'increasing'], ['\u2198', 'South-east arrow', '\\searrow', 'decreasing'],
    ['\u21AA', 'Hook right arrow (injection)', '\\hookrightarrow', 'injection embedding'],
    ['\u21A0', 'Two-head right arrow (surjection)', '\\twoheadrightarrow', 'surjection onto'],
    ['\u21CC', 'Right-left harpoons', '\\rightleftharpoons', 'equilibrium'],
    ['\u21C4', 'Right-left arrows', '\\rightleftarrows', 'reversible'], ['\u21DD', 'Squiggly arrow', '\\rightsquigarrow', 'leads to'],
    ['\u21BA', 'Counter-clockwise arrow', '\\circlearrowleft', 'rotation'], ['\u21BB', 'Clockwise arrow', '\\circlearrowright', 'rotation'],
    ['\u2192\u02E3', 'Extensible arrow with label', '\\xrightarrow{}', 'arrow label over']
]);

Symbols.add('delimiters', [
    ['( )', 'Parentheses', '\\left(  \\right)', 'parentheses round brackets'],
    ['[ ]', 'Square brackets', '\\left[  \\right]', 'square brackets'],
    ['{ }', 'Curly braces', '\\left\\{  \\right\\}', 'braces curly'],
    ['\u27E8 \u27E9', 'Angle brackets', '\\left\\langle  \\right\\rangle', 'angle chevrons'],
    ['\u230A \u230B', 'Floor brackets', '\\left\\lfloor  \\right\\rfloor', 'floor'],
    ['\u2308 \u2309', 'Ceiling brackets', '\\left\\lceil  \\right\\rceil', 'ceiling'],
    ['| |', 'Absolute value bars', '\\left|  \\right|', 'absolute bars'],
    ['\u2016 \u2016', 'Norm (double bars)', '\\left\\|  \\right\\|', 'norm double bars'],
    ['\u27E6 \u27E7', 'Double square brackets', '\\left\\llbracket  \\right\\rrbracket', 'semantic brackets'],
    ['{ cases', 'Piecewise brace', '\\begin{cases}  &  \\\\  &  \\end{cases}', 'piecewise cases'],
    ['( ]', 'Half-open interval', '(a,b]', 'interval']
], 'structure');

Symbols.add('accents', [
    ['x\u20D7', 'Vector arrow', '\\vec{}', 'vector arrow'], ['x\u0302', 'Hat', '\\hat{}', 'hat circumflex unit'],
    ['x\u0304', 'Bar', '\\bar{}', 'bar macron mean'], ['AB\u0305', 'Overline', '\\overline{}', 'overline'],
    ['x\u0332', 'Underline', '\\underline{}', 'underline'], ['x\u0307', 'Dot', '\\dot{}', 'dot derivative'],
    ['x\u0308', 'Double dot', '\\ddot{}', 'double dot'], ['x\u0303', 'Tilde', '\\tilde{}', 'tilde'],
    ['xy\u0302', 'Wide hat', '\\widehat{}', 'wide hat'], ['xy\u0303', 'Wide tilde', '\\widetilde{}', 'wide tilde'],
    ['\u23DE', 'Overbrace', '\\overbrace{}^{}', 'overbrace label'], ['\u23DF', 'Underbrace', '\\underbrace{}_{}', 'underbrace label'],
    ['x\u030C', 'Check', '\\check{}', 'check caron'], ['x\u0306', 'Breve', '\\breve{}', 'breve'],
    ['\u25AD', 'Boxed', '\\boxed{}', 'box frame'], ['=\u0302', 'Overset', '\\overset{}{}', 'stack over'],
    ['x', 'Bold (upright)', '\\mathbf{}', 'bold vector'], ['x', 'Bold italic', '\\boldsymbol{}', 'bold italic symbol'],
    ['x', 'Upright (roman)', '\\mathrm{}', 'roman upright'], ['Aa', 'Text', '\\text{}', 'text words']
], 'structure');

Symbols.add('letterlike', [
    ['\u2115', 'Double-struck N', '\\mathbb{N}', 'blackboard naturals'], ['\u2124', 'Double-struck Z', '\\mathbb{Z}', 'integers'],
    ['\u211A', 'Double-struck Q', '\\mathbb{Q}', 'rationals'], ['\u211D', 'Double-struck R', '\\mathbb{R}', 'reals'],
    ['\u2102', 'Double-struck C', '\\mathbb{C}', 'complex'], ['\u210D', 'Double-struck H (quaternions)', '\\mathbb{H}', 'quaternions'],
    ['\u2119', 'Double-struck P', '\\mathbb{P}', 'primes projective probability'],
    ['\uD835\uDD3D', 'Double-struck F (field)', '\\mathbb{F}', 'finite field'],
    ['\u2112', 'Script L (Laplace)', '\\mathcal{L}', 'laplace lagrangian'], ['\u2131', 'Script F (Fourier)', '\\mathcal{F}', 'fourier'],
    ['\u210B', 'Script H (Hilbert / Hamiltonian)', '\\mathcal{H}', 'hilbert hamiltonian'],
    ['\uD835\uDCAB', 'Script P', '\\mathcal{P}', 'power set'], ['\uD835\uDC9C', 'Script A', '\\mathcal{A}', 'script'],
    ['\u2130', 'Script E (emf)', '\\mathcal{E}', 'emf electromotive'], ['\u2133', 'Script M', '\\mathcal{M}', 'script m'],
    ['\uD835\uDD24', 'Fraktur g (Lie algebra)', '\\mathfrak{g}', 'lie algebra fraktur'],
    ['\u2135', 'Aleph', '\\aleph', 'cardinal'], ['\u2136', 'Beth', '\\beth', 'cardinal'], ['\u2113', 'Script l (ell)', '\\ell', 'length'],
    ['\u2118', 'Weierstrass p', '\\wp', 'weierstrass'], ['\u211C', 'Real part', '\\Re', 'real part'], ['\u2111', 'Imaginary part', '\\Im', 'imaginary part'],
    ['\u0127', 'h-bar', '\\hbar', 'reduced planck'], ['\u0131', 'Dotless i', '\\imath', 'dotless'], ['\u0237', 'Dotless j', '\\jmath', 'dotless']
]);

Symbols.add('advanced', [
    ['A\u0305', 'Closure (topology)', '\\overline{A}', 'closure topology'], ['A\u00B0', 'Interior (topology)', 'A^{\\circ}', 'interior topology'],
    ['\u2202A', 'Boundary', '\\partial A', 'boundary topology'], ['\u2245', 'Homeomorphic / isomorphic', '\\cong', 'homeomorphic isomorphic'],
    ['\u2243', 'Homotopy equivalent', '\\simeq', 'homotopic'], ['\u22B4', 'Normal subgroup', '\\trianglelefteq', 'normal subgroup ideal group theory'],
    ['\u22B2', 'Proper normal subgroup', '\\lhd', 'normal subgroup'], ['G/H', 'Quotient group', 'G/H', 'quotient coset'],
    ['\u22CA', 'Semidirect product', '\\rtimes', 'semidirect group'], ['Aut', 'Automorphism group', '\\operatorname{Aut}(G)', 'automorphism'],
    ['Hom', 'Homomorphisms', '\\hom(V,W)', 'homomorphism'], ['im', 'Image', '\\operatorname{im} f', 'image range'],
    ['char', 'Characteristic (ring/field)', '\\operatorname{char} F', 'characteristic ring field'],
    ['Gal', 'Galois group', '\\operatorname{Gal}(L/K)', 'galois field extension'], ['[L:K]', 'Degree of field extension', '[L:K]', 'field degree'],
    ['\u2227', 'Wedge (exterior) product', '\\wedge', 'exterior wedge differential forms'],
    ['\u2112\u2093', 'Lie derivative', '\\mathcal{L}_{X}', 'lie derivative'],
    ['\u0393\u1D58\u1D65', 'Christoffel symbol', '\\Gamma^{\\lambda}_{\\mu\\nu}', 'christoffel connection differential geometry'],
    ['\u2207\u03BC', 'Covariant derivative', '\\nabla_{\\mu}', 'covariant derivative'],
    ['R\u1D56', 'Riemann tensor', 'R^{\\rho}{}_{\\sigma\\mu\\nu}', 'riemann curvature tensor'],
    ['g\u03BC\u03BD', 'Metric tensor', 'g_{\\mu\\nu}', 'metric tensor'], ['T\u209AM', 'Tangent space', 'T_{p}M', 'tangent space manifold'],
    ['\u03B4\u1D62\u2C7C', 'Kronecker delta', '\\delta_{ij}', 'kronecker tensor'], ['\u03B5\u1D62\u2C7C\u2096', 'Levi-Civita symbol', '\\varepsilon_{ijk}', 'levi civita permutation tensor'],
    ['V*', 'Dual space', 'V^{*}', 'dual space functional analysis'], ['A*', 'Adjoint operator', 'A^{*}', 'adjoint'],
    ['L\u1D56', 'Lp space', 'L^{p}', 'lebesgue space'], ['\u2016T\u2016', 'Operator norm', '\\norm{T}_{\\mathrm{op}}', 'operator norm'],
    ['z\u0304', 'Complex conjugate', '\\bar{z}', 'conjugate complex analysis'], ['Res', 'Residue', '\\Res_{z=a} f', 'residue complex'],
    ['arg', 'Argument', '\\arg z', 'argument complex'], ['O(n)', 'Big O', '\\mathcal{O}(n)', 'big o complexity numerical'],
    ['x\u2099\u208A\u2081', 'Iteration', 'x_{n+1}=x_{n}-\\frac{f(x_{n})}{f\'(x_{n})}', 'newton iteration numerical analysis'],
    ['argmin', 'Arg min', '\\argmin_{x}', 'optimization argmin'], ['argmax', 'Arg max', '\\argmax_{x}', 'optimization argmax'],
    ['\u2207\u00B2f', 'Hessian', '\\nabla^{2} f', 'hessian optimization'], ['s.t.', 'Subject to', '\\text{subject to}', 'constraint optimization'],
    ['\u25A1', "d'Alembertian", '\\Box', 'dalembertian wave operator'], ['\u03B4(x)', 'Dirac delta', '\\delta(x)', 'dirac delta distribution'],
    ['\u0398(x)', 'Heaviside step', '\\Theta(x)', 'heaviside step'], ['G(x,x\u2032)', "Green's function", "G(x,x')", 'green function']
]);

/* ------------------------------------------------------------- PHYSICS ---- */
Symbols.add('phys_mech', [
    ['r\u20D7', 'Position vector', '\\vec{r}', 'position'], ['\u0394r\u20D7', 'Displacement', '\\Delta\\vec{r}', 'displacement'],
    ['s', 'Displacement / path (s)', 's', 'path displacement'], ['d', 'Distance', 'd', 'distance'],
    ['v\u20D7', 'Velocity', '\\vec{v}', 'velocity speed'], ['a\u20D7', 'Acceleration', '\\vec{a}', 'acceleration'],
    ['m', 'Mass', 'm', 'mass'], ['F\u20D7', 'Force', '\\vec{F}', 'force'], ['p\u20D7', 'Momentum', '\\vec{p}', 'momentum'],
    ['J\u20D7', 'Impulse', '\\vec{J}', 'impulse'], ['W', 'Work', 'W', 'work'], ['E', 'Energy', 'E', 'energy'],
    ['E\u2096', 'Kinetic energy', 'E_{\\mathrm{k}}', 'kinetic energy'], ['E\u209A', 'Potential energy', 'E_{\\mathrm{p}}', 'potential energy'],
    ['P', 'Power', 'P', 'power'], ['\u03C4\u20D7', 'Torque', '\\vec{\\tau}', 'torque moment'],
    ['\u03C9\u20D7', 'Angular velocity', '\\vec{\\omega}', 'angular velocity'], ['\u03B1\u20D7', 'Angular acceleration', '\\vec{\\alpha}', 'angular acceleration'],
    ['I', 'Moment of inertia', 'I', 'moment inertia'], ['L\u20D7', 'Angular momentum', '\\vec{L}', 'angular momentum'],
    ['f\u2096', 'Kinetic friction', 'f_{\\mathrm{k}}', 'friction'], ['\u03BC\u209B', 'Coefficient of friction', '\\mu_{\\mathrm{s}}', 'friction coefficient'],
    ['g', 'Gravitational acceleration', 'g', 'gravity acceleration'], ['G', 'Gravitational constant', 'G', 'gravitational constant'],
    ['\u03A6\u0261', 'Gravitational potential', '\\Phi_{g}', 'gravitational potential'], ['\u2211F=0', 'Mechanical equilibrium', '\\sum\\vec{F}=0', 'equilibrium static'],
    ['k', 'Spring constant', 'k', 'spring hooke'], ['T', 'Period', 'T', 'period'], ['\u03C1', 'Density', '\\rho', 'density'],
    ['N', 'Normal force', 'N', 'normal force'], ['F\u20D7net', 'Net force', '\\vec{F}_{\\mathrm{net}}', 'net force']
], 'notation');

Symbols.add('phys_em', [
    ['q', 'Electric charge', 'q', 'charge'], ['Q', 'Charge (total)', 'Q', 'charge'], ['I', 'Current', 'I', 'current'],
    ['V', 'Voltage', 'V', 'voltage'], ['\u0394V', 'Potential difference', '\\Delta V', 'potential difference'],
    ['R', 'Resistance', 'R', 'resistance'], ['G', 'Conductance', 'G', 'conductance'], ['C', 'Capacitance', 'C', 'capacitance'],
    ['L', 'Inductance', 'L', 'inductance'], ['E\u20D7', 'Electric field', '\\vec{E}', 'electric field'],
    ['B\u20D7', 'Magnetic flux density', '\\vec{B}', 'magnetic field flux density'], ['H\u20D7', 'Magnetic field strength', '\\vec{H}', 'magnetic field strength'],
    ['\u03A6B', 'Magnetic flux', '\\Phi_{B}', 'magnetic flux'], ['\u03B5\u2080', 'Vacuum permittivity', '\\varepsilon_{0}', 'permittivity'],
    ['\u03B5\u1D63', 'Relative permittivity', '\\varepsilon_{r}', 'permittivity relative dielectric'], ['\u03BC\u2080', 'Vacuum permeability', '\\mu_{0}', 'permeability'],
    ['k\u2091', 'Coulomb constant', 'k_{e}', 'coulomb constant'], ['\u03C6', 'Electric potential', '\\varphi', 'potential'],
    ['\u2130', 'Electromotive force', '\\mathcal{E}', 'emf electromotive'], ['Z', 'Impedance', 'Z', 'impedance'],
    ['X', 'Reactance', 'X', 'reactance'], ['X\u2097', 'Inductive reactance', 'X_{L}', 'inductive reactance'],
    ['X\u1D04', 'Capacitive reactance', 'X_{C}', 'capacitive reactance'], ['J\u20D7', 'Current density', '\\vec{J}', 'current density'],
    ['\u03C1', 'Resistivity / charge density', '\\rho', 'resistivity charge density'], ['\u03C3', 'Conductivity', '\\sigma', 'conductivity'],
    ['p\u20D7', 'Electric dipole moment', '\\vec{p}', 'dipole'], ['\u03BC\u20D7', 'Magnetic moment', '\\vec{\\mu}', 'magnetic moment']
], 'notation');

Symbols.add('phys_waves', [
    ['f', 'Frequency', 'f', 'frequency'], ['\u03BD', 'Frequency (nu)', '\\nu', 'frequency nu'], ['\u03C9', 'Angular frequency', '\\omega', 'angular frequency'],
    ['\u03BB', 'Wavelength', '\\lambda', 'wavelength'], ['k', 'Wave number', 'k', 'wavenumber'], ['T', 'Period', 'T', 'period'],
    ['A', 'Amplitude', 'A', 'amplitude'], ['\u03C6', 'Phase', '\\phi', 'phase'], ['n', 'Refractive index', 'n', 'refractive index'],
    ['f', 'Focal length', 'f', 'focal length lens'], ['M', 'Magnification', 'M', 'magnification'], ['I', 'Intensity', 'I', 'intensity'],
    ['P\u20D7', 'Polarization', '\\vec{P}', 'polarization'], ['\u03B8\u1D62', 'Angle of incidence', '\\theta_{i}', 'incidence reflection'],
    ['\u03B8\u1D63', 'Angle of reflection', '\\theta_{r}', 'reflection'], ['\u03B8\u209C', 'Angle of refraction', '\\theta_{t}', 'refraction transmission'],
    ['\u0394', 'Path difference', '\\Delta', 'interference path difference'], ['dsin\u03B8=m\u03BB', 'Diffraction grating condition', 'd\\sin\\theta=m\\lambda', 'diffraction interference grating'],
    ['c', 'Speed of light', 'c', 'speed light'], ['v\u209A', 'Phase velocity', 'v_{p}', 'phase velocity'], ['v\u0261', 'Group velocity', 'v_{g}', 'group velocity']
], 'notation');

Symbols.add('phys_thermo', [
    ['T', 'Temperature', 'T', 'temperature'], ['Q', 'Heat', 'Q', 'heat'], ['U', 'Internal energy', 'U', 'internal energy'],
    ['S', 'Entropy', 'S', 'entropy'], ['H', 'Enthalpy', 'H', 'enthalpy'], ['G', 'Gibbs free energy', 'G', 'gibbs free energy potential'],
    ['F', 'Helmholtz free energy', 'F', 'helmholtz potential'], ['p', 'Pressure', 'p', 'pressure'], ['V', 'Volume', 'V', 'volume'],
    ['\u03C1', 'Density', '\\rho', 'density'], ['c', 'Specific heat capacity', 'c', 'specific heat'], ['C\u209A', 'Heat capacity (const. pressure)', 'C_{p}', 'heat capacity'],
    ['C\u1D65', 'Heat capacity (const. volume)', 'C_{V}', 'heat capacity'], ['\u03B3', 'Adiabatic index', '\\gamma', 'heat capacity ratio adiabatic'],
    ['\u03BA', 'Thermal conductivity', '\\kappa', 'thermal conductivity'], ['R', 'Gas constant', 'R', 'gas constant'],
    ['k\u0299', 'Boltzmann constant', 'k_{\\mathrm{B}}', 'boltzmann'], ['N\u2090', 'Avogadro constant', 'N_{\\mathrm{A}}', 'avogadro'],
    ['n', 'Amount of substance', 'n', 'moles amount'], ['\u0394U', 'Change in internal energy', '\\Delta U', 'change'],
    ['Q\u0307', 'Heat flow rate', '\\dot{Q}', 'heat flow'], ['\u03B7', 'Efficiency', '\\eta', 'efficiency'], ['\u03C3', 'Stefan-Boltzmann constant', '\\sigma', 'stefan boltzmann radiation']
], 'notation');

Symbols.add('phys_quantum', [
    ['h', 'Planck constant', 'h', 'planck'], ['\u0127', 'Reduced Planck constant', '\\hbar', 'hbar dirac'],
    ['\u03A8', 'Wave function (capital psi)', '\\Psi', 'wave function'], ['\u03C8', 'Wave function', '\\psi', 'wave function'],
    ['|\u03C8|\u00B2', 'Probability density', '\\left|\\psi\\right|^{2}', 'probability density born'],
    ['|\u03C8\u27E9', 'Ket (quantum state)', '\\ket{\\psi}', 'ket state dirac'], ['\u27E8\u03C6|', 'Bra', '\\bra{\\phi}', 'bra dirac'],
    ['\u27E8\u03C6|\u03C8\u27E9', 'Bra-ket (inner product)', '\\braket{\\phi}{\\psi}', 'braket inner product'],
    ['\u00C2', 'Operator', '\\hat{A}', 'operator hat'], ['\u0124', 'Hamiltonian', '\\hat{H}', 'hamiltonian'],
    ['p\u0302', 'Momentum operator', '\\hat{p}', 'momentum operator'], ['\u27E8A\u27E9', 'Expectation value', '\\langle \\hat{A} \\rangle', 'expectation'],
    ['[A,B]', 'Commutator', '[\\hat{A},\\hat{B}]', 'commutator'], ['E\u2099', 'Energy level', 'E_{n}', 'energy level eigenvalue'],
    ['|n\u27E9', 'Eigenstate', '\\ket{n}', 'eigenstate'], ['S\u20D7', 'Spin', '\\vec{S}', 'spin'], ['m\u209B', 'Spin projection', 'm_{s}', 'spin quantum number'],
    ['E=h\u03BD', 'Photon energy', 'E=h\\nu', 'photon energy'], ['\u03B3', 'Lorentz factor', '\\gamma', 'lorentz relativistic'],
    ['m\u2080', 'Rest mass', 'm_{0}', 'rest mass relativistic'], ['x\u1D58', 'Four-vector', 'x^{\\mu}', 'four vector relativity'],
    ['\u1D2C\u2082X', 'Nuclide notation', '\\prescript{A}{Z}{\\mathrm{X}}', 'nuclide isotope nuclear'],
    ['\u03B1', 'Alpha particle', '\\alpha', 'alpha decay'], ['\u03B2\u207B', 'Beta minus', '\\beta^{-}', 'beta decay'],
    ['\u03BD\u2091', 'Electron neutrino', '\\nu_{e}', 'neutrino'], ['\u03C3\u2093', 'Pauli matrix', '\\sigma_{x}', 'pauli spin'],
    ['\u2020', 'Hermitian adjoint', '^{\\dagger}', 'dagger adjoint'], ['\u03B4\u1D62\u2C7C', 'Kronecker delta', '\\delta_{ij}', 'kronecker']
], 'notation');

Symbols.add('phys_constants', [
    ['c', 'Speed of light in vacuum', 'c', 'light speed 299792458'], ['G', 'Newtonian constant of gravitation', 'G', 'gravitational'],
    ['h', 'Planck constant', 'h', 'planck'], ['\u0127', 'Reduced Planck constant', '\\hbar', 'reduced planck'],
    ['e', 'Elementary charge', 'e', 'electron charge'], ['m\u2091', 'Electron mass', 'm_{e}', 'electron mass'],
    ['m\u209A', 'Proton mass', 'm_{p}', 'proton mass'], ['k\u0299', 'Boltzmann constant', 'k_{\\mathrm{B}}', 'boltzmann'],
    ['N\u2090', 'Avogadro constant', 'N_{\\mathrm{A}}', 'avogadro'], ['R', 'Molar gas constant', 'R', 'gas constant'],
    ['\u03B5\u2080', 'Vacuum electric permittivity', '\\varepsilon_{0}', 'permittivity'], ['\u03BC\u2080', 'Vacuum magnetic permeability', '\\mu_{0}', 'permeability'],
    ['\u03C3', 'Stefan-Boltzmann constant', '\\sigma', 'stefan'], ['a\u2080', 'Bohr radius', 'a_{0}', 'bohr radius'],
    ['R\u221E', 'Rydberg constant', 'R_{\\infty}', 'rydberg'], ['\u03B1', 'Fine-structure constant', '\\alpha', 'fine structure'],
    ['g', 'Standard gravity', 'g', 'gravity 9.80665']
], 'notation');

/* --------------------------------------------------------------- UNITS ---- */
Symbols.add('units_si', [
    ['m', 'Metre', '\\,\\unit{m}', 'meter length'], ['kg', 'Kilogram', '\\,\\unit{kg}', 'mass'], ['s', 'Second', '\\,\\unit{s}', 'time'],
    ['A', 'Ampere', '\\,\\unit{A}', 'current amp'], ['K', 'Kelvin', '\\,\\unit{K}', 'temperature'], ['mol', 'Mole', '\\,\\unit{mol}', 'amount'],
    ['cd', 'Candela', '\\,\\unit{cd}', 'luminous intensity']
], 'unit');
Symbols.add('units_derived', [
    ['N', 'Newton', '\\,\\unit{N}', 'force'], ['J', 'Joule', '\\,\\unit{J}', 'energy work'], ['W', 'Watt', '\\,\\unit{W}', 'power'],
    ['Pa', 'Pascal', '\\,\\unit{Pa}', 'pressure'], ['C', 'Coulomb', '\\,\\unit{C}', 'charge'], ['V', 'Volt', '\\,\\unit{V}', 'voltage'],
    ['\u03A9', 'Ohm', '\\,\\unit{\\Omega}', 'resistance'], ['F', 'Farad', '\\,\\unit{F}', 'capacitance'], ['T', 'Tesla', '\\,\\unit{T}', 'magnetic flux density'],
    ['Wb', 'Weber', '\\,\\unit{Wb}', 'magnetic flux'], ['H', 'Henry', '\\,\\unit{H}', 'inductance'], ['Hz', 'Hertz', '\\,\\unit{Hz}', 'frequency'],
    ['lm', 'Lumen', '\\,\\unit{lm}', 'luminous flux'], ['lx', 'Lux', '\\,\\unit{lx}', 'illuminance'], ['S', 'Siemens', '\\,\\unit{S}', 'conductance'],
    ['Bq', 'Becquerel', '\\,\\unit{Bq}', 'radioactivity'], ['Gy', 'Gray', '\\,\\unit{Gy}', 'absorbed dose'], ['Sv', 'Sievert', '\\,\\unit{Sv}', 'equivalent dose'],
    ['kat', 'Katal', '\\,\\unit{kat}', 'catalytic activity'], ['rad', 'Radian', '\\,\\unit{rad}', 'angle'], ['sr', 'Steradian', '\\,\\unit{sr}', 'solid angle'],
    ['\u00B0C', 'Degree Celsius', '\\,\\unit{^{\\circ}C}', 'celsius temperature']
], 'unit');
Symbols.add('units_other', [
    ['m/s', 'Metre per second', '\\,\\unit{m/s}', 'velocity speed'], ['m\u00B7s\u207B\u00B9', 'Metre per second (exponent)', '\\,\\unit{m.s^{-1}}', 'velocity'],
    ['m/s\u00B2', 'Metre per second squared', '\\,\\unit{m/s^{2}}', 'acceleration'], ['N\u00B7m', 'Newton metre', '\\,\\unit{N.m}', 'torque'],
    ['kg\u00B7m/s', 'Kilogram metre per second', '\\,\\unit{kg.m/s}', 'momentum'], ['J/(mol\u00B7K)', 'Joule per mole kelvin', '\\,\\unit{J/(mol.K)}', 'gas constant'],
    ['eV', 'Electronvolt', '\\,\\unit{eV}', 'energy'], ['L', 'Litre', '\\,\\unit{L}', 'volume liter'], ['mL', 'Millilitre', '\\,\\unit{mL}', 'volume'],
    ['min', 'Minute', '\\,\\unit{min}', 'time'], ['h', 'Hour', '\\,\\unit{h}', 'time'], ['\u00C5', 'Angstrom', '\\,\\unit{\\AA}', 'length'],
    ['bar', 'Bar', '\\,\\unit{bar}', 'pressure'], ['atm', 'Atmosphere', '\\,\\unit{atm}', 'pressure'], ['mmHg', 'Millimetre of mercury', '\\,\\unit{mmHg}', 'pressure'],
    ['cal', 'Calorie', '\\,\\unit{cal}', 'energy'], ['kWh', 'Kilowatt hour', '\\,\\unit{kWh}', 'energy'], ['Da', 'Dalton', '\\,\\unit{Da}', 'atomic mass'],
    ['M', 'Molar (mol/L)', '\\,\\unit{M}', 'concentration molarity'], ['mol/L', 'Mole per litre', '\\,\\unit{mol/L}', 'concentration'],
    ['g/mol', 'Gram per mole', '\\,\\unit{g/mol}', 'molar mass'], ['ppm', 'Parts per million', '\\,\\unit{ppm}', 'concentration'],
    ['dB', 'Decibel', '\\,\\unit{dB}', 'sound level'], ['km/h', 'Kilometre per hour', '\\,\\unit{km/h}', 'speed'],
    ['g', 'Gram', '\\,\\unit{g}', 'mass'], ['mg', 'Milligram', '\\,\\unit{mg}', 'mass'], ['km', 'Kilometre', '\\,\\unit{km}', 'length'],
    ['cm', 'Centimetre', '\\,\\unit{cm}', 'length'], ['mm', 'Millimetre', '\\,\\unit{mm}', 'length'], ['\u00B5m', 'Micrometre', '\\,\\unit{\\mu m}', 'length micron'],
    ['nm', 'Nanometre', '\\,\\unit{nm}', 'length wavelength'], ['mA', 'Milliampere', '\\,\\unit{mA}', 'current'], ['kV', 'Kilovolt', '\\,\\unit{kV}', 'voltage'],
    ['MHz', 'Megahertz', '\\,\\unit{MHz}', 'frequency'], ['kJ', 'Kilojoule', '\\,\\unit{kJ}', 'energy'], ['kJ/mol', 'Kilojoule per mole', '\\,\\unit{kJ/mol}', 'enthalpy energy'],
    ['J/K', 'Joule per kelvin', '\\,\\unit{J/K}', 'entropy'], ['W/m\u00B2', 'Watt per square metre', '\\,\\unit{W/m^{2}}', 'intensity irradiance'],
    ['kg/m\u00B3', 'Kilogram per cubic metre', '\\,\\unit{kg/m^{3}}', 'density'], ['m\u00B2', 'Square metre', '\\,\\unit{m^{2}}', 'area'],
    ['m\u00B3', 'Cubic metre', '\\,\\unit{m^{3}}', 'volume']
], 'unit');

/* ----------------------------------------------------------- CHEMISTRY ---- */
Symbols.add('chem_arrows', [
    ['\u2192', 'Forward reaction arrow', '\\ce{->}', 'yields forward reaction'], ['\u2190', 'Reverse reaction arrow', '\\ce{<-}', 'reverse'],
    ['\u21CC', 'Equilibrium arrows', '\\ce{<=>}', 'equilibrium reversible harpoons'], ['\u21C4', 'Reversible reaction arrows', '\\rightleftarrows', 'reversible'],
    ['\u2194', 'Resonance arrow', '\\ce{<->}', 'resonance'], ['\u2192\u0394', 'Heat (over arrow)', '\\xrightarrow{\\Delta}', 'heat delta condition'],
    ['\u2192h\u03BD', 'Light (over arrow)', '\\xrightarrow{h\\nu}', 'light photochemical'],
    ['\u2192cat', 'Catalyst (over arrow)', '\\xrightarrow{\\text{catalyst}}', 'catalyst condition'],
    ['\u2192T,p', 'Temperature & pressure conditions', '\\xrightarrow[\\text{pressure}]{\\text{temperature}}', 'temperature pressure condition'],
    ['\u21B7', 'Electron movement (curved arrow)', '\\curvearrowright', 'electron pushing curved arrow'],
    ['\u21B6', 'Electron movement (curved left)', '\\curvearrowleft', 'electron curved arrow'],
    ['\u21C0', 'Single-electron (fishhook) arrow', '\\rightharpoonup', 'radical fishhook single electron'],
    ['\u21CB', 'Equilibrium (reverse harpoons)', '\\leftrightharpoons', 'equilibrium']
]);
Symbols.add('chem_states', [
    ['(s)', 'Solid state', '\\text{(s)}', 'solid state'], ['(l)', 'Liquid state', '\\text{(l)}', 'liquid state'],
    ['(g)', 'Gas state', '\\text{(g)}', 'gas state'], ['(aq)', 'Aqueous solution', '\\text{(aq)}', 'aqueous solution'],
    ['\u2193', 'Precipitate', '\\downarrow', 'precipitate solid forms'], ['\u2191', 'Gas evolved', '\\uparrow', 'gas evolution'],
    ['\u0394', 'Heat (Delta)', '\\Delta', 'heat'], ['\u00B0', 'Standard state', '^{\\circ}', 'standard state'],
    ['\u2296', 'Standard state (plimsoll)', '^{\\ominus}', 'standard state plimsoll']
]);
Symbols.add('chem_notation', [
    ['H\u2082O', 'Chemical formula', '\\ce{H2O}', 'formula water'], ['\u00B7', 'Hydrate dot', '\\cdot', 'hydrate water of crystallization'],
    ['\u207A', 'Positive charge', '^{+}', 'cation charge ion'], ['\u00B2\u207B', 'Charge 2-', '^{2-}', 'anion charge ion'],
    ['Fe\u207A\u00B3', 'Oxidation state', '\\overset{+3}{\\mathrm{Fe}}', 'oxidation number state'],
    ['\u00B9\u2074\u2086C', 'Isotope notation', '\\prescript{14}{6}{\\mathrm{C}}', 'isotope mass number atomic number'],
    ['1s\u00B22s\u00B2', 'Electron configuration', '1s^{2}\\,2s^{2}\\,2p^{6}', 'electron configuration orbital'],
    ['[A]', 'Concentration', '[\\mathrm{A}]', 'concentration molarity'], ['K\u2091q', 'Equilibrium constant', 'K_{\\mathrm{eq}}', 'equilibrium constant'],
    ['K\u2090', 'Acid dissociation constant', 'K_{\\mathrm{a}}', 'acid constant'], ['pH', 'pH', '\\mathrm{pH}', 'acidity'],
    ['pK\u2090', 'pKa', '\\mathrm{p}K_{\\mathrm{a}}', 'acidity constant'], ['\u0394H\u00B0', 'Standard enthalpy change', '\\Delta H^{\\circ}', 'enthalpy'],
    ['=', 'Double bond', '=', 'double bond'], ['\u2261', 'Triple bond', '\\equiv', 'triple bond'], ['\u2022', 'Radical dot', '\\bullet', 'radical'],
    ['\u03B4\u207A', 'Partial positive charge', '\\delta^{+}', 'partial charge'], ['\u03B4\u207B', 'Partial negative charge', '\\delta^{-}', 'partial charge'],
    ['e\u207B', 'Electron', '\\mathrm{e}^{-}', 'electron'], ['(OH)\u2082', 'Group with subscript', '\\ce{(OH)2}', 'group parentheses']
]);

/* Search helper used by the symbol browser and the global search */
Symbols.search = function (query, cat) {
    var out = [], i, e, sc;
    for (i = 0; i < Symbols.list.length; i++) {
        e = Symbols.list[i];
        if (cat && cat !== 'all' && e.cat !== cat) { continue; }
        sc = U.searchScore(query, [e.name, e.ch, e.ins, e.kw, Symbols.categoryName(e.cat), e.cp]);
        if (sc > 0) { out.push({ e: e, s: sc }); }
    }
    out.sort(function (a, b) { return b.s - a.s; });
    return U.map(out, function (x) { return x.e; });
};
