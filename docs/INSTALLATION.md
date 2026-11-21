# Installation

You only need one file: `Shohan_Khan_Illustrator_Math_Scientific_Equation_Editor.jsx`, from the [Releases page](https://github.com/peraccofshohan-lgtm/illustrator-math-scientific-equation-editor/releases/latest).

## Option A — run once (no installation)
1. Start Illustrator and open a document.
2. Choose **File › Scripts › Other Script…** (Ctrl+F12 on Windows).
3. Select the `.jsx` file.

## Option B — add it to the File › Scripts menu
Copy the file into Illustrator's Scripts folder, then restart Illustrator.

| OS | Folder (replace the version as needed) |
|---|---|
| Windows | `C:\Program Files\Adobe\Adobe Illustrator <version>\Presets\<locale>\Scripts\` (for example `…\Adobe Illustrator 2025\Presets\en_US\Scripts\`) |
| macOS | `/Applications/Adobe Illustrator <version>/Presets.localized/<locale>/Scripts/` |

Writing to these folders usually needs administrator rights. After restarting, the script appears under **File › Scripts**.

## Optional — keyboard shortcut
Illustrator can't assign a shortcut to a script directly. Instead, record an Action that runs **File › Scripts › Shohan_Khan_…**, and give the Action a function key.

## Recommended fonts
To cover every symbol, install at least one math font:
- **STIX Two Math** — free, from <https://www.stixfonts.org/>
- **Latin Modern Math** — free, from GUST
- **Cambria Math** — bundled with Windows and Microsoft Office

The editor detects installed fonts automatically. You can rescan under **Formatting › Fonts**.

## Where your data is stored
`<user data folder>/ShohanKhan-MathEquationEditor/library.json`. On Windows the user data folder is usually `%APPDATA%`; on macOS it is `~/Library/Application Support`. **Settings › Data** shows the exact path and has an **Open Data Folder** button.

## Uninstall
Delete the `.jsx` file. To remove your saved data as well, delete the `ShohanKhan-MathEquationEditor` folder.
