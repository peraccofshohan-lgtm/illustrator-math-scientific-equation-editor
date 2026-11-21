/* ==========================================================================
 * Module 50 - ScriptUI user interface
 *
 * One modal dialog (Illustrator scripts may modify the document from modal
 * dialog callbacks; script palettes cannot do so reliably without
 * BridgeTalk). Layout:
 *   toolbar | tabs (Home, Symbols, Equation Builder, Direct Input, Templates,
 *   Formula Library, Favorites, Recent, Formatting, Settings, Help/About)
 *   | shared live preview | status bar
 * Every control is wired to a real action; all callbacks go through
 * UI.safe() so an error is reported instead of crashing the dialog.
 * ========================================================================== */
var UI = {};
UI.TABS = ['Home', 'Symbols', 'Equation Builder', 'Direct Input', 'Templates', 'Formula Library', 'Favorites', 'Recent', 'Formatting', 'Settings', 'Help / About'];
UI.MAX_LIST = 600;
UI.MAX_TREE = 1500;

/* ---- helpers ------------------------------------------------------------------ */
UI.safe = function (fn, label) {
    return function () {
        try { return fn.apply(this, arguments); }
        catch (e) { UI.fail(e, label); }
        return undefined;
    };
};
UI.fail = function (e, label) {
    var err = Errors.report(e, ErrorKind.UI);
    UI.status((label ? label + ': ' : '') + err.message, 'error');
    if (err.kind !== ErrorKind.PARSER && err.kind !== ErrorKind.VALIDATION && err.kind !== ErrorKind.STRUCTURE && err.kind !== ErrorKind.CHEMISTRY) {
        alert(err.kind + '\n\n' + err.message + (err.details ? '\n\nDetails: ' + err.details : ''), MSEE.APP_NAME);
    }
};
UI.status = function (msg, kind) {
    if (!UI.c || !UI.c.status) { return; }
    UI.c.status.text = (kind === 'error' ? '\u26A0 ' : kind === 'ok' ? '\u2713 ' : '') + msg;
    if (kind === 'error') { Log.warn(msg); }
};
UI.btn = function (parent, label, tip, fn, width) {
    var b = parent.add('button', undefined, label);
    if (tip) { b.helpTip = tip; }
    if (width) { b.preferredSize.width = width; }
    if (fn) { b.onClick = UI.safe(fn, label); }
    return b;
};
UI.row = function (parent, align) {
    var g = parent.add('group');
    g.orientation = 'row';
    g.alignChildren = align || ['left', 'center'];
    g.spacing = 6;
    g.margins = 0;
    return g;
};
UI.col = function (parent, align) {
    var g = parent.add('group');
    g.orientation = 'column';
    g.alignChildren = align || ['fill', 'top'];
    g.spacing = 6;
    g.margins = 0;
    return g;
};
UI.panel = function (parent, title) {
    var p = parent.add('panel', undefined, title || '');
    p.orientation = 'column';
    p.alignChildren = ['fill', 'top'];
    p.margins = [10, 14, 10, 10];
    p.spacing = 6;
    return p;
};
UI.label = function (parent, text, width) {
    var s = parent.add('statictext', undefined, text);
    if (width) { s.preferredSize.width = width; }
    return s;
};
UI.field = function (parent, text, width, tip) {
    var e = parent.add('edittext', undefined, text === undefined ? '' : String(text));
    if (width) { e.preferredSize.width = width; }
    if (tip) { e.helpTip = tip; }
    return e;
};
UI.dropdown = function (parent, items, sel, width, tip) {
    var d = parent.add('dropdownlist', undefined, items);
    if (items.length) { d.selection = U.clamp(sel || 0, 0, items.length - 1); }
    if (width) { d.preferredSize.width = width; }
    if (tip) { d.helpTip = tip; }
    return d;
};
UI.listbox = function (parent, titles, widths, height, multi) {
    var lb = parent.add('listbox', undefined, [], { numberOfColumns: titles.length, showHeaders: true, columnTitles: titles, columnWidths: widths, multiselect: !!multi });
    lb.preferredSize.height = height || 200;
    return lb;
};
UI.fillList = function (lb, rows, payloads) {
    var i, j, it, n = Math.min(rows.length, UI.MAX_LIST), prev = UI.selected(lb), keepId = (prev && prev.id) ? prev.id : null, reselect = null;
    lb.removeAll();
    for (i = 0; i < n; i++) {
        it = lb.add('item', String(rows[i][0]));
        for (j = 1; j < rows[i].length; j++) { if (it.subItems[j - 1]) { it.subItems[j - 1].text = String(rows[i][j]); } }
        it.payload = payloads ? payloads[i] : null;
        if (keepId && it.payload && it.payload.id === keepId) { reselect = it; }
    }
    if (rows.length > n) {
        it = lb.add('item', '\u2026');
        if (it.subItems[0]) { it.subItems[0].text = (rows.length - n) + ' more - refine the search'; }
        it.payload = null;
    }
    if (reselect) { try { lb.selection = reselect; } catch (e) { /* ignore */ } }
    return n;
};
UI.selected = function (lb) {
    var s = lb.selection;
    if (!s) { return null; }
    if (s instanceof Array) { s = s[0]; }
    return s ? s.payload : null;
};
UI.confirm = function (msg) {
    if (UI.lib && UI.lib.data.prefs && UI.lib.data.prefs.confirmDelete === false) { return true; }
    return confirm(msg, false, MSEE.APP_NAME);
};
UI.ask = function (title, msg, def) {
    var r = prompt(msg, def === undefined ? '' : def, title);
    return (r === null) ? null : String(r);
};
UI.showText = function (title, text) {
    var d = new Window('dialog', title), e, g;
    d.orientation = 'column';
    d.alignChildren = ['fill', 'fill'];
    UI.label(d, 'Select the text and copy it with Ctrl+C / Cmd+C:');
    e = d.add('edittext', undefined, text, { multiline: true, scrolling: true, readonly: false });
    e.preferredSize = [560, 200];
    g = UI.row(d, ['right', 'center']);
    g.alignment = ['right', 'bottom'];
    g.add('button', undefined, 'Close', { name: 'ok' });
    d.show();
};
UI.truncate = function (s, n) { s = String(s); return s.length > n ? s.substring(0, n - 1) + '\u2026' : s; };

/* ---- application ----------------------------------------------------------------- */
UI.launch = function (opts) {
    var editing = null, rep;
    opts = opts || {};
    try {
        UI.lib = new Store.Library(opts.adapter || null);
        rep = UI.lib.load();
        UI.prefs = UI.lib.data.prefs;
        UI.model = new Model({ settings: UI.lib.data.settings, historyLimit: UI.prefs.historyLimit, smartOps: UI.prefs.smartOps,
            smartFuncs: UI.prefs.smartFuncs, autoFence: UI.prefs.autoFence });
        UI.plan = Renderer.fontPlan(UI.model.settings);
        editing = Renderer.findSelectedEquation();
        if (editing) {
            UI.model.load(editing.latex, editing.settings);
            UI.model.editing = { item: editing.item, mode: editing.mode };
            UI.model.history.clear();
        }
        UI.build();
        UI.model.onChange(UI.onModelChange);
        UI.refreshAll('content');
        if (UI.lib.lastError) { UI.status(UI.lib.lastError, 'error'); }
        else if (editing) { UI.status('Editing the selected equation. Press "Update Equation" to replace it in the document.', 'ok'); }
        else { UI.status('Ready. ' + Symbols.list.length + ' symbols, ' + Templates.items.length + ' templates, ' + UI.lib.data.formulas.length + ' saved formulas.'); }
        UI.win.show();
        UI.persist();
    } catch (e) {
        var err = Errors.report(e, ErrorKind.UI);
        alert(MSEE.APP_NAME + ' could not start.\n\n' + err.message + (err.details ? '\n\n' + err.details : ''), MSEE.APP_NAME, true);
    }
};
UI.persist = function () {
    var err;
    if (!UI.lib) { return; }
    UI.lib.data.settings = Formatting.clean(UI.model.settings);
    UI.lib.data.prefs = Store.cleanPrefs(UI.prefs);
    err = UI.lib.trySave();
    if (err) { UI.status('Could not save your data: ' + err, 'error'); }
    return err;
};

UI.build = function () {
    var w, top, c = {}, tp, i;
    UI.c = c;
    w = new Window('dialog', MSEE.APP_NAME + '  \u2014  ' + MSEE.ATTRIBUTION, undefined, { resizeable: true, closeButton: true });
    UI.win = w;
    w.orientation = 'column';
    w.alignChildren = ['fill', 'top'];
    w.margins = 10;
    w.spacing = 8;
    UI.buildToolbar(w);
    tp = w.add('tabbedpanel');
    tp.alignChildren = ['fill', 'top'];
    tp.preferredSize = [980, 470];
    c.tabs = tp;
    c.tab = {};
    for (i = 0; i < UI.TABS.length; i++) {
        c.tab[UI.TABS[i]] = tp.add('tab', undefined, UI.TABS[i]);
        c.tab[UI.TABS[i]].orientation = 'column';
        c.tab[UI.TABS[i]].alignChildren = ['fill', 'top'];
        c.tab[UI.TABS[i]].margins = 10;
        c.tab[UI.TABS[i]].spacing = 8;
    }
    UI.buildHome(c.tab['Home']);
    UI.buildSymbols(c.tab['Symbols']);
    UI.buildBuilder(c.tab['Equation Builder']);
    UI.buildDirect(c.tab['Direct Input']);
    UI.buildTemplates(c.tab['Templates']);
    UI.buildLibrary(c.tab['Formula Library']);
    UI.buildFavorites(c.tab['Favorites']);
    UI.buildRecent(c.tab['Recent']);
    UI.buildFormatting(c.tab['Formatting']);
    UI.buildSettings(c.tab['Settings']);
    UI.buildHelp(c.tab['Help / About']);
    tp.selection = U.clamp(UI.prefs.lastTab || 0, 0, UI.TABS.length - 1);
    tp.onChange = UI.safe(function () {
        var idx = tp.selection ? U.indexOf(UI.TABS, tp.selection.text) : 0;
        UI.prefs.lastTab = idx;
        UI.onTabShown(tp.selection ? tp.selection.text : '');
    });
    UI.buildPreview(w);
    top = UI.row(w, ['fill', 'center']);
    c.status = top.add('statictext', undefined, '', { truncate: 'end' });
    c.status.alignment = ['fill', 'center'];
    c.status.preferredSize.width = 820;
    c.attr = top.add('statictext', undefined, MSEE.ATTRIBUTION + '  \u00B7  v' + MSEE.VERSION);
    c.attr.alignment = ['right', 'center'];
    w.onResizing = w.onResize = function () { try { this.layout.resize(); UI.redrawPreview(); } catch (e) { /* ignore */ } };
    w.addEventListener('keydown', UI.safe(UI.onKey));
    w.onClose = function () { try { UI.persist(); } catch (e) { /* ignore */ } return true; };
};

/* ---- toolbar --------------------------------------------------------------------------- */
UI.buildToolbar = function (w) {
    var c = UI.c, g = UI.row(w), modes = [], i;
    c.btnNew = UI.btn(g, 'New', 'Start a new, empty equation (Ctrl+N)', function () {
        if (UI.model.root.items.length && UI.model.dirty && !UI.confirm('Discard the current equation and start a new one?')) { return; }
        UI.model.clear();
        UI.status('New equation.');
    });
    c.btnUndo = UI.btn(g, '\u21B6 Undo', 'Undo the last change (Ctrl+Z outside text fields)', function () { if (!UI.model.undo()) { UI.status('Nothing to undo.'); } });
    c.btnRedo = UI.btn(g, 'Redo \u21B7', 'Redo (Ctrl+Y / Ctrl+Shift+Z outside text fields)', function () { if (!UI.model.redo()) { UI.status('Nothing to redo.'); } });
    g.add('panel').preferredSize = [2, 22];
    for (i = 0; i < Renderer.MODES.length; i++) { modes.push(Renderer.MODE_LABELS[Renderer.MODES[i]]); }
    UI.label(g, 'Insert as:');
    c.modeDD = UI.dropdown(g, modes, U.indexOf(Renderer.MODES, UI.prefs.insertMode), 250, 'How the equation is created in the document. Outlines are never the default.');
    c.modeDD.onChange = UI.safe(function () {
        var m = Renderer.MODES[c.modeDD.selection.index];
        if (m === 'outlines') { UI.status('Outlined artwork cannot be edited as text afterwards; the equation note is still stored for re-editing.'); }
        UI.prefs.insertMode = m === 'outlines' ? UI.prefs.insertMode : m;
    });
    c.btnInsert = UI.btn(g, 'Insert Equation', 'Create the equation in the active document (Ctrl+Enter)', function () { UI.insert(false); });
    c.btnInsertNew = UI.btn(g, 'Insert as New', 'Insert a new copy instead of updating the equation being edited', function () { UI.insert(true); });
    g.add('panel').preferredSize = [2, 22];
    UI.btn(g, 'Save to Library', 'Save the current equation in your formula library (Ctrl+S)', function () { UI.saveFormula(); });
    UI.btn(g, 'Show Source', 'Show the equation source text for copying', function () { UI.showText('Equation source', UI.model.latex()); });
};
UI.updateToolbar = function () {
    var c = UI.c, m = UI.model;
    c.btnUndo.enabled = m.history.canUndo();
    c.btnRedo.enabled = m.history.canRedo();
    c.btnInsert.text = m.editing ? 'Update Equation' : 'Insert Equation';
    c.btnInsertNew.visible = !!m.editing;
};

/* ---- insertion ----------------------------------------------------------------------- */
UI.insert = function (asNew) {
    var m = UI.model, mode = Renderer.MODES[UI.c.modeDD.selection.index], res, opts, issues, msg;
    if (!m.root.items.length) { UI.status('The equation is empty.', 'error'); return; }
    issues = Semantics.validate(m.root);
    if (issues.length && !confirm('The equation has ' + issues.length + ' possible problem(s):\n\n\u2022 ' +
            U.map(issues.slice(0, 6), function (x) { return x.message; }).join('\n\u2022 ') + '\n\nInsert anyway?', false, MSEE.APP_NAME)) { return; }
    if (mode === 'outlines' && !confirm('Outlined text cannot be edited as text afterwards. Continue?', false, MSEE.APP_NAME)) { return; }
    opts = { latex: m.latex(), mode: mode, position: UI.prefs.position, name: m.name };
    if (m.editing && !asNew) {
        try { if (m.editing.item && m.editing.item.typename) { opts.replaceItem = m.editing.item; } } catch (e) { opts.replaceItem = null; }
    }
    res = Renderer.insert(m.root, m.settings, opts);
    m.editing = { item: res.item, mode: res.mode };
    UI.lib.addRecentFormula(opts.latex);
    UI.persist();
    UI.refreshRecent();
    UI.updateToolbar();
    try { app.redraw(); } catch (e2) { /* redraw is cosmetic */ }
    msg = (opts.replaceItem ? 'Equation updated' : 'Equation inserted') + ' (' + Renderer.MODE_LABELS[res.mode] + '; ' + res.stats.text + ' text, ' + res.stats.paths + ' paths, ' + res.stats.rules + ' rules).';
    if (res.warnings.length) { msg += ' Note: ' + res.warnings.join(' '); }
    UI.status(msg, res.warnings.length ? 'error' : 'ok');
    if (UI.prefs.closeAfterInsert) { UI.win.close(); }
};

/* ---- preview ------------------------------------------------------------------------- */
UI.buildPreview = function (w) {
    var c = UI.c, p = UI.panel(w, 'Live Preview (generated by the same layout engine used for insertion)'), bar = UI.row(p), pv;
    c.zoomOut = UI.btn(bar, '\u2212', 'Zoom out', function () { UI.setZoom(UI.prefs.previewZoom / 1.25); }, 30);
    c.zoomIn = UI.btn(bar, '+', 'Zoom in', function () { UI.setZoom(UI.prefs.previewZoom * 1.25); }, 30);
    c.zoomLbl = UI.label(bar, '100%', 50);
    c.fit = bar.add('checkbox', undefined, 'Fit');
    c.fit.value = true;
    c.fit.helpTip = 'Scale the preview to fit the panel';
    c.fit.onClick = UI.safe(function () { UI.redrawPreview(); });
    UI.btn(bar, 'Refresh', 'Recompute and redraw the preview (F5)', function () { UI.plan = Renderer.fontPlan(UI.model.settings); PreviewRenderer.fontCache = {}; UI.updatePreview(); });
    c.pvInfo = UI.label(bar, '', 560);
    pv = p.add('group');
    pv.preferredSize = [960, 150];
    pv.alignment = ['fill', 'fill'];
    c.pv = pv;
    pv.onDraw = function () {
        try {
            var g = this.graphics, sz = this.size, L = UI.lastLayout;
            if (!L || UI.lastLayoutError) {
                g.newPath(); g.rectPath(0, 0, sz.width, sz.height); g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [1, 1, 1, 1]));
                g.drawString(UI.lastLayoutError || 'Empty equation - insert a symbol, structure or template, or type in Direct Input.',
                    g.newPen(g.PenType.SOLID_COLOR, UI.lastLayoutError ? [0.75, 0.1, 0.1, 1] : [0.45, 0.45, 0.45, 1], 1), 12, 12);
                return;
            }
            UI.lastTransform = PreviewRenderer.draw(g, L, { width: sz.width, height: sz.height, zoom: UI.prefs.previewZoom, fit: UI.c.fit.value,
                highlight: UI.model.selection, plan: UI.plan });
        } catch (e) { Log.warn('Preview draw failed: ' + e); }
    };
    pv.addEventListener('mousedown', UI.safe(function (ev) {
        var pt, hit;
        if (!UI.lastLayout || !UI.lastTransform) { return; }
        pt = UI.lastTransform.toLayout(ev.clientX, ev.clientY);
        hit = Layout.hitTest(UI.lastLayout, pt[0], pt[1]);
        if (hit) { UI.model.select(hit.id); UI.status('Selected: ' + UI.describeId(hit.id)); }
    }));
};
UI.setZoom = function (z) {
    UI.prefs.previewZoom = U.clamp(z, 0.25, 8);
    UI.c.fit.value = false;
    UI.redrawPreview();
};
UI.updatePreview = function () {
    var m = UI.model, c = UI.c, st;
    UI.lastLayoutError = null;
    if (!m.root.items.length) { UI.lastLayout = null; c.pvInfo.text = ''; UI.redrawPreview(); return; }
    try {
        UI.lastLayout = Layout.compute(m.root, m.settings, { metrics: PreviewRenderer.Metrics(c.pv.graphics, UI.plan), placeholders: UI.prefs.showPlaceholders });
        st = m.stats();
        c.pvInfo.text = 'Size \u2248 ' + U.round(UI.lastLayout.width, 1) + ' \u00D7 ' + U.round(UI.lastLayout.ascent + UI.lastLayout.descent, 1) + ' pt  \u00B7  ' +
            st.nodes + ' elements  \u00B7  math font: ' + (UI.plan.math || 'default') + (UI.plan.warnings.length ? '  \u26A0 ' + UI.plan.warnings[0] : '');
    } catch (e) {
        UI.lastLayout = null;
        UI.lastLayoutError = 'Cannot lay out this equation: ' + (e.message || e);
    }
    UI.redrawPreview();
};
UI.redrawPreview = function () {
    var c = UI.c;
    if (!c || !c.pv) { return; }
    c.zoomLbl.text = c.fit.value ? 'Fit' : Math.round(UI.prefs.previewZoom * 100) + '%';
    try { c.pv.hide(); c.pv.show(); } catch (e) { /* ignore */ }
};

/* ---- change propagation ------------------------------------------------------------- */
UI.onModelChange = function (what) { UI.refreshAll(what); };
UI.refreshAll = function (what) {
    if (what === 'content') {
        UI.updatePreview();
        UI.updateTree();
        if (!UI.fromSource) { UI.updateSource(); }
        UI.updateIssues();
    } else {
        UI.redrawPreview();
        UI.selectInTree();
    }
    UI.updateSelectionPanel();
    UI.updateToolbar();
    UI.updateHome();
};
UI.describeId = function (id) {
    var f = AST.find(UI.model.root, id);
    if (!f) { return '(nothing)'; }
    if (f.node.type === 'row') { return (f.key ? (AST.SLOT_LABELS[f.key] || f.key) : 'Equation') + ' slot'; }
    return AST.describe(f.node);
};
UI.onTabShown = function (name) {
    if (name === 'Formula Library') { UI.refreshLibrary(); }
    else if (name === 'Favorites') { UI.refreshFavorites(); }
    else if (name === 'Recent') { UI.refreshRecent(); }
    else if (name === 'Home') { UI.updateHome(); }
};

/* ---- keyboard ----------------------------------------------------------------------- */
UI.onKey = function (ev) {
    var k = ev.keyName, mod = ev.ctrlKey || ev.metaKey, inText = ev.target && ev.target.type === 'edittext';
    if (k === 'F5') { UI.updatePreview(); ev.preventDefault(); return; }
    if (!mod) { return; }
    if (k === 'Enter') { UI.insert(false); ev.preventDefault(); return; }
    if (k === 'S') { UI.saveFormula(); ev.preventDefault(); return; }
    if (k === 'N' && !inText) { UI.c.btnNew.notify('onClick'); ev.preventDefault(); return; }
    if (inText) { return; }
    if (k === 'Z' && !ev.shiftKey) { UI.model.undo(); ev.preventDefault(); }
    else if (k === 'Y' || (k === 'Z' && ev.shiftKey)) { UI.model.redo(); ev.preventDefault(); }
};

/* ==== HOME ============================================================================ */
UI.buildHome = function (t) {
    var c = UI.c, top = UI.row(t, ['fill', 'top']), left = UI.col(top), right = UI.col(top), p, g, title;
    left.preferredSize.width = 470;
    right.preferredSize.width = 470;
    title = left.add('statictext', undefined, MSEE.APP_NAME);
    try { title.graphics.font = ScriptUI.newFont('dialog', 'BOLD', 20); } catch (e) { /* default font */ }
    UI.label(left, MSEE.ATTRIBUTION + '  \u00B7  Version ' + MSEE.VERSION);
    UI.label(left, 'Build mathematical, physical and chemical equations and insert them as native, editable Illustrator artwork.');
    p = UI.panel(left, 'Quick start');
    g = UI.row(p);
    UI.btn(g, 'New Equation', 'Start an empty equation', function () { UI.c.btnNew.notify('onClick'); });
    UI.btn(g, 'Type Syntax', 'Open Direct Input', function () { UI.c.tabs.selection = U.indexOf(UI.TABS, 'Direct Input'); });
    UI.btn(g, 'Build Visually', 'Open the Equation Builder', function () { UI.c.tabs.selection = U.indexOf(UI.TABS, 'Equation Builder'); });
    g = UI.row(p);
    UI.btn(g, 'Browse Templates', 'Open the template library', function () { UI.c.tabs.selection = U.indexOf(UI.TABS, 'Templates'); });
    UI.btn(g, 'Symbols', 'Open the symbol browser', function () { UI.c.tabs.selection = U.indexOf(UI.TABS, 'Symbols'); });
    UI.btn(g, 'Help', 'Open Help / About', function () { UI.c.tabs.selection = U.indexOf(UI.TABS, 'Help / About'); });
    p = UI.panel(left, 'Global search (symbols, templates, saved formulas)');
    g = UI.row(p);
    c.gsearch = UI.field(g, '', 330, 'Type words such as "integral", "maxwell", "alpha", "sulfate"');
    UI.btn(g, 'Search', 'Search everything', function () { UI.globalSearch(); });
    c.gsearch.onChanging = UI.safe(function () { if (c.gsearch.text.length >= 2) { UI.globalSearch(); } });
    c.gresults = UI.listbox(p, ['Type', 'Name', 'Detail'], [80, 200, 160], 150);
    c.gresults.onDoubleClick = UI.safe(function () { UI.useSearchResult(UI.selected(c.gresults)); });
    UI.btn(p, 'Use Selected Result', 'Insert the symbol, or load the template / formula', function () { UI.useSearchResult(UI.selected(c.gresults)); });
    p = UI.panel(right, 'Current session');
    c.homeInfo = p.add('statictext', undefined, '', { multiline: true });
    c.homeInfo.preferredSize = [450, 150];
    p = UI.panel(right, 'Recent formulas (double-click to load)');
    c.homeRecent = UI.listbox(p, ['Formula', 'When'], [300, 130], 140);
    c.homeRecent.onDoubleClick = UI.safe(function () { var r = UI.selected(c.homeRecent); if (r) { UI.loadLatex(r.latex, null, ''); } });
};
UI.updateHome = function () {
    var c = UI.c, lines = [], docInfo = 'No document open', fonts, i, rows = [], pay = [], r;
    if (!c || !c.homeInfo) { return; }
    try { if (app.documents.length) { docInfo = 'Active document: ' + app.activeDocument.name + ' (layer "' + app.activeDocument.activeLayer.name + '")'; } } catch (e) { /* none */ }
    try { lines.push('Illustrator ' + app.version + '  \u00B7  ' + docInfo); } catch (e2) { lines.push(docInfo); }
    lines.push(UI.model.editing ? 'Editing an equation from the document (Update replaces it).' : 'Creating a new equation.');
    lines.push('Equation: ' + (UI.model.root.items.length ? UI.truncate(Serializer.plain(UI.model.root), 70) : '(empty)'));
    fonts = Fonts.recommendations();
    for (i = 0; i < fonts.length; i++) { if (fonts[i].installed) { lines.push('Math font found: ' + fonts[i].name); break; } }
    if (i === fonts.length) { lines.push('\u26A0 No dedicated math font found. Install STIX Two Math, Cambria Math or Latin Modern Math for best symbol coverage.'); }
    lines.push('Library: ' + UI.lib.data.formulas.length + ' formulas, ' + UI.lib.data.templates.length + ' custom templates, ' + UI.lib.data.favoriteSymbols.length + ' favorite symbols.');
    c.homeInfo.text = lines.join('\n');
    for (i = 0; i < Math.min(15, UI.lib.data.recentFormulas.length); i++) {
        r = UI.lib.data.recentFormulas[i];
        rows.push([UI.truncate(UI.plainOf(r.latex), 60), r.time.substring(0, 16).replace('T', ' ')]);
        pay.push(r);
    }
    UI.fillList(c.homeRecent, rows, pay);
};
UI.plainOf = function (latex) {
    try { return Serializer.plain(Parser.parse(latex, UI.model.parseOptions).root); } catch (e) { return latex; }
};
UI.globalSearch = function () {
    var q = U.trim(UI.c.gsearch.text), rows = [], pay = [], s, t, f, i;
    if (!q) { UI.c.gresults.removeAll(); return; }
    s = Symbols.search(q, 'all');
    for (i = 0; i < Math.min(80, s.length); i++) { rows.push(['Symbol', s[i].ch + '  ' + s[i].name, s[i].ins]); pay.push({ kind: 'symbol', v: s[i] }); }
    t = Templates.search(q, 'all');
    for (i = 0; i < Math.min(80, t.length); i++) { rows.push(['Template', t[i].name, t[i].catName]); pay.push({ kind: 'template', v: t[i] }); }
    f = UI.lib.formulas(q);
    for (i = 0; i < Math.min(80, f.length); i++) { rows.push(['Formula', f[i].name, f[i].category]); pay.push({ kind: 'formula', v: f[i] }); }
    UI.fillList(UI.c.gresults, rows, pay);
    UI.status(rows.length + ' results for "' + q + '".');
};
UI.useSearchResult = function (r) {
    if (!r) { UI.status('Select a result first.'); return; }
    if (r.kind === 'symbol') { UI.insertSymbol(r.v); }
    else if (r.kind === 'template') { UI.useTemplate(r.v, false); }
    else { UI.loadLatex(r.v.latex, r.v.settings, r.v.name); }
};

/* ==== SYMBOLS ============================================================================ */
UI.buildSymbols = function (t) {
    var c = UI.c, g = UI.row(t), cats = ['All categories'], i, body, right, p;
    UI.label(g, 'Search:');
    c.symSearch = UI.field(g, '', 260, 'Search by name, symbol, command or keyword (e.g. "integral", "\u2264", "ohm")');
    UI.label(g, 'Category:');
    for (i = 0; i < Symbols.CATEGORIES.length; i++) { cats.push(Symbols.CATEGORIES[i][2] + ' \u203A ' + Symbols.CATEGORIES[i][1]); }
    c.symCat = UI.dropdown(g, cats, 0, 300);
    c.symCount = UI.label(g, '', 160);
    body = UI.row(t, ['fill', 'top']);
    c.symList = UI.listbox(body, ['Symbol', 'Name', 'Syntax', 'Category'], [70, 230, 200, 200], 330);
    c.symList.preferredSize.width = 720;
    right = UI.col(body);
    right.preferredSize.width = 230;
    p = UI.panel(right, 'Details');
    c.symBig = p.add('statictext', undefined, ' ');
    try { c.symBig.graphics.font = ScriptUI.newFont('Cambria Math', 'REGULAR', 36); } catch (e) { /* default */ }
    c.symBig.preferredSize = [210, 52];
    c.symDesc = p.add('statictext', undefined, 'Select a symbol.', { multiline: true });
    c.symDesc.preferredSize = [210, 150];
    UI.btn(right, 'Insert Symbol', 'Insert into the equation at the current selection (double-click also inserts)', function () { UI.insertSymbol(UI.selected(c.symList)); });
    c.symFav = UI.btn(right, '\u2606 Add to Favorites', 'Add or remove this symbol from Favorites', function () {
        var s = UI.selected(c.symList), on;
        if (!s) { UI.status('Select a symbol first.'); return; }
        on = UI.lib.toggleFavoriteSymbol(s.id);
        UI.persist();
        UI.updateSymbolDetails();
        UI.status(on ? 'Added "' + s.name + '" to favorites.' : 'Removed "' + s.name + '" from favorites.', 'ok');
    });
    UI.btn(right, 'Show Syntax', 'Show the syntax for copying', function () { var s = UI.selected(c.symList); if (s) { UI.showText(s.name, s.ins); } });
    c.symSearch.onChanging = UI.safe(UI.refreshSymbols);
    c.symCat.onChange = UI.safe(UI.refreshSymbols);
    c.symList.onChange = UI.safe(UI.updateSymbolDetails);
    c.symList.onDoubleClick = UI.safe(function () { UI.insertSymbol(UI.selected(c.symList)); });
    UI.refreshSymbols();
};
UI.refreshSymbols = function () {
    var c = UI.c, cat = c.symCat.selection && c.symCat.selection.index > 0 ? Symbols.CATEGORIES[c.symCat.selection.index - 1][0] : 'all',
        list = U.trim(c.symSearch.text) ? Symbols.search(c.symSearch.text, cat) : U.filter(Symbols.list, function (e) { return cat === 'all' || e.cat === cat; }),
        rows = [], i;
    for (i = 0; i < list.length; i++) { rows.push([list[i].ch, list[i].name, list[i].ins, Symbols.categoryName(list[i].cat)]); }
    UI.fillList(c.symList, rows, list);
    c.symCount.text = list.length + ' symbol' + (list.length === 1 ? '' : 's');
};
UI.updateSymbolDetails = function () {
    var c = UI.c, s = UI.selected(c.symList);
    if (!s) { c.symBig.text = ' '; c.symDesc.text = 'Select a symbol.'; return; }
    c.symBig.text = s.ch;
    c.symDesc.text = s.name + '\n\n' + s.desc + '\n\nFont: ' + s.font + (s.kw ? '\n\nKeywords: ' + s.kw : '');
    c.symFav.text = UI.lib.isFavoriteSymbol(s.id) ? '\u2605 Remove from Favorites' : '\u2606 Add to Favorites';
};
UI.insertSymbol = function (s) {
    if (!s) { UI.status('Select a symbol first.'); return; }
    UI.model.insertLatex(s.ins);
    UI.lib.addRecentSymbol(s.id);
    UI.status('Inserted ' + s.name + '.', 'ok');
};

/* ==== EQUATION BUILDER ====================================================================== */
UI.buildBuilder = function (t) {
    var c = UI.c, body = UI.row(t, ['fill', 'top']), left = UI.col(body), right = UI.col(body), inner, ts, te, tc, g, p, k, names = [], keys = [], envs, i;
    left.preferredSize.width = 320;
    right.preferredSize.width = 640;
    UI.label(left, 'Structure (select an element to edit it):');
    c.tree = left.add('treeview');
    c.tree.preferredSize = [310, 300];
    c.tree.onChange = UI.safe(function () {
        var it = c.tree.selection;
        if (UI.treeSyncing || !it || !it.nodeId) { return; }
        UI.treeSelecting = true;
        UI.model.select(it.nodeId);
        UI.treeSelecting = false;
    });
    g = UI.row(left);
    UI.btn(g, 'Select All', 'Select the whole equation', function () { UI.model.select(UI.model.root.id); });
    UI.btn(g, 'Deselect', 'Clear the selection (new content is appended at the end)', function () { UI.model.select(null); });
    c.issues = left.add('statictext', undefined, '', { multiline: true });
    c.issues.preferredSize = [310, 60];

    inner = right.add('tabbedpanel');
    inner.preferredSize = [640, 400];
    ts = inner.add('tab', undefined, 'Insert Structure');
    te = inner.add('tab', undefined, 'Selected Element');
    tc = inner.add('tab', undefined, 'Chemistry');
    U.each([ts, te, tc], function (x) { x.orientation = 'column'; x.alignChildren = ['fill', 'top']; x.margins = 8; x.spacing = 6; });
    c.builderTabs = inner;

    /* -- insert structure -- */
    p = UI.panel(ts, 'Common structures (inserted after the selection, or into the selected empty slot)');
    g = UI.row(p);
    U.each([['Fraction', 'frac'], ['\u221A Root', 'sqrt'], ['\u221B nth Root', 'nroot'], ['x\u00B2 Superscript', 'sup'], ['x\u2082 Subscript', 'sub'], ['x\u2082\u00B2 Both', 'subsup']], function (a) {
        UI.btn(g, a[0], 'Insert ' + a[0], function () { UI.insertSnippet(Editor.SNIPPETS[a[1]]); });
    });
    g = UI.row(p);
    U.each([['( )', 'paren'], ['[ ]', 'bracket'], ['{ }', 'brace'], ['| |', 'abs'], ['\u2016 \u2016', 'norm'], ['\u27E8 \u27E9', 'angle'], ['\u230A \u230B', 'floor'], ['\u2308 \u2309', 'ceil']], function (a) {
        UI.btn(g, a[0], 'Insert stretchy ' + a[1] + ' brackets', function () { UI.insertSnippet(Editor.SNIPPETS[a[1]]); }, 52);
    });
    g = UI.row(p);
    U.each([['\u2211 Sum', 'sum'], ['\u220F Product', 'prod'], ['Binomial', 'binom'], ['Vector \u20D7', 'vec'], ['Hat', 'hat'], ['Bar', 'overline'], ['Box', 'boxed'], ['Text', 'text']], function (a) {
        UI.btn(g, a[0], 'Insert ' + a[0], function () { UI.insertSnippet(Editor.SNIPPETS[a[1]]); });
    });
    g = UI.row(p);
    UI.label(g, 'Integral:');
    c.intDD = UI.dropdown(g, ['Indefinite \u222B', 'Definite \u222B\u2090\u1D47', 'Double \u222C', 'Triple \u222D', 'Contour \u222E', 'Surface \u222F', 'Volume \u2230', 'Iterated'], 1, 150);
    UI.btn(g, 'Insert', 'Insert the selected integral', function () { UI.insertSnippet(Editor.INTEGRALS[['indefinite', 'definite', 'double', 'triple', 'contour', 'surface', 'volume', 'multiple'][c.intDD.selection.index]]); });
    UI.label(g, 'Limit:');
    c.limDD = UI.dropdown(g, ['x \u2192 a', 'x \u2192 a\u207B (left)', 'x \u2192 a\u207A (right)', 'x \u2192 \u221E', '(x,y) \u2192 (0,0)'], 0, 140);
    UI.btn(g, 'Insert', 'Insert the selected limit', function () { UI.insertSnippet(Editor.LIMITS[['limit', 'left', 'right', 'infinity', 'multivariable'][c.limDD.selection.index]]); });
    g = UI.row(p);
    UI.label(g, 'Derivative:');
    c.derDD = UI.dropdown(g, ['d/dx operator', 'df/dx', 'Higher order d\u207Fy/dx\u207F', 'Partial \u2202f/\u2202x', 'Higher partial', 'Mixed partial', 'Total d/dt', "Prime f\u2032(x)", "Double prime f\u2033(x)", 'Dot (time)'], 1, 160);
    UI.label(g, 'f:'); c.derF = UI.field(g, 'f', 40, 'Function name');
    UI.label(g, 'var:'); c.derV = UI.field(g, 'x', 40, 'Variable');
    UI.label(g, 'order:'); c.derN = UI.field(g, '2', 30, 'Order for higher derivatives');
    UI.btn(g, 'Insert', 'Insert the derivative', function () {
        UI.insertSnippet(Editor.derivativeSnippet(['operator', 'first', 'higher', 'partial', 'partial2', 'mixed', 'total', 'prime', 'prime2', 'dot'][c.derDD.selection.index], c.derN.text, c.derV.text, c.derF.text));
    });
    p = UI.panel(ts, 'Matrices, determinants, vectors, piecewise and multiline');
    g = UI.row(p);
    UI.label(g, 'Rows:'); c.mxR = UI.field(g, '2', 34);
    UI.label(g, 'Cols:'); c.mxC = UI.field(g, '2', 34);
    envs = ['pmatrix ( )', 'bmatrix [ ]', 'Bmatrix { }', 'vmatrix | | (determinant)', 'Vmatrix \u2016 \u2016', 'matrix (no brackets)', 'identity', 'zero', 'augmented [A|b]', 'smallmatrix'];
    c.mxEnv = UI.dropdown(g, envs, 0, 200);
    UI.btn(g, 'Insert Matrix', 'Insert a matrix (1-100 rows and columns)', function () {
        var r = U.toNumber(c.mxR.text), cc = U.toNumber(c.mxC.text);
        if (r === null || cc === null || r < 1 || cc < 1 || r > 100 || cc > 100) { throw new MathError(ErrorKind.VALIDATION, 'Rows and columns must be whole numbers from 1 to 100.'); }
        UI.insertSnippet(Editor.matrixSnippet(r, cc, ['pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix', 'matrix', 'identity', 'zero', 'augmented', 'smallmatrix'][c.mxEnv.selection.index]));
    });
    UI.btn(g, 'Column Vector', 'Insert a 3-component column vector', function () { UI.insertSnippet(Editor.matrixSnippet(3, 1, 'pmatrix')); });
    g = UI.row(p);
    UI.label(g, 'Cases / lines:'); c.csN = UI.field(g, '2', 34);
    UI.btn(g, 'Piecewise (cases)', 'Insert a piecewise function', function () { UI.insertSnippet('f(x) = ' + Editor.casesSnippet(U.toNumber(c.csN.text) || 2)); });
    UI.btn(g, 'Aligned Equations', 'Insert aligned multiline equations', function () { UI.insertSnippet(Editor.alignedSnippet(U.toNumber(c.csN.text) || 2, 'aligned')); });
    UI.btn(g, 'Numbered (align)', 'Insert numbered aligned equations', function () { UI.insertSnippet(Editor.alignedSnippet(U.toNumber(c.csN.text) || 2, 'align')); });
    p = UI.panel(ts, 'More structures');
    g = UI.row(p);
    for (k in Editor.SNIPPETS) { if (U.has(Editor.SNIPPETS, k)) { keys.push(k); names.push(k + '   ' + Editor.SNIPPETS[k]); } }
    c.snipDD = UI.dropdown(g, names, 0, 440);
    UI.btn(g, 'Insert', 'Insert the chosen structure', function () { UI.insertSnippet(Editor.SNIPPETS[keys[c.snipDD.selection.index]]); });

    /* -- selected element -- */
    p = UI.panel(te, 'Selection');
    c.selInfo = UI.label(p, 'Nothing selected - new content is appended to the end.', 600);
    g = UI.row(p);
    UI.label(g, 'Content:');
    c.selSrc = UI.field(g, '', 430, 'Syntax of the selected element. Edit and press Apply to replace it.');
    UI.btn(g, 'Apply', 'Replace the selected element with this syntax', function () {
        if (!UI.model.selection) { throw new MathError(ErrorKind.VALIDATION, 'Select an element first.'); }
        var id = UI.model.selection;
        UI.model.apply('Edit element', function (root) { return Editor.setContent(root, id, c.selSrc.text, UI.model.parseOptions); });
        UI.status('Element updated.', 'ok');
    });
    g = UI.row(p);
    UI.btn(g, 'Delete', 'Delete the selected element (or clear the selected slot)', function () { UI.edit('Delete', function (r, id) { return Editor.remove(r, id); }); });
    UI.btn(g, 'Duplicate', 'Duplicate the selected element', function () { UI.edit('Duplicate', function (r, id) { return Editor.duplicate(r, id); }); });
    UI.btn(g, '\u2190 Move', 'Move the element left', function () { UI.edit('Move', function (r, id) { return Editor.move(r, id, -1); }); });
    UI.btn(g, 'Move \u2192', 'Move the element right', function () { UI.edit('Move', function (r, id) { return Editor.move(r, id, 1); }); });
    UI.btn(g, 'Select Parent', 'Select the enclosing element', function () {
        var path = Editor.path(UI.model.root, UI.model.selection);
        if (path && path.length > 1) { UI.model.select(path[path.length - 2].id); }
    });
    g = UI.row(p);
    UI.label(g, 'Wrap in:');
    names = []; keys = [];
    for (k in Editor.WRAPS) { if (U.has(Editor.WRAPS, k)) { keys.push(k); names.push(Editor.WRAPS[k]); } }
    c.wrapDD = UI.dropdown(g, names, 0, 200);
    c.wrapKeys = keys;
    UI.btn(g, 'Wrap', 'Wrap the selected element in the chosen structure', function () { var kk = c.wrapKeys[c.wrapDD.selection.index]; UI.edit('Wrap', function (r, id) { return Editor.wrap(r, id, kk); }); });
    g = UI.row(p);
    UI.label(g, 'Toggle slot:');
    U.each([['Superscript', 'sup'], ['Subscript', 'sub'], ['Left sup', 'presup'], ['Left sub', 'presub'], ['Root index', 'index'], ['Lower limit', 'lower'], ['Upper limit', 'upper'], ['Label', 'label']], function (a) {
        UI.btn(g, a[0], 'Add or remove the ' + a[0] + ' slot of the selected element', function () { UI.edit('Toggle slot', function (r, id) { return Editor.toggleSlot(r, id, a[1]); }); });
    });
    g = UI.row(p);
    UI.btn(g, 'Limits Position', 'Cycle limits above/below vs. at the side (large operators, lim)', function () { UI.edit('Limits', function (r, id) { return Editor.cycleLimits(r, id); }); });
    p = UI.panel(te, 'Matrix and multiline editing (select a cell)');
    g = UI.row(p);
    U.each([['Row Above', 'rowAbove'], ['Row Below', 'rowBelow'], ['Col Left', 'colLeft'], ['Col Right', 'colRight'], ['Delete Row', 'delRow'], ['Delete Col', 'delCol']], function (a) {
        UI.btn(g, a[0], a[0], function () { UI.edit(a[0], function (r, id) { return Editor.matrixOp(r, id, a[1]); }); });
    });
    g = UI.row(p);
    UI.label(g, 'Type:');
    c.mxEnv2 = UI.dropdown(g, ['pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix', 'matrix', 'smallmatrix', 'cases', 'array'], 0, 110);
    UI.btn(g, 'Set Type', 'Change the bracket type of the selected matrix', function () { var e = c.mxEnv2.selection.text; UI.edit('Matrix type', function (r, id) { return Editor.matrixOp(r, id, 'env', e); }); });
    UI.label(g, '  Lines:');
    UI.btn(g, 'Add Line', 'Add a line after the selected one', function () { UI.edit('Add line', function (r, id) { return Editor.linesOp(r, id, 'add'); }); });
    UI.btn(g, 'Delete Line', 'Delete the selected line', function () { UI.edit('Delete line', function (r, id) { return Editor.linesOp(r, id, 'del'); }); });
    UI.btn(g, 'Tag', 'Add or remove an equation tag', function () { UI.edit('Tag', function (r, id) { return Editor.linesOp(r, id, 'tag'); }); });

    /* -- chemistry -- */
    p = UI.panel(tc, 'Chemical equation (e.g. Fe + O2 -> Fe2O3,  MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O)');
    g = UI.row(p);
    c.chemIn = UI.field(g, 'C3H8 + O2 -> CO2 + H2O', 440, 'Arrows: -> <- <=> <-> ; states (s) (l) (g) (aq); charges ^2+ or trailing + / -; hydrates with . ; conditions ->[above][below]');
    UI.btn(g, 'Balance', 'Balance with exact integer coefficients and verify atom and charge counts', function () { UI.chemBalance(false); });
    g = UI.row(p);
    UI.btn(g, 'Balance && Insert', 'Balance and insert into the equation', function () { UI.chemBalance(true); });
    UI.btn(g, 'Insert As Typed', 'Insert the chemical expression without balancing', function () { UI.insertSnippet('\\ce{' + c.chemIn.text + '}'); });
    UI.btn(g, 'Molar Mass', 'Compute the molar mass of a single formula', function () {
        var r = Chem.molarMass(c.chemIn.text);
        c.chemOut.text = 'M(' + U.trim(c.chemIn.text) + ') = ' + r.mass + ' g/mol' + (r.charge ? '   (charge ' + r.charge + ')' : '') + '\n' + r.breakdown.join('\n') + (r.warnings.length ? '\n' + r.warnings.join('\n') : '');
    });
    c.chemOut = p.add('edittext', undefined, '', { multiline: true, readonly: true, scrolling: true });
    c.chemOut.preferredSize = [600, 110];
    p = UI.panel(tc, 'Periodic table lookup (118 elements)');
    g = UI.row(p);
    c.elSearch = UI.field(g, '', 160, 'Symbol, name or atomic number');
    c.elDD = UI.dropdown(g, U.map(Elements.list, function (e) { return e.z + '  ' + e.sym + '  ' + e.name; }), 0, 220);
    UI.btn(g, 'Insert Symbol', 'Insert the element symbol (upright)', function () { var e = Elements.list[c.elDD.selection.index]; UI.insertSnippet('\\ce{' + e.sym + '}'); });
    UI.btn(g, 'Insert with Z/A', 'Insert with mass number and atomic number', function () {
        var e = Elements.list[c.elDD.selection.index];
        UI.insertSnippet('\\ce{^{' + Math.round(e.mass) + '}_{' + e.z + '}' + e.sym + '}');
    });
    c.elInfo = UI.label(p, '', 600);
    c.elSearch.onChanging = UI.safe(function () {
        var r = Elements.search(c.elSearch.text);
        if (r.length) { c.elDD.selection = r[0].z - 1; }
    });
    c.elDD.onChange = UI.safe(function () {
        var e = Elements.list[c.elDD.selection.index];
        c.elInfo.text = e.name + ' (' + e.sym + ')  Z = ' + e.z + '  \u00B7  ' + (e.massIsIsotope ? 'mass number of most stable isotope ' : 'standard atomic weight ') + e.mass +
            '  \u00B7  group ' + (e.group || '\u2013') + ', period ' + e.period + ', ' + (Elements.CATEGORY_NAMES[e.category] || e.category) + ', ' + e.block + '-block';
    });
    c.elDD.notify('onChange');
};
UI.insertSnippet = function (snippet) {
    UI.model.insertLatex(snippet);
    UI.status('Inserted.', 'ok');
};
UI.edit = function (label, fn) {
    var id = UI.model.selection;
    if (!id) { throw new MathError(ErrorKind.VALIDATION, 'Select an element first (in the structure tree or by clicking the preview).'); }
    UI.model.apply(label, function (root) { return fn(root, id); });
    UI.status(label + ' done.', 'ok');
};
UI.chemBalance = function (insert) {
    var c = UI.c, r = Chem.balance(c.chemIn.text), k, lines = [];
    for (k in r.check) { if (U.has(r.check, k)) { lines.push(k + ': ' + r.check[k][0] + ' = ' + r.check[k][1]); } }
    c.chemOut.text = 'Balanced: ' + r.text + '\nAtom check (left = right): ' + lines.join(',  ') + (r.charge[0] || r.charge[1] ? '\nCharge: ' + r.charge[0] + ' = ' + r.charge[1] : '');
    if (insert) { UI.insertSnippet(r.latex); }
    UI.status('Balanced and verified: ' + r.text, 'ok');
};
UI.updateTree = function () {
    var c = UI.c, count = 0, tv;
    if (!c || !c.tree) { return; }
    tv = c.tree;
    UI.treeSyncing = true;
    UI.treeIndex = {};
    tv.removeAll();
    function addKids(parentItem, node) {
        var kids, i, it;
        if (count > UI.MAX_TREE) { return; }
        if (node.type === 'row') {
            for (i = 0; i < node.items.length; i++) { addNode(parentItem, node.items[i]); }
            return;
        }
        if (node.type === 'chem') { return; }
        kids = AST.childRows(node);
        for (i = 0; i < kids.length; i++) {
            if (count > UI.MAX_TREE) { return; }
            it = parentItem.add('node', kids[i].label + (kids[i].row.items.length ? '' : '  (empty)'));
            it.nodeId = kids[i].row.id;
            UI.treeIndex[kids[i].row.id] = it;
            count++;
            addKids(it, kids[i].row);
            it.expanded = count < 300;
        }
    }
    function addNode(parentItem, n) {
        var hasKids = n.type !== 'row' && n.type !== 'chem' && AST.childRows(n).length > 0, it = parentItem.add(hasKids ? 'node' : 'item', AST.describe(n));
        it.nodeId = n.id;
        UI.treeIndex[n.id] = it;
        count++;
        if (hasKids) { addKids(it, n); it.expanded = count < 300; }
    }
    addKids(tv, UI.model.root);
    if (count > UI.MAX_TREE) { tv.add('item', '\u2026 (tree truncated: ' + AST.count(UI.model.root) + ' elements)'); }
    UI.treeSyncing = false;
    UI.selectInTree();
};
UI.selectInTree = function () {
    var it;
    if (!UI.c.tree || UI.treeSelecting) { return; }
    it = UI.model.selection ? UI.treeIndex[UI.model.selection] : null;
    UI.treeSyncing = true;
    try { UI.c.tree.selection = it || null; } catch (e) { /* ignore */ }
    UI.treeSyncing = false;
};
UI.updateSelectionPanel = function () {
    var c = UI.c, id = UI.model.selection, f;
    if (!c.selInfo) { return; }
    if (!id) { c.selInfo.text = 'Nothing selected - new content is appended to the end.'; c.selSrc.text = ''; return; }
    f = AST.find(UI.model.root, id);
    if (!f) { c.selInfo.text = 'Nothing selected.'; c.selSrc.text = ''; return; }
    c.selInfo.text = 'Selected: ' + UI.describeId(id) + '  \u2014  new content goes ' + (f.node.type === 'row' ? 'into this slot.' : 'right after it.');
    c.selSrc.text = f.node.type === 'row' ? Serializer.toLatex(f.node) : Serializer.toLatex(AST.row([f.node]));
    UI.c.elementFormat && UI.loadElementFormat(f.node);
};
UI.updateIssues = function () {
    var c = UI.c, issues;
    if (!c.issues) { return; }
    issues = Semantics.validate(UI.model.root);
    c.issues.text = issues.length ? '\u26A0 ' + U.map(issues.slice(0, 3), function (x) { return x.message; }).join('\n\u26A0 ') + (issues.length > 3 ? '\n\u2026' : '') : 'No structural problems found.';
};

/* ==== DIRECT INPUT =========================================================================== */
UI.buildDirect = function (t) {
    var c = UI.c, g, p;
    UI.label(t, 'Type LaTeX-style syntax. Examples: \\frac{a}{b}, x^{2}, \\sqrt[3]{x}, \\sum_{i=1}^{n}, \\int_0^1, \\lim_{x\\to0}, \\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}, \\ce{H2O}');
    c.src = t.add('edittext', undefined, '', { multiline: true, scrolling: true, wantReturn: true });
    c.src.preferredSize = [950, 190];
    try { c.src.graphics.font = ScriptUI.newFont('Courier New', 'REGULAR', 13); } catch (e) { /* default */ }
    c.srcErr = t.add('statictext', undefined, ' ', { multiline: true });
    c.srcErr.preferredSize = [950, 54];
    try { c.srcErr.graphics.font = ScriptUI.newFont('Courier New', 'REGULAR', 12); } catch (e2) { /* default */ }
    g = UI.row(t);
    UI.btn(g, 'Apply', 'Parse the text and update the equation', function () { UI.applySource(true); });
    c.live = g.add('checkbox', undefined, 'Live update');
    c.live.value = UI.prefs.livePreview;
    c.live.helpTip = 'Update the equation while typing whenever the text is valid';
    c.live.onClick = function () { UI.prefs.livePreview = c.live.value; };
    UI.btn(g, 'Clean Up', 'Rewrite the text in canonical form', function () { UI.applySource(true); UI.updateSource(true); });
    UI.btn(g, 'Plain Text', 'Show a plain Unicode version for copying', function () { UI.showText('Plain text', Serializer.plain(UI.model.root)); });
    UI.btn(g, 'Revert', 'Reload the text from the current equation', function () { UI.updateSource(true); UI.showSourceError(null); });
    p = UI.panel(t, 'Input options');
    g = UI.row(p);
    c.optSmart = g.add('checkbox', undefined, 'Smart operators (<= \u2192 \u2264, -> \u2192 \u2192, != \u2192 \u2260 ...)');
    c.optFuncs = g.add('checkbox', undefined, 'Recognize sin, cos, log ... without backslash');
    c.optFence = g.add('checkbox', undefined, 'Auto-size ( ) [ ] { } brackets');
    c.optSmart.value = UI.prefs.smartOps; c.optFuncs.value = UI.prefs.smartFuncs; c.optFence.value = UI.prefs.autoFence;
    U.each([c.optSmart, c.optFuncs, c.optFence], function (cb) {
        cb.onClick = UI.safe(function () {
            UI.prefs.smartOps = c.optSmart.value; UI.prefs.smartFuncs = c.optFuncs.value; UI.prefs.autoFence = c.optFence.value;
            UI.model.parseOptions = { smartOps: UI.prefs.smartOps, smartFuncs: UI.prefs.smartFuncs, autoFence: UI.prefs.autoFence };
        });
    });
    c.src.onChanging = UI.safe(function () { if (c.live.value) { UI.applySource(false); } });
};
UI.applySource = function (explicit) {
    var c = UI.c, warnings;
    try {
        UI.fromSource = true;
        warnings = UI.model.setLatex(c.src.text, 'Direct input');
        UI.fromSource = false;
        UI.showSourceError(null, warnings);
        if (explicit) { UI.status('Equation updated from text.', 'ok'); }
    } catch (e) {
        UI.fromSource = false;
        var err = Errors.wrap(e, ErrorKind.PARSER);
        UI.showSourceError(err);
        if (explicit) { UI.status(err.message, 'error'); }
    }
};
UI.showSourceError = function (err, warnings) {
    var c = UI.c, loc, lines, line;
    if (!err) {
        c.srcErr.text = (warnings && warnings.length) ? 'Note: ' + U.map(warnings, function (w) { return w.message || w; }).join('; ') : '\u2713 Valid.';
        return;
    }
    if (err.pos >= 0) {
        loc = Parser.location(c.src.text, err.pos);
        lines = c.src.text.split(/\r\n|\r|\n/);
        line = lines[loc.line - 1] || '';
        var start = Math.max(0, loc.col - 40);
        c.srcErr.text = '\u26A0 Line ' + loc.line + ', column ' + loc.col + ': ' + err.message + '\n' + line.substring(start, start + 90) + '\n' + U.repeat(' ', loc.col - 1 - start) + '^';
    } else {
        c.srcErr.text = '\u26A0 ' + err.message;
    }
};
UI.updateSource = function (force) {
    var c = UI.c;
    if (!c.src) { return; }
    if (!force && UI.fromSource) { return; }
    c.src.text = UI.model.latex();
};

/* ==== TEMPLATES =============================================================================== */
UI.buildTemplates = function (t) {
    var c = UI.c, g = UI.row(t), cats = ['All categories', 'My templates'], i, body, right, p;
    UI.label(g, 'Search:');
    c.tplSearch = UI.field(g, '', 240, 'Search templates by name, topic or keyword');
    UI.label(g, 'Category:');
    for (i = 0; i < Templates.categories.length; i++) { cats.push(Templates.categories[i].group + ' \u203A ' + Templates.categories[i].name + ' (' + Templates.categories[i].count + ')'); }
    c.tplCat = UI.dropdown(g, cats, 0, 330);
    c.tplCount = UI.label(g, '', 140);
    body = UI.row(t, ['fill', 'top']);
    c.tplList = UI.listbox(body, ['Name', 'Category'], [330, 260], 330);
    c.tplList.preferredSize.width = 610;
    right = UI.col(body);
    right.preferredSize.width = 330;
    p = UI.panel(right, 'Template');
    c.tplInfo = p.add('statictext', undefined, 'Select a template to preview it.', { multiline: true });
    c.tplInfo.preferredSize = [310, 150];
    UI.btn(right, 'Use Template (replace)', 'Replace the current equation with this template', function () { UI.useTemplate(UI.selected(c.tplList), false); });
    UI.btn(right, 'Insert at Selection', 'Insert the template into the current equation', function () { UI.useTemplate(UI.selected(c.tplList), true); });
    UI.btn(right, 'Save Current as My Template', 'Store the current equation as a custom template', function () {
        var name = UI.ask('New template', 'Template name:', ''), cat;
        if (name === null) { return; }
        cat = UI.ask('New template', 'Category:', 'Custom');
        if (cat === null) { return; }
        UI.lib.addFormula({ name: name, latex: UI.model.latex(), category: cat, settings: UI.model.settings }, 'template');
        UI.persist();
        UI.refreshTemplates();
        UI.status('Saved template "' + name + '".', 'ok');
    });
    UI.btn(right, 'Delete My Template', 'Delete the selected custom template', function () {
        var tp = UI.selected(c.tplList);
        if (!tp || !tp.custom) { UI.status('Select one of your own templates (category "My templates").'); return; }
        if (!UI.confirm('Delete the template "' + tp.name + '"?')) { return; }
        UI.lib.deleteFormula(tp.id);
        UI.persist();
        UI.refreshTemplates();
    });
    c.tplSearch.onChanging = UI.safe(UI.refreshTemplates);
    c.tplCat.onChange = UI.safe(UI.refreshTemplates);
    c.tplList.onChange = UI.safe(function () {
        var tp = UI.selected(c.tplList);
        if (!tp) { return; }
        c.tplInfo.text = tp.name + '\n' + tp.catName + '\n\n' + UI.plainOf(tp.latex) + (tp.desc ? '\n\n' + tp.desc : '') + '\n\nSyntax: ' + UI.truncate(tp.latex, 260);
    });
    c.tplList.onDoubleClick = UI.safe(function () { UI.useTemplate(UI.selected(c.tplList), false); });
    UI.refreshTemplates();
};
UI.customTemplates = function () {
    return U.map(UI.lib.data.templates, function (f) { return { id: f.id, name: f.name, latex: f.latex, catName: 'My templates \u203A ' + f.category, desc: f.note, custom: true, settings: f.settings }; });
};
UI.refreshTemplates = function () {
    var c = UI.c, idx = c.tplCat.selection ? c.tplCat.selection.index : 0, q = U.trim(c.tplSearch.text), list, rows = [], i, mine;
    if (idx === 1) {
        mine = UI.customTemplates();
        list = q ? U.filter(mine, function (x) { return U.searchScore(q, [x.name, x.catName, x.latex]) > 0; }) : mine;
    } else {
        list = Templates.search(q, idx === 0 ? 'all' : Templates.categories[idx - 2].id);
        if (idx === 0) {
            mine = UI.customTemplates();
            list = (q ? U.filter(mine, function (x) { return U.searchScore(q, [x.name, x.catName, x.latex]) > 0; }) : mine).concat(list);
        }
    }
    for (i = 0; i < list.length; i++) { rows.push([list[i].name, list[i].catName]); }
    UI.fillList(c.tplList, rows, list);
    c.tplCount.text = list.length + ' template' + (list.length === 1 ? '' : 's');
};
UI.useTemplate = function (tp, insert) {
    if (!tp) { UI.status('Select a template first.'); return; }
    if (insert) { UI.model.insertLatex(tp.latex); }
    else {
        if (UI.model.root.items.length && UI.model.dirty && !UI.confirm('Replace the current equation with "' + tp.name + '"?')) { return; }
        UI.model.setLatex(tp.latex, 'Template');
        UI.model.name = tp.name;
    }
    UI.status('Template "' + tp.name + '" ' + (insert ? 'inserted.' : 'loaded.'), 'ok');
};

/* ==== FORMULA LIBRARY ========================================================================= */
UI.buildLibrary = function (t) {
    var c = UI.c, g = UI.row(t), body, right, p, b;
    UI.label(g, 'Search:');
    c.libSearch = UI.field(g, '', 260, 'Search saved formulas by name, category, tag or content');
    c.libFavOnly = g.add('checkbox', undefined, 'Favorites only');
    c.libCount = UI.label(g, '', 200);
    body = UI.row(t, ['fill', 'top']);
    c.libList = UI.listbox(body, ['\u2605', 'Name', 'Category', 'Modified'], [30, 300, 160, 140], 330);
    c.libList.preferredSize.width = 650;
    right = UI.col(body);
    right.preferredSize.width = 290;
    p = UI.panel(right, 'Actions');
    b = UI.row(p); UI.btn(b, 'Save Current\u2026', 'Save the current equation as a new formula', function () { UI.saveFormula(); }, 130);
    UI.btn(b, 'Load', 'Load the selected formula into the editor', function () { var f = UI.libSel(); UI.loadLatex(f.latex, f.settings, f.name); }, 130);
    b = UI.row(p); UI.btn(b, 'Overwrite', 'Replace the selected formula with the current equation', function () {
        var f = UI.libSel();
        if (!UI.confirm('Overwrite "' + f.name + '" with the current equation?')) { return; }
        UI.lib.updateFormula(f.id, { latex: UI.model.latex(), settings: UI.model.settings });
        UI.persist(); UI.refreshLibrary(); UI.status('Updated "' + f.name + '".', 'ok');
    }, 130);
    UI.btn(b, 'Duplicate', 'Duplicate the selected formula', function () { var d = UI.lib.duplicateFormula(UI.libSel().id); UI.persist(); UI.refreshLibrary(); UI.status('Created "' + d.name + '".', 'ok'); }, 130);
    b = UI.row(p); UI.btn(b, 'Rename\u2026', 'Rename the selected formula', function () {
        var f = UI.libSel(), n = UI.ask('Rename', 'New name:', f.name), cat;
        if (n === null) { return; }
        cat = UI.ask('Category', 'Category:', f.category);
        UI.lib.updateFormula(f.id, cat === null ? { name: n } : { name: n, category: cat });
        UI.persist(); UI.refreshLibrary();
    }, 130);
    UI.btn(b, 'Delete', 'Delete the selected formula', function () {
        var f = UI.libSel();
        if (!UI.confirm('Delete "' + f.name + '"? This cannot be undone.')) { return; }
        UI.lib.deleteFormula(f.id); UI.persist(); UI.refreshLibrary(); UI.status('Deleted "' + f.name + '".', 'ok');
    }, 130);
    b = UI.row(p); UI.btn(b, '\u2605 Favorite', 'Toggle favorite', function () { var on = UI.lib.toggleFavorite(UI.libSel().id); UI.persist(); UI.refreshLibrary(); UI.status(on ? 'Marked as favorite.' : 'Removed from favorites.', 'ok'); }, 130);
    UI.btn(b, 'Insert into Eq.', 'Insert the selected formula at the current selection', function () { UI.model.insertLatex(UI.libSel().latex); }, 130);
    p = UI.panel(right, 'Import / export (versioned JSON, never executed)');
    b = UI.row(p); UI.btn(b, 'Import\u2026', 'Import formulas and templates from a library file', function () { UI.importLibrary(); }, 130);
    UI.btn(b, 'Export\u2026', 'Export your formulas and templates to a file', function () { UI.exportLibrary(false); }, 130);
    b = UI.row(p); UI.btn(b, 'Export Favorites\u2026', 'Export only favorite formulas', function () { UI.exportLibrary(true); }, 268);
    c.libDetail = right.add('statictext', undefined, '', { multiline: true });
    c.libDetail.preferredSize = [280, 80];
    c.libSearch.onChanging = UI.safe(UI.refreshLibrary);
    c.libFavOnly.onClick = UI.safe(UI.refreshLibrary);
    c.libList.onChange = UI.safe(function () { var f = UI.selected(c.libList); c.libDetail.text = f ? UI.truncate(UI.plainOf(f.latex), 160) + (f.tags.length ? '\nTags: ' + f.tags.join(', ') : '') : ''; });
    c.libList.onDoubleClick = UI.safe(function () { var f = UI.selected(c.libList); if (f) { UI.loadLatex(f.latex, f.settings, f.name); } });
    UI.refreshLibrary();
};
UI.libSel = function () {
    var f = UI.selected(UI.c.libList);
    if (!f) { throw new MathError(ErrorKind.VALIDATION, 'Select a formula in the list first.'); }
    return f;
};
UI.refreshLibrary = function () {
    var c = UI.c, list, rows = [], i;
    if (!c.libList) { return; }
    list = UI.lib.formulas(c.libSearch.text, c.libFavOnly.value);
    for (i = 0; i < list.length; i++) { rows.push([list[i].favorite ? '\u2605' : '', list[i].name, list[i].category, list[i].modified.substring(0, 16).replace('T', ' ')]); }
    UI.fillList(c.libList, rows, list);
    c.libCount.text = list.length + ' of ' + UI.lib.data.formulas.length + ' formulas';
};
UI.saveFormula = function () {
    var name, cat, f;
    if (!UI.model.root.items.length) { throw new MathError(ErrorKind.VALIDATION, 'The equation is empty.'); }
    name = UI.ask('Save formula', 'Name for this formula:', UI.model.name || UI.truncate(Serializer.plain(UI.model.root), 40));
    if (name === null) { return; }
    cat = UI.ask('Save formula', 'Category:', 'General');
    if (cat === null) { return; }
    f = UI.lib.addFormula({ name: name, latex: UI.model.latex(), category: cat, settings: UI.model.settings });
    UI.model.name = f.name;
    UI.model.dirty = false;
    UI.persist();
    UI.refreshLibrary();
    UI.status('Saved "' + f.name + '" to the library.', 'ok');
};
UI.loadLatex = function (latex, settings, name) {
    if (UI.model.root.items.length && UI.model.dirty && !UI.confirm('Replace the current equation?')) { return; }
    var w = UI.model.load(latex, settings || null, name || '');
    UI.status('Loaded ' + (name ? '"' + name + '"' : 'formula') + '.' + (w.length ? ' ' + w.length + ' note(s).' : ''), 'ok');
};
UI.importLibrary = function () {
    var f = File.openDialog('Import equation library', UI.fileFilter()), text, rep, msg;
    if (!f) { return; }
    f.encoding = 'UTF-8';
    if (f.length > 20 * 1024 * 1024) { throw new MathError(ErrorKind.IMPORT, 'The file is larger than 20 MB.'); }
    if (!f.open('r')) { throw new MathError(ErrorKind.IMPORT, 'Cannot open ' + f.fsName); }
    try { text = f.read(); } finally { f.close(); }
    rep = UI.lib.importText(text);
    UI.persist();
    UI.refreshLibrary();
    UI.refreshTemplates();
    msg = 'Imported ' + rep.added + ' item(s); ' + rep.skipped + ' duplicate(s) skipped; ' + rep.renamed + ' renamed; ' + rep.invalid.length + ' invalid.';
    if (rep.invalid.length) { msg += '\n\nInvalid entries:\n' + U.map(rep.invalid.slice(0, 15), function (x) { return '\u2022 ' + x.name + ': ' + x.reason; }).join('\n'); }
    alert(msg, MSEE.APP_NAME);
    UI.status('Import finished: ' + rep.added + ' added.', 'ok');
};
UI.fileFilter = function () {
    return ($.os && /windows/i.test($.os)) ? 'Equation library:*.json;All files:*.*' : function (f) { return f instanceof Folder || /\.json$/i.test(f.name); };
};
UI.exportLibrary = function (favOnly) {
    var f = File.saveDialog('Export equation library', 'Equation library:*.json'), text;
    if (!f) { return; }
    if (!/\.json$/i.test(f.name)) { f = new File(f.fsName + '.json'); }
    text = UI.lib.exportText({ formulas: true, templates: !favOnly, favoritesOnly: favOnly });
    f.encoding = 'UTF-8';
    if (!f.open('w')) { throw new MathError(ErrorKind.PERSISTENCE, 'Cannot write ' + f.fsName); }
    try { if (!f.write(text)) { throw new MathError(ErrorKind.PERSISTENCE, 'Writing failed.'); } } finally { f.close(); }
    UI.status('Exported to ' + f.fsName, 'ok');
};

/* ==== FAVORITES / RECENT ======================================================================== */
UI.buildFavorites = function (t) {
    var c = UI.c, body = UI.row(t, ['fill', 'top']), l = UI.panel(body, 'Favorite formulas'), r = UI.panel(body, 'Favorite symbols'), g;
    l.preferredSize.width = 470; r.preferredSize.width = 470;
    c.favF = UI.listbox(l, ['Name', 'Category'], [280, 150], 300);
    g = UI.row(l);
    UI.btn(g, 'Load', 'Load the formula', function () { var f = UI.selected(c.favF); if (f) { UI.loadLatex(f.latex, f.settings, f.name); } });
    UI.btn(g, 'Insert', 'Insert at the current selection', function () { var f = UI.selected(c.favF); if (f) { UI.model.insertLatex(f.latex); } });
    UI.btn(g, 'Unfavorite', 'Remove from favorites', function () { var f = UI.selected(c.favF); if (f) { UI.lib.toggleFavorite(f.id); UI.persist(); UI.refreshFavorites(); } });
    c.favF.onDoubleClick = UI.safe(function () { var f = UI.selected(c.favF); if (f) { UI.loadLatex(f.latex, f.settings, f.name); } });
    c.favS = UI.listbox(r, ['Symbol', 'Name', 'Syntax'], [60, 220, 150], 300);
    g = UI.row(r);
    UI.btn(g, 'Insert', 'Insert the symbol', function () { UI.insertSymbol(UI.selected(c.favS)); });
    UI.btn(g, 'Remove', 'Remove from favorites', function () { var s = UI.selected(c.favS); if (s) { UI.lib.toggleFavoriteSymbol(s.id); UI.persist(); UI.refreshFavorites(); } });
    c.favS.onDoubleClick = UI.safe(function () { UI.insertSymbol(UI.selected(c.favS)); });
    UI.refreshFavorites();
};
UI.refreshFavorites = function () {
    var c = UI.c, f, s, rows = [], i;
    if (!c.favF) { return; }
    f = UI.lib.formulas('', true);
    for (i = 0; i < f.length; i++) { rows.push([f[i].name, f[i].category]); }
    UI.fillList(c.favF, rows, f);
    s = U.map(UI.lib.data.favoriteSymbols, function (id) { return Symbols.byId[id]; });
    rows = [];
    for (i = 0; i < s.length; i++) { rows.push([s[i].ch, s[i].name, s[i].ins]); }
    UI.fillList(c.favS, rows, s);
};
UI.buildRecent = function (t) {
    var c = UI.c, body = UI.row(t, ['fill', 'top']), l = UI.panel(body, 'Recently inserted formulas'), r = UI.panel(body, 'Recently used symbols'), g;
    l.preferredSize.width = 560; r.preferredSize.width = 380;
    c.recF = UI.listbox(l, ['Formula', 'When'], [380, 140], 300);
    g = UI.row(l);
    UI.btn(g, 'Load', 'Load the formula', function () { var x = UI.selected(c.recF); if (x) { UI.loadLatex(x.latex, null, ''); } });
    UI.btn(g, 'Insert', 'Insert at the current selection', function () { var x = UI.selected(c.recF); if (x) { UI.model.insertLatex(x.latex); } });
    c.recF.onDoubleClick = UI.safe(function () { var x = UI.selected(c.recF); if (x) { UI.loadLatex(x.latex, null, ''); } });
    c.recS = UI.listbox(r, ['Symbol', 'Name'], [60, 260], 300);
    g = UI.row(r);
    UI.btn(g, 'Insert', 'Insert the symbol', function () { UI.insertSymbol(UI.selected(c.recS)); });
    c.recS.onDoubleClick = UI.safe(function () { UI.insertSymbol(UI.selected(c.recS)); });
    UI.btn(t, 'Clear Recent Lists', 'Clear recent formulas and symbols', function () {
        if (!UI.confirm('Clear the recent formulas and symbols lists?')) { return; }
        UI.lib.clearRecents(); UI.persist(); UI.refreshRecent();
    });
    UI.refreshRecent();
};
UI.refreshRecent = function () {
    var c = UI.c, rows = [], i, r, s;
    if (!c.recF) { return; }
    for (i = 0; i < UI.lib.data.recentFormulas.length; i++) {
        r = UI.lib.data.recentFormulas[i];
        rows.push([UI.truncate(UI.plainOf(r.latex), 70), r.time.substring(0, 16).replace('T', ' ')]);
    }
    UI.fillList(c.recF, rows, UI.lib.data.recentFormulas);
    s = U.map(UI.lib.data.recentSymbols, function (id) { return Symbols.byId[id]; });
    rows = [];
    for (i = 0; i < s.length; i++) { rows.push([s[i].ch, s[i].name]); }
    UI.fillList(c.recS, rows, s);
};

/* ==== FORMATTING ================================================================================ */
UI.buildFormatting = function (t) {
    var c = UI.c, body = UI.row(t, ['fill', 'top']), left = UI.panel(body, 'Equation formatting (whole equation)'), right = UI.col(body), p, g, i, sp, ctl, presets = [], k,
        fontItems, colA, colB, col;
    left.preferredSize.width = 600;
    right.preferredSize.width = 340;
    c.fmt = {};
    g = UI.row(left);
    UI.label(g, 'Preset:');
    for (k in Formatting.PRESETS) { if (U.has(Formatting.PRESETS, k)) { presets.push(k); } }
    c.presetDD = UI.dropdown(g, presets, 0, 220);
    UI.btn(g, 'Apply Preset', 'Apply the preset on top of the defaults', function () {
        UI.model.setSettings(U.extend(Formatting.defaults(), Formatting.PRESETS[c.presetDD.selection.text]));
        UI.loadFormatting(); UI.plan = Renderer.fontPlan(UI.model.settings); UI.updatePreview();
    });
    UI.btn(g, 'Reset Defaults', 'Restore default formatting', function () { UI.model.setSettings(Formatting.defaults()); UI.loadFormatting(); });
    fontItems = ['auto (recommended math font)'].concat(U.map(MathData.MATH_FONTS, function (f) { return f + (Fonts.isInstalled(f) ? '' : '  (not installed)'); }));
    g = UI.row(left);
    UI.label(g, 'Math font:', 90);
    c.fmt.mathFont = UI.dropdown(g, fontItems, 0, 260, 'Font for symbols and variables');
    c.fmt.mathFontCustom = UI.field(g, '', 160, 'Or type any installed font family name and press Apply');
    g = UI.row(left);
    UI.label(g, 'Text font:', 90);
    c.fmt.textFont = UI.dropdown(g, ['auto'].concat(U.map(MathData.TEXT_FONTS, function (f) { return f + (Fonts.isInstalled(f) ? '' : '  (not installed)'); })), 0, 260, 'Font for \\text{...} and fallback');
    c.fmt.textFontCustom = UI.field(g, '', 160, 'Or type any installed font family name');
    g = UI.row(left, ['fill', 'top']);
    colA = UI.col(g); colB = UI.col(g);
    for (i = 0; i < Formatting.SPEC.length; i++) {
        sp = Formatting.SPEC[i];
        if (sp[0] === 'mathFont' || sp[0] === 'textFont') { continue; }
        col = (i % 2 === 0) ? colA : colB;
        p = UI.row(col);
        if (sp[2] === 'boolean') { ctl = p.add('checkbox', undefined, sp[5]); }
        else if (sp[2].indexOf('enum:') === 0) { UI.label(p, sp[5] + ':', 170); ctl = UI.dropdown(p, sp[2].substring(5).split(','), 0, 100); }
        else { UI.label(p, sp[5] + ':', 170); ctl = UI.field(p, '', 90, sp[2] === 'number' ? 'Range ' + sp[3] + ' to ' + sp[4] : 'Hex color like #1A2B3C or a name like red, blue, navy'); }
        ctl.specKey = sp[0];
        c.fmt[sp[0]] = ctl;
    }
    g = UI.row(left);
    UI.btn(g, 'Apply Formatting', 'Validate and apply all values above', function () { UI.applyFormatting(); });
    c.fmtMsg = UI.label(g, '', 380);

    p = UI.panel(right, 'Selected element formatting');
    UI.label(p, 'Overrides for the selected element only:');
    c.elementFormat = true;
    g = UI.row(p); UI.label(g, 'Color:', 60); c.efColor = UI.field(g, '', 110, 'Hex or color name; empty = inherit');
    g = UI.row(p); UI.label(g, 'Bold:', 60); c.efBold = UI.dropdown(g, ['inherit', 'bold', 'not bold'], 0, 110);
    g = UI.row(p); UI.label(g, 'Italic:', 60); c.efItalic = UI.dropdown(g, ['inherit', 'italic', 'upright'], 0, 110);
    g = UI.row(p); UI.label(g, 'Scale:', 60); c.efScale = UI.field(g, '', 70, 'Size multiplier, e.g. 1.2 (empty = 1)');
    g = UI.row(p); UI.label(g, 'Shift:', 60); c.efDy = UI.field(g, '', 70, 'Baseline shift in em (positive = up)');
    g = UI.row(p); UI.label(g, 'Font:', 60); c.efFont = UI.field(g, '', 180, 'Font family override (empty = inherit)');
    g = UI.row(p);
    UI.btn(g, 'Apply to Selection', 'Apply these overrides to the selected element', function () { UI.applyElementFormat(); });
    UI.btn(g, 'Clear', 'Remove all overrides from the selected element and its contents', function () { UI.edit('Clear formatting', function (r, id) { return Editor.clearStyle(r, id); }); });
    p = UI.panel(right, 'Fonts');
    c.fontStatus = p.add('statictext', undefined, '', { multiline: true });
    c.fontStatus.preferredSize = [320, 110];
    UI.btn(p, 'Rescan Installed Fonts', 'Re-read the list of installed fonts', function () { Fonts.scan(true); UI.plan = Renderer.fontPlan(UI.model.settings); UI.loadFormatting(); UI.updatePreview(); });
    UI.loadFormatting();
};
UI.loadFormatting = function () {
    var c = UI.c, s = UI.model.settings, k, ctl, idx, rec, lines = [], i;
    for (k in c.fmt) {
        if (!U.has(c.fmt, k) || !c.fmt[k].specKey) { continue; }
        ctl = c.fmt[k];
        if (ctl.type === 'checkbox') { ctl.value = !!s[k]; }
        else if (ctl.type === 'dropdownlist') { idx = 0; for (i = 0; i < ctl.items.length; i++) { if (ctl.items[i].text === s[k]) { idx = i; } } ctl.selection = idx; }
        else { ctl.text = String(s[k]); }
    }
    idx = U.indexOf(MathData.MATH_FONTS, s.mathFont);
    c.fmt.mathFont.selection = idx >= 0 ? idx + 1 : 0;
    c.fmt.mathFontCustom.text = (idx < 0 && s.mathFont !== 'auto') ? s.mathFont : '';
    idx = U.indexOf(MathData.TEXT_FONTS, s.textFont);
    c.fmt.textFont.selection = idx >= 0 ? idx + 1 : 0;
    c.fmt.textFontCustom.text = (idx < 0 && s.textFont !== 'auto') ? s.textFont : '';
    rec = Fonts.recommendations();
    lines.push('Installed fonts detected: ' + Fonts.count());
    for (i = 0; i < rec.length; i++) { lines.push((rec[i].installed ? '\u2713 ' : '\u2717 ') + rec[i].name); }
    lines.push('In use: math = ' + (UI.plan.math || '(Illustrator default)') + ', text = ' + (UI.plan.text || '(default)'));
    if (UI.plan.warnings.length) { lines.push('\u26A0 ' + UI.plan.warnings.join(' ')); }
    c.fontStatus.text = lines.join('\n');
};
UI.applyFormatting = function () {
    var c = UI.c, patch = {}, k, ctl, v, sp, bad = [];
    for (k in c.fmt) {
        if (!U.has(c.fmt, k) || !c.fmt[k].specKey) { continue; }
        ctl = c.fmt[k];
        sp = Formatting.specFor(k);
        if (ctl.type === 'checkbox') { patch[k] = ctl.value; }
        else if (ctl.type === 'dropdownlist') { patch[k] = ctl.selection ? ctl.selection.text : sp[1]; }
        else {
            v = U.trim(ctl.text);
            if (sp[2] === 'number' && (U.toNumber(v) === null || U.toNumber(v) < sp[3] || U.toNumber(v) > sp[4])) { bad.push(sp[5] + ' (' + sp[3] + '\u2013' + sp[4] + ')'); continue; }
            if (sp[2] === 'color' && !U.normalizeColor(v)) { bad.push(sp[5] + ' (use #RRGGBB or a color name)'); continue; }
            patch[k] = v;
        }
    }
    patch.mathFont = U.trim(c.fmt.mathFontCustom.text) || (c.fmt.mathFont.selection.index === 0 ? 'auto' : MathData.MATH_FONTS[c.fmt.mathFont.selection.index - 1]);
    patch.textFont = U.trim(c.fmt.textFontCustom.text) || (c.fmt.textFont.selection.index === 0 ? 'auto' : MathData.TEXT_FONTS[c.fmt.textFont.selection.index - 1]);
    UI.model.setSettings(patch);
    UI.plan = Renderer.fontPlan(UI.model.settings);
    UI.loadFormatting();
    UI.updatePreview();
    c.fmtMsg.text = bad.length ? '\u26A0 Not applied: ' + bad.join(', ') : '\u2713 Applied.';
    UI.status(bad.length ? 'Some values were invalid and were not applied.' : 'Formatting applied.', bad.length ? 'error' : 'ok');
};
UI.loadElementFormat = function (n) {
    var c = UI.c, s = n.style || {};
    if (n.type === 'row' && n.items.length === 1 && !n.style) { s = n.items[0].style || {}; }
    c.efColor.text = s.color || '';
    c.efBold.selection = s.bold === true ? 1 : s.bold === false ? 2 : 0;
    c.efItalic.selection = s.italic === true ? 1 : s.italic === false ? 2 : 0;
    c.efScale.text = U.isNumber(s.scale) ? String(s.scale) : '';
    c.efDy.text = U.isNumber(s.dy) ? String(s.dy) : '';
    c.efFont.text = s.font || '';
};
UI.applyElementFormat = function () {
    var c = UI.c, st = {}, sc = U.trim(c.efScale.text), dy = U.trim(c.efDy.text), col = U.trim(c.efColor.text);
    if (col && !U.normalizeColor(col)) { throw new MathError(ErrorKind.VALIDATION, 'Color must be #RRGGBB or a color name.'); }
    if (sc && (U.toNumber(sc) === null || U.toNumber(sc) < 0.1 || U.toNumber(sc) > 10)) { throw new MathError(ErrorKind.VALIDATION, 'Scale must be between 0.1 and 10.'); }
    if (dy && (U.toNumber(dy) === null || Math.abs(U.toNumber(dy)) > 5)) { throw new MathError(ErrorKind.VALIDATION, 'Shift must be between -5 and 5 em.'); }
    st.color = col || null;
    st.bold = c.efBold.selection.index === 1 ? true : c.efBold.selection.index === 2 ? false : null;
    st.italic = c.efItalic.selection.index === 1 ? true : c.efItalic.selection.index === 2 ? false : null;
    st.scale = sc ? U.toNumber(sc) : null;
    st.dy = dy ? U.toNumber(dy) : null;
    st.font = U.trim(c.efFont.text) || null;
    UI.edit('Element formatting', function (r, id) { return Editor.setStyle(r, id, st); });
};

/* ==== SETTINGS ===================================================================================== */
UI.buildSettings = function (t) {
    var c = UI.c, body = UI.row(t, ['fill', 'top']), left = UI.col(body), right = UI.col(body), p, g, i;
    left.preferredSize.width = 470; right.preferredSize.width = 470;
    p = UI.panel(left, 'Insertion');
    c.setMode = [];
    for (i = 0; i < 3; i++) {
        c.setMode.push(p.add('radiobutton', undefined, Renderer.MODE_LABELS[Renderer.MODES[i]]));
        c.setMode[i].value = UI.prefs.insertMode === Renderer.MODES[i];
        c.setMode[i].modeIndex = i;
        c.setMode[i].onClick = function () { UI.prefs.insertMode = Renderer.MODES[this.modeIndex]; UI.c.modeDD.selection = this.modeIndex; };
    }
    UI.label(p, 'Outlined artwork is available from the toolbar but is never the default.');
    g = UI.row(p);
    UI.label(g, 'Place new equations at:');
    c.setPos = UI.dropdown(g, ['Center of the current view', 'Center of the active artboard'], UI.prefs.position === 'artboard' ? 1 : 0, 220);
    c.setPos.onChange = function () { UI.prefs.position = c.setPos.selection.index === 1 ? 'artboard' : 'view'; };
    c.setClose = p.add('checkbox', undefined, 'Close the editor after inserting');
    c.setClose.value = !!UI.prefs.closeAfterInsert;
    c.setClose.onClick = function () { UI.prefs.closeAfterInsert = c.setClose.value; };
    p = UI.panel(left, 'Editing');
    c.setConfirm = p.add('checkbox', undefined, 'Ask before deleting or replacing');
    c.setConfirm.value = UI.prefs.confirmDelete !== false;
    c.setConfirm.onClick = function () { UI.prefs.confirmDelete = c.setConfirm.value; };
    c.setPh = p.add('checkbox', undefined, 'Show empty-slot placeholders in the preview');
    c.setPh.value = UI.prefs.showPlaceholders !== false;
    c.setPh.onClick = UI.safe(function () { UI.prefs.showPlaceholders = c.setPh.value; UI.updatePreview(); });
    g = UI.row(p);
    UI.label(g, 'Undo history size (5-1000):');
    c.setHist = UI.field(g, String(UI.prefs.historyLimit), 60);
    UI.btn(g, 'Set', 'Apply the history size', function () {
        var n = U.toNumber(c.setHist.text);
        if (n === null || n < 5 || n > 1000) { throw new MathError(ErrorKind.VALIDATION, 'History size must be between 5 and 1000.'); }
        UI.prefs.historyLimit = Math.floor(n); UI.model.history.setLimit(n); UI.persist(); UI.status('History size set to ' + Math.floor(n) + '.', 'ok');
    });
    p = UI.panel(right, 'Data');
    c.dataLoc = p.add('statictext', undefined, '', { multiline: true });
    c.dataLoc.preferredSize = [440, 44];
    try { c.dataLoc.text = 'Library file: ' + UI.lib.adapter.location() + '/' + Store.FILE; } catch (e) { c.dataLoc.text = 'Library location unavailable: ' + e; }
    g = UI.row(p);
    UI.btn(g, 'Save Now', 'Save your library and settings now', function () { if (!UI.persist()) { UI.status('Saved.', 'ok'); } });
    UI.btn(g, 'Open Data Folder', 'Show the data folder in Explorer / Finder', function () { var f = new Folder(UI.lib.adapter.location()); if (!f.execute()) { UI.status('Could not open the folder.', 'error'); } });
    g = UI.row(p);
    UI.btn(g, 'Reset All Settings', 'Restore default formatting and preferences (formulas are kept)', function () {
        if (!UI.confirm('Reset formatting and preferences to defaults? Saved formulas are kept.')) { return; }
        UI.prefs = Store.defaultPrefs(); UI.lib.data.prefs = UI.prefs;
        UI.model.setSettings(Formatting.defaults()); UI.loadFormatting(); UI.persist();
        UI.status('Settings reset. Some options take effect the next time the editor opens.', 'ok');
    });
    p = UI.panel(right, 'Diagnostics');
    UI.btn(p, 'Show Log', 'Show the session log (errors and warnings)', function () { UI.showText('Session log', Log.text() || '(empty)'); });
    c.envInfo = p.add('statictext', undefined, '', { multiline: true });
    c.envInfo.preferredSize = [440, 70];
    try { c.envInfo.text = 'Illustrator ' + app.version + '  \u00B7  ' + $.os + '  \u00B7  ExtendScript ' + $.version + '\nEditor ' + MSEE.VERSION + '  \u00B7  data format ' + MSEE.DATA_FORMAT_VERSION; } catch (e2) { c.envInfo.text = 'Editor ' + MSEE.VERSION; }
};

/* ==== HELP / ABOUT ================================================================================== */
UI.HELP = [
    'MATH & SCIENTIFIC EQUATION EDITOR - ' + MSEE.ATTRIBUTION,
    '',
    'QUICK START',
    '1. Build an equation: pick symbols (Symbols tab), structures (Equation Builder), a template (Templates) or type syntax (Direct Input).',
    '2. Check the live preview. Click an element in the preview to select it.',
    '3. Press "Insert Equation" (Ctrl+Enter). The equation is created as a named group on the active layer.',
    '',
    'RE-EDITING AN INSERTED EQUATION',
    'Select the equation group (or any part of it) in Illustrator, then run the script again. The equation is loaded automatically;',
    '"Update Equation" replaces it in place, "Insert as New" keeps the original. The source is stored in the group\'s note.',
    '',
    'DIRECT INPUT SYNTAX (LaTeX-style)',
    '  Fractions \\frac{a}{b}  \\dfrac  \\tfrac  \\cfrac        Roots \\sqrt{x}  \\sqrt[n]{x}',
    '  Scripts x^{2}  x_{i}  x_i^2  f\'(x)  \\prescript{14}{6}{C}   Greek \\alpha \\beta ... \\Omega',
    '  Big operators \\sum_{i=1}^{n}  \\prod  \\int_a^b  \\iint  \\oint  \\lim_{x\\to 0}',
    '  Brackets \\left( ... \\right)  \\left. ... \\right|  \\abs{x}  \\norm{v}  \\langle \\rangle  \\lfloor \\rfloor',
    '  Matrices \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}  (matrix, bmatrix, Bmatrix, vmatrix, Vmatrix, array, cases)',
    '  Multiline \\begin{aligned} a &= b \\\\ &= c \\end{aligned}   or simply  a &= b \\\\ c &= d',
    '  Accents \\vec{F}  \\hat{x}  \\bar{x}  \\dot{x}  \\ddot{x}  \\tilde{x}  \\overline{AB}  \\overbrace{...}^{n}',
    '  Fonts \\mathbf{v}  \\mathrm{d}  \\mathbb{R}  \\mathcal{L}  \\mathfrak{g}  \\text{if }   Units \\unit{kg.m/s^2}',
    '  Derivatives \\dv{f}{x}  \\pdv{f}{x}  \\pdv[2]{f}{x}     Scientific notation \\sci{6.02}{23}',
    '  Chemistry \\ce{2H2 + O2 -> 2H2O}  \\ce{SO4^2-}  \\ce{CuSO4.5H2O}  \\ce{N2 + 3H2 <=>[Fe] 2NH3}',
    '  Color \\color{red}{x}   \\style{color=#0055AA;bold;scale=1.2}{x}   Spacing \\, \\: \\; \\quad \\qquad \\!',
    '  Smart input (optional): <= >= != -> => <=> +- ... are converted to proper symbols; sin cos log ... are recognized.',
    'Errors are reported with line and column, and a caret marks the position.',
    '',
    'CHEMISTRY',
    'Equation Builder > Chemistry balances reactions with exact integer coefficients (rational linear algebra) and verifies',
    'every element and the total charge on both sides. Ionic equations and electrons (e^-) are supported.',
    '',
    'INSERTION MODES',
    '  Editable group (default): native text frames + vector paths in one named group, re-editable.',
    '  Separate components: the same objects without a group (cannot be re-edited as one equation).',
    '  Single text object: only for expressions that have an exact linear Unicode form (e.g. E = mc\u00B2).',
    '  Outlined artwork: text converted to outlines; never the default.',
    '',
    'KEYBOARD SHORTCUTS (where ScriptUI allows them)',
    '  Ctrl/Cmd+Enter insert or update   Ctrl/Cmd+S save to library   F5 refresh preview',
    '  Ctrl/Cmd+Z undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z redo (when focus is not in a text field)   Ctrl/Cmd+N new   Esc close',
    '',
    'FONTS',
    'For full symbol coverage install a math font: STIX Two Math (free), Latin Modern Math (free) or Cambria Math (Windows/Office).',
    'Italic variables use Unicode mathematical italic letters when a math font is used, so they render correctly in math fonts.',
    '',
    'DATA',
    'Formulas, templates, favorites, recents and settings are saved in your user data folder (see Settings). Import/export uses a',
    'versioned JSON format; imported data is parsed and validated, never executed.',
    '',
    'LIMITATIONS',
    'Glyph heights use proportional tables (advance widths are measured from the real fonts in Illustrator). The preview uses',
    'ScriptUI fonts, so glyph shapes can differ slightly from the inserted artwork. See TROUBLESHOOTING.md for details.'
];
UI.buildHelp = function (t) {
    var c = UI.c, body = UI.row(t, ['fill', 'top']), help, about, title;
    help = body.add('edittext', undefined, UI.HELP.join('\n'), { multiline: true, readonly: true, scrolling: true });
    help.preferredSize = [640, 400];
    about = UI.panel(body, 'About');
    about.preferredSize.width = 300;
    title = about.add('statictext', undefined, MSEE.APP_NAME);
    try { title.graphics.font = ScriptUI.newFont('dialog', 'BOLD', 15); } catch (e) { /* default */ }
    UI.label(about, MSEE.ATTRIBUTION);
    UI.label(about, 'Version ' + MSEE.VERSION);
    about.add('statictext', undefined, MSEE.APP_TITLE_FULL + '\n\nTarget: Adobe Illustrator CC 2015 and later (ExtendScript / ScriptUI).\n\n' +
        Symbols.list.length + ' symbols \u00B7 ' + Templates.items.length + ' templates \u00B7 118 elements\n\nLicense: MIT\n\nSource and documentation:\ngithub.com/peraccofshohan-lgtm/illustrator-math-scientific-equation-editor', { multiline: true }).preferredSize = [280, 230];
    c.help = help;
};
