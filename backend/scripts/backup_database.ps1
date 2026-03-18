# ============================================
# Script de Backup BDD - Phase 0 Multi-Tenant
# ============================================
# Usage: .\backup_database.ps1
# Prérequis: MySQL installé et accessible via PATH (WAMP)

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "3306",
    [string]$DbUser = "root",
    [string]$DbPassword = "",
    [string]$DbName = "bdd_scolaire",
    [string]$BackupDir = "..\backups"
)

$ErrorActionPreference = "Stop"

# Couleurs pour output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "📋 $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️ $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  BACKUP BDD - SGS Multi-Tenant" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Vérifier que le dossier backup existe
$BackupPath = Join-Path $PSScriptRoot $BackupDir
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    Write-Info "Dossier backup créé: $BackupPath"
}

# Générer nom de fichier avec timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupPath "${DbName}_backup_${Timestamp}_pre_multitenancy.sql"
$ChecksumFile = Join-Path $BackupPath "${DbName}_backup_${Timestamp}.sha256"

Write-Info "Configuration:"
Write-Host "  - Host: $DbHost`:$DbPort"
Write-Host "  - Database: $DbName"
Write-Host "  - Backup: $BackupFile"
Write-Host ""

# Trouver mysqldump (WAMP)
$MysqlDumpPaths = @(
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysqldump.exe",
    "C:\wamp64\bin\mysql\mysql8.0.30\bin\mysqldump.exe",
    "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysqldump.exe",
    "C:\wamp64\bin\mysql\mysql5.7.36\bin\mysqldump.exe",
    "C:\wamp\bin\mysql\mysql8.0.31\bin\mysqldump.exe",
    "C:\xampp\mysql\bin\mysqldump.exe",
    "mysqldump.exe"  # Si dans PATH
)

$MysqlDump = $null
foreach ($path in $MysqlDumpPaths) {
    if (Test-Path $path) {
        $MysqlDump = $path
        break
    }
    # Essayer via which/where
    try {
        $found = Get-Command $path -ErrorAction SilentlyContinue
        if ($found) {
            $MysqlDump = $found.Source
            break
        }
    } catch {}
}

if (-not $MysqlDump) {
    Write-Error "mysqldump non trouvé! Vérifiez que WAMP est installé."
    Write-Info "Chemins vérifiés:"
    $MysqlDumpPaths | ForEach-Object { Write-Host "  - $_" }
    exit 1
}

Write-Success "mysqldump trouvé: $MysqlDump"

# Exécuter le backup
Write-Info "Création du backup en cours..."

$DumpArgs = @(
    "-h$DbHost",
    "-P$DbPort", 
    "-u$DbUser",
    "--single-transaction",
    "--routines",
    "--triggers",
    "--events",
    "--add-drop-database",
    "--databases", $DbName
)

if ($DbPassword) {
    $DumpArgs = @("-p$DbPassword") + $DumpArgs
}

try {
    & $MysqlDump $DumpArgs | Out-File -FilePath $BackupFile -Encoding UTF8
    
    if ($LASTEXITCODE -ne 0) {
        throw "mysqldump a retourné une erreur (code: $LASTEXITCODE)"
    }
    
    Write-Success "Dump créé: $BackupFile"
} catch {
    Write-Error "Erreur lors du dump: $_"
    exit 1
}

# Vérifier la taille du fichier
$FileInfo = Get-Item $BackupFile
$FileSizeMB = [math]::Round($FileInfo.Length / 1MB, 2)
Write-Info "Taille du backup: $FileSizeMB MB"

if ($FileInfo.Length -lt 1000) {
    Write-Warning "Le fichier semble trop petit, vérifiez le contenu!"
}

# Générer checksum SHA256
Write-Info "Génération du checksum SHA256..."
$Hash = Get-FileHash -Path $BackupFile -Algorithm SHA256
"$($Hash.Hash)  $(Split-Path $BackupFile -Leaf)" | Out-File -FilePath $ChecksumFile -Encoding UTF8
Write-Success "Checksum: $ChecksumFile"

# Compter les tables dans le dump
$TableCount = (Select-String -Path $BackupFile -Pattern "^CREATE TABLE" -AllMatches).Matches.Count
Write-Info "Tables dans le backup: $TableCount"

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BACKUP TERMINÉ AVEC SUCCÈS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Fichiers créés:"
Write-Host "  📦 $BackupFile"
Write-Host "  🔐 $ChecksumFile"
Write-Host ""
Write-Host "Prochaines étapes:"
Write-Host "  1. Copier le backup sur un stockage externe"
Write-Host "  2. Tester la restauration avec: .\restore_database.ps1"
Write-Host "  3. Continuer avec Phase 1"
Write-Host ""



