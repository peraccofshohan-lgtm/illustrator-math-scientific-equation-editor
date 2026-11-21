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
