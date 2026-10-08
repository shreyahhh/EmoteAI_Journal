# Starts the model server for local development with the login check ON.
# It reads the app's PUBLIC Supabase URL and anon key from ../frontend-new/.env.local
# (the same values the browser already has), so there is nothing to retype and no secret involved.
#
#   cd ml ; .\run_dev.ps1
$envFile = Join-Path $PSScriptRoot '..\frontend-new\.env.local'
if (-not (Test-Path $envFile)) { throw "Missing $envFile" }
function Get-EnvValue($name) {
  $m = Select-String -Path $envFile -Pattern "^\s*$name\s*=\s*(.*)$" | Select-Object -First 1
  if (-not $m) { throw "$name not found in .env.local" }
  $m.Matches.Groups[1].Value.Trim().Trim('"', "'")
}
$env:SUPABASE_URL = Get-EnvValue 'REACT_APP_SUPABASE_URL'
$env:SUPABASE_ANON_KEY = Get-EnvValue 'REACT_APP_SUPABASE_ANON_KEY'
$env:HF_HUB_DISABLE_SYMLINKS_WARNING = '1'
Set-Location $PSScriptRoot
& "$PSScriptRoot\.venv\Scripts\python.exe" -m uvicorn server:app --port 8000
