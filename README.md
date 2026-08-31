# WebBurrow

**Your internet is a place, not just a list of tabs.**

WebBurrow turns your bookmarks into a cozy, low-poly 3D world. Every site you care about becomes a physical object you can walk up to, sitting on a desk, shelf, or wall in a room you actually enjoy hanging out in. No accounts, no backend, no telemetry, no cloud — everything lives on your machine.

<p align="center">
  <img src="https://github.com/chrisriv10/WebBurrow/raw/main/docs/screenshots/home-den.png" alt="WebBurrow Home Den" width="800">
</p>

<p align="center">
  <a href="https://github.com/chrisriv10/WebBurrow/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/chrisriv10/WebBurrow/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows%20%7C%20Web-blue">
  <img alt="node" src="https://img.shields.io/badge/node-%E2%89%A522.13-green">
  <img alt="stack" src="https://img.shields.io/badge/stack-React%2019%20%2B%20R3F-61dafb">
  <img alt="no telemetry" src="https://img.shields.io/badge/telemetry-none-critical">
  <img alt="accounts" src="https://img.shields.io/badge/accounts-none-critical">
</p>

---

## Table of contents

- [Why WebBurrow](#why-webburrow)
- [What's inside](#whats-inside)
- [Rooms](#rooms)
- [Get it running](#get-it-running)
  - [Install on Windows](#install-on-windows)
  - [Run from source](#run-from-source)
  - [Browser companion](#browser-companion)
- [Controls](#controls)
- [Quick Access](#quick-access)
- [Navigator](#navigator)
- [Integrations & privacy](#integrations--privacy)
- [Architecture](#architecture)
- [Verify / test](#verify--test)
- [Known limitations](#known-limitations)
- [Docs](#docs)

---

## Why WebBurrow

Browser bookmark bars are flat, forgettable, and infinite. WebBurrow gives your everyday sites spatial memory instead. Your GitHub goes on a desk in the Developer Studio, your media sites hang on the wall in the Media Lounge, your favorites sit wherever *you* put them. It sounds playful because it is, but underneath it's a fully local, privacy-conscious app: no arbitrary iframing of third-party sites, no required cloud storage, and every integration is opt-in and off by default.

## What's inside

| | |
|---|---|
| 🏠 **3 room templates** | Home Den, Developer Studio, and Media Lounge, each customizable into your own layout |
| 🧱 **13 site archetypes** | Beveled, readable objects with restrained live-state cues and context-aware placement (floor, desk, shelf, media-wall, wall) |
| ⌨️ **Full keyboard control** | Manage sites and rooms, import bookmarks, build collections, favorite, and place things — no mouse required |
| 🔎 **Quick Access** | One search bar across local sites, rooms, collections, sessions, integrations, feeds, notifications, and the open web |
| 🧭 **Navigator** | A visual command center for discovering, grouping, and managing sites, rooms, collections, sessions, integrations, and browser actions |
| 🌐 **Optional integrations** | GitHub (public), Open-Meteo weather, iCalendar, and text-only RSS/Atom — each with offline cache fallback |
| 🪟 **Mini Burrow** | A compact 2D view of your layout with up to 4 configurable cards |
| 🧭 **Browser companion** | Session-only tab workspaces via a minimal-permission Chrome/Edge/Brave extension |
| 🗂️ **Adaptive session layouts** | Solo stations for a few tabs, labeled banks for medium sets, dense instanced racks for big transfers |
| 🔔 **Windows tray + deep links** | Optional tray icon, validated `webburrow://` routes, hardened native-messaging bridge |
| 🔈 **Ambient by default, muted by default** | Generated UI/ambience audio, plus onboarding you can dismiss whenever |

## Rooms

<table>
<tr>
<td width="50%">

**Developer Studio**
<br>
<img src="https://github.com/chrisriv10/WebBurrow/raw/main/docs/screenshots/developer-studio.png" alt="Developer Studio">

</td>
<td width="50%">

**Media Lounge**
<br>
<img src="https://github.com/chrisriv10/WebBurrow/raw/main/docs/screenshots/media-lounge.png" alt="Media Lounge">

</td>
</tr>
</table>

---

## Get it running

### Install on Windows

Grab the latest `WebBurrow-Setup-x64.exe` from the [Releases](../../releases) page, or build it yourself:

```bash
npm install
npm run desktop:dist
```

Building locally produces `release/WebBurrow-Setup-1.0.0-x64.exe`. Either way, the installer:

- installs per-user with a chosen install directory
- creates Desktop and Start Menu shortcuts
- registers the `webburrow://` protocol
- registers the native-host origin for Chrome, Edge, and Brave

> ⚠️ The installer is **unsigned**, so Windows SmartScreen will warn you on first run. 

Prefer an unpacked build instead? Run `npm run desktop:pack`. Full details: [docs/building.md](docs/building.md).

### Run from source

Requires **Node.js ≥ 22.13**.

This minimum is intentional: the lockfile records Node 22.13.0 as the first supported Node 22 release for `jsdom` and `@napi-rs/wasm-runtime` in the test/build toolchain.

```bash
npm install
npm run dev
```

Open the local URL the dev server prints. Sites always open in your system browser or an isolated tab.

### Browser companion

```bash
npm run extension:build
```

Load `browser-extension/dist` as an unpacked extension in Chrome, Edge, or Brave.

<p align="center">
  <img src="https://github.com/chrisriv10/WebBurrow/raw/main/docs/screenshots/browser-workspace.png" alt="Temporary browser workspace" width="700">
</p>

It can send the active page, selected tabs, a window, or a tab group into a temporary workspace, or preview bookmarks for import. Permissions scale with what you actually use: `activeTab`, `storage`, and `nativeMessaging` are required; `tabs`, `tabGroups`, and `bookmarks` only get requested when their feature is invoked. Temporary workspaces never touch IndexedDB or exports and vanish on next launch unless you explicitly promote them. Setup and full permission model: [docs/browser-companion.md](docs/browser-companion.md).

---

## Controls

| Input | Action |
|---|---|
| `W A S D` | Move |
| Mouse | Look around |
| `Shift` | Gentle sprint |
| `Space` | Jump |
| `E` | Use a nearby object or live surface |
| `Ctrl+K` or `/` | Quick Access |
| `T` | Burrow Tray |
| `Alt+1` / `2` / `3` | Travel to starter rooms |
| `Home` | Return to a safe spawn |
| `Esc` | Release mouse look / close dialog |

In Edit mode, switch between **Camera mode** and **Place objects**. Drag to orbit, scroll to zoom, and use `W A S D` plus `Q / E` to fly through the room while arranging objects.

No first-person skills required: every workflow is also reachable through accessible HTML controls, and small windows automatically fall back to a companion layout instead of forcing mouse-look gameplay.

<p align="center">
  <img src="https://github.com/chrisriv10/WebBurrow/raw/main/docs/screenshots/edit-mode.png" alt="WebBurrow edit mode with camera controls" width="800">
</p>

## Quick Access

<p align="center">
  <img src="https://github.com/chrisriv10/WebBurrow/raw/main/docs/screenshots/quick-access.png" alt="Quick Access" width="700">
</p>

`Ctrl+K` (or `/`) opens a single search surface. Local fuzzy matches always come first.

| Prefix | Searches |
|---|---|
| `> command` | Commands |
| `g query` | Google |
| `yt query` | YouTube |
| `gh query` | GitHub |

Plain unmatched text shows an explicit web-search result. It never launches automatically. DuckDuckGo is the default provider.

## Navigator

<p align="center">
  <img src="https://github.com/chrisriv10/WebBurrow/raw/main/docs/screenshots/navigator.png" alt="WebBurrow Navigator command center" width="1000">
</p>

Navigator is the expansive companion to Quick Access. Search and fuzzy-filter sites, rooms, collections, temporary browser sessions, integrations, commands, and web-search targets in one visual workspace. Result cards expose local artwork and favicons, while the details pane supports opening or focusing a real browser tab, favorites, editing, collection and room organization, and object-type changes. Drag site cards into rooms or collections, group results by domain or context, and create temporary research workspaces that open their links in your system browser. Navigator is local-first and never embeds or renders third-party websites.

---

## Integrations & privacy

Every integration below ships **disabled**, and none fires a network request before you explicitly configure it.

| Integration | Behavior |
|---|---|
| **GitHub** | Public repo data only, up to 5 repos, ETag-aware, hourly refresh |
| **Weather** | Manually selected city — device location is never requested |
| **Calendar** | Local `.ics`, local events, or chosen HTTPS feeds with bounded recurrence expansion |
| **RSS/Atom** | Text-only headlines and safe article URLs; remote HTML is never rendered |

Whether a web request succeeds still depends on the source's own CORS policy. On desktop, WebBurrow uses hardened, adapter-specific HTTPS calls with public-address pinning, redirect revalidation, MIME/size limits, and timeouts. Favicon fetches are same-origin, capped at 64 KiB, downsized to at most 64×64, cached locally, and excluded from exports.

Full boundary model: [PRIVACY_AND_SECURITY.md](PRIVACY_AND_SECURITY.md).

## Architecture

- **Stack:** React 19, TypeScript, Vite/vinext, React Three Fiber, Drei, Rapier, Zustand, Dexie, Zod, ICAL.js
- A kinematic capsule controller drives frame-by-frame movement directly, without pushing player telemetry through React
- A single shared room-layout registry powers world colliders, placement/mounting, migrations, and the 2D Mini Burrow
- Dexie schema 5 preserves older data; layout version 3 remaps legacy placements into the authored room footprints. Portable exports stay on `ConfigEnvelope V3`
- Integration adapters return serializable search/tray/world view models; an isolated runtime handles cache-first refresh with stale fallback
- Electron runs a sandboxed renderer with context isolation, a purpose-built preload, and discriminated privileged operations

## Verify / test

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run desktop:build
npm run extension:build
```

The desktop smoke harness checks startup, preload availability, renderer console errors, key release views, performance counters, and hidden-window suspension. The suite currently runs **70** fixture-driven, integration, store, persistence, contract, and Testing Library checks. Full release process: [docs/building.md](docs/building.md).

## Docs

- [1.0.0 release notes](docs/releases/1.0.0.md)
- [CHANGELOG.md](CHANGELOG.md)
- [THIRD_PARTY_ASSETS.md](THIRD_PARTY_ASSETS.md)
- [docs/building.md](docs/building.md)
- [docs/browser-companion.md](docs/browser-companion.md)
- [PRIVACY_AND_SECURITY.md](PRIVACY_AND_SECURITY.md)
