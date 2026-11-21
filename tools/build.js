#!/usr/bin/env node
/*
 * Build: concatenates src/modules/*.jsx (numeric filename order) into the
 * single standalone release script, stamps the version and validates that
 * the output parses as ECMAScript 3 (the ExtendScript baseline).
 *   node tools/build.js          build release asset
 *   node tools/build.js --check  build into memory and validate only
 */
'use strict';
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'modules');
const OUT_NAME = 'Shohan_Khan_Illustrator_Math_Scientific_Equation_Editor.jsx';
const OUT = path.join(ROOT, 'release', OUT_NAME);
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

function build() {
  // Regenerate data-driven modules first so the release always matches src/data.
  const gen = require('./gen-templates.js');
  const genText = gen.generate();
  if (!fs.existsSync(gen.OUT) || fs.readFileSync(gen.OUT, 'utf8') !== genText) { fs.writeFileSync(gen.OUT, genText); }
  const files = fs.readdirSync(SRC).filter((f) => /^\d\d_.*\.jsx$/.test(f)).sort();
  if (!files.length || files[0] !== '00_header.jsx' || files[files.length - 1] !== '99_footer.jsx') {
    throw new Error('Module set must start with 00_header.jsx and end with 99_footer.jsx');
  }
  const banner = [
    '/*',
    ' * ' + 'Adobe Illustrator Advanced Mathematical & Scientific Equation Editor',
    ' * Math & Scientific Equation Editor v' + pkg.version,
    ' * Created by Shohan Khan',
    ' * License: MIT  (see LICENSE in the source repository)',
    ' * Source: https://github.com/peraccofshohan-lgtm/illustrator-math-scientific-equation-editor',
    ' *',
    ' * Install: File > Scripts > Other Script... in Illustrator, or copy into the',
    ' * Illustrator Presets/<locale>/Scripts folder and restart Illustrator.',
    ' * GENERATED FILE - edit src/modules/*.jsx and run "npm run build".',
    ' */',
    '#target illustrator',
    '#targetengine "main"',
    ''
  ].join('\n');
  const parts = files.map((f) => {
    const text = fs.readFileSync(path.join(SRC, f), 'utf8');
    if (/\r/.test(text)) { throw new Error(f + ': use LF line endings'); }
    return '/* ---- ' + f + ' ---- */\n' + text.replace(/\s+$/, '') + '\n';
  });
  let out = banner + parts.join('\n');
  out = out.split('@@VERSION@@').join(pkg.version);
  return { out, files };
}

function checkSyntax(code, label) {
  // ExtendScript preprocessor directives are not JavaScript; blank them for parsing.
  const js = code.replace(/^#(target|targetengine|include|script).*$/gm, (m) => ' '.repeat(m.length));
  try {
    acorn.parse(js, { ecmaVersion: 3, sourceType: 'script', allowReserved: 'never', locations: true });
  } catch (e) {
    const line = e.loc ? e.loc.line : 0;
    const lines = js.split('\n');
    const ctx = lines.slice(Math.max(0, line - 3), line + 2).join('\n');
    throw new Error(label + ': ES3 syntax error: ' + e.message + '\n' + ctx);
  }
  // Constructs acorn's ES3 mode accepts but ExtendScript rejects or mishandles.
  const forbidden = [
    [/\bconst\s/, 'const'], [/\blet\s+[A-Za-z_$]/, 'let'], [/=>/, 'arrow function'], [/`/, 'template literal'],
    [/\.forEach\(/, 'Array.prototype.forEach'], [/\bObject\.keys\(/, 'Object.keys'], [/\bJSON\.(parse|stringify)\(/, 'JSON global'],
    [/\.trim\(\)/, 'String.prototype.trim'], [/\bArray\.isArray\(/, 'Array.isArray'], [/\.indexOf\([^)]*\)\s*;?\s*\/\/ES5/, 'x']
  ];
  const stripped = js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/\/\/[^\n]*/g, '');
  forbidden.forEach(([re, name]) => {
    if (re.test(stripped)) { throw new Error(label + ': forbidden non-ES3 construct: ' + name); }
  });
  // Trailing commas in object/array literals break old ExtendScript.
  if (/,\s*[\]}]/.test(stripped)) {
    const m = /,\s*[\]}]/.exec(stripped);
    const line = stripped.slice(0, m.index).split('\n').length;
    throw new Error(label + ': trailing comma before closing bracket near stripped line ' + line + ': ' + stripped.split('\n')[line - 1]);
  }
}

function main() {
  const check = process.argv.includes('--check');
  const { out, files } = build();
  checkSyntax(out, OUT_NAME);
  if (check) {
    if (!fs.existsSync(OUT)) { throw new Error('release/' + OUT_NAME + ' does not exist; run npm run build'); }
    const onDisk = fs.readFileSync(OUT, 'utf8');
    if (onDisk !== out) { throw new Error('release/' + OUT_NAME + ' is out of date; run npm run build'); }
    console.log('OK: release asset is up to date and ES3-valid (' + files.length + ' modules, ' + Buffer.byteLength(out) + ' bytes)');
    return;
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, out);
  console.log('Built release/' + OUT_NAME + ' v' + pkg.version + ' (' + files.length + ' modules, ' + Buffer.byteLength(out) + ' bytes)');
}

if (require.main === module) {
  try { main(); } catch (e) { console.error('BUILD FAILED: ' + e.message); process.exit(1); }
}
module.exports = { build, checkSyntax, OUT, OUT_NAME };
