/* ScriptUI mock: enough of Window / controls / graphics to construct the whole
 * editor UI in Node and fire its event handlers. show() returns immediately so
 * tests can drive the dialog programmatically. Visual appearance is NOT
 * verified by this mock. */
'use strict';

let counter = 0;
class Control {
  constructor(type, parent, text, props) {
    this.type = type; this.parent = parent; this.children = []; this.text = text === undefined ? '' : (Array.isArray(text) ? '' : String(text));
    this.properties = props || {}; this.preferredSize = { width: 0, height: 0 }; this.size = { width: 400, height: 150 };
    this.visible = true; this.enabled = true; this.helpTip = ''; this.value = false; this.listeners = {};
    this.items = []; this.selection = null; this.id = ++counter;
    this.graphics = new Graphics();
    if (type === 'dropdownlist' || type === 'listbox') { if (Array.isArray(text)) { text.forEach(t => this.add('item', t)); } }
    Object.defineProperty(this, 'selection', {
      get: () => this._sel || null,
      set: (v) => {
        if (typeof v === 'number') { v = this.items[v] || null; }
        if (this.type === 'tabbedpanel' && typeof v === 'object' && v) { this._sel = v; return; }
        this._sel = v;
      }
    });
  }
  add(type, bounds, text, props) {
    let c;
    if (type === 'item' || type === 'node') {
      c = new Item(type, this, bounds);   /* ScriptUI: add('item', text) */
      const host = this.type === 'node' || this.type === 'treeview' ? this : this;
      host.items.push(c);
      c.index = host.items.length - 1;
      return c;
    }
    c = new Control(type, this, text, props);
    this.children.push(c);
    return c;
  }
  remove(x) { const i = this.children.indexOf(x); if (i >= 0) { this.children.splice(i, 1); } }
  removeAll() { this.items = []; this._sel = null; }
  addEventListener(name, fn) { (this.listeners[name] = this.listeners[name] || []).push(fn); }
  notify(ev) { if (typeof this[ev || 'onClick'] === 'function') { this[ev || 'onClick'](); } }
  hide() { this.visible = false; }
  show() { this.visible = true; if (this.onDraw) { this.onDraw(); } return 1; }
  close() { if (this.onClose) { this.onClose(); } }
  find(pred) { if (pred(this)) { return this; } for (const c of this.children) { const r = c.find(pred); if (r) { return r; } } return null; }
  findAll(pred, out) { out = out || []; if (pred(this)) { out.push(this); } for (const c of this.children) { c.findAll(pred, out); } return out; }
}
class Item {
  constructor(type, parent, text) { this.type = type; this.parent = parent; this.text = String(text); this.items = []; this.expanded = false; this.subItems = []; const n = (parent.properties && parent.properties.numberOfColumns) || 1; for (let i = 1; i < n; i++) { this.subItems.push({ text: '' }); } }
  add(type, text) { const c = new Item(type, this, text); this.items.push(c); return c; }
}
class Graphics {
  constructor() { this.calls = []; this.font = null; this.BrushType = { SOLID_COLOR: 0 }; this.PenType = { SOLID_COLOR: 0 }; }
  newBrush(t, c) { return { t, c }; }
  newPen(t, c, w) { return { t, c, w }; }
  newPath() { this.calls.push(['newPath']); }
  moveTo(x, y) { this.calls.push(['moveTo', x, y]); this._num(x, y); }
  lineTo(x, y) { this.calls.push(['lineTo', x, y]); this._num(x, y); }
  rectPath(x, y, w, h) { this.calls.push(['rect', x, y, w, h]); this._num(x, y, w, h); }
  closePath() { this.calls.push(['closePath']); }
  fillPath(b) { this.calls.push(['fill']); }
  strokePath(p) { this.calls.push(['stroke']); }
  drawString(s, pen, x, y, font) { this.calls.push(['text', s, x, y]); this._num(x, y); }
  measureString(s, font) { const size = (font && font.size) || 12; return [Array.from(String(s)).length * 0.55 * size, size * 1.2]; }
  _num() { for (const a of arguments) { if (typeof a !== 'number' || !isFinite(a)) { throw new Error('Non-finite graphics coordinate: ' + a); } } }
}
class Window extends Control {
  constructor(type, title) { super('window', null, title); this.windowType = type; this.shown = 0; this.layout = { layout() {}, resize() {} }; }
  show() { this.shown++; this.drawAll(); return 1; }
  drawAll() { this.findAll(c => typeof c.onDraw === 'function').forEach(c => c.onDraw()); }
}

function install(sandbox, ui) {
  ui = ui || {};
  const log = { alerts: [], confirms: [], prompts: [], dialogs: [] };
  sandbox.Window = function (type, title, b, props) {
    const w = new Window(type, title);
    if (Window.instances) { Window.instances.push(w); }
    if (type === 'dialog' && log.root) { log.dialogs.push(w); w.show = function () { this.shown++; return 1; }; }
    if (!log.root) { log.root = w; }
    return w;
  };
  Window.instances = [];
  sandbox.ScriptUI = { newFont(name, style, size) { return { name, style, size: size || 12, family: name }; } };
  sandbox.alert = (m) => { log.alerts.push(String(m)); };
  sandbox.confirm = (m) => { log.confirms.push(String(m)); return ui.confirm === undefined ? true : ui.confirm; };
  sandbox.prompt = (m, d) => { log.prompts.push(String(m)); const r = ui.prompts && ui.prompts.length ? ui.prompts.shift() : d; return r; };
  return log;
}
module.exports = { install, Control, Window, Graphics };
