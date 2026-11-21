/* Tiny dependency-free test harness. Each *.test.js exports a function(t). */
'use strict';
const assert = require('assert');
const { load } = require('./load.js');

function makeT(suiteName, results) {
  const t = {
    suite: suiteName,
    test(name, fn) {
      const start = Date.now();
      try { fn(); results.push({ suite: suiteName, name, ok: true, ms: Date.now() - start }); }
      catch (e) { results.push({ suite: suiteName, name, ok: false, ms: Date.now() - start, error: (e && e.stack) ? e.stack.split('\n').slice(0, 6).join('\n') : String(e) }); }
    },
    ok(v, msg) { assert.ok(v, msg); },
    eq(a, b, msg) { assert.deepStrictEqual(a, b, msg); },
    throws(fn, re, msg) {
      let threw = null;
      try { fn(); } catch (e) { threw = e; }
      assert.ok(threw, (msg || 'expected an error') + ' (no error thrown)');
      if (re) { assert.ok(re.test(String(threw.message || threw)), (msg || '') + ' error "' + threw.message + '" does not match ' + re); }
      return threw;
    },
    finite(v, msg) { assert.ok(typeof v === 'number' && isFinite(v), (msg || 'value') + ' is not finite: ' + v); },
    load
  };
  return t;
}
/* Checks every number in a layout result is finite. */
function layoutFinite(L) {
  const bad = [];
  ['width', 'ascent', 'descent'].forEach(k => { if (!isFinite(L[k])) { bad.push(k); } });
  L.prims.forEach((p, i) => {
    ['x', 'y', 'w', 'h', 'size'].forEach(k => { if (k in p && !isFinite(p[k])) { bad.push('prim' + i + '.' + k); } });
    if (p.pts) { p.pts.forEach((q, j) => { [q.a, q.l, q.r].forEach(v => { if (!isFinite(v[0]) || !isFinite(v[1])) { bad.push('prim' + i + '.pt' + j); } }); }); }
  });
  L.regions.forEach((r, i) => { ['x', 'y', 'w', 'a', 'd'].forEach(k => { if (!isFinite(r[k])) { bad.push('region' + i + '.' + k); } }); });
  return bad;
}
module.exports = { makeT, layoutFinite };
