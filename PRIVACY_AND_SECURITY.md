# Privacy and security model

WebBurrow is a local-first, single-device application. It has no account, backend, telemetry, analytics, advertising, arbitrary website embedding, or automatic bookmark harvesting. Permanent records and optional public-integration caches live in IndexedDB. Portable exports exclude caches, errors, notifications, native bridge state, secrets, favicon blobs, temporary workspaces, and browser tab/window/group identity.

## Network boundary

All integrations start disabled and make no request before explicit configuration. Web builds make direct CORS-enabled HTTPS requests. The Electron renderer cannot issue a generic privileged fetch: its sandboxed preload exposes discriminated GitHub, weather, calendar, feed, and favicon operations.

Desktop subscription requests use streaming HTTPS with the validated public IP pinned for the connection. Every redirect is resolved and revalidated. TLS hostname checks remain enabled. Operations enforce adapter host/path rules, public-address rejection for private/link-local/loopback targets, timeouts, MIME allowlists, and byte limits. GitHub is public-only and stores no token. Weather uses a manually selected city and never device location. Feed parsing rejects DTD/entity declarations and never renders remote HTML.

Cached results load first and remain available with a stale/offline label after a failed refresh. Refresh timers pause while offline or hidden and one due refresh runs when the app becomes visible. Users can disconnect an adapter to clear its configuration and cache, or reset the complete local Burrow from the data surface.

## Favicon consent and cache

Icons are never harvested automatically from imported bookmarks. A favicon enters WebBurrow only when:

- the user explicitly selects **Include page icon** in the companion, after bounded raster validation and local re-encoding; or
- the user invokes **Fetch icon** for an already saved site in the desktop app.

Desktop icon fetching is restricted to the saved page’s public HTTPS origin, permits only same-origin redirects and supported image MIME types, caps responses at 64 KiB, and re-encodes locally to at most 64×64. At most 100 recent icon blobs are kept in the separate `siteIcons` cache. They are excluded from exports and removed by local-data reset.

## Browser companion boundary

The Manifest V3 companion always has only `activeTab`, `storage`, and `nativeMessaging`. It requests `tabs`, `tabGroups`, and `bookmarks` at runtime for their matching explicit actions. It has no history permission, cookie access, content script, or broad host permission.

The Windows installer registers one native host for the pinned extension origin. Native messages are length-prefixed, size-capped, replay-checked, and validated against an allowlisted schema with unknown fields rejected. Transfers are capped at 100 safe HTTP(S) tabs. The host forwards messages over a current-user named pipe authenticated with a random installation token protected by Electron safe storage/Windows DPAPI. Browsing payloads are never placed in command-line arguments or exposed through a localhost server.

Temporary browser workspaces and tab/window/group identifiers live only in the active renderer session. They are never written to Dexie or exports and disappear on the next launch unless the user explicitly promotes selected items or keeps the whole room. Promotion strips browser-session metadata.

## Desktop boundary

Electron uses `contextIsolation: true`, `sandbox: true`, and `nodeIntegration: false`. Navigation is blocked and safe HTTP(S) destinations are delegated externally. The preload exposes only discriminated integration requests, explicit icon retrieval, safe external opening, sanitized tray preferences/menu summaries, browser-context summaries, and allowlisted app commands.

The optional Windows tray is disabled by default. Favorite/recent tray entries contain only an ID, short display name, and validated HTTP(S) URL. Closing hides instead of quits only after **Keep WebBurrow available in the Windows tray** is enabled; minimize-to-tray is a separate opt-in.

Deep links are limited to `show`, `quick-access`, `room/<id>`, `open/<object-id>`, and `add` with a safe HTTP(S) prefill. They cannot save automatically, accept local paths, execute commands, or carry arbitrary launch URLs.

## Deliberate limitations

The Windows installer is unsigned and the extension is manually loaded rather than store-published. Chosen feed/calendar/weather/GitHub hosts see normal network metadata such as the client IP address. Web builds cannot bypass CORS. GitHub’s unauthenticated REST limits apply. OS notifications, authenticated integrations, accounts, cloud synchronization, telemetry, and social sharing are intentionally absent.
