/* ==========================================================================
 * Module 22 - Mathematical syntax parser (recursive descent)
 *
 * Grammar (informal):
 *   top      := cells ( ('&' | '\\') cells )*
 *   row      := item*
 *   item     := primary scripts*
 *   scripts  := ('^' arg) | ('_' arg) | "'"+
 *   primary  := group | number | letter | char | command | fence
 *   group    := '{' row '}'
 *   fence    := opener row closer | '\left' delim row '\right' delim
 *
 * Binding: scripts bind tighter than juxtaposition; repeated scripts nest
 * to the right (x^a^b == x^{a^{b}}). Operator precedence/associativity of
 * the resulting rows is analysed by Semantics (module 24).
 * ========================================================================== */
function Parser(src, opts) {
    this.src = String(src);
    this.opts = U.extend({ smartOps: true, smartFuncs: true, autoFence: true }, opts || {});
    this.toks = Lexer.tokenize(this.src);
    this.i = 0;
    this.warnings = [];
    this.failedFence = {};
    this.pendingTag = null;
    this.pendingNoTag = false;
    this.depth = 0;
}
Parser.MAX_DEPTH = 150;

Parser.MAX_INPUT = 100000;
Parser.parse = function (src, opts) {
    var p;
    src = (src === null || src === undefined) ? '' : String(src);
    if (src.length > Parser.MAX_INPUT) {
        throw new MathError(ErrorKind.PARSER, 'The input is too long (' + src.length + ' characters; the limit is ' + Parser.MAX_INPUT + ').', '', Parser.MAX_INPUT);
    }
    p = new Parser(src, opts);
    var root = p.parseTop();
    return { root: root, warnings: p.warnings };
};
/* Parse a fragment and return a row (used by the builder). */
Parser.parseRow = function (src, opts) { return Parser.parse(src, opts).root; };
Parser.tryParse = function (src, opts) {
    try { var r = Parser.parse(src, opts); return { ok: true, root: r.root, warnings: r.warnings }; }
    catch (e) { return { ok: false, error: Errors.wrap(e, ErrorKind.PARSER) }; }
};
/* Convert a character offset into {line, col} (1-based). */
Parser.location = function (src, pos) {
    var line = 1, col = 1, i;
    for (i = 0; i < pos && i < src.length; i++) {
        if (src.charAt(i) === '\n') { line++; col = 1; } else { col++; }
    }
    return { line: line, col: col };
};

Parser.prototype.peek = function (k) { return this.toks[Math.min(this.i + (k || 0), this.toks.length - 1)]; };
Parser.prototype.next = function () { var t = this.toks[this.i]; if (this.i < this.toks.length - 1) { this.i++; } return t; };
Parser.prototype.error = function (msg, tok) {
    throw new MathError(ErrorKind.PARSER, msg, '', tok ? tok.pos : this.peek().pos);
};
Parser.prototype.warn = function (msg, tok) {
    var loc = Parser.location(this.src, tok ? tok.pos : 0);
    this.warnings.push('Line ' + loc.line + ', column ' + loc.col + ': ' + msg);
};
Parser.prototype.expect = function (t, what, openTok) {
    var tok = this.peek();
    if (tok.t !== t) {
        if (openTok) { this.error('Missing ' + what + ' (opened at character ' + (openTok.pos + 1) + ')', tok); }
        this.error('Expected ' + what, tok);
    }
    return this.next();
};
Parser.prototype.enter = function (tok) {
    if (++this.depth > Parser.MAX_DEPTH) { this.error('Expression is nested too deeply', tok); }
};
Parser.prototype.leave = function () { this.depth--; };

/* ---- Top level ------------------------------------------------------------ */
Parser.prototype.parseTop = function () {
    var rows = [], cells = [], tok, row, sawAmp = false, line;
    this.pendingTag = null;
    this.pendingNoTag = false;
    while (true) {
        row = this.parseRow({ amp: true, nl: true });
        cells.push(row);
        tok = this.peek();
        if (tok.t === '&') { this.next(); sawAmp = true; continue; }
        if (tok.t === 'nl') {
            this.next();
            rows.push(this.finishLine(cells));
            cells = [];
            continue;
        }
        if (tok.t === 'eof') { break; }
        if (tok.t === '}') { this.error('Unmatched closing brace "}"', tok); }
        if (tok.t === 'cmd' && tok.v === 'right') { this.error('\\right without a matching \\left', tok); }
        if (tok.t === 'cmd' && (tok.v === 'end' || tok.v === 'end*')) { this.error('\\end{' + tok.raw + '} without a matching \\begin', tok); }
        if (tok.t === 'char' && tok.v === ']') { this.error('Unexpected "]"', tok); }
        this.error('Unexpected input', tok);
    }
    line = this.finishLine(cells);
    if (!rows.length && cells.length === 1 && !line.tag) { return cells[0]; }
    /* drop a trailing empty line produced by a final \\ */
    if (rows.length && cells.length === 1 && !cells[0].items.length && !line.tag) {
        /* nothing */
    } else {
        rows.push(line);
    }
    var lines = AST.lines('implicit', rows);
    lines.aligned = sawAmp;
    return AST.row([lines]);
};
Parser.prototype.finishLine = function (cells) {
    var lr = AST.lineRow(cells, null);
    if (this.pendingTag) { lr.tag = this.pendingTag; }
    if (this.pendingNoTag) { lr.notag = true; }
    this.pendingTag = null;
    this.pendingNoTag = false;
    return lr;
};

/* ---- Rows ----------------------------------------------------------------- */
/* stop: {amp, nl, bracket, closer, right, end} */
Parser.prototype.parseRow = function (stop) {
    var items = [], tok, node, rest, color;
    stop = stop || {};
    while (true) {
        tok = this.peek();
        if (tok.t === 'eof' || tok.t === '}') { break; }
        if (tok.t === '&') { if (stop.amp) { break; } this.error('Alignment character "&" is only allowed inside a matrix or aligned environment', tok); }
        if (tok.t === 'nl') { if (stop.nl) { break; } this.error('Line break "\\\\" is only allowed at the top level or inside an environment', tok); }
        if (tok.t === 'char' && tok.v === ']' && stop.bracket) { break; }
        if (stop.closer && this.isCloser(tok, stop.closer)) { break; }
        if (tok.t === 'cmd') {
            if (tok.v === 'right') { break; }
            if (tok.v === 'end' || tok.v === 'end*') { break; }
            if (tok.v === 'middle') { this.next(); items.push(this.parseMiddle(tok)); continue; }
            if (tok.v === 'limits' || tok.v === 'nolimits') {
                this.next();
                node = items.length ? items[items.length - 1] : null;
                if (node && node.type === 'bigop') { node.limits = tok.v; }
                else if (node && node.type === 'func') { node.limits = (tok.v === 'limits'); }
                else { this.warn('\\' + tok.v + ' ignored: it must follow a large operator', tok); }
                continue;
            }
            if (tok.v === 'color' && this.peek(1).t !== '{') {
                /* \color{c} acts as a switch for the rest of the current group */
                this.next();
                color = U.normalizeColor(tok.raw);
                if (!color) { this.error('Unknown color "' + tok.raw + '"', tok); }
                rest = this.parseRow(stop);
                if (rest.items.length) { items.push(Parser.applyStyle(rest, { color: color })); }
                break;
            }
        }
        node = this.parseItem(stop);
        if (node) { items.push(node); }
    }
    return AST.row(items);
};

Parser.prototype.parseItem = function (stop) {
    var tok = this.peek(), base, node;
    this.enter(tok);
    if (tok.t === '^' || tok.t === '_') { base = AST.row([]); }
    else {
        base = this.parsePrimary(stop);
        if (base === null) { this.leave(); return null; }
    }
    node = this.parseScripts(base);
    this.leave();
    return node;
};

/* Attach ^ _ and primes to a base node. */
Parser.prototype.parseScripts = function (base) {
    var tok, arg, primes, pn, sc = null, supFromCaret = false;
    function scriptsNode() {
        if (sc) { return sc; }
        if (base.type === 'scripts' && base.fromPrescript && !base.sup && !base.sub) { sc = base; return sc; }
        sc = AST.scripts(base.type === 'row' ? base : AST.row([base]));
        return sc;
    }
    while (true) {
        tok = this.peek();
        if (tok.t === 'char' && tok.v === "'") {
            primes = 0;
            while (this.peek().t === 'char' && this.peek().v === "'") { this.next(); primes++; }
            pn = primes === 1 ? '\u2032' : primes === 2 ? '\u2033' : primes === 3 ? '\u2034' : U.repeat('\u2032', primes);
            scriptsNode();
            if (!sc.sup) { sc.sup = AST.row([]); }
            sc.sup.items.unshift(AST.symbol(pn, 'ord'));
            continue;
        }
        if (tok.t !== '^' && tok.t !== '_') { break; }
        this.next();
        arg = this.parseScriptArg(tok);
        /* Limits attach directly to large operators and limit-style functions */
        if (base.type === 'bigop' && !sc) {
            if (tok.t === '_') { base.lower = base.lower ? this.nestScript(base.lower, arg, '_') : arg; }
            else { base.upper = base.upper ? this.nestScript(base.upper, arg, '^') : arg; }
            continue;
        }
        if (base.type === 'func' && base.limits && tok.t === '_' && !sc && !base.lower) { base.lower = arg; continue; }
        if (base.type === 'accent' && !sc && !base.label &&
            ((base.accent === 'overbrace' && tok.t === '^') || (base.accent === 'underbrace' && tok.t === '_'))) {
            base.label = arg;
            continue;
        }
        scriptsNode();
        if (tok.t === '^') {
            if (!sc.sup) { sc.sup = arg; }
            else if (!supFromCaret) { sc.sup.items = sc.sup.items.concat(arg.items); }
            else { sc.sup = this.nestScript(sc.sup, arg, '^'); }
            supFromCaret = true;
        } else {
            sc.sub = sc.sub ? this.nestScript(sc.sub, arg, '_') : arg;
        }
    }
    if (base.fromPrescript) { delete base.fromPrescript; }
    return sc || base;
};
/* Right-associative nesting: x^a^b -> x^{a^{b}} */
Parser.prototype.nestScript = function (existing, arg, which) {
    var items = existing.items, lastItem, inner;
    if (items.length === 1 && items[0].type === 'scripts' && !(which === '^' ? items[0].sup : items[0].sub)) {
        if (which === '^') { items[0].sup = arg; } else { items[0].sub = arg; }
        return existing;
    }
    if (items.length === 1 && items[0].type === 'scripts') {
        inner = items[0];
        if (which === '^') { inner.sup = this.nestScript(inner.sup, arg, which); } else { inner.sub = this.nestScript(inner.sub, arg, which); }
        return existing;
    }
    lastItem = AST.scripts(AST.row(items), which === '^' ? arg : null, which === '_' ? arg : null);
    return AST.row([lastItem]);
};

/* Script argument: a braced group, or exactly one primary (whole numbers). */
Parser.prototype.parseScriptArg = function (opTok) {
    var tok = this.peek(), p;
    if (tok.t === 'eof' || tok.t === '}' || tok.t === '&' || tok.t === 'nl') { this.error('Missing script after "' + opTok.v + '"', tok); }
    if (tok.t === '{') { return this.parseGroup(); }
    if (tok.t === '^' || tok.t === '_') { this.error('Missing script after "' + opTok.v + '"', tok); }
    p = this.parsePrimary({ single: true });
    if (p === null) { this.error('Missing script after "' + opTok.v + '"', tok); }
    return p.type === 'row' ? p : AST.row([p]);
};

/* Command argument: braced group or exactly one token (TeX: \frac12 = 1/2). */
Parser.prototype.parseArg = function (cmdTok, what) {
    var tok = this.peek(), p, first;
    if (tok.t === '{') { return this.parseGroup(); }
    if (tok.t === 'eof' || tok.t === '}' || tok.t === '&' || tok.t === 'nl' || tok.t === '^' || tok.t === '_') {
        this.error('Missing ' + (what || 'argument') + ' for \\' + cmdTok.v, tok);
    }
    if (tok.t === 'num' && tok.v.length > 1) {
        first = tok.v.charAt(0);
        tok.v = tok.v.substring(1);
        tok.pos++;
        return AST.row([AST.number(first)]);
    }
    p = this.parsePrimary({ single: true });
    if (p === null) { this.error('Missing ' + (what || 'argument') + ' for \\' + cmdTok.v, tok); }
    return p.type === 'row' ? p : AST.row([p]);
};
Parser.prototype.parseGroup = function () {
    var open = this.expect('{', '"{"'), row;
    this.enter(open);
    row = this.parseRow({});
    if (this.peek().t !== '}') {
        var t = this.peek();
        if (t.t === 'cmd' && t.v === 'right') { this.error('\\right without a matching \\left inside a group', t); }
        if (t.t === 'cmd' && (t.v === 'end' || t.v === 'end*')) { this.error('Missing closing "}" before \\end', t); }
        this.error('Missing closing brace "}" (opened at character ' + (open.pos + 1) + ')', t);
    }
    this.next();
    this.leave();
    return row;
};
Parser.prototype.parseOptional = function () {
    var tok = this.peek(), row;
    if (!(tok.t === 'char' && tok.v === '[')) { return null; }
    this.next();
    row = this.parseRow({ bracket: true });
    if (!(this.peek().t === 'char' && this.peek().v === ']')) { this.error('Missing closing "]" (opened at character ' + (tok.pos + 1) + ')', this.peek()); }
    this.next();
    return row;
};

/* ---- Delimiter helpers ------------------------------------------------------ */
Parser.prototype.tokenChar = function (tok) {
    if (tok.t === 'char') { return tok.v; }
    if (tok.t === 'cmd') {
        if (U.has(MathData.ESCAPES, tok.v)) { return MathData.ESCAPES[tok.v][0]; }
        if (U.has(MathData.CMD, tok.v)) { return MathData.CMD[tok.v][0]; }
    }
    return null;
};
Parser.prototype.isCloser = function (tok, closer) {
    var ch = this.tokenChar(tok);
    if (ch === null || ch !== closer) { return false; }
    if (tok.t === 'cmd' && tok.v === '{') { return false; }
    return true;
};
Parser.prototype.tryFence = function (tok, openCh) {
    var closeCh = MathData.AUTO_PAIRS[openCh], save = this.i, body, key = String(tok.pos);
    if (!this.opts.autoFence || !closeCh || this.failedFence[key]) { return null; }
    this.next();
    try {
        body = this.parseRow({ closer: closeCh });
    } catch (e) {
        this.i = save;
        this.failedFence[key] = true;
        return null;
    }
    if (this.isCloser(this.peek(), closeCh)) {
        this.next();
        return AST.fenced(openCh, closeCh, body, false);
    }
    this.i = save;
    this.failedFence[key] = true;
    return null;
};
Parser.prototype.parseDelim = function (cmdTok) {
    var tok = this.next(), key;
    if (tok.t === 'char') { key = tok.v; }
    else if (tok.t === 'cmd') { key = '\\' + tok.v; }
    else { this.error('Missing delimiter after \\' + cmdTok.v, tok); }
    if (!U.has(MathData.DELIMS, key)) { this.error('"' + key + '" is not a valid delimiter after \\' + cmdTok.v, tok); }
    return MathData.DELIMS[key];
};
Parser.prototype.parseMiddle = function (tok) {
    var d = this.parseDelim(tok);
    var n = AST.delim(d, 0, 'rel');
    n.middle = true;
    return n;
};

/* ---- Primaries -------------------------------------------------------------- */
Parser.prototype.parsePrimary = function (stop) {
    var tok = this.peek(), ch, cls, node, k, run, j, t2, m, f;
    stop = stop || {};
    if (tok.t === '{') { return this.parseGroup(); }
    if (tok.t === 'num') { this.next(); return AST.number(tok.v); }
    if (tok.t === 'cmd') { return this.parseCommand(tok, stop); }
    if (tok.t !== 'char') { this.error('Unexpected input', tok); }
    ch = tok.v;
    /* Letters */
    if (MathData.isLatinLetter(ch)) {
        if (this.opts.smartFuncs && !stop.single) {
            run = ch; j = 1;
            if (!Parser.MAX_FUNC_LEN) { for (k = 0; k < MathData.BARE_FUNCS.length; k++) { Parser.MAX_FUNC_LEN = Math.max(Parser.MAX_FUNC_LEN || 0, MathData.BARE_FUNCS[k].length); } }
            /* only scan as far as the longest function name (+1 to detect longer words): keeps parsing linear */
            while (j <= Parser.MAX_FUNC_LEN) {
                t2 = this.peek(j);
                if (t2.t === 'char' && !t2.sp && MathData.isLatinLetter(t2.v)) { run += t2.v; j++; } else { break; }
            }
            if (run.length > 1 && U.contains(MathData.BARE_FUNCS, run)) {
                for (k = 0; k < j; k++) { this.next(); }
                f = MathData.FUNCS[run];
                node = AST.func(run, f ? f[0] : run, f ? f[1] : false);
                return node;
            }
        }
        this.next();
        return AST.variable(ch);
    }
    /* Smart multi-character operators (->, <=, !=, ...) */
    if (this.opts.smartOps) {
        for (k = 0; k < MathData.SMART_OPS.length; k++) {
            m = MathData.SMART_OPS[k];
            if (this.matchChars(m[0])) {
                for (j = 0; j < m[0].length; j++) { this.next(); }
                return AST.operator(m[1], m[2]);
            }
        }
    }
    /* Auto-fenced brackets */
    if (U.has(MathData.AUTO_PAIRS, ch) && !stop.single) {
        node = this.tryFence(tok, ch);
        if (node) { return node; }
    }
    this.next();
    if (ch === "'") { return AST.symbol('\u2032', 'ord'); }
    if (ch === '%') { return AST.symbol('%', 'ord'); }
    if (ch === '#' || ch === '$') { return AST.symbol(ch, 'ord'); }
    if (U.has(MathData.ASCII_OPS, ch)) {
        m = MathData.ASCII_OPS[ch];
        return (m[1] === 'ord') ? AST.symbol(m[0], 'ord') : AST.operator(m[0], m[1]);
    }
    if (MathData.isGreek(ch)) { return AST.variable(ch); }
    if (MathData.INTEGRAL_CHARS.indexOf(ch) >= 0 || ch === '\u2211' || ch === '\u220F' || ch === '\u2210' ||
        ch === '\u22C3' || ch === '\u22C2' || ch === '\u2A01' || ch === '\u2A02') {
        return AST.bigop(MathData.CHAR_TO_CMD[ch] || 'sum', ch, 'auto');
    }
    cls = U.has(MathData.CHAR_CLASS, ch) ? MathData.CHAR_CLASS[ch] : 'ord';
    if (cls === 'ord') { return AST.symbol(ch, 'ord'); }
    return AST.operator(ch, cls);
};
Parser.prototype.matchChars = function (seq) {
    var j, t, prevEnd = -1;
    for (j = 0; j < seq.length; j++) {
        t = this.peek(j);
        if (t.t !== 'char' || t.v !== seq.charAt(j)) { return false; }
        if (j > 0 && t.pos !== prevEnd) { return false; }
        prevEnd = t.end;
    }
    return true;
};

Parser.prototype.parseCommand = function (tok, stop) {
    var name = tok.v, node, a, b, idx, d1, d2, body, e, m, sz, color, n, varName, order;
    /* spacing */
    if (U.has(MathData.SPACES, name)) { this.next(); return AST.space(MathData.SPACES[name]); }
    if (U.has(MathData.ESCAPES, name)) {
        e = MathData.ESCAPES[name];
        if (name === '{' && !stop.single) { node = this.tryFence(tok, '{'); if (node) { return node; } }
        this.next();
        return e[1] === 'ord' ? AST.symbol(e[0], 'ord') : AST.operator(e[0], e[1]);
    }
    switch (name) {
    case 'frac': case 'dfrac': case 'tfrac': case 'cfrac':
        this.next();
        a = this.parseArg(tok, 'numerator');
        b = this.parseArg(tok, 'denominator');
        return AST.frac(a, b, name);
    case 'binom': case 'dbinom': case 'tbinom': case 'choose':
        this.next();
        a = this.parseArg(tok, 'top');
        b = this.parseArg(tok, 'bottom');
        return AST.binom(a, b, name === 'choose' ? 'binom' : name);
    case 'sqrt':
        this.next();
        idx = this.parseOptional();
        body = this.parseArg(tok, 'radicand');
        return AST.root(body, idx);
    case 'left':
        this.next();
        d1 = this.parseDelim(tok);
        this.enter(tok);
        body = this.parseRow({});
        this.leave();
        if (!(this.peek().t === 'cmd' && this.peek().v === 'right')) { this.error('Missing \\right to close \\left (opened at character ' + (tok.pos + 1) + ')', this.peek()); }
        var rt = this.next();
        d2 = this.parseDelim(rt);
        return AST.fenced(d1, d2, body, true);
    case 'right':
        this.error('\\right without a matching \\left', tok);
        break;
    case 'big': case 'Big': case 'bigg': case 'Bigg': case 'bigl': case 'Bigl': case 'biggl': case 'Biggl':
    case 'bigr': case 'Bigr': case 'biggr': case 'Biggr': case 'bigm': case 'Bigm': case 'biggm': case 'Biggm':
        this.next();
        d1 = this.parseDelim(tok);
        sz = /^bigg/i.test(name) ? (name.charAt(0) === 'B' ? 3.0 : 2.4) : (name.charAt(0) === 'B' ? 1.8 : 1.2);
        m = name.charAt(name.length - 1);
        n = AST.delim(d1, sz, m === 'l' ? 'open' : m === 'r' ? 'close' : m === 'm' ? 'rel' : (U.has(MathData.AUTO_PAIRS, d1) ? 'open' : (U.has(MathData.CHAR_CLASS, d1) && MathData.CHAR_CLASS[d1] === 'close') || d1 === ')' || d1 === ']' ? 'close' : 'ord'));
        n.cmd = name;
        return n;
    case 'operatorname': case 'operatorname*':
        this.next();
        node = AST.func(tok.raw, tok.raw, name === 'operatorname*');
        node.custom = true;
        return node;
    case 'ce': case 'pu':
        this.next();
        return Chem.parseCe(tok.raw, tok.rawPos);
    case 'color':
        this.next();
        color = U.normalizeColor(tok.raw);
        if (!color) { this.error('Unknown color "' + tok.raw + '"', tok); }
        body = this.parseArg(tok, 'colored content');
        return Parser.applyStyle(body, { color: color });
    case 'textcolor':
        this.next();
        color = U.normalizeColor(tok.raw);
        if (!color) { this.error('Unknown color "' + tok.raw + '"', tok); }
        body = this.parseArg(tok, 'colored content');
        return Parser.applyStyle(body, { color: color });
    case 'style':
        this.next();
        body = this.parseArg(tok, 'styled content');
        return Parser.applyStyle(body, Parser.parseStyleSpec(tok.raw, tok));
    case 'begin': case 'begin*':
        this.next();
        return this.parseEnvironment(tok);
    case 'end': case 'end*':
        this.error('\\end{' + tok.raw + '} without a matching \\begin', tok);
        break;
    case 'tag':
        this.next();
        this.pendingTag = Parser.parseRow(tok.raw, this.opts);
        return null;
    case 'notag': case 'nonumber':
        this.next();
        this.pendingNoTag = true;
        return null;
    case 'label':
        this.next();
        this.warn('\\label{' + tok.raw + '} has no effect in Illustrator and was ignored', tok);
        return null;
    case 'displaystyle': case 'textstyle': case 'scriptstyle': case 'scriptscriptstyle': case 'mathstrut': case 'strut':
    case 'nolinebreak': case 'allowbreak': case 'hline': case 'cr':
        this.next();
        this.warn('\\' + name + ' is not needed here and was ignored (use \\dfrac / \\tfrac to control fraction size)', tok);
        return null;
    case 'not':
        this.next();
        a = this.peek();
        e = this.tokenChar(a);
        if (e !== null) {
            this.next();
            if (U.has(MathData.NEGATIONS, e)) { return AST.operator(MathData.NEGATIONS[e], 'rel'); }
            return AST.operator(e + '\u0338', 'rel');
        }
        return AST.operator('/', 'rel');
    case 'dv': case 'pdv': case 'odv': case 'diff':
        this.next();
        return this.parseDerivative(tok);
    case 'abs': case 'norm': case 'floor': case 'ceil': case 'set': case 'bra': case 'ket': case 'braket':
    case 'paren': case 'brack': case 'angle_': case 'expval':
        this.next();
        a = this.parseArg(tok, 'content');
        if (name === 'abs') { return AST.fenced('|', '|', a, true); }
        if (name === 'norm') { return AST.fenced('\u2016', '\u2016', a, true); }
        if (name === 'floor') { return AST.fenced('\u230A', '\u230B', a, true); }
        if (name === 'ceil') { return AST.fenced('\u2308', '\u2309', a, true); }
        if (name === 'set') { return AST.fenced('{', '}', a, true); }
        if (name === 'bra') { return AST.fenced('\u27E8', '|', a, true); }
        if (name === 'ket') { return AST.fenced('|', '\u27E9', a, true); }
        if (name === 'expval') { return AST.fenced('\u27E8', '\u27E9', a, true); }
        if (name === 'paren') { return AST.fenced('(', ')', a, true); }
        if (name === 'brack') { return AST.fenced('[', ']', a, true); }
        b = this.parseArg(tok, 'second content');
        return AST.fenced('\u27E8', '\u27E9', AST.row(a.items.concat([AST.symbol('|', 'ord')], b.items)), true);
    case 'pmod':
        this.next();
        a = this.parseArg(tok, 'modulus');
        return AST.row([AST.space(1), AST.fenced('(', ')', AST.row([AST.func('mod', 'mod', false)].concat(a.items)), false)]);
    case 'sci':
        this.next();
        a = this.parseArg(tok, 'mantissa');
        b = this.parseArg(tok, 'exponent');
        n = AST.row(a.items.concat([AST.operator('\u00D7', 'bin'), AST.scripts(AST.row([AST.number('10')]), b, null)]));
        n.meta = { role: 'scientific' };
        return n;
    case 'hspace': case 'hspace*':
        this.next();
        m = /^\s*(-?[0-9]*\.?[0-9]+)\s*(em|ex|mu|pt|mm)\s*$/.exec(tok.raw);
        if (!m) { this.error('Invalid \\hspace size "' + tok.raw + '" (use em, ex, mu, pt or mm)', tok); }
        a = parseFloat(m[1]);
        return AST.space(m[2] === 'em' ? a : m[2] === 'ex' ? a * 0.45 : m[2] === 'mu' ? a / 18 : m[2] === 'pt' ? a / 10 : a / 3.5);
    case 'prescript':
        this.next();
        a = this.parseArg(tok, 'left superscript');
        b = this.parseArg(tok, 'left subscript');
        body = this.parseArg(tok, 'base');
        n = AST.scripts(body, null, null);
        n.presup = a.items.length ? a : null;
        n.presub = b.items.length ? b : null;
        n.fromPrescript = true;
        return n;
    case 'overset': case 'underset': case 'stackrel':
        this.next();
        a = this.parseArg(tok, 'annotation');
        b = this.parseArg(tok, 'base');
        if (name === 'underset') {
            if (b.items.length === 1 && b.items[0].type === 'stack' && b.items[0].over && !b.items[0].under) {
                b.items[0].under = a;
                return b.items[0];
            }
            return AST.stack(b, null, a);
        }
        return AST.stack(b, a, null);
    case 'boxed': case 'fbox':
        this.next();
        return AST.boxed(this.parseArg(tok, 'content'));
    case 'phantom': case 'hphantom': case 'vphantom':
        this.next();
        n = AST.font('phantom', this.parseArg(tok, 'content'));
        return n;
    case 'mathop':
        this.next();
        a = this.parseArg(tok, 'operator');
        node = AST.func(Serializer.plainText(a), Serializer.plainText(a), true);
        node.custom = true;
        return node;
    }
    /* large operators */
    if (U.has(MathData.BIGOPS, name)) { this.next(); return AST.bigop(name, MathData.BIGOPS[name][0], 'auto'); }
    /* functions */
    if (U.has(MathData.FUNCS, name)) {
        this.next();
        m = MathData.FUNCS[name];
        return AST.func(name, m[0], m[1]);
    }
    /* font variants */
    if (U.has(MathData.FONTS, name)) {
        this.next();
        return AST.font(MathData.FONTS[name], this.parseArg(tok, 'content'));
    }
    /* text */
    if (U.has(MathData.TEXT_CMDS, name)) {
        this.next();
        return AST.text(Parser.unescapeText(tok.raw), name === 'textbf' ? 'bf' : name === 'textit' ? 'it' : 'text');
    }
    /* accents */
    if (U.has(MathData.ACCENTS, name)) {
        this.next();
        return AST.accent(MathData.ACCENTS[name], this.parseArg(tok, 'content'));
    }
    /* extensible arrows */
    if (U.has(Parser.XARROWS, name)) {
        this.next();
        b = this.parseOptional();
        a = this.parseArg(tok, 'label');
        return AST.xarrow(Parser.XARROWS[name], a.items.length ? a : null, (b && b.items.length) ? b : null);
    }
    /* plain symbols */
    if (U.has(MathData.CMD, name)) {
        e = MathData.CMD[name];
        if ((e[1] === 'open') && !stop.single) {
            node = this.tryFence(tok, e[0]);
            if (node) { return node; }
        }
        this.next();
        if (MathData.isGreek(e[0]) && e[1] === 'ord' && name !== 'ohm' && name !== 'increment') { return AST.variable(e[0]); }
        if (e[1] === 'ord') { return AST.symbol(e[0], 'ord'); }
        return AST.operator(e[0], e[1]);
    }
    this.error('Unknown command \\' + name, tok);
};

Parser.XARROWS = {
    xrightarrow: 'right', xleftarrow: 'left', xleftrightarrow: 'leftright', xrightleftharpoons: 'equilibrium',
    xleftrightharpoons: 'equilibriumrev', xRightarrow: 'Right', xLeftarrow: 'Left', xLeftrightarrow: 'Leftright',
    xmapsto: 'mapsto', xrightleftarrows: 'rightleftarrows', xlongequal: 'equal', xlongrightarrow: 'right',
    xlongleftarrow: 'left'
};
Parser.XARROW_COMMAND = {};
(function () { for (var k in Parser.XARROWS) { if (U.has(Parser.XARROWS, k) && !U.has(Parser.XARROW_COMMAND, Parser.XARROWS[k])) { Parser.XARROW_COMMAND[Parser.XARROWS[k]] = k; } } }());

/* \dv[n]{f}{x}, \dv{x}, \pdv{f}{x}, \pdv{f}{x}{y}, \pdv[n]{f}{x} */
Parser.prototype.parseDerivative = function (tok) {
    var partial = (tok.v === 'pdv'), orderRow = this.parseOptional(), a, b, c = null, dSym, num, den, order, fr;
    a = this.parseArg(tok, 'function or variable');
    if (this.peek().t === '{') { b = this.parseGroup(); }
    if (b && partial && this.peek().t === '{') { c = this.parseGroup(); }
    function d() { return partial ? AST.symbol('\u2202', 'ord') : AST.font('rm', AST.row([AST.variable('d')])); }
    function pow(node, o) { return o ? AST.scripts(AST.row([node]), AST.clone(o), null) : node; }
    order = (orderRow && orderRow.items.length) ? orderRow : null;
    if (!b) {
        /* operator form: d/dx */
        num = AST.row([pow(d(), order)]);
        den = AST.row([d()].concat(order ? [AST.scripts(a, AST.clone(order), null)] : a.items));
    } else if (c) {
        num = AST.row([AST.scripts(AST.row([d()]), AST.row([AST.number('2')]), null)].concat(a.items));
        den = AST.row([d()].concat(b.items, [AST.space(3 / 18), d()], c.items));
    } else {
        num = AST.row([pow(d(), order)].concat(a.items));
        den = AST.row([d()].concat(order ? [AST.scripts(b, AST.clone(order), null)] : b.items));
    }
    fr = AST.frac(num, den, 'frac');
    fr.meta = { role: 'derivative' };
    return fr;
};

/* Environments: matrices, cases, aligned / multiline */
Parser.prototype.parseEnvironment = function (tok) {
    var env = tok.raw, rows = [], cells = [], t, isLines = U.has(MathData.LINE_ENVS, env), lines, i, maxc, node, colspec, cell;
    if (!U.has(MathData.MATRIX_ENVS, env) && !isLines) { this.error('Unknown environment "' + env + '"', tok); }
    var savedTag = this.pendingTag, savedNoTag = this.pendingNoTag;
    this.pendingTag = null;
    this.pendingNoTag = false;
    this.enter(tok);
    while (true) {
        cell = this.parseRow({ amp: true, nl: true });
        cells.push(cell);
        t = this.peek();
        if (t.t === '&') { this.next(); continue; }
        if (t.t === 'nl') {
            this.next();
            rows.push(isLines ? this.finishLine(cells) : cells);
            cells = [];
            continue;
        }
        if (t.t === 'cmd' && (t.v === 'end' || t.v === 'end*')) {
            if (t.raw !== env) { this.error('\\begin{' + env + '} is closed by \\end{' + t.raw + '}', t); }
            this.next();
            break;
        }
        if (t.t === 'eof') { this.error('Missing \\end{' + env + '} (environment opened at character ' + (tok.pos + 1) + ')', t); }
        if (t.t === '}') { this.error('Unexpected "}" inside environment ' + env, t); }
        this.error('Unexpected input inside environment ' + env, t);
    }
    this.leave();
    /* last row (ignore a trailing empty row created by a final \\) */
    if (!(cells.length === 1 && !cells[0].items.length && rows.length && !this.pendingTag)) {
        rows.push(isLines ? this.finishLine(cells) : cells);
    }
    this.pendingTag = savedTag;
    this.pendingNoTag = savedNoTag;
    if (isLines) {
        lines = AST.lines(env, rows);
        return lines;
    }
    maxc = 1;
    for (i = 0; i < rows.length; i++) { if (rows[i].length > maxc) { maxc = rows[i].length; } }
    for (i = 0; i < rows.length; i++) { while (rows[i].length < maxc) { rows[i].push(AST.row([])); } }
    colspec = '';
    if (env === 'array' || env === 'subarray') {
        colspec = String(tok.raw2 || '').replace(/\s+/g, '');
        if (!/^[lcr|]*$/.test(colspec)) { this.error('Unsupported array column specification "' + colspec + '" (use l, c, r and |)', tok); }
    }
    node = AST.matrix(env === 'dcases' ? 'cases' : env, rows, colspec);
    return node;
};

/* Apply a style to a parsed body: single item -> style the item itself. */
Parser.applyStyle = function (body, style) {
    var target = (body.items.length === 1) ? body.items[0] : body;
    target.style = U.extend(target.style || {}, style);
    return target;
};
/* \style{color=#FF0000;bold;italic=false;font=Arial;scale=1.2;dy=0.1} */
Parser.parseStyleSpec = function (spec, tok) {
    var parts = String(spec).split(';'), st = {}, i, kv, k, v, c;
    for (i = 0; i < parts.length; i++) {
        kv = U.trim(parts[i]);
        if (!kv) { continue; }
        k = U.lower(U.trim(kv.split('=')[0]));
        v = kv.indexOf('=') >= 0 ? U.trim(kv.substring(kv.indexOf('=') + 1)) : 'true';
        if (k === 'color') {
            c = U.normalizeColor(v);
            if (!c) { throw new MathError(ErrorKind.PARSER, 'Invalid color "' + v + '" in \\style', '', tok.pos); }
            st.color = c;
        } else if (k === 'bold' || k === 'italic') {
            st[k] = (v !== 'false' && v !== '0' && v !== 'no');
        } else if (k === 'font') {
            st.font = v;
        } else if (k === 'scale' || k === 'dy') {
            c = parseFloat(v);
            if (!U.isNumber(c) || (k === 'scale' && (c <= 0 || c > 10)) || (k === 'dy' && Math.abs(c) > 10)) {
                throw new MathError(ErrorKind.PARSER, 'Invalid ' + k + ' value "' + v + '" in \\style', '', tok.pos);
            }
            st[k] = c;
        } else {
            throw new MathError(ErrorKind.PARSER, 'Unknown style property "' + k + '" (use color, bold, italic, font, scale, dy)', '', tok.pos);
        }
    }
    return st;
};
Parser.unescapeText = function (t) {
    return String(t).replace(/\\([{}#$%&_ ])/g, '$1').replace(/\\textbackslash(\{\})?/g, '\\').replace(/~/g, '\u00A0');
};
