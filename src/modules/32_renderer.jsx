/* ==========================================================================
 * Module 32 - Illustrator renderer
 *
 * Turns the layout primitives into native Illustrator objects:
 *   text  -> point text frames (live, editable type)
 *   rule  -> filled rectangles (fraction bars, overlines, matrix rules)
 *   path  -> stroked/filled Bezier paths (radicals, stretchy brackets,
 *            accents, arrows, braces, boxes)
 * Insertion modes:
 *   group      one named group carrying the equation source in its note
 *              (re-editable; the default)
 *   components separate named objects on the layer (not re-editable)
 *   single     one point text object; only when the expression has a
 *              faithful linear form (Serializer.toSingleText)
 *   outlines   group with text converted to outlines (never the default)
 * Safety: validates the document/layer first, tracks every created object
 * and removes them all if anything fails (rollback). Existing objects are
 * only touched when the user explicitly updates a selected equation, and
 * the old object is removed only after the replacement succeeded.
 * ========================================================================== */
var Renderer = {};
Renderer.MODES = ['group', 'components', 'single', 'outlines'];
Renderer.MODE_LABELS = {
    group: 'Editable group (recommended)', components: 'Separate components', single: 'Single text object (simple expressions)',
    outlines: 'Outlined artwork (not editable as text)'
};
Renderer.ROLE_NAMES = {
    glyph: 'Glyph', func: 'Function name', text: 'Text', delimiter: 'Delimiter', bigop: 'Large operator', 'fraction-bar': 'Fraction bar',
    radical: 'Radical sign', accent: 'Accent', overline: 'Overline', underline: 'Underline', brace: 'Brace', arrow: 'Arrow',
    box: 'Box frame', 'matrix-rule': 'Matrix rule', tag: 'Equation number'
};

/* ---- Unicode math italic (math fonts have no italic style) ----------------- */
Renderer.mathItalic = function (ch) {
    var c = ch.charCodeAt(0);
    if (ch === 'h') { return '\u210E'; }
    if (c >= 0x41 && c <= 0x5A) { return U.fromCodePoint(0x1D434 + c - 0x41); }
    if (c >= 0x61 && c <= 0x7A) { return U.fromCodePoint(0x1D44E + c - 0x61); }
    if (c >= 0x3B1 && c <= 0x3C9) { return U.fromCodePoint(0x1D6FC + c - 0x3B1); }
    if (c >= 0x391 && c <= 0x3A9) { return U.fromCodePoint(0x1D6E2 + c - 0x391); }
    if (ch === '\u03D1') { return U.fromCodePoint(0x1D717); }
    if (ch === '\u03D5') { return U.fromCodePoint(0x1D719); }
    if (ch === '\u03F5') { return U.fromCodePoint(0x1D716); }
    if (ch === '\u03D6') { return U.fromCodePoint(0x1D71B); }
    if (ch === '\u03F1') { return U.fromCodePoint(0x1D71A); }
    return ch;
};
Renderer.isMathFont = function (family) {
    var f = U.lower(family || '');
    return f.indexOf('math') >= 0 || f === 'stixgeneral';
};
/* Font plan: which families to use for each face, computed once per render. */
Renderer.fontPlan = function (settings) {
    var eff = Fonts.effective(settings), plan = { warnings: eff.warnings.slice(0), cache: {} };
    plan.math = eff.math;
    plan.text = eff.text;
    plan.sans = Fonts.firstAvailable(['Arial', 'Helvetica', 'Myriad Pro', 'Segoe UI', 'DejaVu Sans']) || eff.text;
    plan.mono = Fonts.firstAvailable(['Courier New', 'Courier', 'Consolas', 'Menlo', 'DejaVu Sans Mono']) || eff.text;
    plan.mathIsMathFont = Renderer.isMathFont(plan.math);
    return plan;
};
/* Resolve a text run to {contents, ps (PostScript name or null), fauxItalicLost} */
Renderer.resolveRun = function (plan, text, face, bold, italic, override) {
    var key = face + '|' + (bold ? 1 : 0) + '|' + (italic ? 1 : 0) + '|' + (override || '') + '|' + text, fam, ps, contents = text, cps, i, r;
    if (plan.cache[key]) { return plan.cache[key]; }
    fam = override || plan[face] || plan.math;
    if (italic && !override && face === 'math' && plan.mathIsMathFont) {
        /* Math fonts carry italic letters as Unicode mathematical italic code points */
        cps = U.codePoints(text);
        contents = '';
        for (i = 0; i < cps.length; i++) { contents += Renderer.mathItalic(cps[i]); }
        ps = Fonts.resolve(fam, false, false);
        r = { contents: contents, ps: ps, family: fam };
    } else if (face === 'math' && plan.mathIsMathFont && bold) {
        /* Most math fonts have no bold face; use the text font's bold for bold runs */
        ps = Fonts.resolve(plan.text, true, italic) || Fonts.resolve(fam, true, italic) || Fonts.resolve(fam, false, false);
        r = { contents: contents, ps: ps, family: plan.text };
    } else {
        ps = Fonts.resolve(fam, bold, italic) || Fonts.resolve(fam, false, false);
        r = { contents: contents, ps: ps, family: fam };
    }
    plan.cache[key] = r;
    return r;
};

/* ---- Document checks --------------------------------------------------------- */
Renderer.checkDocument = function () {
    var doc, layer;
    if (typeof app === 'undefined') { throw new MathError(ErrorKind.DOCUMENT, 'Adobe Illustrator is not available.'); }
    if (!app.documents || app.documents.length === 0) {
        throw new MathError(ErrorKind.DOCUMENT, 'No document is open. Create or open a document, then insert the equation.');
    }
    doc = app.activeDocument;
    layer = doc.activeLayer;
    if (!layer) { throw new MathError(ErrorKind.DOCUMENT, 'The document has no active layer.'); }
    if (Renderer.layerLocked(layer)) {
        throw new MathError(ErrorKind.DOCUMENT, 'The active layer "' + layer.name + '" (or a parent layer) is locked. Unlock it or choose another layer.');
    }
    if (Renderer.layerHidden(layer)) {
        throw new MathError(ErrorKind.DOCUMENT, 'The active layer "' + layer.name + '" (or a parent layer) is hidden. Show it or choose another layer.');
    }
    return { doc: doc, layer: layer };
};
Renderer.layerLocked = function (layer) {
    var l = layer;
    while (l && l.typename === 'Layer') { if (l.locked) { return true; } l = l.parent; }
    return false;
};
Renderer.layerHidden = function (layer) {
    var l = layer;
    while (l && l.typename === 'Layer') { if (!l.visible) { return true; } l = l.parent; }
    return false;
};

/* ---- Colors --------------------------------------------------------------------- */
Renderer.makeColor = function (doc, hex) {
    var rgb = U.hexToRgb(hex || '#000000'), c, cmyk;
    if (doc.documentColorSpace === DocumentColorSpace.CMYK) {
        cmyk = U.rgbToCmyk(rgb);
        c = new CMYKColor();
        c.cyan = cmyk[0]; c.magenta = cmyk[1]; c.yellow = cmyk[2]; c.black = cmyk[3];
        return c;
    }
    c = new RGBColor();
    c.red = rgb[0]; c.green = rgb[1]; c.blue = rgb[2];
    return c;
};

/* ---- Live measurement inside Illustrator ------------------------------------------ */
/* Creates a metrics object that measures advance widths of real fonts with a
   temporary point-text frame. Heights use the proportional tables. */
Renderer.IllustratorMetrics = function (container, plan) {
    var cache = {}, frame = null, fontObjs = {}, self = { name: 'illustrator', created: [] };
    function fontObj(ps) {
        if (!ps) { return null; }
        if (!U.has(fontObjs, ps)) {
            try { fontObjs[ps] = app.textFonts.getByName(ps); } catch (e) { fontObjs[ps] = null; }
        }
        return fontObjs[ps];
    }
    self.measure = function (text, size, face, bold, italic, override) {
        var run = Renderer.resolveRun(plan, text, face, bold, italic, override), key = run.contents + '|' + (run.ps || '') + '|' + size,
            approx = Layout.ApproxMetrics.measure(text, size, face, bold, italic), w, f;
        if (U.has(cache, key)) { return { w: cache[key], a: approx.a, d: approx.d }; }
        try {
            if (!frame) {
                frame = container.textFrames.pointText([0, 0]);
                frame.name = 'MSEE temporary measurement';
                self.created.push(frame);
            }
            frame.contents = run.contents;
            f = fontObj(run.ps);
            if (f) { frame.textRange.characterAttributes.textFont = f; }
            frame.textRange.characterAttributes.size = 100;
            w = frame.width * size / 100;
            if (!(w > 0) && run.contents !== '' && !/^\s+$/.test(run.contents)) { w = approx.w; }
            if (/^\s+$/.test(run.contents)) { w = approx.w; }
        } catch (e) {
            w = approx.w;
        }
        cache[key] = w;
        return { w: w, a: approx.a, d: approx.d };
    };
    self.dispose = function () {
        var i;
        for (i = self.created.length - 1; i >= 0; i--) { try { self.created[i].remove(); } catch (e) { /* already gone */ } }
        self.created = [];
        frame = null;
    };
    return self;
};

/* ---- Payload stored on the inserted group (for re-editing) ------------------------- */
Renderer.encodeNote = function (latex, settings, mode, offset) {
    var data = { app: 'MSEE', v: 1, version: MSEE.VERSION, latex: latex, settings: settings, mode: mode };
    if (offset) { data.offset = [U.round(offset[0], 3), U.round(offset[1], 3)]; }
    return MSEE.NOTE_PREFIX + JSONX.stringify(data);
};
/* Offset from the item's geometric top-left to the equation's baseline origin;
   lets "Update" keep the baseline where it was even after the user moved it. */
Renderer.originOffset = function (item, origin) {
    var gb;
    try { gb = item.geometricBounds; } catch (e) { return null; }
    if (!gb || !isFinite(gb[0]) || !isFinite(gb[1])) { return null; }
    return [origin[0] - gb[0], origin[1] - gb[1]];
};
Renderer.decodeNote = function (note) {
    var data;
    if (typeof note !== 'string' || note.indexOf(MSEE.NOTE_PREFIX) !== 0) { return null; }
    try { data = JSONX.parse(note.substring(MSEE.NOTE_PREFIX.length)); } catch (e) { return null; }
    if (!data || typeof data !== 'object' || typeof data.latex !== 'string') { return null; }
    if (data.latex.length > 200000) { return null; }
    return { latex: data.latex, settings: Formatting.clean(data.settings), mode: U.contains(Renderer.MODES, data.mode) ? data.mode : 'group', version: String(data.version || ''),
        offset: (U.isArray(data.offset) && data.offset.length === 2 && U.isNumber(data.offset[0]) && U.isNumber(data.offset[1]) && isFinite(data.offset[0]) && isFinite(data.offset[1])) ? data.offset : null };
};
/* Look for an equation in the current selection (the group itself or any item inside it). */
Renderer.findSelectedEquation = function () {
    var doc, sel, item, i, depth, payload;
    try {
        if (typeof app === 'undefined' || !app.documents || app.documents.length === 0) { return null; }
        doc = app.activeDocument;
        sel = doc.selection;
        if (!sel || !sel.length) { return null; }
        for (i = 0; i < sel.length; i++) {
            item = sel[i];
            depth = 0;
            while (item && depth < 50) {
                payload = null;
                try { payload = Renderer.decodeNote(item.note); } catch (e1) { payload = null; }
                if (payload) { payload.item = item; return payload; }
                if (!item.parent || item.parent.typename === 'Layer' || item.parent.typename === 'Document') { break; }
                item = item.parent;
                depth++;
            }
        }
    } catch (e) { Log.warn('Selection check failed: ' + e); }
    return null;
};

/* ---- Drawing ---------------------------------------------------------------------- */
Renderer.drawText = function (container, p, ox, oy, plan, doc, colorCache) {
    var run = Renderer.resolveRun(plan, p.t, p.face, p.bold, p.italic, p.font), tf, ca, f;
    tf = container.textFrames.pointText([ox + p.x, oy + p.y]);
    tf.contents = run.contents;
    ca = tf.textRange.characterAttributes;
    if (run.ps) {
        try { f = app.textFonts.getByName(run.ps); ca.textFont = f; } catch (e) { plan.warnings.push('Font "' + run.ps + '" could not be applied.'); }
    }
    ca.size = Math.max(0.1, Math.min(1296, p.size));
    ca.fillColor = Renderer.colorFor(doc, p.color, colorCache);
    try { ca.tracking = 0; ca.kerningMethod = AutoKernType.NOAUTOKERN; } catch (e2) { /* optional */ }
    tf.name = (Renderer.ROLE_NAMES[p.role] || 'Glyph') + ': ' + p.t;
    return tf;
};
Renderer.colorFor = function (doc, hex, cache) {
    if (!cache[hex]) { cache[hex] = Renderer.makeColor(doc, hex); }
    return cache[hex];
};
Renderer.drawRule = function (container, p, ox, oy, doc, colorCache) {
    var r = container.pathItems.rectangle(oy + p.y + p.h, ox + p.x, Math.max(0.01, p.w), Math.max(0.01, p.h));
    r.filled = true;
    r.stroked = false;
    r.fillColor = Renderer.colorFor(doc, p.color, colorCache);
    r.name = Renderer.ROLE_NAMES[p.role] || 'Rule';
    return r;
};
Renderer.drawPath = function (container, p, ox, oy, doc, colorCache) {
    var path = container.pathItems.add(), i, pt, q, anchors = [];
    for (i = 0; i < p.pts.length; i++) { anchors.push([ox + p.pts[i].a[0], oy + p.pts[i].a[1]]); }
    path.setEntirePath(anchors);
    for (i = 0; i < p.pts.length; i++) {
        q = p.pts[i];
        pt = path.pathPoints[i];
        pt.leftDirection = [ox + q.l[0], oy + q.l[1]];
        pt.rightDirection = [ox + q.r[0], oy + q.r[1]];
        pt.pointType = (q.l[0] === q.a[0] && q.l[1] === q.a[1] && q.r[0] === q.a[0] && q.r[1] === q.a[1]) ? PointType.CORNER : PointType.SMOOTH;
    }
    path.closed = !!p.closed;
    if (p.fill) {
        path.filled = true;
        path.fillColor = Renderer.colorFor(doc, p.color, colorCache);
    } else { path.filled = false; }
    if (p.stroke) {
        path.stroked = true;
        path.strokeWidth = p.stroke;
        path.strokeColor = Renderer.colorFor(doc, p.color, colorCache);
        try {
            path.strokeCap = p.cap === 'round' ? StrokeCap.ROUNDENDCAP : StrokeCap.BUTTENDCAP;
            path.strokeJoin = p.join === 'round' ? StrokeJoin.ROUNDENDJOIN : StrokeJoin.MITERENDJOIN;
        } catch (e) { /* optional */ }
    } else { path.stroked = false; }
    path.name = Renderer.ROLE_NAMES[p.role] || 'Path';
    return path;
};

/* Where the equation goes: replace position, view center, or the artboard. */
Renderer.placement = function (doc, layout, opts) {
    var w = layout.width, c, ab, r, gb;
    if (opts.replaceItem) {
        try {
            if (opts.replaceItem.typename === 'TextFrame' && opts.replaceItem.anchor) { return [opts.replaceItem.anchor[0], opts.replaceItem.anchor[1]]; }
            gb = opts.replaceItem.geometricBounds;   /* [left, top, right, bottom] */
            r = Renderer.decodeNote(opts.replaceItem.note);
            if (r && r.offset) { return [gb[0] + r.offset[0], gb[1] + r.offset[1]]; }
            return [gb[0] - Layout.bounds(layout).left, gb[1] - Layout.bounds(layout).top];
        } catch (e) { /* fall through */ }
    }
    if (opts.position === 'artboard') {
        try {
            ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
            r = ab.artboardRect; /* [left, top, right, bottom] */
            return [(r[0] + r[2]) / 2 - w / 2, (r[1] + r[3]) / 2 - (layout.ascent - layout.descent) / 2];
        } catch (e1) { /* fall through */ }
    }
    try {
        c = doc.views[0].centerPoint;
        return [c[0] - w / 2, c[1] - (layout.ascent - layout.descent) / 2];
    } catch (e2) { return [0, 0]; }
};

/* All coordinates used by the renderer (view centre, artboard rectangle, item
   bounds, new point text) are taken in document coordinates; the user's
   app.coordinateSystem setting is restored afterwards. */
Renderer.useDocumentCoordinates = function () {
    var old = null;
    try {
        if (typeof CoordinateSystem !== 'undefined' && app.coordinateSystem !== undefined) {
            old = app.coordinateSystem;
            app.coordinateSystem = CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
        }
    } catch (e) { old = null; }
    return old;
};
Renderer.restoreCoordinates = function (old) {
    if (old === null || old === undefined) { return; }
    try { app.coordinateSystem = old; } catch (e) { /* ignore */ }
};
/* Main entry. opts: {latex, mode, position, replaceItem, name}
   Returns {ok, item, mode, warnings, stats}. Throws MathError on failure (after rollback). */
Renderer.insert = function (root, settings, opts) {
    var ctx = Renderer.checkDocument(), doc = ctx.doc, layer = ctx.layer, plan, metrics = null, layout, created = [], group = null,
        mode = opts.mode || 'group', colorCache = {}, i, p, origin, item, single, oldVisible = null, oldCS = null, warnings = [], plain, stats = { text: 0, paths: 0, rules: 0 };
    settings = Formatting.clean(settings);
    if (!U.contains(Renderer.MODES, mode)) { mode = 'group'; }
    if (!root.items.length) { throw new MathError(ErrorKind.STRUCTURE, 'The equation is empty. Type or build an equation first.'); }
    AST.validate(root);
    plan = Renderer.fontPlan(settings);
    plain = Serializer.plain(root);
    if (mode === 'single') {
        single = Serializer.toSingleText(root);
        if (!single.ok) { throw new MathError(ErrorKind.RENDER, 'Single text mode is not possible: ' + single.reason + ' Use "Editable group" instead.'); }
    }
    oldCS = Renderer.useDocumentCoordinates();
    try {
        if (opts.replaceItem) {
            try { oldVisible = opts.replaceItem.hidden; opts.replaceItem.hidden = true; } catch (eh) { oldVisible = null; }
        }
        group = layer.groupItems.add();
        created.push(group);
        group.name = Renderer.groupName(opts.name, plain);
        if (mode === 'single') {
            item = Renderer.drawSingle(group, single, settings, plan, doc, colorCache);
            stats.text = 1;
            layout = { width: item.width, ascent: settings.fontSize * 0.7, descent: settings.fontSize * 0.2, prims: [] };
            origin = Renderer.placement(doc, { width: item.width, ascent: 0.7 * settings.fontSize, descent: 0.2 * settings.fontSize, prims: [] }, opts);
            item.translate(origin[0] - item.anchor[0], origin[1] - item.anchor[1]);
        } else {
            metrics = Renderer.IllustratorMetrics(group, plan);
            layout = Layout.compute(root, settings, { metrics: metrics });
            metrics.dispose();
            metrics = null;
            origin = Renderer.placement(doc, layout, opts);
            for (i = 0; i < layout.prims.length; i++) {
                p = layout.prims[i];
                if (p.k === 'text') {
                    if (/^\s*$/.test(p.t)) { continue; }
                    created.push(Renderer.drawText(group, p, origin[0], origin[1], plan, doc, colorCache)); stats.text++;
                } else if (p.k === 'rule') { created.push(Renderer.drawRule(group, p, origin[0], origin[1], doc, colorCache)); stats.rules++; }
                else if (p.k === 'path' && p.role !== 'placeholder') { created.push(Renderer.drawPath(group, p, origin[0], origin[1], doc, colorCache)); stats.paths++; }
            }
        }
        if (mode === 'outlines') { Renderer.outlineText(group); }
        group.note = Renderer.encodeNote(opts.latex || Serializer.toLatex(root), settings, mode, Renderer.originOffset(group, origin));
        if (mode === 'components') { item = Renderer.ungroup(group, layer); warnings.push('Separate components cannot be re-edited as one equation.'); }
        else { item = group; }
        if (mode === 'single') { item = Renderer.unwrapSingle(group, layer, opts.latex || Serializer.toLatex(root), settings); }
        /* success: remove the equation being replaced */
        if (opts.replaceItem) {
            try { opts.replaceItem.remove(); } catch (er) { warnings.push('The previous version could not be removed: ' + er); }
        }
        try { doc.selection = null; item.selected = true; } catch (es) { /* selection is cosmetic */ }
    } catch (e) {
        if (metrics) { metrics.dispose(); }
        Renderer.rollback(created);
        Renderer.restoreCoordinates(oldCS);
        if (opts.replaceItem && oldVisible !== null) { try { opts.replaceItem.hidden = oldVisible; } catch (eh2) { /* ignore */ } }
        throw (e instanceof MathError) ? e : new MathError(ErrorKind.RENDER, 'Insertion failed and was rolled back: ' + (e.message || e), (e.line ? 'line ' + e.line : ''));
    }
    Renderer.restoreCoordinates(oldCS);
    for (i = 0; i < plan.warnings.length; i++) { if (!U.contains(warnings, plan.warnings[i])) { warnings.push(plan.warnings[i]); } }
    return { ok: true, item: item, mode: mode, warnings: warnings, stats: stats, fonts: { math: plan.math, text: plan.text } };
};
Renderer.groupName = function (name, plain) {
    var t = U.trim(name || '') || plain;
    if (t.length > 60) { t = t.substring(0, 57) + '...'; }
    return 'Equation: ' + t;
};
Renderer.rollback = function (created) {
    var i;
    for (i = created.length - 1; i >= 0; i--) {
        try { created[i].remove(); } catch (e) { /* removing the group removes children; ignore */ }
    }
};
Renderer.outlineText = function (group) {
    var frames = [], i;
    for (i = 0; i < group.textFrames.length; i++) { frames.push(group.textFrames[i]); }
    for (i = 0; i < frames.length; i++) { frames[i].createOutline(); }
};
Renderer.ungroup = function (group, layer) {
    var items = [], i, first = null;
    for (i = 0; i < group.pageItems.length; i++) { items.push(group.pageItems[i]); }
    for (i = 0; i < items.length; i++) {
        items[i].move(layer, ElementPlacement.PLACEATBEGINNING);
        if (!first) { first = items[i]; }
    }
    group.remove();
    return first;
};
Renderer.drawSingle = function (group, single, settings, plan, doc, colorCache) {
    var tf = group.textFrames.pointText([0, 0]), i, run, r, ca, ps, face, f, first = true;
    for (i = 0; i < single.runs.length; i++) {
        run = single.runs[i];
        face = 'math';
        ps = Renderer.resolveRun(plan, run.text, face, !!(settings.bold || (run.style && run.style.bold)), run.kind === 'italic', run.style && run.style.font);
        if (first) { tf.contents = ps.contents; r = tf.textRange; first = false; }
        else { r = tf.characters.add(ps.contents); }
        ca = r.characterAttributes;
        if (ps.ps) { try { f = app.textFonts.getByName(ps.ps); ca.textFont = f; } catch (e) { /* keep default font */ } }
        ca.size = settings.fontSize * ((run.style && U.isNumber(run.style.scale)) ? run.style.scale : 1);
        ca.fillColor = Renderer.colorFor(doc, (run.style && run.style.color) || settings.color, colorCache);
    }
    tf.name = 'Equation text';
    return tf;
};
/* Single mode: the text object itself carries the note (no wrapper group). */
Renderer.unwrapSingle = function (group, layer, latex, settings) {
    var tf = group.textFrames[0];
    tf.move(layer, ElementPlacement.PLACEATBEGINNING);
    tf.note = Renderer.encodeNote(latex, settings, 'single');
    tf.name = group.name;
    group.remove();
    return tf;
};
