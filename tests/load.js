/* Loads the built release script into a sandbox with MSEE_TEST_MODE=true and returns MSEE. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { build } = require('../tools/build.js');

/* Removes ES5+ built-ins from the sandbox so the script runs against an
   ExtendScript-like (ES3) standard library. Any accidental use throws. */
const ES3_PRELUDE = `
(function (g) {
  var del = function (o, names) { for (var i = 0; i < names.length; i++) { try { delete o[names[i]]; } catch (e) {} } };
  del(Array.prototype, ['indexOf','lastIndexOf','forEach','map','filter','some','every','reduce','reduceRight','find','findIndex','includes','fill','keys','values','entries','flat','flatMap','at']);
  del(Array, ['isArray','from','of']);
  del(String.prototype, ['trim','trimLeft','trimRight','trimStart','trimEnd','startsWith','endsWith','includes','repeat','padStart','padEnd','codePointAt','normalize','at','replaceAll']);
  del(String, ['fromCodePoint','raw']);
  del(Object, ['keys','create','defineProperty','defineProperties','getPrototypeOf','setPrototypeOf','freeze','seal','assign','entries','values','getOwnPropertyNames','is']);
  del(Date, ['now']); del(Date.prototype, ['toISOString','toJSON']);
  del(Function.prototype, ['bind']);
  del(Number, ['isFinite','isNaN','isInteger','parseFloat','parseInt','EPSILON']);
  del(Math, ['sign','trunc','log10','log2','hypot','cbrt','expm1','log1p','fround','clz32','imul']);
  del(g, ['JSON','Map','Set','WeakMap','WeakSet','Promise','Symbol','Proxy','Reflect','globalThis']);
})(this);
`;

function load(extraGlobals) {
  const code = build().out.replace(/^#(target|targetengine).*$/gm, '');
  const sandbox = Object.assign({ MSEE_TEST_MODE: true }, extraGlobals || {});
  sandbox.$ = sandbox.$ || { writeln: () => {}, global: sandbox, os: 'Node test', locale: 'en_US' };
  const es3 = !!sandbox.__es3;
  delete sandbox.__es3;
  vm.createContext(sandbox);
  if (es3) { vm.runInContext(ES3_PRELUDE, sandbox, { filename: 'es3-prelude.js' }); }
  vm.runInContext(code, sandbox, { filename: 'release.jsx' });
  if (!sandbox.MSEE) { throw new Error('MSEE was not exported in test mode'); }
  return sandbox.MSEE;
}
module.exports = { load };
