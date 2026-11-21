/* Minimal mock of the Illustrator scripting DOM used by the renderer.
 * It records every object the script creates so tests can assert structure,
 * positions, notes and rollback. It does NOT emulate font rendering: a text
 * frame's width is estimated as 0.55 em per character. This mock verifies
 * script logic only; it is not a substitute for testing in Illustrator. */
'use strict';

function Collection(owner, kind) { this._items = []; this._owner = owner; this._kind = kind; }
Object.defineProperty(Collection.prototype, 'length', { get() { return this._items.length; } });

function makeIndexed(coll) {
  return new Proxy(coll, {
    get(t, k) {
      if (typeof k === 'string' && /^\d+$/.test(k)) { return t._items[+k]; }
      return t[k];
    }
  });
}

class Env {
  constructor(opts) {
    opts = opts || {};
    this.created = 0;
    this.failAt = opts.failAt || 0;          // throw on the Nth created item (rollback tests)
    this.fonts = opts.fonts || ['ArialMT', 'Arial-BoldMT', 'TimesNewRomanPSMT', 'CambriaMath'];
    this.all = [];
  }
  tick(kind) {
    this.created++;
    if (this.failAt && this.created === this.failAt) { throw new Error('Simulated Illustrator failure while creating ' + kind); }
  }
}

class PageItem {
  constructor(env, parent, typename) {
    this._env = env; this.parent = parent; this.typename = typename;
    this.name = ''; this.note = ''; this.hidden = false; this.selected = false; this.removed = false; this.locked = false;
    env.all.push(this);
  }
  remove() {
    if (this.removed) { throw new Error('Object already removed'); }
    this.removed = true;
    const p = this.parent;
    if (p) { for (const c of ['_textFrames', '_pathItems', '_groupItems']) { if (p[c]) { const i = p[c]._items.indexOf(this); if (i >= 0) { p[c]._items.splice(i, 1); } } } }
    for (const c of ['_textFrames', '_pathItems', '_groupItems']) { if (this[c]) { this[c]._items.slice().forEach(k => { k.removed = true; }); } }
  }
  move(target) {
    const p = this.parent;
    for (const c of ['_textFrames', '_pathItems', '_groupItems']) { if (p[c]) { const i = p[c]._items.indexOf(this); if (i >= 0) { p[c]._items.splice(i, 1); } } }
    this.parent = target;
    const key = this.typename === 'TextFrame' ? '_textFrames' : this.typename === 'PathItem' ? '_pathItems' : '_groupItems';
    target[key]._items.unshift(this);
    return this;
  }
  translate(dx, dy) { this._shift(dx, dy); }
  get geometricBounds() { const b = this._bounds(); return [b[0], b[1], b[2], b[3]]; }
}

class Container extends PageItem {
  constructor(env, parent, typename) {
    super(env, parent, typename);
    this._textFrames = new Collection(this, 'TextFrame');
    this._pathItems = new Collection(this, 'PathItem');
    this._groupItems = new Collection(this, 'GroupItem');
    const self = this;
    this._textFrames.pointText = function (pos) { env.tick('text frame'); const t = new TextFrame(env, self, pos); this._items.push(t); return t; };
    this._textFrames.add = function () { return this.pointText([0, 0]); };
    this._pathItems.add = function () { env.tick('path'); const p = new PathItem(env, self); this._items.push(p); return p; };
    this._pathItems.rectangle = function (top, left, w, h) {
      env.tick('rectangle'); const p = new PathItem(env, self);
      p.setEntirePath([[left, top], [left + w, top], [left + w, top - h], [left, top - h]]); p.closed = true; p.isRect = true;
      this._items.push(p); return p;
    };
    this._groupItems.add = function () { env.tick('group'); const g = new GroupItem(env, self); this._items.push(g); return g; };
  }
  get textFrames() { return makeIndexed(this._textFrames); }
  get pathItems() { return makeIndexed(this._pathItems); }
  get groupItems() { return makeIndexed(this._groupItems); }
  get pageItems() { return makeIndexed({ _items: [].concat(this._groupItems._items, this._pathItems._items, this._textFrames._items), get length() { return this._items.length; } }); }
  descendants() { let out = []; for (const c of [].concat(this._groupItems._items, this._pathItems._items, this._textFrames._items)) { out.push(c); if (c.descendants) { out = out.concat(c.descendants()); } } return out; }
  _shift(dx, dy) { for (const c of [].concat(this._groupItems._items, this._pathItems._items, this._textFrames._items)) { c._shift(dx, dy); } }
  _bounds() {
    const kids = [].concat(this._groupItems._items, this._pathItems._items, this._textFrames._items);
    if (!kids.length) { return [0, 0, 0, 0]; }
    let l = Infinity, t = -Infinity, r = -Infinity, b = Infinity;
    kids.forEach(k => { const q = k._bounds(); l = Math.min(l, q[0]); t = Math.max(t, q[1]); r = Math.max(r, q[2]); b = Math.min(b, q[3]); });
    return [l, t, r, b];
  }
}
class GroupItem extends Container { constructor(env, parent) { super(env, parent, 'GroupItem'); } }

class Layer extends Container {
  constructor(env, parent, name) { super(env, parent, 'Layer'); this.name = name; this.visible = true; }
}

class TextFrame extends PageItem {
  constructor(env, parent, pos) {
    super(env, parent, 'TextFrame');
    this.anchor = [pos[0], pos[1]];
    this.contents = '';
    this.outlined = false;
    const tf = this;
    this.characterAttributes = { size: 12, textFont: null, fillColor: null, tracking: 0, kerningMethod: null };
    this.runs = [];
    this.textRange = { characterAttributes: this.characterAttributes };
    this.characters = { add(contents) { tf.contents += contents; const ca = { size: 12, textFont: null, fillColor: null }; tf.runs.push({ contents, characterAttributes: ca }); return { characterAttributes: ca }; } };
  }
  get width() { return Array.from(this.contents).length * 0.55 * (this.characterAttributes.size || 12); }
  createOutline() { if (this.removed) { throw new Error('removed'); } this.outlined = true; const g = new GroupItem(this._env, this.parent); this.parent._groupItems._items.push(g); g.name = this.name; this.remove(); return g; }
  _shift(dx, dy) { this.anchor = [this.anchor[0] + dx, this.anchor[1] + dy]; }
  _bounds() { const s = this.characterAttributes.size || 12; return [this.anchor[0], this.anchor[1] + 0.75 * s, this.anchor[0] + this.width, this.anchor[1] - 0.25 * s]; }
}

class PathItem extends PageItem {
  constructor(env, parent) { super(env, parent, 'PathItem'); this.points = []; this.closed = false; this.filled = false; this.stroked = false; }
  setEntirePath(pts) {
    for (const p of pts) { if (!isFinite(p[0]) || !isFinite(p[1])) { throw new Error('Invalid point ' + p); } }
    this.points = pts.map(p => [p[0], p[1]]);
    this.pathPoints = makeIndexed({ _items: this.points.map(a => ({ anchor: a, leftDirection: a, rightDirection: a, pointType: null })), get length() { return this._items.length; } });
  }
  _shift(dx, dy) { this.points = this.points.map(p => [p[0] + dx, p[1] + dy]); }
  _bounds() { let l = Infinity, t = -Infinity, r = -Infinity, b = Infinity; this.points.forEach(p => { l = Math.min(l, p[0]); r = Math.max(r, p[0]); t = Math.max(t, p[1]); b = Math.min(b, p[1]); }); return [l, t, r, b]; }
}

class Document {
  constructor(env, opts) {
    opts = opts || {};
    this.typename = 'Document';
    this.name = opts.name || 'Untitled-1';
    this.documentColorSpace = opts.cmyk ? 'CMYK' : 'RGB';
    this._layers = [new Layer(env, this, 'Layer 1')];
    this.activeLayer = this._layers[0];
    this.selection = [];
    this.views = [{ centerPoint: opts.center || [300, -400] }];
    const rect = opts.artboard || [0, 0, 612, -792];
    this.artboards = makeIndexed({ _items: [{ artboardRect: rect }], get length() { return 1; }, getActiveArtboardIndex() { return 0; } });
  }
  get layers() { return makeIndexed({ _items: this._layers, get length() { return this._items.length; } }); }
}

function install(sandbox, opts) {
  opts = opts || {};
  const env = new Env(opts);
  const docs = [];
  const app = {
    version: opts.version || '29.0.0',
    get documents() { return { length: docs.length }; },
    get activeDocument() { if (!docs.length) { throw new Error('There is no document'); } return docs[0]; },
    textFonts: { getByName(n) { if (env.fonts.indexOf(n) < 0) { throw new Error('No such font ' + n); } return { name: n }; } },
    redraw() {},
    coordinateSystem: 1
  };
  if (!opts.noDocument) { docs.push(new Document(env, opts)); }
  Object.assign(sandbox, {
    app,
    RGBColor: function () { this.typename = 'RGBColor'; },
    CMYKColor: function () { this.typename = 'CMYKColor'; },
    DocumentColorSpace: { RGB: 'RGB', CMYK: 'CMYK' },
    PointType: { CORNER: 'CORNER', SMOOTH: 'SMOOTH' },
    StrokeCap: { ROUNDENDCAP: 1, BUTTENDCAP: 0 },
    StrokeJoin: { ROUNDENDJOIN: 1, MITERENDJOIN: 0 },
    ElementPlacement: { PLACEATBEGINNING: 'PLACEATBEGINNING' },
    AutoKernType: { NOAUTOKERN: 0 }
  });
  return { env, app, docs, newDocument: (o) => { const d = new Document(env, o); docs.unshift(d); return d; } };
}

module.exports = { install, Document, Layer, GroupItem, TextFrame, PathItem };
