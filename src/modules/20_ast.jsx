/* ==========================================================================
 * Module 20 - Shared mathematical expression model (AST)
 *
 * Every expression is a tree of nodes. Every child container is a 'row'
 * node (an ordered horizontal sequence), so structures nest arbitrarily:
 *
 *   row        { items:[node] }                       horizontal group
 *   number     { text }                               3.14
 *   variable   { text }                               x, alpha (italic)
 *   operator   { text, cls }                          + = , ( (TeX class)
 *   symbol     { text, cls }                          infinity, nabla
 *   func       { name, display, limits, lower:row? }  sin, lim_{x->0}
 *   text       { text, variant }                      \text{...}
 *   space      { width (em) }
 *   frac       { num:row, den:row, mode, role? }      fraction / derivative
 *   binom      { top:row, bottom:row }
 *   root       { body:row, index:row|null }
 *   scripts    { base:row, sup?, sub?, presup?, presub? }
 *   fenced     { left, right, body:row, explicit }
 *   matrix     { env, rows:[[row]], colspec }
 *   bigop      { symbol, name, lower?, upper?, limits }
 *   accent     { accent, body:row, label:row|null }
 *   font       { variant, body:row }
 *   xarrow     { arrow, over:row|null, under:row|null }
 *   stack      { base:row, over:row|null, under:row|null }
 *   boxed      { body:row }
 *   chem       { src, body:row }                      \ce{...}
 *   lines      { env, rows:[{cells:[row], tag:row|null, notag}] }
 *   delim      { text, size }                         \big( etc.
 *
 * Common optional properties: id, style {color,bold,italic,font,scale,dy},
 * meta {role}.
 * ========================================================================== */
var AST = {};
AST._next = 1;
AST.newId = function () { return 'n' + (AST._next++); };

AST.NODE_TYPES = ['row', 'number', 'variable', 'operator', 'symbol', 'func', 'text', 'space', 'frac', 'binom', 'root',
    'scripts', 'fenced', 'matrix', 'bigop', 'accent', 'font', 'xarrow', 'stack', 'boxed', 'chem', 'lines', 'delim'];
AST.TYPE_LABELS = {
    row: 'Group', number: 'Number', variable: 'Variable', operator: 'Operator', symbol: 'Symbol', func: 'Function',
    text: 'Text', space: 'Space', frac: 'Fraction', binom: 'Binomial', root: 'Root', scripts: 'Scripts', fenced: 'Brackets',
    matrix: 'Matrix', bigop: 'Large operator', accent: 'Accent', font: 'Font style', xarrow: 'Labeled arrow',
    stack: 'Stacked', boxed: 'Boxed', chem: 'Chemical formula', lines: 'Multiline', delim: 'Sized delimiter'
};
/* Slot names per node type (all slots are rows or null). */
AST.SLOTS = {
    frac: ['num', 'den'], binom: ['top', 'bottom'], root: ['index', 'body'], scripts: ['presup', 'presub', 'base', 'sup', 'sub'],
    fenced: ['body'], bigop: ['upper', 'lower'], accent: ['body', 'label'], font: ['body'], xarrow: ['over', 'under'],
    stack: ['over', 'base', 'under'], boxed: ['body'], func: ['lower']
};
AST.SLOT_LABELS = {
    num: 'Numerator', den: 'Denominator', top: 'Top', bottom: 'Bottom', index: 'Root index', body: 'Content',
    base: 'Base', sup: 'Superscript', sub: 'Subscript', presup: 'Left superscript', presub: 'Left subscript',
    upper: 'Upper limit', lower: 'Lower limit', label: 'Label', over: 'Over', under: 'Under'
};

/* ---- Factories ----------------------------------------------------------- */
AST.row = function (items) { return { type: 'row', id: AST.newId(), items: items || [] }; };
AST.number = function (t) { return { type: 'number', id: AST.newId(), text: String(t) }; };
AST.variable = function (t) { return { type: 'variable', id: AST.newId(), text: t }; };
AST.operator = function (t, cls) { return { type: 'operator', id: AST.newId(), text: t, cls: cls || 'bin' }; };
AST.symbol = function (t, cls) { return { type: 'symbol', id: AST.newId(), text: t, cls: cls || 'ord' }; };
AST.func = function (name, display, limits) {
    return { type: 'func', id: AST.newId(), name: name, display: display || name, limits: !!limits, lower: null };
};
AST.text = function (t, variant) { return { type: 'text', id: AST.newId(), text: t, variant: variant || 'text' }; };
AST.space = function (w) { return { type: 'space', id: AST.newId(), width: w }; };
AST.frac = function (num, den, mode) {
    return { type: 'frac', id: AST.newId(), num: AST.asRow(num), den: AST.asRow(den), mode: mode || 'frac' };
};
AST.binom = function (top, bottom, mode) { return { type: 'binom', id: AST.newId(), top: AST.asRow(top), bottom: AST.asRow(bottom), mode: mode || 'binom' }; };
AST.root = function (body, index) {
    return { type: 'root', id: AST.newId(), body: AST.asRow(body), index: index ? AST.asRow(index) : null };
};
AST.scripts = function (base, sup, sub) {
    return { type: 'scripts', id: AST.newId(), base: AST.asRow(base), sup: sup ? AST.asRow(sup) : null,
        sub: sub ? AST.asRow(sub) : null, presup: null, presub: null };
};
AST.fenced = function (left, right, body, explicit) {
    return { type: 'fenced', id: AST.newId(), left: left, right: right, body: AST.asRow(body), explicit: !!explicit };
};
AST.matrix = function (env, rows, colspec) {
    return { type: 'matrix', id: AST.newId(), env: env || 'pmatrix', rows: rows || [[AST.row()]], colspec: colspec || '' };
};
AST.bigop = function (name, symbol, limits) {
    return { type: 'bigop', id: AST.newId(), name: name, symbol: symbol, lower: null, upper: null, limits: limits || 'auto' };
};
AST.accent = function (kind, body) { return { type: 'accent', id: AST.newId(), accent: kind, body: AST.asRow(body), label: null }; };
AST.font = function (variant, body) { return { type: 'font', id: AST.newId(), variant: variant, body: AST.asRow(body) }; };
AST.xarrow = function (arrow, over, under) {
    return { type: 'xarrow', id: AST.newId(), arrow: arrow, over: over ? AST.asRow(over) : null, under: under ? AST.asRow(under) : null };
};
AST.stack = function (base, over, under) {
    return { type: 'stack', id: AST.newId(), base: AST.asRow(base), over: over ? AST.asRow(over) : null, under: under ? AST.asRow(under) : null };
};
AST.boxed = function (body) { return { type: 'boxed', id: AST.newId(), body: AST.asRow(body) }; };
AST.chem = function (src, body) { return { type: 'chem', id: AST.newId(), src: src, body: AST.asRow(body) }; };
AST.lines = function (env, rows) { return { type: 'lines', id: AST.newId(), env: env || 'align*', rows: rows || [] }; };
AST.lineRow = function (cells, tag) { return { cells: cells || [AST.row()], tag: tag ? AST.asRow(tag) : null, notag: false }; };
AST.delim = function (t, size, cls) { return { type: 'delim', id: AST.newId(), text: t, size: size || 1, cls: cls || 'ord' }; };

/* Wrap a node / array / null as a row. */
AST.asRow = function (x) {
    if (!x) { return AST.row([]); }
    if (U.isArray(x)) { return AST.row(x); }
    if (x.type === 'row') { return x; }
    return AST.row([x]);
};

/* ---- Traversal ------------------------------------------------------------ */
/* Returns child rows as [{key, row, label}] in visual order. */
AST.childRows = function (node) {
    var out = [], slots, i, r, c, row;
    if (!node) { return out; }
    if (node.type === 'row') { return out; }
    if (node.type === 'matrix') {
        for (r = 0; r < node.rows.length; r++) {
            for (c = 0; c < node.rows[r].length; c++) {
                out.push({ key: 'cell:' + r + ':' + c, row: node.rows[r][c], label: 'Row ' + (r + 1) + ', column ' + (c + 1) });
            }
        }
        return out;
    }
    if (node.type === 'lines') {
        for (r = 0; r < node.rows.length; r++) {
            row = node.rows[r];
            for (c = 0; c < row.cells.length; c++) {
                out.push({ key: 'line:' + r + ':' + c, row: row.cells[c], label: 'Line ' + (r + 1) + (row.cells.length > 1 ? ', part ' + (c + 1) : '') });
            }
            if (row.tag) { out.push({ key: 'tag:' + r, row: row.tag, label: 'Line ' + (r + 1) + ' number' }); }
        }
        return out;
    }
    slots = AST.SLOTS[node.type];
    if (!slots) { return out; }
    for (i = 0; i < slots.length; i++) {
        if (node[slots[i]]) { out.push({ key: slots[i], row: node[slots[i]], label: AST.SLOT_LABELS[slots[i]] || slots[i] }); }
    }
    return out;
};
/* Depth-first walk. fn(node, parentRow, indexInRow, depth). Return false to stop descending. */
AST.walk = function (node, fn, parent, index, depth) {
    var i, kids;
    depth = depth || 0;
    if (!node) { return; }
    if (fn(node, parent || null, (typeof index === 'number') ? index : -1, depth) === false) { return; }
    if (node.type === 'row') {
        for (i = 0; i < node.items.length; i++) { AST.walk(node.items[i], fn, node, i, depth + 1); }
    } else if (node.type !== 'chem') {
        kids = AST.childRows(node);
        for (i = 0; i < kids.length; i++) { AST.walk(kids[i].row, fn, node, -1, depth + 1); }
    }
};
/* Locate a node by id. Returns {node, parent, index, owner, key} or null. */
AST.find = function (root, id) {
    var res = null;
    function visit(node, parentRow, index, owner, key) {
        var i, kids;
        if (res || !node) { return; }
        if (node.id === id) { res = { node: node, parent: parentRow, index: index, owner: owner, key: key }; return; }
        if (node.type === 'row') {
            for (i = 0; i < node.items.length; i++) { visit(node.items[i], node, i, null, null); }
        } else if (node.type !== 'chem') {
            kids = AST.childRows(node);
            for (i = 0; i < kids.length; i++) { visit(kids[i].row, null, -1, node, kids[i].key); }
        }
    }
    visit(root, null, -1, null, null);
    return res;
};
AST.count = function (root) { var n = 0; AST.walk(root, function () { n++; }); return n; };
AST.depth = function (root) { var d = 0; AST.walk(root, function (n, p, i, dep) { if (dep > d) { d = dep; } }); return d; };

/* Deep clone, assigning fresh ids (used for paste / duplicate / templates). */
AST.clone = function (node, keepIds) {
    var c = U.clone(node);
    if (!keepIds) { AST.walk(c, function (n) { n.id = AST.newId(); }); }
    return c;
};
/* Make sure every node has a unique id (after deserialization). */
AST.reassignIds = function (root) { AST.walk(root, function (n) { n.id = AST.newId(); }); return root; };

/* Canonical structural form: no ids/meta; used for equality & round-trip tests. */
AST.canonical = function (node) {
    function strip(v) {
        var out, k, i;
        if (v === null || typeof v !== 'object') { return v; }
        if (U.isArray(v)) { out = []; for (i = 0; i < v.length; i++) { out.push(strip(v[i])); } return out; }
        out = {};
        var keys = U.keys(v).sort();
        for (i = 0; i < keys.length; i++) {
            k = keys[i];
            if (k === 'id' || k === 'meta') { continue; }
            if (k === 'style' && (!v[k] || !U.keys(v[k]).length)) { continue; }
            out[k] = strip(v[k]);
        }
        return out;
    }
    return JSONX.stringify(strip(node));
};
AST.equal = function (a, b) { return AST.canonical(a) === AST.canonical(b); };

/* ---- Validation ----------------------------------------------------------- */
/* Strict schema validation for any tree that comes from storage/import.
   Throws MathError on failure. Never evaluates anything. */
AST.validate = function (root, maxNodes) {
    var count = 0, limit = maxNodes || 20000;
    function fail(msg) { throw new MathError(ErrorKind.STRUCTURE, msg); }
    function str(v, name, maxLen) {
        if (typeof v !== 'string') { fail(name + ' must be text'); }
        if (v.length > (maxLen || 5000)) { fail(name + ' is too long'); }
    }
    function rowOrNull(v, name, depth) { if (v === null || v === undefined) { return; } row(v, name, depth); }
    function row(v, name, depth) {
        if (!v || typeof v !== 'object' || v.type !== 'row' || !U.isArray(v.items)) { fail(name + ' must be a row'); }
        node(v, depth);
    }
    function style(s) {
        var k;
        if (s === undefined || s === null) { return; }
        if (typeof s !== 'object') { fail('Invalid style'); }
        for (k in s) {
            if (!U.has(s, k)) { continue; }
            if (!U.contains(['color', 'bold', 'italic', 'font', 'scale', 'dy'], k)) { fail('Unknown style property ' + k); }
        }
        if (s.color !== undefined && s.color !== null && !U.normalizeColor(s.color)) { fail('Invalid color'); }
        if (s.font !== undefined && s.font !== null) { str(s.font, 'Font', 200); }
        if (s.scale !== undefined && s.scale !== null && (!U.isNumber(s.scale) || s.scale <= 0 || s.scale > 10)) { fail('Invalid scale'); }
        if (s.dy !== undefined && s.dy !== null && (!U.isNumber(s.dy) || Math.abs(s.dy) > 10)) { fail('Invalid baseline shift'); }
    }
    function node(n, depth) {
        var i, j, t;
        if (++count > limit) { fail('Expression is too large'); }
        if (depth > 120) { fail('Expression is nested too deeply'); }
        if (!n || typeof n !== 'object') { fail('Invalid node'); }
        t = n.type;
        if (!U.contains(AST.NODE_TYPES, t)) { fail('Unknown node type "' + t + '"'); }
        style(n.style);
        switch (t) {
        case 'row':
            if (!U.isArray(n.items)) { fail('Row without items'); }
            for (i = 0; i < n.items.length; i++) { node(n.items[i], depth + 1); }
            break;
        case 'number': case 'variable': str(n.text, 'Text'); break;
        case 'operator': case 'symbol': case 'delim': str(n.text, 'Text'); if (n.cls !== undefined) { str(n.cls, 'Class', 10); } break;
        case 'func': str(n.name, 'Function name', 100); rowOrNull(n.lower, 'Lower limit', depth + 1); break;
        case 'text': str(n.text, 'Text'); break;
        case 'space': if (!U.isNumber(n.width) || Math.abs(n.width) > 50) { fail('Invalid space'); } break;
        case 'frac': row(n.num, 'Numerator', depth + 1); row(n.den, 'Denominator', depth + 1); break;
        case 'binom': row(n.top, 'Top', depth + 1); row(n.bottom, 'Bottom', depth + 1); break;
        case 'root': row(n.body, 'Radicand', depth + 1); rowOrNull(n.index, 'Root index', depth + 1); break;
        case 'scripts':
            row(n.base, 'Base', depth + 1); rowOrNull(n.sup, 'Superscript', depth + 1); rowOrNull(n.sub, 'Subscript', depth + 1);
            rowOrNull(n.presup, 'Left superscript', depth + 1); rowOrNull(n.presub, 'Left subscript', depth + 1);
            break;
        case 'fenced': str(n.left, 'Delimiter', 4); str(n.right, 'Delimiter', 4); row(n.body, 'Bracket content', depth + 1); break;
        case 'matrix':
            str(n.env, 'Environment', 20);
            if (!U.isArray(n.rows) || !n.rows.length) { fail('Matrix without rows'); }
            if (n.rows.length > 100) { fail('Matrix has too many rows'); }
            for (i = 0; i < n.rows.length; i++) {
                if (!U.isArray(n.rows[i]) || !n.rows[i].length || n.rows[i].length > 100) { fail('Invalid matrix row'); }
                for (j = 0; j < n.rows[i].length; j++) { row(n.rows[i][j], 'Matrix cell', depth + 1); }
            }
            break;
        case 'bigop': str(n.symbol, 'Operator', 4); rowOrNull(n.lower, 'Lower limit', depth + 1); rowOrNull(n.upper, 'Upper limit', depth + 1); break;
        case 'accent': str(n.accent, 'Accent', 30); row(n.body, 'Accent content', depth + 1); rowOrNull(n.label, 'Label', depth + 1); break;
        case 'font': str(n.variant, 'Variant', 10); row(n.body, 'Content', depth + 1); break;
        case 'xarrow': str(n.arrow, 'Arrow', 30); rowOrNull(n.over, 'Over', depth + 1); rowOrNull(n.under, 'Under', depth + 1); break;
        case 'stack': row(n.base, 'Base', depth + 1); rowOrNull(n.over, 'Over', depth + 1); rowOrNull(n.under, 'Under', depth + 1); break;
        case 'boxed': row(n.body, 'Content', depth + 1); break;
        case 'chem': str(n.src, 'Chemical formula'); row(n.body, 'Chemical body', depth + 1); break;
        case 'lines':
            if (!U.isArray(n.rows)) { fail('Multiline without rows'); }
            for (i = 0; i < n.rows.length; i++) {
                if (!n.rows[i] || !U.isArray(n.rows[i].cells)) { fail('Invalid line'); }
                for (j = 0; j < n.rows[i].cells.length; j++) { row(n.rows[i].cells[j], 'Line cell', depth + 1); }
                rowOrNull(n.rows[i].tag, 'Equation number', depth + 1);
            }
            break;
        }
    }
    row(root, 'Expression', 0);
    return true;
};

/* Human-readable description of a node (tree view, status bar). */
AST.describe = function (n) {
    var l = AST.TYPE_LABELS[n.type] || n.type;
    switch (n.type) {
    case 'number': case 'variable': case 'symbol': case 'operator': case 'delim': return n.text + '  (' + l + ')';
    case 'func': return n.display + '  (Function)';
    case 'text': return '"' + n.text + '"  (Text)';
    case 'space': return 'Space ' + U.round(n.width, 3) + ' em';
    case 'frac': return (n.meta && n.meta.role === 'derivative') ? 'Derivative (fraction)' : 'Fraction';
    case 'root': return n.index ? 'Root (with index)' : 'Square root';
    case 'scripts': return 'Scripts (' + (n.sup ? 'sup' : '') + (n.sup && n.sub ? '+' : '') + (n.sub ? 'sub' : '') + ((n.presup || n.presub) ? ', prescripts' : '') + ')';
    case 'fenced': return 'Brackets ' + (n.left || '.') + ' ' + (n.right || '.');
    case 'matrix': return 'Matrix ' + n.rows.length + '\u00D7' + (n.rows[0] ? n.rows[0].length : 0) + ' (' + n.env + ')';
    case 'bigop': return n.symbol + '  (' + l + ')';
    case 'accent': return 'Accent: ' + n.accent;
    case 'font': return 'Font: ' + n.variant;
    case 'xarrow': return 'Arrow: ' + n.arrow;
    case 'chem': return 'Chemistry: ' + n.src;
    case 'lines': return 'Multiline (' + n.rows.length + ' lines, ' + n.env + ')';
    default: return l;
    }
};
/* TeX atom class of a node, used for spacing. Returns [leftClass, rightClass]. */
AST.atomClass = function (n) {
    var c;
    switch (n.type) {
    case 'number': case 'variable': case 'text': return ['ord', 'ord'];
    case 'symbol': case 'operator': case 'delim': c = n.cls || 'ord'; return [c, c];
    case 'func': case 'bigop': return ['op', 'op'];
    case 'frac': case 'binom': return ['inner', 'inner'];
    case 'fenced': return n.explicit ? ['inner', 'inner'] : ['open', 'close'];
    case 'scripts':
        if (n.base && n.base.items.length === 1 && !n.presup && !n.presub) { c = AST.atomClass(n.base.items[0]); return c; }
        return ['ord', 'ord'];
    case 'xarrow': return ['rel', 'rel'];
    case 'stack':
        if (n.base && n.base.items.length === 1) { return AST.atomClass(n.base.items[0]); }
        return ['ord', 'ord'];
    case 'font': case 'row':
        return ['ord', 'ord'];
    default: return ['ord', 'ord'];
    }
};
