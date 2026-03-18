# 📡 API Contracts Multi-Tenant

## Vue d'ensemble

Tous les endpoints API sont maintenant **tenant-aware**. Le `school_id` est automatiquement extrait du JWT de l'utilisateur et appliqué à toutes les requêtes.

---

## Authentication

### POST /api/auth/login

**Request:**
```json
{
  "email": "admin@school.edu",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@school.edu",
      "nom": "Kabila",
      "prenom": "Joseph",
      "telephone": "+243810000000",
      "avatar": null,
      "role": "admin",
      "roleLibelle": "Administrateur",
      "schoolId": 1,
      "isSuperAdmin": false,
      "permissions": [
        { "module": "eleves", "actions": ["create", "read", "update", "delete"] },
        { "module": "paiements", "actions": ["create", "read", "update"] }
      ],
      "isActive": true,
      "lastLogin": "2024-12-05T10:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "school": {
      "id": 1,
      "code": "ECO001",
      "name": "École Excellence",
      "shortName": "EXC",
      "logo": "/uploads/schools/eco001_logo.png",
      "currency": "FC"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response SuperAdmin (school: null):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "role": "super_admin",
      "schoolId": null,
      "isSuperAdmin": true,
      "permissions": [/* all permissions */]
    },
    "school": null,
    "token": "...",
    "refreshToken": "..."
  }
}
```

**Response (403 - École désactivée):**
```json
{
  "success": false,
  "message": "Cette école est désactivée. Contactez l'administrateur plateforme."
}
```

---

## Schools Management (SuperAdmin Only)

### GET /api/superadmin/schools

Liste toutes les écoles de la plateforme.

**Headers:**
```
Authorization: Bearer <superadmin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "ECO001",
      "name": "École Excellence",
      "short_name": "EXC",
      "address": "123 Avenue Education",
      "city": "Kinshasa",
      "province": "Kinshasa",
      "telephone": "+243810000000",
      "email": "contact@excellence.edu",
      "currency": "FC",
      "is_active": true,
      "subscription_plan": "premium",
      "subscription_expires_at": "2025-12-31",
      "max_students": 1000,
      "max_users": 100,
      "created_at": "2024-01-01T00:00:00Z",
      "users_count": 15,
      "students_count": 450,
      "teachers_count": 25
    }
  ]
}
```

### POST /api/superadmin/schools

Créer une nouvelle école.

**Request:**
```json
{
  "code": "ECO002",
  "name": "Institut Savoir Plus",
  "shortName": "ISP",
  "address": "456 Boulevard Science",
  "city": "Lubumbashi",
  "province": "Haut-Katanga",
  "telephone": "+243820000000",
  "email": "contact@savoirplus.edu",
  "currency": "USD",
  "subscription_plan": "basic",
  "max_students": 500
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "École créée avec succès",
  "data": {
    "id": 2
  }
}
```

### GET /api/superadmin/schools/:id

Détails d'une école.

### PUT /api/superadmin/schools/:id

Modifier une école.

### DELETE /api/superadmin/schools/:id

Supprimer une école (seulement si vide).

---

## School Modules

### GET /api/schools/:schoolId/modules

Liste les modules d'une école.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "module_key": "students",
      "module_name": "Gestion des élèves",
      "description": "Inscriptions, fiches élèves, historique",
      "category": "academic",
      "enabled": true,
      "requires_subscription": "free",
      "icon": "users"
    },
    {
      "id": 2,
      "module_key": "payroll",
      "module_name": "Salaires",
      "description": "Paie des employés",
      "category": "hr",
      "enabled": false,
      "requires_subscription": "premium",
      "icon": "banknote"
    }
  ]
}
```

### PUT /api/schools/:schoolId/modules/:moduleKey

Activer/désactiver un module.

**Request:**
```json
{
  "enabled": true,
  "config": {
    "custom_setting": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Module payroll activé"
}
```

**Response (403 - Module désactivé):**
Retourné quand on accède à une fonctionnalité d'un module désactivé:
```json
{
  "success": false,
  "message": "Le module \"payroll\" n'est pas activé pour cette école",
  "error": "MODULE_DISABLED",
  "module": "payroll"
}
```

---

## Tenant-Scoped Endpoints

Tous les endpoints ci-dessous sont automatiquement filtrés par `school_id`.

### Élèves

#### GET /api/eleves

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page (default: 1) |
| limit | number | Items par page (default: 20) |
| search | string | Recherche nom/prénom/matricule |
| classeId | number | Filtrer par classe |
| statut | string | inscrit, reinscrit, etc. |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "matricule": "ELV2024001",
      "nom": "Kabongo",
      "prenom": "Marie",
      "sexe": "F",
      "date_naissance": "2010-05-15",
      "classe_nom": "6ème A",
      "classe_id": 1,
      "school_id": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### GET /api/eleves/:id

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "matricule": "ELV2024001",
    "nom": "Kabongo",
    "prenom": "Marie",
    "sexe": "F",
    "date_naissance": "2010-05-15",
    "lieu_naissance": "Kinshasa",
    "nationalite": "Congolaise",
    "adresse": "123 Avenue Victoire",
    "telephone": "+243890000000",
    "photo": "/uploads/eleves/1.jpg",
    "nom_pere": "Kabongo Jean",
    "telephone_pere": "+243810000000",
    "is_active": true,
    "school_id": 1,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Response (404 - Élève d'une autre école):**
```json
{
  "success": false,
  "message": "Élève non trouvé"
}
```

#### POST /api/eleves

**Request:**
```json
{
  "matricule": "ELV2024152",
  "nom": "Mutombo",
  "prenom": "Paul",
  "sexe": "M",
  "date_naissance": "2011-03-20",
  "lieu_naissance": "Lubumbashi",
  "nom_pere": "Mutombo Joseph",
  "telephone_pere": "+243820000000"
}
```

Note: `school_id` est automatiquement ajouté depuis le context tenant.

**Response (201):**
```json
{
  "success": true,
  "message": "Élève créé",
  "data": { "id": 152 }
}
```

#### PUT /api/eleves/:id

Note: `school_id` ne peut pas être modifié.

#### DELETE /api/eleves/:id

---

### Classes

#### GET /api/classes

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "6A",
      "libelle": "6ème A",
      "niveau_id": 1,
      "niveau_nom": "6ème",
      "filiere_id": 1,
      "filiere_nom": "Général",
      "capacite": 40,
      "effectif": 35,
      "titulaire_nom": "Prof. Kalonji",
      "school_id": 1
    }
  ]
}
```

---

### Paiements

#### GET /api/paiements

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| eleveId | number | Filtrer par élève |
| type_frais_id | number | Type de frais |
| statut | string | en_attente, valide, annule |
| date_debut | date | Période début |
| date_fin | date | Période fin |

#### POST /api/paiements

**Request:**
```json
{
  "eleve_id": 1,
  "type_frais_id": 1,
  "montant": 150000,
  "mode_paiement": "mobile_money",
  "reference_paiement": "MP20241205001",
  "observations": "Paiement partiel T1"
}
```

---

### Notes

#### POST /api/notes

**Request:**
```json
{
  "eleve_id": 1,
  "matiere_id": 1,
  "classe_id": 1,
  "periode_id": 1,
  "type_evaluation_id": 1,
  "note": 15.5,
  "note_max": 20,
  "date_evaluation": "2024-12-01",
  "commentaire": "Bon travail"
}
```

---

### Dashboard

#### GET /api/dashboard/stats

Retourne les statistiques de l'école courante.

**Response:**
```json
{
  "success": true,
  "data": {
    "school": {
      "id": 1,
      "name": "École Excellence"
    },
    "students": {
      "total": 450,
      "active": 445,
      "new_this_year": 120
    },
    "teachers": {
      "total": 25,
      "active": 24
    },
    "classes": {
      "total": 15
    },
    "finances": {
      "total_expected": 67500000,
      "total_collected": 45000000,
      "collection_rate": 66.67,
      "outstanding": 22500000
    },
    "recent_payments": [
      {
        "id": 100,
        "eleve_nom": "Kabongo Marie",
        "montant": 150000,
        "date": "2024-12-05"
      }
    ]
  }
}
```

---

## Headers Communs

### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Response Headers

```
Content-Type: application/json
X-School-Id: 1
X-Request-Id: uuid
```

---

## Codes d'Erreur

| Code | Signification |
|------|---------------|
| 400 | Bad Request - Données invalides |
| 401 | Unauthorized - Token manquant/invalide |
| 403 | Forbidden - Accès refusé (rôle, école, module) |
| 404 | Not Found - Ressource non trouvée (ou autre école) |
| 409 | Conflict - Doublon (ex: matricule existe) |
| 500 | Internal Server Error |

### Format Erreur Standard

```json
{
  "success": false,
  "message": "Description lisible de l'erreur",
  "error": "ERROR_CODE",
  "details": {
    "field": ["Message d'erreur de validation"]
  }
}
```

### Codes d'Erreur Spécifiques Multi-Tenant

| Code | Signification |
|------|---------------|
| `SCHOOL_DISABLED` | École désactivée |
| `MODULE_DISABLED` | Module non activé pour cette école |
| `NO_SCHOOL_CONTEXT` | Utilisateur sans école assignée |
| `CROSS_TENANT_ACCESS` | Tentative d'accès à une autre école |

---

## JWT Token Structure

```json
{
  "userId": 1,
  "email": "admin@school.edu",
  "schoolId": 1,
  "role": "admin",
  "iat": 1701777600,
  "exp": 1701864000
}
```

Note: Pour SuperAdmin, `schoolId` est `null`.

---

## Pagination Standard

Tous les endpoints de liste supportent la pagination:

**Request:**
```
GET /api/eleves?page=2&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 450,
    "totalPages": 9
  }
}
```

---

## Rate Limiting

| Limite | Valeur |
|--------|--------|
| Par IP | 100 req/min |
| Par User | 200 req/min |
| Par École | 1000 req/min |

**Response (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Trop de requêtes. Réessayez dans 60 secondes.",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```



