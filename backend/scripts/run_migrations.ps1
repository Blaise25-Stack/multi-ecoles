# ============================================
# Script d'exécution des migrations
# SGS Multi-Tenant
# ============================================
# Usage: .\run_migrations.ps1 [-Target "staging"|"production"] [-Migration "001"]

param(
    [ValidateSet("staging", "production", "development")]
    [string]$Target = "staging",
    [string]$Migration = "all",
    [string]$DbHost = "localhost",
    [string]$DbPort = "3306",
    [string]$DbUser = "root",
    [string]$DbPassword = "",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "📋 $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️ $msg" -ForegroundColor Yellow }
function Write-Step { param($msg) Write-Host "▶️ $msg" -ForegroundColor Blue }

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  MIGRATIONS SGS MULTI-TENANT" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Déterminer la base de données selon la cible
$DbName = switch ($Target) {
    "staging" { "bdd_scolaire_staging" }
    "production" { "bdd_scolaire" }
    "development" { "bdd_scolaire" }
}

Write-Info "Configuration:"
Write-Host "  - Cible: $Target"
Write-Host "  - Base: $DbName"
Write-Host "  - Host: $DbHost`:$DbPort"
Write-Host "  - Migration: $Migration"
Write-Host "  - Dry Run: $DryRun"
Write-Host ""

if ($Target -eq "production") {
    Write-Warning "ATTENTION: Vous êtes sur le point de migrer la PRODUCTION!"
    $confirm = Read-Host "Tapez 'PRODUCTION' pour confirmer"
    if ($confirm -ne "PRODUCTION") {
        Write-Host "Migration annulée" -ForegroundColor Red
        exit 1
    }
}

# Trouver MySQL
$MysqlPaths = @(
    "C:\wamp64\bin\mysql\mysql8.0.31\bin",
    "C:\wamp64\bin\mysql\mysql8.0.30\bin",
    "C:\wamp64\bin\mysql\mysql8.0.27\bin",
    "C:\wamp64\bin\mysql\mysql5.7.36\bin",
    "C:\wamp\bin\mysql\mysql8.0.31\bin",
    "C:\xampp\mysql\bin"
)

$MysqlBin = $null
foreach ($path in $MysqlPaths) {
    if (Test-Path (Join-Path $path "mysql.exe")) {
        $MysqlBin = $path
        break
    }
}

if (-not $MysqlBin) {
    Write-Host "❌ MySQL non trouvé!" -ForegroundColor Red
    exit 1
}

$Mysql = Join-Path $MysqlBin "mysql.exe"
Write-Success "MySQL trouvé: $MysqlBin"

# Arguments de connexion
$BaseArgs = @("-h$DbHost", "-P$DbPort", "-u$DbUser")
if ($DbPassword) {
    $BaseArgs = @("-p$DbPassword") + $BaseArgs
}

# Dossier des migrations
$MigrationsDir = Join-Path $PSScriptRoot "..\src\database\migrations"
$MigrationsDir = Resolve-Path $MigrationsDir

Write-Info "Dossier migrations: $MigrationsDir"

# Lister les migrations disponibles
$MigrationFiles = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | 
    Where-Object { $_.Name -match '^\d{3}_' } |
    Sort-Object Name

Write-Host ""
Write-Info "Migrations disponibles:"
foreach ($file in $MigrationFiles) {
    $num = $file.Name.Substring(0, 3)
    $name = $file.Name.Substring(4).Replace('.sql', '').Replace('_', ' ')
    Write-Host "  [$num] $name"
}
Write-Host ""

# Filtrer les migrations à exécuter
if ($Migration -ne "all") {
    $MigrationFiles = $MigrationFiles | Where-Object { $_.Name -like "$Migration*" }
    if ($MigrationFiles.Count -eq 0) {
        Write-Host "❌ Migration '$Migration' non trouvée" -ForegroundColor Red
        exit 1
    }
}

# Exécuter les migrations
$executedCount = 0
$errorCount = 0

foreach ($file in $MigrationFiles) {
    Write-Host ""
    Write-Step "Exécution: $($file.Name)"
    
    if ($DryRun) {
        Write-Warning "DRY RUN - Migration non exécutée"
        continue
    }
    
    try {
        # Exécuter le fichier SQL
        $output = Get-Content $file.FullName -Raw | & $Mysql $BaseArgs $DbName 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            throw "Erreur MySQL (code: $LASTEXITCODE)`n$output"
        }
        
        Write-Success "Migration réussie: $($file.Name)"
        
        # Afficher output pertinent
        if ($output) {
            $output -split "`n" | Where-Object { $_ -match "status|count|info" } | ForEach-Object {
                Write-Host "    $_" -ForegroundColor Gray
            }
        }
        
        $executedCount++
    }
    catch {
        Write-Host "❌ ERREUR: $_" -ForegroundColor Red
        $errorCount++
        
        # Arrêter sur erreur
        Write-Warning "Migration interrompue. Corrigez l'erreur avant de continuer."
        exit 1
    }
}

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host "  MIGRATIONS TERMINÉES" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host "========================================" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host ""
Write-Host "  Exécutées: $executedCount"
Write-Host "  Erreurs: $errorCount"
Write-Host ""

if ($errorCount -eq 0 -and -not $DryRun) {
    Write-Success "Toutes les migrations ont été appliquées avec succès!"
    Write-Host ""
    Write-Host "Prochaines étapes:"
    Write-Host "  1. Vérifier les données dans phpMyAdmin"
    Write-Host "  2. Tester le login sur l'environnement $Target"
    Write-Host "  3. Si OK, passer à la migration suivante"
}



