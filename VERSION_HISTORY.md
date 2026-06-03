# VERSION HISTORY

## v10.2.0 - Stability & Versioning
- Unified table and wizard design for price modules.
- Fixed stepper state handling in transporter wizards.
- Added persistent in-app version history stored in localStorage.
- Improved cross-module sync events after Firebase updates.
- Aligned module asset versions (`styles.css`, `core.js`, module scripts) to one release tag.

## Versioning Rule
- For every update, add a new section at the top of this file.
- Keep format: `## vX.Y.Z - Codename` + short bullet list of changes.
- Mirror the same version in `window.DB_VERSION` inside `core.js`.
