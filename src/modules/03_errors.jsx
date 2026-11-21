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
    DOCUMENT: 'Document error',
    RENDER: 'Rendering error',
    PERSISTENCE: 'Data storage error',
    IMPORT: 'Import error',
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
