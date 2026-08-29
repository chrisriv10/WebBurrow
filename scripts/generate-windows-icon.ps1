param(
  [string]$Source = 'build/icon.png',
  [string]$IcoOutput = 'build/icon.ico',
  [string]$RuntimeOutput = 'desktop/icon.png',
  [string]$ExtensionOutput = 'browser-extension/src/icons',
  [string]$WebOutput = 'public/webburrow-icon.png',
  [ValidateRange(0.5, 0.96)]
  [double]$ContentScale = 0.9
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

function Resolve-ProjectPath([string]$PathValue) {
  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }
  return [System.IO.Path]::GetFullPath((Join-Path $projectRoot $PathValue))
}

$sourcePath = Resolve-ProjectPath $Source
$icoPath = Resolve-ProjectPath $IcoOutput
$runtimePath = Resolve-ProjectPath $RuntimeOutput
$extensionPath = Resolve-ProjectPath $ExtensionOutput
$webPath = Resolve-ProjectPath $WebOutput

if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
  throw "Desktop icon source not found: $sourcePath"
}

Add-Type -AssemblyName System.Drawing

$sourceImage = [System.Drawing.Bitmap]::FromFile($sourcePath)
try {
  if ($sourceImage.Width -ne $sourceImage.Height) {
    throw 'The desktop icon source must be square.'
  }

  $minX = $sourceImage.Width
  $minY = $sourceImage.Height
  $maxX = -1
  $maxY = -1
  for ($y = 0; $y -lt $sourceImage.Height; $y++) {
    for ($x = 0; $x -lt $sourceImage.Width; $x++) {
      if ($sourceImage.GetPixel($x, $y).A -gt 4) {
        $minX = [System.Math]::Min($minX, $x)
        $minY = [System.Math]::Min($minY, $y)
        $maxX = [System.Math]::Max($maxX, $x)
        $maxY = [System.Math]::Max($maxY, $y)
      }
    }
  }
  if ($maxX -lt $minX -or $maxY -lt $minY) {
    throw 'The desktop icon source has no visible pixels.'
  }

  $visibleWidth = $maxX - $minX + 1
  $visibleHeight = $maxY - $minY + 1
  $cropSize = [System.Math]::Min(
    $sourceImage.Width,
    [System.Math]::Ceiling([System.Math]::Max($visibleWidth, $visibleHeight) / $ContentScale)
  )
  $visibleCenterX = ($minX + $maxX + 1) / 2
  $visibleCenterY = ($minY + $maxY + 1) / 2
  $cropX = [System.Math]::Max(
    0,
    [System.Math]::Min($sourceImage.Width - $cropSize, $visibleCenterX - ($cropSize / 2))
  )
  $cropY = [System.Math]::Max(
    0,
    [System.Math]::Min($sourceImage.Height - $cropSize, $visibleCenterY - ($cropSize / 2))
  )

  function New-FramedIconBitmap([int]$Size) {
    $bitmap = [System.Drawing.Bitmap]::new(
      $Size,
      $Size,
      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $destination = [System.Drawing.Rectangle]::new(0, 0, $Size, $Size)
      $graphics.DrawImage(
        $sourceImage,
        $destination,
        [single]$cropX,
        [single]$cropY,
        [single]$cropSize,
        [single]$cropSize,
        [System.Drawing.GraphicsUnit]::Pixel
      )
    } finally {
      $graphics.Dispose()
    }
    return $bitmap
  }

  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($icoPath)) | Out-Null
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($runtimePath)) | Out-Null
  [System.IO.Directory]::CreateDirectory($extensionPath) | Out-Null
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($webPath)) | Out-Null

  $runtimeBitmap = New-FramedIconBitmap 512
  try {
    $runtimeBitmap.Save($runtimePath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $runtimeBitmap.Dispose()
  }

  $sizes = @(16, 24, 32, 48, 64, 128, 256)
  $pngEntries = [System.Collections.Generic.List[byte[]]]::new()

  foreach ($size in $sizes) {
    $bitmap = New-FramedIconBitmap $size
    try {
      $stream = [System.IO.MemoryStream]::new()
      try {
        $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngEntries.Add($stream.ToArray())
      } finally {
        $stream.Dispose()
      }
    } finally {
      $bitmap.Dispose()
    }
  }

  foreach ($size in @(16, 32, 48, 128)) {
    $index = [System.Array]::IndexOf($sizes, $size)
    [System.IO.File]::WriteAllBytes(
      (Join-Path $extensionPath "icon$size.png"),
      $pngEntries[$index]
    )
  }
  [System.IO.File]::WriteAllBytes($webPath, $pngEntries[[System.Array]::IndexOf($sizes, 256)])

  $fileStream = [System.IO.File]::Open(
    $icoPath,
    [System.IO.FileMode]::Create,
    [System.IO.FileAccess]::Write,
    [System.IO.FileShare]::None
  )
  $writer = [System.IO.BinaryWriter]::new($fileStream)
  try {
    $writer.Write([uint16]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]$sizes.Count)

    $dataOffset = 6 + (16 * $sizes.Count)
    for ($index = 0; $index -lt $sizes.Count; $index++) {
      $size = $sizes[$index]
      $png = $pngEntries[$index]
      $dimensionByte = if ($size -eq 256) { 0 } else { $size }

      $writer.Write([byte]$dimensionByte)
      $writer.Write([byte]$dimensionByte)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([uint16]1)
      $writer.Write([uint16]32)
      $writer.Write([uint32]$png.Length)
      $writer.Write([uint32]$dataOffset)
      $dataOffset += $png.Length
    }

    foreach ($png in $pngEntries) {
      $writer.Write($png)
    }
  } finally {
    $writer.Dispose()
  }
} finally {
  $sourceImage.Dispose()
}

Write-Output "Windows icon: $icoPath"
Write-Output "Runtime icon: $runtimePath"
Write-Output "Extension icons: $extensionPath"
Write-Output "Web icon: $webPath"
Write-Output "Visible artwork centered at $([System.Math]::Round($ContentScale * 100))% scale"
