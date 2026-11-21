# Compatibility

## Honest status
The script was developed without access to Adobe Illustrator. **No Illustrator version has been tested.** The classifications below reflect the APIs used, not test results.

What *has* been verified automatically:
- The release file parses as **ECMAScript 3**: acorn with `ecmaVersion: 3`, no reserved-word keys, and no trailing commas.
- The complete script runs in a sandbox with every ES5+ built-in removed, emulating ExtendScript's standard library. That run covers UI construction, preview, insertion into a mock document, the store, chemistry, and all templates and symbols.
- The Illustrator DOM calls are exercised against a mock: `textFrames.pointText`, `pathItems.add`, `pathItems.rectangle`, `setEntirePath`, `pathPoints`, `groupItems.add`, `note`, `hidden`, `move`, `remove`, `createOutline`, `textFonts.getByName`, `views[0].centerPoint`, `artboards`, `coordinateSystem`, `RGBColor`/`CMYKColor`.

## Matrix

| Illustrator | Version | Windows | macOS | Classification |
|---|---|---|---|---|
| CC 2015 | 19.x | Not tested | Not tested | Expected compatible — untested |
| CC 2015.3 | 20.x | Not tested | Not tested | Expected compatible — untested |
| CC 2017 | 21.x | Not tested | Not tested | Expected compatible — untested |
| CC 2018 | 22.x | Not tested | Not tested | Expected compatible — untested |
| CC 2019 | 23.x | Not tested | Not tested | Expected compatible — untested |
| 2020 | 24.x | Not tested | Not tested | Expected compatible — untested |
| 2021 | 25.x | Not tested | Not tested | Expected compatible — untested |
| 2022 | 26.x | Not tested | Not tested | Expected compatible — untested |
| 2023 | 27.x | Not tested | Not tested | Expected compatible — untested |
| 2024 | 28.x | Not tested | Not tested | Expected compatible — untested |
| 2025 | 29.x | Not tested | Not tested | Expected compatible — untested |
| 2026 and later | 30.x+ | Not tested | Not tested | Expected compatible while Adobe keeps ExtendScript support — untested |
| CS6 and earlier | ≤ 16 | — | — | Unsupported (outside the target range; may work) |
| Illustrator on iPad / web | — | — | — | Unsupported (no ExtendScript) |

"Expected compatible" means every API the script uses is documented for these versions. It is not a claim that the script has been verified on them.

## Feature notes
| Feature | Notes |
|---|---|
| ScriptUI layout | Appearance differs between Windows and macOS and between Illustrator versions. Not tested. |
| Custom-drawn preview (`onDraw` on a group) | A standard ScriptUI technique. Behaviour on HiDPI screens is not tested. |
| Unicode mathematical italic letters (U+1D400 block) | Used only when a math font is selected; requires Illustrator to render supplementary-plane characters. Not tested. |
| `createOutline()` (outlines mode) | Standard API. Not tested. |
| Keyboard shortcuts | Delivered through ScriptUI `keydown` events; Ctrl/Cmd combinations may be intercepted by the operating system or Illustrator. Not tested. |
| File dialogs (import/export) | `File.openDialog` / `File.saveDialog`. Not tested. |

If you test the script, please report the version, OS and results in a GitHub issue so this table can be updated with real data.
