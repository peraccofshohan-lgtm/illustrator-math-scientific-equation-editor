# Security Policy

## Data handling
- The editor stores your formulas, templates, favorites, recents and settings in one JSON file: `<user data folder>/ShohanKhan-MathEquationEditor/library.json`.
- Saved, imported and in-document data (the note on inserted equations) is read with a strict JSON parser (`JSONX`) and validated field by field. It is **never executed**: there is no `eval`, `Function` or `$.evalFile` on data.
- Imported values are bounded (sizes, counts and nesting depth), and invalid entries are rejected with a reason.
- The script makes no network connections.
- The script changes only objects it creates itself, plus the equation being replaced when you choose **Update Equation**.

## Reporting a vulnerability
Open a GitHub issue with the label `security`, or contact the maintainer through GitHub. Don't include personal data in reports. Please allow a reasonable time for a fix before public disclosure.
