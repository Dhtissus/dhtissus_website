$ErrorActionPreference = 'Stop'

$Port = 8080
$Root = $PSScriptRoot

$Mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.txt'  = 'text/plain; charset=utf-8'
  '.xml'  = 'application/xml; charset=utf-8'
  '.ico'  = 'image/x-icon'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
}

function Get-ContentType([string]$Path) {
  $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
  if ($Mime.ContainsKey($ext)) { return $Mime[$ext] }
  return 'application/octet-stream'
}

function Find-FreePort([int]$Preferred) {
  foreach ($port in @($Preferred, 8081, 8082, 8888, 3000)) {
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
    try {
      $listener.Start()
      $listener.Stop()
      return $port
    } catch {
      continue
    } finally {
      if ($listener.Server.IsBound) { $listener.Stop() }
    }
  }
  throw "Aucun port disponible autour de $Preferred."
}

$Port = Find-FreePort -Preferred $Port
$Url = "http://localhost:$Port/"

$Http = New-Object System.Net.HttpListener
$Http.Prefixes.Add($Url)
$Http.Start()

Write-Host ''
Write-Host '  DH TISSU — Site local demarre (PowerShell)'
Write-Host "  Ouvrez : $Url"
Write-Host '  Appuyez sur Ctrl+C pour arreter'
Write-Host ''

try {
  Start-Process $Url | Out-Null
} catch {
  Write-Host "  Ouvrez manuellement : $Url"
}

while ($Http.IsListening) {
  $context = $Http.GetContext()
  $request = $context.Request
  $response = $context.Response

  try {
    $rawPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($rawPath)) { $rawPath = 'index.html' }

    $filePath = [System.IO.Path]::GetFullPath((Join-Path $Root $rawPath))
    $rootFull = [System.IO.Path]::GetFullPath($Root)

    if (-not $filePath.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      $response.StatusCode = 403
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('403 Forbidden')
      $response.ContentType = 'text/plain; charset=utf-8'
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
      $response.Close()
      continue
    }

    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
      $response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
      $response.ContentType = 'text/plain; charset=utf-8'
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
      $response.Close()
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $response.StatusCode = 200
    $response.ContentType = Get-ContentType $filePath
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    $response.StatusCode = 500
    $msg = [System.Text.Encoding]::UTF8.GetBytes('500 Internal Server Error')
    $response.ContentType = 'text/plain; charset=utf-8'
    $response.OutputStream.Write($msg, 0, $msg.Length)
  } finally {
    $response.Close()
  }
}
