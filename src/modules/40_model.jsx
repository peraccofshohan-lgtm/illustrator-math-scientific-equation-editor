/* ==========================================================================
 * Module 40 - Application model and undo/redo history
 * The model is the single source of truth shared by the visual builder,
 * the direct input editor and the preview. Every change goes through
 * Model.apply(), which snapshots the previous state into History.
 * ========================================================================== */
var History = function (limit) {
    this.limit = U.clamp(Math.floor(limit || 100), 5, 1000);
    this.undoStack = [];
    this.redoStack = [];
};
History.prototype.push = function (snap) {
    if (this.undoStack.length && this.undoStack[this.undoStack.length - 1].key === snap.key) { return; }
    this.undoStack.push(snap);
    while (this.undoStack.length > this.limit) { this.undoStack.shift(); }
    this.redoStack = [];
};
History.prototype.canUndo = function () { return this.undoStack.length > 0; };
History.prototype.canRedo = function () { return this.redoStack.length > 0; };
History.prototype.undo = function (current) {
    if (!this.undoStack.length) { return null; }
    this.redoStack.push(current);
    return this.undoStack.pop();
};
History.prototype.redo = function (current) {
    if (!this.redoStack.length) { return null; }
    this.undoStack.push(current);
    return this.redoStack.pop();
};
History.prototype.clear = function () { this.undoStack = []; this.redoStack = []; };
History.prototype.setLimit = function (n) {
    this.limit = U.clamp(Math.floor(n || 100), 5, 1000);
    while (this.undoStack.length > this.limit) { this.undoStack.shift(); }
};

var Model = function (opts) {
    opts = opts || {};
    this.root = AST.row();
    this.selection = null;
    this.settings = Formatting.clean(opts.settings);
    this.parseOptions = { smartOps: opts.smartOps !== false, smartFuncs: opts.smartFuncs !== false, autoFence: opts.autoFence !== false };
    this.history = new History(opts.historyLimit || 100);
    this.listeners = [];
    this.editing = null;      /* {item, latex} when re-editing an equation from the document */
    this.name = '';
    this.dirty = false;
};
Model.prototype.onChange = function (fn) { this.listeners.push(fn); };
Model.prototype.emit = function (what) {
    var i;
    for (i = 0; i < this.listeners.length; i++) {
        try { this.listeners[i](what, this); } catch (e) { Log.error('Listener failed: ' + (e.message || e)); }
    }
};
Model.prototype.snapshot = function () {
    var latex = Serializer.toLatex(this.root);
    return { root: AST.clone(this.root, true), selection: this.selection, settings: U.clone(this.settings), key: latex + '\u0000' + JSONX.stringify(this.settings) };
};
Model.prototype.restore = function (snap) {
    this.root = AST.clone(snap.root, true);
    this.settings = U.clone(snap.settings);
    this.selection = (snap.selection && AST.find(this.root, snap.selection)) ? snap.selection : null;
};
/* Run a mutation with undo support and validation; rolls back on error. */
Model.prototype.apply = function (label, fn) {
    var before = this.snapshot(), result;
    try {
        result = fn(this.root, this);
        AST.validate(this.root);
    } catch (e) {
        this.restore(before);
        throw e;
    }
    if (typeof result === 'string' || result === null) { this.selection = result && AST.find(this.root, result) ? result : this.selection; }
    if (this.selection && !AST.find(this.root, this.selection)) { this.selection = null; }
    var after = Serializer.toLatex(this.root) + '\u0000' + JSONX.stringify(this.settings);
    if (after !== before.key) {
        this.history.push(before);
        this.dirty = true;
        this.emit('content');
    } else {
        this.emit('selection');
    }
    return result;
};
Model.prototype.undo = function () {
    var s = this.history.undo(this.snapshot());
    if (!s) { return false; }
    this.restore(s);
    this.emit('content');
    return true;
};
Model.prototype.redo = function () {
    var s = this.history.redo(this.snapshot());
    if (!s) { return false; }
    this.restore(s);
    this.emit('content');
    return true;
};
Model.prototype.select = function (id) {
    this.selection = (id && AST.find(this.root, id)) ? id : null;
    this.emit('selection');
};
Model.prototype.latex = function () { return Serializer.toLatex(this.root); };
/* Replace the whole equation from source text (direct input). Throws MathError with position on syntax errors. */
Model.prototype.setLatex = function (src, label) {
    var parsed = Parser.parse(src, this.parseOptions), self = this;
    this.apply(label || 'Edit source', function () {
        self.root = parsed.root;
        return null;
    });
    return parsed.warnings;
};
Model.prototype.load = function (latex, settings, name) {
    var parsed = Parser.parse(latex, this.parseOptions), self = this;
    this.apply('Load equation', function () {
        self.root = parsed.root;
        if (settings) { self.settings = Formatting.clean(settings); }
        self.selection = null;
        return null;
    });
    this.name = name || '';
    this.dirty = false;
    return parsed.warnings;
};
Model.prototype.clear = function () {
    var self = this;
    this.apply('New equation', function () { self.root = AST.row(); self.selection = null; return null; });
    this.editing = null;
    this.name = '';
    this.dirty = false;
};
Model.prototype.setSettings = function (patch) {
    var self = this;
    this.apply('Formatting', function () { self.settings = Formatting.merge(self.settings, patch); return self.selection; });
};
Model.prototype.insertLatex = function (snippet) {
    var self = this, nodes = Editor.fromSnippet(snippet, this.parseOptions);
    return this.apply('Insert', function (root) { return Editor.insert(root, self.selection, nodes); });
};
Model.prototype.stats = function () {
    return { nodes: AST.count(this.root), depth: AST.depth(this.root), chars: this.latex().length };
};
