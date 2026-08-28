# Privacy and security model

WebBurrow is a single-device application. It has no account, backend, telemetry, analytics, advertising, remote favicon lookup, or arbitrary website embedding. Permanent records and optional public integration caches are stored in IndexedDB. Configuration exports deliberately omit caches, temporary browser sessions, errors, native bridge state, and secrets.

## Network boundary

All integrations are disabled by default. The web build uses direct HTTPS requests only after explicit configuration and therefore depends on the source’s CORS policy. The Electron renderer cannot make generic privileged requests. Its sandboxed preload exposes a discriminated integration operation for GitHub, weather, calendar, or feeds. The main process enforces HTTPS, exact GitHub/Open-Meteo hosts, DNS and private-network rejection for subscriptions, redirect revalidation, a ten-second timeout, adapter MIME allowlists, and bounded response sizes.

GitHub support is public-only and stores no token. Weather requires a manually chosen city and never asks for device location. Calendar and feed URLs must use HTTPS. Feed parsing rejects DTD/entity declarations and never renders remote HTML.

## Browser companion boundary

The Manifest V3 companion has required `activeTab`, `storage`, and `nativeMessaging` permissions. `tabs` and `bookmarks` are optional and requested only for the matching popup action. There is no history permission, cookie access, content script, or host permission.

The Windows installer registers one native host for the pinned extension origin. Chrome’s length-prefixed messages are size-capped and validated against an allowlisted union. The host forwards them over a current-user named pipe authenticated by a randomly generated installation token encrypted with Electron/Windows protected storage. Tab batches are capped at 100 and only HTTP(S) pages are accepted. Browsing payloads are never placed in command-line arguments or exposed through a localhost server.

## Desktop boundary

Electron keeps `contextIsolation`, renderer sandboxing, and `nodeIntegration: false`. The preload exposes only integration requests, sanitized tray preferences/menu summaries, safe external opening, and allowlisted commands. Favorite/recent native tray entries contain only an ID, short display name, and validated HTTP(S) URL.

Deep links are allowlisted and syntactically validated. An `add` deep link can prefill a safe web URL but never saves it automatically. Local paths, credentials, commands, and non-HTTP(S) URL parameters are rejected.

## Deliberate limitations

The Windows installer and extension are unsigned development artifacts and are not store-published. Public feed/calendar sources may still reveal the client IP address to the chosen host when refreshed. GitHub’s unauthenticated REST rate limits apply. Web builds cannot bypass CORS. OS notifications, authenticated integrations, remote synchronization, and social sharing are intentionally absent.
