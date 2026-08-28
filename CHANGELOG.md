# Changelog

All notable WebBurrow changes are documented here.

## 1.0.0 — 2026-08-28

### Added

- Three shared-data procedural room layouts, curated room customization, thirteen object archetypes, contextual mounting, placement migration, duplication, undo, and Mini Burrow parity.
- Session-only browser workspaces with create/append/replace transfers, group labeling, management, focus/reopen, item promotion, and full-session preservation.
- Manifest V3 Chrome/Edge/Brave companion with runtime-requested `tabs`, `tabGroups`, and `bookmarks` permissions.
- Public GitHub, manual-city weather, iCalendar, and text-only RSS/Atom adapters with cache-first refresh and physical world surfaces.
- Windows native messaging, strict deep links, optional notification-area tray, same-origin explicit favicon retrieval, and a locally generated sound layer.
- Progressive onboarding, compact companion layout, expanded Quick Access commands, configurable tray cards, and release performance instrumentation.

### Changed

- Advanced local persistence to Dexie schema 4 and portable configuration to ConfigEnvelope V3 with V1/V2 migration.
- Reworked the default world, lighting, furniture, object proportions, launcher, integration/privacy center, and release documentation.
- Set all package, desktop, companion, installer, and visible product metadata to 1.0.0.

### Security

- Replaced generic privileged networking with discriminated operations and streaming HTTPS requests pinned to validated public addresses.
- Added redirect/TLS-host/MIME/timeout/size enforcement, strict native-message schemas, replay protection, DPAPI-backed bridge authentication, exact extension-origin allowlisting, and same-origin favicon rules.

### Known limitations

- Windows installer is unsigned; Chromium companion is unpacked-only.
- Browser CORS still applies to web subscriptions.
- No accounts, cloud sync, authenticated integrations, telemetry, or OS notifications.
