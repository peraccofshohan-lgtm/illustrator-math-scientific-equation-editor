/* ==========================================================================
 * Module 41 - Persistence: formula library, favorites, recents, settings
 *
 * Data lives in one JSON document in the user data folder:
 *   <Folder.userData>/ShohanKhan-MathEquationEditor/library.json
 * Writes are atomic-ish: write library.json.tmp, keep library.json.bak,
 * then replace. Loading never executes anything: JSONX.parse is a strict
 * parser and every record is validated and sanitized. A corrupt file is
 * preserved as library.corrupt-<date>.json and an empty library is used.
 *
 * The file system is accessed through an adapter so the logic is testable:
 *   adapter.read(name) -> string|null, adapter.write(name, text),
 *   adapter.remove(name), adapter.exists(name), adapter.location()
 * ========================================================================== */
var Store = {};
Store.FILE = 'library.json';
Store.LIMITS = { formulas: 5000, templates: 2000, recentFormulas: 50, recentSymbols: 60, favSymbols: 500, name: 200, latex: 100000, tags: 20, note: 2000 };

Store.FileAdapter = function (folderPath) {
    var self = {};
    function folder() {
        var f = new Folder(folderPath);
        if (!f.exists && !f.create()) { throw new MathError(ErrorKind.PERSISTENCE, 'Cannot create the data folder: ' + f.fsName); }
        return f;
    }
    function file(name) { return new File(folder().fullName + '/' + name); }
    self.location = function () { return folder().fsName; };
    self.exists = function (name) { return file(name).exists; };
    self.read = function (name) {
        var f = file(name), t;
        if (!f.exists) { return null; }
        f.encoding = 'UTF-8';
        if (!f.open('r')) { throw new MathError(ErrorKind.PERSISTENCE, 'Cannot open ' + f.fsName + ' for reading.'); }
        try { t = f.read(); } finally { f.close(); }
        return t;
    };
    self.write = function (name, text) {
        var f = file(name), ok;
        f.encoding = 'UTF-8';
        f.lineFeed = 'Unix';
        if (!f.open('w')) { throw new MathError(ErrorKind.PERSISTENCE, 'Cannot open ' + f.fsName + ' for writing (check permissions).'); }
        try { ok = f.write(text); } finally { f.close(); }
        if (!ok) { throw new MathError(ErrorKind.PERSISTENCE, 'Writing ' + f.fsName + ' failed (disk full or no permission?).'); }
    };
    self.remove = function (name) { var f = file(name); if (f.exists) { f.remove(); } };
    self.copy = function (from, to) { var f = file(from); if (f.exists) { f.copy(folder().fullName + '/' + to); } };
    self.rename = function (from, to) {
        var f = file(from), t = file(to);
        if (t.exists) { t.remove(); }
        if (!f.rename(to)) { throw new MathError(ErrorKind.PERSISTENCE, 'Could not rename ' + from + ' to ' + to + '.'); }
    };
    return self;
};
Store.MemoryAdapter = function () {
    var files = {}, self = {};
    self.files = files;
    self.location = function () { return '(memory)'; };
    self.exists = function (n) { return U.has(files, n); };
    self.read = function (n) { return U.has(files, n) ? files[n] : null; };
    self.write = function (n, t) { if (self.failWrites) { throw new MathError(ErrorKind.PERSISTENCE, 'Simulated write failure'); } files[n] = String(t); };
    self.remove = function (n) { delete files[n]; };
    self.copy = function (a, b) { if (U.has(files, a)) { files[b] = files[a]; } };
    self.rename = function (a, b) { files[b] = files[a]; delete files[a]; };
    return self;
};
Store.defaultAdapter = function () {
    var base;
    if (typeof Folder === 'undefined') { return Store.MemoryAdapter(); }
    base = Folder.userData ? Folder.userData.fullName : Folder.temp.fullName;
    return Store.FileAdapter(base + '/' + MSEE.DATA_FOLDER_NAME);
};

Store.emptyData = function () {
    return {
        format: MSEE.DATA_FORMAT, version: MSEE.DATA_FORMAT_VERSION, app: MSEE.APP_NAME, appVersion: MSEE.VERSION,
        formulas: [], templates: [], favoriteSymbols: [], recentSymbols: [], recentFormulas: [],
        settings: Formatting.defaults(), prefs: Store.defaultPrefs()
    };
};
Store.defaultPrefs = function () {
    return { insertMode: 'group', position: 'view', smartOps: true, smartFuncs: true, autoFence: true, livePreview: true,
        confirmDelete: true, historyLimit: 100, previewZoom: 1, lastTab: 0, showPlaceholders: true, closeAfterInsert: false };
};
Store.cleanPrefs = function (p) {
    var d = Store.defaultPrefs(), out = {}, k;
    p = (p && typeof p === 'object') ? p : {};
    for (k in d) {
        if (!U.has(d, k)) { continue; }
        if (!U.has(p, k)) { out[k] = d[k]; continue; }
        if (typeof d[k] === 'boolean') { out[k] = p[k] === true || p[k] === false ? p[k] : d[k]; }
        else if (typeof d[k] === 'number') { out[k] = U.toNumber(p[k]) === null ? d[k] : U.toNumber(p[k]); }
        else { out[k] = typeof p[k] === 'string' ? p[k] : d[k]; }
    }
    if (!U.contains(Renderer.MODES, out.insertMode) || out.insertMode === 'outlines') { out.insertMode = 'group'; }
    if (!U.contains(['view', 'artboard'], out.position)) { out.position = 'view'; }
    out.historyLimit = U.clamp(Math.floor(out.historyLimit), 5, 1000);
    out.previewZoom = U.clamp(out.previewZoom, 0.25, 8);
    out.lastTab = U.clamp(Math.floor(out.lastTab), 0, 20);
    return out;
};
Store.str = function (v, max) {
    if (typeof v !== 'string') { v = (v === null || v === undefined) ? '' : String(v); }
    return v.length > max ? v.substring(0, max) : v;
};
/* Validate one formula record; returns clean record or null. */
Store.cleanFormula = function (f, kind) {
    var out, tags, i;
    if (!f || typeof f !== 'object' || typeof f.latex !== 'string' || !U.trim(f.latex)) { return null; }
    if (f.latex.length > Store.LIMITS.latex) { return null; }
    out = {
        id: Store.str(f.id, 40) || U.uid(kind === 'template' ? 'ct' : 'f'),
        name: U.trim(Store.str(f.name, Store.LIMITS.name)) || 'Untitled',
        latex: f.latex,
        category: U.trim(Store.str(f.category, 80)) || (kind === 'template' ? 'Custom' : 'General'),
        note: Store.str(f.note, Store.LIMITS.note),
        favorite: f.favorite === true,
        created: Store.str(f.created, 40) || U.isoDate(),
        modified: Store.str(f.modified, 40) || U.isoDate(),
        tags: []
    };
    if (U.isArray(f.tags)) {
        for (i = 0; i < f.tags.length && out.tags.length < Store.LIMITS.tags; i++) {
            tags = U.trim(Store.str(f.tags[i], 40));
            if (tags && !U.contains(out.tags, tags)) { out.tags.push(tags); }
        }
    }
    if (f.settings && typeof f.settings === 'object') { out.settings = Formatting.clean(f.settings); }
    return out;
};
Store.cleanData = function (d, report) {
    var out = Store.emptyData(), i, f, seen = {}, s;
    report = report || { dropped: 0 };
    if (!d || typeof d !== 'object') { return out; }
    function list(src, kind, max, target) {
        var j, c;
        if (!U.isArray(src)) { return; }
        for (j = 0; j < src.length && target.length < max; j++) {
            c = Store.cleanFormula(src[j], kind);
            if (!c) { report.dropped++; continue; }
            while (seen[c.id]) { c.id = U.uid(kind === 'template' ? 'ct' : 'f'); }
            seen[c.id] = 1;
            target.push(c);
        }
    }
    list(d.formulas, 'formula', Store.LIMITS.formulas, out.formulas);
    list(d.templates, 'template', Store.LIMITS.templates, out.templates);
    if (U.isArray(d.favoriteSymbols)) {
        for (i = 0; i < d.favoriteSymbols.length && out.favoriteSymbols.length < Store.LIMITS.favSymbols; i++) {
            s = d.favoriteSymbols[i];
            if (typeof s === 'string' && Symbols.byId[s] && !U.contains(out.favoriteSymbols, s)) { out.favoriteSymbols.push(s); }
        }
    }
    if (U.isArray(d.recentSymbols)) {
        for (i = 0; i < d.recentSymbols.length && out.recentSymbols.length < Store.LIMITS.recentSymbols; i++) {
            s = d.recentSymbols[i];
            if (typeof s === 'string' && Symbols.byId[s] && !U.contains(out.recentSymbols, s)) { out.recentSymbols.push(s); }
        }
    }
    if (U.isArray(d.recentFormulas)) {
        for (i = 0; i < d.recentFormulas.length && out.recentFormulas.length < Store.LIMITS.recentFormulas; i++) {
            f = d.recentFormulas[i];
            if (f && typeof f.latex === 'string' && U.trim(f.latex) && f.latex.length <= Store.LIMITS.latex) {
                out.recentFormulas.push({ latex: f.latex, time: Store.str(f.time, 40) || U.isoDate() });
            }
        }
    }
    out.settings = Formatting.clean(d.settings);
    out.prefs = Store.cleanPrefs(d.prefs);
    return out;
};

/* ---- Store instance ---------------------------------------------------------- */
Store.Library = function (adapter) {
    this.adapter = adapter || Store.defaultAdapter();
    this.data = Store.emptyData();
    this.lastError = null;
    this.loadReport = null;
};
Store.Library.prototype.load = function () {
    var text, parsed, report = { dropped: 0, recovered: false, corrupt: false };
    this.lastError = null;
    try {
        text = this.adapter.read(Store.FILE);
        if (text === null) {
            text = this.adapter.read(Store.FILE + '.bak');
            if (text !== null) { report.recovered = true; }
        }
        if (text === null) { this.data = Store.emptyData(); this.loadReport = report; return report; }
        try {
            parsed = JSONX.parse(text);
            if (!parsed || parsed.format !== MSEE.DATA_FORMAT) { throw new MathError(ErrorKind.PERSISTENCE, 'Not an equation editor library file'); }
            if (typeof parsed.version !== 'number' || parsed.version > MSEE.DATA_FORMAT_VERSION) {
                throw new MathError(ErrorKind.PERSISTENCE, 'The library was saved by a newer version (format ' + parsed.version + ').');
            }
        } catch (pe) {
            report.corrupt = true;
            try { this.adapter.write('library.corrupt-' + U.isoDate().replace(/[^0-9]/g, '').substring(0, 14) + '.json', text); } catch (we) { /* best effort */ }
            text = this.adapter.read(Store.FILE + '.bak');
            parsed = null;
            if (text !== null) {
                try { parsed = JSONX.parse(text); report.recovered = parsed && parsed.format === MSEE.DATA_FORMAT; if (!report.recovered) { parsed = null; } } catch (be) { parsed = null; }
            }
            this.lastError = 'The saved library was unreadable (' + (pe.message || pe) + '). ' + (parsed ? 'Recovered the backup copy.' : 'Started with an empty library; the damaged file was kept.');
        }
        this.data = Store.cleanData(parsed, report);
    } catch (e) {
        this.lastError = 'Could not load the library: ' + (e.message || e);
        this.data = Store.emptyData();
    }
    this.loadReport = report;
    return report;
};
Store.Library.prototype.save = function () {
    var text, a = this.adapter;
    this.data.appVersion = MSEE.VERSION;
    this.data.saved = U.isoDate();
    text = JSONX.stringify(this.data, 1);
    a.write(Store.FILE + '.tmp', text);
    if (a.exists(Store.FILE) && a.copy) {
        /* only a readable library becomes the backup; never overwrite a good backup with a damaged file */
        var current = null;
        try { current = JSONX.parse(a.read(Store.FILE)); } catch (e) { current = null; }
        if (current && current.format === MSEE.DATA_FORMAT) { a.copy(Store.FILE, Store.FILE + '.bak'); }
    }
    if (a.rename) { a.rename(Store.FILE + '.tmp', Store.FILE); }
    else { a.write(Store.FILE, text); a.remove(Store.FILE + '.tmp'); }
    return true;
};
/* Save without throwing; returns error text or null. */
Store.Library.prototype.trySave = function () {
    try { this.save(); return null; } catch (e) { this.lastError = e.message || String(e); Log.error('Save failed: ' + this.lastError); return this.lastError; }
};

/* Formulas */
Store.Library.prototype.formulas = function (query, favoritesOnly) {
    var q = U.trim(query || ''), out = [], i, f, s, scored = [];
    for (i = 0; i < this.data.formulas.length; i++) {
        f = this.data.formulas[i];
        if (favoritesOnly && !f.favorite) { continue; }
        if (!q) { out.push(f); continue; }
        s = U.searchScore(q, [f.name, f.category, f.tags.join(' '), f.note, f.latex]);
        if (s > 0) { scored.push({ f: f, s: s }); }
    }
    if (!q) { return out; }
    scored.sort(function (a, b) { return b.s - a.s; });
    return U.map(scored, function (x) { return x.f; });
};
Store.Library.prototype.getFormula = function (id) {
    return U.find(this.data.formulas, function (f) { return f.id === id; }) || U.find(this.data.templates, function (f) { return f.id === id; });
};
Store.Library.prototype.validateLatex = function (latex) {
    Parser.parse(latex, { smartOps: true, smartFuncs: true, autoFence: true });
};
Store.Library.prototype.addFormula = function (rec, kind) {
    var c, list = kind === 'template' ? this.data.templates : this.data.formulas, max = kind === 'template' ? Store.LIMITS.templates : Store.LIMITS.formulas;
    this.validateLatex(rec.latex);
    c = Store.cleanFormula(rec, kind);
    if (!c) { throw new MathError(ErrorKind.VALIDATION, 'The formula is empty or too large.'); }
    if (list.length >= max) { throw new MathError(ErrorKind.VALIDATION, 'The library is full (' + max + ' items). Delete some items first.'); }
    c.id = U.uid(kind === 'template' ? 'ct' : 'f');
    c.created = c.modified = U.isoDate();
    list.unshift(c);
    return c;
};
Store.Library.prototype.updateFormula = function (id, patch) {
    var f = this.getFormula(id), k;
    if (!f) { throw new MathError(ErrorKind.VALIDATION, 'That item no longer exists.'); }
    if (U.has(patch, 'latex')) { this.validateLatex(patch.latex); }
    for (k in patch) {
        if (!U.has(patch, k)) { continue; }
        if (k === 'name') { f.name = U.trim(Store.str(patch.name, Store.LIMITS.name)) || f.name; }
        else if (k === 'latex') { f.latex = Store.str(patch.latex, Store.LIMITS.latex); }
        else if (k === 'category') { f.category = U.trim(Store.str(patch.category, 80)) || f.category; }
        else if (k === 'note') { f.note = Store.str(patch.note, Store.LIMITS.note); }
        else if (k === 'favorite') { f.favorite = !!patch.favorite; }
        else if (k === 'settings') { f.settings = Formatting.clean(patch.settings); }
        else if (k === 'tags' && U.isArray(patch.tags)) { f.tags = Store.cleanFormula({ latex: 'x', tags: patch.tags }).tags; }
    }
    f.modified = U.isoDate();
    return f;
};
Store.Library.prototype.duplicateFormula = function (id) {
    var f = this.getFormula(id), kind, c;
    if (!f) { throw new MathError(ErrorKind.VALIDATION, 'That item no longer exists.'); }
    kind = U.contains(this.data.templates, f) ? 'template' : 'formula';
    c = U.clone(f);
    c.name = Store.uniqueName(this, f.name + ' (copy)', kind);
    c.favorite = false;
    return this.addFormula(c, kind);
};
Store.uniqueName = function (lib, name, kind) {
    var list = kind === 'template' ? lib.data.templates : lib.data.formulas, n = name, i = 2;
    function taken(x) { return !!U.find(list, function (f) { return f.name === x; }); }
    while (taken(n)) { n = name + ' ' + i; i++; }
    return n;
};
Store.Library.prototype.deleteFormula = function (id) {
    var lists = [this.data.formulas, this.data.templates], i, j;
    for (i = 0; i < lists.length; i++) {
        for (j = 0; j < lists[i].length; j++) { if (lists[i][j].id === id) { lists[i].splice(j, 1); return true; } }
    }
    return false;
};
Store.Library.prototype.toggleFavorite = function (id) {
    var f = this.getFormula(id);
    if (!f) { return false; }
    f.favorite = !f.favorite;
    f.modified = U.isoDate();
    return f.favorite;
};
Store.Library.prototype.categories = function (kind) {
    var list = kind === 'template' ? this.data.templates : this.data.formulas, out = [], i;
    for (i = 0; i < list.length; i++) { if (!U.contains(out, list[i].category)) { out.push(list[i].category); } }
    out.sort();
    return out;
};
/* Recents */
Store.Library.prototype.addRecentFormula = function (latex) {
    var r = this.data.recentFormulas, i;
    if (!U.trim(latex || '')) { return; }
    for (i = r.length - 1; i >= 0; i--) { if (r[i].latex === latex) { r.splice(i, 1); } }
    r.unshift({ latex: latex, time: U.isoDate() });
    while (r.length > Store.LIMITS.recentFormulas) { r.pop(); }
};
Store.Library.prototype.addRecentSymbol = function (id) {
    var r = this.data.recentSymbols, i = U.indexOf(r, id);
    if (!Symbols.byId[id]) { return; }
    if (i >= 0) { r.splice(i, 1); }
    r.unshift(id);
    while (r.length > Store.LIMITS.recentSymbols) { r.pop(); }
};
Store.Library.prototype.toggleFavoriteSymbol = function (id) {
    var r = this.data.favoriteSymbols, i = U.indexOf(r, id);
    if (!Symbols.byId[id]) { return false; }
    if (i >= 0) { r.splice(i, 1); return false; }
    if (r.length >= Store.LIMITS.favSymbols) { throw new MathError(ErrorKind.VALIDATION, 'Too many favorite symbols.'); }
    r.push(id);
    return true;
};
Store.Library.prototype.isFavoriteSymbol = function (id) { return U.contains(this.data.favoriteSymbols, id); };
Store.Library.prototype.clearRecents = function () { this.data.recentFormulas = []; this.data.recentSymbols = []; };

/* ---- Import / export ---------------------------------------------------------- */
/* Export: what = {formulas:bool, templates:bool, favoritesOnly:bool, ids:[...]} */
Store.Library.prototype.exportText = function (what) {
    var out = { format: MSEE.DATA_FORMAT, version: MSEE.DATA_FORMAT_VERSION, app: MSEE.APP_NAME, appVersion: MSEE.VERSION,
        exported: U.isoDate(), formulas: [], templates: [] }, i, f;
    what = what || { formulas: true, templates: true };
    function pick(f) { return (!what.favoritesOnly || f.favorite) && (!what.ids || U.contains(what.ids, f.id)); }
    if (what.formulas) { for (i = 0; i < this.data.formulas.length; i++) { f = this.data.formulas[i]; if (pick(f)) { out.formulas.push(f); } } }
    if (what.templates) { for (i = 0; i < this.data.templates.length; i++) { f = this.data.templates[i]; if (pick(f)) { out.templates.push(f); } } }
    return JSONX.stringify(out, 1);
};
/* Import; never executes data. Returns {added, skipped, renamed, invalid:[{name, reason}]}. */
Store.Library.prototype.importText = function (text, opts) {
    var data, rep = { added: 0, skipped: 0, renamed: 0, invalid: [] }, self = this;
    opts = opts || {};
    if (typeof text !== 'string' || !U.trim(text)) { throw new MathError(ErrorKind.IMPORT, 'The file is empty.'); }
    try { data = JSONX.parse(text); } catch (e) {
        throw new MathError(ErrorKind.IMPORT, 'The file is not valid library JSON: ' + (e.message || e));
    }
    if (!data || typeof data !== 'object' || data.format !== MSEE.DATA_FORMAT) {
        throw new MathError(ErrorKind.IMPORT, 'This file is not a ' + MSEE.APP_NAME + ' library export (missing "format": "' + MSEE.DATA_FORMAT + '").');
    }
    if (typeof data.version !== 'number' || data.version < 1) { throw new MathError(ErrorKind.IMPORT, 'The file has no valid format version.'); }
    if (data.version > MSEE.DATA_FORMAT_VERSION) {
        throw new MathError(ErrorKind.IMPORT, 'The file uses format version ' + data.version + ', which is newer than this editor supports (' + MSEE.DATA_FORMAT_VERSION + '). Update the editor.');
    }
    function importList(src, kind) {
        var list = kind === 'template' ? self.data.templates : self.data.formulas, i, c, dup, max = kind === 'template' ? Store.LIMITS.templates : Store.LIMITS.formulas;
        if (src === undefined) { return; }
        if (!U.isArray(src)) { rep.invalid.push({ name: kind + 's', reason: 'not a list' }); return; }
        for (i = 0; i < src.length; i++) {
            c = Store.cleanFormula(src[i], kind);
            if (!c) { rep.invalid.push({ name: (src[i] && src[i].name) ? Store.str(src[i].name, 60) : '#' + (i + 1), reason: 'missing or invalid source' }); continue; }
            try { self.validateLatex(c.latex); } catch (pe) { rep.invalid.push({ name: c.name, reason: 'syntax error: ' + (pe.message || pe) }); continue; }
            dup = U.find(list, function (f) { return f.latex === c.latex && f.name === c.name; });
            if (dup) { rep.skipped++; continue; }
            if (list.length >= max) { rep.invalid.push({ name: c.name, reason: 'library full' }); continue; }
            if (U.find(list, function (f) { return f.name === c.name; })) { c.name = Store.uniqueName(self, c.name + ' (imported)', kind); rep.renamed++; }
            c.id = U.uid(kind === 'template' ? 'ct' : 'f');
            list.push(c);
            rep.added++;
        }
    }
    importList(data.formulas, 'formula');
    importList(data.templates, 'template');
    return rep;
};
