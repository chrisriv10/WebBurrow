param(
  [Parameter(Mandatory = $true)]
  [string]$Installer,
  [string]$PreviousInstaller
)

$ErrorActionPreference = 'Stop'
$tempRoot = [System.IO.Path]::GetFullPath($env:TEMP).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$auditRoot = [System.IO.Path]::GetFullPath((Join-Path $env:TEMP "webburrow-installer-audit-$([System.Guid]::NewGuid().ToString('N'))"))
if (-not $auditRoot.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Refusing to use an installer audit directory outside Windows Temp.'
}

$installerPath = (Resolve-Path -LiteralPath $Installer).Path
$previousPath = if ($PreviousInstaller) { (Resolve-Path -LiteralPath $PreviousInstaller).Path } else { $null }
$appExe = Join-Path $auditRoot 'WebBurrow.exe'
$uninstaller = Join-Path $auditRoot 'Uninstall WebBurrow.exe'
$manifestPath = Join-Path $env:LOCALAPPDATA 'WebBurrow\native-messaging-host.json'
$desktopShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'WebBurrow.lnk'
$hostKeys = @(
  'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.webburrow.desktop',
  'HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.webburrow.desktop',
  'HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.webburrow.desktop'
)

$protocolKey = 'HKCU:\Software\Classes\webburrow'
$developmentProtocol = $false
if (Test-Path -LiteralPath "$protocolKey\shell\open\command") {
  $existingProtocol = (Get-Item -LiteralPath "$protocolKey\shell\open\command").GetValue('')
  $developmentProtocol = $existingProtocol.Contains('node_modules\electron\dist\electron.exe') -and $existingProtocol.Contains((Resolve-Path '.').Path)
}
if ((Test-Path -LiteralPath $manifestPath) -or (Test-Path -LiteralPath $desktopShortcut) -or
    ((Test-Path -LiteralPath $protocolKey) -and -not $developmentProtocol) -or
    ($hostKeys | Where-Object { Test-Path -LiteralPath $_ })) {
  throw 'A current-user WebBurrow installation or registration already exists; refusing to disturb it.'
}

function Install-WebBurrow([string]$Path) {
  $process = Start-Process -FilePath $Path -ArgumentList @('/S', "/D=$auditRoot") -Wait -PassThru -WindowStyle Hidden
  if ($process.ExitCode -ne 0) { throw "Installer exited with code $($process.ExitCode)." }
  if (-not (Test-Path -LiteralPath $appExe)) { throw 'Installer did not create WebBurrow.exe.' }
}

function Test-PackagedApp([string]$Name) {
  $resultPath = Join-Path $auditRoot "$Name-smoke.json"
  $process = Start-Process -FilePath $appExe -ArgumentList @('--smoke-test', "--smoke-result=$resultPath") -Wait -PassThru -WindowStyle Hidden
  if ($process.ExitCode -ne 0) { throw "Installed app smoke process exited with code $($process.ExitCode)." }
  $result = Get-Content -Raw -LiteralPath $resultPath | ConvertFrom-Json
  if ($result.stage -ne 'complete') { throw "Installed app smoke test stopped at $($result.stage)." }
}

try {
  $previousHash = $null
  if ($previousPath) {
    Install-WebBurrow $previousPath
    Test-PackagedApp 'previous'
    $previousHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $appExe).Hash
  }

  Install-WebBurrow $installerPath
  Test-PackagedApp 'current'
  $currentHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $appExe).Hash
  if ($previousHash -and $previousHash -eq $currentHash) { throw 'The same-version upgrade did not replace the installed executable.' }

  $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
  if ($manifest.name -ne 'com.webburrow.desktop' -or $manifest.allowed_origins.Count -ne 1 -or
      $manifest.allowed_origins[0] -ne 'chrome-extension://igfepplhdmogifjmgfligakhgoacflhg/') {
    throw 'The native-host manifest is not exact-origin constrained.'
  }
  foreach ($key in $hostKeys) {
    if ((Get-Item -LiteralPath $key).GetValue('') -ne $manifestPath) { throw "Native-host registration mismatch at $key." }
  }

  $protocolCommand = (Get-Item -LiteralPath 'HKCU:\Software\Classes\webburrow\shell\open\command').GetValue('')
  if (-not $protocolCommand.Contains($appExe)) { throw 'The webburrow protocol does not target the audited executable.' }

  if (-not (Test-Path -LiteralPath $desktopShortcut)) { throw 'The Desktop shortcut was not created.' }
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($desktopShortcut)
  if ([System.IO.Path]::GetFullPath($shortcut.TargetPath) -ne [System.IO.Path]::GetFullPath($appExe)) { throw 'The Desktop shortcut target is incorrect.' }
  if (-not $shortcut.IconLocation.Contains('WebBurrow.exe')) { throw 'The Desktop shortcut does not use the WebBurrow application icon.' }

  $uninstallProcess = Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait -PassThru -WindowStyle Hidden
  if ($uninstallProcess.ExitCode -ne 0) { throw "Uninstaller exited with code $($uninstallProcess.ExitCode)." }
  Start-Sleep -Seconds 2

  if ((Test-Path -LiteralPath $appExe) -or (Test-Path -LiteralPath $manifestPath) -or
      (Test-Path -LiteralPath $desktopShortcut) -or (Test-Path -LiteralPath 'HKCU:\Software\Classes\webburrow') -or
      ($hostKeys | Where-Object { Test-Path -LiteralPath $_ })) {
    throw 'The uninstaller left application files, shortcut, protocol, or native-host registrations behind.'
  }

  [pscustomobject]@{
    PreviousVersionSmoke = [bool]$previousPath
    CurrentVersionSmoke = $true
    SameVersionUpgrade = [bool]$previousPath
    NativeHostRegistrations = 3
    Protocol = 'validated'
    DesktopIcon = 'validated'
    Uninstall = 'clean'
  }
}
finally {
  if (Test-Path -LiteralPath $uninstaller) {
    Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait -WindowStyle Hidden | Out-Null
    Start-Sleep -Seconds 2
  }
  if (Test-Path -LiteralPath $auditRoot) { Remove-Item -LiteralPath $auditRoot -Recurse -Force }
}
