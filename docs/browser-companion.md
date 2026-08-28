# Chromium companion setup

WebBurrow Companion is an optional Manifest V3 extension for Chrome, Edge, and Brave. It is not store-published in 1.0.0.

## Build and load

1. Run `npm install` and `npm run extension:build` from the repository root.
2. Open the browser’s extensions page and enable developer mode.
3. Choose **Load unpacked** and select `browser-extension/dist`.
4. Install and launch the matching WebBurrow Windows desktop build. Native messaging is desktop-only.

The pinned development extension ID is `igfepplhdmogifjmgfligakhgoacflhg`. The Windows installer registers `com.webburrow.desktop` only for that exact origin in the current user’s Chrome, Edge, and Brave native-host registry locations.

## Permissions

- Always present: `activeTab` to read the current page after a user action, `storage` for popup preferences, and `nativeMessaging` for the local desktop bridge.
- Requested on demand: `tabs` for selected/current-window transfers and focus-existing behavior; `tabGroups` for a chosen group; `bookmarks` for a local preview.
- Never requested: history, cookies, content scripts, or broad host access.

Denying an optional permission leaves the rest of the popup usable. Connection and permission failures are shown in the popup rather than silently broadening access.

## Temporary workspaces

The popup can create a new workspace or append/replace an existing temporary workspace. Transfers are capped at 100 safe HTTP(S) tabs. WebBurrow records transient tab/window/group IDs only in memory so it can focus an existing browser tab; they are never written to IndexedDB or portable exports.

Use the in-app session manager to rename, filter, reopen/focus, remove, clear, or promote selected tabs. **Keep entire room** strips browser identity and converts the room, collection, and objects to permanent records.

## Favicons

Including the current page icon is an explicit popup choice. The extension accepts only bounded raster data and re-encodes it locally. The desktop’s manual **Fetch icon** action is limited to the saved page’s public HTTPS origin, rejects cross-origin redirects, caps the response at 64 KiB, and re-encodes to at most 64×64. Icon blobs are bounded local cache entries and are excluded from exports.

## Troubleshooting

- **Desktop disconnected:** launch the installed WebBurrow app, then reopen the popup.
- **Permission denied:** retry the exact tabs/group/bookmark action and approve only if you want that feature.
- **Extension ID differs:** load the generated build with its bundled manifest key; do not replace the key.
- **Native host missing:** reinstall the Windows build for the current user. Uninstall removes its Chrome/Edge/Brave host registrations.
