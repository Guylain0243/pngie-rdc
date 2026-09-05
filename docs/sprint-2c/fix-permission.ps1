$content = Get-Content db/schema.sqlite.sql -Raw

$old = "CREATE TABLE permission (`n  permission_id TEXT PRIMARY KEY,`n  code TEXT UNIQUE NOT NULL,`n  nom TEXT NOT NULL`n);"

$new = "CREATE TABLE permission (`n  permission_id TEXT PRIMARY KEY,`n  role_id TEXT NOT NULL REFERENCES role(role_id),`n  entite TEXT NOT NULL,`n  action TEXT NOT NULL`n);`nCREATE INDEX idx_permission_role ON permission(role_id);"

if ($content -notmatch [regex]::Escape($old)) {
  Write-Host "ANCIEN BLOC NON TROUVE - verification manuelle requise"
} else {
  $content = $content -replace [regex]::Escape($old), $new
  Set-Content -Path db/schema.sqlite.sql -Value $content
  Write-Host "REMPLACEMENT OK"
}
