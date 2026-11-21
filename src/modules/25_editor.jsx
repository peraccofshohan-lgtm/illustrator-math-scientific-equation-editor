/* ==========================================================================
 * Module 25 - Structural editing operations (used by the visual builder)
 * All operations mutate the given root in place and return the id of the
 * node that should become selected. The application snapshots the model
 * into the undo history before every operation.
 * ========================================================================== */
var Editor = {};

/* Path from root to node: [{node, key}] where key is how the next step is reached. */
Editor.path = function (root, id) {
    var result = null;
    function visit(node, trail) {
        var i, kids, t;
        if (result || !node) { return; }
        t = trail.concat([node]);
        if (node.id === id) { result = t; return; }
        if (node.type === 'row') { for (i = 0; i < node.items.length; i++) { visit(node.items[i], t); } }
        else if (node.type !== 'chem') {
            kids = AST.childRows(node);
            for (i = 0; i < kids.length; i++) { visit(kids[i].row, t); }
        }
    }
    visit(root, []);
    return result;
};
Editor.enclosing = function (root, id, type) {
    var p = Editor.path(root, id), i;
    if (!p) { return null; }
    for (i = p.length - 1; i >= 0; i--) { if (p[i].type === type) { return { node: p[i], path: p, depthIndex: i }; } }
    return null;
};
/* Where to insert new content given the current selection. */
Editor.insertionPoint = function (root, selId) {
    var f;
    if (!selId) { return { row: root, index: root.items.length }; }
    f = AST.find(root, selId);
    if (!f) { return { row: root, index: root.items.length }; }
    if (f.node.type === 'row') { return { row: f.node, index: f.node.items.length }; }
    if (f.parent) { return { row: f.parent, index: f.index + 1 }; }
    return { row: root, index: root.items.length };
};
Editor.insert = function (root, selId, nodes) {
    var ip = Editor.insertionPoint(root, selId), i;
    if (!nodes || !nodes.length) { return selId; }
    for (i = 0; i < nodes.length; i++) { ip.row.items.splice(ip.index + i, 0, nodes[i]); }
    return Editor.firstEmptySlot(nodes[0]) || nodes[nodes.length - 1].id;
};
/* First empty row inside a node (so the user can immediately fill it). */
Editor.firstEmptySlot = function (node) {
    var found = null;
    AST.walk(node, function (n) {
        if (found) { return false; }
        if (n.type === 'row' && n.id !== node.id && !n.items.length) { found = n.id; return false; }
    });
    return found;
};
Editor.OPTIONAL_SLOTS = { sup: 1, sub: 1, presup: 1, presub: 1, index: 1, lower: 1, upper: 1, label: 1, over: 1, under: 1 };

Editor.remove = function (root, id) {
    var f = AST.find(root, id), sel, p, k;
    if (!f) { return null; }
    if (f.node === root) { root.items = []; return root.id; }
    if (f.node.type === 'row' && f.owner) {
        k = f.key;
        if (U.has(Editor.OPTIONAL_SLOTS, k)) {
            f.owner[k] = null;
            if (f.owner.type === 'scripts' && !f.owner.sup && !f.owner.sub && !f.owner.presup && !f.owner.presub) {
                return Editor.unwrapScripts(root, f.owner.id);
            }
            return f.owner.id;
        }
        if (/^tag:/.test(k)) { f.owner.rows[parseInt(k.split(':')[1], 10)].tag = null; return f.owner.id; }
        f.node.items = [];
        return f.node.id;
    }
    if (f.parent) {
        f.parent.items.splice(f.index, 1);
        if (f.parent.items.length) {
            sel = f.parent.items[Math.max(0, f.index - 1)];
            return sel.id;
        }
        return f.parent.id;
    }
    p = Editor.path(root, id);
    return p && p.length > 1 ? p[p.length - 2].id : root.id;
};
/* Replace a scripts node by its base content. */
Editor.unwrapScripts = function (root, id) {
    var f = AST.find(root, id), items;
    if (!f || !f.parent) { return root.id; }
    items = f.node.base.items;
    Array.prototype.splice.apply(f.parent.items, [f.index, 1].concat(items));
    return items.length ? items[items.length - 1].id : f.parent.id;
};
Editor.replace = function (root, id, nodes) {
    var f = AST.find(root, id);
    if (!f) { return null; }
    if (f.node.type === 'row') { f.node.items = nodes; return f.node.id; }
    if (!f.parent) { return null; }
    Array.prototype.splice.apply(f.parent.items, [f.index, 1].concat(nodes));
    return nodes.length ? nodes[nodes.length - 1].id : f.parent.id;
};
/* Replace an element's content with parsed syntax. */
Editor.setContent = function (root, id, latex, opts) {
    var parsed = Parser.parse(latex, opts).root, f = AST.find(root, id);
    if (!f) { throw new MathError(ErrorKind.STRUCTURE, 'The selected element no longer exists.'); }
    if (f.node.type === 'row') {
        f.node.items = parsed.items;
        if (parsed.style) { f.node.style = parsed.style; }
        return f.node.id;
    }
    return Editor.replace(root, id, parsed.items);
};
Editor.duplicate = function (root, id) {
    var f = AST.find(root, id), c;
    if (!f || !f.parent) { return id; }
    c = AST.clone(f.node);
    f.parent.items.splice(f.index + 1, 0, c);
    return c.id;
};
Editor.move = function (root, id, dir) {
    var f = AST.find(root, id), j, t;
    if (!f || !f.parent) { return id; }
    j = f.index + (dir < 0 ? -1 : 1);
    if (j < 0 || j >= f.parent.items.length) { return id; }
    t = f.parent.items[j];
    f.parent.items[j] = f.node;
    f.parent.items[f.index] = t;
    return id;
};

/* ---- Wrapping the selection into a new structure ----------------------------- */
Editor.WRAPS = {
    frac: 'Fraction (as numerator)', fracden: 'Fraction (as denominator)', sqrt: 'Square root', nroot: 'nth root',
    sup: 'Superscript base', sub: 'Subscript base', subsup: 'Sub+superscript base', paren: 'Parentheses',
    bracket: 'Square brackets', brace: 'Curly braces', abs: 'Absolute value', norm: 'Norm', floor: 'Floor',
    ceil: 'Ceiling', angle: 'Angle brackets', vec: 'Vector arrow', hat: 'Hat', bar: 'Bar', overline: 'Overline',
    underline: 'Underline', dot: 'Dot', ddot: 'Double dot', tilde: 'Tilde', boxed: 'Box', bold: 'Bold', upright: 'Upright',
    overbrace: 'Overbrace', underbrace: 'Underbrace', unit: 'Unit'
};
Editor.wrapNodes = function (kind, items) {
    var body = AST.row(items), n;
    switch (kind) {
    case 'frac': return AST.frac(body, AST.row(), 'frac');
    case 'fracden': return AST.frac(AST.row(), body, 'frac');
    case 'sqrt': return AST.root(body, null);
    case 'nroot': return AST.root(body, AST.row());
    case 'sup': return AST.scripts(body, AST.row(), null);
    case 'sub': return AST.scripts(body, null, AST.row());
    case 'subsup': return AST.scripts(body, AST.row(), AST.row());
    case 'paren': return AST.fenced('(', ')', body, true);
    case 'bracket': return AST.fenced('[', ']', body, true);
    case 'brace': return AST.fenced('{', '}', body, true);
    case 'abs': return AST.fenced('|', '|', body, true);
    case 'norm': return AST.fenced('\u2016', '\u2016', body, true);
    case 'floor': return AST.fenced('\u230A', '\u230B', body, true);
    case 'ceil': return AST.fenced('\u2308', '\u2309', body, true);
    case 'angle': return AST.fenced('\u27E8', '\u27E9', body, true);
    case 'boxed': return AST.boxed(body);
    case 'bold': return AST.font('bf', body);
    case 'upright': return AST.font('rm', body);
    case 'unit': return AST.font('unit', body);
    case 'overbrace': case 'underbrace':
        n = AST.accent(kind, body);
        n.label = AST.row();
        return n;
    default:
        if (U.has(Editor.WRAPS, kind)) { return AST.accent(kind, body); }
    }
    throw new MathError(ErrorKind.STRUCTURE, 'Unknown structure "' + kind + '"');
};
Editor.wrap = function (root, id, kind) {
    var f = AST.find(root, id), n;
    if (!f) { throw new MathError(ErrorKind.STRUCTURE, 'Select an element to wrap.'); }
    if (f.node.type === 'row') {
        n = Editor.wrapNodes(kind, f.node.items);
        f.node.items = [n];
    } else {
        if (!f.parent) { throw new MathError(ErrorKind.STRUCTURE, 'This element cannot be wrapped.'); }
        n = Editor.wrapNodes(kind, [f.node]);
        f.parent.items[f.index] = n;
    }
    return Editor.firstEmptySlot(n) || n.id;
};

/* ---- Optional slots (scripts, root index, limits, labels) -------------------- */
Editor.toggleSlot = function (root, id, slot) {
    var f = AST.find(root, id), n, target;
    if (!f) { return id; }
    n = f.node;
    if (n.type === 'row' && f.owner) { n = f.owner; }
    if (n.type === 'row') { return id; }
    if (!U.has(Editor.OPTIONAL_SLOTS, slot) || !U.contains(AST.SLOTS[n.type] || [], slot)) {
        /* turn a plain element into a scripts node */
        if ((slot === 'sup' || slot === 'sub' || slot === 'presup' || slot === 'presub') && f.parent) {
            target = AST.scripts(AST.row([n]), null, null);
            target[slot] = AST.row();
            f.parent.items[f.index] = target;
            return target[slot].id;
        }
        throw new MathError(ErrorKind.STRUCTURE, (AST.TYPE_LABELS[n.type] || n.type) + ' has no "' + (AST.SLOT_LABELS[slot] || slot) + '" slot.');
    }
    if (n[slot]) {
        n[slot] = null;
        if (n.type === 'scripts' && !n.sup && !n.sub && !n.presup && !n.presub) { return Editor.unwrapScripts(root, n.id); }
        return n.id;
    }
    n[slot] = AST.row();
    return n[slot].id;
};
Editor.cycleLimits = function (root, id) {
    var f = AST.find(root, id), n = f ? f.node : null;
    if (!n || (n.type !== 'bigop' && n.type !== 'func')) { throw new MathError(ErrorKind.STRUCTURE, 'Select a large operator or limit function.'); }
    if (n.type === 'func') { n.limits = !n.limits; return id; }
    n.limits = (n.limits === 'auto') ? 'limits' : (n.limits === 'limits') ? 'nolimits' : 'auto';
    return id;
};

/* ---- Matrix operations ----------------------------------------------------- */
Editor.matrixContext = function (root, id) {
    var p = Editor.path(root, id), i, m, cell, r, c;
    if (!p) { return null; }
    for (i = p.length - 1; i >= 0; i--) {
        if (p[i].type === 'matrix') {
            m = p[i];
            cell = (i + 1 < p.length) ? p[i + 1] : null;
            for (r = 0; r < m.rows.length; r++) {
                for (c = 0; c < m.rows[r].length; c++) { if (cell && m.rows[r][c] === cell) { return { m: m, r: r, c: c }; } }
            }
            return { m: m, r: m.rows.length - 1, c: m.rows[0].length - 1 };
        }
    }
    return null;
};
Editor.matrixOp = function (root, id, op, a, b) {
    var ctx = Editor.matrixContext(root, id), m, r, c, i, row, cols;
    if (!ctx) { throw new MathError(ErrorKind.STRUCTURE, 'Select a matrix or one of its cells first.'); }
    m = ctx.m; r = ctx.r; c = ctx.c;
    cols = m.rows[0].length;
    switch (op) {
    case 'rowAbove': case 'rowBelow':
        if (m.rows.length >= 100) { throw new MathError(ErrorKind.STRUCTURE, 'Matrices are limited to 100 rows.'); }
        row = [];
        for (i = 0; i < cols; i++) { row.push(AST.row()); }
        m.rows.splice(op === 'rowAbove' ? r : r + 1, 0, row);
        return row[Math.min(c, cols - 1)].id;
    case 'colLeft': case 'colRight':
        if (cols >= 100) { throw new MathError(ErrorKind.STRUCTURE, 'Matrices are limited to 100 columns.'); }
        for (i = 0; i < m.rows.length; i++) { m.rows[i].splice(op === 'colLeft' ? c : c + 1, 0, AST.row()); }
        if (m.colspec) { m.colspec = Editor.colspecInsert(m.colspec, op === 'colLeft' ? c : c + 1); }
        return m.rows[r][op === 'colLeft' ? c : c + 1].id;
    case 'delRow':
        if (m.rows.length <= 1) { throw new MathError(ErrorKind.STRUCTURE, 'A matrix needs at least one row. Delete the matrix instead.'); }
        m.rows.splice(r, 1);
        return m.rows[Math.min(r, m.rows.length - 1)][c].id;
    case 'delCol':
        if (cols <= 1) { throw new MathError(ErrorKind.STRUCTURE, 'A matrix needs at least one column. Delete the matrix instead.'); }
        for (i = 0; i < m.rows.length; i++) { m.rows[i].splice(c, 1); }
        if (m.colspec) { m.colspec = Editor.colspecDelete(m.colspec, c); }
        return m.rows[r][Math.min(c, cols - 2)].id;
    case 'resize':
        a = U.clamp(Math.floor(a), 1, 100); b = U.clamp(Math.floor(b), 1, 100);
        while (m.rows.length > a) { m.rows.pop(); }
        while (m.rows.length < a) { row = []; for (i = 0; i < m.rows[0].length; i++) { row.push(AST.row()); } m.rows.push(row); }
        for (i = 0; i < m.rows.length; i++) {
            while (m.rows[i].length > b) { m.rows[i].pop(); }
            while (m.rows[i].length < b) { m.rows[i].push(AST.row()); }
        }
        if (m.colspec) { m.colspec = U.repeat('c', b); }
        return m.id;
    case 'env':
        m.env = a;
        if ((a === 'array') && !m.colspec) { m.colspec = U.repeat('c', cols); }
        return m.id;
    }
    throw new MathError(ErrorKind.STRUCTURE, 'Unknown matrix operation ' + op);
};
Editor.colspecInsert = function (spec, at) {
    var out = '', n = 0, i, ch;
    for (i = 0; i <= spec.length; i++) {
        if (n === at && (i === spec.length || spec.charAt(i) !== '|')) { out += 'c'; n = -1000; }
        if (i < spec.length) { ch = spec.charAt(i); out += ch; if (ch !== '|') { n++; } }
    }
    return out;
};
Editor.colspecDelete = function (spec, at) {
    var out = '', n = 0, i, ch;
    for (i = 0; i < spec.length; i++) {
        ch = spec.charAt(i);
        if (ch !== '|') { if (n !== at) { out += ch; } n++; } else { out += ch; }
    }
    return out;
};

/* ---- Multiline operations -------------------------------------------------- */
Editor.linesOp = function (root, id, op) {
    var p = Editor.path(root, id), i, L = null, cell = null, r, c, lr, ncells;
    if (p) { for (i = p.length - 1; i >= 0; i--) { if (p[i].type === 'lines') { L = p[i]; cell = p[i + 1] || null; break; } } }
    if (!L) { throw new MathError(ErrorKind.STRUCTURE, 'Select a multiline equation or one of its lines.'); }
    r = L.rows.length - 1;
    for (i = 0; i < L.rows.length; i++) {
        for (c = 0; c < L.rows[i].cells.length; c++) { if (L.rows[i].cells[c] === cell || L.rows[i].tag === cell) { r = i; } }
    }
    switch (op) {
    case 'add':
        ncells = L.rows[r] ? L.rows[r].cells.length : 1;
        lr = AST.lineRow([], null);
        lr.cells = [];
        for (i = 0; i < ncells; i++) { lr.cells.push(AST.row()); }
        L.rows.splice(r + 1, 0, lr);
        return lr.cells[0].id;
    case 'del':
        if (L.rows.length <= 1) { throw new MathError(ErrorKind.STRUCTURE, 'A multiline equation needs at least one line.'); }
        L.rows.splice(r, 1);
        return L.rows[Math.min(r, L.rows.length - 1)].cells[0].id;
    case 'tag':
        lr = L.rows[r];
        if (lr.tag) { lr.tag = null; lr.notag = true; return lr.cells[0].id; }
        lr.tag = AST.row();
        lr.notag = false;
        return lr.tag.id;
    }
    throw new MathError(ErrorKind.STRUCTURE, 'Unknown multiline operation ' + op);
};

/* ---- Element formatting ------------------------------------------------------ */
Editor.setStyle = function (root, id, style) {
    var f = AST.find(root, id), n, k, st;
    if (!f) { throw new MathError(ErrorKind.STRUCTURE, 'Select an element to format.'); }
    n = f.node;
    if (n.type === 'row' && n.items.length === 1 && n !== root) { n = n.items[0]; }
    st = n.style ? U.clone(n.style) : {};
    for (k in style) {
        if (!U.has(style, k)) { continue; }
        if (style[k] === null || style[k] === undefined || style[k] === '') { delete st[k]; }
        else { st[k] = style[k]; }
    }
    if (st.color) { st.color = U.normalizeColor(st.color); if (!st.color) { delete st.color; } }
    if (U.keys(st).length) { n.style = st; } else { delete n.style; }
    return n.id;
};
Editor.clearStyle = function (root, id) {
    var f = AST.find(root, id);
    if (!f) { return id; }
    AST.walk(f.node, function (n) { delete n.style; });
    return id;
};

/* ---- Structure factories (Insert buttons). Built from syntax snippets so the
   builder and the parser always agree on structure. ------------------------ */
Editor.SNIPPETS = {
    frac: '\\frac{}{}', dfrac: '\\dfrac{}{}', sqrt: '\\sqrt{}', cbrt: '\\sqrt[3]{}', root4: '\\sqrt[4]{}', nroot: '\\sqrt[]{}',
    sup: '{}^{}', sub: '{}_{}', subsup: '{}_{}^{}', prescript: '\\prescript{}{}{}',
    paren: '\\left(  \\right)', bracket: '\\left[  \\right]', brace: '\\left\\{  \\right\\}', abs: '\\left|  \\right|',
    norm: '\\left\\|  \\right\\|', floor: '\\left\\lfloor  \\right\\rfloor', ceil: '\\left\\lceil  \\right\\rceil',
    angle: '\\left\\langle  \\right\\rangle',
    sum: '\\sum_{i=1}^{n} {}', prod: '\\prod_{i=1}^{n} {}', coprod: '\\coprod_{i=1}^{n} {}',
    bigcup: '\\bigcup_{i=1}^{n} {}', bigcap: '\\bigcap_{i=1}^{n} {}',
    vec: '\\vec{}', hat: '\\hat{}', bar: '\\bar{}', dot: '\\dot{}', ddot: '\\ddot{}', tilde: '\\tilde{}',
    overline: '\\overline{}', underline: '\\underline{}', widehat: '\\widehat{}', overrightarrow: '\\overrightarrow{}',
    overbrace: '\\overbrace{}^{}', underbrace: '\\underbrace{}_{}', boxed: '\\boxed{}', overset: '\\overset{}{}',
    underset: '\\underset{}{}', binom: '\\binom{}{}', text: '\\text{text}', unitvec: '\\hat{\\mathbf{i}}',
    boldvec: '\\mathbf{v}', bold: '\\mathbf{}', upright: '\\mathrm{}', bb: '\\mathbb{R}', cal: '\\mathcal{L}',
    tensor: 'T^{\\mu\\nu}{}_{\\rho}', sci: '\\sci{1.5}{-3}', chem: '\\ce{H2O}', unit: '\\,\\unit{m}',
    xarrow: '\\xrightarrow{}', xarrow2: '\\xrightarrow[]{}', equilibrium: '\\xrightleftharpoons{}',
    tag: '\\tag{1}', dots: '\\ldots', cdots: '\\cdots'
};
Editor.INTEGRALS = {
    indefinite: '\\int {} \\,\\mathrm{d}x', definite: '\\int_{a}^{b} {} \\,\\mathrm{d}x', 'double': '\\iint_{D} {} \\,\\mathrm{d}A',
    triple: '\\iiint_{V} {} \\,\\mathrm{d}V', contour: '\\oint_{C} {} \\,\\mathrm{d}s', surface: '\\oiint_{S} {} \\,\\mathrm{d}S',
    volume: '\\oiiint_{V} {} \\,\\mathrm{d}V', multiple: '\\int_{a}^{b}\\!\\int_{c}^{d} {} \\,\\mathrm{d}y\\,\\mathrm{d}x'
};
Editor.LIMITS = {
    limit: '\\lim_{x \\to a} {}', left: '\\lim_{x \\to a^{-}} {}', right: '\\lim_{x \\to a^{+}} {}',
    infinity: '\\lim_{x \\to \\infty} {}', multivariable: '\\lim_{(x,y) \\to (0,0)} {}'
};
Editor.derivativeSnippet = function (kind, order, v, f) {
    var n = U.trim(order || '') || '2', x = U.trim(v || '') || 'x', fn = U.trim(f || '') || 'f', d = '\\mathrm{d}';
    switch (kind) {
    case 'operator': return '\\frac{' + d + '}{' + d + x + '}';
    case 'first': return '\\frac{' + d + fn + '}{' + d + x + '}';
    case 'higher': return '\\frac{' + d + '^{' + n + '}' + fn + '}{' + d + x + '^{' + n + '}}';
    case 'partial': return '\\frac{\\partial ' + fn + '}{\\partial ' + x + '}';
    case 'partial2': return '\\frac{\\partial^{' + n + '} ' + fn + '}{\\partial ' + x + '^{' + n + '}}';
    case 'mixed': return '\\frac{\\partial^{2} ' + fn + '}{\\partial ' + x + '\\,\\partial y}';
    case 'total': return '\\frac{' + d + fn + '}{' + d + 't}';
    case 'prime': return fn + "'(" + x + ')';
    case 'prime2': return fn + "''(" + x + ')';
    case 'dot': return '\\dot{' + fn + '}';
    }
    throw new MathError(ErrorKind.STRUCTURE, 'Unknown derivative type ' + kind);
};
Editor.matrixSnippet = function (rows, cols, env, augmentCol) {
    var r, c, out = [], cells, spec;
    rows = U.clamp(Math.floor(rows) || 2, 1, 100);
    cols = U.clamp(Math.floor(cols) || 2, 1, 100);
    for (r = 0; r < rows; r++) {
        cells = [];
        for (c = 0; c < cols; c++) { cells.push(env === 'identity' ? (r === c ? '1' : '0') : env === 'zero' ? '0' : ''); }
        out.push(cells.join(' & '));
    }
    if (env === 'identity' || env === 'zero') { env = 'pmatrix'; }
    if (env === 'augmented') {
        spec = U.repeat('c', Math.max(1, cols - 1)) + '|c';
        return '\\left( \\begin{array}{' + spec + '} ' + out.join(' \\\\ ') + ' \\end{array} \\right)';
    }
    return '\\begin{' + env + '} ' + out.join(' \\\\ ') + ' \\end{' + env + '}';
};
Editor.casesSnippet = function (n) {
    var rows = [], i;
    n = U.clamp(Math.floor(n) || 2, 1, 50);
    for (i = 0; i < n; i++) { rows.push(' & \\text{if } '); }
    return '\\begin{cases}' + rows.join(' \\\\ ') + '\\end{cases}';
};
Editor.alignedSnippet = function (n, env) {
    var rows = [], i;
    n = U.clamp(Math.floor(n) || 2, 1, 50);
    for (i = 0; i < n; i++) { rows.push(' &=  '); }
    return '\\begin{' + (env || 'aligned') + '}' + rows.join(' \\\\ ') + '\\end{' + (env || 'aligned') + '}';
};
/* Parse a snippet into insertable nodes (fresh ids). */
Editor.fromSnippet = function (snippet, opts) {
    var r = Parser.parse(snippet, opts).root;
    return r.items;
};
