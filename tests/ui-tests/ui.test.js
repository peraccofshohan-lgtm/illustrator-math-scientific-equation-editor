/* UI wiring tests: the complete ScriptUI dialog is constructed against a
 * ScriptUI mock and an Illustrator DOM mock, and real handlers are fired.
 * These verify script logic and wiring only - not on-screen appearance. */
'use strict';
const sui = require('../mocks/scriptui.js');
const ai = require('../mocks/illustrator.js');

function boot(opts) {
  opts = opts || {};
  const sandbox = {};
  const log = sui.install(sandbox, opts.ui);
  const aienv = ai.install(sandbox, opts.ai);
  const { load } = require('../load.js');
  const M = load(sandbox);
  const adapter = M.Store.MemoryAdapter();
  if (opts.files) { Object.assign(adapter.files, opts.files); }
  if (opts.before) { opts.before(M, aienv); }
  M.UI.launch({ adapter });
  return { M, UI: M.UI, log, ai: aienv, adapter, win: log.root };
}
function buttons(win, text) { return win.findAll(c => c.type === 'button' && c.text === text); }
function click(win, text, idx) {
  const b = buttons(win, text);
  if (!b.length) { throw new Error('No button "' + text + '"'); }
  b[idx || 0].onClick();
}
function tabText(ctl) { let p = ctl; while (p && p.type !== 'tab') { p = p.parent; } return p ? p.text : null; }
function buttonIn(win, tab, text) {
  const b = win.findAll(c => c.type === 'button' && c.text === text && tabText(c) === tab);
  if (!b.length) { throw new Error('No button "' + text + '" in tab ' + tab); }
  return b[0];
}

module.exports = function (t) {
  t.test('dialog builds with title, attribution and all 11 tabs', () => {
    const { win, log } = boot();
    t.eq(log.alerts, [], 'no startup alerts');
    t.ok(/Math & Scientific Equation Editor/.test(win.text), 'window title');
    t.ok(/Created by Shohan Khan/.test(win.text), 'attribution in title');
    const tabs = win.findAll(c => c.type === 'tab').map(c => c.text);
    ['Home', 'Symbols', 'Equation Builder', 'Direct Input', 'Templates', 'Formula Library', 'Favorites', 'Recent', 'Formatting', 'Settings', 'Help / About']
      .forEach(n => t.ok(tabs.indexOf(n) >= 0, 'tab ' + n));
    t.ok(win.find(c => c.type === 'statictext' && /Created by Shohan Khan/.test(c.text)), 'attribution label');
    t.eq(win.shown, 1);
  });

  t.test('no decorative buttons: every button has a handler and a tooltip', () => {
    const { win } = boot();
    const all = win.findAll(c => c.type === 'button');
    t.ok(all.length > 100, 'expected many buttons, got ' + all.length);
    const dead = all.filter(b => typeof b.onClick !== 'function' && !(b.properties && b.properties.name));
    t.eq(dead.map(b => b.text), [], 'buttons without onClick');
    const noTip = all.filter(b => !b.helpTip && typeof b.onClick === 'function');
    t.eq(noTip.map(b => b.text), [], 'buttons without tooltip');
  });

  t.test('direct input -> model -> preview drawn with finite coordinates', () => {
    const { win, UI } = boot();
    UI.c.src.text = '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}';
    UI.c.src.onChanging();
    t.eq(UI.model.latex(), '\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}');
    t.ok(/Valid/.test(UI.c.srcErr.text));
    UI.c.pv.graphics.calls = [];
    UI.c.pv.onDraw();
    t.ok(UI.c.pv.graphics.calls.some(c => c[0] === 'text'), 'glyphs drawn');
    t.ok(UI.c.pv.graphics.calls.some(c => c[0] === 'fill'), 'rules/paths filled');
    t.ok(UI.lastLayout && UI.lastLayout.width > 0);
    t.ok(UI.c.tree.items.length > 0, 'structure tree populated');
  });

  t.test('direct input syntax error shows line, column and caret', () => {
    const { UI } = boot();
    UI.c.src.text = 'x + 1\n\\frac{a}{';
    buttonIn(UI.win, 'Direct Input', 'Apply').onClick();
    t.ok(/Line 2, column/.test(UI.c.srcErr.text), UI.c.srcErr.text);
    t.ok(/\^/.test(UI.c.srcErr.text));
    t.eq(UI.model.root.items.length, 0, 'model unchanged after error');
  });

  t.test('symbol browser search, insert, favorite and recent', () => {
    const { UI, win } = boot();
    UI.c.symSearch.text = 'alpha';
    UI.c.symSearch.onChanging();
    t.ok(UI.c.symList.items.length >= 1);
    UI.c.symList.selection = 0;
    UI.c.symList.onChange();
    t.ok(/Alpha/i.test(UI.c.symDesc.text));
    UI.c.symList.onDoubleClick();
    t.ok(/alpha/.test(UI.model.latex()), UI.model.latex());
    UI.c.symFav.onClick();
    t.eq(UI.lib.data.favoriteSymbols.length, 1);
    t.ok(UI.lib.data.recentSymbols.length >= 1);
    UI.refreshFavorites();
    t.eq(UI.c.favS.items.length, 1);
    UI.c.symCat.selection = 3; UI.c.symSearch.text = ''; UI.c.symCat.onChange();
    t.ok(UI.c.symList.items.length > 5, 'category filter lists symbols');
  });

  t.test('equation builder inserts every structure button without error', () => {
    const { UI, win, log } = boot();
    const tab = 'Insert Structure';
    const labels = ['Fraction', '\u221A Root', '\u221B nth Root', 'x\u00B2 Superscript', 'x\u2082 Subscript', '( )', '[ ]', '\u2211 Sum', 'Binomial', 'Vector \u20D7', 'Box', 'Text',
      'Insert Matrix', 'Column Vector', 'Piecewise (cases)', 'Aligned Equations'];
    labels.forEach(l => { UI.model.clear(); buttonIn(win, tab, l).onClick(); t.ok(UI.model.root.items.length > 0, l + ' inserted something'); });
    UI.model.clear();
    for (let i = 0; i < UI.c.intDD.items.length; i++) { UI.c.intDD.selection = i; win.findAll(c => c.type === 'button' && c.text === 'Insert' && tabText(c) === 'Insert Structure')[0].onClick(); }
    for (let i = 0; i < UI.c.derDD.items.length; i++) { UI.c.derDD.selection = i; win.findAll(c => c.type === 'button' && c.text === 'Insert' && tabText(c) === 'Insert Structure')[2].onClick(); }
    t.eq(log.alerts, [], 'no error alerts');
    t.ok(UI.model.root.items.length > 10);
    t.ok(UI.lastLayout && UI.lastLayout.width > 0);
  });

  t.test('matrix size validation rejects 0 and 101', () => {
    const { UI, win } = boot();
    UI.c.mxR.text = '0';
    buttonIn(win, 'Insert Structure', 'Insert Matrix').onClick();
    t.ok(/whole numbers from 1 to 100/.test(UI.c.status.text), UI.c.status.text);
    UI.c.mxR.text = '3'; UI.c.mxC.text = '4'; UI.c.mxEnv.selection = 3;
    buttonIn(win, 'Insert Structure', 'Insert Matrix').onClick();
    t.ok(/vmatrix/.test(UI.model.latex()));
  });

  t.test('selection: preview click selects, element ops, wrap, delete, undo/redo', () => {
    const { UI, win } = boot();
    UI.model.setLatex('a+b');
    const L = UI.lastLayout;
    UI.c.pv.onDraw();
    const reg = L.regions.filter(r => r.depth > 0).sort((p, q) => p.w * (p.a + p.d) - q.w * (q.a + q.d))[0];
    const tr = UI.lastTransform;
    t.ok(tr && typeof tr.toLayout === 'function', 'transform returned');
    /* find screen point mapping to the middle of the smallest region by inverting numerically */
    let hitId = null;
    for (let x = 0; x < 400 && !hitId; x += 1) {
      for (let y = 0; y < 150 && !hitId; y += 2) {
        const p = tr.toLayout(x, y);
        if (p[0] > reg.x + reg.w * 0.3 && p[0] < reg.x + reg.w * 0.7 && Math.abs(p[1] - (reg.a - reg.d) / 2 - reg.y) < 1) { UI.c.pv.listeners.mousedown[0]({ clientX: x, clientY: y }); hitId = UI.model.selection; }
      }
    }
    t.ok(hitId, 'clicking the preview selected an element');
    UI.c.wrapDD.selection = UI.c.wrapKeys.indexOf('sqrt');
    buttonIn(win, 'Selected Element', 'Wrap').onClick();
    t.ok(/\\sqrt/.test(UI.model.latex()), UI.model.latex());
    click(win, '\u21B6 Undo');
    t.eq(UI.model.latex(), 'a+b');
    click(win, 'Redo \u21B7');
    t.ok(/\\sqrt/.test(UI.model.latex()));
    UI.model.select(UI.model.root.items[0].id);
    buttonIn(win, 'Selected Element', 'Delete').onClick();
    t.ok(!/^a/.test(UI.model.latex()), UI.model.latex());
  });

  t.test('selected element content edit and per-element formatting', () => {
    const { UI, win } = boot();
    UI.model.setLatex('x+y');
    UI.model.select(UI.model.root.items[0].id);
    t.eq(UI.c.selSrc.text, 'x');
    UI.c.selSrc.text = '\\frac{1}{2}';
    buttonIn(win, 'Selected Element', 'Apply').onClick();
    t.eq(UI.model.latex(), '\\frac{1}{2}+y');
    UI.model.select(UI.model.root.items[2].id);
    UI.c.efColor.text = 'red'; UI.c.efScale.text = '1.5';
    click(win, 'Apply to Selection');
    t.ok(/\\style\{[^}]*color=#E00000/.test(UI.model.latex()), UI.model.latex());
    UI.c.efScale.text = '50';
    click(win, 'Apply to Selection');
    t.ok(/Scale must be between/.test(UI.c.status.text));
    click(win, 'Clear');
    t.eq(UI.model.latex(), '\\frac{1}{2}+y');
  });

  t.test('chemistry balance, molar mass and element lookup', () => {
    const { UI, win } = boot();
    UI.c.chemIn.text = 'Fe + O2 -> Fe2O3';
    click(win, 'Balance');
    t.ok(/4Fe \+ 3O2 -> 2Fe2O3/.test(UI.c.chemOut.text), UI.c.chemOut.text);
    click(win, 'Balance && Insert');
    t.ok(/\\ce\{4Fe/.test(UI.model.latex()));
    UI.c.chemIn.text = 'H2SO4';
    click(win, 'Molar Mass');
    t.ok(/98\.0/.test(UI.c.chemOut.text), UI.c.chemOut.text);
    UI.c.elSearch.text = 'gold'; UI.c.elSearch.onChanging(); UI.c.elDD.onChange();
    t.ok(/Gold \(Au\)\s+Z = 79/.test(UI.c.elInfo.text), UI.c.elInfo.text);
    UI.c.chemIn.text = 'H2 + O2 -> H2O2 + H2O';
    click(win, 'Balance');
    t.ok(/\u26A0/.test(UI.c.status.text), 'ambiguous reaction reported: ' + UI.c.status.text);
  });

  t.test('templates: browse, search, use, insert, custom template save/delete', () => {
    const { UI, win, log } = boot({ ui: { prompts: ['My Euler', 'Mine'] } });
    t.ok(UI.c.tplList.items.length > 300);
    UI.c.tplSearch.text = 'pythagorean'; UI.c.tplSearch.onChanging();
    t.ok(UI.c.tplList.items.length >= 1);
    UI.c.tplList.selection = 0; UI.c.tplList.onChange();
    t.ok(/Pythag/i.test(UI.c.tplInfo.text));
    click(win, 'Use Template (replace)');
    t.ok(UI.model.root.items.length > 0);
    t.ok(UI.model.name.length > 0);
    UI.model.setLatex('e^{i\\pi}+1=0');
    click(win, 'Save Current as My Template');
    t.eq(UI.lib.data.templates.length, 1);
    UI.c.tplCat.selection = 1; UI.c.tplSearch.text = ''; UI.c.tplCat.onChange();
    t.eq(UI.c.tplList.items.length, 1);
    UI.c.tplList.selection = 0;
    click(win, 'Delete My Template');
    t.eq(UI.lib.data.templates.length, 0);
    t.ok(log.confirms.length >= 1, 'delete asked for confirmation');
  });

  t.test('formula library: save, rename, duplicate, favorite, delete, persistence', () => {
    const { UI, win, adapter } = boot({ ui: { prompts: ['Energy', 'Physics', 'Energy relation', 'Relativity'] } });
    UI.model.setLatex('E=mc^2');
    click(win, 'Save to Library');
    t.eq(UI.lib.data.formulas.length, 1);
    t.ok(adapter.files['library.json'] && /E=mc\^\{2\}/.test(adapter.files['library.json']), 'saved to disk');
    UI.refreshLibrary();
    UI.c.libList.selection = 0;
    buttonIn(win, 'Formula Library', 'Rename\u2026').onClick();
    t.eq(UI.lib.data.formulas[0].name, 'Energy relation');
    t.eq(UI.lib.data.formulas[0].category, 'Relativity');
    buttonIn(win, 'Formula Library', 'Duplicate').onClick();
    t.eq(UI.lib.data.formulas.length, 2);
    UI.c.libList.selection = 0;
    buttonIn(win, 'Formula Library', '\u2605 Favorite').onClick();
    UI.refreshFavorites();
    t.eq(UI.c.favF.items.length, 1);
    UI.c.libSearch.text = 'copy'; UI.c.libSearch.onChanging();
    t.eq(UI.c.libList.items.length, 1);
    UI.c.libList.selection = 0;
    buttonIn(win, 'Formula Library', 'Delete').onClick();
    t.eq(UI.lib.data.formulas.length, 1);
    UI.model.clear();
    UI.c.libSearch.text = ''; UI.refreshLibrary(); UI.c.libList.selection = 0;
    buttonIn(win, 'Formula Library', 'Load').onClick();
    t.eq(UI.model.latex(), 'E=mc^{2}');
  });

  t.test('formatting tab applies valid values and rejects invalid ones', () => {
    const { UI, win } = boot();
    UI.model.setLatex('x^2');
    UI.c.fmt.fontSize.text = '36';
    UI.c.fmt.color.text = 'navy';
    click(win, 'Apply Formatting');
    t.eq(UI.model.settings.fontSize, 36);
    t.eq(UI.model.settings.color, '#001F7A', 'named color navy');
    UI.c.fmt.fontSize.text = '99999';
    click(win, 'Apply Formatting');
    t.eq(UI.model.settings.fontSize, 36, 'invalid size not applied');
    t.ok(/Not applied/.test(UI.c.fmtMsg.text));
    click(win, 'Reset Defaults');
    t.eq(UI.model.settings.fontSize, 24);
    click(win, 'Apply Preset');
    t.ok(UI.model.settings.fontSize > 0);
  });

  t.test('insert into the mock document and re-edit workflow', () => {
    const r = boot();
    const { UI, win, ai } = r;
    UI.model.setLatex('\\frac{a}{b}');
    click(win, 'Insert Equation');
    const layer = ai.docs[0].activeLayer;
    t.eq(layer.groupItems.length, 1);
    const g = layer.groupItems[0];
    t.ok(/^MSEE:1:/.test(g.note));
    t.ok(/Equation inserted/.test(UI.c.status.text), UI.c.status.text);
    t.eq(win.find(c => c.type === 'button' && c.text === 'Update Equation') !== null, true, 'button switches to Update');
    UI.model.setLatex('\\frac{a}{c}');
    click(win, 'Update Equation');
    t.eq(layer.groupItems.length, 1, 'replaced in place');
    t.ok(/a\}\{c/.test(layer.groupItems[0].note));
    t.eq(UI.lib.data.recentFormulas.length, 2);
    /* relaunch with the group selected -> loads for editing */
    const r2 = boot({ before: (M, env) => { const d = env.docs[0]; const gg = d.activeLayer.groupItems.add(); gg.note = M.Renderer.encodeNote('x^{2}', M.Formatting.defaults(), 'group'); d.selection = [gg.textFrames.pointText([0, 0])]; } });
    t.eq(r2.UI.model.latex(), 'x^{2}');
    t.ok(r2.UI.model.editing, 'editing mode');
    t.ok(/Editing the selected equation/.test(r2.UI.c.status.text));
  });

  t.test('insert without a document reports a clear error', () => {
    const { UI, win, log } = boot({ ai: { noDocument: true } });
    UI.model.setLatex('x');
    click(win, 'Insert Equation');
    t.ok(/No document is open/.test(UI.c.status.text), UI.c.status.text);
    t.ok(log.alerts.some(a => /No document is open/.test(a)));
  });

  t.test('keyboard shortcuts: Ctrl+Z / Ctrl+Y outside text fields, Ctrl+Enter inserts', () => {
    const { UI, win, ai } = boot();
    UI.model.setLatex('a');
    UI.model.setLatex('b');
    const key = (k, extra) => win.listeners.keydown[0](Object.assign({ keyName: k, ctrlKey: true, metaKey: false, shiftKey: false, target: { type: 'button' }, preventDefault() {} }, extra || {}));
    key('Z');
    t.eq(UI.model.latex(), 'a');
    key('Y');
    t.eq(UI.model.latex(), 'b');
    key('Z', { target: { type: 'edittext' } });
    t.eq(UI.model.latex(), 'b', 'undo shortcut ignored inside text fields');
    key('Enter');
    t.eq(ai.docs[0].activeLayer.groupItems.length, 1);
  });

  t.test('global search finds symbols, templates and formulas', () => {
    const { UI, win } = boot();
    UI.c.gsearch.text = 'integral';
    click(win, 'Search');
    const kinds = UI.c.gresults.items.map(i => i.text);
    t.ok(kinds.indexOf('Symbol') >= 0 && kinds.indexOf('Template') >= 0, kinds.slice(0, 5).join(','));
    UI.c.gresults.selection = kinds.indexOf('Template');
    click(win, 'Use Selected Result');
    t.ok(/\\int/.test(UI.model.latex()));
  });

  t.test('corrupt library file: UI still starts and reports recovery', () => {
    const { UI, log } = boot({ files: { 'library.json': '{ this is not json' } });
    t.eq(log.alerts, []);
    t.ok(/unreadable|could not be read|recovered|corrupt|backup/i.test(UI.c.status.text + ' ' + (UI.lib.lastError || '')), UI.c.status.text);
    t.eq(UI.lib.data.formulas.length, 0);
  });

  t.test('settings: history size validation, preferences persist on close', () => {
    const { UI, win, adapter } = boot();
    UI.c.setHist.text = '3';
    buttonIn(win, 'Settings', 'Set').onClick();
    t.ok(/between 5 and 1000/.test(UI.c.status.text));
    UI.c.setHist.text = '50';
    buttonIn(win, 'Settings', 'Set').onClick();
    t.eq(UI.model.history.limit, 50);
    UI.c.setPos.selection = 1; UI.c.setPos.onChange();
    win.close();
    t.ok(/"position": ?"artboard"/.test(adapter.files['library.json']), 'position saved');
    t.ok(/"historyLimit": ?50/.test(adapter.files['library.json']));
  });

  t.test('help text documents syntax, shortcuts and re-editing', () => {
    const { UI } = boot();
    const h = UI.c.help.text;
    ['\\frac', 'Ctrl/Cmd+Enter', 'RE-EDITING', 'STIX Two Math', 'never executed'].forEach(s => t.ok(h.indexOf(s) >= 0, s));
  });
  t.test('home quick-start buttons switch tabs using tab objects', () => {
    const { UI, win } = boot();
    click(win, 'Type Syntax');
    t.eq(UI.c.tabs.selection.text, 'Direct Input');
    click(win, 'Browse Templates');
    t.eq(UI.c.tabs.selection.text, 'Templates');
  });
};
