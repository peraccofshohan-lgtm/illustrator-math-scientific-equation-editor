/* ==========================================================================
 * Module 23 - Serialization
 *   Serializer.toLatex(root)      canonical direct-input syntax (round-trips)
 *   Serializer.plainText(node)    linear Unicode text (display / search)
 *   Serializer.toSingleText(root) runs for a single Illustrator text object,
 *                                 or {ok:false, reason} when not representable
 * ========================================================================== */
var Serializer = {};

Serializer.ACCENT_COMMAND = {};
(function () {
    var k;
    for (k in MathData.ACCENTS) {
        if (U.has(MathData.ACCENTS, k) && !U.has(Serializer.ACCENT_COMMAND, MathData.ACCENTS[k])) {
            Serializer.ACCENT_COMMAND[MathData.ACCENTS[k]] = k;
        }
    }
    Serializer.ACCENT_COMMAND.arc = 'overarc';
}());
Serializer.TEXT_ESCAPE = function (t) {
    return String(t).replace(/\\/g, '\\textbackslash{}').replace(/([{}#$%&_])/g, '\\$1');
};
Serializer.charLatex = function (ch) {
    if (ch === '{') { return '\\{'; }
    if (ch === '}') { return '\\}'; }
    if (ch === '#' || ch === '$' || ch === '%' || ch === '&' || ch === '_') { return '\\' + ch; }
    if (ch === '\\') { return '\\backslash'; }
    if (ch === '\u2212') { return '-'; }
    if (ch === '\u2217') { return '*'; }
    if (ch === '\u2016') { return '\\Vert'; }
    if (ch === '~') { return '\\sim'; }
    if (ch === '^') { return '\\hat{}'; }
    if (ch === "'") { return '\\prime'; }
    if (ch === '\u2032') { return '\\prime'; }
    if (U.has(MathData.CHAR_TO_CMD, ch)) { return '\\' + MathData.CHAR_TO_CMD[ch]; }
    return ch;
};
Serializer.CMD_BY_CHAR_CLASS = {};
(function () {
    var k, e;
    for (k in MathData.CMD) {
        if (U.has(MathData.CMD, k)) {
            e = MathData.CMD[k];
            if (!U.has(Serializer.CMD_BY_CHAR_CLASS, e[0] + '|' + e[1])) { Serializer.CMD_BY_CHAR_CLASS[e[0] + '|' + e[1]] = k; }
        }
    }
}());
/* Command for a character with a given atom class, so that re-parsing restores the class. */
Serializer.ASCII_BY_CHAR_CLASS = {};
(function () {
    var k;
    for (k in MathData.ASCII_OPS) {
        if (U.has(MathData.ASCII_OPS, k) && k !== '"') { Serializer.ASCII_BY_CHAR_CLASS[MathData.ASCII_OPS[k][0] + '|' + MathData.ASCII_OPS[k][1]] = k; }
    }
}());
Serializer.symbolLatex = function (ch, cls) {
    var pref = MathData.CHAR_TO_CMD[ch], key = ch + '|' + cls;
    if (U.has(Serializer.ASCII_BY_CHAR_CLASS, key)) { return Serializer.ASCII_BY_CHAR_CLASS[key]; }
    if (pref && MathData.CMD[pref] && MathData.CMD[pref][1] === cls) { return '\\' + pref; }
    if (U.has(Serializer.CMD_BY_CHAR_CLASS, key) && !U.has(MathData.ASCII_OPS, ch)) { return '\\' + Serializer.CMD_BY_CHAR_CLASS[key]; }
    return Serializer.charLatex(ch);
};
Serializer.delimLatex = function (d) {
    return U.has(MathData.DELIM_TO_LATEX, d) ? MathData.DELIM_TO_LATEX[d] : Serializer.charLatex(d);
};
Serializer.styleSpec = function (st) {
    var parts = [];
    if (st.color) { parts.push('color=' + st.color); }
    if (st.bold !== undefined && st.bold !== null) { parts.push(st.bold ? 'bold' : 'bold=false'); }
    if (st.italic !== undefined && st.italic !== null) { parts.push(st.italic ? 'italic' : 'italic=false'); }
    if (st.font) { parts.push('font=' + String(st.font).replace(/[;{}]/g, '')); }
    if (U.isNumber(st.scale) && st.scale !== 1) { parts.push('scale=' + U.round(st.scale, 4)); }
    if (U.isNumber(st.dy) && st.dy !== 0) { parts.push('dy=' + U.round(st.dy, 4)); }
    return parts.join(';');
};
Serializer.hasStyle = function (n) {
    var s = n.style;
    return !!(s && (s.color || (s.bold !== undefined && s.bold !== null) || (s.italic !== undefined && s.italic !== null) ||
        s.font || (U.isNumber(s.scale) && s.scale !== 1) || (U.isNumber(s.dy) && s.dy !== 0)));
};

Serializer.toLatex = function (root) {
    if (!root) { return ''; }
    if (root.type === 'row') {
        if (root.items.length === 1 && root.items[0].type === 'lines' && root.items[0].env === 'implicit' && !Serializer.hasStyle(root)) {
            return Serializer.linesBody(root.items[0], true);
        }
        return Serializer.wrapStyle(root, Serializer.rowContent(root));
    }
    return Serializer.node(root);
};
Serializer.wrapStyle = function (n, inner) {
    var s;
    if (!Serializer.hasStyle(n)) { return inner; }
    s = n.style;
    if (s.color && U.keys(s).length === 1) { return '\\color{' + s.color + '}{' + inner + '}'; }
    return '\\style{' + Serializer.styleSpec(s) + '}{' + inner + '}';
};
Serializer.group = function (row) {
    if (!row) { return '{}'; }
    if (Serializer.hasStyle(row)) { return '{' + Serializer.wrapStyle(row, Serializer.rowContent(row)) + '}'; }
    return '{' + Serializer.rowContent(row) + '}';
};

/* Concatenate two LaTeX fragments, inserting a space only when needed so that
   re-lexing yields the same tokens (e.g. "\\langle" + "E"). */
Serializer.join = function (a, b) {
    if (a === '' || b === '') { return a + b; }
    if (/\\[A-Za-z]+\*?$/.test(a) && /^[A-Za-z]/.test(b)) { return a + ' ' + b; }
    if (/\\$/.test(a) && !/\\\\$/.test(a)) { return a + ' ' + b; }
    return a + b;
};
/* Join row pieces, inserting spaces only where re-lexing would change meaning. */
Serializer.rowContent = function (row) {
    var pieces = [], i, out = '', p, prev, needSpace, breaks = {};
    for (i = 0; i < row.items.length; i++) { pieces.push(Serializer.node(row.items[i])); }
    Serializer.markFunctionBreaks(pieces, breaks);
    for (i = 0; i < pieces.length; i++) {
        p = pieces[i];
        if (p === '') { continue; }
        needSpace = false;
        if (out !== '') {
            prev = out;
            if (/\\[A-Za-z]+\*?$/.test(prev) && /^[A-Za-z]/.test(p)) { needSpace = true; }
            else if (/[0-9.]$/.test(prev) && /^[0-9.]/.test(p)) { needSpace = true; }
            else if (/[<>\-+=!~.]$/.test(prev) && /^[<>\-+=!~.]/.test(p)) { needSpace = true; }
            else if (/\\$/.test(prev)) { needSpace = true; }
            else if (breaks[i]) { needSpace = true; }
        }
        out += (needSpace ? ' ' : '') + p;
    }
    return out;
};
/* Runs of bare letters that would be re-read as a function name (s i n -> sin)
   are split with a space. Only suffixes matter because the parser scans a run
   from each letter to the end of the run. */
Serializer.markFunctionBreaks = function (pieces, breaks) {
    var i = 0, runStart, j, letters, offs, k, sfx, end;
    function endsBare(p) { return /[A-Za-z]$/.test(p) && !/\\[A-Za-z]+\*?$/.test(p); }
    function lead(p) { var m = /^[A-Za-z]+/.exec(p); return m ? m[0] : ''; }
    while (i < pieces.length) {
        if (!endsBare(pieces[i])) { i++; continue; }
        runStart = i;
        j = i;
        while (j + 1 < pieces.length && endsBare(pieces[j]) && lead(pieces[j + 1]) && lead(pieces[j + 1]) === pieces[j + 1]) { j++; }
        if (j + 1 < pieces.length && endsBare(pieces[j]) && lead(pieces[j + 1])) { j++; }
        if (j === runStart) { i++; continue; }
        /* letters and piece offsets of this run */
        letters = '';
        offs = [];
        for (k = runStart; k <= j; k++) {
            offs.push(letters.length);
            if (k === runStart) { letters += /[A-Za-z]+$/.exec(pieces[k])[0]; offs[0] = 0; }
            else { letters += lead(pieces[k]); }
        }
        end = letters.length;
        for (k = j; k > runStart; k--) {
            /* check every suffix starting at piece k's first letter, up to the current end */
            sfx = letters.substring(offs[k - runStart], end);
            if (sfx.length > 1 && U.contains(MathData.BARE_FUNCS, sfx)) { breaks[k] = true; end = offs[k - runStart]; }
            else if (k - 1 >= runStart) {
                var startPrev = (k - 1 === runStart) ? 0 : offs[k - 1 - runStart];
                var s2 = letters.substring(startPrev, end);
                if (s2.length > 1 && U.contains(MathData.BARE_FUNCS, s2)) { breaks[k] = true; end = offs[k - runStart]; }
            }
        }
        i = j + 1;
    }
};

Serializer.canBeBareBase = function (n) {
    if (Serializer.hasStyle(n)) { return true; }
    switch (n.type) {
    case 'scripts': case 'bigop': case 'lines': case 'space': return false;
    case 'func': return !n.limits;
    case 'accent': return !(n.accent === 'overbrace' || n.accent === 'underbrace');
    case 'row': return false;
    case 'operator': case 'symbol': return !(n.text === '\u2032' || n.text === '\u2033' || n.text === '\u2034' || n.text === "'");
    default: return true;
    }
};
Serializer.primeCount = function (row) {
    var i, t, c = 0, j;
    for (i = 0; i < row.items.length; i++) {
        t = row.items[i];
        if (t.type !== 'symbol' || Serializer.hasStyle(t)) { break; }
        if (/^\u2032+$/.test(t.text)) { c += t.text.length; }
        else if (t.text === '\u2033') { c += 2; }
        else if (t.text === '\u2034') { c += 3; }
        else { break; }
    }
    j = i;
    return { count: c, items: j };
};
Serializer.supLatex = function (sup) {
    var pc = Serializer.primeCount(sup), rest;
    if (pc.items > 0 && pc.items === 1 && !Serializer.hasStyle(sup)) {
        if (sup.items.length === 1) { return U.repeat("'", pc.count); }
        rest = AST.row(sup.items.slice(1));
        return U.repeat("'", pc.count) + '^' + Serializer.group(rest);
    }
    return '^' + Serializer.group(sup);
};

Serializer.node = function (n) {
    return Serializer.wrapStyle(n, Serializer.nodeInner(n));
};
Serializer.nodeInner = function (n) {
    var s, i, r, c, rows, base, d, cmd, k;
    switch (n.type) {
    case 'row':
        return Serializer.group(AST.row(n.items));
    case 'number':
        return n.text;
    case 'variable':
        return Serializer.charLatex(n.text);
    case 'operator': case 'symbol':
        return Serializer.symbolLatex(n.text, n.cls);
    case 'func':
        if (n.custom || !U.has(MathData.FUNCS, n.name)) { s = '\\operatorname' + (n.limits ? '*' : '') + '{' + n.name + '}'; }
        else {
            s = '\\' + n.name;
            if (n.limits !== MathData.FUNCS[n.name][1]) { s += n.limits ? '\\limits' : '\\nolimits'; }
        }
        if (n.lower) { s += '_' + Serializer.group(n.lower); }
        return s;
    case 'text':
        cmd = n.variant === 'bf' ? 'textbf' : n.variant === 'it' ? 'textit' : 'text';
        return '\\' + cmd + '{' + Serializer.TEXT_ESCAPE(n.text) + '}';
    case 'space':
        for (k in MathData.SPACES) {
            if (U.has(MathData.SPACES, k) && Math.abs(MathData.SPACES[k] - n.width) < 1e-6 && k !== '>' && k !== 'thinspace' &&
                k !== 'medspace' && k !== 'thickspace' && k !== 'negthinspace') {
                return (k.length === 1) ? '\\' + k : '\\' + k + ' ';
            }
        }
        return '\\hspace{' + U.round(n.width, 4) + 'em}';
    case 'frac':
        return '\\' + (n.mode || 'frac') + Serializer.group(n.num) + Serializer.group(n.den);
    case 'binom':
        return '\\' + (n.mode || 'binom') + Serializer.group(n.top) + Serializer.group(n.bottom);
    case 'root':
        s = '\\sqrt';
        if (n.index) { s += '[' + (Serializer.rowContent(n.index).indexOf(']') >= 0 ? Serializer.group(n.index) : Serializer.wrapStyle(n.index, Serializer.rowContent(n.index))) + ']'; }
        return s + Serializer.group(n.body);
    case 'scripts':
        if (n.presup || n.presub) {
            base = '\\prescript' + Serializer.group(n.presup || AST.row()) + Serializer.group(n.presub || AST.row()) + Serializer.group(n.base);
        } else if (n.base.items.length === 1 && !Serializer.hasStyle(n.base) && Serializer.canBeBareBase(n.base.items[0])) {
            base = Serializer.node(n.base.items[0]);
        } else {
            base = Serializer.group(n.base);
        }
        s = base;
        if (n.sub) { s += '_' + Serializer.group(n.sub); }
        if (n.sup) { s += Serializer.supLatex(n.sup); }
        return s;
    case 'fenced':
        if (!n.explicit && MathData.AUTO_PAIRS[n.left] === n.right) {
            return Serializer.join(Serializer.join(Serializer.delimLatex(n.left), Serializer.rowContent(n.body)), Serializer.delimLatex(n.right));
        }
        return '\\left' + Serializer.delimLatex(n.left) + ' ' + Serializer.rowContent(n.body) + ' \\right' + Serializer.delimLatex(n.right);
    case 'matrix':
        rows = [];
        for (r = 0; r < n.rows.length; r++) {
            c = [];
            for (i = 0; i < n.rows[r].length; i++) { c.push(Serializer.wrapStyle(n.rows[r][i], Serializer.rowContent(n.rows[r][i]))); }
            rows.push(c.join(' & '));
        }
        return '\\begin{' + n.env + '}' + ((n.env === 'array' || n.env === 'subarray') ? '{' + (n.colspec || U.repeat('c', n.rows[0].length)) + '}' : '') +
            ' ' + rows.join(' \\\\ ') + ' \\end{' + n.env + '}';
    case 'bigop':
        s = '\\' + (U.has(MathData.BIGOPS, n.name) ? n.name : (MathData.CHAR_TO_CMD[n.symbol] || 'sum'));
        if (n.limits === 'limits') { s += '\\limits'; } else if (n.limits === 'nolimits') { s += '\\nolimits'; }
        if (n.lower) { s += '_' + Serializer.group(n.lower); }
        if (n.upper) { s += '^' + Serializer.group(n.upper); }
        return s;
    case 'accent':
        s = '\\' + (Serializer.ACCENT_COMMAND[n.accent] || n.accent) + Serializer.group(n.body);
        if (n.label) { s += (n.accent === 'underbrace' ? '_' : '^') + Serializer.group(n.label); }
        return s;
    case 'font':
        if (n.variant === 'phantom') { return '\\phantom' + Serializer.group(n.body); }
        return '\\' + (MathData.FONT_COMMAND[n.variant] || 'mathrm') + Serializer.group(n.body);
    case 'xarrow':
        s = '\\' + (Parser.XARROW_COMMAND[n.arrow] || 'xrightarrow');
        if (n.under) { s += '[' + Serializer.rowContent(n.under) + ']'; }
        return s + Serializer.group(n.over || AST.row());
    case 'stack':
        if (n.over && n.under) { return '\\underset' + Serializer.group(n.under) + '{\\overset' + Serializer.group(n.over) + Serializer.group(n.base) + '}'; }
        if (n.under) { return '\\underset' + Serializer.group(n.under) + Serializer.group(n.base); }
        return '\\overset' + Serializer.group(n.over || AST.row()) + Serializer.group(n.base);
    case 'boxed':
        return '\\boxed' + Serializer.group(n.body);
    case 'chem':
        return '\\ce{' + n.src + '}';
    case 'lines':
        return Serializer.linesBody(n, false);
    case 'delim':
        d = Serializer.delimLatex(n.text);
        if (n.middle) { return '\\middle' + d; }
        return '\\' + (n.cmd || 'big') + d;
    }
    return '';
};
Serializer.linesBody = function (n, implicit) {
    var rows = [], r, cells, i, row, s;
    for (r = 0; r < n.rows.length; r++) {
        row = n.rows[r];
        cells = [];
        for (i = 0; i < row.cells.length; i++) { cells.push(Serializer.wrapStyle(row.cells[i], Serializer.rowContent(row.cells[i]))); }
        s = cells.join(' & ');
        if (row.tag) { s += ' \\tag{' + Serializer.rowContent(row.tag) + '}'; }
        if (row.notag) { s += ' \\notag'; }
        rows.push(s);
    }
    if (implicit || n.env === 'implicit') { return rows.join(' \\\\ '); }
    return '\\begin{' + n.env + '} ' + rows.join(' \\\\ ') + ' \\end{' + n.env + '}';
};

/* ---- Linear Unicode text ------------------------------------------------- */
Serializer.SUP = { '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3', '4': '\u2074', '5': '\u2075', '6': '\u2076',
    '7': '\u2077', '8': '\u2078', '9': '\u2079', '+': '\u207A', '\u2212': '\u207B', '-': '\u207B', '=': '\u207C', '(': '\u207D',
    ')': '\u207E', 'n': '\u207F' };
Serializer.SUB = { '0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083', '4': '\u2084', '5': '\u2085', '6': '\u2086',
    '7': '\u2087', '8': '\u2088', '9': '\u2089', '+': '\u208A', '\u2212': '\u208B', '-': '\u208B', '=': '\u208C', '(': '\u208D',
    ')': '\u208E' };
Serializer.mapScript = function (text, map) {
    var cps = U.codePoints(text), out = '', i;
    for (i = 0; i < cps.length; i++) { if (!U.has(map, cps[i])) { return null; } out += map[cps[i]]; }
    return out;
};
Serializer.ACCENT_COMBINING = { vec: '\u20D7', hat: '\u0302', widehat: '\u0302', bar: '\u0304', overline: '\u0305',
    underline: '\u0332', dot: '\u0307', ddot: '\u0308', tilde: '\u0303', widetilde: '\u0303', check: '\u030C', breve: '\u0306',
    acute: '\u0301', grave: '\u0300', mathring: '\u030A', overrightarrow: '\u20D7', overleftarrow: '\u20D6', dddot: '\u20DB', arc: '\u0311' };
Serializer.XARROW_CHAR = { right: '\u2192', left: '\u2190', leftright: '\u2194', equilibrium: '\u21CC', equilibriumrev: '\u21CB',
    Right: '\u21D2', Left: '\u21D0', Leftright: '\u21D4', mapsto: '\u21A6', rightleftarrows: '\u21C4', equal: '=' };

Serializer.plainText = function (n) {
    var P = Serializer.plainText, s, i, r, rows, t, m;
    function wrap(row) {
        var x = P(row);
        return (row.items.length > 1) ? '(' + x + ')' : x;
    }
    if (!n) { return ''; }
    switch (n.type) {
    case 'row':
        s = '';
        for (i = 0; i < n.items.length; i++) { s += P(n.items[i]); }
        return s;
    case 'number': case 'variable': case 'symbol': return n.text;
    case 'operator':
        if (n.cls === 'bin' || n.cls === 'rel') { return ' ' + n.text + ' '; }
        if (n.cls === 'punct') { return n.text + ' '; }
        return n.text;
    case 'delim': return n.text;
    case 'func': return n.display + (n.lower ? '_' + wrap(n.lower) : '') + ' ';
    case 'text': return n.text;
    case 'space': return n.width >= 0.2 ? ' ' : '';
    case 'frac': return wrap(n.num) + '/' + wrap(n.den);
    case 'binom': return 'C(' + P(n.top) + ', ' + P(n.bottom) + ')';
    case 'root':
        t = n.index ? (Serializer.mapScript(P(n.index), Serializer.SUP) || ('(' + P(n.index) + ')')) : '';
        if (n.index && P(n.index) === '3') { return '\u221B' + wrap(n.body); }
        if (n.index && P(n.index) === '4') { return '\u221C' + wrap(n.body); }
        return t + '\u221A' + wrap(n.body);
    case 'scripts':
        s = (n.presup ? (Serializer.mapScript(P(n.presup), Serializer.SUP) || '^' + wrap(n.presup)) : '') +
            (n.presub ? (Serializer.mapScript(P(n.presub), Serializer.SUB) || '_' + wrap(n.presub)) : '');
        s += (n.base.items.length > 1 ? '(' + P(n.base) + ')' : P(n.base));
        if (n.sub) { t = P(n.sub); s += Serializer.mapScript(t, Serializer.SUB) || ('_' + wrap(n.sub)); }
        if (n.sup) { t = P(n.sup); s += (/^[\u2032\u2033\u2034]+$/.test(t) ? t : (Serializer.mapScript(t, Serializer.SUP) || ('^' + wrap(n.sup)))); }
        return s;
    case 'fenced': return n.left + P(n.body) + n.right;
    case 'matrix':
        rows = [];
        for (r = 0; r < n.rows.length; r++) { rows.push(U.map(n.rows[r], function (c) { return P(c); }).join(', ')); }
        m = MathData.MATRIX_ENVS[n.env] || ['', ''];
        return (m[0] || '[') + rows.join('; ') + (m[1] || (m[0] ? '' : ']'));
    case 'bigop':
        return n.symbol + (n.lower ? '_' + wrap(n.lower) : '') + (n.upper ? '^' + wrap(n.upper) : '') + ' ';
    case 'accent':
        s = P(n.body);
        return s + (Serializer.ACCENT_COMBINING[n.accent] || '') + (n.label ? '[' + P(n.label) + ']' : '');
    case 'font':
        if (n.variant === 'phantom') { return ''; }
        s = P(n.body);
        if (n.variant === 'bb' || n.variant === 'cal' || n.variant === 'frak') {
            t = '';
            U.each(U.codePoints(s), function (c) { t += MathData.mapVariantChar(n.variant, c); });
            return t;
        }
        return s;
    case 'xarrow': return ' ' + (Serializer.XARROW_CHAR[n.arrow] || '\u2192') + (n.over ? '[' + P(n.over) + ']' : '') + ' ';
    case 'stack': return P(n.base);
    case 'boxed': return '[' + P(n.body) + ']';
    case 'chem': return P(n.body);
    case 'lines':
        rows = [];
        for (r = 0; r < n.rows.length; r++) { rows.push(U.map(n.rows[r].cells, function (c) { return P(c); }).join('')); }
        return rows.join('; ');
    }
    return '';
};
Serializer.plain = function (root) { return U.trim(Serializer.plainText(root).replace(/\s+/g, ' ')); };

/* ---- Single text object representation ------------------------------------ */
/* Returns {ok, runs:[{text, kind:'italic'|'upright', style}], text} or {ok:false, reason}. */
Serializer.toSingleText = function (root) {
    var runs = [], reason = null;
    function add(text, kind, style) { runs.push({ text: text, kind: kind, style: style || null }); }
    function visit(n, style, upright) {
        var i, st = n.style ? U.extend(U.extend({}, style || {}), n.style) : style, t, mapped;
        if (reason) { return; }
        switch (n.type) {
        case 'row': for (i = 0; i < n.items.length; i++) { visit(n.items[i], st, upright); } return;
        case 'number': add(n.text, 'upright', st); return;
        case 'variable':
            add(n.text, (!upright && (MathData.isLatinLetter(n.text) || MathData.isGreekLower(n.text))) ? 'italic' : 'upright', st);
            return;
        case 'operator':
            if (n.cls === 'bin' || n.cls === 'rel') { add('\u2009' + n.text + '\u2009', 'upright', st); }
            else if (n.cls === 'punct') { add(n.text + '\u2009', 'upright', st); }
            else { add(n.text, 'upright', st); }
            return;
        case 'symbol': add(n.text, 'upright', st); return;
        case 'func':
            if (n.lower) { reason = 'Limits below a function (e.g. lim) need a structured layout.'; return; }
            add(n.display + '\u2009', 'upright', st); return;
        case 'text': add(n.text, 'upright', st); return;
        case 'space': if (n.width > 0) { add(n.width >= 0.9 ? '\u2003' : n.width >= 0.45 ? '\u2002' : '\u2009', 'upright', st); } return;
        case 'font':
            if (n.variant === 'bb' || n.variant === 'cal' || n.variant === 'frak') {
                t = '';
                U.each(U.codePoints(Serializer.plainText(n.body)), function (c) { t += MathData.mapVariantChar(n.variant, c); });
                add(t, 'upright', st);
                return;
            }
            if (n.variant === 'bf' || n.variant === 'bm') { visit(n.body, U.extend(U.extend({}, st || {}), { bold: true }), n.variant === 'bf'); return; }
            visit(n.body, st, n.variant === 'rm' || n.variant === 'unit');
            return;
        case 'scripts':
            if (n.presup || n.presub) { reason = 'Left scripts need a structured layout.'; return; }
            if (n.base.items.length !== 1 || !U.contains(['variable', 'number', 'symbol', 'fenced', 'font'], n.base.items[0].type)) {
                reason = 'This script base needs a structured layout.'; return;
            }
            visit(n.base, st, upright);
            if (n.sub) {
                mapped = Serializer.mapScript(Serializer.plainText(n.sub).replace(/\s/g, ''), Serializer.SUB);
                if (mapped === null) { reason = 'Subscript "' + Serializer.plain(n.sub) + '" has no Unicode subscript form.'; return; }
                add(mapped, 'upright', st);
            }
            if (n.sup) {
                t = Serializer.plainText(n.sup).replace(/\s/g, '');
                mapped = /^[\u2032\u2033\u2034]+$/.test(t) ? t : Serializer.mapScript(t, Serializer.SUP);
                if (mapped === null) { reason = 'Superscript "' + Serializer.plain(n.sup) + '" has no Unicode superscript form.'; return; }
                add(mapped, 'upright', st);
            }
            return;
        case 'fenced':
            add(n.left, 'upright', st); visit(n.body, st, upright); add(n.right, 'upright', st);
            if (!reason) {
                AST.walk(n.body, function (x) {
                    if (U.contains(['frac', 'root', 'matrix', 'bigop', 'binom', 'lines'], x.type)) { reason = 'Brackets around tall content need a structured layout.'; }
                });
            }
            return;
        case 'chem': visit(n.body, st, true); return;
        default:
            reason = (AST.TYPE_LABELS[n.type] || n.type) + ' structures cannot be represented as a single text object.';
        }
    }
    visit(root, null, false);
    if (reason) { return { ok: false, reason: reason }; }
    var text = '';
    U.each(runs, function (r) { text += r.text; });
    if (!U.trim(text)) { return { ok: false, reason: 'The expression is empty.' }; }
    return { ok: true, runs: runs, text: U.trim(text) };
};
