# ============================================
# Script Setup Staging - Phase 0 Multi-Tenant
# ============================================
# Usage: .\setup_staging.ps1

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "3306",
    [string]$DbUser = "root",
    [string]$DbPassword = "",
    [string]$ProductionDb = "bdd_scolaire",
    [string]$StagingDb = "bdd_scolaire_staging",
    [int]$StagingBackendPort = 5001,
    [int]$StagingFrontendPort = 5174
)

$ErrorActionPreference = "Stop"

function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "📋 $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️ $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  SETUP STAGING - SGS Multi-Tenant" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

$ProjectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$BackendPath = Join-Path $ProjectRoot "backend"

Write-Info "Project Root: $ProjectRoot"
Write-Info "Backend Path: $BackendPath"
Write-Host ""

# Trouver mysql et mysqldump
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
    Write-Host "❌ MySQL non trouvé dans les chemins WAMP/XAMPP standard" -ForegroundColor Red
    Write-Host "Ajoutez manuellement MySQL à votre PATH" -ForegroundColor Yellow
    exit 1
}

$Mysql = Join-Path $MysqlBin "mysql.exe"
$MysqlDump = Join-Path $MysqlBin "mysqldump.exe"
Write-Success "MySQL trouvé: $MysqlBin"

# Arguments de connexion
$BaseArgs = @("-h$DbHost", "-P$DbPort", "-u$DbUser")
if ($DbPassword) {
    $BaseArgs = @("-p$DbPassword") + $BaseArgs
}

# Étape 1: Créer la base staging
Write-Info "Étape 1/4: Création de la base de données staging..."
$CreateQuery = "CREATE DATABASE IF NOT EXISTS ``$StagingDb`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo $CreateQuery | & $Mysql $BaseArgs
Write-Success "Base $StagingDb créée"

# Étape 2: Cloner les données de prod vers staging
Write-Info "Étape 2/4: Copie des données de production vers staging..."
Write-Info "  Dump de $ProductionDb en cours..."

$TempDump = Join-Path $env:TEMP "staging_clone_temp.sql"

$DumpArgs = $BaseArgs + @(
    "--single-transaction",
    "--routines",
    "--triggers",
    $ProductionDb
)

& $MysqlDump $DumpArgs | Out-File -FilePath $TempDump -Encoding UTF8

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du dump" -ForegroundColor Red
    exit 1
}

Write-Info "  Import vers $StagingDb en cours..."
Get-Content $TempDump | & $Mysql $BaseArgs $StagingDb

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'import" -ForegroundColor Red
    Remove-Item $TempDump -Force -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item $TempDump -Force -ErrorAction SilentlyContinue
Write-Success "Données copiées vers staging"

# Étape 3: Créer fichier .env.staging
Write-Info "Étape 3/4: Création des fichiers de configuration staging..."

$EnvStagingContent = @"
# ============================================
# Configuration Staging - Multi-Tenant Dev
# ============================================
# NE PAS UTILISER EN PRODUCTION !

NODE_ENV=staging
PORT=$StagingBackendPort

# Base de données MySQL (WAMP - Staging)
DB_HOST=$DbHost
DB_PORT=$DbPort
DB_USER=$DbUser
DB_PASSWORD=$DbPassword
DB_NAME=$StagingDb

# JWT - Clés différentes de prod pour sécurité
JWT_SECRET=staging_jwt_secret_multitenancy_2024_test
JWT_REFRESH_SECRET=staging_refresh_secret_multitenancy_2024_test
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:$StagingFrontendPort

# Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
"@

$EnvStagingPath = Join-Path $BackendPath ".env.staging"
$EnvStagingContent | Out-File -FilePath $EnvStagingPath -Encoding UTF8 -NoNewline
Write-Success "Fichier créé: $EnvStagingPath"

# Créer .env.staging pour frontend
$FrontendEnvContent = @"
# Frontend Staging Config
VITE_API_URL=http://localhost:$StagingBackendPort/api
VITE_ENV=staging
"@

$FrontendEnvPath = Join-Path $ProjectRoot ".env.staging"
$FrontendEnvContent | Out-File -FilePath $FrontendEnvPath -Encoding UTF8 -NoNewline
Write-Success "Fichier créé: $FrontendEnvPath"

# Étape 4: Créer scripts de démarrage staging
Write-Info "Étape 4/4: Création des scripts de démarrage..."

$StartStagingScript = @"
# Démarrer l'environnement staging
Write-Host "🚀 Démarrage environnement STAGING" -ForegroundColor Cyan

# Copier .env.staging vers .env temporairement
`$BackendPath = "`$PSScriptRoot\.."
`$EnvPath = Join-Path `$BackendPath ".env"
`$EnvStagingPath = Join-Path `$BackendPath ".env.staging"
`$EnvBackupPath = Join-Path `$BackendPath ".env.backup"

# Backup de .env actuel
if (Test-Path `$EnvPath) {
    Copy-Item `$EnvPath `$EnvBackupPath -Force
    Write-Host "📦 Backup .env créé"
}

# Utiliser config staging
Copy-Item `$EnvStagingPath `$EnvPath -Force
Write-Host "✅ Configuration staging activée"

Write-Host ""
Write-Host "Pour démarrer le backend staging:"
Write-Host "  cd backend && npm run dev"
Write-Host ""
Write-Host "Pour démarrer le frontend staging:"
Write-Host "  `$env:VITE_API_URL='http://localhost:$StagingBackendPort/api'; npm run dev -- --port $StagingFrontendPort"
Write-Host ""
Write-Host "URLs Staging:"
Write-Host "  Backend:  http://localhost:$StagingBackendPort"
Write-Host "  Frontend: http://localhost:$StagingFrontendPort"
Write-Host ""
"@

$StartStagingPath = Join-Path $PSScriptRoot "start_staging.ps1"
$StartStagingScript | Out-File -FilePath $StartStagingPath -Encoding UTF8
Write-Success "Script créé: $StartStagingPath"

# Vérification
Write-Info "Vérification de la base staging..."
$CountQuery = "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = '$StagingDb';"
$TableCount = echo $CountQuery | & $Mysql $BaseArgs -N
Write-Info "Tables dans staging: $TableCount"

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  STAGING CONFIGURÉ AVEC SUCCÈS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:"
Write-Host "  📦 Base staging: $StagingDb"
Write-Host "  🔧 Backend port: $StagingBackendPort"
Write-Host "  🌐 Frontend port: $StagingFrontendPort"
Write-Host ""
Write-Host "Fichiers créés:"
Write-Host "  - backend\.env.staging"
Write-Host "  - .env.staging (frontend)"
Write-Host "  - backend\scripts\start_staging.ps1"
Write-Host ""
Write-Host "Pour démarrer staging:"
Write-Host "  .\backend\scripts\start_staging.ps1"
Write-Host ""
Write-Host "Puis dans deux terminaux:"
Write-Host "  Terminal 1: cd backend && npm run dev"
Write-Host "  Terminal 2: npm run dev -- --port $StagingFrontendPort"
Write-Host ""



