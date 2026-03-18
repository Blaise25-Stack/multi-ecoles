# ✅ Checklist Pré-Production Multi-Tenant SGS

## 🔴 CRITIQUE - Bloquer si non vérifié

### Base de données
- [ ] **Backup production créé** (date: ______)
- [ ] **Backup testé** (restore sur staging OK)
- [ ] **École default existe** (id=1, code='DEFAULT')
- [ ] **school_id sur utilisateurs** vérifié
- [ ] **Tous les users existants ont school_id = 1**

### Migrations
- [ ] Migration 001 (schools) ✅
- [ ] Migration 002 (users.school_id) ✅
- [ ] Migration 003 (tables core) ✅
- [ ] Migration 004 (tables academic) ✅
- [ ] Migration 005 (tables financial) ✅
- [ ] Migration 006 (tables HR) ✅
- [ ] Migration 007 (tables schedule) ✅
- [ ] Migration 008 (tables comm) ✅
- [ ] Migration 009 (school_modules) ✅
- [ ] Migration 010 (audit_logs) ✅

### Code
- [ ] **Build frontend** sans erreur
- [ ] **Build backend** sans erreur
- [ ] **Tests E2E passés** (multitenant.test.ts)

---

## 🟡 IMPORTANT - Vérifier avant mise en production

### Sécurité
- [ ] IDOR protection validée
- [ ] school_id injection testée
- [ ] JWT inclut school_id
- [ ] Tenant middleware actif
- [ ] Module guard fonctionnel

### Fonctionnalités
- [ ] Login → redirection correcte par rôle
- [ ] SuperAdmin → console accessible
- [ ] Admin école → limité à son école
- [ ] Feature flags → modules toggle OK
- [ ] Données isolées entre écoles

### Performance
- [ ] Index sur school_id présents
- [ ] Pas de N+1 queries
- [ ] Cache modules fonctionnel

---

## 🟢 OPTIONNEL - Améliore la qualité

### Documentation
- [ ] Guide déploiement à jour
- [ ] API documentation
- [ ] README mis à jour

### Monitoring
- [ ] Logs structurés
- [ ] Métriques de base
- [ ] Alerting configuré

### UX
- [ ] Messages d'erreur clairs
- [ ] Loading states
- [ ] Gestion offline

---

## 📋 Validation finale

### Staging
```powershell
.\validate_migrations.ps1 -Target staging
```
Résultat: [ ] ✅ Passed  [ ] ❌ Failed

### Tests
```powershell
npx ts-node src/tests/multitenant.test.ts
```
Résultat: [ ] ✅ Passed  [ ] ❌ Failed

### Manuel
| Test | Status |
|------|--------|
| Login admin@école1 → voit données école1 | ☐ |
| Login admin@école1 → NE VOIT PAS données école2 | ☐ |
| Login super_admin → voit TOUT | ☐ |
| Création élève → school_id auto | ☐ |
| Module OFF → 403 forbidden | ☐ |

---

## 🚀 GO / NO-GO

| Critère | Status |
|---------|--------|
| Backup production | ☐ OK |
| Migrations staging OK | ☐ OK |
| Tests E2E passés | ☐ OK |
| Équipe disponible | ☐ OK |
| Fenêtre maintenance | ☐ OK |
| Rollback plan prêt | ☐ OK |

### Décision

- [ ] **GO** - Déploiement approuvé
- [ ] **NO-GO** - Bloquer et corriger

**Approuvé par:** ____________________
**Date:** ____________________

---

## 📞 En cas de problème

1. **Activer mode maintenance**
2. **Notifier l'équipe**
3. **Restaurer backup si nécessaire**
4. **Documenter l'incident**

Contact urgence: ______________________



