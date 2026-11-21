/* ==========================================================================
 * Module 26 - Chemistry engine
 *   Chem.parseCe(src)     \ce{...} syntax (mhchem-style subset) -> chem node
 *   Chem.parseSpecies(w)  structured species {coef, parts, charge, state, hydrates}
 *   Chem.count(formula)   element counts (nested groups, hydrates, charge)
 *   Chem.balance(eq)      real balancing via exact rational linear algebra,
 *                         followed by independent atom-count verification
 *   Chem.molarMass(f)     molar mass from the periodic table
 * ========================================================================== */
var Chem = {};
Chem.ARROWS = [
    ['<=>>', 'equilibrium'], ['<<=>', 'equilibrium'], ['<-->', 'rightleftarrows'], ['<=>', 'equilibrium'],
    ['<->', 'leftright'], ['->', 'right'], ['<-', 'left'], ['\u2192', 'right'], ['\u21CC', 'equilibrium'],
    ['\u21C4', 'rightleftarrows'], ['\u2190', 'left'], ['\u2194', 'leftright'], ['=', 'right']
];
Chem.STATES = { s: 1, l: 1, g: 1, aq: 1, cr: 1, sln: 1, ppt: 1 };

function ChemError(msg, pos) { return new MathError(ErrorKind.CHEMISTRY, msg, '', typeof pos === 'number' ? pos : -1); }

/* Split \ce source into tokens: {t:'species'|'plus'|'arrow'|'state'|'gas'|'ppt'|'math', v, above, below} */
Chem.tokenize = function (src, allowEqualsArrow) {
    var s = String(src), i = 0, n = s.length, toks = [], word = '', depth = 0, k, a, m, c;
    function flush() {
        if (word !== '') {
            if (word === '+') { toks.push({ t: 'plus' }); }
            else if (word === '^') { toks.push({ t: 'gas' }); }
            else if (word === 'v') { toks.push({ t: 'ppt' }); }
            else if ((m = /^\((s|l|g|aq|cr|sln|ppt)\)$/.exec(word))) { toks.push({ t: 'state', v: m[1] }); }
            else { toks.push({ t: 'species', v: word }); }
            word = '';
        }
    }
    function bracket() {
        var d = 0, out = '', ch;
        if (s.charAt(i) !== '[') { return null; }
        i++;
        while (i < n) {
            ch = s.charAt(i);
            if (ch === '[') { d++; }
            if (ch === ']') { if (d === 0) { i++; return out; } d--; }
            out += ch; i++;
        }
        throw ChemError('Missing "]" in reaction condition');
    }
    while (i < n) {
        c = s.charAt(i);
        if (depth === 0 && /\s/.test(c)) { flush(); i++; continue; }
        if (c === '$') {
            k = s.indexOf('$', i + 1);
            if (k < 0) { throw ChemError('Unclosed $ in chemical formula', i); }
            if (word === '') { toks.push({ t: 'math', v: s.substring(i + 1, k) }); i = k + 1; continue; }
            word += s.substring(i, k + 1); i = k + 1; continue;
        }
        if (c === '{') { depth++; } else if (c === '}') { depth--; }
        if (depth === 0) {
            var matched = null;
            for (k = 0; k < Chem.ARROWS.length; k++) {
                a = Chem.ARROWS[k][0];
                if (s.substring(i, i + a.length) !== a) { continue; }
                if (a === '=' && (!allowEqualsArrow || word !== '')) { continue; }
                matched = Chem.ARROWS[k];
                break;
            }
            if (matched) {
                flush();
                i += matched[0].length;
                var above = bracket(), below = null;
                if (above !== null) { below = bracket(); }
                toks.push({ t: 'arrow', v: matched[1], above: above, below: below });
                continue;
            }
        }
        word += c;
        i++;
    }
    flush();
    return toks;
};

/* Parse one species word into structure. */
Chem.parseSpecies = function (w) {
    var s = String(w), i = 0, n = s.length, sp = { coef: '', parts: [], charge: '', state: '', hydrates: [], raw: s }, m;
    m = /^([0-9]+\/[0-9]+|[0-9]+(\.[0-9]+)?)(?=[A-Z(\[^_e]|$)/.exec(s);
    if (m && m[0].length < n) { sp.coef = m[1]; i = m[0].length; }
    else if (m && m[0].length === n) { sp.coef = ''; sp.parts.push({ type: 'num', text: s }); return sp; }
    var res = Chem.parseParts(s, i, '');
    sp.parts = res.parts;
    i = res.i;
    /* hydrate / adduct */
    while (i < n && (s.charAt(i) === '.' || s.charAt(i) === '*' || s.charAt(i) === '\u00B7')) {
        i++;
        var rest = Chem.parseSpecies(s.substring(i));
        sp.hydrates.push(rest);
        i = n;
    }
    if (sp.parts.length && sp.parts[sp.parts.length - 1].type === 'state') { sp.state = sp.parts.pop().text; }
    if (i < n) { throw ChemError('Cannot read "' + s.substring(i) + '" in "' + s + '"'); }
    return sp;
};
/* Parse a sequence of parts until a closing bracket. */
Chem.parseParts = function (s, i, closer) {
    var parts = [], n = s.length, c, m, last, sym, inner, pre = null, chg, cnt;
    while (i < n) {
        c = s.charAt(i);
        if (closer && c === closer) { return { parts: parts, i: i }; }
        if (c === '.' || c === '*' || c === '\u00B7') { break; }
        /* state at the end */
        m = /^\((s|l|g|aq|cr|sln|ppt)\)/.exec(s.substring(i));
        if (m && (i + m[0].length === n || /^[.*\u00B7]/.test(s.charAt(i + m[0].length)))) {
            parts.push({ type: 'state', text: m[1] }); i += m[0].length; continue;
        }
        if (/[A-Z]/.test(c)) {
            sym = c;
            if (/[a-z]/.test(s.charAt(i + 1)) && Elements.get(c + s.charAt(i + 1))) { sym = c + s.charAt(i + 1); }
            else if (/[a-z]/.test(s.charAt(i + 1)) && !Elements.get(c) && /[a-z]/.test(s.charAt(i + 1))) { sym = c + s.charAt(i + 1); }
            i += sym.length;
            last = { type: 'el', sym: sym, count: '', valid: !!Elements.get(sym), pre: pre };
            pre = null;
            parts.push(last);
        } else if (c === '(' || c === '[' || (c === '{' && closer !== '}')) {
            var close = c === '(' ? ')' : c === '[' ? ']' : '}';
            inner = Chem.parseParts(s, i + 1, close);
            if (s.charAt(inner.i) !== close) { throw ChemError('Missing "' + close + '" in "' + s + '"'); }
            i = inner.i + 1;
            last = { type: 'group', open: c, close: close, parts: inner.parts, count: '' };
            parts.push(last);
        } else if (/[0-9]/.test(c)) {
            m = /^[0-9]+/.exec(s.substring(i));
            /* digits followed by a final + or - at the end form a charge: Ca2+ */
            if (/^[0-9]+[+\-]$/.test(s.substring(i).replace(/\((s|l|g|aq)\)$/, '')) &&
                parts.length === 1 && parts[0].type === 'el' && !parts[0].count) {
                chg = /^[0-9]+[+\-]/.exec(s.substring(i))[0];
                Chem.setCharge(parts, chg);
                i += chg.length;
                continue;
            }
            if (!parts.length) { parts.push({ type: 'num', text: m[0] }); i += m[0].length; continue; }
            last = parts[parts.length - 1];
            if (last.type === 'el' || last.type === 'group') { last.count = (last.count || '') + m[0]; }
            else { parts.push({ type: 'num', text: m[0] }); }
            i += m[0].length;
        } else if (c === '^' || c === '_') {
            /* charge / oxidation state, or isotope prescript before an element */
            i++;
            if (s.charAt(i) === '{') {
                var end = s.indexOf('}', i);
                if (end < 0) { throw ChemError('Missing "}" in "' + s + '"'); }
                chg = s.substring(i + 1, end);
                i = end + 1;
            } else {
                m = /^([0-9]*[+\-]|[0-9]+|[IVX]+|[+\-][0-9]*)/.exec(s.substring(i));
                if (!m) { throw ChemError('Missing value after "' + c + '" in "' + s + '"'); }
                chg = m[0];
                i += chg.length;
            }
            if (/[A-Z]/.test(s.charAt(i)) && (!parts.length || pre)) {
                pre = pre || {};
                pre[c === '^' ? 'sup' : 'sub'] = chg;
            } else if (c === '^') {
                Chem.setCharge(parts, chg);
            } else {
                if (parts.length) { parts[parts.length - 1].count = chg; }
            }
        } else if ((c === '+' || c === '-') && (i + 1 === n || /^\((s|l|g|aq|cr|sln|ppt)\)$/.test(s.substring(i + 1)) || /^[.*]/.test(s.charAt(i + 1)))) {
            Chem.setCharge(parts, c);
            i++;
        } else if (c === '-' || c === '=' || c === '#') {
            parts.push({ type: 'bond', text: c === '-' ? '\u2212' : c === '=' ? '=' : '\u2261' });
            i++;
        } else if (/[a-z]/.test(c)) {
            parts.push({ type: 'particle', text: c, count: '' });
            i++;
        } else if (c === '$') {
            var e2 = s.indexOf('$', i + 1);
            parts.push({ type: 'math', text: s.substring(i + 1, e2) });
            i = e2 + 1;
        } else {
            parts.push({ type: 'other', text: c });
            i++;
        }
    }
    return { parts: parts, i: i };
};
Chem.setCharge = function (parts, chg) {
    var last = parts.length ? parts[parts.length - 1] : null;
    if (!last) { parts.push({ type: 'particle', text: '', charge: chg }); return; }
    last.charge = chg;
};
/* Numeric charge: "2+" -> 2, "-" -> -1, "3-" -> -3, roman numerals -> 0 (oxidation state) */
Chem.chargeValue = function (chg) {
    var m;
    if (!chg) { return 0; }
    chg = String(chg).replace(/\u2212/g, '-');
    m = /^([0-9]*)([+\-])$/.exec(chg);
    if (m) { return (m[2] === '-' ? -1 : 1) * (m[1] ? parseInt(m[1], 10) : 1); }
    m = /^([+\-])([0-9]+)$/.exec(chg);
    if (m) { return (m[1] === '-' ? -1 : 1) * parseInt(m[2], 10); }
    m = /^([+\-]+)$/.exec(chg);
    if (m) { return (chg.charAt(0) === '-' ? -1 : 1) * chg.length; }
    return 0; /* oxidation states (roman numerals) carry no ionic charge */
};

/* ---- Rendering species to AST nodes --------------------------------------- */
Chem.chargeRow = function (chg) {
    var m = /^([0-9]*)([+\-])$/.exec(chg), items = [];
    if (m) {
        if (m[1]) { items.push(AST.number(m[1])); }
        items.push(AST.operator(m[2] === '-' ? '\u2212' : '+', 'ord'));
        return AST.row(items);
    }
    return Parser.parseRow(chg);
};
Chem.partNodes = function (p) {
    var base, nodes = [], sc, i, inner;
    switch (p.type) {
    case 'el': base = AST.variable(p.sym); break;
    case 'particle': base = p.text ? AST.variable(p.text) : null; break;
    case 'group':
        inner = [];
        for (i = 0; i < p.parts.length; i++) { inner = inner.concat(Chem.partNodes(p.parts[i])); }
        base = AST.fenced(p.open === '{' ? '{' : p.open, p.close, AST.row(inner), false);
        break;
    case 'num': return [AST.number(p.text)];
    case 'bond': return [AST.symbol(p.text, 'ord')];
    case 'state': return [AST.text('(' + p.text + ')')];
    case 'math': return Parser.parseRow(p.text).items;
    default: return [AST.symbol(p.text, 'ord')];
    }
    if (!base && !p.charge) { return []; }
    if (p.count || p.charge || p.pre) {
        sc = AST.scripts(base ? AST.row([base]) : AST.row(), null, null);
        if (p.count) { sc.sub = Parser.parseRow(p.count); }
        if (p.charge) { sc.sup = Chem.chargeRow(p.charge); }
        if (p.pre) {
            if (p.pre.sup) { sc.presup = Parser.parseRow(p.pre.sup); }
            if (p.pre.sub) { sc.presub = Parser.parseRow(p.pre.sub); }
        }
        nodes.push(sc);
    } else { nodes.push(base); }
    return nodes;
};
Chem.speciesNodes = function (sp) {
    var nodes = [], i, m;
    if (sp.coef) {
        m = /^([0-9]+)\/([0-9]+)$/.exec(sp.coef);
        if (m) { nodes.push(AST.frac(AST.row([AST.number(m[1])]), AST.row([AST.number(m[2])]), 'tfrac')); }
        else { nodes.push(AST.number(sp.coef)); }
        nodes.push(AST.space(2 / 18));
    }
    for (i = 0; i < sp.parts.length; i++) { nodes = nodes.concat(Chem.partNodes(sp.parts[i])); }
    for (i = 0; i < sp.hydrates.length; i++) {
        nodes.push(AST.operator('\u00B7', 'bin'));
        nodes = nodes.concat(Chem.speciesNodes(sp.hydrates[i]));
    }
    if (sp.state) { nodes.push(AST.text('(' + sp.state + ')')); }
    return nodes;
};
/* Reaction condition label: chemical formula when valid, otherwise text/math. */
Chem.labelRow = function (txt) {
    var t = U.trim(txt), sp, ok = true, i;
    if (!t) { return null; }
    if (t.charAt(0) === '$' && t.charAt(t.length - 1) === '$') { return Parser.parseRow(t.substring(1, t.length - 1)); }
    if (/\\/.test(t)) { return Parser.parseRow(t); }
    try {
        var toks = Chem.tokenize(t, false), items = [];
        for (i = 0; i < toks.length; i++) {
            if (toks[i].t !== 'species') { ok = false; break; }
            sp = Chem.parseSpecies(toks[i].v);
            AST.walk(AST.row(Chem.speciesNodes(sp)), function () {});
            U.each(sp.parts, function (p) { if (p.type === 'particle' || (p.type === 'el' && !p.valid)) { ok = false; } });
            if (!ok) { break; }
            if (items.length) { items.push(AST.text(' ')); }
            items = items.concat(Chem.speciesNodes(sp));
        }
        if (ok) { return AST.row(items); }
    } catch (e) { /* fall back to text */ }
    return AST.row([AST.text(t)]);
};
Chem.parseCe = function (src, basePos) {
    var toks, items = [], i, t, x;
    try {
        toks = Chem.tokenize(src, false);
        for (i = 0; i < toks.length; i++) {
            t = toks[i];
            if (t.t === 'plus') { items.push(AST.operator('+', 'bin')); }
            else if (t.t === 'arrow') { x = AST.xarrow(t.v, t.above !== null ? Chem.labelRow(t.above) : null, t.below !== null ? Chem.labelRow(t.below) : null); items.push(x); }
            else if (t.t === 'state') { items.push(AST.text('(' + t.v + ')')); }
            else if (t.t === 'gas') { items.push(AST.operator('\u2191', 'ord')); }
            else if (t.t === 'ppt') { items.push(AST.operator('\u2193', 'ord')); }
            else if (t.t === 'math') { items = items.concat(Parser.parseRow(t.v).items); }
            else { items = items.concat(Chem.speciesNodes(Chem.parseSpecies(t.v))); }
        }
    } catch (e) {
        throw new MathError(ErrorKind.PARSER, 'Chemical formula: ' + (e.message || e), '', typeof basePos === 'number' ? basePos : -1);
    }
    return AST.chem(src, AST.row(items));
};

/* ---- Counting --------------------------------------------------------------- */
Chem.countParts = function (parts, mult, acc, unknown) {
    var i, p, k;
    for (i = 0; i < parts.length; i++) {
        p = parts[i];
        k = (p.count && /^[0-9]+$/.test(p.count)) ? parseInt(p.count, 10) : 1;
        if (p.type === 'el') {
            if (!p.valid) { unknown.push(p.sym); }
            acc[p.sym] = (acc[p.sym] || 0) + k * mult;
        } else if (p.type === 'group') {
            Chem.countParts(p.parts, k * mult, acc, unknown);
        } else if (p.type === 'particle' && p.text === 'e') {
            /* electrons: counted only through charge */
        }
    }
};
Chem.speciesCharge = function (sp) {
    var q = 0;
    function scan(parts) { U.each(parts, function (p) { if (p.charge) { q += Chem.chargeValue(p.charge); } if (p.type === 'group') { scan(p.parts); } }); }
    scan(sp.parts);
    U.each(sp.hydrates, function (h) { q += Chem.speciesCharge(h); });
    return q;
};
Chem.countSpecies = function (sp) {
    var acc = {}, unknown = [], i, h, k, hc, mult;
    Chem.countParts(sp.parts, 1, acc, unknown);
    for (i = 0; i < sp.hydrates.length; i++) {
        h = sp.hydrates[i];
        mult = h.coef ? parseFloat(h.coef) : 1;
        hc = {};
        Chem.countParts(h.parts, 1, hc, unknown);
        for (k in hc) { if (U.has(hc, k)) { acc[k] = (acc[k] || 0) + hc[k] * mult; } }
    }
    return { atoms: acc, charge: Chem.speciesCharge(sp), unknown: unknown };
};
Chem.count = function (formula) {
    var t = U.trim(String(formula).replace(/^\\ce\{([\s\S]*)\}$/, '$1')), sp, r;
    if (!t) { throw ChemError('Enter a chemical formula.'); }
    sp = Chem.parseSpecies(t);
    r = Chem.countSpecies(sp);
    if (r.unknown.length) { throw ChemError('Unknown element symbol(s): ' + r.unknown.join(', ')); }
    return r;
};

/* ---- Exact rational arithmetic --------------------------------------------- */
Chem.gcd = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; };
Chem.lcm = function (a, b) { return Math.abs(a * b) / Chem.gcd(a, b); };
Chem.Q = function (n, d) {
    var g;
    d = (d === undefined) ? 1 : d;
    if (d < 0) { n = -n; d = -d; }
    g = Chem.gcd(n, d);
    return [n / g, d / g];
};
Chem.qsub = function (a, b) { return Chem.Q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]); };
Chem.qmul = function (a, b) { return Chem.Q(a[0] * b[0], a[1] * b[1]); };
Chem.qdiv = function (a, b) { return Chem.Q(a[0] * b[1], a[1] * b[0]); };

/* Null space of an integer matrix (rows x cols) via exact RREF. */
Chem.nullSpace = function (M, cols) {
    var A = [], r, c, i, lead = 0, rows = M.length, piv = [], tmp, f, basis = [], free, vec, k;
    for (r = 0; r < rows; r++) { A.push(U.map(M[r], function (v) { return Chem.Q(v, 1); })); }
    for (r = 0; r < rows && lead < cols; r++) {
        i = r;
        while (A[i][lead][0] === 0) {
            i++;
            if (i === rows) { i = r; lead++; if (lead === cols) { break; } }
        }
        if (lead === cols) { break; }
        tmp = A[i]; A[i] = A[r]; A[r] = tmp;
        f = A[r][lead];
        for (c = 0; c < cols; c++) { A[r][c] = Chem.qdiv(A[r][c], f); }
        for (i = 0; i < rows; i++) {
            if (i !== r && A[i][lead][0] !== 0) {
                f = A[i][lead];
                for (c = 0; c < cols; c++) { A[i][c] = Chem.qsub(A[i][c], Chem.qmul(f, A[r][c])); }
            }
        }
        piv.push(lead);
        lead++;
    }
    for (free = 0; free < cols; free++) {
        if (U.contains(piv, free)) { continue; }
        vec = [];
        for (c = 0; c < cols; c++) { vec.push(Chem.Q(c === free ? 1 : 0, 1)); }
        for (k = 0; k < piv.length; k++) { vec[piv[k]] = Chem.Q(-A[k][free][0], A[k][free][1]); }
        basis.push(vec);
    }
    return basis;
};

/* Balance a reaction such as "Fe + O2 -> Fe2O3". */
Chem.balance = function (equation) {
    var src = U.trim(String(equation).replace(/^\\ce\{([\s\S]*)\}$/, '$1')), toks, sides = [[], []], side = 0, arrow = null, i, t,
        species = [], elements = [], counts = [], M = [], r, c, e, ns, vec, den, coefs, g, hasCharge = false, sign, check, ok;
    if (!src) { throw ChemError('Enter a reaction, for example: H2 + O2 -> H2O'); }
    toks = Chem.tokenize(src, true);
    for (i = 0; i < toks.length; i++) {
        t = toks[i];
        if (t.t === 'arrow') {
            if (arrow) { throw ChemError('A reaction must contain exactly one arrow.'); }
            arrow = t; side = 1; continue;
        }
        if (t.t === 'plus' || t.t === 'state' || t.t === 'gas' || t.t === 'ppt') { continue; }
        if (t.t === 'math') { throw ChemError('Math fragments cannot be balanced.'); }
        sides[side].push(t.v);
    }
    if (!arrow) { throw ChemError('The reaction needs an arrow (->, <=> or =) between reactants and products.'); }
    if (!sides[0].length || !sides[1].length) { throw ChemError('Both sides of the reaction need at least one species.'); }
    for (side = 0; side < 2; side++) {
        for (i = 0; i < sides[side].length; i++) {
            var sp = Chem.parseSpecies(sides[side][i]);
            var name = sides[side][i].replace(/^([0-9]+\/[0-9]+|[0-9]+(\.[0-9]+)?)(?=[A-Z(\[])/, '').replace(/\((s|l|g|aq|cr|sln|ppt)\)$/, '');
            var state = (/\((s|l|g|aq|cr|sln|ppt)\)$/.exec(sides[side][i]) || [''])[0];
            sp.coef = '';
            var cnt = Chem.countSpecies(sp);
            if (cnt.unknown.length) { throw ChemError('Unknown element symbol(s): ' + cnt.unknown.join(', ')); }
            if (!U.keys(cnt.atoms).length && !cnt.charge) { throw ChemError('"' + sides[side][i] + '" contains no elements.'); }
            if (cnt.charge) { hasCharge = true; }
            species.push({ side: side, text: name, state: state, counts: cnt });
            for (e in cnt.atoms) { if (U.has(cnt.atoms, e) && !U.contains(elements, e)) { elements.push(e); } }
        }
    }
    for (r = 0; r < elements.length; r++) {
        M.push([]);
        for (c = 0; c < species.length; c++) {
            sign = species[c].side === 0 ? 1 : -1;
            M[r].push(sign * (species[c].counts.atoms[elements[r]] || 0));
        }
    }
    if (hasCharge) {
        M.push(U.map(species, function (s) { return (s.side === 0 ? 1 : -1) * s.counts.charge; }));
    }
    ns = Chem.nullSpace(M, species.length);
    if (ns.length === 0) { throw ChemError('This reaction cannot be balanced: no combination of coefficients conserves every element' + (hasCharge ? ' and the total charge' : '') + '.'); }
    if (ns.length > 1) { throw ChemError('This reaction can be balanced in more than one independent way (it combines ' + ns.length + ' separate reactions). Split it into separate equations.'); }
    vec = ns[0];
    den = 1;
    for (i = 0; i < vec.length; i++) { den = Chem.lcm(den, vec[i][1]); }
    coefs = U.map(vec, function (q) { return q[0] * (den / q[1]); });
    g = 0;
    for (i = 0; i < coefs.length; i++) { g = Chem.gcd(g, coefs[i]); }
    coefs = U.map(coefs, function (x) { return x / g; });
    if (coefs[0] < 0) { coefs = U.map(coefs, function (x) { return -x; }); }
    for (i = 0; i < coefs.length; i++) {
        if (coefs[i] <= 0) { throw ChemError('"' + species[i].text + '" would need a zero or negative coefficient; check which side it belongs on.'); }
    }
    /* Independent verification of the result */
    check = {};
    ok = true;
    for (r = 0; r < elements.length; r++) {
        var left = 0, right = 0;
        for (c = 0; c < species.length; c++) {
            var amount = coefs[c] * (species[c].counts.atoms[elements[r]] || 0);
            if (species[c].side === 0) { left += amount; } else { right += amount; }
        }
        check[elements[r]] = [left, right];
        if (left !== right) { ok = false; }
    }
    var qL = 0, qR = 0;
    for (c = 0; c < species.length; c++) { if (species[c].side === 0) { qL += coefs[c] * species[c].counts.charge; } else { qR += coefs[c] * species[c].counts.charge; } }
    if (qL !== qR) { ok = false; }
    if (!ok) { throw ChemError('Internal verification failed; the reaction was not balanced.'); }
    var arrowText = { right: '->', left: '<-', equilibrium: '<=>', leftright: '<->', rightleftarrows: '<-->' }[arrow.v] || '->';
    if (arrow.above !== null && arrow.above !== undefined) { arrowText += '[' + arrow.above + ']'; if (arrow.below !== null && arrow.below !== undefined) { arrowText += '[' + arrow.below + ']'; } }
    var parts = [[], []];
    for (c = 0; c < species.length; c++) { parts[species[c].side].push((coefs[c] === 1 ? '' : coefs[c]) + species[c].text + species[c].state); }
    var text = parts[0].join(' + ') + ' ' + arrowText + ' ' + parts[1].join(' + ');
    return { ok: true, coefficients: coefs, species: U.map(species, function (s) { return s.text; }), elements: elements,
        check: check, charge: [qL, qR], text: text, latex: '\\ce{' + text + '}' };
};

/* ---- Molar mass ------------------------------------------------------------- */
Chem.molarMass = function (formula) {
    var r = Chem.count(formula), total = 0, k, el, parts = [], warn = [];
    for (k in r.atoms) {
        if (!U.has(r.atoms, k)) { continue; }
        el = Elements.get(k);
        total += el.mass * r.atoms[k];
        parts.push(k + ': ' + r.atoms[k] + ' \u00D7 ' + el.mass + ' = ' + U.round(el.mass * r.atoms[k], 4));
        if (el.massIsIsotope) { warn.push(k + ' has no standard atomic weight; the mass number of its longest-lived isotope (' + el.mass + ') was used.'); }
    }
    return { mass: U.round(total, 4), breakdown: parts, warnings: warn, atoms: r.atoms, charge: r.charge };
};
