# Third-party assets

WebBurrow's room geometry, materials, decorative props, miniature map, and visual identity are original procedural work created in code. It does not ship external 3D models, images, textures, or audio.

## Bundled resources

- **Space Grotesk** via `@fontsource/space-grotesk` — SIL Open Font License 1.1. Local WOFF2 (HTML) and WOFF (3D text worker) files are bundled in `public/fonts/`; nothing is fetched remotely.
- **IBM Plex Mono** via `@fontsource/ibm-plex-mono` — SIL Open Font License 1.1. Local WOFF2 (HTML) and WOFF (3D text worker) files are bundled in `public/fonts/`; nothing is fetched remotely.
- **Lucide icons** via `lucide-react` — ISC License.
- **ICAL.js** via `ical.js` — Mozilla Public License 2.0. Used locally for iCalendar parsing and bounded recurrence expansion; no remote code is loaded.
- **Drei environment helpers** are installed, but no remotely hosted preset or third-party environment image is used by the finished scene.

The WebBurrow Windows application and notification-area icon is the user-supplied WebBurrow artwork, stored locally in `build/icon.png`, `build/icon.ico`, and `desktop/icon.png`. It is used for the installer-created desktop shortcut and the optional native tray.
