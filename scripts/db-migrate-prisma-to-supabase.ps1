param(
  [Parameter(Mandatory = $true)]
  [string]$SourceDbUrl,

  [Parameter(Mandatory = $true)]
  [string]$TargetDbUrl,

  [string]$BackupFile = ".\\scripts\\backup-prisma-to-supabase.dump",

  [switch]$SkipRestore,

  [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found. Install PostgreSQL client tools (pg_dump, pg_restore, psql) and retry."
  }
}

function Get-PlainTextFromSecureString {
  param([Security.SecureString]$SecureString)

  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Invoke-DbScalar {
  param(
    [string]$DbUrl,
    [string]$Query
  )

  $output = psql --dbname=$DbUrl -v ON_ERROR_STOP=1 -t -A -c $Query
  if ($LASTEXITCODE -ne 0) {
    throw "Query failed: $Query"
  }
  return ($output | Out-String).Trim()
}

function Get-UserTables {
  param([string]$DbUrl)

  $sql = "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations' ORDER BY tablename;"
  $output = psql --dbname=$DbUrl -v ON_ERROR_STOP=1 -t -A -c $sql
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to list tables from database."
  }

  return ($output | Where-Object { $_ -and $_.Trim().Length -gt 0 })
}

Write-Host "[1/5] Validating required PostgreSQL tools..." -ForegroundColor Cyan
Require-Command "pg_dump"
Require-Command "pg_restore"
Require-Command "psql"

if ($TargetDbUrl -match "\[YOUR-PASSWORD\]") {
  Write-Host "Supabase target URL contains [YOUR-PASSWORD]. Prompting securely for DB password..." -ForegroundColor Yellow
  $securePassword = Read-Host "Enter Supabase DB password" -AsSecureString
  $plainPassword = Get-PlainTextFromSecureString -SecureString $securePassword
  if ([string]::IsNullOrWhiteSpace($plainPassword)) {
    throw "Supabase DB password cannot be empty."
  }
  $encodedPassword = [uri]::EscapeDataString($plainPassword)
  $TargetDbUrl = $TargetDbUrl -replace "\[YOUR-PASSWORD\]", $encodedPassword
}

Write-Host "[2/5] Creating source backup: $BackupFile" -ForegroundColor Cyan
$backupDir = Split-Path -Parent $BackupFile
if ($backupDir -and -not (Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

pg_dump --format=custom --no-owner --no-acl --dbname=$SourceDbUrl --file=$BackupFile
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed."
}

if (-not $SkipRestore) {
  Write-Host "[3/5] Restoring backup into target database..." -ForegroundColor Cyan
  pg_restore --clean --if-exists --no-owner --no-acl --single-transaction --dbname=$TargetDbUrl $BackupFile
  if ($LASTEXITCODE -ne 0) {
    throw "pg_restore failed."
  }
} else {
  Write-Host "[3/5] Restore skipped by flag." -ForegroundColor Yellow
}

if (-not $SkipVerify) {
  Write-Host "[4/5] Verifying row counts for all public tables..." -ForegroundColor Cyan
  $tables = Get-UserTables -DbUrl $SourceDbUrl

  if (-not $tables -or $tables.Count -eq 0) {
    throw "No public tables discovered in source database."
  }

  $mismatch = @()

  foreach ($table in $tables) {
    $q = "SELECT COUNT(*) FROM public.`"$table`";"
    $sourceCount = Invoke-DbScalar -DbUrl $SourceDbUrl -Query $q
    $targetCount = Invoke-DbScalar -DbUrl $TargetDbUrl -Query $q

    if ($sourceCount -ne $targetCount) {
      $mismatch += [PSCustomObject]@{
        table = $table
        source = $sourceCount
        target = $targetCount
      }
    }
  }

  if ($mismatch.Count -gt 0) {
    Write-Host "Row count mismatches detected:" -ForegroundColor Red
    $mismatch | Format-Table -AutoSize
    throw "Verification failed. Do not cut over yet."
  }

  Write-Host "Row counts matched for $($tables.Count) tables." -ForegroundColor Green
} else {
  Write-Host "[4/5] Verification skipped by flag." -ForegroundColor Yellow
}

Write-Host "[5/5] Migration completed. Next: run Prisma checks against target DB." -ForegroundColor Green
Write-Host "- npx prisma migrate status"
Write-Host "- npx prisma migrate deploy"
