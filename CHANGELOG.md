# Changelog

All notable changes to this project are documented here. The project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-21

First public release.

### Added
- ScriptUI dialog with eleven tabs: Home, Symbols, Equation Builder, Direct Input, Templates, Formula Library, Favorites, Recent, Formatting, Settings, Help/About. It also has a toolbar, a shared live preview (zoom, fit, refresh, click-to-select), a status bar, tooltips on every button, and confirmations for destructive actions.
- Shared AST used by the visual builder and the LaTeX-style parser, with two-way sync, canonical serialization, and error reporting by line and column.
- TeX-style layout engine. The preview and the Illustrator output are generated from the same layout.
- Illustrator renderer with four insertion modes:
  - Editable group (default).
  - Separate components.
  - Single text object.
  - Outlined artwork.
- Renderer safety and re-editing:
  - Checks for missing documents and for locked or hidden layers.
  - Complete rollback on failure.
  - Equation source is stored in the item note for re-editing.
  - Updates keep the baseline position.
- Symbol library: 743 symbols in 30 categories covering mathematics, physics, units and chemistry.
- Template library: 383 templates in 17 categories.
- Chemistry engine:
  - All 118 elements.
  - Formula, charge, state and hydrate parsing.
  - Exact rational balancing with atom- and charge-count verification.
  - Molar mass.
- Formatting:
  - Global settings, presets and per-element overrides.
  - Math font detection and recommendations (STIX Two Math, Cambria Math, Latin Modern Math).
  - Missing-font warnings.
- Persistent library in the user data folder:
  - Atomic save, backup and corrupt-file recovery.
  - Versioned JSON import/export, parsed strictly and never executed.
- Undo/redo with bounded history, and keyboard shortcuts.
- Automated test suite: 138 tests, including extreme tests A–H, regression tests and an ES3-runtime emulation run.

### Known limitations
- Not yet tested inside Adobe Illustrator. See docs/COMPATIBILITY.md.
- Glyph heights use proportional tables, while advance widths are measured from the real fonts in Illustrator.
- Plain-text conversion quirks:
  - `\log_2 x` becomes `log ₂x`.
  - `\xrightarrow[below]{above}` drops the lower label in plain text.
  - `a &= b` becomes `a & =b`.

## [1.0.0-rc.1] - 2026-11-21
- Release candidate used to verify the release pipeline and asset download.
