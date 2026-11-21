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
