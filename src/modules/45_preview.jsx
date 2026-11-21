/* ==========================================================================
 * Module 45 - ScriptUI preview renderer
 * Draws the SAME layout primitives that the Illustrator renderer inserts,
 * onto a ScriptUI custom-drawn control. Bezier segments are flattened to
 * line segments because ScriptUI graphics only provide straight paths.
 * Text widths in the preview are measured with ScriptUI's measureString
 * when available (otherwise the built-in tables), so spacing in the
 * preview tracks the on-screen font closely.
 * ========================================================================== */
var PreviewRenderer = {};
PreviewRenderer.PAD = 14;
PreviewRenderer.fontCache = {};

PreviewRenderer.uiFont = function (family, bold, italic, sizePx) {
    var style = bold && italic ? 'BOLDITALIC' : bold ? 'BOLD' : italic ? 'ITALIC' : 'REGULAR', key, size = Math.max(1, Math.round(sizePx)), f;
    if (size > 400) { size = 400; }
    key = family + '|' + style + '|' + size;
    if (PreviewRenderer.fontCache[key]) { return PreviewRenderer.fontCache[key]; }
    try { f = ScriptUI.newFont(family || 'Times New Roman', style, size); } catch (e) {
        try { f = ScriptUI.newFont('dialog', style, size); } catch (e2) { f = null; }
    }
    PreviewRenderer.fontCache[key] = f;
    return f;
};
PreviewRenderer.familyFor = function (plan, face) {
    if (face === 'text') { return plan.text || 'Times New Roman'; }
    if (face === 'sans') { return plan.sans || 'Arial'; }
    if (face === 'mono') { return plan.mono || 'Courier New'; }
    return plan.math || plan.text || 'Times New Roman';
};
/* Metrics using ScriptUI measureString on a control's graphics. */
PreviewRenderer.Metrics = function (graphics, plan) {
    var cache = {}, self = { name: 'scriptui' };
    self.measure = function (text, size, face, bold, italic, override) {
        var approx = Layout.ApproxMetrics.measure(text, size, face, bold, italic), key = face + bold + italic + (override || '') + '|' + text, f, m;
        if (!U.has(cache, key)) {
            cache[key] = null;
            try {
                f = PreviewRenderer.uiFont(override || PreviewRenderer.familyFor(plan, face), bold, italic, 100);
                if (f && graphics && graphics.measureString && !/^\s+$/.test(text)) {
                    m = graphics.measureString(text, f);
                    if (m && m[0] > 0) { cache[key] = m[0] / 100; }
                }
            } catch (e) { cache[key] = null; }
        }
        return { w: cache[key] === null ? approx.w : cache[key] * size, a: approx.a, d: approx.d };
    };
    return self;
};
PreviewRenderer.color = function (hex, alpha) {
    var c = U.hexToRgb(hex || '#000000');
    return [c[0] / 255, c[1] / 255, c[2] / 255, alpha === undefined ? 1 : alpha];
};
/* Compute the transform used for drawing and hit testing. */
PreviewRenderer.transform = function (layout, w, h, zoom, fit) {
    var b = Layout.bounds(layout), bw = Math.max(1, b.right - b.left), bh = Math.max(1, b.top - b.bottom), pad = PreviewRenderer.PAD, sc;
    if (fit) { sc = Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh, 4); }
    else { sc = zoom; }
    if (!(sc > 0)) { sc = 1; }
    return {
        sc: sc, b: b,
        ox: Math.max(pad, (w - bw * sc) / 2), oy: Math.max(pad, (h - bh * sc) / 2),
        X: function (x) { return this.ox + (x - b.left) * sc; },
        Y: function (y) { return this.oy + (b.top - y) * sc; },
        toLayout: function (px, py) { return [(px - this.ox) / sc + b.left, b.top - (py - this.oy) / sc]; }
    };
};
PreviewRenderer.flatten = function (p, T) {
    var out = [], i, a, c, s, t, mt, x, y, steps;
    out.push([T.X(p.pts[0].a[0]), T.Y(p.pts[0].a[1])]);
    function seg(a, c) {
        var straight = a.r[0] === a.a[0] && a.r[1] === a.a[1] && c.l[0] === c.a[0] && c.l[1] === c.a[1];
        steps = straight ? 1 : 12;
        for (s = 1; s <= steps; s++) {
            t = s / steps; mt = 1 - t;
            x = mt * mt * mt * a.a[0] + 3 * mt * mt * t * a.r[0] + 3 * mt * t * t * c.l[0] + t * t * t * c.a[0];
            y = mt * mt * mt * a.a[1] + 3 * mt * mt * t * a.r[1] + 3 * mt * t * t * c.l[1] + t * t * t * c.a[1];
            out.push([T.X(x), T.Y(y)]);
        }
    }
    for (i = 1; i < p.pts.length; i++) { seg(p.pts[i - 1], p.pts[i]); }
    if (p.closed) { seg(p.pts[p.pts.length - 1], p.pts[0]); }
    return out;
};
/* Draw onto ScriptUI graphics. opts: {zoom, fit, highlight, plan, width, height, background} */
PreviewRenderer.draw = function (g, layout, opts) {
    var T = PreviewRenderer.transform(layout, opts.width, opts.height, opts.zoom || 1, opts.fit !== false), i, p, pen, brush, pts, j, f, sizePx, r, hl,
        bg = g.newBrush(g.BrushType.SOLID_COLOR, opts.background || [1, 1, 1, 1]);
    g.newPath();
    g.rectPath(0, 0, opts.width, opts.height);
    g.fillPath(bg);
    /* baseline guide */
    pen = g.newPen(g.PenType.SOLID_COLOR, [0.82, 0.9, 1, 1], 1);
    g.newPath(); g.moveTo(0, T.Y(0)); g.lineTo(opts.width, T.Y(0)); g.strokePath(pen);
    if (opts.highlight) {
        hl = Layout.regionOf(layout, opts.highlight);
        if (hl) {
            g.newPath();
            g.rectPath(T.X(hl.x) - 2, T.Y(hl.y + hl.a) - 2, Math.max(4, hl.w * T.sc + 4), Math.max(4, (hl.a + hl.d) * T.sc + 4));
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [0.75, 0.86, 1, 1]));
        }
    }
    for (i = 0; i < layout.prims.length; i++) {
        p = layout.prims[i];
        try {
            if (p.k === 'text') {
                sizePx = p.size * T.sc;
                if (sizePx < 1) { continue; }
                f = PreviewRenderer.uiFont(p.font || PreviewRenderer.familyFor(opts.plan, p.face), p.bold, p.italic, sizePx);
                pen = g.newPen(g.PenType.SOLID_COLOR, PreviewRenderer.color(p.color), 1);
                /* drawString positions the top of the line box; place the baseline at ~0.8 of the font size */
                g.drawString(p.t, pen, T.X(p.x), T.Y(p.y) - sizePx * 0.86, f);
            } else if (p.k === 'rule') {
                g.newPath();
                g.rectPath(T.X(p.x), T.Y(p.y + p.h), Math.max(1, p.w * T.sc), Math.max(1, p.h * T.sc));
                g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, PreviewRenderer.color(p.color)));
            } else if (p.k === 'path') {
                pts = PreviewRenderer.flatten(p, T);
                g.newPath();
                g.moveTo(pts[0][0], pts[0][1]);
                for (j = 1; j < pts.length; j++) { g.lineTo(pts[j][0], pts[j][1]); }
                if (p.closed) { g.closePath(); }
                if (p.fill) { g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, PreviewRenderer.color(p.color))); }
                if (p.stroke) {
                    r = p.role === 'placeholder' ? PreviewRenderer.color('#9A9A9A') : PreviewRenderer.color(p.color);
                    g.strokePath(g.newPen(g.PenType.SOLID_COLOR, r, Math.max(1, p.stroke * T.sc)));
                }
            }
        } catch (e) { /* a single failed primitive must not break the whole preview */ }
    }
    return T;
};
