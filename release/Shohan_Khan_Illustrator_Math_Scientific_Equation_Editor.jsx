/*
 * Adobe Illustrator Advanced Mathematical & Scientific Equation Editor
 * Math & Scientific Equation Editor v1.0.0-rc.1
 * Created by Shohan Khan
 * License: MIT  (see LICENSE in the source repository)
 * Source: https://github.com/peraccofshohan-lgtm/illustrator-math-scientific-equation-editor
 *
 * Install: File > Scripts > Other Script... in Illustrator, or copy into the
 * Illustrator Presets/<locale>/Scripts folder and restart Illustrator.
 * GENERATED FILE - edit src/modules/*.jsx and run "npm run build".
 */
#target illustrator
#targetengine "main"
/* ---- 00_header.jsx ---- */
/* ==========================================================================
 * Math & Scientific Equation Editor for Adobe Illustrator
 * Created by Shohan Khan
 *
 * Module 00 - Header / application namespace
 *
 * The whole runtime lives inside one closure so that nothing leaks into the
 * shared ExtendScript engine. Syntax baseline: ECMAScript 3 (ExtendScript).
 * ========================================================================== */
(function (GLOBAL) {

var MSEE = {};
MSEE.APP_NAME = 'Math & Scientific Equation Editor';
MSEE.APP_TITLE_FULL = 'Adobe Illustrator Advanced Mathematical & Scientific Equation Editor';
MSEE.AUTHOR = 'Shohan Khan';
MSEE.ATTRIBUTION = 'Created by Shohan Khan';
MSEE.VERSION = '1.0.0-rc.1';
MSEE.DATA_FORMAT = 'MSEE-Library';
MSEE.DATA_FORMAT_VERSION = 1;
MSEE.NOTE_PREFIX = 'MSEE:1:';
MSEE.DATA_FOLDER_NAME = 'ShohanKhan-MathEquationEditor';
MSEE.TEST_MODE = (typeof MSEE_TEST_MODE !== 'undefined' && MSEE_TEST_MODE === true);

/* ---- 01_util.jsx ---- */
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
U.toNumber = function (s, fallback) {
    var n = parseFloat(String(s).replace(',', '.'));
    return U.isNumber(n) ? n : fallback;
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

/* ---- 02_json.jsx ---- */
/* ==========================================================================
 * Module 02 - Safe JSON serializer / parser (no eval, ever)
 * ExtendScript (ES3) has no native JSON object. This strict recursive
 * descent parser accepts RFC 8259 JSON only and enforces depth/size limits,
 * so imported or saved data can never execute as code.
 * ========================================================================== */
var JSONX = {};
JSONX.MAX_DEPTH = 200;
JSONX.MAX_LENGTH = 20 * 1024 * 1024;

JSONX.quote = function (s) {
    var out = '"', i, c, code;
    s = String(s);
    for (i = 0; i < s.length; i++) {
        c = s.charAt(i);
        code = s.charCodeAt(i);
        if (c === '"') { out += '\\"'; }
        else if (c === '\\') { out += '\\\\'; }
        else if (c === '\n') { out += '\\n'; }
        else if (c === '\r') { out += '\\r'; }
        else if (c === '\t') { out += '\\t'; }
        else if (code < 0x20 || code > 0x7E) { out += '\\u' + U.pad(code.toString(16), 4); }
        else { out += c; }
    }
    return out + '"';
};

JSONX.stringify = function (value, indent) {
    var ind = indent ? (typeof indent === 'number' ? U.repeat(' ', indent) : indent) : '';
    function ser(v, cur, depth) {
        var parts, i, k, keys, nl, next;
        if (depth > JSONX.MAX_DEPTH) { throw new Error('JSON nesting too deep'); }
        if (v === null || v === undefined) { return 'null'; }
        if (typeof v === 'number') { return (isFinite(v) ? String(v) : 'null'); }
        if (typeof v === 'boolean') { return v ? 'true' : 'false'; }
        if (typeof v === 'string') { return JSONX.quote(v); }
        if (typeof v === 'function') { return 'null'; }
        next = cur + ind;
        nl = ind ? '\n' : '';
        if (U.isArray(v)) {
            if (!v.length) { return '[]'; }
            parts = [];
            for (i = 0; i < v.length; i++) { parts.push(next + ser(v[i], next, depth + 1)); }
            return '[' + nl + parts.join(',' + nl) + nl + cur + ']';
        }
        keys = U.keys(v);
        parts = [];
        for (i = 0; i < keys.length; i++) {
            k = keys[i];
            if (v[k] === undefined || typeof v[k] === 'function') { continue; }
            parts.push(next + JSONX.quote(k) + (ind ? ': ' : ':') + ser(v[k], next, depth + 1));
        }
        if (!parts.length) { return '{}'; }
        return '{' + nl + parts.join(',' + nl) + nl + cur + '}';
    }
    return ser(value, '', 0);
};

JSONX.parse = function (text) {
    var s = String(text), i = 0, len = s.length;
    if (len > JSONX.MAX_LENGTH) { throw new Error('JSON data too large'); }
    if (s.charCodeAt(0) === 0xFEFF) { i = 1; }
    function fail(msg) { throw new Error('Invalid JSON at character ' + i + ': ' + msg); }
    function ws() {
        var c;
        while (i < len) {
            c = s.charAt(i);
            if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; } else { break; }
        }
    }
    function str() {
        var out = '', c, h;
        i++; /* opening quote */
        while (i < len) {
            c = s.charAt(i++);
            if (c === '"') { return out; }
            if (c === '\\') {
                c = s.charAt(i++);
                if (c === '"' || c === '\\' || c === '/') { out += c; }
                else if (c === 'n') { out += '\n'; }
                else if (c === 'r') { out += '\r'; }
                else if (c === 't') { out += '\t'; }
                else if (c === 'b') { out += '\b'; }
                else if (c === 'f') { out += '\f'; }
                else if (c === 'u') {
                    h = s.substring(i, i + 4);
                    if (!/^[0-9a-fA-F]{4}$/.test(h)) { fail('bad unicode escape'); }
                    out += String.fromCharCode(parseInt(h, 16));
                    i += 4;
                } else { fail('bad escape'); }
            } else {
                if (c.charCodeAt(0) < 0x20) { fail('control character in string'); }
                out += c;
            }
        }
        fail('unterminated string');
    }
    function num() {
        var m = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+\-]?[0-9]+)?/.exec(s.substring(i, i + 64));
        if (!m) { fail('bad number'); }
        i += m[0].length;
        return parseFloat(m[0]);
    }
    function val(depth) {
        var c, arr, obj, k;
        if (depth > JSONX.MAX_DEPTH) { fail('nesting too deep'); }
        ws();
        if (i >= len) { fail('unexpected end'); }
        c = s.charAt(i);
        if (c === '{') {
            i++; obj = {}; ws();
            if (s.charAt(i) === '}') { i++; return obj; }
            while (true) {
                ws();
                if (s.charAt(i) !== '"') { fail('expected key'); }
                k = str(); ws();
                if (s.charAt(i) !== ':') { fail('expected :'); }
                i++;
                obj[k] = val(depth + 1); ws();
                c = s.charAt(i++);
                if (c === '}') { return obj; }
                if (c !== ',') { fail('expected , or }'); }
            }
        }
        if (c === '[') {
            i++; arr = []; ws();
            if (s.charAt(i) === ']') { i++; return arr; }
            while (true) {
                arr.push(val(depth + 1)); ws();
                c = s.charAt(i++);
                if (c === ']') { return arr; }
                if (c !== ',') { fail('expected , or ]'); }
            }
        }
        if (c === '"') { return str(); }
        if (c === '-' || (c >= '0' && c <= '9')) { return num(); }
        if (s.substring(i, i + 4) === 'true') { i += 4; return true; }
        if (s.substring(i, i + 5) === 'false') { i += 5; return false; }
        if (s.substring(i, i + 4) === 'null') { i += 4; return null; }
        fail('unexpected character "' + c + '"');
    }
    var result = val(0);
    ws();
    if (i < len) { fail('trailing characters'); }
    return result;
};

/* ---- 03_errors.jsx ---- */
/* ==========================================================================
 * Module 03 - Centralized error handling and logging
 * ========================================================================== */
var ErrorKind = {
    PARSER: 'Parser error',
    STRUCTURE: 'Invalid mathematical structure',
    FONT: 'Missing font',
    GLYPH: 'Missing glyph',
    ILLUSTRATOR: 'Illustrator API error',
    FILE: 'File access error',
    SERIALIZATION: 'Serialization error',
    UI: 'User interface error',
    INSERTION: 'Insertion error',
    COMPATIBILITY: 'Compatibility error',
    VALIDATION: 'Validation error',
    CHEMISTRY: 'Chemistry error',
    INTERNAL: 'Internal error'
};

/* MathError carries a category, a user-facing message and optional details. */
function MathError(kind, message, details, pos) {
    this.name = 'MathError';
    this.kind = kind || ErrorKind.INTERNAL;
    this.message = message || 'Unknown error';
    this.details = details || '';
    this.pos = (typeof pos === 'number') ? pos : -1;
}
MathError.prototype.toString = function () {
    return this.kind + ': ' + this.message + (this.pos >= 0 ? ' (at character ' + (this.pos + 1) + ')' : '');
};

var Log = {
    entries: [],
    max: 400,
    add: function (level, msg) {
        Log.entries.push('[' + U.isoDate() + '] ' + level + ': ' + msg);
        if (Log.entries.length > Log.max) { Log.entries.shift(); }
    },
    info: function (m) { Log.add('INFO', m); },
    warn: function (m) { Log.add('WARN', m); },
    error: function (m) { Log.add('ERROR', m); },
    text: function () { return Log.entries.join('\n'); },
    clear: function () { Log.entries = []; }
};

var Errors = {};
/* Normalize any thrown value into a MathError. */
Errors.wrap = function (e, kind) {
    if (e && e.name === 'MathError') { return e; }
    var msg = (e && e.message) ? e.message : String(e);
    var det = '';
    if (e && e.line) { det = 'Line ' + e.line; }
    return new MathError(kind || ErrorKind.INTERNAL, Errors.friendly(msg), msg + (det ? ' (' + det + ')' : ''));
};
/* Translate raw ExtendScript / Illustrator messages into readable text. */
Errors.friendly = function (msg) {
    var m = String(msg);
    if (/no such element/i.test(m)) { return 'A referenced Illustrator object no longer exists.'; }
    if (/locked/i.test(m)) { return 'The target layer or object is locked.'; }
    if (/target layer cannot be modified/i.test(m)) { return 'The target layer cannot be modified (it may be locked or hidden).'; }
    if (/document/i.test(m) && /no/i.test(m) && /open/i.test(m)) { return 'No document is open.'; }
    if (/undefined is not an object/i.test(m)) { return 'An internal object was unexpectedly missing.'; }
    return m;
};
Errors.report = function (e, kind) {
    var err = Errors.wrap(e, kind);
    Log.error(err.kind + ' - ' + err.message + (err.details ? ' | ' + err.details : ''));
    return err;
};
/* Run fn safely; return {ok, value, error}. */
Errors.attempt = function (fn, kind) {
    try { return { ok: true, value: fn() }; }
    catch (e) { return { ok: false, error: Errors.report(e, kind) }; }
};

/* ---- 10_mathdata.jsx ---- */
/* ==========================================================================
 * Module 10 - Mathematical command tables
 * Maps syntax commands to Unicode characters and TeX atom classes.
 * Atom classes follow TeX: ord, op, bin, rel, open, close, punct, inner.
 * ========================================================================== */
var MathData = {};

/* name -> [character, class] -------------------------------------------- */
MathData.CMD = {};
(function () {
    function def(cls, list) {
        var parts = list.split(' '), i, kv;
        for (i = 0; i < parts.length; i++) {
            if (!parts[i]) { continue; }
            kv = parts[i].split('=');
            MathData.CMD[kv[0]] = [kv[1], cls];
        }
    }
    /* Greek lowercase (TeX / unicode-math conventions) */
    def('ord', 'alpha=\u03B1 beta=\u03B2 gamma=\u03B3 delta=\u03B4 epsilon=\u03F5 varepsilon=\u03B5 zeta=\u03B6 eta=\u03B7 ' +
        'theta=\u03B8 vartheta=\u03D1 iota=\u03B9 kappa=\u03BA varkappa=\u03F0 lambda=\u03BB mu=\u03BC nu=\u03BD xi=\u03BE ' +
        'omicron=\u03BF pi=\u03C0 varpi=\u03D6 rho=\u03C1 varrho=\u03F1 sigma=\u03C3 varsigma=\u03C2 tau=\u03C4 upsilon=\u03C5 ' +
        'phi=\u03D5 varphi=\u03C6 chi=\u03C7 psi=\u03C8 omega=\u03C9 digamma=\u03DD');
    /* Greek uppercase */
    def('ord', 'Alpha=\u0391 Beta=\u0392 Gamma=\u0393 Delta=\u0394 Epsilon=\u0395 Zeta=\u0396 Eta=\u0397 Theta=\u0398 ' +
        'Iota=\u0399 Kappa=\u039A Lambda=\u039B Mu=\u039C Nu=\u039D Xi=\u039E Omicron=\u039F Pi=\u03A0 Rho=\u03A1 ' +
        'Sigma=\u03A3 Tau=\u03A4 Upsilon=\u03A5 Phi=\u03A6 Chi=\u03A7 Psi=\u03A8 Omega=\u03A9 varGamma=\u0393 varDelta=\u0394 ' +
        'varTheta=\u0398 varLambda=\u039B varPi=\u03A0 varSigma=\u03A3 varPhi=\u03A6 varPsi=\u03A8 varOmega=\u03A9');
    /* Binary operators */
    def('bin', 'pm=\u00B1 mp=\u2213 times=\u00D7 div=\u00F7 cdot=\u22C5 ast=\u2217 star=\u22C6 circ=\u2218 bullet=\u2219 ' +
        'oplus=\u2295 ominus=\u2296 otimes=\u2297 oslash=\u2298 odot=\u2299 cup=\u222A cap=\u2229 sqcup=\u2294 sqcap=\u2293 ' +
        'vee=\u2228 lor=\u2228 wedge=\u2227 land=\u2227 setminus=\u2216 smallsetminus=\u2216 wr=\u2240 diamond=\u22C4 ' +
        'bigtriangleup=\u25B3 bigtriangledown=\u25BD triangleleft=\u25C1 triangleright=\u25B7 dagger=\u2020 ddagger=\u2021 ' +
        'amalg=\u2A3F uplus=\u228E boxplus=\u229E boxminus=\u229F boxtimes=\u22A0 boxdot=\u22A1 ltimes=\u22C9 rtimes=\u22CA ' +
        'divideontimes=\u22C7 dotplus=\u2214 intercal=\u22BA barwedge=\u22BC veebar=\u22BB nand=\u22BC xor=\u22BB ' +
        'centerdot=\u00B7 bmod=mod');
    /* Relations */
    def('rel', 'leq=\u2264 le=\u2264 geq=\u2265 ge=\u2265 neq=\u2260 ne=\u2260 equiv=\u2261 approx=\u2248 sim=\u223C ' +
        'simeq=\u2243 cong=\u2245 propto=\u221D ll=\u226A gg=\u226B lll=\u22D8 ggg=\u22D9 prec=\u227A succ=\u227B preceq=\u2AAF succeq=\u2AB0 ' +
        'subset=\u2282 supset=\u2283 subseteq=\u2286 supseteq=\u2287 subsetneq=\u228A supsetneq=\u228B nsubseteq=\u2288 ' +
        'nsupseteq=\u2289 nsubset=\u2284 nsupset=\u2285 in=\u2208 notin=\u2209 ni=\u220B owns=\u220B notni=\u220C perp=\u22A5 ' +
        'parallel=\u2225 nparallel=\u2226 mid=\u2223 nmid=\u2224 divides=\u2223 vdash=\u22A2 dashv=\u22A3 models=\u22A8 ' +
        'vDash=\u22A8 Vdash=\u22A9 asymp=\u224D doteq=\u2250 triangleq=\u225C coloneqq=\u2254 eqqcolon=\u2255 ' +
        'leqslant=\u2A7D geqslant=\u2A7E lesssim=\u2272 gtrsim=\u2273 approxeq=\u224A nless=\u226E ngtr=\u226F ' +
        'nleq=\u2270 ngeq=\u2271 nsim=\u2241 ncong=\u2247 nequiv=\u2262 sqsubset=\u228F sqsupset=\u2290 sqsubseteq=\u2291 ' +
        'sqsupseteq=\u2292 smile=\u2323 frown=\u2322 bowtie=\u22C8 therefore=\u2234 because=\u2235 ratio=\u2236 ' +
        'Colon=\u2237 proportion=\u2237 iff=\u27FA implies=\u27F9 impliedby=\u27F8 to=\u2192 gets=\u2190 ' +
        'rightarrow=\u2192 leftarrow=\u2190 leftrightarrow=\u2194 Rightarrow=\u21D2 Leftarrow=\u21D0 Leftrightarrow=\u21D4 ' +
        'longrightarrow=\u27F6 longleftarrow=\u27F5 longleftrightarrow=\u27F7 Longrightarrow=\u27F9 Longleftarrow=\u27F8 ' +
        'Longleftrightarrow=\u27FA mapsto=\u21A6 longmapsto=\u27FC uparrow=\u2191 downarrow=\u2193 updownarrow=\u2195 ' +
        'Uparrow=\u21D1 Downarrow=\u21D3 Updownarrow=\u21D5 nearrow=\u2197 searrow=\u2198 swarrow=\u2199 nwarrow=\u2196 ' +
        'hookrightarrow=\u21AA hookleftarrow=\u21A9 rightleftharpoons=\u21CC leftrightharpoons=\u21CB rightharpoonup=\u21C0 ' +
        'rightharpoondown=\u21C1 leftharpoonup=\u21BC leftharpoondown=\u21BD rightleftarrows=\u21C4 leftrightarrows=\u21C6 ' +
        'rightrightarrows=\u21C9 leftleftarrows=\u21C7 twoheadrightarrow=\u21A0 twoheadleftarrow=\u219E rightsquigarrow=\u21DD ' +
        'leadsto=\u21DD circlearrowleft=\u21BA circlearrowright=\u21BB curvearrowleft=\u21B6 curvearrowright=\u21B7 ' +
        'nrightarrow=\u219B nleftarrow=\u219A nRightarrow=\u21CF nLeftarrow=\u21CD nLeftrightarrow=\u21CE nleftrightarrow=\u21AE ' +
        'trianglelefteq=\u22B4 trianglerighteq=\u22B5 ntriangleleft=\u22EA ntriangleright=\u22EB lhd=\u22B2 rhd=\u22B3 ' +
        'unlhd=\u22B4 unrhd=\u22B5 Subset=\u22D0 Supset=\u22D1 pitchfork=\u22D4 eqcirc=\u2256 circeq=\u2257 ' +
        'bumpeq=\u224F Bumpeq=\u224E risingdotseq=\u2253 fallingdotseq=\u2252 multimap=\u22B8 perpdiv=\u2AE1');
    /* Ordinary symbols */
    def('ord', 'infty=\u221E partial=\u2202 nabla=\u2207 emptyset=\u2205 varnothing=\u2205 forall=\u2200 exists=\u2203 ' +
        'nexists=\u2204 neg=\u00AC lnot=\u00AC angle=\u2220 measuredangle=\u2221 sphericalangle=\u2222 rightangle=\u221F ' +
        'triangle=\u25B3 square=\u25A1 Box=\u25A1 blacksquare=\u25A0 qed=\u220E lozenge=\u25CA diamondsuit=\u2662 ' +
        'heartsuit=\u2661 clubsuit=\u2663 spadesuit=\u2660 aleph=\u2135 beth=\u2136 gimel=\u2137 daleth=\u2138 hbar=\u0127 ' +
        'hslash=\u210F ell=\u2113 wp=\u2118 Re=\u211C Im=\u2111 imath=\u0131 jmath=\u0237 prime=\u2032 dprime=\u2033 ' +
        'trprime=\u2034 backprime=\u2035 degree=\u00B0 top=\u22A4 bot=\u22A5 flat=\u266D natural=\u266E sharp=\u266F ' +
        'checkmark=\u2713 dag=\u2020 ddag=\u2021 S=\u00A7 P=\u00B6 copyright=\u00A9 pounds=\u00A3 euro=\u20AC yen=\u00A5 ' +
        'mho=\u2127 Finv=\u2132 complement=\u2201 eth=\u00F0 surd=\u221A bigstar=\u2605 blacktriangle=\u25B2 ' +
        'blacktriangledown=\u25BC bigcirc=\u25CB circledot=\u2299 diameter=\u2300 parallelogram=\u25B1 hexagon=\u2B21 ' +
        'pentagon=\u2B20 dots=\u2026 ldots=\u2026 cdots=\u22EF vdots=\u22EE ddots=\u22F1 iddots=\u22F0 adots=\u22F0 ' +
        'permil=\u2030 celsius=\u2103 micro=\u00B5 AA=\u00C5 angstrom=\u00C5 lightning=\u21AF varkappa=\u03F0 ' +
        'mathsterling=\u00A3 diagup=\u2215 backslash=\u2216 sun=\u2609 earth=\u2295 female=\u2640 male=\u2642 ' +
        'infinity=\u221E increment=\u2206 smallint=\u222B laplace=\u2112 fourier=\u2131 ohm=\u03A9 ' +
        'textdegree=\u00B0 circledR=\u00AE circledS=\u24C8 Game=\u2141');
    /* Delimiters */
    def('open', 'lbrace=\u007B langle=\u27E8 lfloor=\u230A lceil=\u2308 lbrack=\u005B lvert=| lVert=\u2016 ' +
        'llbracket=\u27E6 lgroup=\u27EE ulcorner=\u231C llcorner=\u231E');
    def('close', 'rbrace=\u007D rangle=\u27E9 rfloor=\u230B rceil=\u2309 rbrack=\u005D rvert=| rVert=\u2016 ' +
        'rrbracket=\u27E7 rgroup=\u27EF urcorner=\u231D lrcorner=\u231F');
    def('ord', 'vert=| Vert=\u2016');
    def('punct', 'colon=: ldotp=. cdotp=\u00B7 semicolon=;');
}());

/* Single-character commands / escapes */
MathData.ESCAPES = {
    '{': ['{', 'open'], '}': ['}', 'close'], '|': ['\u2016', 'ord'], '#': ['#', 'ord'], '$': ['$', 'ord'],
    '%': ['%', 'ord'], '&': ['&', 'ord'], '_': ['_', 'ord']
};

/* Explicit spacing commands, width in em. */
MathData.SPACES = {
    ',': 3 / 18, ':': 4 / 18, '>': 4 / 18, ';': 5 / 18, '!': -3 / 18, ' ': 0.25, 'quad': 1, 'qquad': 2,
    'enspace': 0.5, 'thinspace': 3 / 18, 'medspace': 4 / 18, 'thickspace': 5 / 18, 'negthinspace': -3 / 18
};

/* Large operators. Integrals place limits at the side by default. */
MathData.BIGOPS = {
    sum: ['\u2211', 'limits'], prod: ['\u220F', 'limits'], coprod: ['\u2210', 'limits'],
    bigcup: ['\u22C3', 'limits'], bigcap: ['\u22C2', 'limits'], bigvee: ['\u22C1', 'limits'], bigwedge: ['\u22C0', 'limits'],
    bigoplus: ['\u2A01', 'limits'], bigotimes: ['\u2A02', 'limits'], bigodot: ['\u2A00', 'limits'],
    biguplus: ['\u2A04', 'limits'], bigsqcup: ['\u2A06', 'limits'],
    'int': ['\u222B', 'side'], iint: ['\u222C', 'side'], iiint: ['\u222D', 'side'], iiiint: ['\u2A0C', 'side'],
    oint: ['\u222E', 'side'], oiint: ['\u222F', 'side'], oiiint: ['\u2230', 'side'], intop: ['\u222B', 'side'],
    varointclockwise: ['\u2232', 'side'], ointctrclockwise: ['\u2233', 'side']
};
MathData.INTEGRAL_CHARS = '\u222B\u222C\u222D\u2A0C\u222E\u222F\u2230\u2232\u2233';

/* Function names typeset upright. Value: [displayName, takesLimitsBelow]. */
MathData.FUNCS = {};
(function () {
    var plain = 'arccos arcsin arctan arccot arcsec arccsc arg cos cosh cot coth csc csch deg det dim exp gcd hom ker lg ln log ' +
        'sec sech sin sinh tan tanh arsinh arcosh artanh arcoth arsech arcsch lcm tr Tr rank sgn diag erf erfc Res ' +
        'Var Cov Corr span cis Arg Log sinc mod';
    var withLimits = 'lim max min sup inf Pr injlim projlim';
    var p = plain.split(' '), i;
    for (i = 0; i < p.length; i++) { MathData.FUNCS[p[i]] = [p[i], false]; }
    p = withLimits.split(' ');
    for (i = 0; i < p.length; i++) { MathData.FUNCS[p[i]] = [p[i], true]; }
    MathData.FUNCS.det = ['det', true];
    MathData.FUNCS.gcd = ['gcd', true];
    MathData.FUNCS.liminf = ['lim inf', true];
    MathData.FUNCS.limsup = ['lim sup', true];
    MathData.FUNCS.argmax = ['arg max', true];
    MathData.FUNCS.argmin = ['arg min', true];
}());
/* Function names recognized when typed WITHOUT a backslash (smart input). */
MathData.BARE_FUNCS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
    'coth', 'log', 'ln', 'exp', 'lim', 'max', 'min', 'det', 'gcd', 'lcm', 'sup', 'inf'];

/* Accent commands -> drawing kind */
MathData.ACCENTS = {
    vec: 'vec', hat: 'hat', widehat: 'widehat', bar: 'bar', overline: 'overline', underline: 'underline',
    dot: 'dot', ddot: 'ddot', dddot: 'dddot', tilde: 'tilde', widetilde: 'widetilde',
    overrightarrow: 'overrightarrow', overleftarrow: 'overleftarrow', overleftrightarrow: 'overleftrightarrow',
    overbrace: 'overbrace', underbrace: 'underbrace', check: 'check', breve: 'breve', acute: 'acute',
    grave: 'grave', mathring: 'mathring', overarc: 'arc', wideparen: 'arc', arc: 'arc'
};
/* Font variant commands */
MathData.FONTS = {
    mathrm: 'rm', mathbf: 'bf', mathit: 'it', mathbb: 'bb', mathcal: 'cal', mathscr: 'cal', mathfrak: 'frak',
    mathsf: 'sf', mathtt: 'tt', boldsymbol: 'bm', bm: 'bm', unit: 'unit', mathup: 'rm', symbf: 'bf', mathnormal: 'it'
};
MathData.FONT_COMMAND = { rm: 'mathrm', bf: 'mathbf', it: 'mathit', bb: 'mathbb', cal: 'mathcal', frak: 'mathfrak',
    sf: 'mathsf', tt: 'mathtt', bm: 'boldsymbol', unit: 'unit' };

/* Text commands with a raw (unparsed) argument */
MathData.TEXT_CMDS = { text: 'text', textrm: 'text', mbox: 'text', textnormal: 'text', textbf: 'textbf',
    textit: 'textit', textsf: 'text', texttt: 'text', mathrmtext: 'text' };

/* Delimiter command names for \left ... \right */
MathData.DELIMS = {
    '(': '(', ')': ')', '[': '[', ']': ']', '\\{': '{', '\\}': '}', '\\lbrace': '{', '\\rbrace': '}',
    '|': '|', '\\|': '\u2016', '\\vert': '|', '\\Vert': '\u2016', '\\lvert': '|', '\\rvert': '|',
    '\\lVert': '\u2016', '\\rVert': '\u2016', '\\langle': '\u27E8', '\\rangle': '\u27E9', '<': '\u27E8', '>': '\u27E9',
    '\\lfloor': '\u230A', '\\rfloor': '\u230B', '\\lceil': '\u2308', '\\rceil': '\u2309', '.': '',
    '\\lbrack': '[', '\\rbrack': ']', '/': '/', '\\backslash': '\u2216', '\\llbracket': '\u27E6', '\\rrbracket': '\u27E7',
    '\\uparrow': '\u2191', '\\downarrow': '\u2193'
};
MathData.DELIM_TO_LATEX = {
    '(': '(', ')': ')', '[': '[', ']': ']', '{': '\\{', '}': '\\}', '|': '|', '\u2016': '\\|',
    '\u27E8': '\\langle', '\u27E9': '\\rangle', '\u230A': '\\lfloor', '\u230B': '\\rfloor', '\u2308': '\\lceil',
    '\u2309': '\\rceil', '': '.', '/': '/', '\u2216': '\\backslash', '\u27E6': '\\llbracket', '\u27E7': '\\rrbracket',
    '\u2191': '\\uparrow', '\u2193': '\\downarrow'
};
/* Bare bracket pairs auto-grouped into scalable fences */
MathData.AUTO_PAIRS = { '(': ')', '[': ']', '{': '}', '\u27E8': '\u27E9', '\u230A': '\u230B', '\u2308': '\u2309', '\u27E6': '\u27E7' };

/* Matrix-like environments: [left delimiter, right delimiter] */
MathData.MATRIX_ENVS = {
    matrix: ['', ''], pmatrix: ['(', ')'], bmatrix: ['[', ']'], Bmatrix: ['{', '}'], vmatrix: ['|', '|'],
    Vmatrix: ['\u2016', '\u2016'], smallmatrix: ['', ''], array: ['', ''], cases: ['{', ''], dcases: ['{', ''],
    rcases: ['', '}']
};
MathData.LINE_ENVS = { align: 1, 'align*': 1, aligned: 1, gather: 1, 'gather*': 1, gathered: 1, split: 1,
    multline: 1, 'multline*': 1, alignat: 1, 'alignat*': 1, equation: 1, 'equation*': 1, eqnarray: 1, 'eqnarray*': 1 };

/* ASCII characters in math mode -> [display char, class] */
MathData.ASCII_OPS = {
    '+': ['+', 'bin'], '-': ['\u2212', 'bin'], '*': ['\u2217', 'bin'], '/': ['/', 'ord'], '=': ['=', 'rel'],
    '<': ['<', 'rel'], '>': ['>', 'rel'], ':': [':', 'rel'], ',': [',', 'punct'], ';': [';', 'punct'],
    '!': ['!', 'close'], '?': ['?', 'close'], '.': ['.', 'ord'], '|': ['|', 'ord'], '(': ['(', 'open'],
    ')': [')', 'close'], '[': ['[', 'open'], ']': [']', 'close'], '@': ['@', 'ord'], '"': ['\u2033', 'ord']
};
/* Smart multi-character operator shortcuts (only when smart input is on) */
MathData.SMART_OPS = [
    ['<=>', '\u21D4', 'rel'], ['<->', '\u2194', 'rel'], ['...', '\u2026', 'ord'], ['->', '\u2192', 'rel'],
    ['<-', '\u2190', 'rel'], ['=>', '\u21D2', 'rel'], ['<=', '\u2264', 'rel'], ['>=', '\u2265', 'rel'],
    ['!=', '\u2260', 'rel'], ['+-', '\u00B1', 'bin'], ['-+', '\u2213', 'bin'], ['~=', '\u2248', 'rel'],
    ['==', '\u2261', 'rel'], ['<<', '\u226A', 'rel'], ['>>', '\u226B', 'rel']
];

/* Reverse lookups built once: character -> command name and class */
MathData.CHAR_TO_CMD = {};
MathData.CHAR_CLASS = {};
(function () {
    var k, e, preferred = { '\u2264': 'leq', '\u2265': 'geq', '\u2260': 'neq', '\u2192': 'to', '\u2190': 'leftarrow',
        '\u2228': 'lor', '\u2227': 'land', '\u00AC': 'neg', '\u2205': 'emptyset', '\u220B': 'ni', '\u2223': 'mid',
        '\u22A8': 'models', '\u2026': 'ldots', '\u00B0': 'degree', '\u2016': 'Vert', '|': 'vert', '\u2216': 'setminus',
        '\u22BC': 'barwedge', '\u22BB': 'veebar', '\u27FA': 'iff', '\u27F9': 'implies', '\u27F8': 'impliedby',
        '\u03A9': 'Omega', '\u2237': 'Colon', '\u2213': 'mp', '\u21DD': 'rightsquigarrow', '\u2295': 'oplus',
        '\u221E': 'infty', '\u00C5': 'AA', '\u2299': 'odot', '\u2232': 'varointclockwise', '\u25A1': 'square',
        '\u0127': 'hbar', '\u2020': 'dagger', '\u2021': 'ddagger', '\u00B7': 'cdotp', '\u2219': 'bullet', '\u22B4': 'trianglelefteq',
        '\u22B5': 'trianglerighteq', '\u22C4': 'diamond', '\u2201': 'complement', '\u2112': 'laplace', '\u2131': 'fourier',
        '\u0394': 'Delta', '\u0393': 'Gamma', '\u0398': 'Theta', '\u039B': 'Lambda', '\u03A0': 'Pi', '\u03A3': 'Sigma',
        '\u03A6': 'Phi', '\u03A8': 'Psi', '\u222B': 'int', '\u2206': 'increment', '\u2215': 'diagup' };
    for (k in MathData.CMD) {
        if (U.has(MathData.CMD, k)) {
            e = MathData.CMD[k];
            if (!U.has(MathData.CHAR_TO_CMD, e[0])) { MathData.CHAR_TO_CMD[e[0]] = k; }
            if (!U.has(MathData.CHAR_CLASS, e[0])) { MathData.CHAR_CLASS[e[0]] = e[1]; }
        }
    }
    for (k in preferred) { if (U.has(preferred, k)) { MathData.CHAR_TO_CMD[k] = preferred[k]; } }
    for (k in MathData.BIGOPS) {
        if (U.has(MathData.BIGOPS, k) && k !== 'intop') { MathData.CHAR_TO_CMD[MathData.BIGOPS[k][0]] = k; MathData.CHAR_CLASS[MathData.BIGOPS[k][0]] = 'op'; }
    }
    MathData.CHAR_TO_CMD['\u222B'] = 'int';
    MathData.CHAR_CLASS['\u2212'] = 'bin';
    MathData.CHAR_CLASS['\u2217'] = 'bin';
    MathData.CHAR_CLASS['\u2032'] = 'ord';
}());

/* \not combinations */
MathData.NEGATIONS = {
    '=': '\u2260', '\u2208': '\u2209', '\u2282': '\u2284', '\u2283': '\u2285', '\u2286': '\u2288', '\u2287': '\u2289',
    '\u2261': '\u2262', '\u223C': '\u2241', '\u2245': '\u2247', '<': '\u226E', '>': '\u226F', '\u2264': '\u2270',
    '\u2265': '\u2271', '\u2223': '\u2224', '\u2225': '\u2226', '\u2203': '\u2204', '\u2248': '\u2249', '\u220B': '\u220C',
    '\u2192': '\u219B', '\u2190': '\u219A', '\u21D2': '\u21CF', '\u21D4': '\u21CE', '\u2194': '\u21AE'
};

/* Letter-like font variant maps (mathbb / mathcal / mathfrak). BMP forms are
   preferred because they have far better font coverage than astral forms. */
MathData.VARIANT_MAP = {
    bb: { C: '\u2102', H: '\u210D', N: '\u2115', P: '\u2119', Q: '\u211A', R: '\u211D', Z: '\u2124' },
    cal: { B: '\u212C', E: '\u2130', F: '\u2131', H: '\u210B', I: '\u2110', L: '\u2112', M: '\u2133', R: '\u211B',
        e: '\u212F', g: '\u210A', o: '\u2134' },
    frak: { C: '\u212D', H: '\u210C', I: '\u2111', R: '\u211C', Z: '\u2128' }
};
MathData.VARIANT_BASE = {
    bb: { upper: 0x1D538, lower: 0x1D552, digit: 0x1D7D8 },
    cal: { upper: 0x1D49C, lower: 0x1D4B6 },
    frak: { upper: 0x1D504, lower: 0x1D51E }
};
MathData.mapVariantChar = function (variant, ch) {
    var m = MathData.VARIANT_MAP[variant], b = MathData.VARIANT_BASE[variant], c;
    if (!m) { return ch; }
    if (U.has(m, ch)) { return m[ch]; }
    c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90 && b.upper) { return U.fromCodePoint(b.upper + c - 65); }
    if (c >= 97 && c <= 122 && b.lower) { return U.fromCodePoint(b.lower + c - 97); }
    if (c >= 48 && c <= 57 && b.digit) { return U.fromCodePoint(b.digit + c - 48); }
    return ch;
};

/* Character helpers */
MathData.isLatinLetter = function (ch) { return /^[A-Za-z]$/.test(ch); };
MathData.isGreekLower = function (ch) {
    var c = ch.charCodeAt(0);
    return (c >= 0x03B1 && c <= 0x03C9) || c === 0x03D1 || c === 0x03D5 || c === 0x03D6 || c === 0x03F0 ||
        c === 0x03F1 || c === 0x03F5 || c === 0x03DD;
};
MathData.isGreekUpper = function (ch) { var c = ch.charCodeAt(0); return c >= 0x0391 && c <= 0x03A9; };
MathData.isGreek = function (ch) { return MathData.isGreekLower(ch) || MathData.isGreekUpper(ch); };

/* Named colors are in U.NAMED_COLORS. Recommended mathematical fonts (in
   priority order). None of them is assumed to be installed. */
MathData.MATH_FONTS = ['Cambria Math', 'STIX Two Math', 'STIX Math', 'STIXGeneral', 'Latin Modern Math',
    'XITS Math', 'Asana Math', 'TeX Gyre Termes Math', 'TeX Gyre Pagella Math', 'Libertinus Math', 'Segoe UI Symbol',
    'Arial Unicode MS', 'Symbola'];
MathData.TEXT_FONTS = ['Times New Roman', 'STIX Two Text', 'Cambria', 'Minion Pro', 'Times', 'Georgia',
    'Latin Modern Roman', 'TeX Gyre Termes', 'Libertinus Serif', 'Myriad Pro', 'Arial'];

/* ---- 11_symbols.jsx ---- */
/* ==========================================================================
 * Module 11 - Symbol & notation library
 * Each entry: id, ch (display), name, cat, desc, kw (keywords), ins (syntax
 * inserted, parsed into structure), cp (Unicode code point label), font
 * (font compatibility note), kind ('symbol' | 'structure' | 'function' |
 * 'unit' | 'notation').
 * ========================================================================== */
var Symbols = {};

Symbols.CATEGORIES = [
    ['basic', 'Basic Arithmetic', 'Mathematics'],
    ['greek_lower', 'Greek Lowercase', 'Mathematics'],
    ['greek_upper', 'Greek Uppercase', 'Mathematics'],
    ['algebra', 'Algebra', 'Mathematics'],
    ['relations', 'Relations & Inequalities', 'Mathematics'],
    ['calculus', 'Calculus', 'Mathematics'],
    ['sets', 'Set Theory', 'Mathematics'],
    ['logic', 'Logic', 'Mathematics'],
    ['geometry', 'Geometry', 'Mathematics'],
    ['trig', 'Trigonometry', 'Mathematics'],
    ['linalg', 'Linear Algebra', 'Mathematics'],
    ['probstat', 'Probability & Statistics', 'Mathematics'],
    ['numtheory', 'Number Theory & Discrete', 'Mathematics'],
    ['arrows', 'Arrows', 'Mathematics'],
    ['delimiters', 'Brackets & Delimiters', 'Mathematics'],
    ['accents', 'Accents & Decorations', 'Mathematics'],
    ['letterlike', 'Letterlike & Number Sets', 'Mathematics'],
    ['advanced', 'Advanced Mathematics', 'Mathematics'],
    ['phys_mech', 'Physics: Mechanics', 'Physics'],
    ['phys_em', 'Physics: Electricity & Magnetism', 'Physics'],
    ['phys_waves', 'Physics: Waves & Optics', 'Physics'],
    ['phys_thermo', 'Physics: Thermodynamics', 'Physics'],
    ['phys_quantum', 'Physics: Quantum & Modern', 'Physics'],
    ['phys_constants', 'Physics: Constants', 'Physics'],
    ['units_si', 'Units: SI Base', 'Units'],
    ['units_derived', 'Units: SI Derived', 'Units'],
    ['units_other', 'Units: Other & Compound', 'Units'],
    ['chem_arrows', 'Chemistry: Reaction Arrows', 'Chemistry'],
    ['chem_states', 'Chemistry: States & Signs', 'Chemistry'],
    ['chem_notation', 'Chemistry: Notation', 'Chemistry']
];
Symbols.categoryName = function (id) {
    for (var i = 0; i < Symbols.CATEGORIES.length; i++) { if (Symbols.CATEGORIES[i][0] === id) { return Symbols.CATEGORIES[i][1]; } }
    return id;
};

Symbols.list = [];
Symbols.byId = {};

/* Row format: [display, name, insertSyntax, keywords, description?] */
Symbols.add = function (cat, rows, kind) {
    var i, r, entry, id, single, cps;
    for (i = 0; i < rows.length; i++) {
        r = rows[i];
        cps = U.codePoints(r[0]);
        single = (cps.length === 1);
        id = cat + '.' + U.lower(r[1]).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        if (U.has(Symbols.byId, id)) { id += '_' + i; }
        entry = {
            id: id,
            ch: r[0],
            name: r[1],
            cat: cat,
            ins: r[2],
            kw: r[3] || '',
            kind: kind || (single ? 'symbol' : 'structure'),
            cp: single ? U.unicodeLabel(r[0]) : '',
            desc: ''
        };
        entry.font = Symbols.fontNote(entry);
        entry.desc = (r[4] ? r[4] + ' ' : '') + Symbols.autoDescription(entry);
        Symbols.list.push(entry);
        Symbols.byId[id] = entry;
    }
};
Symbols.fontNote = function (e) {
    var cps = U.codePoints(e.ch), worst = 0, i, c;
    for (i = 0; i < cps.length; i++) {
        c = U.codePointOf(cps[i]);
        if (c > 0xFFFF) { worst = 3; }
        else if (c >= 0x2190 && worst < 2) { worst = 2; }
        else if (c > 0x00FF && worst < 1) { worst = 1; }
    }
    if (e.kind === 'unit' || e.kind === 'function') { return 'Any text font (rendered upright).'; }
    if (worst === 0) { return 'Available in virtually all text fonts.'; }
    if (worst === 1) { return 'Available in most text fonts (Greek / Latin Extended / general punctuation).'; }
    if (worst === 2) { return 'Mathematical glyph: a math font is recommended (Cambria Math, STIX Two Math).'; }
    return 'Supplementary-plane glyph: requires a full math font such as STIX Two Math or Cambria Math.';
};
Symbols.autoDescription = function (e) {
    var s = '';
    if (e.cp) { s += 'Unicode ' + e.cp + '. '; }
    s += 'Syntax: ' + e.ins + '. Category: ' + Symbols.categoryName(e.cat) + '.';
    return s;
};

/* ---------------------------------------------------------------- MATH ---- */
Symbols.add('basic', [
    ['+', 'Plus', '+', 'add addition sum positive'],
    ['\u2212', 'Minus', '-', 'subtract subtraction negative difference'],
    ['\u00D7', 'Multiplication (times)', '\\times', 'multiply product cross'],
    ['\u00F7', 'Division (obelus)', '\\div', 'divide quotient'],
    ['\u22C5', 'Multiplication dot', '\\cdot', 'center dot multiply product'],
    ['/', 'Slash (solidus)', '/', 'divide fraction slash'],
    ['=', 'Equals', '=', 'equal equality'],
    ['\u2260', 'Not equal', '\\neq', 'unequal different inequality'],
    ['\u2248', 'Approximately equal', '\\approx', 'about approximation almost'],
    ['>', 'Greater than', '>', 'larger inequality'],
    ['<', 'Less than', '<', 'smaller inequality'],
    ['\u2265', 'Greater than or equal', '\\geq', 'at least inequality ge'],
    ['\u2264', 'Less than or equal', '\\leq', 'at most inequality le'],
    ['\u00B1', 'Plus-minus', '\\pm', 'plus or minus tolerance'],
    ['\u2213', 'Minus-plus', '\\mp', 'minus or plus'],
    ['\u221E', 'Infinity', '\\infty', 'infinite unbounded limit'],
    ['%', 'Percent', '\\%', 'percentage per cent'],
    ['\u2030', 'Per mille', '\\permil', 'per thousand promille'],
    ['\u2236', 'Ratio', '\\ratio', 'ratio colon proportion'],
    ['\u2237', 'Proportion', '\\Colon', 'proportion as double colon'],
    ['\u00B0', 'Degree', '^{\\circ}', 'angle temperature degrees'],
    ['\u2032', 'Prime', "'", 'derivative minute foot'],
    ['\u2033', 'Double prime', "''", 'second derivative second inch'],
    ['\u03C0', 'Pi', '\\pi', 'circle constant 3.14159'],
    ['e', "Euler's number", '\\mathrm{e}', 'exponential constant 2.71828 napier'],
    ['i', 'Imaginary unit', '\\mathrm{i}', 'complex sqrt -1'],
    ['x\u00B2', 'Square', '^{2}', 'squared power two'],
    ['x\u00B3', 'Cube', '^{3}', 'cubed power three'],
    ['x\u207F', 'Power n', '^{n}', 'exponent power'],
    ['!', 'Factorial', '!', 'factorial permutations'],
    ['|x|', 'Absolute value', '\\left| \\right|', 'abs modulus magnitude'],
    ['mod', 'Modulus (binary mod)', '\\bmod', 'modulo remainder'],
    ['\u221A', 'Square root', '\\sqrt{}', 'radical root'],
    ['a/b', 'Fraction', '\\frac{}{}', 'fraction ratio numerator denominator'],
    ['\u2026', 'Ellipsis', '\\ldots', 'dots continuation'],
    ['\u22EF', 'Centered ellipsis', '\\cdots', 'dots continuation centered'],
    ['\u2217', 'Asterisk operator', '\\ast', 'star convolution'],
    ['\u221D', 'Proportional to', '\\propto', 'varies as proportional']
]);

Symbols.add('greek_lower', (function () {
    var names = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta', 'iota',
        'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'varpi', 'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon',
        'phi', 'varphi', 'chi', 'psi', 'omega'];
    var out = [], i;
    for (i = 0; i < names.length; i++) {
        out.push([MathData.CMD[names[i]][0], 'Greek small ' + names[i].replace('var', 'variant '), '\\' + names[i], 'greek letter lowercase ' + names[i]]);
    }
    return out;
}()));
Symbols.add('greek_upper', (function () {
    var names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu',
        'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'];
    var out = [], i;
    for (i = 0; i < names.length; i++) {
        out.push([MathData.CMD[names[i]][0], 'Greek capital ' + names[i], '\\' + names[i], 'greek letter uppercase capital ' + names[i]]);
    }
    return out;
}()));

Symbols.add('algebra', [
    ['x', 'Variable x', 'x', 'unknown variable'],
    ['ax+b', 'Linear expression', 'ax+b', 'coefficient linear polynomial'],
    ['ax\u00B2+bx+c', 'Quadratic polynomial', 'ax^{2}+bx+c', 'polynomial quadratic coefficients'],
    ['a\u2099x\u207F', 'Polynomial term', 'a_{n}x^{n}', 'polynomial coefficient term'],
    ['x\u207F', 'Power', 'x^{n}', 'exponent power'],
    ['x\u207B\u00B9', 'Reciprocal', 'x^{-1}', 'inverse reciprocal'],
    ['\u221Ax', 'Square root', '\\sqrt{x}', 'root radical'],
    ['\u221Bx', 'Cube root', '\\sqrt[3]{x}', 'root radical third'],
    ['\u207F\u221Ax', 'nth root', '\\sqrt[n]{x}', 'root radical index'],
    ['e\u02E3', 'Exponential', '\\mathrm{e}^{x}', 'exponential function exp'],
    ['exp', 'Exponential function', '\\exp', 'exp function', 'Upright function name.'],
    ['log', 'Logarithm', '\\log', 'log logarithm function'],
    ['log\u2090', 'Logarithm base a', '\\log_{a}', 'logarithm base'],
    ['ln', 'Natural logarithm', '\\ln', 'natural log ln'],
    ['lg', 'Common logarithm', '\\lg', 'log base 10'],
    ['(\u207F\u2096)', 'Binomial coefficient', '\\binom{n}{k}', 'choose combination binomial'],
    ['\u2261', 'Identical to', '\\equiv', 'identity congruent equivalent'],
    ['\u225C', 'Defined as (delta equal)', '\\triangleq', 'definition'],
    ['\u2254', 'Defined as (colon equals)', '\\coloneqq', 'definition assign'],
    ['\u2243', 'Asymptotically equal', '\\simeq', 'similar equal'],
    ['\u226A', 'Much less than', '\\ll', 'much smaller'],
    ['\u226B', 'Much greater than', '\\gg', 'much larger'],
    ['|x|', 'Absolute value', '\\abs{x}', 'absolute modulus'],
    ['\u230Ax\u230B', 'Floor', '\\floor{x}', 'floor round down'],
    ['\u2308x\u2309', 'Ceiling', '\\ceil{x}', 'ceiling round up'],
    ['sgn', 'Sign function', '\\sgn', 'signum sign']
]);

Symbols.add('relations', [
    ['=', 'Equals', '=', 'equal'], ['\u2260', 'Not equal', '\\neq', 'unequal'],
    ['<', 'Less than', '<', 'less'], ['>', 'Greater than', '>', 'greater'],
    ['\u2264', 'Less or equal', '\\leq', 'le'], ['\u2265', 'Greater or equal', '\\geq', 'ge'],
    ['\u2A7D', 'Less or equal (slanted)', '\\leqslant', 'le slant'], ['\u2A7E', 'Greater or equal (slanted)', '\\geqslant', 'ge slant'],
    ['\u2261', 'Equivalent / identical', '\\equiv', 'congruent'], ['\u2262', 'Not equivalent', '\\nequiv', 'not identical'],
    ['\u2248', 'Approximately', '\\approx', 'approx'], ['\u2245', 'Congruent / isomorphic', '\\cong', 'congruent isomorphic'],
    ['\u223C', 'Similar / tilde', '\\sim', 'similar distributed'], ['\u221D', 'Proportional', '\\propto', 'proportional'],
    ['\u227A', 'Precedes', '\\prec', 'order'], ['\u227B', 'Succeeds', '\\succ', 'order'],
    ['\u2272', 'Less than or similar', '\\lesssim', 'less similar'], ['\u2273', 'Greater than or similar', '\\gtrsim', 'greater similar'],
    ['\u226E', 'Not less than', '\\nless', 'not less'], ['\u226F', 'Not greater than', '\\ngtr', 'not greater'],
    ['\u2250', 'Approaches the limit', '\\doteq', 'dot equal'], ['\u224D', 'Equivalent to (asymp)', '\\asymp', 'asymptotic']
]);

Symbols.add('calculus', [
    ['d', 'Differential operator (upright d)', '\\mathrm{d}', 'differential d'],
    ['d/dx', 'Derivative operator', '\\frac{\\mathrm{d}}{\\mathrm{d}x}', 'derivative leibniz'],
    ['dy/dx', 'Derivative (Leibniz)', '\\frac{\\mathrm{d}y}{\\mathrm{d}x}', 'derivative leibniz first'],
    ['d\u00B2y/dx\u00B2', 'Second derivative', '\\frac{\\mathrm{d}^{2}y}{\\mathrm{d}x^{2}}', 'second derivative'],
    ['d\u207Fy/dx\u207F', 'Higher-order derivative', '\\frac{\\mathrm{d}^{n}y}{\\mathrm{d}x^{n}}', 'nth derivative higher order'],
    ['\u2202', 'Partial derivative symbol', '\\partial', 'partial del'],
    ['\u2202f/\u2202x', 'Partial derivative', '\\frac{\\partial f}{\\partial x}', 'partial derivative'],
    ['\u2202\u00B2f/\u2202x\u00B2', 'Second partial derivative', '\\frac{\\partial^{2} f}{\\partial x^{2}}', 'second partial'],
    ['\u2202\u00B2f/\u2202x\u2202y', 'Mixed partial derivative', '\\frac{\\partial^{2} f}{\\partial x\\,\\partial y}', 'mixed partial multiple'],
    ['df/dt', 'Total derivative', '\\frac{\\mathrm{d}f}{\\mathrm{d}t}', 'total derivative time'],
    ["f\u2032", 'Prime notation', "f'(x)", 'prime derivative lagrange'],
    ["f\u2033", 'Second derivative (prime)', "f''(x)", 'double prime'],
    ['\u1E8B', 'Dot (time derivative)', '\\dot{x}', 'newton dot time derivative'],
    ['\u1E8D', 'Double dot (second time derivative)', '\\ddot{x}', 'acceleration double dot'],
    ['\u2207', 'Nabla / gradient', '\\nabla', 'del gradient nabla'],
    ['\u2207f', 'Gradient', '\\nabla f', 'gradient grad'],
    ['\u2207\u22C5F', 'Divergence', '\\nabla\\cdot\\vec{F}', 'divergence div'],
    ['\u2207\u00D7F', 'Curl', '\\nabla\\times\\vec{F}', 'curl rot rotation'],
    ['\u2207\u00B2', 'Laplacian', '\\nabla^{2}', 'laplacian laplace'],
    ['\u0394', 'Laplacian (Delta)', '\\Delta', 'laplace operator change'],
    ['\u222B', 'Indefinite integral', '\\int  \\,\\mathrm{d}x', 'integral antiderivative'],
    ['\u222B\u2090\u1D47', 'Definite integral', '\\int_{a}^{b}  \\,\\mathrm{d}x', 'integral definite limits'],
    ['\u222C', 'Double integral', '\\iint_{D}  \\,\\mathrm{d}A', 'double integral area'],
    ['\u222D', 'Triple integral', '\\iiint_{V}  \\,\\mathrm{d}V', 'triple integral volume'],
    ['\u222E', 'Contour integral', '\\oint_{C}  \\,\\mathrm{d}s', 'contour line closed integral'],
    ['\u222F', 'Surface integral (closed)', '\\oiint_{S}  \\,\\mathrm{d}S', 'surface integral flux'],
    ['\u2230', 'Volume integral (closed)', '\\oiiint_{V}  \\,\\mathrm{d}V', 'volume integral'],
    ['\u2211', 'Summation', '\\sum_{i=1}^{n}', 'sum sigma series'],
    ['\u220F', 'Product', '\\prod_{i=1}^{n}', 'product pi'],
    ['lim', 'Limit', '\\lim_{x \\to a}', 'limit approaches'],
    ['lim\u207B', 'Limit from the left', '\\lim_{x \\to a^{-}}', 'left limit one-sided'],
    ['lim\u207A', 'Limit from the right', '\\lim_{x \\to a^{+}}', 'right limit one-sided'],
    ['dx', 'Differential element dx', '\\,\\mathrm{d}x', 'differential element'],
    ['\u0394x', 'Increment', '\\Delta x', 'change increment delta'],
    ['\u03B4x', 'Variation / infinitesimal', '\\delta x', 'variation infinitesimal small'],
    ['\u03B5', 'Epsilon (small quantity)', '\\varepsilon', 'epsilon delta small'],
    ['\u2192', 'Tends to', '\\to', 'approaches tends limit'],
    ['F|\u2090\u1D47', 'Evaluation bar', '\\left. F(x) \\right|_{a}^{b}', 'evaluate bar limits']
]);

Symbols.add('sets', [
    ['\u2208', 'Element of', '\\in', 'member belongs'], ['\u2209', 'Not an element of', '\\notin', 'not member'],
    ['\u220B', 'Contains as member', '\\ni', 'owns contains'],
    ['\u2282', 'Subset', '\\subset', 'subset'], ['\u2286', 'Subset or equal', '\\subseteq', 'subset equal'],
    ['\u228A', 'Proper subset', '\\subsetneq', 'proper strict subset'], ['\u2283', 'Superset', '\\supset', 'superset'],
    ['\u2287', 'Superset or equal', '\\supseteq', 'superset equal'], ['\u2284', 'Not a subset', '\\nsubset', 'not subset'],
    ['\u222A', 'Union', '\\cup', 'union or'], ['\u2229', 'Intersection', '\\cap', 'intersection and'],
    ['\u22C3', 'Big union', '\\bigcup_{i}', 'union family'], ['\u22C2', 'Big intersection', '\\bigcap_{i}', 'intersection family'],
    ['\u2205', 'Empty set', '\\emptyset', 'null empty'], ['\uD835\uDCB0', 'Universal set', '\\mathcal{U}', 'universe universal'],
    ['\u2216', 'Set difference', '\\setminus', 'minus difference'], ['A\u1D9C', 'Complement', 'A^{c}', 'complement'],
    ['\u2201', 'Complement symbol', '\\complement', 'complement'],
    ['\u00D7', 'Cartesian product', 'A\\times B', 'cartesian product pairs'],
    ['\uD835\uDCAB(A)', 'Power set', '\\mathcal{P}(A)', 'power set subsets'],
    ['|A|', 'Cardinality', '\\left| A \\right|', 'cardinality size count'],
    ['{x|\u2026}', 'Set-builder notation', '\\{ x \\mid x > 0 \\}', 'set builder such that'],
    ['\u25B3', 'Symmetric difference', '\\triangle', 'symmetric difference'],
    ['\u2294', 'Disjoint union', '\\sqcup', 'disjoint union'], ['\u2135\u2080', 'Aleph null', '\\aleph_{0}', 'countable cardinality']
]);

Symbols.add('logic', [
    ['\u2227', 'Logical AND', '\\land', 'and conjunction wedge'], ['\u2228', 'Logical OR', '\\lor', 'or disjunction vee'],
    ['\u00AC', 'Logical NOT', '\\neg', 'not negation'], ['\u21D2', 'Implies', '\\Rightarrow', 'implication then'],
    ['\u2192', 'Implies (arrow)', '\\to', 'implication material conditional'],
    ['\u27F9', 'Implies (long)', '\\implies', 'implication long'], ['\u21D4', 'Equivalent (if and only if)', '\\Leftrightarrow', 'iff equivalence biconditional'],
    ['\u27FA', 'If and only if (long)', '\\iff', 'iff'], ['\u2194', 'Biconditional', '\\leftrightarrow', 'biconditional'],
    ['\u2261', 'Logical equivalence', '\\equiv', 'equivalent'], ['\u2200', 'For all', '\\forall', 'universal quantifier every'],
    ['\u2203', 'There exists', '\\exists', 'existential quantifier'], ['\u2203!', 'Unique existence', '\\exists!', 'exists unique'],
    ['\u2204', 'There does not exist', '\\nexists', 'not exists'], ['\u2234', 'Therefore', '\\therefore', 'hence so'],
    ['\u2235', 'Because', '\\because', 'since'], ['\u22A5', 'Contradiction (falsum)', '\\bot', 'false bottom contradiction'],
    ['\u21AF', 'Contradiction (lightning)', '\\lightning', 'contradiction'], ['\u22A4', 'True (verum)', '\\top', 'true top tautology'],
    ['\u22A2', 'Proves (turnstile)', '\\vdash', 'proves derives'], ['\u22A8', 'Models / entails', '\\models', 'entails satisfies'],
    ['\u22BB', 'Exclusive OR', '\\veebar', 'xor'], ['\u22BC', 'NAND', '\\barwedge', 'nand'],
    ['\u220E', 'End of proof (QED)', '\\qed', 'qed tombstone halmos'], ['\u25A1', 'Necessity (box)', '\\Box', 'modal box necessarily'],
    ['T', 'Truth value true', '\\mathrm{T}', 'true'], ['F', 'Truth value false', '\\mathrm{F}', 'false']
]);

Symbols.add('geometry', [
    ['\u2220', 'Angle', '\\angle', 'angle'], ['\u2221', 'Measured angle', '\\measuredangle', 'measured angle'],
    ['\u221F', 'Right angle', '\\rightangle', 'right angle 90'], ['\u2225', 'Parallel', '\\parallel', 'parallel lines'],
    ['\u22A5', 'Perpendicular', '\\perp', 'perpendicular orthogonal'], ['\u2245', 'Congruent', '\\cong', 'congruent'],
    ['\u223C', 'Similar', '\\sim', 'similar'], ['\u25B3', 'Triangle', '\\triangle', 'triangle'],
    ['\u25CB', 'Circle', '\\bigcirc', 'circle'], ['\u2299', 'Circle with center', '\\odot', 'circle center'],
    ['\u2300', 'Diameter', '\\diameter', 'diameter'], ['r', 'Radius', 'r', 'radius'],
    ['AB\u0311', 'Arc', '\\overarc{AB}', 'arc'], ['AB\u0305', 'Segment', '\\overline{AB}', 'line segment'],
    ['AB\u20D7', 'Vector', '\\overrightarrow{AB}', 'vector'], ['AB\u20E1', 'Line', '\\overleftrightarrow{AB}', 'line'],
    ['AB\u2192', 'Ray', '\\overrightarrow{AB}', 'ray half-line'], ['P', 'Point', 'P', 'point'],
    ['\u25A1ABCD', 'Quadrilateral notation', '\\square ABCD', 'quadrilateral polygon square'],
    ['\u25B1', 'Parallelogram', '\\parallelogram', 'parallelogram'], ['\u2B20', 'Pentagon', '\\pentagon', 'pentagon polygon'],
    ['\u2B21', 'Hexagon', '\\hexagon', 'hexagon polygon'], ['m\u2220', 'Measure of angle', 'm\\angle ABC', 'measure angle'],
    ['\u00B0', 'Degree', '^{\\circ}', 'degree']
]);

Symbols.add('trig', (function () {
    var f = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc',
        'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch', 'arsinh', 'arcosh', 'artanh', 'arcoth', 'arsech', 'arcsch'];
    var names = { sin: 'Sine', cos: 'Cosine', tan: 'Tangent', cot: 'Cotangent', sec: 'Secant', csc: 'Cosecant',
        sinh: 'Hyperbolic sine', cosh: 'Hyperbolic cosine', tanh: 'Hyperbolic tangent', coth: 'Hyperbolic cotangent',
        sech: 'Hyperbolic secant', csch: 'Hyperbolic cosecant' };
    var out = [], i, nm;
    for (i = 0; i < f.length; i++) {
        nm = names[f[i]];
        if (!nm) {
            if (f[i].indexOf('arc') === 0) { nm = 'Inverse ' + U.lower(names[f[i].substring(3)]); }
            else { nm = 'Inverse ' + U.lower(names[f[i].substring(2)]); }
        }
        out.push([f[i], nm, '\\' + f[i], 'trigonometric function ' + f[i] + (f[i].indexOf('h') > 2 ? ' hyperbolic' : '')]);
    }
    out.push(['sin\u207B\u00B9', 'Inverse sine (power notation)', '\\sin^{-1}', 'inverse arcsine']);
    out.push(['\u00B0', 'Degree', '^{\\circ}', 'degree angle']);
    out.push(['rad', 'Radian', '\\,\\mathrm{rad}', 'radian angle unit']);
    out.push(['\u03B8', 'Theta (angle)', '\\theta', 'angle theta']);
    return out;
}()), 'function');

Symbols.add('linalg', [
    ['(\u22EF)', 'Matrix (parentheses) 2\u00D72', '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', 'matrix pmatrix'],
    ['[\u22EF]', 'Matrix (brackets) 2\u00D72', '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', 'matrix bmatrix'],
    ['|\u22EF|', 'Determinant 2\u00D72', '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', 'determinant vmatrix'],
    ['det', 'Determinant function', '\\det', 'determinant det'],
    ['A\u1D40', 'Transpose', 'A^{\\mathrm{T}}', 'transpose'],
    ['A\u207B\u00B9', 'Inverse matrix', 'A^{-1}', 'inverse'],
    ['I\u2099', 'Identity matrix', 'I_{n}', 'identity unit matrix'],
    ['I\u2083', 'Identity matrix 3\u00D73', '\\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{pmatrix}', 'identity explicit'],
    ['0', 'Zero matrix', '\\mathbf{0}', 'zero null matrix'],
    ['rank', 'Rank', '\\rank(A)', 'rank'], ['tr', 'Trace', '\\tr(A)', 'trace'],
    ['\u03BB', 'Eigenvalue', '\\lambda', 'eigenvalue'], ['v', 'Eigenvector (bold)', '\\mathbf{v}', 'eigenvector vector bold'],
    ['Av=\u03BBv', 'Eigenvalue equation', 'A\\mathbf{v}=\\lambda\\mathbf{v}', 'eigen equation'],
    ['V', 'Vector space', 'V', 'vector space'], ['span', 'Span', '\\span', 'span linear combination'],
    ['T:V\u2192W', 'Linear transformation', 'T\\colon V\\to W', 'linear map transformation'],
    ['\u22C5', 'Dot product', '\\mathbf{a}\\cdot\\mathbf{b}', 'dot scalar product'],
    ['\u00D7', 'Cross product', '\\mathbf{a}\\times\\mathbf{b}', 'cross vector product'],
    ['\u2016v\u2016', 'Norm', '\\norm{\\mathbf{v}}', 'norm length magnitude'],
    ['\u27E8u,v\u27E9', 'Inner product', '\\langle \\mathbf{u},\\mathbf{v} \\rangle', 'inner product bracket'],
    ['\u2297', 'Tensor / Kronecker product', '\\otimes', 'tensor kronecker outer'],
    ['A\u2020', 'Conjugate transpose', 'A^{\\dagger}', 'hermitian adjoint dagger'],
    ['ker', 'Kernel', '\\ker', 'kernel null space'], ['dim', 'Dimension', '\\dim', 'dimension'],
    ['\u2295', 'Direct sum', '\\oplus', 'direct sum'], ['\u2218', 'Hadamard / composition', '\\circ', 'hadamard composition']
]);

Symbols.add('probstat', [
    ['P(A)', 'Probability', 'P(A)', 'probability'], ['P(A|B)', 'Conditional probability', 'P(A\\mid B)', 'conditional given'],
    ['E[X]', 'Expected value', '\\mathbb{E}[X]', 'expectation mean expected'], ['Var', 'Variance', '\\Var(X)', 'variance'],
    ['\u03C3', 'Standard deviation', '\\sigma', 'standard deviation sigma'], ['\u03C3\u00B2', 'Variance (sigma squared)', '\\sigma^{2}', 'variance'],
    ['x\u0304', 'Sample mean', '\\bar{x}', 'mean average sample'], ['\u03BC', 'Population mean', '\\mu', 'mean population'],
    ['x\u0303', 'Median', '\\tilde{x}', 'median'], ['Mo', 'Mode', '\\mathrm{Mo}', 'mode'],
    ['X\u223CD', 'Distributed as', 'X\\sim', 'distribution distributed'],
    ['N(\u03BC,\u03C3\u00B2)', 'Normal distribution', '\\mathcal{N}(\\mu,\\sigma^{2})', 'normal gaussian distribution'],
    ['B(n,p)', 'Binomial distribution', '\\mathrm{B}(n,p)', 'binomial distribution'],
    ['Pois(\u03BB)', 'Poisson distribution', '\\operatorname{Pois}(\\lambda)', 'poisson distribution'],
    ['\u2211x\u1D62', 'Summation of observations', '\\sum_{i=1}^{n} x_{i}', 'sum observations'],
    ['n', 'Sample size', 'n', 'sample size'], ['N', 'Population size', 'N', 'population size'],
    ['\u03C1', 'Correlation (population)', '\\rho', 'correlation'], ['r', 'Correlation (sample)', 'r', 'correlation sample'],
    ['Cov', 'Covariance', '\\Cov(X,Y)', 'covariance'], ['{x\u2081,\u2026,x\u2099}', 'Set of observations', '\\{x_{1},\\ldots,x_{n}\\}', 'observations data'],
    ['\u03B8\u0302', 'Estimator', '\\hat{\\theta}', 'estimator estimate hat'], ['p\u0302', 'Sample proportion', '\\hat{p}', 'proportion estimator'],
    ['\u03C7\u00B2', 'Chi-squared', '\\chi^{2}', 'chi squared test'], ['s\u00B2', 'Sample variance', 's^{2}', 'sample variance'],
    ['z', 'z-score', 'z=\\frac{x-\\mu}{\\sigma}', 'z score standard'], ['n!', 'Factorial', 'n!', 'factorial'],
    ['\u2AEB', 'Independence', '\\perp\\!\\!\\!\\perp', 'independent'], ['Pr', 'Probability operator', '\\Pr', 'probability']
]);

Symbols.add('numtheory', [
    ['\u2115', 'Natural numbers', '\\mathbb{N}', 'natural numbers counting'], ['\u2124', 'Integers', '\\mathbb{Z}', 'integers whole'],
    ['\u211A', 'Rational numbers', '\\mathbb{Q}', 'rational'], ['\u211D', 'Real numbers', '\\mathbb{R}', 'real'],
    ['\u2102', 'Complex numbers', '\\mathbb{C}', 'complex'], ['\u2119', 'Prime numbers', '\\mathbb{P}', 'primes'],
    ['\u2223', 'Divides', '\\mid', 'divides divisibility'], ['\u2224', 'Does not divide', '\\nmid', 'not divides'],
    ['mod', 'Modulo (parenthesized)', '\\pmod{n}', 'modulo congruence'],
    ['a\u2261b', 'Congruence', 'a\\equiv b\\pmod{n}', 'congruent modulo'],
    ['gcd', 'Greatest common divisor', '\\gcd(a,b)', 'gcd hcf'], ['lcm', 'Least common multiple', '\\lcm(a,b)', 'lcm'],
    ['\u230Ax\u230B', 'Floor', '\\lfloor x \\rfloor', 'floor'], ['\u2308x\u2309', 'Ceiling', '\\lceil x \\rceil', 'ceiling'],
    ['p\u2081\u1D49\u00B9', 'Prime factorization', 'p_{1}^{e_{1}}p_{2}^{e_{2}}\\cdots p_{k}^{e_{k}}', 'factorization primes'],
    ['P(n,k)', 'Permutations', 'P(n,k)=\\frac{n!}{(n-k)!}', 'permutations arrangements'],
    ['C(n,k)', 'Combinations', '\\binom{n}{k}=\\frac{n!}{k!(n-k)!}', 'combinations choose'],
    ['(a\u2099)', 'Sequence', '(a_{n})_{n\\geq 1}', 'sequence'], ['a\u2099\u208A\u2081', 'Recurrence relation', 'a_{n+1}=a_{n}+a_{n-1}', 'recurrence fibonacci'],
    ['G=(V,E)', 'Graph', 'G=(V,E)', 'graph vertices edges'], ['deg', 'Vertex degree', '\\deg(v)', 'degree vertex'],
    ['f:A\u2192B', 'Function', 'f\\colon A\\to B', 'function mapping'], ['\u21A6', 'Maps to', '\\mapsto', 'maps to'],
    ['\u2218', 'Composition', '\\circ', 'composition'], ['\u03C6(n)', 'Euler totient', '\\varphi(n)', 'totient phi'],
    ['n!!', 'Double factorial', 'n!!', 'double factorial'], ['\u03C3(n)', 'Divisor sum', '\\sigma(n)', 'sigma divisors']
]);

Symbols.add('arrows', [
    ['\u2192', 'Right arrow', '\\rightarrow', 'to arrow'], ['\u2190', 'Left arrow', '\\leftarrow', 'from arrow'],
    ['\u2194', 'Left-right arrow', '\\leftrightarrow', 'both'], ['\u21D2', 'Double right arrow', '\\Rightarrow', 'implies'],
    ['\u21D0', 'Double left arrow', '\\Leftarrow', 'implied'], ['\u21D4', 'Double left-right arrow', '\\Leftrightarrow', 'iff'],
    ['\u27F6', 'Long right arrow', '\\longrightarrow', 'long'], ['\u27F5', 'Long left arrow', '\\longleftarrow', 'long'],
    ['\u21A6', 'Maps to', '\\mapsto', 'mapsto'], ['\u2191', 'Up arrow', '\\uparrow', 'up'], ['\u2193', 'Down arrow', '\\downarrow', 'down'],
    ['\u2197', 'North-east arrow', '\\nearrow', 'increasing'], ['\u2198', 'South-east arrow', '\\searrow', 'decreasing'],
    ['\u21AA', 'Hook right arrow (injection)', '\\hookrightarrow', 'injection embedding'],
    ['\u21A0', 'Two-head right arrow (surjection)', '\\twoheadrightarrow', 'surjection onto'],
    ['\u21CC', 'Right-left harpoons', '\\rightleftharpoons', 'equilibrium'],
    ['\u21C4', 'Right-left arrows', '\\rightleftarrows', 'reversible'], ['\u21DD', 'Squiggly arrow', '\\rightsquigarrow', 'leads to'],
    ['\u21BA', 'Counter-clockwise arrow', '\\circlearrowleft', 'rotation'], ['\u21BB', 'Clockwise arrow', '\\circlearrowright', 'rotation'],
    ['\u2192\u02E3', 'Extensible arrow with label', '\\xrightarrow{}', 'arrow label over']
]);

Symbols.add('delimiters', [
    ['( )', 'Parentheses', '\\left(  \\right)', 'parentheses round brackets'],
    ['[ ]', 'Square brackets', '\\left[  \\right]', 'square brackets'],
    ['{ }', 'Curly braces', '\\left\\{  \\right\\}', 'braces curly'],
    ['\u27E8 \u27E9', 'Angle brackets', '\\left\\langle  \\right\\rangle', 'angle chevrons'],
    ['\u230A \u230B', 'Floor brackets', '\\left\\lfloor  \\right\\rfloor', 'floor'],
    ['\u2308 \u2309', 'Ceiling brackets', '\\left\\lceil  \\right\\rceil', 'ceiling'],
    ['| |', 'Absolute value bars', '\\left|  \\right|', 'absolute bars'],
    ['\u2016 \u2016', 'Norm (double bars)', '\\left\\|  \\right\\|', 'norm double bars'],
    ['\u27E6 \u27E7', 'Double square brackets', '\\left\\llbracket  \\right\\rrbracket', 'semantic brackets'],
    ['{ cases', 'Piecewise brace', '\\begin{cases}  &  \\\\  &  \\end{cases}', 'piecewise cases'],
    ['( ]', 'Half-open interval', '(a,b]', 'interval']
], 'structure');

Symbols.add('accents', [
    ['x\u20D7', 'Vector arrow', '\\vec{}', 'vector arrow'], ['x\u0302', 'Hat', '\\hat{}', 'hat circumflex unit'],
    ['x\u0304', 'Bar', '\\bar{}', 'bar macron mean'], ['AB\u0305', 'Overline', '\\overline{}', 'overline'],
    ['x\u0332', 'Underline', '\\underline{}', 'underline'], ['x\u0307', 'Dot', '\\dot{}', 'dot derivative'],
    ['x\u0308', 'Double dot', '\\ddot{}', 'double dot'], ['x\u0303', 'Tilde', '\\tilde{}', 'tilde'],
    ['xy\u0302', 'Wide hat', '\\widehat{}', 'wide hat'], ['xy\u0303', 'Wide tilde', '\\widetilde{}', 'wide tilde'],
    ['\u23DE', 'Overbrace', '\\overbrace{}^{}', 'overbrace label'], ['\u23DF', 'Underbrace', '\\underbrace{}_{}', 'underbrace label'],
    ['x\u030C', 'Check', '\\check{}', 'check caron'], ['x\u0306', 'Breve', '\\breve{}', 'breve'],
    ['\u25AD', 'Boxed', '\\boxed{}', 'box frame'], ['=\u0302', 'Overset', '\\overset{}{}', 'stack over'],
    ['x', 'Bold (upright)', '\\mathbf{}', 'bold vector'], ['x', 'Bold italic', '\\boldsymbol{}', 'bold italic symbol'],
    ['x', 'Upright (roman)', '\\mathrm{}', 'roman upright'], ['Aa', 'Text', '\\text{}', 'text words']
], 'structure');

Symbols.add('letterlike', [
    ['\u2115', 'Double-struck N', '\\mathbb{N}', 'blackboard naturals'], ['\u2124', 'Double-struck Z', '\\mathbb{Z}', 'integers'],
    ['\u211A', 'Double-struck Q', '\\mathbb{Q}', 'rationals'], ['\u211D', 'Double-struck R', '\\mathbb{R}', 'reals'],
    ['\u2102', 'Double-struck C', '\\mathbb{C}', 'complex'], ['\u210D', 'Double-struck H (quaternions)', '\\mathbb{H}', 'quaternions'],
    ['\u2119', 'Double-struck P', '\\mathbb{P}', 'primes projective probability'],
    ['\uD835\uDD3D', 'Double-struck F (field)', '\\mathbb{F}', 'finite field'],
    ['\u2112', 'Script L (Laplace)', '\\mathcal{L}', 'laplace lagrangian'], ['\u2131', 'Script F (Fourier)', '\\mathcal{F}', 'fourier'],
    ['\u210B', 'Script H (Hilbert / Hamiltonian)', '\\mathcal{H}', 'hilbert hamiltonian'],
    ['\uD835\uDCAB', 'Script P', '\\mathcal{P}', 'power set'], ['\uD835\uDC9C', 'Script A', '\\mathcal{A}', 'script'],
    ['\u2130', 'Script E (emf)', '\\mathcal{E}', 'emf electromotive'], ['\u2133', 'Script M', '\\mathcal{M}', 'script m'],
    ['\uD835\uDD24', 'Fraktur g (Lie algebra)', '\\mathfrak{g}', 'lie algebra fraktur'],
    ['\u2135', 'Aleph', '\\aleph', 'cardinal'], ['\u2136', 'Beth', '\\beth', 'cardinal'], ['\u2113', 'Script l (ell)', '\\ell', 'length'],
    ['\u2118', 'Weierstrass p', '\\wp', 'weierstrass'], ['\u211C', 'Real part', '\\Re', 'real part'], ['\u2111', 'Imaginary part', '\\Im', 'imaginary part'],
    ['\u0127', 'h-bar', '\\hbar', 'reduced planck'], ['\u0131', 'Dotless i', '\\imath', 'dotless'], ['\u0237', 'Dotless j', '\\jmath', 'dotless']
]);

Symbols.add('advanced', [
    ['A\u0305', 'Closure (topology)', '\\overline{A}', 'closure topology'], ['A\u00B0', 'Interior (topology)', 'A^{\\circ}', 'interior topology'],
    ['\u2202A', 'Boundary', '\\partial A', 'boundary topology'], ['\u2245', 'Homeomorphic / isomorphic', '\\cong', 'homeomorphic isomorphic'],
    ['\u2243', 'Homotopy equivalent', '\\simeq', 'homotopic'], ['\u22B4', 'Normal subgroup', '\\trianglelefteq', 'normal subgroup ideal group theory'],
    ['\u22B2', 'Proper normal subgroup', '\\lhd', 'normal subgroup'], ['G/H', 'Quotient group', 'G/H', 'quotient coset'],
    ['\u22CA', 'Semidirect product', '\\rtimes', 'semidirect group'], ['Aut', 'Automorphism group', '\\operatorname{Aut}(G)', 'automorphism'],
    ['Hom', 'Homomorphisms', '\\hom(V,W)', 'homomorphism'], ['im', 'Image', '\\operatorname{im} f', 'image range'],
    ['char', 'Characteristic (ring/field)', '\\operatorname{char} F', 'characteristic ring field'],
    ['Gal', 'Galois group', '\\operatorname{Gal}(L/K)', 'galois field extension'], ['[L:K]', 'Degree of field extension', '[L:K]', 'field degree'],
    ['\u2227', 'Wedge (exterior) product', '\\wedge', 'exterior wedge differential forms'],
    ['\u2112\u2093', 'Lie derivative', '\\mathcal{L}_{X}', 'lie derivative'],
    ['\u0393\u1D58\u1D65', 'Christoffel symbol', '\\Gamma^{\\lambda}_{\\mu\\nu}', 'christoffel connection differential geometry'],
    ['\u2207\u03BC', 'Covariant derivative', '\\nabla_{\\mu}', 'covariant derivative'],
    ['R\u1D56', 'Riemann tensor', 'R^{\\rho}{}_{\\sigma\\mu\\nu}', 'riemann curvature tensor'],
    ['g\u03BC\u03BD', 'Metric tensor', 'g_{\\mu\\nu}', 'metric tensor'], ['T\u209AM', 'Tangent space', 'T_{p}M', 'tangent space manifold'],
    ['\u03B4\u1D62\u2C7C', 'Kronecker delta', '\\delta_{ij}', 'kronecker tensor'], ['\u03B5\u1D62\u2C7C\u2096', 'Levi-Civita symbol', '\\varepsilon_{ijk}', 'levi civita permutation tensor'],
    ['V*', 'Dual space', 'V^{*}', 'dual space functional analysis'], ['A*', 'Adjoint operator', 'A^{*}', 'adjoint'],
    ['L\u1D56', 'Lp space', 'L^{p}', 'lebesgue space'], ['\u2016T\u2016', 'Operator norm', '\\norm{T}_{\\mathrm{op}}', 'operator norm'],
    ['z\u0304', 'Complex conjugate', '\\bar{z}', 'conjugate complex analysis'], ['Res', 'Residue', '\\Res_{z=a} f', 'residue complex'],
    ['arg', 'Argument', '\\arg z', 'argument complex'], ['O(n)', 'Big O', '\\mathcal{O}(n)', 'big o complexity numerical'],
    ['x\u2099\u208A\u2081', 'Iteration', 'x_{n+1}=x_{n}-\\frac{f(x_{n})}{f\'(x_{n})}', 'newton iteration numerical analysis'],
    ['argmin', 'Arg min', '\\argmin_{x}', 'optimization argmin'], ['argmax', 'Arg max', '\\argmax_{x}', 'optimization argmax'],
    ['\u2207\u00B2f', 'Hessian', '\\nabla^{2} f', 'hessian optimization'], ['s.t.', 'Subject to', '\\text{subject to}', 'constraint optimization'],
    ['\u25A1', "d'Alembertian", '\\Box', 'dalembertian wave operator'], ['\u03B4(x)', 'Dirac delta', '\\delta(x)', 'dirac delta distribution'],
    ['\u0398(x)', 'Heaviside step', '\\Theta(x)', 'heaviside step'], ['G(x,x\u2032)', "Green's function", "G(x,x')", 'green function']
]);

/* ------------------------------------------------------------- PHYSICS ---- */
Symbols.add('phys_mech', [
    ['r\u20D7', 'Position vector', '\\vec{r}', 'position'], ['\u0394r\u20D7', 'Displacement', '\\Delta\\vec{r}', 'displacement'],
    ['s', 'Displacement / path (s)', 's', 'path displacement'], ['d', 'Distance', 'd', 'distance'],
    ['v\u20D7', 'Velocity', '\\vec{v}', 'velocity speed'], ['a\u20D7', 'Acceleration', '\\vec{a}', 'acceleration'],
    ['m', 'Mass', 'm', 'mass'], ['F\u20D7', 'Force', '\\vec{F}', 'force'], ['p\u20D7', 'Momentum', '\\vec{p}', 'momentum'],
    ['J\u20D7', 'Impulse', '\\vec{J}', 'impulse'], ['W', 'Work', 'W', 'work'], ['E', 'Energy', 'E', 'energy'],
    ['E\u2096', 'Kinetic energy', 'E_{\\mathrm{k}}', 'kinetic energy'], ['E\u209A', 'Potential energy', 'E_{\\mathrm{p}}', 'potential energy'],
    ['P', 'Power', 'P', 'power'], ['\u03C4\u20D7', 'Torque', '\\vec{\\tau}', 'torque moment'],
    ['\u03C9\u20D7', 'Angular velocity', '\\vec{\\omega}', 'angular velocity'], ['\u03B1\u20D7', 'Angular acceleration', '\\vec{\\alpha}', 'angular acceleration'],
    ['I', 'Moment of inertia', 'I', 'moment inertia'], ['L\u20D7', 'Angular momentum', '\\vec{L}', 'angular momentum'],
    ['f\u2096', 'Kinetic friction', 'f_{\\mathrm{k}}', 'friction'], ['\u03BC\u209B', 'Coefficient of friction', '\\mu_{\\mathrm{s}}', 'friction coefficient'],
    ['g', 'Gravitational acceleration', 'g', 'gravity acceleration'], ['G', 'Gravitational constant', 'G', 'gravitational constant'],
    ['\u03A6\u0261', 'Gravitational potential', '\\Phi_{g}', 'gravitational potential'], ['\u2211F=0', 'Mechanical equilibrium', '\\sum\\vec{F}=0', 'equilibrium static'],
    ['k', 'Spring constant', 'k', 'spring hooke'], ['T', 'Period', 'T', 'period'], ['\u03C1', 'Density', '\\rho', 'density'],
    ['N', 'Normal force', 'N', 'normal force'], ['F\u20D7net', 'Net force', '\\vec{F}_{\\mathrm{net}}', 'net force']
], 'notation');

Symbols.add('phys_em', [
    ['q', 'Electric charge', 'q', 'charge'], ['Q', 'Charge (total)', 'Q', 'charge'], ['I', 'Current', 'I', 'current'],
    ['V', 'Voltage', 'V', 'voltage'], ['\u0394V', 'Potential difference', '\\Delta V', 'potential difference'],
    ['R', 'Resistance', 'R', 'resistance'], ['G', 'Conductance', 'G', 'conductance'], ['C', 'Capacitance', 'C', 'capacitance'],
    ['L', 'Inductance', 'L', 'inductance'], ['E\u20D7', 'Electric field', '\\vec{E}', 'electric field'],
    ['B\u20D7', 'Magnetic flux density', '\\vec{B}', 'magnetic field flux density'], ['H\u20D7', 'Magnetic field strength', '\\vec{H}', 'magnetic field strength'],
    ['\u03A6B', 'Magnetic flux', '\\Phi_{B}', 'magnetic flux'], ['\u03B5\u2080', 'Vacuum permittivity', '\\varepsilon_{0}', 'permittivity'],
    ['\u03B5\u1D63', 'Relative permittivity', '\\varepsilon_{r}', 'permittivity relative dielectric'], ['\u03BC\u2080', 'Vacuum permeability', '\\mu_{0}', 'permeability'],
    ['k\u2091', 'Coulomb constant', 'k_{e}', 'coulomb constant'], ['\u03C6', 'Electric potential', '\\varphi', 'potential'],
    ['\u2130', 'Electromotive force', '\\mathcal{E}', 'emf electromotive'], ['Z', 'Impedance', 'Z', 'impedance'],
    ['X', 'Reactance', 'X', 'reactance'], ['X\u2097', 'Inductive reactance', 'X_{L}', 'inductive reactance'],
    ['X\u1D04', 'Capacitive reactance', 'X_{C}', 'capacitive reactance'], ['J\u20D7', 'Current density', '\\vec{J}', 'current density'],
    ['\u03C1', 'Resistivity / charge density', '\\rho', 'resistivity charge density'], ['\u03C3', 'Conductivity', '\\sigma', 'conductivity'],
    ['p\u20D7', 'Electric dipole moment', '\\vec{p}', 'dipole'], ['\u03BC\u20D7', 'Magnetic moment', '\\vec{\\mu}', 'magnetic moment']
], 'notation');

Symbols.add('phys_waves', [
    ['f', 'Frequency', 'f', 'frequency'], ['\u03BD', 'Frequency (nu)', '\\nu', 'frequency nu'], ['\u03C9', 'Angular frequency', '\\omega', 'angular frequency'],
    ['\u03BB', 'Wavelength', '\\lambda', 'wavelength'], ['k', 'Wave number', 'k', 'wavenumber'], ['T', 'Period', 'T', 'period'],
    ['A', 'Amplitude', 'A', 'amplitude'], ['\u03C6', 'Phase', '\\phi', 'phase'], ['n', 'Refractive index', 'n', 'refractive index'],
    ['f', 'Focal length', 'f', 'focal length lens'], ['M', 'Magnification', 'M', 'magnification'], ['I', 'Intensity', 'I', 'intensity'],
    ['P\u20D7', 'Polarization', '\\vec{P}', 'polarization'], ['\u03B8\u1D62', 'Angle of incidence', '\\theta_{i}', 'incidence reflection'],
    ['\u03B8\u1D63', 'Angle of reflection', '\\theta_{r}', 'reflection'], ['\u03B8\u209C', 'Angle of refraction', '\\theta_{t}', 'refraction transmission'],
    ['\u0394', 'Path difference', '\\Delta', 'interference path difference'], ['dsin\u03B8=m\u03BB', 'Diffraction grating condition', 'd\\sin\\theta=m\\lambda', 'diffraction interference grating'],
    ['c', 'Speed of light', 'c', 'speed light'], ['v\u209A', 'Phase velocity', 'v_{p}', 'phase velocity'], ['v\u0261', 'Group velocity', 'v_{g}', 'group velocity']
], 'notation');

Symbols.add('phys_thermo', [
    ['T', 'Temperature', 'T', 'temperature'], ['Q', 'Heat', 'Q', 'heat'], ['U', 'Internal energy', 'U', 'internal energy'],
    ['S', 'Entropy', 'S', 'entropy'], ['H', 'Enthalpy', 'H', 'enthalpy'], ['G', 'Gibbs free energy', 'G', 'gibbs free energy potential'],
    ['F', 'Helmholtz free energy', 'F', 'helmholtz potential'], ['p', 'Pressure', 'p', 'pressure'], ['V', 'Volume', 'V', 'volume'],
    ['\u03C1', 'Density', '\\rho', 'density'], ['c', 'Specific heat capacity', 'c', 'specific heat'], ['C\u209A', 'Heat capacity (const. pressure)', 'C_{p}', 'heat capacity'],
    ['C\u1D65', 'Heat capacity (const. volume)', 'C_{V}', 'heat capacity'], ['\u03B3', 'Adiabatic index', '\\gamma', 'heat capacity ratio adiabatic'],
    ['\u03BA', 'Thermal conductivity', '\\kappa', 'thermal conductivity'], ['R', 'Gas constant', 'R', 'gas constant'],
    ['k\u0299', 'Boltzmann constant', 'k_{\\mathrm{B}}', 'boltzmann'], ['N\u2090', 'Avogadro constant', 'N_{\\mathrm{A}}', 'avogadro'],
    ['n', 'Amount of substance', 'n', 'moles amount'], ['\u0394U', 'Change in internal energy', '\\Delta U', 'change'],
    ['Q\u0307', 'Heat flow rate', '\\dot{Q}', 'heat flow'], ['\u03B7', 'Efficiency', '\\eta', 'efficiency'], ['\u03C3', 'Stefan-Boltzmann constant', '\\sigma', 'stefan boltzmann radiation']
], 'notation');

Symbols.add('phys_quantum', [
    ['h', 'Planck constant', 'h', 'planck'], ['\u0127', 'Reduced Planck constant', '\\hbar', 'hbar dirac'],
    ['\u03A8', 'Wave function (capital psi)', '\\Psi', 'wave function'], ['\u03C8', 'Wave function', '\\psi', 'wave function'],
    ['|\u03C8|\u00B2', 'Probability density', '\\left|\\psi\\right|^{2}', 'probability density born'],
    ['|\u03C8\u27E9', 'Ket (quantum state)', '\\ket{\\psi}', 'ket state dirac'], ['\u27E8\u03C6|', 'Bra', '\\bra{\\phi}', 'bra dirac'],
    ['\u27E8\u03C6|\u03C8\u27E9', 'Bra-ket (inner product)', '\\braket{\\phi}{\\psi}', 'braket inner product'],
    ['\u00C2', 'Operator', '\\hat{A}', 'operator hat'], ['\u0124', 'Hamiltonian', '\\hat{H}', 'hamiltonian'],
    ['p\u0302', 'Momentum operator', '\\hat{p}', 'momentum operator'], ['\u27E8A\u27E9', 'Expectation value', '\\langle \\hat{A} \\rangle', 'expectation'],
    ['[A,B]', 'Commutator', '[\\hat{A},\\hat{B}]', 'commutator'], ['E\u2099', 'Energy level', 'E_{n}', 'energy level eigenvalue'],
    ['|n\u27E9', 'Eigenstate', '\\ket{n}', 'eigenstate'], ['S\u20D7', 'Spin', '\\vec{S}', 'spin'], ['m\u209B', 'Spin projection', 'm_{s}', 'spin quantum number'],
    ['E=h\u03BD', 'Photon energy', 'E=h\\nu', 'photon energy'], ['\u03B3', 'Lorentz factor', '\\gamma', 'lorentz relativistic'],
    ['m\u2080', 'Rest mass', 'm_{0}', 'rest mass relativistic'], ['x\u1D58', 'Four-vector', 'x^{\\mu}', 'four vector relativity'],
    ['\u1D2C\u2082X', 'Nuclide notation', '\\prescript{A}{Z}{\\mathrm{X}}', 'nuclide isotope nuclear'],
    ['\u03B1', 'Alpha particle', '\\alpha', 'alpha decay'], ['\u03B2\u207B', 'Beta minus', '\\beta^{-}', 'beta decay'],
    ['\u03BD\u2091', 'Electron neutrino', '\\nu_{e}', 'neutrino'], ['\u03C3\u2093', 'Pauli matrix', '\\sigma_{x}', 'pauli spin'],
    ['\u2020', 'Hermitian adjoint', '^{\\dagger}', 'dagger adjoint'], ['\u03B4\u1D62\u2C7C', 'Kronecker delta', '\\delta_{ij}', 'kronecker']
], 'notation');

Symbols.add('phys_constants', [
    ['c', 'Speed of light in vacuum', 'c', 'light speed 299792458'], ['G', 'Newtonian constant of gravitation', 'G', 'gravitational'],
    ['h', 'Planck constant', 'h', 'planck'], ['\u0127', 'Reduced Planck constant', '\\hbar', 'reduced planck'],
    ['e', 'Elementary charge', 'e', 'electron charge'], ['m\u2091', 'Electron mass', 'm_{e}', 'electron mass'],
    ['m\u209A', 'Proton mass', 'm_{p}', 'proton mass'], ['k\u0299', 'Boltzmann constant', 'k_{\\mathrm{B}}', 'boltzmann'],
    ['N\u2090', 'Avogadro constant', 'N_{\\mathrm{A}}', 'avogadro'], ['R', 'Molar gas constant', 'R', 'gas constant'],
    ['\u03B5\u2080', 'Vacuum electric permittivity', '\\varepsilon_{0}', 'permittivity'], ['\u03BC\u2080', 'Vacuum magnetic permeability', '\\mu_{0}', 'permeability'],
    ['\u03C3', 'Stefan-Boltzmann constant', '\\sigma', 'stefan'], ['a\u2080', 'Bohr radius', 'a_{0}', 'bohr radius'],
    ['R\u221E', 'Rydberg constant', 'R_{\\infty}', 'rydberg'], ['\u03B1', 'Fine-structure constant', '\\alpha', 'fine structure'],
    ['g', 'Standard gravity', 'g', 'gravity 9.80665']
], 'notation');

/* --------------------------------------------------------------- UNITS ---- */
Symbols.add('units_si', [
    ['m', 'Metre', '\\,\\unit{m}', 'meter length'], ['kg', 'Kilogram', '\\,\\unit{kg}', 'mass'], ['s', 'Second', '\\,\\unit{s}', 'time'],
    ['A', 'Ampere', '\\,\\unit{A}', 'current amp'], ['K', 'Kelvin', '\\,\\unit{K}', 'temperature'], ['mol', 'Mole', '\\,\\unit{mol}', 'amount'],
    ['cd', 'Candela', '\\,\\unit{cd}', 'luminous intensity']
], 'unit');
Symbols.add('units_derived', [
    ['N', 'Newton', '\\,\\unit{N}', 'force'], ['J', 'Joule', '\\,\\unit{J}', 'energy work'], ['W', 'Watt', '\\,\\unit{W}', 'power'],
    ['Pa', 'Pascal', '\\,\\unit{Pa}', 'pressure'], ['C', 'Coulomb', '\\,\\unit{C}', 'charge'], ['V', 'Volt', '\\,\\unit{V}', 'voltage'],
    ['\u03A9', 'Ohm', '\\,\\unit{\\Omega}', 'resistance'], ['F', 'Farad', '\\,\\unit{F}', 'capacitance'], ['T', 'Tesla', '\\,\\unit{T}', 'magnetic flux density'],
    ['Wb', 'Weber', '\\,\\unit{Wb}', 'magnetic flux'], ['H', 'Henry', '\\,\\unit{H}', 'inductance'], ['Hz', 'Hertz', '\\,\\unit{Hz}', 'frequency'],
    ['lm', 'Lumen', '\\,\\unit{lm}', 'luminous flux'], ['lx', 'Lux', '\\,\\unit{lx}', 'illuminance'], ['S', 'Siemens', '\\,\\unit{S}', 'conductance'],
    ['Bq', 'Becquerel', '\\,\\unit{Bq}', 'radioactivity'], ['Gy', 'Gray', '\\,\\unit{Gy}', 'absorbed dose'], ['Sv', 'Sievert', '\\,\\unit{Sv}', 'equivalent dose'],
    ['kat', 'Katal', '\\,\\unit{kat}', 'catalytic activity'], ['rad', 'Radian', '\\,\\unit{rad}', 'angle'], ['sr', 'Steradian', '\\,\\unit{sr}', 'solid angle'],
    ['\u00B0C', 'Degree Celsius', '\\,\\unit{^{\\circ}C}', 'celsius temperature']
], 'unit');
Symbols.add('units_other', [
    ['m/s', 'Metre per second', '\\,\\unit{m/s}', 'velocity speed'], ['m\u00B7s\u207B\u00B9', 'Metre per second (exponent)', '\\,\\unit{m.s^{-1}}', 'velocity'],
    ['m/s\u00B2', 'Metre per second squared', '\\,\\unit{m/s^{2}}', 'acceleration'], ['N\u00B7m', 'Newton metre', '\\,\\unit{N.m}', 'torque'],
    ['kg\u00B7m/s', 'Kilogram metre per second', '\\,\\unit{kg.m/s}', 'momentum'], ['J/(mol\u00B7K)', 'Joule per mole kelvin', '\\,\\unit{J/(mol.K)}', 'gas constant'],
    ['eV', 'Electronvolt', '\\,\\unit{eV}', 'energy'], ['L', 'Litre', '\\,\\unit{L}', 'volume liter'], ['mL', 'Millilitre', '\\,\\unit{mL}', 'volume'],
    ['min', 'Minute', '\\,\\unit{min}', 'time'], ['h', 'Hour', '\\,\\unit{h}', 'time'], ['\u00C5', 'Angstrom', '\\,\\unit{\\AA}', 'length'],
    ['bar', 'Bar', '\\,\\unit{bar}', 'pressure'], ['atm', 'Atmosphere', '\\,\\unit{atm}', 'pressure'], ['mmHg', 'Millimetre of mercury', '\\,\\unit{mmHg}', 'pressure'],
    ['cal', 'Calorie', '\\,\\unit{cal}', 'energy'], ['kWh', 'Kilowatt hour', '\\,\\unit{kWh}', 'energy'], ['Da', 'Dalton', '\\,\\unit{Da}', 'atomic mass'],
    ['M', 'Molar (mol/L)', '\\,\\unit{M}', 'concentration molarity'], ['mol/L', 'Mole per litre', '\\,\\unit{mol/L}', 'concentration'],
    ['g/mol', 'Gram per mole', '\\,\\unit{g/mol}', 'molar mass'], ['ppm', 'Parts per million', '\\,\\unit{ppm}', 'concentration'],
    ['dB', 'Decibel', '\\,\\unit{dB}', 'sound level'], ['km/h', 'Kilometre per hour', '\\,\\unit{km/h}', 'speed'],
    ['g', 'Gram', '\\,\\unit{g}', 'mass'], ['mg', 'Milligram', '\\,\\unit{mg}', 'mass'], ['km', 'Kilometre', '\\,\\unit{km}', 'length'],
    ['cm', 'Centimetre', '\\,\\unit{cm}', 'length'], ['mm', 'Millimetre', '\\,\\unit{mm}', 'length'], ['\u00B5m', 'Micrometre', '\\,\\unit{\\mu m}', 'length micron'],
    ['nm', 'Nanometre', '\\,\\unit{nm}', 'length wavelength'], ['mA', 'Milliampere', '\\,\\unit{mA}', 'current'], ['kV', 'Kilovolt', '\\,\\unit{kV}', 'voltage'],
    ['MHz', 'Megahertz', '\\,\\unit{MHz}', 'frequency'], ['kJ', 'Kilojoule', '\\,\\unit{kJ}', 'energy'], ['kJ/mol', 'Kilojoule per mole', '\\,\\unit{kJ/mol}', 'enthalpy energy'],
    ['J/K', 'Joule per kelvin', '\\,\\unit{J/K}', 'entropy'], ['W/m\u00B2', 'Watt per square metre', '\\,\\unit{W/m^{2}}', 'intensity irradiance'],
    ['kg/m\u00B3', 'Kilogram per cubic metre', '\\,\\unit{kg/m^{3}}', 'density'], ['m\u00B2', 'Square metre', '\\,\\unit{m^{2}}', 'area'],
    ['m\u00B3', 'Cubic metre', '\\,\\unit{m^{3}}', 'volume']
], 'unit');

/* ----------------------------------------------------------- CHEMISTRY ---- */
Symbols.add('chem_arrows', [
    ['\u2192', 'Forward reaction arrow', '\\ce{->}', 'yields forward reaction'], ['\u2190', 'Reverse reaction arrow', '\\ce{<-}', 'reverse'],
    ['\u21CC', 'Equilibrium arrows', '\\ce{<=>}', 'equilibrium reversible harpoons'], ['\u21C4', 'Reversible reaction arrows', '\\rightleftarrows', 'reversible'],
    ['\u2194', 'Resonance arrow', '\\ce{<->}', 'resonance'], ['\u2192\u0394', 'Heat (over arrow)', '\\xrightarrow{\\Delta}', 'heat delta condition'],
    ['\u2192h\u03BD', 'Light (over arrow)', '\\xrightarrow{h\\nu}', 'light photochemical'],
    ['\u2192cat', 'Catalyst (over arrow)', '\\xrightarrow{\\text{catalyst}}', 'catalyst condition'],
    ['\u2192T,p', 'Temperature & pressure conditions', '\\xrightarrow[\\text{pressure}]{\\text{temperature}}', 'temperature pressure condition'],
    ['\u21B7', 'Electron movement (curved arrow)', '\\curvearrowright', 'electron pushing curved arrow'],
    ['\u21B6', 'Electron movement (curved left)', '\\curvearrowleft', 'electron curved arrow'],
    ['\u21C0', 'Single-electron (fishhook) arrow', '\\rightharpoonup', 'radical fishhook single electron'],
    ['\u21CB', 'Equilibrium (reverse harpoons)', '\\leftrightharpoons', 'equilibrium']
]);
Symbols.add('chem_states', [
    ['(s)', 'Solid state', '\\text{(s)}', 'solid state'], ['(l)', 'Liquid state', '\\text{(l)}', 'liquid state'],
    ['(g)', 'Gas state', '\\text{(g)}', 'gas state'], ['(aq)', 'Aqueous solution', '\\text{(aq)}', 'aqueous solution'],
    ['\u2193', 'Precipitate', '\\downarrow', 'precipitate solid forms'], ['\u2191', 'Gas evolved', '\\uparrow', 'gas evolution'],
    ['\u0394', 'Heat (Delta)', '\\Delta', 'heat'], ['\u00B0', 'Standard state', '^{\\circ}', 'standard state'],
    ['\u2296', 'Standard state (plimsoll)', '^{\\ominus}', 'standard state plimsoll']
]);
Symbols.add('chem_notation', [
    ['H\u2082O', 'Chemical formula', '\\ce{H2O}', 'formula water'], ['\u00B7', 'Hydrate dot', '\\cdot', 'hydrate water of crystallization'],
    ['\u207A', 'Positive charge', '^{+}', 'cation charge ion'], ['\u00B2\u207B', 'Charge 2-', '^{2-}', 'anion charge ion'],
    ['Fe\u207A\u00B3', 'Oxidation state', '\\overset{+3}{\\mathrm{Fe}}', 'oxidation number state'],
    ['\u00B9\u2074\u2086C', 'Isotope notation', '\\prescript{14}{6}{\\mathrm{C}}', 'isotope mass number atomic number'],
    ['1s\u00B22s\u00B2', 'Electron configuration', '1s^{2}\\,2s^{2}\\,2p^{6}', 'electron configuration orbital'],
    ['[A]', 'Concentration', '[\\mathrm{A}]', 'concentration molarity'], ['K\u2091q', 'Equilibrium constant', 'K_{\\mathrm{eq}}', 'equilibrium constant'],
    ['K\u2090', 'Acid dissociation constant', 'K_{\\mathrm{a}}', 'acid constant'], ['pH', 'pH', '\\mathrm{pH}', 'acidity'],
    ['pK\u2090', 'pKa', '\\mathrm{p}K_{\\mathrm{a}}', 'acidity constant'], ['\u0394H\u00B0', 'Standard enthalpy change', '\\Delta H^{\\circ}', 'enthalpy'],
    ['=', 'Double bond', '=', 'double bond'], ['\u2261', 'Triple bond', '\\equiv', 'triple bond'], ['\u2022', 'Radical dot', '\\bullet', 'radical'],
    ['\u03B4\u207A', 'Partial positive charge', '\\delta^{+}', 'partial charge'], ['\u03B4\u207B', 'Partial negative charge', '\\delta^{-}', 'partial charge'],
    ['e\u207B', 'Electron', '\\mathrm{e}^{-}', 'electron'], ['(OH)\u2082', 'Group with subscript', '\\ce{(OH)2}', 'group parentheses']
]);

/* Search helper used by the symbol browser and the global search */
Symbols.search = function (query, cat) {
    var out = [], i, e, sc;
    for (i = 0; i < Symbols.list.length; i++) {
        e = Symbols.list[i];
        if (cat && cat !== 'all' && e.cat !== cat) { continue; }
        sc = U.searchScore(query, [e.name, e.ch, e.ins, e.kw, Symbols.categoryName(e.cat), e.cp]);
        if (sc > 0) { out.push({ e: e, s: sc }); }
    }
    out.sort(function (a, b) { return b.s - a.s; });
    return U.map(out, function (x) { return x.e; });
};

/* ---- 12_elements.jsx ---- */
/* ==========================================================================
 * Module 12 - Periodic table (all 118 IUPAC-recognized elements)
 * Fields: z (atomic number), sym, name, mass (standard atomic weight, or the
 * mass number of the longest-lived isotope when massIsIsotope is true),
 * group (1-18; 0 for lanthanides/actinides f-block), period, category.
 * ========================================================================== */
var Elements = {};
Elements.CATEGORY_NAMES = {
    nm: 'Reactive nonmetal', ng: 'Noble gas', am: 'Alkali metal', ae: 'Alkaline earth metal',
    md: 'Metalloid', pt: 'Post-transition metal', tm: 'Transition metal', la: 'Lanthanide',
    ac: 'Actinide', ha: 'Halogen', un: 'Unknown properties'
};
/* "Z,Sym,Name,Mass,Group,Category" ; mass in brackets = most stable isotope */
Elements.RAW = [
    '1,H,Hydrogen,1.008,1,nm', '2,He,Helium,4.0026,18,ng', '3,Li,Lithium,6.94,1,am', '4,Be,Beryllium,9.0122,2,ae',
    '5,B,Boron,10.81,13,md', '6,C,Carbon,12.011,14,nm', '7,N,Nitrogen,14.007,15,nm', '8,O,Oxygen,15.999,16,nm',
    '9,F,Fluorine,18.998,17,ha', '10,Ne,Neon,20.180,18,ng', '11,Na,Sodium,22.990,1,am', '12,Mg,Magnesium,24.305,2,ae',
    '13,Al,Aluminium,26.982,13,pt', '14,Si,Silicon,28.085,14,md', '15,P,Phosphorus,30.974,15,nm', '16,S,Sulfur,32.06,16,nm',
    '17,Cl,Chlorine,35.45,17,ha', '18,Ar,Argon,39.948,18,ng', '19,K,Potassium,39.098,1,am', '20,Ca,Calcium,40.078,2,ae',
    '21,Sc,Scandium,44.956,3,tm', '22,Ti,Titanium,47.867,4,tm', '23,V,Vanadium,50.942,5,tm', '24,Cr,Chromium,51.996,6,tm',
    '25,Mn,Manganese,54.938,7,tm', '26,Fe,Iron,55.845,8,tm', '27,Co,Cobalt,58.933,9,tm', '28,Ni,Nickel,58.693,10,tm',
    '29,Cu,Copper,63.546,11,tm', '30,Zn,Zinc,65.38,12,tm', '31,Ga,Gallium,69.723,13,pt', '32,Ge,Germanium,72.630,14,md',
    '33,As,Arsenic,74.922,15,md', '34,Se,Selenium,78.971,16,nm', '35,Br,Bromine,79.904,17,ha', '36,Kr,Krypton,83.798,18,ng',
    '37,Rb,Rubidium,85.468,1,am', '38,Sr,Strontium,87.62,2,ae', '39,Y,Yttrium,88.906,3,tm', '40,Zr,Zirconium,91.224,4,tm',
    '41,Nb,Niobium,92.906,5,tm', '42,Mo,Molybdenum,95.95,6,tm', '43,Tc,Technetium,[98],7,tm', '44,Ru,Ruthenium,101.07,8,tm',
    '45,Rh,Rhodium,102.91,9,tm', '46,Pd,Palladium,106.42,10,tm', '47,Ag,Silver,107.87,11,tm', '48,Cd,Cadmium,112.41,12,tm',
    '49,In,Indium,114.82,13,pt', '50,Sn,Tin,118.71,14,pt', '51,Sb,Antimony,121.76,15,md', '52,Te,Tellurium,127.60,16,md',
    '53,I,Iodine,126.90,17,ha', '54,Xe,Xenon,131.29,18,ng', '55,Cs,Caesium,132.91,1,am', '56,Ba,Barium,137.33,2,ae',
    '57,La,Lanthanum,138.91,0,la', '58,Ce,Cerium,140.12,0,la', '59,Pr,Praseodymium,140.91,0,la', '60,Nd,Neodymium,144.24,0,la',
    '61,Pm,Promethium,[145],0,la', '62,Sm,Samarium,150.36,0,la', '63,Eu,Europium,151.96,0,la', '64,Gd,Gadolinium,157.25,0,la',
    '65,Tb,Terbium,158.93,0,la', '66,Dy,Dysprosium,162.50,0,la', '67,Ho,Holmium,164.93,0,la', '68,Er,Erbium,167.26,0,la',
    '69,Tm,Thulium,168.93,0,la', '70,Yb,Ytterbium,173.05,0,la', '71,Lu,Lutetium,174.97,0,la', '72,Hf,Hafnium,178.49,4,tm',
    '73,Ta,Tantalum,180.95,5,tm', '74,W,Tungsten,183.84,6,tm', '75,Re,Rhenium,186.21,7,tm', '76,Os,Osmium,190.23,8,tm',
    '77,Ir,Iridium,192.22,9,tm', '78,Pt,Platinum,195.08,10,tm', '79,Au,Gold,196.97,11,tm', '80,Hg,Mercury,200.59,12,tm',
    '81,Tl,Thallium,204.38,13,pt', '82,Pb,Lead,207.2,14,pt', '83,Bi,Bismuth,208.98,15,pt', '84,Po,Polonium,[209],16,pt',
    '85,At,Astatine,[210],17,ha', '86,Rn,Radon,[222],18,ng', '87,Fr,Francium,[223],1,am', '88,Ra,Radium,[226],2,ae',
    '89,Ac,Actinium,[227],0,ac', '90,Th,Thorium,232.04,0,ac', '91,Pa,Protactinium,231.04,0,ac', '92,U,Uranium,238.03,0,ac',
    '93,Np,Neptunium,[237],0,ac', '94,Pu,Plutonium,[244],0,ac', '95,Am,Americium,[243],0,ac', '96,Cm,Curium,[247],0,ac',
    '97,Bk,Berkelium,[247],0,ac', '98,Cf,Californium,[251],0,ac', '99,Es,Einsteinium,[252],0,ac', '100,Fm,Fermium,[257],0,ac',
    '101,Md,Mendelevium,[258],0,ac', '102,No,Nobelium,[259],0,ac', '103,Lr,Lawrencium,[266],0,ac', '104,Rf,Rutherfordium,[267],4,tm',
    '105,Db,Dubnium,[268],5,tm', '106,Sg,Seaborgium,[269],6,tm', '107,Bh,Bohrium,[270],7,tm', '108,Hs,Hassium,[269],8,tm',
    '109,Mt,Meitnerium,[278],9,un', '110,Ds,Darmstadtium,[281],10,un', '111,Rg,Roentgenium,[282],11,un', '112,Cn,Copernicium,[285],12,tm',
    '113,Nh,Nihonium,[286],13,un', '114,Fl,Flerovium,[289],14,un', '115,Mc,Moscovium,[290],15,un', '116,Lv,Livermorium,[293],16,un',
    '117,Ts,Tennessine,[294],17,un', '118,Og,Oganesson,[294],18,un'
];
Elements.list = [];
Elements.bySymbol = {};
(function () {
    var i, p, m, e, z;
    for (i = 0; i < Elements.RAW.length; i++) {
        p = Elements.RAW[i].split(',');
        z = parseInt(p[0], 10);
        m = p[3];
        e = {
            z: z, sym: p[1], name: p[2],
            mass: parseFloat(m.replace(/[\[\]]/g, '')),
            massIsIsotope: m.charAt(0) === '[',
            group: parseInt(p[4], 10),
            period: z <= 2 ? 1 : z <= 10 ? 2 : z <= 18 ? 3 : z <= 36 ? 4 : z <= 54 ? 5 : z <= 86 ? 6 : 7,
            category: Elements.CATEGORY_NAMES[p[5]]
        };
        e.block = (e.group === 0) ? 'f' : (e.group <= 2 || e.sym === 'He') ? 's' : (e.group >= 13 ? 'p' : 'd');
        Elements.list.push(e);
        Elements.bySymbol[e.sym] = e;
    }
}());
Elements.get = function (sym) { return U.has(Elements.bySymbol, sym) ? Elements.bySymbol[sym] : null; };
Elements.search = function (q) {
    var out = [], i, e, sc;
    for (i = 0; i < Elements.list.length; i++) {
        e = Elements.list[i];
        sc = U.searchScore(q, [e.sym, e.name, String(e.z), e.category]);
        if (U.trim(q) && U.lower(e.sym) === U.lower(U.trim(q))) { sc = 200; }
        if (sc > 0) { out.push({ e: e, s: sc }); }
    }
    out.sort(function (a, b) { return (b.s - a.s) || (a.e.z - b.e.z); });
    return U.map(out, function (x) { return x.e; });
};

/* ---- 20_ast.jsx ---- */
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

/* ---- 21_lexer.jsx ---- */
/* ==========================================================================
 * Module 21 - Lexical analysis
 * Token: {t, v, pos, end, sp, raw?, raw2?, rawPos?}
 *   t: 'cmd' | 'char' | 'num' | '{' | '}' | '^' | '_' | '&' | 'nl' | 'eof'
 *   sp: whitespace preceded the token
 * Commands whose argument is raw text (\text, \ce, \color, \begin ...) have
 * that argument captured verbatim in .raw so it is never re-tokenized.
 * ========================================================================== */
var Lexer = {};
Lexer.RAW_ARG = { text: 1, textrm: 1, mbox: 1, textnormal: 1, textbf: 1, textit: 1, textsf: 1, texttt: 1,
    operatorname: 1, ce: 1, color: 1, textcolor: 1, style: 1, begin: 1, end: 1, hspace: 1, tag: 1, label: 1, pu: 1 };

Lexer.tokenize = function (src) {
    var s = String(src), i = 0, n = s.length, toks = [], sp = false, c, start, name, code, tok;
    function err(msg, p) { throw new MathError(ErrorKind.PARSER, msg, '', p); }
    function readBraced(cmdName, cmdPos) {
        var depth = 0, out = '', ch, begin;
        while (i < n && /\s/.test(s.charAt(i))) { i++; }
        if (s.charAt(i) !== '{') { err('Expected "{" after \\' + cmdName, i); }
        begin = i + 1;
        i++;
        while (i < n) {
            ch = s.charAt(i);
            if (ch === '\\' && i + 1 < n) { out += ch + s.charAt(i + 1); i += 2; continue; }
            if (ch === '{') { depth++; }
            else if (ch === '}') {
                if (depth === 0) { i++; return { text: out, pos: begin }; }
                depth--;
            }
            out += ch;
            i++;
        }
        err('Missing closing "}" for \\' + cmdName, cmdPos);
    }
    while (i < n) {
        c = s.charAt(i);
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\u00A0') { sp = true; i++; continue; }
        start = i;
        if (c === '\\') {
            if (i + 1 >= n) { err('A backslash must be followed by a command name', i); }
            c = s.charAt(i + 1);
            if (c === '\\') {
                i += 2;
                /* optional spacing argument like \\[2pt] is accepted and ignored */
                if (/^\[\s*-?[0-9.]+\s*(pt|em|ex|mm|cm)\s*\]/.test(s.substring(i, i + 20))) { i = s.indexOf(']', i) + 1; }
                toks.push({ t: 'nl', v: '\\\\', pos: start, end: i, sp: sp });
                sp = false;
                continue;
            }
            if (/[A-Za-z]/.test(c)) {
                i++;
                name = '';
                while (i < n && /[A-Za-z]/.test(s.charAt(i))) { name += s.charAt(i); i++; }
                if ((name === 'operatorname' || name === 'begin' || name === 'end') && s.charAt(i) === '*') { name += '*'; i++; }
                tok = { t: 'cmd', v: name, pos: start, end: i, sp: sp };
                if (U.has(Lexer.RAW_ARG, name.replace('*', ''))) {
                    var b = readBraced(name, start);
                    tok.raw = b.text;
                    tok.rawPos = b.pos;
                    if (name === 'begin' && (b.text === 'array' || b.text === 'alignat' || b.text === 'alignat*' || b.text === 'subarray')) {
                        var save = i;
                        while (i < n && /\s/.test(s.charAt(i))) { i++; }
                        if (s.charAt(i) === '{') { tok.raw2 = readBraced('begin{' + b.text + '}', start).text; }
                        else { i = save; }
                    }
                    if ((name === 'textcolor') ) {
                        /* \textcolor{color}{body}: body is math, parsed normally */
                    }
                    tok.end = i;
                }
                toks.push(tok);
                sp = false;
                continue;
            }
            /* single-character command: \, \; \{ \| ... */
            i += 2;
            toks.push({ t: 'cmd', v: c, pos: start, end: i, sp: sp });
            sp = false;
            continue;
        }
        if (c === '{' || c === '}' || c === '^' || c === '_' || c === '&') {
            i++;
            toks.push({ t: c, v: c, pos: start, end: i, sp: sp });
            sp = false;
            continue;
        }
        if (c === '~') { i++; toks.push({ t: 'cmd', v: ' ', pos: start, end: i, sp: sp }); sp = false; continue; }
        if (c >= '0' && c <= '9' || (c === '.' && /[0-9]/.test(s.charAt(i + 1)) && !(toks.length && toks[toks.length - 1].t === 'num' && !sp))) {
            var num = '';
            while (i < n && /[0-9]/.test(s.charAt(i))) { num += s.charAt(i); i++; }
            if (s.charAt(i) === '.' && /[0-9]/.test(s.charAt(i + 1))) {
                num += '.';
                i++;
                while (i < n && /[0-9]/.test(s.charAt(i))) { num += s.charAt(i); i++; }
            }
            if (num === '') { num = '.'; i++; }
            toks.push({ t: 'num', v: num, pos: start, end: i, sp: sp });
            sp = false;
            continue;
        }
        code = s.charCodeAt(i);
        if (code >= 0xD800 && code <= 0xDBFF && i + 1 < n) {
            toks.push({ t: 'char', v: s.substring(i, i + 2), pos: start, end: i + 2, sp: sp });
            i += 2;
        } else {
            if (code < 0x20) { i++; continue; }
            toks.push({ t: 'char', v: c, pos: start, end: i + 1, sp: sp });
            i++;
        }
        sp = false;
    }
    toks.push({ t: 'eof', v: '', pos: n, end: n, sp: sp });
    return toks;
};

/* ---- 22_parser.jsx ---- */
/* ==========================================================================
 * Module 22 - Mathematical syntax parser (recursive descent)
 *
 * Grammar (informal):
 *   top      := cells ( ('&' | '\\') cells )*
 *   row      := item*
 *   item     := primary scripts*
 *   scripts  := ('^' arg) | ('_' arg) | "'"+
 *   primary  := group | number | letter | char | command | fence
 *   group    := '{' row '}'
 *   fence    := opener row closer | '\left' delim row '\right' delim
 *
 * Binding: scripts bind tighter than juxtaposition; repeated scripts nest
 * to the right (x^a^b == x^{a^{b}}). Operator precedence/associativity of
 * the resulting rows is analysed by Semantics (module 24).
 * ========================================================================== */
function Parser(src, opts) {
    this.src = String(src);
    this.opts = U.extend({ smartOps: true, smartFuncs: true, autoFence: true }, opts || {});
    this.toks = Lexer.tokenize(this.src);
    this.i = 0;
    this.warnings = [];
    this.failedFence = {};
    this.pendingTag = null;
    this.pendingNoTag = false;
    this.depth = 0;
}
Parser.MAX_DEPTH = 150;

Parser.parse = function (src, opts) {
    var p = new Parser(src, opts);
    var root = p.parseTop();
    return { root: root, warnings: p.warnings };
};
/* Parse a fragment and return a row (used by the builder). */
Parser.parseRow = function (src, opts) { return Parser.parse(src, opts).root; };
Parser.tryParse = function (src, opts) {
    try { var r = Parser.parse(src, opts); return { ok: true, root: r.root, warnings: r.warnings }; }
    catch (e) { return { ok: false, error: Errors.wrap(e, ErrorKind.PARSER) }; }
};
/* Convert a character offset into {line, col} (1-based). */
Parser.location = function (src, pos) {
    var line = 1, col = 1, i;
    for (i = 0; i < pos && i < src.length; i++) {
        if (src.charAt(i) === '\n') { line++; col = 1; } else { col++; }
    }
    return { line: line, col: col };
};

Parser.prototype.peek = function (k) { return this.toks[Math.min(this.i + (k || 0), this.toks.length - 1)]; };
Parser.prototype.next = function () { var t = this.toks[this.i]; if (this.i < this.toks.length - 1) { this.i++; } return t; };
Parser.prototype.error = function (msg, tok) {
    throw new MathError(ErrorKind.PARSER, msg, '', tok ? tok.pos : this.peek().pos);
};
Parser.prototype.warn = function (msg, tok) {
    var loc = Parser.location(this.src, tok ? tok.pos : 0);
    this.warnings.push('Line ' + loc.line + ', column ' + loc.col + ': ' + msg);
};
Parser.prototype.expect = function (t, what, openTok) {
    var tok = this.peek();
    if (tok.t !== t) {
        if (openTok) { this.error('Missing ' + what + ' (opened at character ' + (openTok.pos + 1) + ')', tok); }
        this.error('Expected ' + what, tok);
    }
    return this.next();
};
Parser.prototype.enter = function (tok) {
    if (++this.depth > Parser.MAX_DEPTH) { this.error('Expression is nested too deeply', tok); }
};
Parser.prototype.leave = function () { this.depth--; };

/* ---- Top level ------------------------------------------------------------ */
Parser.prototype.parseTop = function () {
    var rows = [], cells = [], tok, row, sawAmp = false, line;
    this.pendingTag = null;
    this.pendingNoTag = false;
    while (true) {
        row = this.parseRow({ amp: true, nl: true });
        cells.push(row);
        tok = this.peek();
        if (tok.t === '&') { this.next(); sawAmp = true; continue; }
        if (tok.t === 'nl') {
            this.next();
            rows.push(this.finishLine(cells));
            cells = [];
            continue;
        }
        if (tok.t === 'eof') { break; }
        if (tok.t === '}') { this.error('Unmatched closing brace "}"', tok); }
        if (tok.t === 'cmd' && tok.v === 'right') { this.error('\\right without a matching \\left', tok); }
        if (tok.t === 'cmd' && (tok.v === 'end' || tok.v === 'end*')) { this.error('\\end{' + tok.raw + '} without a matching \\begin', tok); }
        if (tok.t === 'char' && tok.v === ']') { this.error('Unexpected "]"', tok); }
        this.error('Unexpected input', tok);
    }
    line = this.finishLine(cells);
    if (!rows.length && cells.length === 1 && !line.tag) { return cells[0]; }
    /* drop a trailing empty line produced by a final \\ */
    if (rows.length && cells.length === 1 && !cells[0].items.length && !line.tag) {
        /* nothing */
    } else {
        rows.push(line);
    }
    var lines = AST.lines('implicit', rows);
    lines.aligned = sawAmp;
    return AST.row([lines]);
};
Parser.prototype.finishLine = function (cells) {
    var lr = AST.lineRow(cells, null);
    if (this.pendingTag) { lr.tag = this.pendingTag; }
    if (this.pendingNoTag) { lr.notag = true; }
    this.pendingTag = null;
    this.pendingNoTag = false;
    return lr;
};

/* ---- Rows ----------------------------------------------------------------- */
/* stop: {amp, nl, bracket, closer, right, end} */
Parser.prototype.parseRow = function (stop) {
    var items = [], tok, node, rest, color;
    stop = stop || {};
    while (true) {
        tok = this.peek();
        if (tok.t === 'eof' || tok.t === '}') { break; }
        if (tok.t === '&') { if (stop.amp) { break; } this.error('Alignment character "&" is only allowed inside a matrix or aligned environment', tok); }
        if (tok.t === 'nl') { if (stop.nl) { break; } this.error('Line break "\\\\" is only allowed at the top level or inside an environment', tok); }
        if (tok.t === 'char' && tok.v === ']' && stop.bracket) { break; }
        if (stop.closer && this.isCloser(tok, stop.closer)) { break; }
        if (tok.t === 'cmd') {
            if (tok.v === 'right') { break; }
            if (tok.v === 'end' || tok.v === 'end*') { break; }
            if (tok.v === 'middle') { this.next(); items.push(this.parseMiddle(tok)); continue; }
            if (tok.v === 'limits' || tok.v === 'nolimits') {
                this.next();
                node = items.length ? items[items.length - 1] : null;
                if (node && node.type === 'bigop') { node.limits = tok.v; }
                else if (node && node.type === 'func') { node.limits = (tok.v === 'limits'); }
                else { this.warn('\\' + tok.v + ' ignored: it must follow a large operator', tok); }
                continue;
            }
            if (tok.v === 'color' && this.peek(1).t !== '{') {
                /* \color{c} acts as a switch for the rest of the current group */
                this.next();
                color = U.normalizeColor(tok.raw);
                if (!color) { this.error('Unknown color "' + tok.raw + '"', tok); }
                rest = this.parseRow(stop);
                if (rest.items.length) { items.push(Parser.applyStyle(rest, { color: color })); }
                break;
            }
        }
        node = this.parseItem(stop);
        if (node) { items.push(node); }
    }
    return AST.row(items);
};

Parser.prototype.parseItem = function (stop) {
    var tok = this.peek(), base, node;
    this.enter(tok);
    if (tok.t === '^' || tok.t === '_') { base = AST.row([]); }
    else {
        base = this.parsePrimary(stop);
        if (base === null) { this.leave(); return null; }
    }
    node = this.parseScripts(base);
    this.leave();
    return node;
};

/* Attach ^ _ and primes to a base node. */
Parser.prototype.parseScripts = function (base) {
    var tok, arg, primes, pn, sc = null, supFromCaret = false;
    function scriptsNode() {
        if (sc) { return sc; }
        if (base.type === 'scripts' && base.fromPrescript && !base.sup && !base.sub) { sc = base; return sc; }
        sc = AST.scripts(base.type === 'row' ? base : AST.row([base]));
        return sc;
    }
    while (true) {
        tok = this.peek();
        if (tok.t === 'char' && tok.v === "'") {
            primes = 0;
            while (this.peek().t === 'char' && this.peek().v === "'") { this.next(); primes++; }
            pn = primes === 1 ? '\u2032' : primes === 2 ? '\u2033' : primes === 3 ? '\u2034' : U.repeat('\u2032', primes);
            scriptsNode();
            if (!sc.sup) { sc.sup = AST.row([]); }
            sc.sup.items.unshift(AST.symbol(pn, 'ord'));
            continue;
        }
        if (tok.t !== '^' && tok.t !== '_') { break; }
        this.next();
        arg = this.parseScriptArg(tok);
        /* Limits attach directly to large operators and limit-style functions */
        if (base.type === 'bigop' && !sc) {
            if (tok.t === '_') { base.lower = base.lower ? this.nestScript(base.lower, arg, '_') : arg; }
            else { base.upper = base.upper ? this.nestScript(base.upper, arg, '^') : arg; }
            continue;
        }
        if (base.type === 'func' && base.limits && tok.t === '_' && !sc && !base.lower) { base.lower = arg; continue; }
        if (base.type === 'accent' && !sc && !base.label &&
            ((base.accent === 'overbrace' && tok.t === '^') || (base.accent === 'underbrace' && tok.t === '_'))) {
            base.label = arg;
            continue;
        }
        scriptsNode();
        if (tok.t === '^') {
            if (!sc.sup) { sc.sup = arg; }
            else if (!supFromCaret) { sc.sup.items = sc.sup.items.concat(arg.items); }
            else { sc.sup = this.nestScript(sc.sup, arg, '^'); }
            supFromCaret = true;
        } else {
            sc.sub = sc.sub ? this.nestScript(sc.sub, arg, '_') : arg;
        }
    }
    if (base.fromPrescript) { delete base.fromPrescript; }
    return sc || base;
};
/* Right-associative nesting: x^a^b -> x^{a^{b}} */
Parser.prototype.nestScript = function (existing, arg, which) {
    var items = existing.items, lastItem, inner;
    if (items.length === 1 && items[0].type === 'scripts' && !(which === '^' ? items[0].sup : items[0].sub)) {
        if (which === '^') { items[0].sup = arg; } else { items[0].sub = arg; }
        return existing;
    }
    if (items.length === 1 && items[0].type === 'scripts') {
        inner = items[0];
        if (which === '^') { inner.sup = this.nestScript(inner.sup, arg, which); } else { inner.sub = this.nestScript(inner.sub, arg, which); }
        return existing;
    }
    lastItem = AST.scripts(AST.row(items), which === '^' ? arg : null, which === '_' ? arg : null);
    return AST.row([lastItem]);
};

/* Script argument: a braced group, or exactly one primary (whole numbers). */
Parser.prototype.parseScriptArg = function (opTok) {
    var tok = this.peek(), p;
    if (tok.t === 'eof' || tok.t === '}' || tok.t === '&' || tok.t === 'nl') { this.error('Missing script after "' + opTok.v + '"', tok); }
    if (tok.t === '{') { return this.parseGroup(); }
    if (tok.t === '^' || tok.t === '_') { this.error('Missing script after "' + opTok.v + '"', tok); }
    p = this.parsePrimary({ single: true });
    if (p === null) { this.error('Missing script after "' + opTok.v + '"', tok); }
    return p.type === 'row' ? p : AST.row([p]);
};

/* Command argument: braced group or exactly one token (TeX: \frac12 = 1/2). */
Parser.prototype.parseArg = function (cmdTok, what) {
    var tok = this.peek(), p, first;
    if (tok.t === '{') { return this.parseGroup(); }
    if (tok.t === 'eof' || tok.t === '}' || tok.t === '&' || tok.t === 'nl' || tok.t === '^' || tok.t === '_') {
        this.error('Missing ' + (what || 'argument') + ' for \\' + cmdTok.v, tok);
    }
    if (tok.t === 'num' && tok.v.length > 1) {
        first = tok.v.charAt(0);
        tok.v = tok.v.substring(1);
        tok.pos++;
        return AST.row([AST.number(first)]);
    }
    p = this.parsePrimary({ single: true });
    if (p === null) { this.error('Missing ' + (what || 'argument') + ' for \\' + cmdTok.v, tok); }
    return p.type === 'row' ? p : AST.row([p]);
};
Parser.prototype.parseGroup = function () {
    var open = this.expect('{', '"{"'), row;
    this.enter(open);
    row = this.parseRow({});
    if (this.peek().t !== '}') {
        var t = this.peek();
        if (t.t === 'cmd' && t.v === 'right') { this.error('\\right without a matching \\left inside a group', t); }
        if (t.t === 'cmd' && (t.v === 'end' || t.v === 'end*')) { this.error('Missing closing "}" before \\end', t); }
        this.error('Missing closing brace "}" (opened at character ' + (open.pos + 1) + ')', t);
    }
    this.next();
    this.leave();
    return row;
};
Parser.prototype.parseOptional = function () {
    var tok = this.peek(), row;
    if (!(tok.t === 'char' && tok.v === '[')) { return null; }
    this.next();
    row = this.parseRow({ bracket: true });
    if (!(this.peek().t === 'char' && this.peek().v === ']')) { this.error('Missing closing "]" (opened at character ' + (tok.pos + 1) + ')', this.peek()); }
    this.next();
    return row;
};

/* ---- Delimiter helpers ------------------------------------------------------ */
Parser.prototype.tokenChar = function (tok) {
    if (tok.t === 'char') { return tok.v; }
    if (tok.t === 'cmd') {
        if (U.has(MathData.ESCAPES, tok.v)) { return MathData.ESCAPES[tok.v][0]; }
        if (U.has(MathData.CMD, tok.v)) { return MathData.CMD[tok.v][0]; }
    }
    return null;
};
Parser.prototype.isCloser = function (tok, closer) {
    var ch = this.tokenChar(tok);
    if (ch === null || ch !== closer) { return false; }
    if (tok.t === 'cmd' && tok.v === '{') { return false; }
    return true;
};
Parser.prototype.tryFence = function (tok, openCh) {
    var closeCh = MathData.AUTO_PAIRS[openCh], save = this.i, body, key = String(tok.pos);
    if (!this.opts.autoFence || !closeCh || this.failedFence[key]) { return null; }
    this.next();
    try {
        body = this.parseRow({ closer: closeCh });
    } catch (e) {
        this.i = save;
        this.failedFence[key] = true;
        return null;
    }
    if (this.isCloser(this.peek(), closeCh)) {
        this.next();
        return AST.fenced(openCh, closeCh, body, false);
    }
    this.i = save;
    this.failedFence[key] = true;
    return null;
};
Parser.prototype.parseDelim = function (cmdTok) {
    var tok = this.next(), key;
    if (tok.t === 'char') { key = tok.v; }
    else if (tok.t === 'cmd') { key = '\\' + tok.v; }
    else { this.error('Missing delimiter after \\' + cmdTok.v, tok); }
    if (!U.has(MathData.DELIMS, key)) { this.error('"' + key + '" is not a valid delimiter after \\' + cmdTok.v, tok); }
    return MathData.DELIMS[key];
};
Parser.prototype.parseMiddle = function (tok) {
    var d = this.parseDelim(tok);
    var n = AST.delim(d, 0, 'rel');
    n.middle = true;
    return n;
};

/* ---- Primaries -------------------------------------------------------------- */
Parser.prototype.parsePrimary = function (stop) {
    var tok = this.peek(), ch, cls, node, k, run, j, t2, m, f;
    stop = stop || {};
    if (tok.t === '{') { return this.parseGroup(); }
    if (tok.t === 'num') { this.next(); return AST.number(tok.v); }
    if (tok.t === 'cmd') { return this.parseCommand(tok, stop); }
    if (tok.t !== 'char') { this.error('Unexpected input', tok); }
    ch = tok.v;
    /* Letters */
    if (MathData.isLatinLetter(ch)) {
        if (this.opts.smartFuncs && !stop.single) {
            run = ch; j = 1;
            while (true) {
                t2 = this.peek(j);
                if (t2.t === 'char' && !t2.sp && MathData.isLatinLetter(t2.v)) { run += t2.v; j++; } else { break; }
            }
            if (run.length > 1 && U.contains(MathData.BARE_FUNCS, run)) {
                for (k = 0; k < j; k++) { this.next(); }
                f = MathData.FUNCS[run];
                node = AST.func(run, f ? f[0] : run, f ? f[1] : false);
                return node;
            }
        }
        this.next();
        return AST.variable(ch);
    }
    /* Smart multi-character operators (->, <=, !=, ...) */
    if (this.opts.smartOps) {
        for (k = 0; k < MathData.SMART_OPS.length; k++) {
            m = MathData.SMART_OPS[k];
            if (this.matchChars(m[0])) {
                for (j = 0; j < m[0].length; j++) { this.next(); }
                return AST.operator(m[1], m[2]);
            }
        }
    }
    /* Auto-fenced brackets */
    if (U.has(MathData.AUTO_PAIRS, ch) && !stop.single) {
        node = this.tryFence(tok, ch);
        if (node) { return node; }
    }
    this.next();
    if (ch === "'") { return AST.symbol('\u2032', 'ord'); }
    if (ch === '%') { return AST.symbol('%', 'ord'); }
    if (ch === '#' || ch === '$') { return AST.symbol(ch, 'ord'); }
    if (U.has(MathData.ASCII_OPS, ch)) {
        m = MathData.ASCII_OPS[ch];
        return (m[1] === 'ord') ? AST.symbol(m[0], 'ord') : AST.operator(m[0], m[1]);
    }
    if (MathData.isGreek(ch)) { return AST.variable(ch); }
    if (MathData.INTEGRAL_CHARS.indexOf(ch) >= 0 || ch === '\u2211' || ch === '\u220F' || ch === '\u2210' ||
        ch === '\u22C3' || ch === '\u22C2' || ch === '\u2A01' || ch === '\u2A02') {
        return AST.bigop(MathData.CHAR_TO_CMD[ch] || 'sum', ch, 'auto');
    }
    cls = U.has(MathData.CHAR_CLASS, ch) ? MathData.CHAR_CLASS[ch] : 'ord';
    if (cls === 'ord') { return AST.symbol(ch, 'ord'); }
    return AST.operator(ch, cls);
};
Parser.prototype.matchChars = function (seq) {
    var j, t, prevEnd = -1;
    for (j = 0; j < seq.length; j++) {
        t = this.peek(j);
        if (t.t !== 'char' || t.v !== seq.charAt(j)) { return false; }
        if (j > 0 && t.pos !== prevEnd) { return false; }
        prevEnd = t.end;
    }
    return true;
};

Parser.prototype.parseCommand = function (tok, stop) {
    var name = tok.v, node, a, b, idx, d1, d2, body, e, m, sz, color, n, varName, order;
    /* spacing */
    if (U.has(MathData.SPACES, name)) { this.next(); return AST.space(MathData.SPACES[name]); }
    if (U.has(MathData.ESCAPES, name)) {
        e = MathData.ESCAPES[name];
        if (name === '{' && !stop.single) { node = this.tryFence(tok, '{'); if (node) { return node; } }
        this.next();
        return e[1] === 'ord' ? AST.symbol(e[0], 'ord') : AST.operator(e[0], e[1]);
    }
    switch (name) {
    case 'frac': case 'dfrac': case 'tfrac': case 'cfrac':
        this.next();
        a = this.parseArg(tok, 'numerator');
        b = this.parseArg(tok, 'denominator');
        return AST.frac(a, b, name);
    case 'binom': case 'dbinom': case 'tbinom': case 'choose':
        this.next();
        a = this.parseArg(tok, 'top');
        b = this.parseArg(tok, 'bottom');
        return AST.binom(a, b, name === 'choose' ? 'binom' : name);
    case 'sqrt':
        this.next();
        idx = this.parseOptional();
        body = this.parseArg(tok, 'radicand');
        return AST.root(body, idx);
    case 'left':
        this.next();
        d1 = this.parseDelim(tok);
        this.enter(tok);
        body = this.parseRow({});
        this.leave();
        if (!(this.peek().t === 'cmd' && this.peek().v === 'right')) { this.error('Missing \\right to close \\left (opened at character ' + (tok.pos + 1) + ')', this.peek()); }
        var rt = this.next();
        d2 = this.parseDelim(rt);
        return AST.fenced(d1, d2, body, true);
    case 'right':
        this.error('\\right without a matching \\left', tok);
        break;
    case 'big': case 'Big': case 'bigg': case 'Bigg': case 'bigl': case 'Bigl': case 'biggl': case 'Biggl':
    case 'bigr': case 'Bigr': case 'biggr': case 'Biggr': case 'bigm': case 'Bigm': case 'biggm': case 'Biggm':
        this.next();
        d1 = this.parseDelim(tok);
        sz = /^bigg/i.test(name) ? (name.charAt(0) === 'B' ? 3.0 : 2.4) : (name.charAt(0) === 'B' ? 1.8 : 1.2);
        m = name.charAt(name.length - 1);
        n = AST.delim(d1, sz, m === 'l' ? 'open' : m === 'r' ? 'close' : m === 'm' ? 'rel' : (U.has(MathData.AUTO_PAIRS, d1) ? 'open' : (U.has(MathData.CHAR_CLASS, d1) && MathData.CHAR_CLASS[d1] === 'close') || d1 === ')' || d1 === ']' ? 'close' : 'ord'));
        n.cmd = name;
        return n;
    case 'operatorname': case 'operatorname*':
        this.next();
        node = AST.func(tok.raw, tok.raw, name === 'operatorname*');
        node.custom = true;
        return node;
    case 'ce': case 'pu':
        this.next();
        return Chem.parseCe(tok.raw, tok.rawPos);
    case 'color':
        this.next();
        color = U.normalizeColor(tok.raw);
        if (!color) { this.error('Unknown color "' + tok.raw + '"', tok); }
        body = this.parseArg(tok, 'colored content');
        return Parser.applyStyle(body, { color: color });
    case 'textcolor':
        this.next();
        color = U.normalizeColor(tok.raw);
        if (!color) { this.error('Unknown color "' + tok.raw + '"', tok); }
        body = this.parseArg(tok, 'colored content');
        return Parser.applyStyle(body, { color: color });
    case 'style':
        this.next();
        body = this.parseArg(tok, 'styled content');
        return Parser.applyStyle(body, Parser.parseStyleSpec(tok.raw, tok));
    case 'begin': case 'begin*':
        this.next();
        return this.parseEnvironment(tok);
    case 'end': case 'end*':
        this.error('\\end{' + tok.raw + '} without a matching \\begin', tok);
        break;
    case 'tag':
        this.next();
        this.pendingTag = Parser.parseRow(tok.raw, this.opts);
        return null;
    case 'notag': case 'nonumber':
        this.next();
        this.pendingNoTag = true;
        return null;
    case 'label':
        this.next();
        this.warn('\\label{' + tok.raw + '} has no effect in Illustrator and was ignored', tok);
        return null;
    case 'displaystyle': case 'textstyle': case 'scriptstyle': case 'scriptscriptstyle': case 'mathstrut': case 'strut':
    case 'nolinebreak': case 'allowbreak': case 'hline': case 'cr':
        this.next();
        this.warn('\\' + name + ' is not needed here and was ignored (use \\dfrac / \\tfrac to control fraction size)', tok);
        return null;
    case 'not':
        this.next();
        a = this.peek();
        e = this.tokenChar(a);
        if (e !== null) {
            this.next();
            if (U.has(MathData.NEGATIONS, e)) { return AST.operator(MathData.NEGATIONS[e], 'rel'); }
            return AST.operator(e + '\u0338', 'rel');
        }
        return AST.operator('/', 'rel');
    case 'dv': case 'pdv': case 'odv': case 'diff':
        this.next();
        return this.parseDerivative(tok);
    case 'abs': case 'norm': case 'floor': case 'ceil': case 'set': case 'bra': case 'ket': case 'braket':
    case 'paren': case 'brack': case 'angle_': case 'expval':
        this.next();
        a = this.parseArg(tok, 'content');
        if (name === 'abs') { return AST.fenced('|', '|', a, true); }
        if (name === 'norm') { return AST.fenced('\u2016', '\u2016', a, true); }
        if (name === 'floor') { return AST.fenced('\u230A', '\u230B', a, true); }
        if (name === 'ceil') { return AST.fenced('\u2308', '\u2309', a, true); }
        if (name === 'set') { return AST.fenced('{', '}', a, true); }
        if (name === 'bra') { return AST.fenced('\u27E8', '|', a, true); }
        if (name === 'ket') { return AST.fenced('|', '\u27E9', a, true); }
        if (name === 'expval') { return AST.fenced('\u27E8', '\u27E9', a, true); }
        if (name === 'paren') { return AST.fenced('(', ')', a, true); }
        if (name === 'brack') { return AST.fenced('[', ']', a, true); }
        b = this.parseArg(tok, 'second content');
        return AST.fenced('\u27E8', '\u27E9', AST.row(a.items.concat([AST.symbol('|', 'ord')], b.items)), true);
    case 'pmod':
        this.next();
        a = this.parseArg(tok, 'modulus');
        return AST.row([AST.space(1), AST.fenced('(', ')', AST.row([AST.func('mod', 'mod', false)].concat(a.items)), false)]);
    case 'sci':
        this.next();
        a = this.parseArg(tok, 'mantissa');
        b = this.parseArg(tok, 'exponent');
        n = AST.row(a.items.concat([AST.operator('\u00D7', 'bin'), AST.scripts(AST.row([AST.number('10')]), b, null)]));
        n.meta = { role: 'scientific' };
        return n;
    case 'hspace': case 'hspace*':
        this.next();
        m = /^\s*(-?[0-9]*\.?[0-9]+)\s*(em|ex|mu|pt|mm)\s*$/.exec(tok.raw);
        if (!m) { this.error('Invalid \\hspace size "' + tok.raw + '" (use em, ex, mu, pt or mm)', tok); }
        a = parseFloat(m[1]);
        return AST.space(m[2] === 'em' ? a : m[2] === 'ex' ? a * 0.45 : m[2] === 'mu' ? a / 18 : m[2] === 'pt' ? a / 10 : a / 3.5);
    case 'prescript':
        this.next();
        a = this.parseArg(tok, 'left superscript');
        b = this.parseArg(tok, 'left subscript');
        body = this.parseArg(tok, 'base');
        n = AST.scripts(body, null, null);
        n.presup = a.items.length ? a : null;
        n.presub = b.items.length ? b : null;
        n.fromPrescript = true;
        return n;
    case 'overset': case 'underset': case 'stackrel':
        this.next();
        a = this.parseArg(tok, 'annotation');
        b = this.parseArg(tok, 'base');
        if (name === 'underset') {
            if (b.items.length === 1 && b.items[0].type === 'stack' && b.items[0].over && !b.items[0].under) {
                b.items[0].under = a;
                return b.items[0];
            }
            return AST.stack(b, null, a);
        }
        return AST.stack(b, a, null);
    case 'boxed': case 'fbox':
        this.next();
        return AST.boxed(this.parseArg(tok, 'content'));
    case 'phantom': case 'hphantom': case 'vphantom':
        this.next();
        n = AST.font('phantom', this.parseArg(tok, 'content'));
        return n;
    case 'mathop':
        this.next();
        a = this.parseArg(tok, 'operator');
        node = AST.func(Serializer.plainText(a), Serializer.plainText(a), true);
        node.custom = true;
        return node;
    }
    /* large operators */
    if (U.has(MathData.BIGOPS, name)) { this.next(); return AST.bigop(name, MathData.BIGOPS[name][0], 'auto'); }
    /* functions */
    if (U.has(MathData.FUNCS, name)) {
        this.next();
        m = MathData.FUNCS[name];
        return AST.func(name, m[0], m[1]);
    }
    /* font variants */
    if (U.has(MathData.FONTS, name)) {
        this.next();
        return AST.font(MathData.FONTS[name], this.parseArg(tok, 'content'));
    }
    /* text */
    if (U.has(MathData.TEXT_CMDS, name)) {
        this.next();
        return AST.text(Parser.unescapeText(tok.raw), name === 'textbf' ? 'bf' : name === 'textit' ? 'it' : 'text');
    }
    /* accents */
    if (U.has(MathData.ACCENTS, name)) {
        this.next();
        return AST.accent(MathData.ACCENTS[name], this.parseArg(tok, 'content'));
    }
    /* extensible arrows */
    if (U.has(Parser.XARROWS, name)) {
        this.next();
        b = this.parseOptional();
        a = this.parseArg(tok, 'label');
        return AST.xarrow(Parser.XARROWS[name], a.items.length ? a : null, (b && b.items.length) ? b : null);
    }
    /* plain symbols */
    if (U.has(MathData.CMD, name)) {
        e = MathData.CMD[name];
        if ((e[1] === 'open') && !stop.single) {
            node = this.tryFence(tok, e[0]);
            if (node) { return node; }
        }
        this.next();
        if (MathData.isGreek(e[0]) && e[1] === 'ord' && name !== 'ohm' && name !== 'increment') { return AST.variable(e[0]); }
        if (e[1] === 'ord') { return AST.symbol(e[0], 'ord'); }
        return AST.operator(e[0], e[1]);
    }
    this.error('Unknown command \\' + name, tok);
};

Parser.XARROWS = {
    xrightarrow: 'right', xleftarrow: 'left', xleftrightarrow: 'leftright', xrightleftharpoons: 'equilibrium',
    xleftrightharpoons: 'equilibriumrev', xRightarrow: 'Right', xLeftarrow: 'Left', xLeftrightarrow: 'Leftright',
    xmapsto: 'mapsto', xrightleftarrows: 'rightleftarrows', xlongequal: 'equal', xlongrightarrow: 'right',
    xlongleftarrow: 'left'
};
Parser.XARROW_COMMAND = {};
(function () { for (var k in Parser.XARROWS) { if (U.has(Parser.XARROWS, k) && !U.has(Parser.XARROW_COMMAND, Parser.XARROWS[k])) { Parser.XARROW_COMMAND[Parser.XARROWS[k]] = k; } } }());

/* \dv[n]{f}{x}, \dv{x}, \pdv{f}{x}, \pdv{f}{x}{y}, \pdv[n]{f}{x} */
Parser.prototype.parseDerivative = function (tok) {
    var partial = (tok.v === 'pdv'), orderRow = this.parseOptional(), a, b, c = null, dSym, num, den, order, fr;
    a = this.parseArg(tok, 'function or variable');
    if (this.peek().t === '{') { b = this.parseGroup(); }
    if (b && partial && this.peek().t === '{') { c = this.parseGroup(); }
    function d() { return partial ? AST.symbol('\u2202', 'ord') : AST.font('rm', AST.row([AST.variable('d')])); }
    function pow(node, o) { return o ? AST.scripts(AST.row([node]), AST.clone(o), null) : node; }
    order = (orderRow && orderRow.items.length) ? orderRow : null;
    if (!b) {
        /* operator form: d/dx */
        num = AST.row([pow(d(), order)]);
        den = AST.row([d()].concat(order ? [AST.scripts(a, AST.clone(order), null)] : a.items));
    } else if (c) {
        num = AST.row([AST.scripts(AST.row([d()]), AST.row([AST.number('2')]), null)].concat(a.items));
        den = AST.row([d()].concat(b.items, [AST.space(3 / 18), d()], c.items));
    } else {
        num = AST.row([pow(d(), order)].concat(a.items));
        den = AST.row([d()].concat(order ? [AST.scripts(b, AST.clone(order), null)] : b.items));
    }
    fr = AST.frac(num, den, 'frac');
    fr.meta = { role: 'derivative' };
    return fr;
};

/* Environments: matrices, cases, aligned / multiline */
Parser.prototype.parseEnvironment = function (tok) {
    var env = tok.raw, rows = [], cells = [], t, isLines = U.has(MathData.LINE_ENVS, env), lines, i, maxc, node, colspec, cell;
    if (!U.has(MathData.MATRIX_ENVS, env) && !isLines) { this.error('Unknown environment "' + env + '"', tok); }
    var savedTag = this.pendingTag, savedNoTag = this.pendingNoTag;
    this.pendingTag = null;
    this.pendingNoTag = false;
    this.enter(tok);
    while (true) {
        cell = this.parseRow({ amp: true, nl: true });
        cells.push(cell);
        t = this.peek();
        if (t.t === '&') { this.next(); continue; }
        if (t.t === 'nl') {
            this.next();
            rows.push(isLines ? this.finishLine(cells) : cells);
            cells = [];
            continue;
        }
        if (t.t === 'cmd' && (t.v === 'end' || t.v === 'end*')) {
            if (t.raw !== env) { this.error('\\begin{' + env + '} is closed by \\end{' + t.raw + '}', t); }
            this.next();
            break;
        }
        if (t.t === 'eof') { this.error('Missing \\end{' + env + '} (environment opened at character ' + (tok.pos + 1) + ')', t); }
        if (t.t === '}') { this.error('Unexpected "}" inside environment ' + env, t); }
        this.error('Unexpected input inside environment ' + env, t);
    }
    this.leave();
    /* last row (ignore a trailing empty row created by a final \\) */
    if (!(cells.length === 1 && !cells[0].items.length && rows.length && !this.pendingTag)) {
        rows.push(isLines ? this.finishLine(cells) : cells);
    }
    this.pendingTag = savedTag;
    this.pendingNoTag = savedNoTag;
    if (isLines) {
        lines = AST.lines(env, rows);
        return lines;
    }
    maxc = 1;
    for (i = 0; i < rows.length; i++) { if (rows[i].length > maxc) { maxc = rows[i].length; } }
    for (i = 0; i < rows.length; i++) { while (rows[i].length < maxc) { rows[i].push(AST.row([])); } }
    colspec = '';
    if (env === 'array' || env === 'subarray') {
        colspec = String(tok.raw2 || '').replace(/\s+/g, '');
        if (!/^[lcr|]*$/.test(colspec)) { this.error('Unsupported array column specification "' + colspec + '" (use l, c, r and |)', tok); }
    }
    node = AST.matrix(env === 'dcases' ? 'cases' : env, rows, colspec);
    return node;
};

/* Apply a style to a parsed body: single item -> style the item itself. */
Parser.applyStyle = function (body, style) {
    var target = (body.items.length === 1) ? body.items[0] : body;
    target.style = U.extend(target.style || {}, style);
    return target;
};
/* \style{color=#FF0000;bold;italic=false;font=Arial;scale=1.2;dy=0.1} */
Parser.parseStyleSpec = function (spec, tok) {
    var parts = String(spec).split(';'), st = {}, i, kv, k, v, c;
    for (i = 0; i < parts.length; i++) {
        kv = U.trim(parts[i]);
        if (!kv) { continue; }
        k = U.lower(U.trim(kv.split('=')[0]));
        v = kv.indexOf('=') >= 0 ? U.trim(kv.substring(kv.indexOf('=') + 1)) : 'true';
        if (k === 'color') {
            c = U.normalizeColor(v);
            if (!c) { throw new MathError(ErrorKind.PARSER, 'Invalid color "' + v + '" in \\style', '', tok.pos); }
            st.color = c;
        } else if (k === 'bold' || k === 'italic') {
            st[k] = (v !== 'false' && v !== '0' && v !== 'no');
        } else if (k === 'font') {
            st.font = v;
        } else if (k === 'scale' || k === 'dy') {
            c = parseFloat(v);
            if (!U.isNumber(c) || (k === 'scale' && (c <= 0 || c > 10)) || (k === 'dy' && Math.abs(c) > 10)) {
                throw new MathError(ErrorKind.PARSER, 'Invalid ' + k + ' value "' + v + '" in \\style', '', tok.pos);
            }
            st[k] = c;
        } else {
            throw new MathError(ErrorKind.PARSER, 'Unknown style property "' + k + '" (use color, bold, italic, font, scale, dy)', '', tok.pos);
        }
    }
    return st;
};
Parser.unescapeText = function (t) {
    return String(t).replace(/\\([{}#$%&_ ])/g, '$1').replace(/\\textbackslash(\{\})?/g, '\\').replace(/~/g, '\u00A0');
};

/* ---- 23_serializer.jsx ---- */
/* ==========================================================================
 * Module 23 - Serialization
 *   Serializer.toLatex(root)      canonical direct-input syntax (round-trips)
 *   Serializer.plainText(node)    linear Unicode text (display / search)
 *   Serializer.toSingleText(root) runs for a single Illustrator text object,
 *                                 or {ok:false, reason} when not representable
 * ========================================================================== */
var Serializer = {};

Serializer.ACCENT_COMMAND = {};
(function () {
    var k;
    for (k in MathData.ACCENTS) {
        if (U.has(MathData.ACCENTS, k) && !U.has(Serializer.ACCENT_COMMAND, MathData.ACCENTS[k])) {
            Serializer.ACCENT_COMMAND[MathData.ACCENTS[k]] = k;
        }
    }
    Serializer.ACCENT_COMMAND.arc = 'overarc';
}());
Serializer.TEXT_ESCAPE = function (t) {
    return String(t).replace(/\\/g, '\\textbackslash{}').replace(/([{}#$%&_])/g, '\\$1');
};
Serializer.charLatex = function (ch) {
    if (ch === '{') { return '\\{'; }
    if (ch === '}') { return '\\}'; }
    if (ch === '#' || ch === '$' || ch === '%' || ch === '&' || ch === '_') { return '\\' + ch; }
    if (ch === '\\') { return '\\backslash'; }
    if (ch === '\u2212') { return '-'; }
    if (ch === '\u2217') { return '*'; }
    if (ch === '\u2016') { return '\\Vert'; }
    if (ch === '~') { return '\\sim'; }
    if (ch === '^') { return '\\hat{}'; }
    if (ch === "'") { return '\\prime'; }
    if (ch === '\u2032') { return '\\prime'; }
    if (U.has(MathData.CHAR_TO_CMD, ch)) { return '\\' + MathData.CHAR_TO_CMD[ch]; }
    return ch;
};
Serializer.delimLatex = function (d) {
    return U.has(MathData.DELIM_TO_LATEX, d) ? MathData.DELIM_TO_LATEX[d] : Serializer.charLatex(d);
};
Serializer.styleSpec = function (st) {
    var parts = [];
    if (st.color) { parts.push('color=' + st.color); }
    if (st.bold !== undefined && st.bold !== null) { parts.push(st.bold ? 'bold' : 'bold=false'); }
    if (st.italic !== undefined && st.italic !== null) { parts.push(st.italic ? 'italic' : 'italic=false'); }
    if (st.font) { parts.push('font=' + String(st.font).replace(/[;{}]/g, '')); }
    if (U.isNumber(st.scale) && st.scale !== 1) { parts.push('scale=' + U.round(st.scale, 4)); }
    if (U.isNumber(st.dy) && st.dy !== 0) { parts.push('dy=' + U.round(st.dy, 4)); }
    return parts.join(';');
};
Serializer.hasStyle = function (n) {
    var s = n.style;
    return !!(s && (s.color || (s.bold !== undefined && s.bold !== null) || (s.italic !== undefined && s.italic !== null) ||
        s.font || (U.isNumber(s.scale) && s.scale !== 1) || (U.isNumber(s.dy) && s.dy !== 0)));
};

Serializer.toLatex = function (root) {
    if (!root) { return ''; }
    if (root.type === 'row') {
        if (root.items.length === 1 && root.items[0].type === 'lines' && root.items[0].env === 'implicit' && !Serializer.hasStyle(root)) {
            return Serializer.linesBody(root.items[0], true);
        }
        return Serializer.wrapStyle(root, Serializer.rowContent(root));
    }
    return Serializer.node(root);
};
Serializer.wrapStyle = function (n, inner) {
    var s;
    if (!Serializer.hasStyle(n)) { return inner; }
    s = n.style;
    if (s.color && U.keys(s).length === 1) { return '\\color{' + s.color + '}{' + inner + '}'; }
    return '\\style{' + Serializer.styleSpec(s) + '}{' + inner + '}';
};
Serializer.group = function (row) {
    if (!row) { return '{}'; }
    if (Serializer.hasStyle(row)) { return '{' + Serializer.wrapStyle(row, Serializer.rowContent(row)) + '}'; }
    return '{' + Serializer.rowContent(row) + '}';
};

/* Join row pieces, inserting spaces only where re-lexing would change meaning. */
Serializer.rowContent = function (row) {
    var pieces = [], i, out = '', p, prev, needSpace, breaks = {};
    for (i = 0; i < row.items.length; i++) { pieces.push(Serializer.node(row.items[i])); }
    Serializer.markFunctionBreaks(pieces, breaks);
    for (i = 0; i < pieces.length; i++) {
        p = pieces[i];
        if (p === '') { continue; }
        needSpace = false;
        if (out !== '') {
            prev = out;
            if (/\\[A-Za-z]+\*?$/.test(prev) && /^[A-Za-z]/.test(p)) { needSpace = true; }
            else if (/[0-9.]$/.test(prev) && /^[0-9.]/.test(p)) { needSpace = true; }
            else if (/[<>\-+=!~.]$/.test(prev) && /^[<>\-+=!~.]/.test(p)) { needSpace = true; }
            else if (/\\$/.test(prev)) { needSpace = true; }
            else if (breaks[i]) { needSpace = true; }
        }
        out += (needSpace ? ' ' : '') + p;
    }
    return out;
};
/* Runs of bare letters that would be re-read as a function name (s i n -> sin)
   are split with a space. Only suffixes matter because the parser scans a run
   from each letter to the end of the run. */
Serializer.markFunctionBreaks = function (pieces, breaks) {
    var i = 0, runStart, j, letters, offs, k, sfx, end;
    function endsBare(p) { return /[A-Za-z]$/.test(p) && !/\\[A-Za-z]+\*?$/.test(p); }
    function lead(p) { var m = /^[A-Za-z]+/.exec(p); return m ? m[0] : ''; }
    while (i < pieces.length) {
        if (!endsBare(pieces[i])) { i++; continue; }
        runStart = i;
        j = i;
        while (j + 1 < pieces.length && endsBare(pieces[j]) && lead(pieces[j + 1]) && lead(pieces[j + 1]) === pieces[j + 1]) { j++; }
        if (j + 1 < pieces.length && endsBare(pieces[j]) && lead(pieces[j + 1])) { j++; }
        if (j === runStart) { i++; continue; }
        /* letters and piece offsets of this run */
        letters = '';
        offs = [];
        for (k = runStart; k <= j; k++) {
            offs.push(letters.length);
            if (k === runStart) { letters += /[A-Za-z]+$/.exec(pieces[k])[0]; offs[0] = 0; }
            else { letters += lead(pieces[k]); }
        }
        end = letters.length;
        for (k = j; k > runStart; k--) {
            /* check every suffix starting at piece k's first letter, up to the current end */
            sfx = letters.substring(offs[k - runStart], end);
            if (sfx.length > 1 && U.contains(MathData.BARE_FUNCS, sfx)) { breaks[k] = true; end = offs[k - runStart]; }
            else if (k - 1 >= runStart) {
                var startPrev = (k - 1 === runStart) ? 0 : offs[k - 1 - runStart];
                var s2 = letters.substring(startPrev, end);
                if (s2.length > 1 && U.contains(MathData.BARE_FUNCS, s2)) { breaks[k] = true; end = offs[k - runStart]; }
            }
        }
        i = j + 1;
    }
};

Serializer.canBeBareBase = function (n) {
    if (Serializer.hasStyle(n)) { return true; }
    switch (n.type) {
    case 'scripts': case 'bigop': case 'lines': case 'space': return false;
    case 'func': return !n.limits;
    case 'accent': return !(n.accent === 'overbrace' || n.accent === 'underbrace');
    case 'row': return false;
    case 'operator': case 'symbol': return !(n.text === '\u2032' || n.text === '\u2033' || n.text === '\u2034' || n.text === "'");
    default: return true;
    }
};
Serializer.primeCount = function (row) {
    var i, t, c = 0, j;
    for (i = 0; i < row.items.length; i++) {
        t = row.items[i];
        if (t.type !== 'symbol' || Serializer.hasStyle(t)) { break; }
        if (/^\u2032+$/.test(t.text)) { c += t.text.length; }
        else if (t.text === '\u2033') { c += 2; }
        else if (t.text === '\u2034') { c += 3; }
        else { break; }
    }
    j = i;
    return { count: c, items: j };
};
Serializer.supLatex = function (sup) {
    var pc = Serializer.primeCount(sup), rest;
    if (pc.items > 0 && pc.items === 1 && !Serializer.hasStyle(sup)) {
        if (sup.items.length === 1) { return U.repeat("'", pc.count); }
        rest = AST.row(sup.items.slice(1));
        return U.repeat("'", pc.count) + '^' + Serializer.group(rest);
    }
    return '^' + Serializer.group(sup);
};

Serializer.node = function (n) {
    return Serializer.wrapStyle(n, Serializer.nodeInner(n));
};
Serializer.nodeInner = function (n) {
    var s, i, r, c, rows, base, d, cmd, k;
    switch (n.type) {
    case 'row':
        return Serializer.group(AST.row(n.items));
    case 'number':
        return n.text;
    case 'variable':
        return Serializer.charLatex(n.text);
    case 'operator': case 'symbol':
        return Serializer.charLatex(n.text);
    case 'func':
        if (n.custom || !U.has(MathData.FUNCS, n.name)) { s = '\\operatorname' + (n.limits ? '*' : '') + '{' + n.name + '}'; }
        else {
            s = '\\' + n.name;
            if (n.limits !== MathData.FUNCS[n.name][1]) { s += n.limits ? '\\limits' : '\\nolimits'; }
        }
        if (n.lower) { s += '_' + Serializer.group(n.lower); }
        return s;
    case 'text':
        cmd = n.variant === 'bf' ? 'textbf' : n.variant === 'it' ? 'textit' : 'text';
        return '\\' + cmd + '{' + Serializer.TEXT_ESCAPE(n.text) + '}';
    case 'space':
        for (k in MathData.SPACES) {
            if (U.has(MathData.SPACES, k) && Math.abs(MathData.SPACES[k] - n.width) < 1e-6 && k !== '>' && k !== 'thinspace' &&
                k !== 'medspace' && k !== 'thickspace' && k !== 'negthinspace') {
                return (k.length === 1) ? '\\' + k : '\\' + k + ' ';
            }
        }
        return '\\hspace{' + U.round(n.width, 4) + 'em}';
    case 'frac':
        return '\\' + (n.mode || 'frac') + Serializer.group(n.num) + Serializer.group(n.den);
    case 'binom':
        return '\\' + (n.mode || 'binom') + Serializer.group(n.top) + Serializer.group(n.bottom);
    case 'root':
        s = '\\sqrt';
        if (n.index) { s += '[' + (Serializer.rowContent(n.index).indexOf(']') >= 0 ? Serializer.group(n.index) : Serializer.wrapStyle(n.index, Serializer.rowContent(n.index))) + ']'; }
        return s + Serializer.group(n.body);
    case 'scripts':
        if (n.presup || n.presub) {
            base = '\\prescript' + Serializer.group(n.presup || AST.row()) + Serializer.group(n.presub || AST.row()) + Serializer.group(n.base);
        } else if (n.base.items.length === 1 && !Serializer.hasStyle(n.base) && Serializer.canBeBareBase(n.base.items[0])) {
            base = Serializer.node(n.base.items[0]);
        } else {
            base = Serializer.group(n.base);
        }
        s = base;
        if (n.sub) { s += '_' + Serializer.group(n.sub); }
        if (n.sup) { s += Serializer.supLatex(n.sup); }
        return s;
    case 'fenced':
        if (!n.explicit && MathData.AUTO_PAIRS[n.left] === n.right) {
            return Serializer.delimLatex(n.left) + (n.left === '{' ? ' ' : '') + Serializer.rowContent(n.body) + (n.left === '{' ? ' ' : '') + Serializer.delimLatex(n.right);
        }
        return '\\left' + Serializer.delimLatex(n.left) + ' ' + Serializer.rowContent(n.body) + ' \\right' + Serializer.delimLatex(n.right);
    case 'matrix':
        rows = [];
        for (r = 0; r < n.rows.length; r++) {
            c = [];
            for (i = 0; i < n.rows[r].length; i++) { c.push(Serializer.wrapStyle(n.rows[r][i], Serializer.rowContent(n.rows[r][i]))); }
            rows.push(c.join(' & '));
        }
        return '\\begin{' + n.env + '}' + ((n.env === 'array' || n.env === 'subarray') ? '{' + (n.colspec || U.repeat('c', n.rows[0].length)) + '}' : '') +
            ' ' + rows.join(' \\\\ ') + ' \\end{' + n.env + '}';
    case 'bigop':
        s = '\\' + (U.has(MathData.BIGOPS, n.name) ? n.name : (MathData.CHAR_TO_CMD[n.symbol] || 'sum'));
        if (n.limits === 'limits') { s += '\\limits'; } else if (n.limits === 'nolimits') { s += '\\nolimits'; }
        if (n.lower) { s += '_' + Serializer.group(n.lower); }
        if (n.upper) { s += '^' + Serializer.group(n.upper); }
        return s;
    case 'accent':
        s = '\\' + (Serializer.ACCENT_COMMAND[n.accent] || n.accent) + Serializer.group(n.body);
        if (n.label) { s += (n.accent === 'underbrace' ? '_' : '^') + Serializer.group(n.label); }
        return s;
    case 'font':
        if (n.variant === 'phantom') { return '\\phantom' + Serializer.group(n.body); }
        return '\\' + (MathData.FONT_COMMAND[n.variant] || 'mathrm') + Serializer.group(n.body);
    case 'xarrow':
        s = '\\' + (Parser.XARROW_COMMAND[n.arrow] || 'xrightarrow');
        if (n.under) { s += '[' + Serializer.rowContent(n.under) + ']'; }
        return s + Serializer.group(n.over || AST.row());
    case 'stack':
        if (n.over && n.under) { return '\\underset' + Serializer.group(n.under) + '{\\overset' + Serializer.group(n.over) + Serializer.group(n.base) + '}'; }
        if (n.under) { return '\\underset' + Serializer.group(n.under) + Serializer.group(n.base); }
        return '\\overset' + Serializer.group(n.over || AST.row()) + Serializer.group(n.base);
    case 'boxed':
        return '\\boxed' + Serializer.group(n.body);
    case 'chem':
        return '\\ce{' + n.src + '}';
    case 'lines':
        return Serializer.linesBody(n, false);
    case 'delim':
        d = Serializer.delimLatex(n.text);
        if (n.middle) { return '\\middle' + d; }
        return '\\' + (n.cmd || 'big') + d;
    }
    return '';
};
Serializer.linesBody = function (n, implicit) {
    var rows = [], r, cells, i, row, s;
    for (r = 0; r < n.rows.length; r++) {
        row = n.rows[r];
        cells = [];
        for (i = 0; i < row.cells.length; i++) { cells.push(Serializer.wrapStyle(row.cells[i], Serializer.rowContent(row.cells[i]))); }
        s = cells.join(' & ');
        if (row.tag) { s += ' \\tag{' + Serializer.rowContent(row.tag) + '}'; }
        if (row.notag) { s += ' \\notag'; }
        rows.push(s);
    }
    if (implicit || n.env === 'implicit') { return rows.join(' \\\\ '); }
    return '\\begin{' + n.env + '} ' + rows.join(' \\\\ ') + ' \\end{' + n.env + '}';
};

/* ---- Linear Unicode text ------------------------------------------------- */
Serializer.SUP = { '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3', '4': '\u2074', '5': '\u2075', '6': '\u2076',
    '7': '\u2077', '8': '\u2078', '9': '\u2079', '+': '\u207A', '\u2212': '\u207B', '-': '\u207B', '=': '\u207C', '(': '\u207D',
    ')': '\u207E', 'n': '\u207F' };
Serializer.SUB = { '0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083', '4': '\u2084', '5': '\u2085', '6': '\u2086',
    '7': '\u2087', '8': '\u2088', '9': '\u2089', '+': '\u208A', '\u2212': '\u208B', '-': '\u208B', '=': '\u208C', '(': '\u208D',
    ')': '\u208E' };
Serializer.mapScript = function (text, map) {
    var cps = U.codePoints(text), out = '', i;
    for (i = 0; i < cps.length; i++) { if (!U.has(map, cps[i])) { return null; } out += map[cps[i]]; }
    return out;
};
Serializer.ACCENT_COMBINING = { vec: '\u20D7', hat: '\u0302', widehat: '\u0302', bar: '\u0304', overline: '\u0305',
    underline: '\u0332', dot: '\u0307', ddot: '\u0308', tilde: '\u0303', widetilde: '\u0303', check: '\u030C', breve: '\u0306',
    acute: '\u0301', grave: '\u0300', mathring: '\u030A', overrightarrow: '\u20D7', overleftarrow: '\u20D6', dddot: '\u20DB', arc: '\u0311' };
Serializer.XARROW_CHAR = { right: '\u2192', left: '\u2190', leftright: '\u2194', equilibrium: '\u21CC', equilibriumrev: '\u21CB',
    Right: '\u21D2', Left: '\u21D0', Leftright: '\u21D4', mapsto: '\u21A6', rightleftarrows: '\u21C4', equal: '=' };

Serializer.plainText = function (n) {
    var P = Serializer.plainText, s, i, r, rows, t, m;
    function wrap(row) {
        var x = P(row);
        return (row.items.length > 1) ? '(' + x + ')' : x;
    }
    if (!n) { return ''; }
    switch (n.type) {
    case 'row':
        s = '';
        for (i = 0; i < n.items.length; i++) { s += P(n.items[i]); }
        return s;
    case 'number': case 'variable': case 'symbol': return n.text;
    case 'operator':
        if (n.cls === 'bin' || n.cls === 'rel') { return ' ' + n.text + ' '; }
        if (n.cls === 'punct') { return n.text + ' '; }
        return n.text;
    case 'delim': return n.text;
    case 'func': return n.display + (n.lower ? '_' + wrap(n.lower) : '') + ' ';
    case 'text': return n.text;
    case 'space': return n.width >= 0.2 ? ' ' : '';
    case 'frac': return wrap(n.num) + '/' + wrap(n.den);
    case 'binom': return 'C(' + P(n.top) + ', ' + P(n.bottom) + ')';
    case 'root':
        t = n.index ? (Serializer.mapScript(P(n.index), Serializer.SUP) || ('(' + P(n.index) + ')')) : '';
        if (n.index && P(n.index) === '3') { return '\u221B' + wrap(n.body); }
        if (n.index && P(n.index) === '4') { return '\u221C' + wrap(n.body); }
        return t + '\u221A' + wrap(n.body);
    case 'scripts':
        s = (n.presup ? (Serializer.mapScript(P(n.presup), Serializer.SUP) || '^' + wrap(n.presup)) : '') +
            (n.presub ? (Serializer.mapScript(P(n.presub), Serializer.SUB) || '_' + wrap(n.presub)) : '');
        s += (n.base.items.length > 1 ? '(' + P(n.base) + ')' : P(n.base));
        if (n.sub) { t = P(n.sub); s += Serializer.mapScript(t, Serializer.SUB) || ('_' + wrap(n.sub)); }
        if (n.sup) { t = P(n.sup); s += (/^[\u2032\u2033\u2034]+$/.test(t) ? t : (Serializer.mapScript(t, Serializer.SUP) || ('^' + wrap(n.sup)))); }
        return s;
    case 'fenced': return n.left + P(n.body) + n.right;
    case 'matrix':
        rows = [];
        for (r = 0; r < n.rows.length; r++) { rows.push(U.map(n.rows[r], function (c) { return P(c); }).join(', ')); }
        m = MathData.MATRIX_ENVS[n.env] || ['', ''];
        return (m[0] || '[') + rows.join('; ') + (m[1] || (m[0] ? '' : ']'));
    case 'bigop':
        return n.symbol + (n.lower ? '_' + wrap(n.lower) : '') + (n.upper ? '^' + wrap(n.upper) : '') + ' ';
    case 'accent':
        s = P(n.body);
        return s + (Serializer.ACCENT_COMBINING[n.accent] || '') + (n.label ? '[' + P(n.label) + ']' : '');
    case 'font':
        if (n.variant === 'phantom') { return ''; }
        s = P(n.body);
        if (n.variant === 'bb' || n.variant === 'cal' || n.variant === 'frak') {
            t = '';
            U.each(U.codePoints(s), function (c) { t += MathData.mapVariantChar(n.variant, c); });
            return t;
        }
        return s;
    case 'xarrow': return ' ' + (Serializer.XARROW_CHAR[n.arrow] || '\u2192') + (n.over ? '[' + P(n.over) + ']' : '') + ' ';
    case 'stack': return P(n.base);
    case 'boxed': return '[' + P(n.body) + ']';
    case 'chem': return P(n.body);
    case 'lines':
        rows = [];
        for (r = 0; r < n.rows.length; r++) { rows.push(U.map(n.rows[r].cells, function (c) { return P(c); }).join('')); }
        return rows.join('; ');
    }
    return '';
};
Serializer.plain = function (root) { return U.trim(Serializer.plainText(root).replace(/\s+/g, ' ')); };

/* ---- Single text object representation ------------------------------------ */
/* Returns {ok, runs:[{text, kind:'italic'|'upright', style}], text} or {ok:false, reason}. */
Serializer.toSingleText = function (root) {
    var runs = [], reason = null;
    function add(text, kind, style) { runs.push({ text: text, kind: kind, style: style || null }); }
    function visit(n, style, upright) {
        var i, st = n.style ? U.extend(U.extend({}, style || {}), n.style) : style, t, mapped;
        if (reason) { return; }
        switch (n.type) {
        case 'row': for (i = 0; i < n.items.length; i++) { visit(n.items[i], st, upright); } return;
        case 'number': add(n.text, 'upright', st); return;
        case 'variable':
            add(n.text, (!upright && (MathData.isLatinLetter(n.text) || MathData.isGreekLower(n.text))) ? 'italic' : 'upright', st);
            return;
        case 'operator':
            if (n.cls === 'bin' || n.cls === 'rel') { add('\u2009' + n.text + '\u2009', 'upright', st); }
            else if (n.cls === 'punct') { add(n.text + '\u2009', 'upright', st); }
            else { add(n.text, 'upright', st); }
            return;
        case 'symbol': add(n.text, 'upright', st); return;
        case 'func':
            if (n.lower) { reason = 'Limits below a function (e.g. lim) need a structured layout.'; return; }
            add(n.display + '\u2009', 'upright', st); return;
        case 'text': add(n.text, 'upright', st); return;
        case 'space': if (n.width > 0) { add(n.width >= 0.9 ? '\u2003' : n.width >= 0.45 ? '\u2002' : '\u2009', 'upright', st); } return;
        case 'font':
            if (n.variant === 'bb' || n.variant === 'cal' || n.variant === 'frak') {
                t = '';
                U.each(U.codePoints(Serializer.plainText(n.body)), function (c) { t += MathData.mapVariantChar(n.variant, c); });
                add(t, 'upright', st);
                return;
            }
            if (n.variant === 'bf' || n.variant === 'bm') { visit(n.body, U.extend(U.extend({}, st || {}), { bold: true }), n.variant === 'bf'); return; }
            visit(n.body, st, n.variant === 'rm' || n.variant === 'unit');
            return;
        case 'scripts':
            if (n.presup || n.presub) { reason = 'Left scripts need a structured layout.'; return; }
            if (n.base.items.length !== 1 || !U.contains(['variable', 'number', 'symbol', 'fenced', 'font'], n.base.items[0].type)) {
                reason = 'This script base needs a structured layout.'; return;
            }
            visit(n.base, st, upright);
            if (n.sub) {
                mapped = Serializer.mapScript(Serializer.plainText(n.sub).replace(/\s/g, ''), Serializer.SUB);
                if (mapped === null) { reason = 'Subscript "' + Serializer.plain(n.sub) + '" has no Unicode subscript form.'; return; }
                add(mapped, 'upright', st);
            }
            if (n.sup) {
                t = Serializer.plainText(n.sup).replace(/\s/g, '');
                mapped = /^[\u2032\u2033\u2034]+$/.test(t) ? t : Serializer.mapScript(t, Serializer.SUP);
                if (mapped === null) { reason = 'Superscript "' + Serializer.plain(n.sup) + '" has no Unicode superscript form.'; return; }
                add(mapped, 'upright', st);
            }
            return;
        case 'fenced':
            add(n.left, 'upright', st); visit(n.body, st, upright); add(n.right, 'upright', st);
            if (!reason) {
                AST.walk(n.body, function (x) {
                    if (U.contains(['frac', 'root', 'matrix', 'bigop', 'binom', 'lines'], x.type)) { reason = 'Brackets around tall content need a structured layout.'; }
                });
            }
            return;
        case 'chem': visit(n.body, st, true); return;
        default:
            reason = (AST.TYPE_LABELS[n.type] || n.type) + ' structures cannot be represented as a single text object.';
        }
    }
    visit(root, null, false);
    if (reason) { return { ok: false, reason: reason }; }
    var text = '';
    U.each(runs, function (r) { text += r.text; });
    if (!U.trim(text)) { return { ok: false, reason: 'The expression is empty.' }; }
    return { ok: true, runs: runs, text: U.trim(text) };
};

/* ---- 24_semantics.jsx ---- */
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

/* ---- 25_editor.jsx ---- */
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

/* ---- 26_chem.jsx ---- */
/* ==========================================================================
 * Module 26 - Chemistry engine
 *   Chem.parseCe(src)     \ce{...} syntax (mhchem-style subset) -> chem node
 *   Chem.parseSpecies(w)  structured species {coef, parts, charge, state, hydrates}
 *   Chem.count(formula)   element counts (nested groups, hydrates, charge)
 *   Chem.balance(eq)      real balancing via exact rational linear algebra,
 *                         followed by independent atom-count verification
 *   Chem.molarMass(f)     molar mass from the periodic table
 * ========================================================================== */
var Chem = {};
Chem.ARROWS = [
    ['<=>>', 'equilibrium'], ['<<=>', 'equilibrium'], ['<-->', 'rightleftarrows'], ['<=>', 'equilibrium'],
    ['<->', 'leftright'], ['->', 'right'], ['<-', 'left'], ['\u2192', 'right'], ['\u21CC', 'equilibrium'],
    ['\u21C4', 'rightleftarrows'], ['\u2190', 'left'], ['\u2194', 'leftright'], ['=', 'right']
];
Chem.STATES = { s: 1, l: 1, g: 1, aq: 1, cr: 1, sln: 1, ppt: 1 };

function ChemError(msg, pos) { return new MathError(ErrorKind.CHEMISTRY, msg, '', typeof pos === 'number' ? pos : -1); }

/* Split \ce source into tokens: {t:'species'|'plus'|'arrow'|'state'|'gas'|'ppt'|'math', v, above, below} */
Chem.tokenize = function (src, allowEqualsArrow) {
    var s = String(src), i = 0, n = s.length, toks = [], word = '', depth = 0, k, a, m, c;
    function flush() {
        if (word !== '') {
            if (word === '+') { toks.push({ t: 'plus' }); }
            else if (word === '^') { toks.push({ t: 'gas' }); }
            else if (word === 'v') { toks.push({ t: 'ppt' }); }
            else if ((m = /^\((s|l|g|aq|cr|sln|ppt)\)$/.exec(word))) { toks.push({ t: 'state', v: m[1] }); }
            else { toks.push({ t: 'species', v: word }); }
            word = '';
        }
    }
    function bracket() {
        var d = 0, out = '', ch;
        if (s.charAt(i) !== '[') { return null; }
        i++;
        while (i < n) {
            ch = s.charAt(i);
            if (ch === '[') { d++; }
            if (ch === ']') { if (d === 0) { i++; return out; } d--; }
            out += ch; i++;
        }
        throw ChemError('Missing "]" in reaction condition');
    }
    while (i < n) {
        c = s.charAt(i);
        if (depth === 0 && /\s/.test(c)) { flush(); i++; continue; }
        if (c === '$') {
            k = s.indexOf('$', i + 1);
            if (k < 0) { throw ChemError('Unclosed $ in chemical formula', i); }
            if (word === '') { toks.push({ t: 'math', v: s.substring(i + 1, k) }); i = k + 1; continue; }
            word += s.substring(i, k + 1); i = k + 1; continue;
        }
        if (c === '{') { depth++; } else if (c === '}') { depth--; }
        if (depth === 0) {
            var matched = null;
            for (k = 0; k < Chem.ARROWS.length; k++) {
                a = Chem.ARROWS[k][0];
                if (s.substring(i, i + a.length) !== a) { continue; }
                if (a === '=' && (!allowEqualsArrow || word !== '')) { continue; }
                matched = Chem.ARROWS[k];
                break;
            }
            if (matched) {
                flush();
                i += matched[0].length;
                var above = bracket(), below = null;
                if (above !== null) { below = bracket(); }
                toks.push({ t: 'arrow', v: matched[1], above: above, below: below });
                continue;
            }
        }
        word += c;
        i++;
    }
    flush();
    return toks;
};

/* Parse one species word into structure. */
Chem.parseSpecies = function (w) {
    var s = String(w), i = 0, n = s.length, sp = { coef: '', parts: [], charge: '', state: '', hydrates: [], raw: s }, m;
    m = /^([0-9]+\/[0-9]+|[0-9]+(\.[0-9]+)?)(?=[A-Z(\[^_e]|$)/.exec(s);
    if (m && m[0].length < n) { sp.coef = m[1]; i = m[0].length; }
    else if (m && m[0].length === n) { sp.coef = ''; sp.parts.push({ type: 'num', text: s }); return sp; }
    var res = Chem.parseParts(s, i, '');
    sp.parts = res.parts;
    i = res.i;
    /* hydrate / adduct */
    while (i < n && (s.charAt(i) === '.' || s.charAt(i) === '*' || s.charAt(i) === '\u00B7')) {
        i++;
        var rest = Chem.parseSpecies(s.substring(i));
        sp.hydrates.push(rest);
        i = n;
    }
    if (sp.parts.length && sp.parts[sp.parts.length - 1].type === 'state') { sp.state = sp.parts.pop().text; }
    if (i < n) { throw ChemError('Cannot read "' + s.substring(i) + '" in "' + s + '"'); }
    return sp;
};
/* Parse a sequence of parts until a closing bracket. */
Chem.parseParts = function (s, i, closer) {
    var parts = [], n = s.length, c, m, last, sym, inner, pre = null, chg, cnt;
    while (i < n) {
        c = s.charAt(i);
        if (closer && c === closer) { return { parts: parts, i: i }; }
        if (c === '.' || c === '*' || c === '\u00B7') { break; }
        /* state at the end */
        m = /^\((s|l|g|aq|cr|sln|ppt)\)/.exec(s.substring(i));
        if (m && (i + m[0].length === n || /^[.*\u00B7]/.test(s.charAt(i + m[0].length)))) {
            parts.push({ type: 'state', text: m[1] }); i += m[0].length; continue;
        }
        if (/[A-Z]/.test(c)) {
            sym = c;
            if (/[a-z]/.test(s.charAt(i + 1)) && Elements.get(c + s.charAt(i + 1))) { sym = c + s.charAt(i + 1); }
            else if (/[a-z]/.test(s.charAt(i + 1)) && !Elements.get(c) && /[a-z]/.test(s.charAt(i + 1))) { sym = c + s.charAt(i + 1); }
            i += sym.length;
            last = { type: 'el', sym: sym, count: '', valid: !!Elements.get(sym), pre: pre };
            pre = null;
            parts.push(last);
        } else if (c === '(' || c === '[' || (c === '{' && closer !== '}')) {
            var close = c === '(' ? ')' : c === '[' ? ']' : '}';
            inner = Chem.parseParts(s, i + 1, close);
            if (s.charAt(inner.i) !== close) { throw ChemError('Missing "' + close + '" in "' + s + '"'); }
            i = inner.i + 1;
            last = { type: 'group', open: c, close: close, parts: inner.parts, count: '' };
            parts.push(last);
        } else if (/[0-9]/.test(c)) {
            m = /^[0-9]+/.exec(s.substring(i));
            /* digits followed by a final + or - at the end form a charge: Ca2+ */
            if (/^[0-9]+[+\-]$/.test(s.substring(i).replace(/\((s|l|g|aq)\)$/, '')) &&
                parts.length === 1 && parts[0].type === 'el' && !parts[0].count) {
                chg = /^[0-9]+[+\-]/.exec(s.substring(i))[0];
                Chem.setCharge(parts, chg);
                i += chg.length;
                continue;
            }
            if (!parts.length) { parts.push({ type: 'num', text: m[0] }); i += m[0].length; continue; }
            last = parts[parts.length - 1];
            if (last.type === 'el' || last.type === 'group') { last.count = (last.count || '') + m[0]; }
            else { parts.push({ type: 'num', text: m[0] }); }
            i += m[0].length;
        } else if (c === '^' || c === '_') {
            /* charge / oxidation state, or isotope prescript before an element */
            i++;
            if (s.charAt(i) === '{') {
                var end = s.indexOf('}', i);
                if (end < 0) { throw ChemError('Missing "}" in "' + s + '"'); }
                chg = s.substring(i + 1, end);
                i = end + 1;
            } else {
                m = /^([0-9]*[+\-]|[0-9]+|[IVX]+|[+\-][0-9]*)/.exec(s.substring(i));
                if (!m) { throw ChemError('Missing value after "' + c + '" in "' + s + '"'); }
                chg = m[0];
                i += chg.length;
            }
            if (/[A-Z]/.test(s.charAt(i)) && (!parts.length || pre)) {
                pre = pre || {};
                pre[c === '^' ? 'sup' : 'sub'] = chg;
            } else if (c === '^') {
                Chem.setCharge(parts, chg);
            } else {
                if (parts.length) { parts[parts.length - 1].count = chg; }
            }
        } else if ((c === '+' || c === '-') && (i + 1 === n || /^\((s|l|g|aq|cr|sln|ppt)\)$/.test(s.substring(i + 1)) || /^[.*]/.test(s.charAt(i + 1)))) {
            Chem.setCharge(parts, c);
            i++;
        } else if (c === '-' || c === '=' || c === '#') {
            parts.push({ type: 'bond', text: c === '-' ? '\u2212' : c === '=' ? '=' : '\u2261' });
            i++;
        } else if (/[a-z]/.test(c)) {
            parts.push({ type: 'particle', text: c, count: '' });
            i++;
        } else if (c === '$') {
            var e2 = s.indexOf('$', i + 1);
            parts.push({ type: 'math', text: s.substring(i + 1, e2) });
            i = e2 + 1;
        } else {
            parts.push({ type: 'other', text: c });
            i++;
        }
    }
    return { parts: parts, i: i };
};
Chem.setCharge = function (parts, chg) {
    var last = parts.length ? parts[parts.length - 1] : null;
    if (!last) { parts.push({ type: 'particle', text: '', charge: chg }); return; }
    last.charge = chg;
};
/* Numeric charge: "2+" -> 2, "-" -> -1, "3-" -> -3, roman numerals -> 0 (oxidation state) */
Chem.chargeValue = function (chg) {
    var m;
    if (!chg) { return 0; }
    chg = String(chg).replace(/\u2212/g, '-');
    m = /^([0-9]*)([+\-])$/.exec(chg);
    if (m) { return (m[2] === '-' ? -1 : 1) * (m[1] ? parseInt(m[1], 10) : 1); }
    m = /^([+\-])([0-9]+)$/.exec(chg);
    if (m) { return (m[1] === '-' ? -1 : 1) * parseInt(m[2], 10); }
    m = /^([+\-]+)$/.exec(chg);
    if (m) { return (chg.charAt(0) === '-' ? -1 : 1) * chg.length; }
    return 0; /* oxidation states (roman numerals) carry no ionic charge */
};

/* ---- Rendering species to AST nodes --------------------------------------- */
Chem.chargeRow = function (chg) {
    var m = /^([0-9]*)([+\-])$/.exec(chg), items = [];
    if (m) {
        if (m[1]) { items.push(AST.number(m[1])); }
        items.push(AST.operator(m[2] === '-' ? '\u2212' : '+', 'ord'));
        return AST.row(items);
    }
    return Parser.parseRow(chg);
};
Chem.partNodes = function (p) {
    var base, nodes = [], sc, i, inner;
    switch (p.type) {
    case 'el': base = AST.variable(p.sym); break;
    case 'particle': base = p.text ? AST.variable(p.text) : null; break;
    case 'group':
        inner = [];
        for (i = 0; i < p.parts.length; i++) { inner = inner.concat(Chem.partNodes(p.parts[i])); }
        base = AST.fenced(p.open === '{' ? '{' : p.open, p.close, AST.row(inner), false);
        break;
    case 'num': return [AST.number(p.text)];
    case 'bond': return [AST.symbol(p.text, 'ord')];
    case 'state': return [AST.text('(' + p.text + ')')];
    case 'math': return Parser.parseRow(p.text).items;
    default: return [AST.symbol(p.text, 'ord')];
    }
    if (!base && !p.charge) { return []; }
    if (p.count || p.charge || p.pre) {
        sc = AST.scripts(base ? AST.row([base]) : AST.row(), null, null);
        if (p.count) { sc.sub = Parser.parseRow(p.count); }
        if (p.charge) { sc.sup = Chem.chargeRow(p.charge); }
        if (p.pre) {
            if (p.pre.sup) { sc.presup = Parser.parseRow(p.pre.sup); }
            if (p.pre.sub) { sc.presub = Parser.parseRow(p.pre.sub); }
        }
        nodes.push(sc);
    } else { nodes.push(base); }
    return nodes;
};
Chem.speciesNodes = function (sp) {
    var nodes = [], i, m;
    if (sp.coef) {
        m = /^([0-9]+)\/([0-9]+)$/.exec(sp.coef);
        if (m) { nodes.push(AST.frac(AST.row([AST.number(m[1])]), AST.row([AST.number(m[2])]), 'tfrac')); }
        else { nodes.push(AST.number(sp.coef)); }
        nodes.push(AST.space(2 / 18));
    }
    for (i = 0; i < sp.parts.length; i++) { nodes = nodes.concat(Chem.partNodes(sp.parts[i])); }
    for (i = 0; i < sp.hydrates.length; i++) {
        nodes.push(AST.operator('\u00B7', 'bin'));
        nodes = nodes.concat(Chem.speciesNodes(sp.hydrates[i]));
    }
    if (sp.state) { nodes.push(AST.text('(' + sp.state + ')')); }
    return nodes;
};
/* Reaction condition label: chemical formula when valid, otherwise text/math. */
Chem.labelRow = function (txt) {
    var t = U.trim(txt), sp, ok = true, i;
    if (!t) { return null; }
    if (t.charAt(0) === '$' && t.charAt(t.length - 1) === '$') { return Parser.parseRow(t.substring(1, t.length - 1)); }
    if (/\\/.test(t)) { return Parser.parseRow(t); }
    try {
        var toks = Chem.tokenize(t, false), items = [];
        for (i = 0; i < toks.length; i++) {
            if (toks[i].t !== 'species') { ok = false; break; }
            sp = Chem.parseSpecies(toks[i].v);
            AST.walk(AST.row(Chem.speciesNodes(sp)), function () {});
            U.each(sp.parts, function (p) { if (p.type === 'particle' || (p.type === 'el' && !p.valid)) { ok = false; } });
            if (!ok) { break; }
            if (items.length) { items.push(AST.text(' ')); }
            items = items.concat(Chem.speciesNodes(sp));
        }
        if (ok) { return AST.row(items); }
    } catch (e) { /* fall back to text */ }
    return AST.row([AST.text(t)]);
};
Chem.parseCe = function (src, basePos) {
    var toks, items = [], i, t, x;
    try {
        toks = Chem.tokenize(src, false);
        for (i = 0; i < toks.length; i++) {
            t = toks[i];
            if (t.t === 'plus') { items.push(AST.operator('+', 'bin')); }
            else if (t.t === 'arrow') { x = AST.xarrow(t.v, t.above !== null ? Chem.labelRow(t.above) : null, t.below !== null ? Chem.labelRow(t.below) : null); items.push(x); }
            else if (t.t === 'state') { items.push(AST.text('(' + t.v + ')')); }
            else if (t.t === 'gas') { items.push(AST.operator('\u2191', 'ord')); }
            else if (t.t === 'ppt') { items.push(AST.operator('\u2193', 'ord')); }
            else if (t.t === 'math') { items = items.concat(Parser.parseRow(t.v).items); }
            else { items = items.concat(Chem.speciesNodes(Chem.parseSpecies(t.v))); }
        }
    } catch (e) {
        throw new MathError(ErrorKind.PARSER, 'Chemical formula: ' + (e.message || e), '', typeof basePos === 'number' ? basePos : -1);
    }
    return AST.chem(src, AST.row(items));
};

/* ---- Counting --------------------------------------------------------------- */
Chem.countParts = function (parts, mult, acc, unknown) {
    var i, p, k;
    for (i = 0; i < parts.length; i++) {
        p = parts[i];
        k = (p.count && /^[0-9]+$/.test(p.count)) ? parseInt(p.count, 10) : 1;
        if (p.type === 'el') {
            if (!p.valid) { unknown.push(p.sym); }
            acc[p.sym] = (acc[p.sym] || 0) + k * mult;
        } else if (p.type === 'group') {
            Chem.countParts(p.parts, k * mult, acc, unknown);
        } else if (p.type === 'particle' && p.text === 'e') {
            /* electrons: counted only through charge */
        }
    }
};
Chem.speciesCharge = function (sp) {
    var q = 0;
    function scan(parts) { U.each(parts, function (p) { if (p.charge) { q += Chem.chargeValue(p.charge); } if (p.type === 'group') { scan(p.parts); } }); }
    scan(sp.parts);
    U.each(sp.hydrates, function (h) { q += Chem.speciesCharge(h); });
    return q;
};
Chem.countSpecies = function (sp) {
    var acc = {}, unknown = [], i, h, k, hc, mult;
    Chem.countParts(sp.parts, 1, acc, unknown);
    for (i = 0; i < sp.hydrates.length; i++) {
        h = sp.hydrates[i];
        mult = h.coef ? parseFloat(h.coef) : 1;
        hc = {};
        Chem.countParts(h.parts, 1, hc, unknown);
        for (k in hc) { if (U.has(hc, k)) { acc[k] = (acc[k] || 0) + hc[k] * mult; } }
    }
    return { atoms: acc, charge: Chem.speciesCharge(sp), unknown: unknown };
};
Chem.count = function (formula) {
    var t = U.trim(String(formula).replace(/^\\ce\{([\s\S]*)\}$/, '$1')), sp, r;
    if (!t) { throw ChemError('Enter a chemical formula.'); }
    sp = Chem.parseSpecies(t);
    r = Chem.countSpecies(sp);
    if (r.unknown.length) { throw ChemError('Unknown element symbol(s): ' + r.unknown.join(', ')); }
    return r;
};

/* ---- Exact rational arithmetic --------------------------------------------- */
Chem.gcd = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; };
Chem.lcm = function (a, b) { return Math.abs(a * b) / Chem.gcd(a, b); };
Chem.Q = function (n, d) {
    var g;
    d = (d === undefined) ? 1 : d;
    if (d < 0) { n = -n; d = -d; }
    g = Chem.gcd(n, d);
    return [n / g, d / g];
};
Chem.qsub = function (a, b) { return Chem.Q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]); };
Chem.qmul = function (a, b) { return Chem.Q(a[0] * b[0], a[1] * b[1]); };
Chem.qdiv = function (a, b) { return Chem.Q(a[0] * b[1], a[1] * b[0]); };

/* Null space of an integer matrix (rows x cols) via exact RREF. */
Chem.nullSpace = function (M, cols) {
    var A = [], r, c, i, lead = 0, rows = M.length, piv = [], tmp, f, basis = [], free, vec, k;
    for (r = 0; r < rows; r++) { A.push(U.map(M[r], function (v) { return Chem.Q(v, 1); })); }
    for (r = 0; r < rows && lead < cols; r++) {
        i = r;
        while (A[i][lead][0] === 0) {
            i++;
            if (i === rows) { i = r; lead++; if (lead === cols) { break; } }
        }
        if (lead === cols) { break; }
        tmp = A[i]; A[i] = A[r]; A[r] = tmp;
        f = A[r][lead];
        for (c = 0; c < cols; c++) { A[r][c] = Chem.qdiv(A[r][c], f); }
        for (i = 0; i < rows; i++) {
            if (i !== r && A[i][lead][0] !== 0) {
                f = A[i][lead];
                for (c = 0; c < cols; c++) { A[i][c] = Chem.qsub(A[i][c], Chem.qmul(f, A[r][c])); }
            }
        }
        piv.push(lead);
        lead++;
    }
    for (free = 0; free < cols; free++) {
        if (U.contains(piv, free)) { continue; }
        vec = [];
        for (c = 0; c < cols; c++) { vec.push(Chem.Q(c === free ? 1 : 0, 1)); }
        for (k = 0; k < piv.length; k++) { vec[piv[k]] = Chem.Q(-A[k][free][0], A[k][free][1]); }
        basis.push(vec);
    }
    return basis;
};

/* Balance a reaction such as "Fe + O2 -> Fe2O3". */
Chem.balance = function (equation) {
    var src = U.trim(String(equation).replace(/^\\ce\{([\s\S]*)\}$/, '$1')), toks, sides = [[], []], side = 0, arrow = null, i, t,
        species = [], elements = [], counts = [], M = [], r, c, e, ns, vec, den, coefs, g, hasCharge = false, sign, check, ok;
    if (!src) { throw ChemError('Enter a reaction, for example: H2 + O2 -> H2O'); }
    toks = Chem.tokenize(src, true);
    for (i = 0; i < toks.length; i++) {
        t = toks[i];
        if (t.t === 'arrow') {
            if (arrow) { throw ChemError('A reaction must contain exactly one arrow.'); }
            arrow = t; side = 1; continue;
        }
        if (t.t === 'plus' || t.t === 'state' || t.t === 'gas' || t.t === 'ppt') { continue; }
        if (t.t === 'math') { throw ChemError('Math fragments cannot be balanced.'); }
        sides[side].push(t.v);
    }
    if (!arrow) { throw ChemError('The reaction needs an arrow (->, <=> or =) between reactants and products.'); }
    if (!sides[0].length || !sides[1].length) { throw ChemError('Both sides of the reaction need at least one species.'); }
    for (side = 0; side < 2; side++) {
        for (i = 0; i < sides[side].length; i++) {
            var sp = Chem.parseSpecies(sides[side][i]);
            var name = sides[side][i].replace(/^([0-9]+\/[0-9]+|[0-9]+(\.[0-9]+)?)(?=[A-Z(\[])/, '').replace(/\((s|l|g|aq|cr|sln|ppt)\)$/, '');
            var state = (/\((s|l|g|aq|cr|sln|ppt)\)$/.exec(sides[side][i]) || [''])[0];
            sp.coef = '';
            var cnt = Chem.countSpecies(sp);
            if (cnt.unknown.length) { throw ChemError('Unknown element symbol(s): ' + cnt.unknown.join(', ')); }
            if (!U.keys(cnt.atoms).length && !cnt.charge) { throw ChemError('"' + sides[side][i] + '" contains no elements.'); }
            if (cnt.charge) { hasCharge = true; }
            species.push({ side: side, text: name, state: state, counts: cnt });
            for (e in cnt.atoms) { if (U.has(cnt.atoms, e) && !U.contains(elements, e)) { elements.push(e); } }
        }
    }
    for (r = 0; r < elements.length; r++) {
        M.push([]);
        for (c = 0; c < species.length; c++) {
            sign = species[c].side === 0 ? 1 : -1;
            M[r].push(sign * (species[c].counts.atoms[elements[r]] || 0));
        }
    }
    if (hasCharge) {
        M.push(U.map(species, function (s) { return (s.side === 0 ? 1 : -1) * s.counts.charge; }));
    }
    ns = Chem.nullSpace(M, species.length);
    if (ns.length === 0) { throw ChemError('This reaction cannot be balanced: no combination of coefficients conserves every element' + (hasCharge ? ' and the total charge' : '') + '.'); }
    if (ns.length > 1) { throw ChemError('This reaction can be balanced in more than one independent way (it combines ' + ns.length + ' separate reactions). Split it into separate equations.'); }
    vec = ns[0];
    den = 1;
    for (i = 0; i < vec.length; i++) { den = Chem.lcm(den, vec[i][1]); }
    coefs = U.map(vec, function (q) { return q[0] * (den / q[1]); });
    g = 0;
    for (i = 0; i < coefs.length; i++) { g = Chem.gcd(g, coefs[i]); }
    coefs = U.map(coefs, function (x) { return x / g; });
    if (coefs[0] < 0) { coefs = U.map(coefs, function (x) { return -x; }); }
    for (i = 0; i < coefs.length; i++) {
        if (coefs[i] <= 0) { throw ChemError('"' + species[i].text + '" would need a zero or negative coefficient; check which side it belongs on.'); }
    }
    /* Independent verification of the result */
    check = {};
    ok = true;
    for (r = 0; r < elements.length; r++) {
        var left = 0, right = 0;
        for (c = 0; c < species.length; c++) {
            var amount = coefs[c] * (species[c].counts.atoms[elements[r]] || 0);
            if (species[c].side === 0) { left += amount; } else { right += amount; }
        }
        check[elements[r]] = [left, right];
        if (left !== right) { ok = false; }
    }
    var qL = 0, qR = 0;
    for (c = 0; c < species.length; c++) { if (species[c].side === 0) { qL += coefs[c] * species[c].counts.charge; } else { qR += coefs[c] * species[c].counts.charge; } }
    if (qL !== qR) { ok = false; }
    if (!ok) { throw ChemError('Internal verification failed; the reaction was not balanced.'); }
    var arrowText = { right: '->', left: '<-', equilibrium: '<=>', leftright: '<->', rightleftarrows: '<-->' }[arrow.v] || '->';
    if (arrow.above !== null && arrow.above !== undefined) { arrowText += '[' + arrow.above + ']'; if (arrow.below !== null && arrow.below !== undefined) { arrowText += '[' + arrow.below + ']'; } }
    var parts = [[], []];
    for (c = 0; c < species.length; c++) { parts[species[c].side].push((coefs[c] === 1 ? '' : coefs[c]) + species[c].text + species[c].state); }
    var text = parts[0].join(' + ') + ' ' + arrowText + ' ' + parts[1].join(' + ');
    return { ok: true, coefficients: coefs, species: U.map(species, function (s) { return s.text; }), elements: elements,
        check: check, charge: [qL, qR], text: text, latex: '\\ce{' + text + '}' };
};

/* ---- Molar mass ------------------------------------------------------------- */
Chem.molarMass = function (formula) {
    var r = Chem.count(formula), total = 0, k, el, parts = [], warn = [];
    for (k in r.atoms) {
        if (!U.has(r.atoms, k)) { continue; }
        el = Elements.get(k);
        total += el.mass * r.atoms[k];
        parts.push(k + ': ' + r.atoms[k] + ' \u00D7 ' + el.mass + ' = ' + U.round(el.mass * r.atoms[k], 4));
        if (el.massIsIsotope) { warn.push(k + ' has no standard atomic weight; the mass number of its longest-lived isotope (' + el.mass + ') was used.'); }
    }
    return { mass: U.round(total, 4), breakdown: parts, warnings: warn, atoms: r.atoms, charge: r.charge };
};

/* ---- 30_formatting.jsx ---- */
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

/* ---- 31_layout.jsx ---- */
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

/* ---- 99_footer.jsx ---- */
/* ==========================================================================
 * Module 99 - Footer: public surface + entry point
 * ========================================================================== */
MSEE.U = U; MSEE.JSONX = JSONX; MSEE.Errors = Errors; MSEE.ErrorKind = ErrorKind; MSEE.MathError = MathError; MSEE.Log = Log;
MSEE.MathData = MathData; MSEE.Symbols = Symbols; MSEE.Elements = Elements; MSEE.AST = AST; MSEE.Lexer = Lexer;
MSEE.Parser = Parser; MSEE.Serializer = Serializer; MSEE.Semantics = Semantics; MSEE.Editor = Editor; MSEE.Chem = Chem;
if (typeof Layout !== 'undefined') { MSEE.Layout = Layout; }
if (typeof Fonts !== 'undefined') { MSEE.Fonts = Fonts; }
if (typeof Formatting !== 'undefined') { MSEE.Formatting = Formatting; }
if (typeof Renderer !== 'undefined') { MSEE.Renderer = Renderer; }
if (typeof Templates !== 'undefined') { MSEE.Templates = Templates; }
if (typeof Store !== 'undefined') { MSEE.Store = Store; }
if (typeof History !== 'undefined') { MSEE.History = History; }
if (typeof Model !== 'undefined') { MSEE.Model = Model; }
if (typeof PreviewRenderer !== 'undefined') { MSEE.PreviewRenderer = PreviewRenderer; }
if (typeof UI !== 'undefined') { MSEE.UI = UI; }

if (MSEE.TEST_MODE) {
    GLOBAL.MSEE = MSEE;
} else if (typeof UI !== 'undefined') {
    UI.launch();
}

}(this));
