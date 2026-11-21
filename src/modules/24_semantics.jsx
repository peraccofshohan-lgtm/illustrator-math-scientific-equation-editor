/* ==========================================================================
 * Module 24 - Semantic analysis: operator precedence, associativity and
 * expression validation.
 *
 * Rows are kept flat for typesetting (exactly as TeX does), but every row
 * can be analysed into a precedence tree. Precedence (low -> high):
 *   punctuation  ,  ;                     (list, left-assoc)
 *   relation     = < <= -> in ...          (chained, left-assoc)
 *   additive     + - pm mp cup vee oplus   (left-assoc)
 *   multiplicative  times cdot div / * cap wedge otimes circ (left-assoc)
 *   unary prefix  - + pm neg              (right-assoc)
 *   juxtaposition (implicit multiplication / function application)
 *   postfix      ! prime                   (via scripts / close class)
 *   scripts      ^ _                       (right-assoc, bound in parser)
 * ========================================================================== */
var Semantics = {};
Semantics.ADDITIVE = '+\u2212\u00B1\u2213\u222A\u2228\u2295\u2296\u228E\u2294\u2214\u22BB';
Semantics.UNARY = '+\u2212\u00B1\u2213\u00AC';

Semantics.kind = function (n) {
    var c;
    if (n.type === 'operator') {
        c = n.cls;
        if (c === 'bin') { return Semantics.ADDITIVE.indexOf(n.text) >= 0 ? 'add' : 'mul'; }
        if (c === 'rel') { return 'rel'; }
        if (c === 'punct') { return 'punct'; }
        if (c === 'close' && (n.text === '!' || n.text === '?')) { return 'postfix'; }
        return 'operand';
    }
    if (n.type === 'symbol' && n.text === '/') { return 'mul'; }
    if (n.type === 'xarrow') { return 'rel'; }
    if (n.type === 'space') { return 'skip'; }
    return 'operand';
};

/* Build a precedence tree for one row. Returns {tree, issues}. */
Semantics.analyzeRow = function (row, opts) {
    var toks = [], issues = [], i, k, pos = 0;
    opts = opts || {};
    for (i = 0; i < row.items.length; i++) {
        k = Semantics.kind(row.items[i]);
        if (k !== 'skip') { toks.push({ k: k, n: row.items[i] }); }
    }
    function peek() { return toks[pos]; }
    function label(n) { return n.text || n.display || AST.TYPE_LABELS[n.type]; }
    function issue(msg, n) { issues.push({ message: msg, id: n ? n.id : null }); }

    function parseList() {
        var items = [parseRel()], t;
        while ((t = peek()) && t.k === 'punct') {
            pos++;
            if (!peek() || peek().k === 'punct') { items.push(null); continue; }
            items.push(parseRel());
        }
        return items.length === 1 ? items[0] : { op: ',', args: items };
    }
    function parseRel() {
        var left, t, args, ops = [];
        if (peek() && peek().k === 'rel') {
            if (!opts.allowLeadingRelation) { issue('Relation "' + label(peek().n) + '" has no left-hand side', peek().n); }
            left = null;
        } else { left = parseAdd(); }
        args = [left];
        while ((t = peek()) && t.k === 'rel') {
            pos++;
            ops.push(label(t.n));
            if (!peek() || peek().k === 'punct' || peek().k === 'rel') {
                if (!opts.allowTrailingRelation) { issue('Relation "' + label(t.n) + '" has no right-hand side', t.n); }
                args.push(null);
            } else { args.push(parseAdd()); }
        }
        return ops.length ? { op: 'rel', ops: ops, args: args } : left;
    }
    function parseAdd() {
        var left = parseMul(), t, right;
        while ((t = peek()) && t.k === 'add') {
            pos++;
            right = (peek() && (peek().k === 'operand' || peek().k === 'add' || peek().k === 'mul')) ? parseMul() : null;
            if (!right) { issue('Operator "' + label(t.n) + '" is missing its right operand', t.n); }
            left = { op: label(t.n), args: [left, right] };
        }
        return left;
    }
    function parseMul() {
        var left = parseUnary(), t, right;
        while ((t = peek()) && t.k === 'mul') {
            pos++;
            right = (peek() && (peek().k === 'operand' || peek().k === 'add')) ? parseUnary() : null;
            if (!right) { issue('Operator "' + label(t.n) + '" is missing its right operand', t.n); }
            left = { op: label(t.n), args: [left, right] };
        }
        return left;
    }
    function parseUnary() {
        var t = peek();
        if (t && t.k === 'add') {
            if (Semantics.UNARY.indexOf(t.n.text) >= 0) { pos++; return { op: 'neg:' + t.n.text, args: [parseUnary()] }; }
            pos++;
            issue('Operator "' + label(t.n) + '" is missing its left operand', t.n);
            return { op: label(t.n), args: [null, parseUnary()] };
        }
        if (t && t.k === 'mul') {
            pos++;
            issue('Operator "' + label(t.n) + '" is missing its left operand', t.n);
            return { op: label(t.n), args: [null, parseUnary()] };
        }
        return parseJuxt();
    }
    function parseJuxt() {
        var parts = [], t;
        while ((t = peek()) && (t.k === 'operand' || t.k === 'postfix')) {
            pos++;
            if (t.k === 'postfix') {
                if (!parts.length) { issue('"' + label(t.n) + '" has nothing to apply to', t.n); }
                else { parts[parts.length - 1] = { op: 'post:' + label(t.n), args: [parts[parts.length - 1]] }; }
            } else {
                parts.push({ leaf: t.n });
            }
        }
        if (!parts.length) { return null; }
        return parts.length === 1 ? parts[0] : { op: 'juxt', args: parts };
    }
    var tree = toks.length ? parseList() : null;
    if (pos < toks.length) { issue('Unexpected "' + label(toks[pos].n) + '"', toks[pos].n); }
    return { tree: tree, issues: issues };
};

/* Prefix notation string of a tree (diagnostics & tests). */
Semantics.toString = function (t) {
    var i, parts;
    if (t === null || t === undefined) { return '_'; }
    if (t.leaf) { return Serializer.plain(AST.row([t.leaf])) || AST.TYPE_LABELS[t.leaf.type]; }
    parts = [];
    for (i = 0; i < t.args.length; i++) { parts.push(Semantics.toString(t.args[i])); }
    if (t.op === 'rel') { return '(rel ' + t.ops.join(' ') + ' ' + parts.join(' ') + ')'; }
    return '(' + t.op + ' ' + parts.join(' ') + ')';
};

/* Validate a whole expression: semantic issues + empty slots. */
Semantics.validate = function (root) {
    var issues = [];
    function scan(row, opts) {
        var r = Semantics.analyzeRow(row, opts), i;
        for (i = 0; i < r.issues.length; i++) { issues.push(r.issues[i]); }
    }
    AST.walk(root, function (n) {
        var kids, i, j;
        if (n.type === 'lines') {
            for (i = 0; i < n.rows.length; i++) {
                for (j = 0; j < n.rows[i].cells.length; j++) {
                    scan(n.rows[i].cells[j], { allowLeadingRelation: j > 0, allowTrailingRelation: j < n.rows[i].cells.length - 1 });
                }
            }
            return;
        }
        if (n.type === 'frac' || n.type === 'root' || n.type === 'binom') {
            kids = AST.childRows(n);
            for (i = 0; i < kids.length; i++) {
                if (kids[i].key !== 'index' && !kids[i].row.items.length) {
                    issues.push({ message: AST.TYPE_LABELS[n.type] + ': ' + kids[i].label + ' is empty', id: kids[i].row.id });
                } else if (kids[i].key !== 'index') {
                    scan(kids[i].row, {});
                }
            }
        }
        if (n.type === 'fenced') { scan(n.body, { allowLeadingRelation: true, allowTrailingRelation: true }); }
        if (n.type === 'matrix') {
            for (i = 0; i < n.rows.length; i++) {
                for (j = 0; j < n.rows[i].length; j++) { scan(n.rows[i][j], { allowLeadingRelation: true, allowTrailingRelation: true }); }
            }
        }
        if (n.type === 'chem') { return false; }
        if (n.type === 'row' && n.id === root.id) { scan(n, { allowLeadingRelation: true, allowTrailingRelation: false }); }
    });
    return issues;
};
