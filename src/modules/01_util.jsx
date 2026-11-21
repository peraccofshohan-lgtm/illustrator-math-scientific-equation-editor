/* ==========================================================================
 * Module 01 - ES3-safe utility helpers
 * ExtendScript implements ECMAScript 3: no Array.indexOf/forEach/map,
 * no String.trim, no Object.keys, no JSON, no Date.now.
 * ========================================================================== */
var U = {};

U.isArray = function (v) {
    return Object.prototype.toString.call(v) === '[object Array]';
};
U.isString = function (v) { return typeof v === 'string'; };
U.isNumber = function (v) { return typeof v === 'number' && !isNaN(v) && isFinite(v); };
U.has = function (obj, key) { return obj !== null && obj !== undefined && Object.prototype.hasOwnProperty.call(obj, key); };

U.each = function (arr, fn) {
    if (!arr) { return; }
    for (var i = 0; i < arr.length; i++) {
        if (fn(arr[i], i) === false) { return; }
    }
};
U.map = function (arr, fn) {
    var out = [];
    for (var i = 0; i < arr.length; i++) { out.push(fn(arr[i], i)); }
    return out;
};
U.filter = function (arr, fn) {
    var out = [];
    for (var i = 0; i < arr.length; i++) { if (fn(arr[i], i)) { out.push(arr[i]); } }
    return out;
};
U.indexOf = function (arr, v) {
    if (!arr) { return -1; }
    for (var i = 0; i < arr.length; i++) { if (arr[i] === v) { return i; } }
    return -1;
};
U.contains = function (arr, v) { return U.indexOf(arr, v) >= 0; };
U.find = function (arr, fn) {
    for (var i = 0; i < arr.length; i++) { if (fn(arr[i], i)) { return arr[i]; } }
    return null;
};
U.keys = function (obj) {
    var out = [];
    for (var k in obj) { if (U.has(obj, k)) { out.push(k); } }
    return out;
};
U.extend = function (dst, src) {
    if (src) { for (var k in src) { if (U.has(src, k)) { dst[k] = src[k]; } } }
    return dst;
};
/* Deep clone for plain data (objects, arrays, primitives). */
U.clone = function (v) {
    var i, out, k;
    if (v === null || typeof v !== 'object') { return v; }
    if (U.isArray(v)) {
        out = [];
        for (i = 0; i < v.length; i++) { out.push(U.clone(v[i])); }
        return out;
    }
    out = {};
    for (k in v) { if (U.has(v, k)) { out[k] = U.clone(v[k]); } }
    return out;
};
U.trim = function (s) { return String(s).replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, ''); };
U.lower = function (s) { return String(s).toLowerCase(); };
U.startsWith = function (s, p) { return String(s).substring(0, p.length) === p; };
U.endsWith = function (s, p) { s = String(s); return s.length >= p.length && s.substring(s.length - p.length) === p; };
U.repeat = function (s, n) { var o = ''; for (var i = 0; i < n; i++) { o += s; } return o; };
U.pad = function (s, n, ch) { s = String(s); while (s.length < n) { s = (ch || '0') + s; } return s; };
U.clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };
U.round = function (v, d) { var m = Math.pow(10, d || 0); return Math.round(v * m) / m; };
U.now = function () { return new Date().getTime(); };
U.max = function (a, b) { return a > b ? a : b; };
U.min = function (a, b) { return a < b ? a : b; };
/* Strict number parsing for user input and stored data: the whole string must
   be a decimal number (comma accepted as decimal separator). Returns the
   fallback, or null, for anything else (never NaN / Infinity / undefined). */
U.toNumber = function (s, fallback) {
    var t, n;
    fallback = (fallback === undefined) ? null : fallback;
    if (typeof s === 'number') { return (isFinite(s) && !isNaN(s)) ? s : fallback; }
    if (typeof s !== 'string') { return fallback; }
    t = U.trim(s).replace(',', '.');
    if (!/^[+\-]?(\d+\.?\d*|\.\d+)([eE][+\-]?\d+)?$/.test(t)) { return fallback; }
    n = parseFloat(t);
    return (isFinite(n) && !isNaN(n)) ? n : fallback;
};
U.isoDate = function (t) {
    var d = new Date(t || U.now());
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1, 2) + '-' + U.pad(d.getDate(), 2) + ' ' +
        U.pad(d.getHours(), 2) + ':' + U.pad(d.getMinutes(), 2);
};
U.uid = (function () {
    var c = 0;
    return function (prefix) {
        c++;
        return (prefix || 'id') + U.now().toString(36) + c.toString(36) + Math.floor(Math.random() * 1679616).toString(36);
    };
}());

/* Split a string into user-perceived code points (handles UTF-16 surrogates). */
U.codePoints = function (s) {
    var out = [], i, c, d;
    s = String(s);
    for (i = 0; i < s.length; i++) {
        c = s.charCodeAt(i);
        if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
            d = s.charCodeAt(i + 1);
            if (d >= 0xDC00 && d <= 0xDFFF) { out.push(s.charAt(i) + s.charAt(i + 1)); i++; continue; }
        }
        out.push(s.charAt(i));
    }
    return out;
};
U.codePointOf = function (ch) {
    var c = ch.charCodeAt(0), d;
    if (c >= 0xD800 && c <= 0xDBFF && ch.length > 1) {
        d = ch.charCodeAt(1);
        return (c - 0xD800) * 0x400 + (d - 0xDC00) + 0x10000;
    }
    return c;
};
U.fromCodePoint = function (cp) {
    if (cp <= 0xFFFF) { return String.fromCharCode(cp); }
    cp -= 0x10000;
    return String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
};
U.unicodeLabel = function (s) {
    var cps = U.codePoints(s), out = [];
    for (var i = 0; i < cps.length; i++) { out.push('U+' + U.pad(U.codePointOf(cps[i]).toString(16).toUpperCase(), 4)); }
    return out.join(' ');
};

/* ---- Colors: stored as '#RRGGBB' strings ---------------------------------- */
U.NAMED_COLORS = {
    black: '#000000', white: '#FFFFFF', red: '#E00000', green: '#008A00', blue: '#0047CC',
    cyan: '#00A0E0', magenta: '#D0008A', yellow: '#E0B000', orange: '#F07800', purple: '#7A1FA2',
    gray: '#808080', grey: '#808080', brown: '#8B4513', teal: '#008080', navy: '#001F7A',
    maroon: '#800000', olive: '#6B6B00', darkgray: '#404040', lightgray: '#C0C0C0', pink: '#F06292'
};
U.normalizeColor = function (c) {
    var s, m;
    if (c === null || c === undefined) { return null; }
    s = U.lower(U.trim(c));
    if (U.has(U.NAMED_COLORS, s)) { return U.NAMED_COLORS[s]; }
    m = /^#?([0-9a-f]{6})$/.exec(s);
    if (m) { return '#' + m[1].toUpperCase(); }
    m = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
    if (m) { return ('#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3]).toUpperCase(); }
    m = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(s);
    if (m) { return U.rgbToHex([parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)]); }
    return null;
};
U.hexToRgb = function (hex) {
    var h = U.normalizeColor(hex) || '#000000';
    return [parseInt(h.substring(1, 3), 16), parseInt(h.substring(3, 5), 16), parseInt(h.substring(5, 7), 16)];
};
U.rgbToHex = function (rgb) {
    function c(v) { return U.pad(U.clamp(Math.round(v), 0, 255).toString(16).toUpperCase(), 2); }
    return '#' + c(rgb[0]) + c(rgb[1]) + c(rgb[2]);
};
/* Simple RGB -> CMYK (percent). Pure black maps to K=100 (no rich black). */
U.rgbToCmyk = function (rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    var k = 1 - Math.max(r, Math.max(g, b));
    if (k >= 0.9999) { return [0, 0, 0, 100]; }
    return [U.round((1 - r - k) / (1 - k) * 100, 2), U.round((1 - g - k) / (1 - k) * 100, 2),
        U.round((1 - b - k) / (1 - k) * 100, 2), U.round(k * 100, 2)];
};

/* Simple ASCII-insensitive search scoring used by every search box. */
U.searchScore = function (query, fields) {
    var q = U.lower(U.trim(query)), best = 0, i, f, idx, terms, t, all, score;
    if (!q) { return 1; }
    terms = q.split(/\s+/);
    all = U.lower(fields.join(' | '));
    for (t = 0; t < terms.length; t++) { if (all.indexOf(terms[t]) < 0) { return 0; } }
    for (i = 0; i < fields.length; i++) {
        f = U.lower(fields[i] || '');
        if (!f) { continue; }
        if (f === q) { score = 100 - i; }
        else if ((idx = f.indexOf(q)) === 0) { score = 80 - i; }
        else if (idx > 0) { score = 60 - i; }
        else { score = 20; }
        if (score > best) { best = score; }
    }
    return best || 10;
};
