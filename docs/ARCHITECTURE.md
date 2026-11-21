# Architecture

## Overview
The release is a single ES3 ExtendScript file. `tools/build.js` produces it by concatenating `src/modules/NN_*.jsx` in numeric order inside one closure. The build also:
- adds a banner and the version;
- parses the result with acorn (`ecmaVersion: 3`);
- rejects ES5+ constructs (`const`, `let`, arrows, template literals, `.forEach(`, `Object.keys(`, `JSON.`, `.trim(`, `Array.isArray(`, trailing commas).

```
 Direct Input text ──► Lexer ──► Parser ──┐
 Visual Builder ops ──► Editor ────────────┼──► AST (single source of truth) ──► Serializer ──► canonical text
 Templates / Symbols / Library ────────────┘           │
                                                       ▼
                                   Formatting ──► Layout engine (boxes, em units)
                                                       │  primitives: text runs, rules, paths
                                       ┌───────────────┴───────────────┐
                                       ▼                               ▼
                               PreviewRenderer                   Renderer
                           (ScriptUI onDraw, hit test)   (Illustrator DOM: text frames, paths, group)
```

The preview and the inserted artwork are generated from the **same layout primitives**, so they can't drift apart structurally. Inside Illustrator, a `Metrics` provider measures real glyph advance widths with a hidden temporary text frame. If that fails, the built-in proportional metrics are used.

## Modules
| Module | Responsibility |
|---|---|
| 00_header | Name, version, author, note prefix `MSEE:1:` |
| 01_util | ES3 helpers (each/map/indexOf/trim/clamp/strict number parsing, Unicode code points, colour conversion) |
| 02_json | `JSONX`, a strict JSON parser and serializer. Never uses eval |
| 03_errors | `MathError` kinds, central error formatting, log |
| 10_mathdata | Command tables: Greek, operators, relations, arrows, functions, accents, delimiters, fonts, spacing |
| 11_symbols | 743 symbol records in 30 categories |
| 12_elements | Periodic table (118 elements, masses) |
| 20_ast | Node constructors, ids, clone, walk, find, validate (depth and node limits) |
| 21_lexer / 22_parser | LaTeX-style tokenizer and recursive-descent parser. Positions are reported as line and column; limits are 100 000 characters and depth 150 |
| 23_serializer | Canonical LaTeX output, plain-text and Unicode linear forms, single-text eligibility |
| 24_semantics | Structural checks: empty slots, mismatched environments, chemistry validation hints |
| 25_editor | Structural edit operations (insert into slot, wrap, move, duplicate, delete, matrix and line operations, slot toggles, style) |
| 26_chem | `\ce` parsing, formula composition, exact rational balancing (Gaussian elimination over fractions), verification, molar mass |
| 30_formatting | Settings spec with ranges, `clean()` validation, presets, colour parsing |
| 31_layout | TeX-inspired box layout: width/ascent/descent per node, computed bottom-up; stretchy delimiters and radicals as paths; matrices, multiline alignment |
| 32_renderer | Font resolution, Illustrator object creation, the four insertion modes, safety checks, rollback, update in place, note encoding and decoding |
| 35_templates | Generated from `src/data/templates.txt` (383 templates) |
| 40_model | Current document state, `apply()` with snapshot and rollback, bounded undo/redo history |
| 41_store | Persistence: library, favorites, recents, preferences, custom templates; atomic writes (`.tmp`, then `.bak`), corrupt-file recovery, import/export |
| 45_preview | ScriptUI drawing of layout primitives, zoom/fit, hit testing for click-to-select |
| 50_ui | Dialog, tabs, toolbar, status bar, shortcuts, all event handlers |
| 99_footer | Exports for tests (`MSEE_TEST_MODE`), otherwise `UI.launch()` |

## Key decisions
- **One AST.** Every input path produces the same AST, and every output (text, preview, artwork, plain text, saved data) is derived from it. Bidirectional sync means parse(text) → AST → serialize → text, and the round trip is tested for every template and symbol.
- **Coordinates.**
  - Layout works in em units with y pointing up. Primitives are scaled to points.
  - The renderer switches Illustrator to document coordinates while inserting and restores the user's setting afterwards.
  - Point-text anchors sit on the baseline.
- **Re-editing.** The equation group's `note` stores `MSEE:1:` followed by JSON of `{source, settings, mode, version}`. When the script starts, it decodes the note of the selected equation, or of the equation's parent group, using `JSONX` only.
- **Safety.**
  - Before inserting, the renderer checks that a document is open and that layers are neither locked nor hidden.
  - Every created item is tracked and removed if insertion fails.
  - Updating places the new equation first, then removes the old one, so a failure leaves the original untouched.
  - Only items the script created, or the equation being updated, are ever modified.
- **Limits.**

  | Limit | Value |
  |---|---|
  | Input length | 100 000 characters |
  | Parser depth | 150 |
  | AST depth | 120 |
  | AST nodes | 60 000 |
  | Matrix size | 100 × 100 |
  | History | 5–1000 steps |
  | Imports | bounded by `Store.LIMITS` |
- **Performance.** Parsing, serialization and layout are linear in input size; the measurements are in the extreme tests.

## Tests
`tests/` runs the built script in a Node `vm` sandbox:
- `tests/load.js` loads the script.
- Mocks provide ExtendScript `File`/`Folder` (backed by a real temp folder), ScriptUI, and the Illustrator DOM.
- In ES3 mode, the loader deletes every ES5+ built-in from the sandbox.

See [TEST_REPORT.md](TEST_REPORT.md).
