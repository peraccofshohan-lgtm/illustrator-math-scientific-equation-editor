# Troubleshooting

| Symptom | Cause and fix |
|---|---|
| "No document is open" | Create or open a document first. The editor opens without one, but cannot insert. |
| "The active layer … is locked / hidden" | Unlock or show the layer (and its parent layers), or select another layer in the Layers panel. |
| Symbols appear as boxes or wrong glyphs | The chosen font lacks those characters. Install STIX Two Math, Latin Modern Math or Cambria Math, then click **Formatting › Fonts › Rescan Installed Fonts** and choose it as the math font. |
| Warning "Font … is not installed" | The saved settings name a font that isn't available. A fallback is used; pick an installed font in Formatting. |
| Italic letters look odd in a math font | With a math font, italic variables use Unicode mathematical italic characters (as in Word and LaTeX). Choosing a regular text font (for example Times New Roman) uses ordinary italic styling instead. |
| Spacing differs slightly from the preview | The preview uses ScriptUI fonts; Illustrator measures your real fonts. The structure is identical and the inserted artwork is authoritative. |
| "Single text mode is not possible" | Only expressions with an exact linear Unicode form (such as `x² + y² = r²`) can be one text object. Use **Editable group**. |
| Running the script doesn't load my equation for editing | Select the equation group (or something inside it) before running the script. Equations inserted as **Separate components** cannot be re-edited as a unit. Editing or ungrouping the artwork in Illustrator may remove the stored note. |
| Syntax error message | The message gives the line, column and a caret. Common causes: unbalanced `{ }`, `\left` without `\right`, mismatched `\begin`/`\end`, or an unknown command (check the Symbols tab for the right one). |
| "Expression is too large / nested too deeply" | Limits: 100 000 characters of input, 60 000 structure nodes, nesting depth of about 120. Split the equation. |
| "The saved library was unreadable" | The editor recovered from `library.json.bak`, or started empty, and kept the damaged file as `library.corrupt-<date>.json` in the data folder. |
| "Could not save your data" | Check disk space and write permissions for the data folder (Settings › Data shows the path). |
| Import reports invalid entries | Each invalid entry is listed with its reason (missing source, syntax error, library full). Valid entries are still imported. |
| Ctrl+Z doesn't undo the equation | When a text field has focus, Ctrl+Z undoes typing in that field. Click outside text fields or use the toolbar buttons. |
| The script fails to start | The alert shows the error. Use **Settings › Diagnostics › Show Log** if the window opens, and report the message together with your Illustrator version. |
