# Building and verifying WebBurrow 1.0.0

## Prerequisites

- Windows 10/11 for the desktop installer
- Node.js 22.13 or newer and npm
- A Chromium-class browser with WebGL2 for spatial gameplay

## Development and web build

```powershell
npm install
npm run dev
npm run build
```

The production web build remains Sites-compatible, which is why `.openai/hosting.json` is retained with `d1` and `r2` set to `null`. Building does not deploy anything.

## Desktop build

```powershell
npm run desktop:build
npm run desktop:pack
npm run desktop:dist
```

`desktop:pack` produces an ignored `release/win-unpacked` directory. `desktop:dist` produces the ignored unsigned `release/WebBurrow-Setup-1.0.0-x64.exe`. The build script stages Electron under Windows Temp before copying completed output back to `release`, reducing protected-folder/antivirus rename races.

The icon generator derives Windows ICO sizes, runtime PNG, web metadata icon, and extension PNG sizes from the user-supplied `build/icon.png` artwork.

## Companion build

```powershell
npm run extension:build
```

The validator checks Manifest V3, version parity, pinned identity, exact required/optional permissions, absence of broad hosts/content scripts, and all generated icon files. Output under `browser-extension/dist` is ignored.

## Automated gates

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run desktop:build
npm run extension:build
```

Run the desktop smoke harness through the console Electron executable so renderer logs remain visible:

```powershell
node_modules\.bin\electron.cmd . --smoke-test
```

Optional QA views are `studio`, `lounge`, `tray`, `launcher`, `edit`, `add`, `data`, `compact`, `integrations`, `customize`, `session`, `workspace`, `stress`, and `onboarding`. Add `--screenshot=<absolute-path>` to capture a current view. The `stress` view transfers 100 tabs and reports the longest synchronous arrival task with the normal render metrics.

The harness reports `WEBBURROW_PERFORMANCE`, hides the window, then asserts that frame samples, Mini Burrow marker work, and integration refreshes stop before printing `WEBBURROW_DESKTOP_SMOKE_OK`.

## Installer install/uninstall check

Use an isolated current-user directory, invoke the installer silently with `/S /D=<absolute-directory>`, verify the installed executable, WebBurrow-artwork shortcut, protocol route, and JSON-valid exact-origin native-host registrations, run the installed app’s smoke mode, then invoke `Uninstall WebBurrow.exe /S`. Do not point this process at an existing installation or shared directory.

The repository includes a guarded audit script. It refuses to run when it detects an unrelated current-user WebBurrow installation, confines application files to a unique Windows Temp directory, and validates cleanup:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-installer.ps1 `
  -Installer release/WebBurrow-Setup-1.0.0-x64.exe
```

Pass `-PreviousInstaller <path>` to verify that an earlier 1.0.0 installer can be replaced by the improved same-version build before the final uninstall check.

Release binaries, unpacked output, raw QA captures, and extension output stay ignored. Only curated screenshots under `docs/screenshots` are tracked.
