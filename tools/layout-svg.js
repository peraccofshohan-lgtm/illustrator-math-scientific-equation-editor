#!/usr/bin/env node
/*
 * Developer tool: renders the layout engine's primitives to SVG so that the
 * geometry can be inspected without Illustrator. This draws exactly the
 * primitives the Illustrator renderer receives (glyph positions use the
 * built-in approximate metrics and a system font, so glyph shapes differ
 * from Illustrator's fonts).
 *   node tools/layout-svg.js "<latex>" out.svg [fontSize]
 */
'use strict';
const fs = require('fs');
const { load } = require('../tests/load.js');

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function toSvg(M, latex, size, opts) {
  const root = M.Parser.parse(latex).root;
  const L = M.Layout.compute(root, { fontSize: size || 40 }, opts || {});
  const b = M.Layout.bounds(L);
  const pad = 10;
  const W = (b.right - b.left) + 2 * pad, H = (b.top - b.bottom) + 2 * pad;
  const X = (x) => (x - b.left + pad).toFixed(2), Y = (y) => (b.top - y + pad).toFixed(2);
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}">`,
    `<rect width="100%" height="100%" fill="white"/>`,
    `<line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="#9cf" stroke-width="0.5"/>`];
  for (const p of L.prims) {
    if (p.k === 'text') {
      const fam = p.face === 'text' ? 'DejaVu Serif, serif' : p.face === 'sans' ? 'DejaVu Sans, sans-serif' : p.face === 'mono' ? 'DejaVu Sans Mono, monospace' : 'DejaVu Serif, serif';
      out.push(`<text x="${X(p.x)}" y="${Y(p.y)}" font-family="${fam}" font-size="${p.size.toFixed(2)}" fill="${p.color}"${p.italic ? ' font-style="italic"' : ''}${p.bold ? ' font-weight="bold"' : ''}>${esc(p.t)}</text>`);
    } else if (p.k === 'rule') {
      out.push(`<rect x="${X(p.x)}" y="${Y(p.y + p.h)}" width="${p.w.toFixed(2)}" height="${p.h.toFixed(2)}" fill="${p.color}"/>`);
    } else if (p.k === 'path') {
      let d = `M${X(p.pts[0].a[0])},${Y(p.pts[0].a[1])}`;
      for (let i = 1; i < p.pts.length; i++) {
        const a = p.pts[i - 1], c = p.pts[i];
        d += ` C${X(a.r[0])},${Y(a.r[1])} ${X(c.l[0])},${Y(c.l[1])} ${X(c.a[0])},${Y(c.a[1])}`;
      }
      if (p.closed) {
        const a = p.pts[p.pts.length - 1], c = p.pts[0];
        d += ` C${X(a.r[0])},${Y(a.r[1])} ${X(c.l[0])},${Y(c.l[1])} ${X(c.a[0])},${Y(c.a[1])} Z`;
      }
      out.push(`<path d="${d}" fill="${p.fill ? p.color : 'none'}" stroke="${p.stroke ? p.color : 'none'}" stroke-width="${(p.stroke || 0).toFixed(2)}" stroke-linecap="${p.cap || 'butt'}" stroke-linejoin="${p.join || 'miter'}"${p.dashed ? ' stroke-dasharray="3,2"' : ''}/>`);
    }
  }
  out.push('</svg>');
  return out.join('\n');
}
if (require.main === module) {
  const M = load();
  const [latex, file, size] = process.argv.slice(2);
  fs.writeFileSync(file, toSvg(M, latex, Number(size) || 40));
  console.log('wrote ' + file);
}
module.exports = { toSvg };
