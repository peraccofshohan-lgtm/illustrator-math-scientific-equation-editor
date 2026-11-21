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
