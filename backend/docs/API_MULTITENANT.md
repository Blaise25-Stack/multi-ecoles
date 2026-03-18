# 📡 API Multi-Tenant SGS - Documentation

## Vue d'ensemble

Toutes les API du système sont désormais **tenant-aware**. Le contexte école est automatiquement résolu depuis le JWT de l'utilisateur.

---

## 🔐 Authentification

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ecole.com",
  "password": "motdepasse"
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@ecole.com",
      "nom": "Doe",
      "prenom": "John",
      "role": "admin",
      "schoolId": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "...",
    "school": {
      "id": 1,
      "code": "ECO001",
      "name": "Mon École",
      "currency": "FC"
    }
  }
}
```

### Headers requis
```http
Authorization: Bearer <token>
```

---

## 🏫 Écoles (SuperAdmin only)

### Liste des écoles
```http
GET /api/schools
Authorization: Bearer <super_admin_token>
```

### Créer une école
```http
POST /api/schools
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "code": "ECO002",
  "name": "Nouvelle École",
  "currency": "FC",
  "whatsappNumber": "+243..."
}
```

### Modifier une école
```http
PUT /api/schools/:id
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "name": "Nom modifié",
  "isActive": false
}
```

### Supprimer une école
```http
DELETE /api/schools/:id
Authorization: Bearer <super_admin_token>
```

---

## 🧩 Modules (Feature Flags)

### Modules disponibles
```http
GET /api/modules/available
Authorization: Bearer <token>
```

### Modules d'une école
```http
GET /api/modules/school/:schoolId
Authorization: Bearer <token>
```

### Mes modules activés
```http
GET /api/modules/my
Authorization: Bearer <token>
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "schoolId": 1,
    "enabledModules": ["dashboard", "students", "payments", "grades"],
    "modules": [
      { "key": "dashboard", "name": "Tableau de bord", "icon": "LayoutDashboard" },
      { "key": "students", "name": "Gestion des élèves", "icon": "Users" }
    ]
  }
}
```

### Toggle module
```http
PUT /api/modules/school/:schoolId/:moduleKey
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true
}
```

### Toggle multiple modules
```http
PUT /api/modules/school/:schoolId/bulk
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "modules": {
    "payments": true,
    "payroll": false,
    "sms": true
  }
}
```

---

## 👥 Utilisateurs par école

### Liste des users d'une école
```http
GET /api/users/school/:schoolId
Authorization: Bearer <token>
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "email": "comptable@ecole.com",
      "nom": "Martin",
      "prenom": "Sophie",
      "roleId": 3,
      "roleCode": "comptable",
      "roleLibelle": "Comptable",
      "isActive": true
    }
  ]
}
```

### Créer un utilisateur
```http
POST /api/users/school/:schoolId
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "nouveau@ecole.com",
  "password": "motdepasse123",
  "nom": "Dupont",
  "prenom": "Marie",
  "telephone": "+243...",
  "roleId": 3
}
```

### Modifier un utilisateur
```http
PUT /api/users/school/:schoolId/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Nouveau Nom",
  "isActive": false
}
```

### Réinitialiser mot de passe
```http
POST /api/users/school/:schoolId/:userId/reset-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "nouveaumotdepasse"
}
```

### Supprimer un utilisateur
```http
DELETE /api/users/school/:schoolId/:userId
Authorization: Bearer <token>
```

---

## 📊 Endpoints tenant-aware (existants)

Tous les endpoints existants sont désormais filtrés par `school_id`:

| Endpoint | Filtrage |
|----------|----------|
| `GET /api/eleves` | `WHERE school_id = ?` |
| `GET /api/inscriptions` | `WHERE school_id = ?` |
| `GET /api/paiements` | `WHERE school_id = ?` |
| `GET /api/enseignants` | `WHERE school_id = ?` |
| `GET /api/notes` | `WHERE school_id = ?` |
| ... | ... |

### Comportement selon le rôle

| Rôle | Comportement |
|------|--------------|
| `super_admin` (sans contexte) | Voit TOUTES les données |
| `super_admin` (avec contexte) | Voit données de l'école sélectionnée |
| `admin` | Voit uniquement son école |
| Autres rôles | Voit uniquement son école |

---

## 🛡️ Codes d'erreur

| Code | Message | Description |
|------|---------|-------------|
| 401 | `Non authentifié` | Token manquant ou invalide |
| 403 | `Accès non autorisé` | Pas les droits pour cette ressource |
| 403 | `Module disabled` | Module désactivé pour cette école |
| 403 | `SCHOOL_DISABLED` | École désactivée |
| 403 | `NO_SCHOOL_ASSIGNED` | User sans école assignée |
| 404 | `École non trouvée` | school_id invalide |

### Exemple erreur module désactivé
```json
{
  "success": false,
  "message": "Le module \"payroll\" n'est pas activé pour votre école",
  "error": "MODULE_DISABLED",
  "moduleKey": "payroll",
  "schoolId": 1
}
```

---

## 🔧 Headers de réponse

| Header | Description |
|--------|-------------|
| `X-School-Id` | ID de l'école du contexte actuel |
| `X-Request-Id` | ID unique de la requête (pour debug) |

---

## 📝 Exemple d'intégration Frontend

```typescript
// Service API
import api from './api'

// Les requêtes sont automatiquement filtrées par école
// grâce au token JWT qui contient school_id

// Liste des élèves (filtrée par école automatiquement)
const eleves = await api.get('/eleves')

// Vérifier si un module est activé avant d'afficher une fonctionnalité
const { enabledModules } = await api.get('/modules/my')
if (enabledModules.includes('payments')) {
  // Afficher le module paiements
}
```

---

## 🧪 Test avec cURL

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sgs-rdc.edu","password":"admin123"}' \
  | jq -r '.data.token')

# Liste des écoles (SuperAdmin)
curl -X GET http://localhost:5000/api/schools \
  -H "Authorization: Bearer $TOKEN"

# Mes modules
curl -X GET http://localhost:5000/api/modules/my \
  -H "Authorization: Bearer $TOKEN"

# Liste élèves (filtré par école)
curl -X GET http://localhost:5000/api/eleves \
  -H "Authorization: Bearer $TOKEN"
```



