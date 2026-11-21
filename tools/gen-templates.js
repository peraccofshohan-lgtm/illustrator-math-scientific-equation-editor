/* Converts src/data/templates.txt into the ES3 module src/modules/35_templates.jsx. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'data', 'templates.txt');
const OUT = path.join(ROOT, 'src', 'modules', '35_templates.jsx');

function jsString(s) {
  let out = "'";
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (ch === '\\') out += '\\\\';
    else if (ch === "'") out += "\\'";
    else if (c < 0x20 || c > 0x7e) {
      const units = c > 0xffff ? [0xd800 + ((c - 0x10000) >> 10), 0xdc00 + ((c - 0x10000) & 0x3ff)] : [c];
      for (const u of units) out += '\\u' + u.toString(16).toUpperCase().padStart(4, '0');
    } else out += ch;
  }
  return out + "'";
}
function generate() {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  const cats = [];
  let cur = null;
  const seen = new Set();
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t || (t.startsWith('#') && !t.startsWith('##'))) return;
    if (t.startsWith('##')) {
      const [group, name] = t.slice(2).split('/').map((x) => x.trim());
      if (!group || !name) throw new Error('templates.txt:' + (i + 1) + ': header must be "## Group / Category"');
      cur = { group, name, items: [] };
      cats.push(cur);
      return;
    }
    if (!cur) throw new Error('templates.txt:' + (i + 1) + ': template before first category');
    const parts = t.split(' :: ');
    if (parts.length < 3 || parts.length > 4) throw new Error('templates.txt:' + (i + 1) + ': expected "Name :: LaTeX :: keywords [:: description]"');
    const key = cur.name + '/' + parts[0];
    if (seen.has(key)) throw new Error('templates.txt:' + (i + 1) + ': duplicate template ' + key);
    seen.add(key);
    cur.items.push(parts.map((p) => p.trim()));
  });
  const out = [];
  out.push('/* ==========================================================================');
  out.push(' * Module 35 - Built-in template library');
  out.push(' * GENERATED from src/data/templates.txt by tools/gen-templates.js - do not edit.');
  out.push(' * Templates are stored as source text and parsed into the shared AST on use,');
  out.push(' * so they are fully structured (editable fractions, matrices, ...) after insertion.');
  out.push(' * ========================================================================== */');
  out.push('var Templates = { categories: [], items: [] };');
  out.push('Templates.add = function (group, cat, rows) {');
  out.push('    var i, r, id = Templates.categories.length;');
  out.push("    Templates.categories.push({ id: 'tc' + id, group: group, name: cat, count: rows.length });");
  out.push('    for (i = 0; i < rows.length; i++) {');
  out.push('        r = rows[i];');
  out.push("        Templates.items.push({ id: 't' + Templates.items.length, cat: 'tc' + id, group: group, catName: cat, name: r[0], latex: r[1], kw: r[2] || '', desc: r[3] || '' });");
  out.push('    }');
  out.push('};');
  cats.forEach((c) => {
    out.push('Templates.add(' + jsString(c.group) + ', ' + jsString(c.name) + ', [');
    out.push(c.items.map((it) => '    [' + it.map(jsString).join(', ') + ']').join(',\n'));
    out.push(']);');
  });
  out.push('Templates.byId = function (id) {');
  out.push('    var i;');
  out.push('    for (i = 0; i < Templates.items.length; i++) { if (Templates.items[i].id === id) { return Templates.items[i]; } }');
  out.push('    return null;');
  out.push('};');
  out.push('Templates.inCategory = function (catId) {');
  out.push("    return U.filter(Templates.items, function (t) { return !catId || catId === 'all' || t.cat === catId; });");
  out.push('};');
  out.push('Templates.search = function (query, catId) {');
  out.push('    var q = U.trim(query || \'\'), list = Templates.inCategory(catId), scored = [], i, t, s;');
  out.push('    if (!q) { return list; }');
  out.push('    for (i = 0; i < list.length; i++) {');
  out.push('        t = list[i];');
  out.push("        s = U.searchScore(q, [t.name, t.kw, t.catName, t.desc, t.latex]);");
  out.push('        if (s > 0) { scored.push({ t: t, s: s }); }');
  out.push('    }');
  out.push('    scored.sort(function (a, b) { return b.s - a.s; });');
  out.push('    return U.map(scored, function (x) { return x.t; });');
  out.push('};');
  return out.join('\n') + '\n';
}
if (require.main === module) {
  fs.writeFileSync(OUT, generate());
  console.log('Generated ' + path.relative(ROOT, OUT));
}
module.exports = { generate, OUT };
