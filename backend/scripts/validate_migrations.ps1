# ============================================
# Script de Validation des Migrations Multi-Tenant
# SGS - Phase 6
# ============================================
# Vérifie que toutes les tables ont bien school_id
# Usage: .\validate_migrations.ps1 [-Target staging|production]

param(
    [ValidateSet("staging", "production", "development")]
    [string]$Target = "staging",
    [string]$DbHost = "localhost",
    [string]$DbPort = "3306",
    [string]$DbUser = "root",
    [string]$DbPassword = ""
)

$ErrorActionPreference = "Stop"

function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "📋 $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  VALIDATION MIGRATIONS MULTI-TENANT SGS" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Déterminer la BDD
$DbName = switch ($Target) {
    "staging" { "bdd_scolaire_staging" }
    "production" { "bdd_scolaire" }
    "development" { "bdd_scolaire" }
}

Write-Info "Cible: $Target ($DbName)"

# Trouver MySQL
$MysqlPaths = @(
    "C:\wamp64\bin\mysql\mysql8.0.31\bin",
    "C:\wamp64\bin\mysql\mysql8.0.30\bin",
    "C:\wamp64\bin\mysql\mysql8.0.27\bin",
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
    Write-Error "MySQL non trouvé!"
    exit 1
}

$Mysql = Join-Path $MysqlBin "mysql.exe"
Write-Success "MySQL trouvé: $MysqlBin"

# Arguments de connexion
$ConnArgs = "-h$DbHost -P$DbPort -u$DbUser"
if ($DbPassword) { $ConnArgs = "-p$DbPassword $ConnArgs" }

# ============================================
# VÉRIFICATIONS
# ============================================

$ValidationResults = @()
$Errors = 0
$Warnings = 0

Write-Host ""
Write-Info "=== Vérification table schools ==="

# 1. Vérifier que la table schools existe
$SchoolsExists = & $Mysql $ConnArgs.Split(" ") $DbName -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DbName' AND table_name = 'schools'" 2>$null
if ($SchoolsExists -gt 0) {
    Write-Success "Table 'schools' existe"
    
    # Vérifier qu'il y a au moins l'école default
    $DefaultSchool = & $Mysql $ConnArgs.Split(" ") $DbName -N -e "SELECT COUNT(*) FROM schools WHERE id = 1" 2>$null
    if ($DefaultSchool -gt 0) {
        Write-Success "École default (id=1) existe"
    } else {
        Write-Error "École default manquante!"
        $Errors++
    }
} else {
    Write-Error "Table 'schools' n'existe pas!"
    $Errors++
}

Write-Host ""
Write-Info "=== Vérification school_id sur les tables ==="

# Tables qui doivent avoir school_id
$TablesWithSchoolId = @(
    "utilisateurs",
    "eleves",
    "enseignants",
    "personnel",
    "classes",
    "annees_scolaires",
    "matieres",
    "inscriptions",
    "periodes",
    "notes",
    "bulletins",
    "deliberations",
    "attestations",
    "frais_scolaires",
    "paiements",
    "depenses",
    "factures",
    "mouvements_caisse",
    "salaires",
    "conges",
    "contrats",
    "presences",
    "salles",
    "creneaux_horaires",
    "emploi_temps",
    "notifications"
)

foreach ($table in $TablesWithSchoolId) {
    $HasColumn = & $Mysql $ConnArgs.Split(" ") $DbName -N -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '$DbName' AND table_name = '$table' AND column_name = 'school_id'" 2>$null
    
    if ($HasColumn -gt 0) {
        # Vérifier qu'il n'y a pas de NULL
        $NullCount = & $Mysql $ConnArgs.Split(" ") $DbName -N -e "SELECT COUNT(*) FROM $table WHERE school_id IS NULL" 2>$null
        if ($NullCount -eq 0 -or $NullCount -eq $null) {
            Write-Success "$table : school_id OK"
        } else {
            Write-Warn "$table : $NullCount enregistrements avec school_id NULL"
            $Warnings++
        }
    } else {
        # Vérifier si la table existe
        $TableExists = & $Mysql $ConnArgs.Split(" ") $DbName -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DbName' AND table_name = '$table'" 2>$null
        if ($TableExists -gt 0) {
            Write-Error "$table : school_id MANQUANT!"
            $Errors++
        } else {
            Write-Info "$table : table n'existe pas (peut être normal)"
        }
    }
}

Write-Host ""
Write-Info "=== Vérification table school_modules ==="

$ModulesExists = & $Mysql $ConnArgs.Split(" ") $DbName -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DbName' AND table_name = 'school_modules'" 2>$null
if ($ModulesExists -gt 0) {
    Write-Success "Table 'school_modules' existe"
    
    $ModulesCount = & $Mysql $ConnArgs.Split(" ") $DbName -N -e "SELECT COUNT(*) FROM school_modules" 2>$null
    Write-Info "  $ModulesCount configurations de modules"
} else {
    Write-Error "Table 'school_modules' n'existe pas!"
    $Errors++
}

Write-Host ""
Write-Info "=== Vérification indexes ==="

$Indexes = & $Mysql $ConnArgs.Split(" ") $DbName -N -e "SELECT DISTINCT TABLE_NAME FROM information_schema.statistics WHERE table_schema = '$DbName' AND INDEX_NAME LIKE '%school%'" 2>$null
$IndexCount = ($Indexes -split "`n" | Where-Object { $_ }).Count
Write-Info "$IndexCount tables avec index sur school_id"

Write-Host ""
Write-Info "=== Vérification Foreign Keys ==="

$FKCount = & $Mysql $ConnArgs.Split(" ") $DbName -N -e "SELECT COUNT(*) FROM information_schema.key_column_usage WHERE table_schema = '$DbName' AND referenced_table_name = 'schools'" 2>$null
Write-Info "$FKCount Foreign Keys vers table schools"

# ============================================
# RAPPORT FINAL
# ============================================

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor $(if ($Errors -eq 0) { "Green" } else { "Red" })
Write-Host "  RAPPORT DE VALIDATION" -ForegroundColor $(if ($Errors -eq 0) { "Green" } else { "Red" })
Write-Host "════════════════════════════════════════════════════" -ForegroundColor $(if ($Errors -eq 0) { "Green" } else { "Red" })
Write-Host ""
Write-Host "  Erreurs:        $Errors" -ForegroundColor $(if ($Errors -eq 0) { "Green" } else { "Red" })
Write-Host "  Avertissements: $Warnings" -ForegroundColor $(if ($Warnings -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($Errors -eq 0) {
    Write-Success "✨ Toutes les migrations sont correctement appliquées!"
    Write-Host ""
    Write-Info "Le système est prêt pour le multi-tenant."
    exit 0
} else {
    Write-Error "Des erreurs ont été détectées!"
    Write-Host ""
    Write-Info "Actions recommandées:"
    Write-Host "  1. Exécuter les migrations manquantes"
    Write-Host "  2. Vérifier les FK et indexes"
    Write-Host "  3. Relancer ce script"
    exit 1
}



