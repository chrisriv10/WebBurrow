param(
  [string]$Source = 'build/icon.png',
  [string]$IcoOutput = 'build/icon.ico',
  [string]$RuntimeOutput = 'desktop/icon.png'
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

if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
  throw "Desktop icon source not found: $sourcePath"
}

Add-Type -AssemblyName System.Drawing

$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
try {
  if ($sourceImage.Width -ne $sourceImage.Height) {
    throw 'The desktop icon source must be square.'
  }

  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($icoPath)) | Out-Null
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($runtimePath)) | Out-Null
  [System.IO.File]::Copy($sourcePath, $runtimePath, $true)

  $sizes = @(16, 24, 32, 48, 64, 128, 256)
  $pngEntries = [System.Collections.Generic.List[byte[]]]::new()

  foreach ($size in $sizes) {
    $bitmap = [System.Drawing.Bitmap]::new(
      $size,
      $size,
      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
      } finally {
        $graphics.Dispose()
      }

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
