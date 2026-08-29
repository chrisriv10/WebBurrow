# Changelog

All notable WebBurrow changes are documented here.

## 1.0.0 — improved build, 2026-08-29

### Added

- Three shared-data procedural room layouts, curated room customization, thirteen object archetypes, contextual mounting, placement migration, duplication, undo, and Mini Burrow parity.
- Session-only browser workspaces with create/append/replace transfers, group labeling, management, focus/reopen, item promotion, and full-session preservation.
- Manifest V3 Chrome/Edge/Brave companion with runtime-requested `tabs`, `tabGroups`, and `bookmarks` permissions.
- Public GitHub, manual-city weather, iCalendar, and text-only RSS/Atom adapters with cache-first refresh and physical world surfaces.
- Windows native messaging, strict deep links, optional notification-area tray, same-origin explicit favicon retrieval, and a locally generated sound layer.
- Progressive onboarding, compact companion layout, expanded Quick Access commands, configurable tray cards, and release performance instrumentation.
- Adaptive temporary-workspace composition with individual stations, workstation banks, dense racks, focus ordering, grouping, and deterministic domain/browser-group layouts.

### Changed

- Advanced local persistence to Dexie schema 5 and portable configuration to ConfigEnvelope V3 with V1/V2 migration.
- Reworked the default world with three authored footprints, architectural trim, instanced structural details, weather-facing windows, constructed furniture, calmer lighting, and less emissive portal effects.
- Rebuilt all thirteen site archetypes with recognizable procedural forms and added approach, selection, placement-validity, arrival, and launch feedback.
- Improved edit mode with transient placement previews, explicit cancel/commit behavior, deterministic room tidy, and batch undo.
- Set all package, desktop, companion, installer, and visible product metadata to 1.0.0.

### Security

- Replaced generic privileged networking with discriminated operations and streaming HTTPS requests pinned to validated public addresses.
- Added redirect/TLS-host/MIME/timeout/size enforcement, strict native-message schemas, replay protection, DPAPI-backed bridge authentication, exact extension-origin allowlisting, and same-origin favicon rules.

### Verification

- Expanded the automated suite from 55 to 65 passing tests.
- Kept default-room draw calls at 136 and the 100-tab workspace at 162 or fewer in final isolated smoke samples; the 100-tab arrival task remained below 110 ms.
- Re-ran all desktop QA views and refreshed the curated 1.0.0 screenshots without changing the version number.

### Known limitations

- Windows installer is unsigned; Chromium companion is unpacked-only.
- Browser CORS still applies to web subscriptions.
- No accounts, cloud sync, authenticated integrations, telemetry, or OS notifications.
