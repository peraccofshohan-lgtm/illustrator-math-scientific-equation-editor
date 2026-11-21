/* ==========================================================================
 * Module 30 - Formatting settings and font handling
 * All layout dimensions are expressed in em (relative to the font size) so
 * an equation scales uniformly. Settings are validated and clamped on every
 * load, so corrupted or hand-edited data can never produce invalid layout.
 * ========================================================================== */
var Formatting = {};

/* [key, default, type, min, max, label] */
Formatting.SPEC = [
    ['fontSize', 24, 'number', 2, 1296, 'Font size (pt)'],
    ['mathFont', 'auto', 'string', 0, 0, 'Math font'],
    ['textFont', 'auto', 'string', 0, 0, 'Text font'],
    ['color', '#000000', 'color', 0, 0, 'Color'],
    ['bold', false, 'boolean', 0, 0, 'Bold'],
    ['italicVariables', true, 'boolean', 0, 0, 'Italic variables'],
    ['italicGreekLower', true, 'boolean', 0, 0, 'Italic lowercase Greek'],
    ['displayStyle', true, 'boolean', 0, 0, 'Display style (large operators, full-size fractions)'],
    ['letterSpacing', 0, 'number', -0.2, 1, 'Letter spacing (em)'],
    ['operatorSpacing', 1, 'number', 0, 4, 'Operator spacing (\u00D7)'],
    ['barThickness', 0.05, 'number', 0.01, 0.3, 'Fraction bar thickness (em)'],
    ['strokeWidth', 0.055, 'number', 0.01, 0.3, 'Bracket / radical stroke (em)'],
    ['fractionGap', 0.14, 'number', 0, 1.5, 'Fraction gap (em)'],
    ['scriptScale', 0.7, 'number', 0.3, 1, 'Script size (\u00D7)'],
    ['scriptScriptScale', 0.55, 'number', 0.2, 1, 'Second-level script size (\u00D7)'],
    ['supOffset', 0, 'number', -1, 1, 'Superscript extra raise (em)'],
    ['subOffset', 0, 'number', -1, 1, 'Subscript extra drop (em)'],
    ['matrixRowGap', 0.45, 'number', 0, 4, 'Matrix row gap (em)'],
    ['matrixColGap', 0.9, 'number', 0, 6, 'Matrix column gap (em)'],
    ['lineGap', 0.4, 'number', 0, 6, 'Multiline gap (em)'],
    ['bigOpScale', 1.45, 'number', 1, 3, 'Large operator size, display (\u00D7)'],
    ['integralScale', 1.9, 'number', 1, 4, 'Integral size, display (\u00D7)'],
    ['boxPadding', 0.25, 'number', 0, 2, 'Box padding (em)'],
    ['alignment', 'center', 'enum:left,center,right', 0, 0, 'Multiline alignment']
];
Formatting.defaults = function () {
    var d = {}, i;
    for (i = 0; i < Formatting.SPEC.length; i++) { d[Formatting.SPEC[i][0]] = Formatting.SPEC[i][1]; }
    return d;
};
Formatting.specFor = function (key) {
    var i;
    for (i = 0; i < Formatting.SPEC.length; i++) { if (Formatting.SPEC[i][0] === key) { return Formatting.SPEC[i]; } }
    return null;
};
/* Validate one value; returns the clean value or the default. */
Formatting.cleanValue = function (key, v) {
    var sp = Formatting.specFor(key), n, opts, c;
    if (!sp) { return undefined; }
    switch (sp[2]) {
    case 'number':
        n = U.toNumber(v);
        if (n === null) { return sp[1]; }
        return U.clamp(n, sp[3], sp[4]);
    case 'boolean':
        if (v === true || v === 'true' || v === 1) { return true; }
        if (v === false || v === 'false' || v === 0) { return false; }
        return sp[1];
    case 'color':
        c = U.normalizeColor(v);
        return c || sp[1];
    case 'string':
        if (typeof v !== 'string' || !U.trim(v)) { return sp[1]; }
        return U.trim(v).substring(0, 120);
    default:
        if (sp[2].indexOf('enum:') === 0) {
            opts = sp[2].substring(5).split(',');
            return U.contains(opts, v) ? v : sp[1];
        }
    }
    return sp[1];
};
Formatting.clean = function (obj) {
    var d = Formatting.defaults(), k, out = {};
    obj = (obj && typeof obj === 'object') ? obj : {};
    for (k in d) { if (U.has(d, k)) { out[k] = U.has(obj, k) ? Formatting.cleanValue(k, obj[k]) : d[k]; } }
    return out;
};
Formatting.merge = function (base, patch) {
    var out = U.clone(base), k;
    for (k in patch) { if (U.has(patch, k) && Formatting.specFor(k)) { out[k] = Formatting.cleanValue(k, patch[k]); } }
    return out;
};
Formatting.PRESETS = {
    'Default': {},
    'Textbook (large display)': { fontSize: 28, displayStyle: true, bigOpScale: 1.5, integralScale: 2 },
    'Inline / compact': { displayStyle: false, matrixRowGap: 0.3, matrixColGap: 0.7, fractionGap: 0.1 },
    'Presentation (bold)': { fontSize: 40, bold: true, barThickness: 0.07, strokeWidth: 0.07 },
    'Upright Greek (ISO style)': { italicGreekLower: false },
    'Poster (very large)': { fontSize: 96, barThickness: 0.06 }
};

/* ---- Fonts --------------------------------------------------------------- */
var Fonts = {};
Fonts._installed = null;   /* lowercase name / family -> PostScript name */
Fonts._families = null;
Fonts._familyNames = null;
/* Reads the installed font list once; works only inside Illustrator. */
Fonts.scan = function (force) {
    var i, f, list, n;
    if (Fonts._installed && !force) { return Fonts._installed; }
    Fonts._installed = {};
    Fonts._families = {};
    Fonts._familyNames = {};
    if (typeof app === 'undefined' || !app.textFonts) { return Fonts._installed; }
    try {
        list = app.textFonts;
        n = list.length;
        for (i = 0; i < n; i++) {
            f = list[i];
            try {
                Fonts._installed[U.lower(f.name)] = f.name;
                if (f.family) {
                    if (!Fonts._families[U.lower(f.family)]) { Fonts._families[U.lower(f.family)] = []; Fonts._familyNames[U.lower(f.family)] = f.family; }
                    Fonts._families[U.lower(f.family)].push({ name: f.name, style: f.style || '' });
                }
            } catch (e1) { /* skip unreadable font entries */ }
        }
    } catch (e) { Log.warn('Font scan failed: ' + e); }
    return Fonts._installed;
};
Fonts.count = function () { return U.keys(Fonts.scan()).length; };
/* Resolve a family or PostScript name with a wanted style -> PostScript name or null. */
Fonts.resolve = function (name, bold, italic) {
    var inst = Fonts.scan(), fam, i, st, want, best = null, bestScore = -1, score, key;
    if (!name) { return null; }
    key = U.lower(name);
    fam = Fonts._families ? Fonts._families[key] : null;
    if (!fam) {
        /* family names with spaces are often PostScript names without spaces */
        fam = Fonts._families ? Fonts._families[key.replace(/\s+/g, '')] : null;
    }
    if (fam && fam.length) {
        want = (bold ? 'bold' : '') + (italic ? 'italic' : '');
        for (i = 0; i < fam.length; i++) {
            st = U.lower(fam[i].style).replace(/\s+/g, '').replace('oblique', 'italic');
            score = 0;
            if (st === (want || 'regular')) { score = 10; }
            else if (!want && (st === 'roman' || st === 'book' || st === 'normal' || st === 'medium')) { score = 8; }
            else if (want && st.indexOf(want) >= 0) { score = 6; }
            else if (!want && st.indexOf('bold') < 0 && st.indexOf('italic') < 0) { score = 4; }
            if (score > bestScore) { bestScore = score; best = fam[i].name; }
        }
        return best;
    }
    if (U.has(inst, key)) { return inst[key]; }
    if (U.has(inst, key.replace(/\s+/g, ''))) { return inst[key.replace(/\s+/g, '')]; }
    if (U.has(inst, key.replace(/\s+/g, '-'))) { return inst[key.replace(/\s+/g, '-')]; }
    return null;
};
Fonts.isInstalled = function (name) { return !!Fonts.resolve(name, false, false); };
Fonts.firstAvailable = function (list) {
    var i;
    for (i = 0; i < list.length; i++) { if (Fonts.isInstalled(list[i])) { return list[i]; } }
    return null;
};
/* Effective font families for a settings object, with warnings. */
Fonts.effective = function (settings) {
    var r = { math: null, text: null, warnings: [] }, m = settings.mathFont, t = settings.textFont, auto;
    if (m && m !== 'auto') {
        if (Fonts.isInstalled(m)) { r.math = m; }
        else { r.warnings.push('Math font "' + m + '" is not installed; a fallback is used.'); }
    }
    if (!r.math) {
        auto = Fonts.firstAvailable(MathData.MATH_FONTS) || Fonts.firstAvailable(MathData.TEXT_FONTS);
        r.math = auto;
        if (!auto && Fonts.count() > 0) { r.warnings.push('No recommended math font found. Install STIX Two Math, Cambria Math or Latin Modern Math for full symbol coverage.'); }
    }
    if (t && t !== 'auto') {
        if (Fonts.isInstalled(t)) { r.text = t; }
        else { r.warnings.push('Text font "' + t + '" is not installed; a fallback is used.'); }
    }
    if (!r.text) { r.text = Fonts.firstAvailable(MathData.TEXT_FONTS) || r.math; }
    return r;
};
Fonts.recommendations = function () {
    var out = [], i, all = MathData.MATH_FONTS;
    for (i = 0; i < all.length; i++) { out.push({ name: all[i], installed: Fonts.isInstalled(all[i]) }); }
    return out;
};
Fonts.displayFamilies = function () {
    var k, out = [];
    Fonts.scan();
    for (k in Fonts._familyNames) { if (U.has(Fonts._familyNames, k)) { out.push(Fonts._familyNames[k]); } }
    out.sort(function (a, b) { return U.lower(a) < U.lower(b) ? -1 : U.lower(a) > U.lower(b) ? 1 : 0; });
    return out;
};
