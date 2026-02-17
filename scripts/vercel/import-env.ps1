param(
  [string]$FilePath = "templates/vercel/env.production.example",
  [ValidateSet("production", "preview", "development")]
  [string]$Environment = "production"
)

if (!(Test-Path $FilePath)) {
  Write-Error "Env file not found: $FilePath"
  exit 1
}

if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Error "Vercel CLI is not installed. Install with: npm i -g vercel"
  exit 1
}

$lines = Get-Content $FilePath
$pairs = @()

foreach ($line in $lines) {
  $trimmed = $line.Trim()
  if ($trimmed.Length -eq 0) { continue }
  if ($trimmed.StartsWith("#")) { continue }
  if ($trimmed -notmatch "=") { continue }

  $parts = $trimmed.Split("=", 2)
  $key = $parts[0].Trim()
  $value = $parts[1]

  if ($key.Length -eq 0) { continue }
  $pairs += [PSCustomObject]@{
    Key = $key
    Value = $value
  }
}

if ($pairs.Count -eq 0) {
  Write-Error "No KEY=VALUE entries found in $FilePath"
  exit 1
}

Write-Host "Importing $($pairs.Count) env vars into Vercel ($Environment)..."
Write-Host "Tip: run 'vercel link' first if this folder is not linked."

foreach ($pair in $pairs) {
  try {
    $pair.Value | vercel env add $pair.Key $Environment --yes | Out-Null
    Write-Host "[OK] $($pair.Key)"
  } catch {
    Write-Warning "[SKIP/ERR] $($pair.Key) -> $($_.Exception.Message)"
  }
}

Write-Host "Done."
