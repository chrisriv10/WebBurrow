# WebBurrow

WebBurrow is a playable, local-first spatial homepage. Websites become objects in distinctive rooms, while Quick Access and the compact Burrow Tray keep everyday navigation fast.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by the development server. Use WASD and the mouse to explore, hold `Shift` to sprint, press `Space` to jump, and use `E` on nearby sites, the pocket note, favorites rack, or Burrow Lift. `Ctrl+K` or `/` opens Quick Access, `T` opens the Burrow Tray, `Alt+1/2/3` jumps between the starter rooms, and `Home` returns to a safe position.

Edit mode provides an isometric room view with half-meter snapping, collision-aware dragging, 45-degree rotation, duplication, room reassignment, undo, and safe-placement recovery. Site records can include a collection and pinned note. Netscape bookmark HTML and versioned WebBurrow JSON are parsed and validated locally before changes are applied.

## Windows application

Build a local Windows installer with:

```bash
npm run desktop:dist
```

The unsigned NSIS artifact is written to `release/WebBurrow-Setup-0.1.0.exe`. It installs per user, offers an installation-directory choice, and creates Desktop and Start Menu shortcuts. Build an unpacked application for development smoke testing with `npm run desktop:pack`, or run the desktop build directly with `npm run desktop:preview`. The build script stages Electron under Windows Temp to avoid protected-folder and antivirus rename races, then copies only the completed artifacts into `release`.

The installed app uses the same local IndexedDB-backed data model as the browser build. External sites are handed to the Windows default browser after the same `http`/`https` validation used in the web experience. The renderer is bundled into a minimal dependency-free desktop package; no local server is required after installation.

## Verify

```bash
npm run typecheck
npm test
npm run build
npm run desktop:build
```

The desktop smoke harness also supports `--smoke-test`, `--screenshot=<absolute-path>`, and focused `--qa-view=studio|lounge|tray|launcher|edit|add|data|compact` arguments when launched through Electron. It fails if startup remains on the loader or the renderer logs an error.

All bookmark, room, preference, note, usage, and configuration data stays in the browser's IndexedDB. Websites open in isolated new tabs; they are never embedded or transmitted through WebBurrow.
