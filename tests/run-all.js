/* Runs every tests/<group>/*.test.js file and writes tests/results/summary.json. */
'use strict';
const fs = require('fs');
const path = require('path');
const { makeT } = require('./harness.js');

const root = __dirname;
const only = process.argv[2] || '';
const groups = fs.readdirSync(root).filter(d => /-tests$/.test(d) && fs.statSync(path.join(root, d)).isDirectory()).sort();
const results = [];
const started = Date.now();
for (const g of groups) {
  const files = fs.readdirSync(path.join(root, g)).filter(f => /\.test\.js$/.test(f)).sort();
  for (const f of files) {
    const name = g + '/' + f.replace(/\.test\.js$/, '');
    if (only && name.indexOf(only) < 0) { continue; }
    const t = makeT(name, results);
    try { require(path.join(root, g, f))(t); }
    catch (e) { results.push({ suite: name, name: '(suite crashed)', ok: false, error: e.stack }); }
  }
}
const bySuite = {};
for (const r of results) {
  const s = bySuite[r.suite] = bySuite[r.suite] || { passed: 0, failed: 0 };
  if (r.ok) { s.passed++; } else { s.failed++; }
}
const failed = results.filter(r => !r.ok);
for (const s of Object.keys(bySuite)) { console.log((bySuite[s].failed ? 'FAIL ' : 'ok   ') + s.padEnd(42) + ' ' + bySuite[s].passed + ' passed' + (bySuite[s].failed ? ', ' + bySuite[s].failed + ' failed' : '')); }
for (const f of failed) { console.log('\n\u2717 ' + f.suite + ' :: ' + f.name + '\n' + f.error); }
const summary = { date: new Date().toISOString(), node: process.version, total: results.length, passed: results.length - failed.length, failed: failed.length, ms: Date.now() - started, suites: bySuite, failures: failed.map(f => ({ suite: f.suite, name: f.name })) , tests: results.map(r => ({ suite: r.suite, name: r.name, ok: r.ok })) };
if (!only) { fs.mkdirSync(path.join(root, 'results'), { recursive: true }); fs.writeFileSync(path.join(root, 'results', 'summary.json'), JSON.stringify(summary, null, 1)); }
console.log('\nTOTAL ' + summary.total + '  passed ' + summary.passed + '  failed ' + summary.failed + '  (' + summary.ms + ' ms)');
process.exit(failed.length ? 1 : 0);
