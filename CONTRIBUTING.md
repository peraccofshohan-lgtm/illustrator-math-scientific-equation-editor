# Contributing

Thanks for helping improve the Math & Scientific Equation Editor.

## Ground rules
- The release asset must stay a **single, self-contained ES3 ExtendScript file**, with no runtime dependencies.
- Use ES3 syntax only. That means no `let`/`const`, arrow functions, template literals or trailing commas. Don't use ES5 library functions such as `Array.prototype.map/indexOf`, `JSON`, `Object.keys` or `String.prototype.trim`; use the helpers in `src/modules/01_util.jsx` (`U.map`, `U.indexOf`, `U.trim`, …) and `JSONX`.
- Quote reserved words used as object keys (`'default'`, `'class'`, `'double'`, …).
- Never `eval` user or imported data.

## Workflow
1. Edit the modules in `src/modules/` (they are concatenated in numeric order). Edit templates in `src/data/templates.txt`; `35_templates.jsx` is generated, so don't edit it by hand.
2. `npm run build` checks ES3 syntax and the forbidden constructs.
3. `npm test` must pass. Add tests next to the area you changed, and add a regression test for every bug fix.
4. `node tools/test-report.js` refreshes docs/TEST_REPORT.md.
5. If your change touches Illustrator behaviour, describe what you tested in Illustrator (version and OS), or state that it is untested.

## Debugging layouts without Illustrator
`node tools/layout-svg.js "\frac{a}{b}" out.svg 40` renders the layout primitives to SVG.
