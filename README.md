# WebBurrow

WebBurrow is a playable, local-first spatial homepage. Websites become objects in distinctive rooms, while Quick Access and the compact Burrow Tray keep everyday navigation fast.

The daily-use layer can optionally bring public GitHub repositories, manually selected Open-Meteo weather, local or subscribed iCalendar events, and text-only RSS/Atom feeds into Quick Access, the Burrow Tray, and physical room surfaces. Every integration starts disabled, loads cached data first, and can be inspected or disconnected in **Integrations & privacy**.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by the development server. Use WASD and the mouse to explore, hold `Shift` to sprint, press `Space` to jump, and use `E` on nearby sites, the pocket note, favorites rack, or Burrow Lift. `Ctrl+K` or `/` opens Quick Access, `T` opens the Burrow Tray, `Alt+1/2/3` jumps between the starter rooms, and `Home` returns to a safe position.

Quick Access searches sites, rooms, collections, favorites, recents, events, feed items, integration content, temporary browser tabs, notifications, and commands. Prefix commands with `>`, or use `g query`, `yt query`, and `gh query`. Plain unmatched text shows an explicit web-search choice and never launches automatically. DuckDuckGo is the default provider.

Edit mode provides an isometric room view with half-meter snapping, collision-aware dragging, 45-degree rotation, duplication, room reassignment, undo, and safe-placement recovery. Site records can include a collection and pinned note. Netscape bookmark HTML and versioned WebBurrow JSON are parsed and validated locally before changes are applied.

## Windows application

Build a local Windows installer with:

```bash
npm run desktop:dist
```

The unsigned NSIS artifact is written to `release/WebBurrow-Setup-0.1.0.exe`. It installs per user, offers an installation-directory choice, and creates Desktop and Start Menu shortcuts. Build an unpacked application for development smoke testing with `npm run desktop:pack`, or run the desktop build directly with `npm run desktop:preview`. The build script stages Electron under Windows Temp to avoid protected-folder and antivirus rename races, then copies only the completed artifacts into `release`.

The installed app uses the same local IndexedDB-backed data model as the browser build. External sites are handed to the Windows default browser after the same `http`/`https` validation used in the web experience. The renderer is bundled into a minimal dependency-free desktop package; no local server is required after installation.

The installer also registers the local `webburrow://` protocol and the per-user `com.webburrow.desktop` native-messaging host for Chrome, Edge, and Brave. Uninstall removes those registrations. The optional Windows notification-area tray is disabled until enabled under **Integrations & privacy**; “keep available” and “minimize to tray” are separate settings.

## Chromium companion

Build the unpacked Manifest V3 extension with:

```bash
npm run extension:build
```

Load `browser-extension/dist` as an unpacked extension in Chrome, Edge, or Brave. Its stable development ID is `igfepplhdmogifjmgfligakhgoacflhg`, matching the installer’s native-host allowlist. It always has only `activeTab`, `storage`, and `nativeMessaging`; `tabs` and `bookmarks` are requested only when their popup actions are used. It has no history, cookie, content-script, or broad host access.

The popup can add the current page, turn selected tabs into a visibly temporary session room, or send a local bookmark preview into WebBurrow’s existing selection and room-mapping flow. Session rooms, collections, and objects are removed on the next launch unless explicitly kept. When opening a saved site, the desktop app asks a connected companion with tabs permission to focus the normalized URL first, then falls back within a short timeout to the system browser.

Validated deep links are limited to `show`, `quick-access`, `room/<id>`, `open/<object-id>`, and `add` with safe HTTP(S) prefill. Deep links never save automatically or accept file paths, shell commands, or arbitrary launch URLs.

## Integrations and privacy

- GitHub reads public REST data for at most five configured `owner/repository` names, honors cached ETags, refreshes hourly, and needs no token.
- Weather uses a city selected through Open-Meteo geocoding—never device location—and refreshes every 20 minutes.
- Calendar imports local `.ics`, supports local events, and refreshes chosen HTTPS subscriptions every 30 minutes. Recurrence expansion is bounded to 90 days and 500 events.
- Feeds accept up to ten HTTPS RSS/Atom sources. Only text titles, source, date, read state, and validated article URLs are retained; HTML and XML entities are never rendered.

Web builds make only the direct CORS-enabled HTTPS requests you configure. Desktop requests pass through discriminated preload operations with host allowlists, HTTPS enforcement, DNS/private-network rejection, redirect revalidation, MIME and size limits, and timeouts. Caches, temporary tabs, errors, bridge tokens, and secrets are excluded from configuration exports. See [PRIVACY_AND_SECURITY.md](PRIVACY_AND_SECURITY.md).

## Verify

```bash
npm run typecheck
npm test
npm run build
npm run desktop:build
npm run extension:build
```

The desktop smoke harness also supports `--smoke-test`, `--screenshot=<absolute-path>`, and focused `--qa-view=studio|lounge|tray|launcher|edit|add|data|compact` arguments when launched through Electron. It fails if startup remains on the loader or the renderer logs an error.

All bookmark, room, preference, note, usage, integration configuration, and cached public data stays in the browser's IndexedDB. Websites open externally; they are never embedded. No account, backend, telemetry, authenticated integration, or OS notification service is included.
