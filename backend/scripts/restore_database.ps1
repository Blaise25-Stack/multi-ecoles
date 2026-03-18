# ============================================
# Script de Restauration BDD - Phase 0
# ============================================
# Usage: .\restore_database.ps1 -BackupFile "chemin\vers\backup.sql" [-TargetDb "bdd_scolaire_test"]

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DbHost = "localhost",
    [string]$DbPort = "3306",
    [string]$DbUser = "root",
    [string]$DbPassword = "",
    [string]$TargetDb = "bdd_scolaire_restore_test"
)

$ErrorActionPreference = "Stop"

function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "📋 $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️ $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  RESTAURATION BDD - Test" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Vérifier que le fichier existe
if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Fichier backup non trouvé: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Info "Configuration:"
Write-Host "  - Source: $BackupFile"
Write-Host "  - Target DB: $TargetDb"
Write-Host "  - Host: $DbHost`:$DbPort"
Write-Host ""

# Trouver mysql
$MysqlPaths = @(
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.30\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe",
    "C:\wamp\bin\mysql\mysql8.0.31\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "mysql.exe"
)

$Mysql = $null
foreach ($path in $MysqlPaths) {
    if (Test-Path $path) {
        $Mysql = $path
        break
    }
    try {
        $found = Get-Command $path -ErrorAction SilentlyContinue
        if ($found) {
            $Mysql = $found.Source
            break
        }
    } catch {}
}

if (-not $Mysql) {
    Write-Host "❌ mysql non trouvé!" -ForegroundColor Red
    exit 1
}

Write-Success "mysql trouvé: $Mysql"

# Préparer les arguments
$BaseArgs = @("-h$DbHost", "-P$DbPort", "-u$DbUser")
if ($DbPassword) {
    $BaseArgs = @("-p$DbPassword") + $BaseArgs
}

# Créer la base de données cible si elle n'existe pas
Write-Info "Création de la base de données $TargetDb..."
$CreateDbQuery = "CREATE DATABASE IF NOT EXISTS ``$TargetDb`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

try {
    echo $CreateDbQuery | & $Mysql $BaseArgs
    Write-Success "Base de données prête"
} catch {
    Write-Warning "Impossible de créer la DB (peut-être existe déjà): $_"
}

# Restaurer le backup
Write-Info "Restauration en cours (peut prendre quelques minutes)..."

# Modifier le fichier pour utiliser la DB cible au lieu de l'originale
$TempFile = [System.IO.Path]::GetTempFileName()
$Content = Get-Content $BackupFile -Raw
$Content = $Content -replace "USE ``bdd_scolaire``", "USE ``$TargetDb``"
$Content = $Content -replace "CREATE DATABASE.*``bdd_scolaire``", "-- Skipped CREATE DATABASE"
$Content | Out-File -FilePath $TempFile -Encoding UTF8

try {
    Get-Content $TempFile | & $Mysql $BaseArgs $TargetDb
    
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur de restauration (code: $LASTEXITCODE)"
    }
    
    Write-Success "Restauration terminée!"
} catch {
    Write-Host "❌ Erreur lors de la restauration: $_" -ForegroundColor Red
    Remove-Item $TempFile -Force -ErrorAction SilentlyContinue
    exit 1
}

# Cleanup
Remove-Item $TempFile -Force -ErrorAction SilentlyContinue

# Vérifier le nombre de tables
Write-Info "Vérification de la restauration..."
$CountQuery = "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = '$TargetDb';"
$TableCount = echo $CountQuery | & $Mysql $BaseArgs -N

Write-Info "Tables restaurées: $TableCount"

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  RESTAURATION TERMINÉE" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Base de données test: $TargetDb"
Write-Host ""
Write-Host "Pour nettoyer après test:"
Write-Host "  DROP DATABASE ``$TargetDb``;"
Write-Host ""



