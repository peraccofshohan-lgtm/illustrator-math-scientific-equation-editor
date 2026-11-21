/* ==========================================================================
 * Module 31 - Layout engine
 *
 * Bottom-up box layout in the spirit of TeX: every node yields a box with
 * width / ascent / descent around a baseline. The final result is a flat
 * list of drawing primitives in points (x right, y UP, origin = baseline
 * start), plus hit regions for interactive selection:
 *   {k:'text', t, x, y, size, face:'math'|'text'|'sans'|'mono', bold, italic, color, id}
 *   {k:'rule', x, y, w, h, color, id, role}           (y = bottom edge)
 *   {k:'path', pts:[{a:[x,y], l:[x,y], r:[x,y]}], closed, stroke, fill, color, id, role}
 * The SAME result drives the ScriptUI preview and the Illustrator renderer,
 * so the preview is a faithful picture of what gets inserted.
 *
 * Glyph measurement is pluggable: Layout.ApproxMetrics (built-in tables,
 * used for the preview and tests) or the renderer's live Illustrator
 * measurement (exact advance widths of the fonts actually used).
 * ========================================================================== */
var Layout = {};
Layout.AXIS = 0.25;          /* math axis height (em) */
Layout.MU = 1 / 18;          /* math unit (em) */

/* ---- Approximate glyph metrics (em) ---------------------------------------- */
Layout.ApproxMetrics = { name: 'approximate' };
Layout._W = {};
(function () {
    var W = Layout._W, i, s;
    function set(chars, w) { for (var j = 0; j < chars.length; j++) { W[chars.charAt(j)] = w; } }
    set('0123456789', 0.5);
    set('abcdeghknopquvxyz', 0.5); set('ijl', 0.28); set('ft', 0.32); set('rs', 0.39); set('m', 0.75); set('w', 0.68);
    set('ABCDEGHKNOPQRSUVXYZ', 0.7); set('I', 0.36); set('J', 0.45); set('FLPT', 0.6); set('M', 0.86); set('W', 0.92);
    s = '';
    for (i = 0x03B1; i <= 0x03C9; i++) { s += String.fromCharCode(i); }
    set(s + '\u03D1\u03D5\u03D6\u03F1\u03F5', 0.53);
    s = '';
    for (i = 0x0391; i <= 0x03A9; i++) { s += String.fromCharCode(i); }
    set(s, 0.68);
    set('+\u2212=<>\u00D7\u00F7\u00B1\u2213\u2264\u2265\u2260\u2248\u2261\u223C\u2243\u2245\u221D\u2208\u2209\u220B\u2282\u2283\u2286\u2287\u222A\u2229\u2227\u2228\u2295\u2297\u2299\u2296\u22C5\u2218\u2217\u227A\u227B\u226A\u226B\u22A5\u2225\u2223\u00AC\u2200\u2203\u2204\u2205\u2207\u2202\u221E\u2234\u2235\u2216', 0.62);
    set('\u2192\u2190\u2194\u21D2\u21D0\u21D4\u21A6\u21CC\u21CB\u21C4\u27F6\u27F5\u27F7\u27F9\u27F8\u27FA\u2191\u2193\u2197\u2198\u21C0\u21BD\u21AA\u21A9', 0.95);
    set('()[]', 0.33); set('{}', 0.45); set('|\u2223', 0.22); set('\u2016', 0.4); set('\u27E8\u27E9\u2308\u2309\u230A\u230B', 0.38);
    set(',.;:!\'', 0.26); set('/\\', 0.42); set(' ', 0.25); set('\u2009', 0.17); set('\u2002', 0.5); set('\u2003', 1);
    set('\u2032', 0.28); set('\u2033', 0.45); set('\u2034', 0.6); set('\u00B7\u2026\u22EF\u22EE\u22F1', 0.3);
    W['\u2026'] = 0.9; W['\u22EF'] = 0.9; W['\u22EE'] = 0.3; W['\u22F1'] = 0.9;
    set('\u2211\u220F\u2210\u22C3\u22C2\u22C1\u22C0\u2A01\u2A02\u2A00\u2A04\u2A06', 0.8);
    set('\u222B\u222E\u2232\u2233', 0.45); set('\u222C\u222F', 0.75); set('\u222D\u2230', 1.0); set('\u2A0C', 1.25);
    set('\u210F\u0127\u2113', 0.52); set('\u212B\u00C5', 0.72); set('\u00B0', 0.4); set('%', 0.83); set('\u2030', 1.1);
}());
Layout._ASC = 'bdfhklt\u03B2\u03B4\u03B6\u03B8\u03BB\u03BE\u03D1\u2113';
Layout._DESC = 'gjpqyf\u03B2\u03B3\u03B6\u03B7\u03BC\u03BE\u03C1\u03C6\u03C7\u03C8\u03D5\u03C2';
Layout.charMetrics = function (ch, italic) {
    var w = U.has(Layout._W, ch) ? Layout._W[ch] : null, a = 0.7, d = 0, c = ch.charCodeAt(0);
    if (w === null) {
        if (c >= 0x2E80) { w = 1.0; }
        else if (c >= 0xD800 && c <= 0xDBFF) { w = 0.72; }      /* math alphanumerics (surrogate pairs) */
        else if (/[a-z]/.test(ch)) { w = 0.5; }
        else { w = 0.62; }
    }
    if (/[0-9A-Z]/.test(ch) || MathData.isGreekUpper(ch)) { a = 0.69; }
    else if (/[a-z]/.test(ch) || MathData.isGreekLower(ch)) {
        a = Layout._ASC.indexOf(ch) >= 0 ? 0.7 : 0.46;
        if (ch === 'i' || ch === 'j') { a = 0.67; }
        if (ch === 't') { a = 0.6; }
        d = Layout._DESC.indexOf(ch) >= 0 ? 0.22 : 0;
        if (ch === 'f' && !italic) { d = 0; }
    } else if ('()[]{}|\u2016\u27E8\u27E9\u2308\u2309\u230A\u230B/\\'.indexOf(ch) >= 0) { a = 0.75; d = 0.25; }
    else if ('+\u2212\u00B1\u2213\u00D7\u00F7=\u2260<>\u2264\u2265\u2248\u2261'.indexOf(ch) >= 0) { a = 0.58; d = 0.08; }
    else if (',;'.indexOf(ch) >= 0) { a = 0.12; d = 0.18; }
    else if (ch === '.' || ch === '\u2026') { a = 0.12; d = 0; }
    else if (ch === '\u2032' || ch === '\u2033' || ch === '\u2034' || ch === "'") { a = 0.75; d = -0.35; }
    else if ('\u2211\u220F\u2210\u22C3\u22C2\u22C1\u22C0\u2A01\u2A02\u2A00\u2A04\u2A06'.indexOf(ch) >= 0) { a = 0.75; d = 0.25; }
    else if (MathData.INTEGRAL_CHARS.indexOf(ch) >= 0) { a = 0.8; d = 0.3; w += italic ? 0 : 0; }
    else if (ch === ' ' || ch === '\u2009' || ch === '\u2002' || ch === '\u2003') { a = 0; d = 0; }
    else if (ch === '\u00B7' || ch === '\u22C5') { a = 0.32; d = -0.18; }
    else if (ch === '\u00B0') { a = 0.7; d = -0.4; }
    return { w: w, a: a, d: d };
};
/* Measure a text run. face: math|text|sans|mono. Returns points. */
Layout.ApproxMetrics.measure = function (text, size, face, bold, italic) {
    var cps = U.codePoints(text), i, m, w = 0, a = 0, d = 0;
    for (i = 0; i < cps.length; i++) {
        m = Layout.charMetrics(cps[i], italic);
        w += m.w * (face === 'mono' ? 0 : 1) + (face === 'mono' ? 0.6 : 0);
        if (m.a > a) { a = m.a; }
        if (m.d > d) { d = m.d; }
    }
    if (bold) { w *= 1.06; }
    return { w: w * size, a: a * size, d: d * size };
};

/* ---- Box helpers ---------------------------------------------------------- */
function LBox(w, a, d) { this.w = w; this.a = a; this.d = d; this.kids = []; this.prims = []; this.id = null; this.slant = 0; }
LBox.prototype.add = function (b, dx, dy) { this.kids.push([b, dx, dy]); return this; };
Layout.Box = LBox;
Layout.empty = function (w) { return new LBox(w || 0, 0, 0); };
/* Horizontal concatenation helper */
Layout.hpack = function (boxes) {
    var b = new LBox(0, 0, 0), x = 0, i, k;
    for (i = 0; i < boxes.length; i++) {
        k = boxes[i];
        b.add(k, x, 0);
        x += k.w;
        if (k.a > b.a) { b.a = k.a; }
        if (k.d > b.d) { b.d = k.d; }
    }
    b.w = x;
    return b;
};
/* Raise/lower a box: returns wrapper whose content is shifted by dy. */
Layout.shift = function (box, dy) {
    var b = new LBox(box.w, Math.max(0, box.a + dy), Math.max(0, box.d - dy));
    b.add(box, 0, dy);
    return b;
};

/* ---- Context -------------------------------------------------------------- */
Layout.STYLE_DOWN_FRAC = { D: 'T', T: 'S', S: 'SS', SS: 'SS' };
Layout.STYLE_DOWN_SCRIPT = { D: 'S', T: 'S', S: 'SS', SS: 'SS' };
Layout.ctxWith = function (ctx, mods) {
    var c = {}, k;
    for (k in ctx) { if (U.has(ctx, k)) { c[k] = ctx[k]; } }
    for (k in mods) { if (U.has(mods, k)) { c[k] = mods[k]; } }
    if (U.has(mods, 'style')) { c.size = Layout.sizeFor(c, mods.style); }
    return c;
};
Layout.sizeFor = function (ctx, style) {
    var s = ctx.baseSize * ctx.scale;
    if (style === 'S') { return s * ctx.set.scriptScale; }
    if (style === 'SS') { return s * ctx.set.scriptScriptScale; }
    return s;
};
Layout.applyNodeStyle = function (ctx, n) {
    var st = n.style, mods = {};
    if (!st) { return ctx; }
    if (st.color) { mods.color = st.color; }
    if (st.bold !== undefined && st.bold !== null) { mods.bold = !!st.bold; }
    if (st.italic !== undefined && st.italic !== null) { mods.italicOverride = !!st.italic; }
    if (st.font) { mods.fontOverride = st.font; }
    if (U.isNumber(st.scale) && st.scale > 0) { mods.scale = ctx.scale * U.clamp(st.scale, 0.1, 10); }
    mods.style = ctx.style;
    return Layout.ctxWith(ctx, mods);
};

/* ---- Glyphs --------------------------------------------------------------- */
Layout.glyph = function (text, ctx, opts) {
    var face = (opts && opts.face) || ctx.face || 'math', italic = !!(opts && opts.italic), bold = ctx.bold || !!(opts && opts.bold),
        size = (opts && opts.size) || ctx.size, m, b;
    if (ctx.italicOverride !== null && ctx.italicOverride !== undefined && !(opts && opts.fixedItalic)) { italic = ctx.italicOverride; }
    m = ctx.metrics.measure(text, size, face, bold, italic, ctx.fontOverride);
    b = new LBox(m.w, m.a, m.d);
    b.prims.push({ k: 'text', t: text, x: 0, y: 0, size: size, face: face, bold: bold, italic: italic, color: ctx.color,
        font: ctx.fontOverride || null, id: (opts && opts.id) || null, role: (opts && opts.role) || 'glyph' });
    if (italic && text.length === 1) { b.slant = 0.06 * size; }
    return b;
};
Layout.isItalicChar = function (ch, ctx) {
    if (ctx.upright) { return false; }
    if (MathData.isLatinLetter(ch)) { return ctx.set.italicVariables; }
    if (MathData.isGreekLower(ch)) { return ctx.set.italicGreekLower; }
    return false;
};

/* ---- Inter-atom spacing (TeX rules) --------------------------------------- */
Layout.CLASSES = ['ord', 'op', 'bin', 'rel', 'open', 'close', 'punct', 'inner'];
/* Values: 0 none, 1 thin, 2 medium, 3 thick; negative = only in display/text styles */
Layout.SPACING = {
    ord:   [0, 1, -2, -3, 0, 0, 0, -1],
    op:    [1, 1, 0, -3, 0, 0, 0, -1],
    bin:   [-2, -2, 0, 0, -2, 0, 0, -2],
    rel:   [-3, -3, 0, 0, -3, 0, 0, -3],
    open:  [0, 0, 0, 0, 0, 0, 0, 0],
    close: [0, 1, -2, -3, 0, 0, 0, -1],
    punct: [-1, -1, 0, -1, -1, -1, -1, -1],
    inner: [-1, 1, -2, -3, -1, 0, -1, -1]
};
Layout.spaceBetween = function (l, r, ctx) {
    var v = Layout.SPACING[l] ? Layout.SPACING[l][U.indexOf(Layout.CLASSES, r)] : 0, mu;
    if (!v) { return 0; }
    if (v < 0) { if (ctx.style === 'S' || ctx.style === 'SS') { return 0; } v = -v; }
    mu = v === 1 ? 3 : v === 2 ? 4 : 5;
    return mu * Layout.MU * ctx.size * ctx.set.operatorSpacing;
};

/* ---- Rows ----------------------------------------------------------------- */
Layout.row = function (row, ctx, opts) {
    var items = row.items, boxes = [], classes = [], i, n, cls, b, prev, sp, out, x = 0, pc, nc, ls;
    ctx = Layout.applyNodeStyle(ctx, row);
    if (!items.length) {
        out = Layout.placeholder(row, ctx);
        out.id = row.id;
        return out;
    }
    for (i = 0; i < items.length; i++) {
        n = items[i];
        b = Layout.node(n, ctx, items, i);
        boxes.push(b);
        cls = n.type === 'space' ? null : AST.atomClass(n);
        if (n.type === 'delim' && n.middle) { cls = ['rel', 'rel']; }
        classes.push(cls ? [cls[0], cls[1]] : null);
    }
    /* TeX bin -> ord conversion */
    pc = (opts && opts.leadingOrd) ? 'ord' : null;
    for (i = 0; i < classes.length; i++) {
        if (!classes[i]) { continue; }
        if (classes[i][0] === 'bin') {
            if (pc === null || pc === 'bin' || pc === 'op' || pc === 'rel' || pc === 'open' || pc === 'punct') { classes[i] = ['ord', 'ord']; }
            else {
                nc = null;
                for (var j = i + 1; j < classes.length; j++) { if (classes[j]) { nc = classes[j][0]; break; } }
                if (nc === null || nc === 'rel' || nc === 'close' || nc === 'punct') { classes[i] = ['ord', 'ord']; }
            }
        }
        pc = classes[i][1];
    }
    out = new LBox(0, 0, 0);
    prev = (opts && opts.leadingOrd) ? 'ord' : null;
    ls = ctx.set.letterSpacing * ctx.size;
    for (i = 0; i < boxes.length; i++) {
        if (classes[i] && prev) { x += Layout.spaceBetween(prev, classes[i][0], ctx); }
        if (i > 0 && ls) { x += ls; }
        out.add(boxes[i], x, 0);
        x += boxes[i].w;
        if (boxes[i].a > out.a) { out.a = boxes[i].a; }
        if (boxes[i].d > out.d) { out.d = boxes[i].d; }
        if (classes[i]) { prev = classes[i][1]; }
    }
    out.w = x;
    out.id = row.id;
    if (boxes.length === 1) { out.slant = boxes[0].slant; }
    return out;
};
Layout.placeholder = function (row, ctx) {
    var s = ctx.size, b, w = 0.5 * s, h = 0.62 * s, y0 = -0.05 * s;
    if (!ctx.placeholders) { return new LBox(0, 0, 0); }
    b = new LBox(w + 0.1 * s, h + y0, -y0);
    b.prims.push({ k: 'path', role: 'placeholder', id: row.id, closed: true, stroke: Math.max(0.5, 0.03 * s), fill: false, color: '#8A8A8A',
        dashed: true, pts: Layout.pts([[0.05 * s, y0], [0.05 * s + w, y0], [0.05 * s + w, y0 + h], [0.05 * s, y0 + h]]) });
    return b;
};
Layout.pts = function (arr) {
    var out = [], i;
    for (i = 0; i < arr.length; i++) { out.push({ a: [arr[i][0], arr[i][1]], l: [arr[i][0], arr[i][1]], r: [arr[i][0], arr[i][1]] }); }
    return out;
};

/* ---- Nodes ------------------------------------------------------------------ */
Layout.node = function (n, ctx, siblings, index) {
    var b, c = Layout.applyNodeStyle(ctx, n), dy;
    b = Layout.build(n, c, siblings, index);
    if (n.style && U.isNumber(n.style.dy) && n.style.dy) {
        dy = n.style.dy * c.size;
        b = Layout.shift(b, dy);
    }
    b.id = n.id;
    return b;
};
Layout.build = function (n, ctx, siblings, index) {
    var s = ctx.size, b, t, ch, italic;
    switch (n.type) {
    case 'row': return Layout.row(n, ctx);
    case 'number':
        return Layout.glyph(n.text, ctx, { id: n.id });
    case 'variable':
        ch = n.text;
        if (ctx.variant) { ch = MathData.mapVariantChar(ctx.variant, ch); }
        italic = !ctx.variant && Layout.isItalicChar(n.text, ctx);
        return Layout.glyph(ch, ctx, { italic: italic, id: n.id });
    case 'operator': case 'symbol':
        t = n.text;
        if (ctx.unit && t === '.') { t = '\u00B7'; }
        if (ctx.unit && t === '\u2217') { t = '\u00B7'; }
        if (ctx.variant && t.length === 1) { t = MathData.mapVariantChar(ctx.variant, t); }
        if (MathData.INTEGRAL_CHARS.indexOf(t) >= 0 || /^[\u2211\u220F\u2210]$/.test(t)) {
            return Layout.bigSymbol(t, ctx, n.id, MathData.INTEGRAL_CHARS.indexOf(t) >= 0);
        }
        return Layout.glyph(t, ctx, { id: n.id });
    case 'delim':
        if (n.middle) { return Layout.delimiter(n.text, ctx.middleHeight || 0, ctx, n.id); }
        return Layout.delimiter(n.text, (n.size || 1) * s, ctx, n.id);
    case 'func': return Layout.func(n, ctx);
    case 'text':
        return Layout.glyph(n.text, ctx, { face: 'text', italic: n.variant === 'it', bold: n.variant === 'bf', id: n.id, role: 'text' });
    case 'space':
        return new LBox(n.width * s, 0, 0);
    case 'frac': return Layout.frac(n, ctx);
    case 'binom': return Layout.binom(n, ctx);
    case 'root': return Layout.radical(n, ctx);
    case 'scripts': return Layout.scripts(n, ctx);
    case 'fenced': return Layout.fenced(n, ctx);
    case 'matrix': return Layout.matrix(n, ctx);
    case 'bigop': return Layout.bigop(n, ctx);
    case 'accent': return Layout.accent(n, ctx);
    case 'font': return Layout.font(n, ctx);
    case 'xarrow': return Layout.xarrow(n, ctx);
    case 'stack': return Layout.stack(n, ctx);
    case 'boxed': return Layout.boxed(n, ctx);
    case 'chem': return Layout.row(n.body, Layout.ctxWith(ctx, { upright: true }));
    case 'lines': return Layout.lines(n, ctx);
    }
    b = Layout.glyph('?', ctx, { id: n.id });
    return b;
};

Layout.func = function (n, ctx) {
    var name = Layout.glyph(n.display, ctx, { face: 'math', italic: false, fixedItalic: true, id: n.id, role: 'func' }), low, b, s = ctx.size;
    if (!n.lower) { return name; }
    low = Layout.row(n.lower, Layout.ctxWith(ctx, { style: Layout.STYLE_DOWN_SCRIPT[ctx.style], cramped: true }));
    if (n.limits && ctx.style === 'D') {
        return Layout.vstackCenter(name, null, low, 0.1 * s, 0.12 * s);
    }
    b = new LBox(0, name.a, name.d);
    b.add(name, 0, 0);
    b.add(low, name.w, -Math.max(0.2 * s, low.a - 0.4 * s));
    b.w = name.w + low.w;
    b.d = Math.max(name.d, Math.max(0.2 * s, low.a - 0.4 * s) + low.d);
    return b;
};
/* Centered vertical stack: base with optional over/under boxes. */
Layout.vstackCenter = function (base, over, under, gap, padBottom) {
    var w = Math.max(base.w, over ? over.w : 0, under ? under.w : 0), b = new LBox(w, base.a, base.d), y;
    b.add(base, (w - base.w) / 2, 0);
    if (over) {
        y = base.a + gap + over.d;
        b.add(over, (w - over.w) / 2, y);
        b.a = y + over.a;
    }
    if (under) {
        y = -(base.d + gap + under.a);
        b.add(under, (w - under.w) / 2, y);
        b.d = -y + under.d + (padBottom || 0) * 0;
    }
    return b;
};

Layout.frac = function (n, ctx) {
    var st = n.mode === 'dfrac' || n.mode === 'cfrac' ? 'D' : n.mode === 'tfrac' ? 'T' : ctx.style, sub = Layout.STYLE_DOWN_FRAC[st],
        cn = Layout.ctxWith(ctx, { style: sub }), cd = Layout.ctxWith(ctx, { style: sub, cramped: true }), s = Layout.sizeFor(ctx, st),
        num = Layout.row(n.num, cn), den = Layout.row(n.den, cd), th = ctx.set.barThickness * s, gap = ctx.set.fractionGap * s * (st === 'D' ? 1 : 0.7),
        axis = Layout.AXIS * s, pad = 0.12 * s, w = Math.max(num.w, den.w) + 2 * pad, b, ny, dy;
    if (n.mode === 'cfrac') { cn = Layout.ctxWith(ctx, { style: 'D' }); num = Layout.row(n.num, cn); w = Math.max(num.w, den.w) + 2 * pad; }
    ny = axis + th / 2 + gap + num.d;
    if (st === 'D') { ny = Math.max(ny, 0.68 * s); }
    dy = axis - th / 2 - gap - den.a;
    if (st === 'D') { dy = Math.min(dy, -0.68 * s + axis * 0.5); }
    b = new LBox(w, ny + num.a, -dy + den.d);
    b.add(num, (w - num.w) / 2, ny);
    b.add(den, (w - den.w) / 2, dy);
    b.prims.push({ k: 'rule', x: pad * 0.5, y: axis - th / 2, w: w - pad, h: th, color: ctx.color, id: n.id, role: 'fraction-bar' });
    return b;
};
Layout.binom = function (n, ctx) {
    var st = n.mode === 'dbinom' ? 'D' : n.mode === 'tbinom' ? 'T' : ctx.style, sub = Layout.STYLE_DOWN_FRAC[st],
        s = Layout.sizeFor(ctx, st), top = Layout.row(n.top, Layout.ctxWith(ctx, { style: sub })),
        bot = Layout.row(n.bottom, Layout.ctxWith(ctx, { style: sub, cramped: true })), axis = Layout.AXIS * s,
        gap = 0.2 * s, w = Math.max(top.w, bot.w), inner = new LBox(w, 0, 0), ty, by;
    ty = Math.max(axis + gap + top.d, 0.6 * s);
    by = Math.min(axis - gap - bot.a, -0.45 * s);
    inner.add(top, (w - top.w) / 2, ty);
    inner.add(bot, (w - bot.w) / 2, by);
    inner.a = ty + top.a; inner.d = -by + bot.d;
    return Layout.wrapDelims(inner, '(', ')', ctx, n.id);
};

Layout.radical = function (n, ctx) {
    var s = ctx.size, body = Layout.row(n.body, Layout.ctxWith(ctx, { cramped: true })), sw = ctx.set.strokeWidth * s,
        gap = 0.14 * s, bodyA = Math.max(body.a, 0.62 * s), bodyD = Math.max(body.d, 0.05 * s), h = bodyA + bodyD,
        top = bodyA + gap + sw / 2, bottom = -bodyD - 0.04 * s, rw = Math.min(0.62 * s, 0.42 * s + 0.08 * h),
        ymid = bottom + Math.min(0.5 * s, 0.45 * (top - bottom)), idx = null, ix = 0, b, pts, x0;
    if (n.index && n.index.items.length) {
        idx = Layout.row(n.index, Layout.ctxWith(ctx, { style: 'SS' }));
        ix = Math.max(0, idx.w - rw * 0.55);
    } else if (n.index && ctx.placeholders) {
        idx = Layout.row(n.index, Layout.ctxWith(ctx, { style: 'SS' }));
        ix = Math.max(0, idx.w - rw * 0.55);
    }
    x0 = ix;
    pts = [[x0, ymid - 0.02 * s], [x0 + rw * 0.2, ymid + 0.07 * s], [x0 + rw * 0.48, bottom], [x0 + rw, top], [x0 + rw + body.w + 0.12 * s, top]];
    b = new LBox(x0 + rw + body.w + 0.16 * s, top + sw / 2 + 0.06 * s, -bottom + sw / 2);
    b.prims.push({ k: 'path', role: 'radical', id: n.id, closed: false, stroke: sw, fill: false, color: ctx.color, pts: Layout.pts(pts), join: 'miter' });
    b.add(body, x0 + rw + 0.06 * s, 0);
    if (idx) {
        var iy = ymid + 0.12 * s + idx.d;
        b.add(idx, x0 + rw * 0.55 - idx.w, iy);
        if (iy + idx.a > b.a) { b.a = iy + idx.a; }
    }
    return b;
};

Layout.isSingleChar = function (row) {
    return row.items.length === 1 && (row.items[0].type === 'variable' || row.items[0].type === 'number' && row.items[0].text.length === 1 ||
        row.items[0].type === 'symbol');
};
Layout.scripts = function (n, ctx) {
    var s = ctx.size, base, sup = null, sub = null, presup = null, presub = null, sc = Layout.STYLE_DOWN_SCRIPT[ctx.style],
        csup = Layout.ctxWith(ctx, { style: sc }), csub = Layout.ctxWith(ctx, { style: sc, cramped: true }), u = 0, v = 0, b, x0 = 0,
        preW = 0, single, gapMin, kern, bigInt = false, ss = Layout.sizeFor(ctx, sc), baseItem;
    base = Layout.row(n.base, ctx);
    baseItem = n.base.items.length === 1 ? n.base.items[0] : null;
    single = Layout.isSingleChar(n.base);
    if (baseItem && (baseItem.type === 'symbol' || baseItem.type === 'operator') && MathData.INTEGRAL_CHARS.indexOf(baseItem.text) >= 0) { bigInt = true; }
    if (n.sup) { sup = Layout.row(n.sup, csup); }
    if (n.sub) { sub = Layout.row(n.sub, csub); }
    if (n.presup) { presup = Layout.row(n.presup, csup); }
    if (n.presub) { presub = Layout.row(n.presub, csub); }
    if (sup || presup) {
        u = single ? 0 : base.a - 0.38 * ss;
        u = Math.max(u, ctx.cramped ? 0.36 * s : 0.42 * s, (sup ? sup.d : presup.d) + 0.12 * s);
        if (sup && sup.items === undefined && n.sup.items.length && /^[\u2032\u2033\u2034]+$/.test(Serializer.plainText(n.sup))) { u = Math.max(u - 0.12 * s, 0.2 * s); }
        u += ctx.set.supOffset * s;
    }
    if (sub || presub) {
        v = single ? 0 : base.d + 0.2 * ss;
        v = Math.max(v, (sup || presup) ? 0.25 * s : 0.18 * s, (sub ? sub.a : presub.a) - 0.38 * s);
        v += ctx.set.subOffset * s;
    }
    if ((sup || presup) && (sub || presub)) {
        gapMin = 0.18 * s;
        var supB = u - Math.max(sup ? sup.d : 0, presup ? presup.d : 0), subT = -v + Math.max(sub ? sub.a : 0, presub ? presub.a : 0);
        if (supB - subT < gapMin) { v += gapMin - (supB - subT); }
    }
    if (presup || presub) { preW = Math.max(presup ? presup.w : 0, presub ? presub.w : 0) + 0.03 * s; }
    b = new LBox(0, base.a, base.d);
    if (presup) { b.add(presup, preW - presup.w - 0.03 * s, u); }
    if (presub) { b.add(presub, preW - presub.w - 0.03 * s, -v); }
    x0 = preW;
    b.add(base, x0, 0);
    kern = base.slant || 0;
    var right = x0 + base.w;
    if (sup) {
        b.add(sup, x0 + base.w + kern + (bigInt ? 0.02 * s : 0.02 * s), u);
        right = Math.max(right, x0 + base.w + kern + 0.02 * s + sup.w);
        b.a = Math.max(b.a, u + sup.a);
    }
    if (sub) {
        b.add(sub, x0 + base.w + (bigInt ? -0.25 * base.w : 0.02 * s), -v);
        right = Math.max(right, x0 + base.w + (bigInt ? -0.25 * base.w : 0.02 * s) + sub.w);
        b.d = Math.max(b.d, v + sub.d);
    }
    if (presup) { b.a = Math.max(b.a, u + presup.a); }
    if (presub) { b.d = Math.max(b.d, v + presub.d); }
    b.w = right + 0.04 * s;
    return b;
};

/* ---- Delimiters ----------------------------------------------------------- */
Layout.NULL_DELIM = 0.12;
/* Build a delimiter covering total height h (centered on the axis). h<=0 -> normal glyph. */
Layout.delimiter = function (ch, h, ctx, id) {
    var s = ctx.size, b, g, axis = Layout.AXIS * s;
    if (!ch || ch === '.') { return new LBox(Layout.NULL_DELIM * s, 0, 0); }
    if (h <= 1.18 * s) {
        g = Layout.glyph(ch, ctx, { italic: false, fixedItalic: true, id: id, role: 'delimiter' });
        return g;
    }
    b = Layout.delimPath(ch, h, ctx, id);
    if (b) { return b; }
    /* Unknown shape: scale the glyph vertically via font size (keeps it native text). */
    g = Layout.glyph(ch, ctx, { size: s * h / (1.0 * s) * 0.95, italic: false, fixedItalic: true, id: id, role: 'delimiter' });
    var dy = axis - (g.a - g.d) / 2;
    return Layout.shift(g, dy);
};
Layout.delimPath = function (ch, h, ctx, id) {
    var s = ctx.size, axis = Layout.AXIS * s, top = axis + h / 2, bot = axis - h / 2, mid = axis, sw = ctx.set.strokeWidth * s * (1 + Math.min(0.6, 0.06 * (h / s - 1))),
        w, b, P = [], side = 0.07 * s, prim, i, mirror = false;
    function A(x, y, lx, ly, rx, ry) { return { a: [x, y], l: [lx === undefined ? x : lx, ly === undefined ? y : ly], r: [rx === undefined ? x : rx, ry === undefined ? y : ry] }; }
    switch (ch) {
    case '(': case ')':
        w = 0.3 * s + 0.035 * h;
        P = [A(w - side, top, w - side, top, side + 0.05 * w, top - 0.28 * h), A(w - side, bot, side + 0.05 * w, bot + 0.28 * h, w - side, bot)];
        P = [A(w - side, top, w - side, top, side + 0.02 * w, top - h * 0.3), A(w - side, bot, side + 0.02 * w, bot + h * 0.3, w - side, bot)];
        mirror = ch === ')';
        break;
    case '[': case ']':
        w = 0.32 * s;
        P = [A(w - side, top), A(side + sw, top), A(side + sw, bot), A(w - side, bot)];
        mirror = ch === ']';
        break;
    case '{': case '}':
        w = 0.45 * s + 0.02 * h;
        var xm = w * 0.48, q = Math.min(0.12 * h, 0.35 * s);
        P = [A(w - side, top, w - side, top, xm + 0.15 * w, top),
            A(xm, top - q, xm, top - q * 0.35, xm, top - q),
            A(xm, mid + q, xm, mid + q, xm, mid + q * 0.4),
            A(side, mid, xm - 0.05 * w, mid, xm - 0.05 * w, mid),
            A(xm, mid - q, xm, mid - q * 0.4, xm, mid - q),
            A(xm, bot + q, xm, bot + q, xm, bot + q * 0.35),
            A(w - side, bot, xm + 0.15 * w, bot, w - side, bot)];
        mirror = ch === '}';
        break;
    case '|': case '\u2223':
        w = 0.24 * s;
        P = [A(w / 2, top), A(w / 2, bot)];
        break;
    case '\u2016': case '\u2225':
        w = 0.42 * s;
        b = new LBox(w, top, -bot);
        b.prims.push({ k: 'path', role: 'delimiter', id: id, closed: false, stroke: sw, fill: false, color: ctx.color, pts: [A(w * 0.32, top), A(w * 0.32, bot)] });
        b.prims.push({ k: 'path', role: 'delimiter', id: id, closed: false, stroke: sw, fill: false, color: ctx.color, pts: [A(w * 0.68, top), A(w * 0.68, bot)] });
        return b;
    case '\u27E8': case '\u27E9': case '<': case '>':
        w = 0.36 * s + 0.04 * h;
        P = [A(w - side, top), A(side, mid), A(w - side, bot)];
        mirror = (ch === '\u27E9' || ch === '>');
        break;
    case '\u230A': case '\u230B':
        w = 0.36 * s;
        P = [A(side + sw, top), A(side + sw, bot), A(w - side, bot)];
        mirror = ch === '\u230B';
        break;
    case '\u2308': case '\u2309':
        w = 0.36 * s;
        P = [A(w - side, top), A(side + sw, top), A(side + sw, bot)];
        mirror = ch === '\u2309';
        break;
    case '/': case '\\':
        w = 0.25 * s + 0.25 * h;
        P = ch === '/' ? [A(side, bot), A(w - side, top)] : [A(side, top), A(w - side, bot)];
        break;
    case '\u2191': case '\u2193': case '\u21D1': case '\u21D3': case '\u2195':
        return null;
    default:
        return null;
    }
    if (mirror) {
        for (i = 0; i < P.length; i++) {
            P[i] = { a: [w - P[i].a[0], P[i].a[1]], l: [w - P[i].l[0], P[i].l[1]], r: [w - P[i].r[0], P[i].r[1]] };
        }
    }
    b = new LBox(w, top + sw / 2, -bot + sw / 2);
    prim = { k: 'path', role: 'delimiter', id: id, closed: false, stroke: sw, fill: false, color: ctx.color, pts: P, cap: 'round', join: 'round' };
    b.prims.push(prim);
    return b;
};
/* Height a delimiter must reach to enclose a box symmetric about the axis. */
Layout.coverHeight = function (box, ctx) {
    var axis = Layout.AXIS * ctx.size, half = Math.max(box.a - axis, box.d + axis);
    return Math.max(2 * half * 1.02, 2 * half + 0.1 * ctx.size);
};
Layout.wrapDelims = function (inner, l, r, ctx, id) {
    var h = Layout.coverHeight(inner, ctx), lb = Layout.delimiter(l, h, ctx, id), rb = Layout.delimiter(r, h, ctx, id), s = ctx.size;
    return Layout.hpack([lb, Layout.empty(0.04 * s), inner, Layout.empty(0.04 * s), rb]);
};
Layout.hasMiddle = function (row) {
    var i;
    for (i = 0; i < row.items.length; i++) { if (row.items[i].type === 'delim' && row.items[i].middle) { return true; } }
    return false;
};
Layout.fenced = function (n, ctx) {
    var body = Layout.row(n.body, ctx), h;
    h = Layout.coverHeight(body, ctx);
    if (Layout.hasMiddle(n.body)) { body = Layout.row(n.body, Layout.ctxWith(ctx, { middleHeight: h })); }
    return Layout.wrapDelims(body, n.left, n.right, ctx, n.id);
};

/* ---- Big operators ---------------------------------------------------------- */
Layout.bigSymbol = function (sym, ctx, id, isIntegral) {
    var s = ctx.size, scale = 1, g, axis = Layout.AXIS * s, dy;
    if (ctx.style === 'D') { scale = isIntegral ? ctx.set.integralScale : ctx.set.bigOpScale; }
    else if (ctx.style === 'T') { scale = isIntegral ? 1.25 : 1.1; }
    g = Layout.glyph(sym, ctx, { size: s * scale, italic: false, fixedItalic: true, id: id, role: 'bigop' });
    dy = axis - (g.a - g.d) / 2;
    g = Layout.shift(g, dy);
    g.integral = isIntegral;
    return g;
};
Layout.bigop = function (n, ctx) {
    var s = ctx.size, isInt = MathData.INTEGRAL_CHARS.indexOf(n.symbol) >= 0, sym = Layout.bigSymbol(n.symbol, ctx, n.id, isInt),
        useLimits = n.limits === 'limits' || (n.limits === 'auto' && ctx.style === 'D' && !isInt), sc = Layout.STYLE_DOWN_SCRIPT[ctx.style],
        up = n.upper ? Layout.row(n.upper, Layout.ctxWith(ctx, { style: sc })) : null,
        lo = n.lower ? Layout.row(n.lower, Layout.ctxWith(ctx, { style: sc, cramped: true })) : null, b, x;
    if (!up && !lo) { return sym; }
    if (useLimits) { return Layout.vstackCenter(sym, up, lo, 0.12 * s); }
    b = new LBox(0, sym.a, sym.d);
    b.add(sym, 0, 0);
    x = sym.w;
    var right = x;
    if (up) {
        var uy = sym.a - 0.45 * up.a - (isInt ? 0.1 * s : 0.05 * s);
        uy = Math.max(uy, 0.4 * s);
        b.add(up, x + (isInt ? 0.06 * s : 0.04 * s), uy);
        b.a = Math.max(b.a, uy + up.a);
        right = Math.max(right, x + 0.06 * s + up.w);
    }
    if (lo) {
        var ly = -sym.d + 0.35 * lo.d + (isInt ? 0.05 * s : 0);
        ly = Math.min(ly, -0.2 * s);
        var lx = x + (isInt ? -0.3 * sym.w : 0.04 * s);
        b.add(lo, lx, ly);
        b.d = Math.max(b.d, -ly + lo.d);
        right = Math.max(right, lx + lo.w);
    }
    b.w = right + 0.06 * s;
    return b;
};

/* ---- Accents ----------------------------------------------------------------- */
Layout.accent = function (n, ctx) {
    var s = ctx.size, body = Layout.row(n.body, Layout.ctxWith(ctx, { cramped: true })), k = n.accent, sw = ctx.set.strokeWidth * s * 0.85,
        th = ctx.set.barThickness * s, b = new LBox(body.w, body.a, body.d), y0 = Math.max(body.a, 0.46 * s) + 0.1 * s, w = body.w,
        cx = body.w / 2 + (Layout.isSingleChar(n.body) ? (body.slant || 0) * 0.8 : 0), aw = Math.min(Math.max(0.3 * s, w * 0.9), 0.5 * s),
        pts, label, P = Layout.pts, i, x;
    b.add(body, 0, 0);
    function stroke(arr, closed, role) { b.prims.push({ k: 'path', role: role || 'accent', id: n.id, closed: !!closed, stroke: sw, fill: false, color: ctx.color, pts: P(arr), cap: 'round', join: 'round' }); }
    function dotAt(x, y) {
        var r = 0.055 * s, c = 0.5523 * r;
        b.prims.push({ k: 'path', role: 'accent', id: n.id, closed: true, stroke: 0, fill: true, color: ctx.color, pts: [
            { a: [x + r, y], l: [x + r, y - c], r: [x + r, y + c] }, { a: [x, y + r], l: [x + c, y + r], r: [x - c, y + r] },
            { a: [x - r, y], l: [x - r, y + c], r: [x - r, y - c] }, { a: [x, y - r], l: [x - c, y - r], r: [x + c, y - r] }] });
    }
    function arrowHead(xTip, y, dir) {
        var hl = 0.16 * s, hh = 0.09 * s;
        stroke([[xTip - dir * hl, y + hh], [xTip, y], [xTip - dir * hl, y - hh]]);
    }
    switch (k) {
    case 'hat': case 'widehat':
        x = k === 'widehat' ? Math.max(w, 0.4 * s) : aw * 0.8;
        stroke([[cx - x / 2, y0], [cx, y0 + (k === 'widehat' ? 0.12 * s + 0.04 * x / s * s * 0.1 : 0.14 * s)], [cx + x / 2, y0]]);
        b.a = y0 + 0.2 * s; break;
    case 'check':
        stroke([[cx - aw * 0.4, y0 + 0.14 * s], [cx, y0], [cx + aw * 0.4, y0 + 0.14 * s]]); b.a = y0 + 0.2 * s; break;
    case 'tilde': case 'widetilde':
        x = k === 'widetilde' ? Math.max(w, 0.4 * s) : aw;
        b.prims.push({ k: 'path', role: 'accent', id: n.id, closed: false, stroke: sw, fill: false, color: ctx.color, cap: 'round', pts: [
            { a: [cx - x / 2, y0 + 0.02 * s], l: [cx - x / 2, y0 + 0.02 * s], r: [cx - x / 4, y0 + 0.2 * s] },
            { a: [cx, y0 + 0.08 * s], l: [cx - x / 8, y0 + 0.08 * s], r: [cx + x / 8, y0 + 0.08 * s] },
            { a: [cx + x / 2, y0 + 0.14 * s], l: [cx + x / 4, y0 - 0.04 * s], r: [cx + x / 2, y0 + 0.14 * s] }] });
        b.a = y0 + 0.2 * s; break;
    case 'bar':
        b.prims.push({ k: 'rule', x: cx - aw / 2, y: y0, w: aw, h: th, color: ctx.color, id: n.id, role: 'accent' });
        b.a = y0 + th + 0.04 * s; break;
    case 'overline':
        b.prims.push({ k: 'rule', x: 0, y: Math.max(body.a, 0.62 * s) + 0.1 * s, w: w, h: th, color: ctx.color, id: n.id, role: 'overline' });
        b.a = Math.max(body.a, 0.62 * s) + 0.1 * s + th + 0.06 * s; break;
    case 'underline':
        b.prims.push({ k: 'rule', x: 0, y: -body.d - 0.12 * s - th, w: w, h: th, color: ctx.color, id: n.id, role: 'underline' });
        b.d = body.d + 0.14 * s + th; break;
    case 'dot': dotAt(cx, y0 + 0.07 * s); b.a = y0 + 0.16 * s; break;
    case 'ddot': dotAt(cx - 0.11 * s, y0 + 0.07 * s); dotAt(cx + 0.11 * s, y0 + 0.07 * s); b.a = y0 + 0.16 * s; break;
    case 'dddot': for (i = -1; i <= 1; i++) { dotAt(cx + i * 0.17 * s, y0 + 0.07 * s); } b.a = y0 + 0.16 * s; break;
    case 'breve':
        b.prims.push({ k: 'path', role: 'accent', id: n.id, closed: false, stroke: sw, fill: false, color: ctx.color, cap: 'round', pts: [
            { a: [cx - aw * 0.38, y0 + 0.15 * s], l: [cx - aw * 0.38, y0 + 0.15 * s], r: [cx - aw * 0.38, y0] },
            { a: [cx + aw * 0.38, y0 + 0.15 * s], l: [cx + aw * 0.38, y0], r: [cx + aw * 0.38, y0 + 0.15 * s] }] });
        b.a = y0 + 0.2 * s; break;
    case 'acute': stroke([[cx - 0.05 * s, y0], [cx + 0.1 * s, y0 + 0.18 * s]]); b.a = y0 + 0.22 * s; break;
    case 'grave': stroke([[cx + 0.05 * s, y0], [cx - 0.1 * s, y0 + 0.18 * s]]); b.a = y0 + 0.22 * s; break;
    case 'mathring':
        var r = 0.07 * s, c = 0.5523 * r, yc = y0 + 0.09 * s;
        b.prims.push({ k: 'path', role: 'accent', id: n.id, closed: true, stroke: sw * 0.8, fill: false, color: ctx.color, pts: [
            { a: [cx + r, yc], l: [cx + r, yc - c], r: [cx + r, yc + c] }, { a: [cx, yc + r], l: [cx + c, yc + r], r: [cx - c, yc + r] },
            { a: [cx - r, yc], l: [cx - r, yc + c], r: [cx - r, yc - c] }, { a: [cx, yc - r], l: [cx - c, yc - r], r: [cx + c, yc - r] }] });
        b.a = yc + r + 0.05 * s; break;
    case 'vec':
        x = Math.max(aw, Math.min(w, 0.6 * s));
        stroke([[cx - x / 2, y0 + 0.07 * s], [cx + x / 2, y0 + 0.07 * s]]); arrowHead(cx + x / 2, y0 + 0.07 * s, 1);
        b.a = y0 + 0.2 * s; break;
    case 'overrightarrow': case 'overleftarrow': case 'overleftrightarrow':
        x = Math.max(w, 0.5 * s);
        stroke([[cx - x / 2, y0 + 0.08 * s], [cx + x / 2, y0 + 0.08 * s]]);
        if (k !== 'overleftarrow') { arrowHead(cx + x / 2, y0 + 0.08 * s, 1); }
        if (k !== 'overrightarrow') { arrowHead(cx - x / 2, y0 + 0.08 * s, -1); }
        b.a = y0 + 0.2 * s;
        if (x > b.w) { b.w = x; }
        break;
    case 'arc':
        x = Math.max(w, 0.4 * s);
        b.prims.push({ k: 'path', role: 'accent', id: n.id, closed: false, stroke: sw, fill: false, color: ctx.color, cap: 'round', pts: [
            { a: [cx - x / 2, y0], l: [cx - x / 2, y0], r: [cx - x / 4, y0 + 0.18 * s] },
            { a: [cx + x / 2, y0], l: [cx + x / 4, y0 + 0.18 * s], r: [cx + x / 2, y0] }] });
        b.a = y0 + 0.2 * s; break;
    case 'overbrace': case 'underbrace':
        var over = k === 'overbrace', yb = over ? Math.max(body.a, 0.6 * s) + 0.12 * s : -body.d - 0.12 * s, hb = 0.2 * s * (over ? 1 : -1), xm2 = w / 2;
        x = Math.max(w, 0.6 * s);
        b.prims.push({ k: 'path', role: 'brace', id: n.id, closed: false, stroke: sw, fill: false, color: ctx.color, cap: 'round', join: 'round', pts: [
            { a: [0, yb], l: [0, yb], r: [0, yb + hb * 0.6] },
            { a: [Math.min(0.15 * s, w / 6), yb + hb * 0.6], l: [0.03 * s, yb + hb * 0.6], r: [Math.min(0.15 * s, w / 6), yb + hb * 0.6] },
            { a: [xm2 - 0.12 * s, yb + hb * 0.6], l: [xm2 - 0.12 * s, yb + hb * 0.6], r: [xm2 - 0.03 * s, yb + hb * 0.6] },
            { a: [xm2, yb + hb], l: [xm2, yb + hb * 0.7], r: [xm2, yb + hb * 0.7] },
            { a: [xm2 + 0.12 * s, yb + hb * 0.6], l: [xm2 + 0.03 * s, yb + hb * 0.6], r: [xm2 + 0.12 * s, yb + hb * 0.6] },
            { a: [w - Math.min(0.15 * s, w / 6), yb + hb * 0.6], l: [w - Math.min(0.15 * s, w / 6), yb + hb * 0.6], r: [w - 0.03 * s, yb + hb * 0.6] },
            { a: [w, yb], l: [w, yb + hb * 0.6], r: [w, yb] }] });
        if (over) { b.a = yb + hb + 0.05 * s; } else { b.d = -(yb + hb) + 0.05 * s; }
        if (n.label) {
            label = Layout.row(n.label, Layout.ctxWith(ctx, { style: Layout.STYLE_DOWN_SCRIPT[ctx.style] }));
            if (over) { b.add(label, (w - label.w) / 2, b.a + 0.06 * s + label.d); b.a += 0.06 * s + label.d + label.a; }
            else { b.add(label, (w - label.w) / 2, -(b.d + 0.06 * s + label.a)); b.d += 0.06 * s + label.a + label.d; }
            if (label.w > w) {
                var shiftAll = (label.w - w) / 2, nb = new LBox(label.w, b.a, b.d);
                nb.add(b, shiftAll, 0);
                return nb;
            }
        }
        break;
    default:
        break;
    }
    return b;
};

Layout.FONT_FACE = { sf: 'sans', tt: 'mono' };
Layout.font = function (n, ctx) {
    var v = n.variant, c, b;
    switch (v) {
    case 'bf': c = Layout.ctxWith(ctx, { bold: true, upright: true }); break;
    case 'bm': c = Layout.ctxWith(ctx, { bold: true }); break;
    case 'it': c = Layout.ctxWith(ctx, { italicOverride: true }); break;
    case 'rm': c = Layout.ctxWith(ctx, { upright: true, italicOverride: false }); break;
    case 'unit': c = Layout.ctxWith(ctx, { upright: true, italicOverride: false, unit: true }); break;
    case 'sf': case 'tt': c = Layout.ctxWith(ctx, { upright: true, face: Layout.FONT_FACE[v] }); break;
    case 'bb': case 'cal': case 'frak': c = Layout.ctxWith(ctx, { variant: v, upright: true }); break;
    case 'phantom':
        b = Layout.row(n.body, ctx);
        var ph = new LBox(b.w, b.a, b.d);
        return ph;
    default: c = ctx;
    }
    return Layout.row(n.body, c);
};

Layout.xarrow = function (n, ctx) {
    var s = ctx.size, sc = Layout.ctxWith(ctx, { style: Layout.STYLE_DOWN_SCRIPT[ctx.style] }), over = n.over && n.over.items.length ? Layout.row(n.over, sc) : null,
        under = n.under && n.under.items.length ? Layout.row(n.under, sc) : null, pad = 0.3 * s, axis = Layout.AXIS * s, sw = ctx.set.strokeWidth * s * 0.85,
        w = Math.max(over ? over.w : 0, under ? under.w : 0) + 2 * pad, b, P = Layout.pts, hl = 0.2 * s, hh = 0.11 * s, k = n.arrow, x0 = 0.06 * s, x1, dy = 0.07 * s;
    w = Math.max(w, 1.1 * s);
    if (n.over && !over && ctx.placeholders) { over = Layout.row(n.over, sc); }
    x1 = x0 + w;
    b = new LBox(w + 0.12 * s, axis + 0.18 * s, -axis + 0.18 * s);
    function line(pts) { b.prims.push({ k: 'path', role: 'arrow', id: n.id, closed: false, stroke: sw, fill: false, color: ctx.color, pts: P(pts), cap: 'round', join: 'round' }); }
    function head(xt, y, dir, half) {
        if (half === 'up') { line([[xt - dir * hl, y + hh], [xt, y]]); }
        else if (half === 'down') { line([[xt - dir * hl, y - hh], [xt, y]]); }
        else { line([[xt - dir * hl, y + hh], [xt, y], [xt - dir * hl, y - hh]]); }
    }
    switch (k) {
    case 'left': line([[x0, axis], [x1, axis]]); head(x0, axis, -1); break;
    case 'leftright': line([[x0, axis], [x1, axis]]); head(x1, axis, 1); head(x0, axis, -1); break;
    case 'equilibrium':
        line([[x0, axis + dy], [x1, axis + dy]]); head(x1, axis + dy, 1, 'up');
        line([[x0, axis - dy], [x1, axis - dy]]); head(x0, axis - dy, -1, 'down'); break;
    case 'equilibriumrev':
        line([[x0, axis + dy], [x1, axis + dy]]); head(x0, axis + dy, -1, 'up');
        line([[x0, axis - dy], [x1, axis - dy]]); head(x1, axis - dy, 1, 'down'); break;
    case 'rightleftarrows':
        line([[x0, axis + dy * 1.3], [x1, axis + dy * 1.3]]); head(x1, axis + dy * 1.3, 1);
        line([[x0, axis - dy * 1.3], [x1, axis - dy * 1.3]]); head(x0, axis - dy * 1.3, -1); break;
    case 'Right': case 'Left': case 'Leftright':
        line([[x0 + (k !== 'Right' ? 0.1 * s : 0), axis + 0.06 * s], [x1 - (k !== 'Left' ? 0.1 * s : 0), axis + 0.06 * s]]);
        line([[x0 + (k !== 'Right' ? 0.1 * s : 0), axis - 0.06 * s], [x1 - (k !== 'Left' ? 0.1 * s : 0), axis - 0.06 * s]]);
        if (k !== 'Left') { line([[x1 - hl, axis + hh * 1.5], [x1, axis], [x1 - hl, axis - hh * 1.5]]); }
        if (k !== 'Right') { line([[x0 + hl, axis + hh * 1.5], [x0, axis], [x0 + hl, axis - hh * 1.5]]); }
        break;
    case 'equal': line([[x0, axis + 0.06 * s], [x1, axis + 0.06 * s]]); line([[x0, axis - 0.06 * s], [x1, axis - 0.06 * s]]); break;
    case 'mapsto': line([[x0, axis + hh], [x0, axis - hh]]); line([[x0, axis], [x1, axis]]); head(x1, axis, 1); break;
    default: line([[x0, axis], [x1, axis]]); head(x1, axis, 1);
    }
    if (over) { b.add(over, x0 + (w - over.w) / 2, axis + 0.2 * s + over.d); b.a = axis + 0.2 * s + over.d + over.a; }
    if (under) { b.add(under, x0 + (w - under.w) / 2, axis - 0.2 * s - under.a); b.d = -(axis - 0.2 * s - under.a) + under.d; }
    return b;
};
Layout.stack = function (n, ctx) {
    var s = ctx.size, sc = Layout.ctxWith(ctx, { style: Layout.STYLE_DOWN_SCRIPT[ctx.style] }), base = Layout.row(n.base, ctx);
    return Layout.vstackCenter(base, n.over ? Layout.row(n.over, sc) : null, n.under ? Layout.row(n.under, sc) : null, 0.08 * s);
};
Layout.boxed = function (n, ctx) {
    var s = ctx.size, body = Layout.row(n.body, ctx), p = ctx.set.boxPadding * s, sw = ctx.set.strokeWidth * s * 0.8,
        a = Math.max(body.a, 0.7 * s) + p, d = Math.max(body.d, 0.2 * s) + p, b = new LBox(body.w + 2 * p + sw, a + sw / 2, d + sw / 2);
    b.add(body, p + sw / 2, 0);
    b.prims.push({ k: 'path', role: 'box', id: n.id, closed: true, stroke: sw, fill: false, color: ctx.color, join: 'miter',
        pts: Layout.pts([[sw / 2, -d], [body.w + 2 * p + sw / 2, -d], [body.w + 2 * p + sw / 2, a], [sw / 2, a]]) });
    return b;
};

/* ---- Matrices --------------------------------------------------------------- */
Layout.matrix = function (n, ctx) {
    var s = ctx.size, env = n.env, small = env === 'smallmatrix', st = small ? 'S' : (ctx.style === 'D' ? 'T' : ctx.style),
        cc = Layout.ctxWith(ctx, { style: st }), rows = n.rows, R = rows.length, C = 0, r, c, cells = [], colW = [], rowA = [], rowD = [],
        rowGap = ctx.set.matrixRowGap * s * (small ? 0.5 : 1), colGap = ctx.set.matrixColGap * s * (small ? 0.5 : 1), spec = [], bars = {},
        isCases = env === 'cases' || env === 'dcases' || env === 'rcases', inner, y, x, H, total, i, ch, b, delims, k, cell;
    if (env === 'dcases') { cc = Layout.ctxWith(ctx, { style: 'D' }); }
    for (r = 0; r < R; r++) { if (rows[r].length > C) { C = rows[r].length; } }
    /* column alignment */
    if (n.colspec) {
        k = 0;
        for (i = 0; i < n.colspec.length; i++) {
            ch = n.colspec.charAt(i);
            if (ch === '|') { bars[k] = (bars[k] || 0) + 1; }
            else if (ch === 'l' || ch === 'c' || ch === 'r') { spec.push(ch); k++; }
        }
    }
    for (c = 0; c < C; c++) { if (!spec[c]) { spec[c] = isCases ? 'l' : 'c'; } }
    for (r = 0; r < R; r++) {
        cells.push([]);
        rowA.push(0.7 * cc.size); rowD.push(0.3 * cc.size);
        for (c = 0; c < C; c++) {
            cell = rows[r][c] ? Layout.row(rows[r][c], cc) : new LBox(0, 0, 0);
            cells[r].push(cell);
            if (!colW[c] || cell.w > colW[c]) { colW[c] = Math.max(colW[c] || 0, cell.w); }
            if (cell.a > rowA[r]) { rowA[r] = cell.a; }
            if (cell.d > rowD[r]) { rowD[r] = cell.d; }
        }
    }
    inner = new LBox(0, 0, 0);
    H = 0;
    for (r = 0; r < R; r++) { H += rowA[r] + rowD[r] + (r ? rowGap : 0); }
    /* place: top of block at H/2 above axis */
    y = Layout.AXIS * s + H / 2;
    var xs = [], gapAfterCol = isCases ? Math.max(colGap, 1 * s) : colGap;
    x = 0;
    for (c = 0; c < C; c++) {
        if (bars[c]) { x += 0.25 * s; }
        xs.push(x);
        x += colW[c] + (c < C - 1 ? gapAfterCol : 0);
    }
    if (bars[C]) { x += 0.25 * s; }
    inner.w = x;
    for (r = 0; r < R; r++) {
        y -= rowA[r];
        for (c = 0; c < C; c++) {
            cell = cells[r][c];
            var cx = spec[c] === 'l' ? xs[c] : spec[c] === 'r' ? xs[c] + colW[c] - cell.w : xs[c] + (colW[c] - cell.w) / 2;
            inner.add(cell, cx, y);
        }
        y -= rowD[r] + rowGap;
    }
    inner.a = Layout.AXIS * s + H / 2;
    inner.d = H / 2 - Layout.AXIS * s;
    for (k in bars) {
        if (!U.has(bars, k)) { continue; }
        c = parseInt(k, 10);
        var bx = c === 0 ? 0.1 * s : c >= C ? inner.w - 0.1 * s : xs[c] - Math.min(gapAfterCol / 2, 0.45 * s) + (bars[c] ? 0.1 * s : 0);
        if (c > 0 && c < C) { bx = xs[c] - (gapAfterCol + 0.25 * s) / 2; }
        inner.prims.push({ k: 'rule', x: bx - ctx.set.barThickness * s * 0.5, y: -inner.d, w: ctx.set.barThickness * s * 0.8, h: inner.a + inner.d, color: ctx.color, id: n.id, role: 'matrix-rule' });
    }
    delims = MathData.MATRIX_ENVS[env] || ['', ''];
    if (!delims[0] && !delims[1]) {
        b = Layout.hpack([Layout.empty(small ? 0.05 * s : 0.1 * s), inner, Layout.empty(small ? 0.05 * s : 0.1 * s)]);
        return b;
    }
    return Layout.wrapDelims(Layout.hpack([Layout.empty(0.08 * s), inner, Layout.empty(0.08 * s)]), delims[0] || '.', delims[1] || '.', ctx, n.id);
};

/* ---- Multiline ------------------------------------------------------------- */
Layout.NUMBERED_ENVS = { align: 1, gather: 1, equation: 1, multline: 1, eqnarray: 1, alignat: 1 };
Layout.lines = function (n, ctx) {
    var s = ctx.size, rows = n.rows, R = rows.length, r, c, C = 0, cells = [], colW = [], rowA = [], rowD = [], tags = [], tagW = 0,
        env = n.env, gather = /^(gather|gathered|equation|multline)/.test(env), aligned, inner, y, H = 0, gap = ctx.set.lineGap * s,
        xs = [], x, cell, counter = 0, cc = ctx, pairGap = 1.2 * s, tagGap = 1.5 * s, i, tb;
    for (r = 0; r < R; r++) { if (rows[r].cells.length > C) { C = rows[r].cells.length; } }
    aligned = !gather && C > 1;
    for (r = 0; r < R; r++) {
        cells.push([]);
        rowA.push(0.72 * s); rowD.push(0.28 * s);
        for (c = 0; c < C; c++) {
            if (rows[r].cells[c]) {
                cell = Layout.row(rows[r].cells[c], cc, { leadingOrd: aligned && c % 2 === 1 && rows[r].cells[c].items.length > 0 });
            } else { cell = new LBox(0, 0, 0); }
            cells[r].push(cell);
            colW[c] = Math.max(colW[c] || 0, cell.w);
            rowA[r] = Math.max(rowA[r], cell.a);
            rowD[r] = Math.max(rowD[r], cell.d);
        }
        tb = null;
        if (rows[r].tag) {
            tb = Layout.hpack([Layout.glyph('(', ctx, { face: 'text' }), Layout.row(rows[r].tag, Layout.ctxWith(ctx, { upright: true })), Layout.glyph(')', ctx, { face: 'text' })]);
        } else if (U.has(Layout.NUMBERED_ENVS, env) && !rows[r].notag) {
            counter++;
            tb = Layout.glyph('(' + counter + ')', ctx, { face: 'text', role: 'tag' });
        }
        tags.push(tb);
        if (tb) { tagW = Math.max(tagW, tb.w); rowA[r] = Math.max(rowA[r], tb.a); rowD[r] = Math.max(rowD[r], tb.d); }
    }
    x = 0;
    for (c = 0; c < C; c++) {
        xs.push(x);
        x += colW[c] + (aligned && c % 2 === 1 && c < C - 1 ? pairGap : 0);
    }
    var bodyW = x, totalW = bodyW + (tagW ? tagGap + tagW : 0);
    inner = new LBox(totalW, 0, 0);
    for (r = 0; r < R; r++) { H += rowA[r] + rowD[r] + (r ? gap : 0); }
    y = Layout.AXIS * s + H / 2;
    for (r = 0; r < R; r++) {
        y -= rowA[r];
        if (aligned) {
            for (c = 0; c < C; c++) {
                cell = cells[r][c];
                inner.add(cell, c % 2 === 0 ? xs[c] + colW[c] - cell.w : xs[c], y);
            }
        } else {
            var rowW = 0, rb;
            for (c = 0; c < C; c++) { rowW += cells[r][c].w; }
            var align = ctx.set.alignment, ox;
            if (env === 'multline' || env === 'multline*') { align = r === 0 ? 'left' : r === R - 1 ? 'right' : 'center'; }
            ox = align === 'left' ? 0 : align === 'right' ? bodyW - rowW : (bodyW - rowW) / 2;
            for (c = 0; c < C; c++) { inner.add(cells[r][c], ox, y); ox += cells[r][c].w; }
        }
        if (tags[r]) { inner.add(tags[r], totalW - tags[r].w, y); }
        y -= rowD[r] + gap;
    }
    inner.a = Layout.AXIS * s + H / 2;
    inner.d = H / 2 - Layout.AXIS * s;
    return inner;
};

/* ---- Entry point -------------------------------------------------------------- */
/* opts: {metrics, placeholders, highlight, fontInfo} */
Layout.compute = function (root, settings, opts) {
    var set = Formatting.clean(settings), ctx, box, out;
    opts = opts || {};
    AST.validate(root);
    ctx = {
        set: set, metrics: opts.metrics || Layout.ApproxMetrics, baseSize: set.fontSize, scale: 1,
        style: set.displayStyle ? 'D' : 'T', size: set.fontSize, cramped: false, color: set.color, bold: set.bold,
        italicOverride: null, upright: false, face: 'math', variant: null, unit: false, placeholders: !!opts.placeholders,
        fontOverride: null, middleHeight: 0
    };
    box = Layout.row(root, ctx);
    out = { width: box.w, ascent: box.a, descent: box.d, prims: [], regions: [], settings: set };
    Layout.flatten(box, 0, 0, out, 0);
    return out;
};
Layout.flatten = function (box, ox, oy, out, depth) {
    var i, p, q, k, j;
    if (box.id) { out.regions.push({ id: box.id, x: ox, y: oy, w: box.w, a: box.a, d: box.d, depth: depth }); }
    for (i = 0; i < box.prims.length; i++) {
        p = box.prims[i];
        q = {};
        for (k in p) { if (U.has(p, k)) { q[k] = p[k]; } }
        if (p.k === 'text' || p.k === 'rule') { q.x = p.x + ox; q.y = p.y + oy; }
        else if (p.k === 'path') {
            q.pts = [];
            for (j = 0; j < p.pts.length; j++) {
                q.pts.push({ a: [p.pts[j].a[0] + ox, p.pts[j].a[1] + oy], l: [p.pts[j].l[0] + ox, p.pts[j].l[1] + oy], r: [p.pts[j].r[0] + ox, p.pts[j].r[1] + oy] });
            }
        }
        out.prims.push(q);
    }
    for (i = 0; i < box.kids.length; i++) { Layout.flatten(box.kids[i][0], ox + box.kids[i][1], oy + box.kids[i][2], out, depth + 1); }
};
/* Smallest region containing a point (preview hit testing). */
Layout.hitTest = function (result, x, y) {
    var i, r, best = null, area, bestArea = Infinity;
    for (i = 0; i < result.regions.length; i++) {
        r = result.regions[i];
        if (x >= r.x && x <= r.x + Math.max(r.w, 1) && y <= r.y + r.a && y >= r.y - r.d) {
            area = Math.max(r.w, 1) * Math.max(r.a + r.d, 1);
            if (area < bestArea || (area === bestArea && r.depth > best.depth)) { bestArea = area; best = r; }
        }
    }
    return best;
};
Layout.regionOf = function (result, id) {
    var i;
    for (i = 0; i < result.regions.length; i++) { if (result.regions[i].id === id) { return result.regions[i]; } }
    return null;
};
/* Overall ink bounds of the primitives: {left, right, top, bottom} */
Layout.bounds = function (result) {
    var l = 0, r = result.width, t = result.ascent, b = -result.descent, i, p, j;
    for (i = 0; i < result.prims.length; i++) {
        p = result.prims[i];
        if (p.k === 'rule') { l = Math.min(l, p.x); r = Math.max(r, p.x + p.w); t = Math.max(t, p.y + p.h); b = Math.min(b, p.y); }
        else if (p.k === 'path') { for (j = 0; j < p.pts.length; j++) { l = Math.min(l, p.pts[j].a[0]); r = Math.max(r, p.pts[j].a[0]); t = Math.max(t, p.pts[j].a[1]); b = Math.min(b, p.pts[j].a[1]); } }
    }
    return { left: l, right: r, top: t, bottom: b };
};
