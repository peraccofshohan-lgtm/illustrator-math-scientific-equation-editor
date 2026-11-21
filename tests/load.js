/* Loads the built release script into a sandbox with MSEE_TEST_MODE=true and returns MSEE. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { build } = require('../tools/build.js');

function load(extraGlobals) {
  const code = build().out.replace(/^#(target|targetengine).*$/gm, '');
  const sandbox = Object.assign({ MSEE_TEST_MODE: true }, extraGlobals || {});
  sandbox.$ = sandbox.$ || { writeln: () => {}, global: sandbox, os: 'Node test', locale: 'en_US' };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'release.jsx' });
  if (!sandbox.MSEE) { throw new Error('MSEE was not exported in test mode'); }
  return sandbox.MSEE;
}
module.exports = { load };
