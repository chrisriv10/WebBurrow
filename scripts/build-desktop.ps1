param(
  [ValidateSet('nsis', 'dir')]
  [string]$Target = 'nsis'
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'release'))
$tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$stagingRoot = [System.IO.Path]::Combine(
  $tempRoot,
  "webburrow-electron-$([System.Guid]::NewGuid().ToString('N'))"
)

if (-not $releaseRoot.StartsWith(
  $projectRoot + [System.IO.Path]::DirectorySeparatorChar,
  [System.StringComparison]::OrdinalIgnoreCase
)) {
  throw 'Refusing to write installer output outside the project.'
}

if (-not $stagingRoot.StartsWith(
  $tempRoot,
  [System.StringComparison]::OrdinalIgnoreCase
)) {
  throw 'Refusing to use a staging directory outside Windows Temp.'
}

Push-Location $projectRoot
try {
  & npm run desktop:build
  if ($LASTEXITCODE -ne 0) { throw 'Desktop renderer build failed.' }

  & npx electron-builder --win $Target "--config.directories.output=$stagingRoot"
  if ($LASTEXITCODE -ne 0) { throw 'Electron packaging failed.' }

  New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null

  if ($Target -eq 'nsis') {
    $installer = Get-ChildItem -LiteralPath $stagingRoot -Filter 'WebBurrow-Setup-*.exe' |
      Sort-Object LastWriteTimeUtc -Descending |
      Select-Object -First 1
    if (-not $installer) { throw 'The NSIS installer was not produced.' }

    Copy-Item -LiteralPath $installer.FullName -Destination $releaseRoot -Force
    $blockMap = "$($installer.FullName).blockmap"
    if (Test-Path -LiteralPath $blockMap) {
      Copy-Item -LiteralPath $blockMap -Destination $releaseRoot -Force
    }
    Write-Output "Windows installer: $releaseRoot\$($installer.Name)"
  } else {
    $unpacked = Join-Path $stagingRoot 'win-unpacked'
    if (-not (Test-Path -LiteralPath $unpacked)) {
      throw 'The unpacked Windows application was not produced.'
    }
    $destination = Join-Path $releaseRoot 'win-unpacked'
    if (Test-Path -LiteralPath $destination) {
      Remove-Item -LiteralPath $destination -Recurse -Force
    }
    Copy-Item -LiteralPath $unpacked -Destination $destination -Recurse
    Write-Output "Unpacked Windows application: $destination"
  }
} finally {
  Pop-Location
  if (
    (Test-Path -LiteralPath $stagingRoot) -and
    $stagingRoot.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
    ([System.IO.Path]::GetFileName($stagingRoot)).StartsWith('webburrow-electron-')
  ) {
    Remove-Item -LiteralPath $stagingRoot -Recurse -Force
  }
}
