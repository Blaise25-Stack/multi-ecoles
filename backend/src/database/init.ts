import mysql from 'mysql2/promise'
import { config } from '../config'
import bcrypt from 'bcryptjs'

const initDatabase = async () => {
  console.log('🚀 Initialisation de la base de données...\n')

  // Connexion sans spécifier la base de données pour pouvoir la créer
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
  })

  try {
    // Créer la base de données si elle n'existe pas
    console.log('📦 Création de la base de données...')
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await connection.query(`USE \`${config.db.database}\``)
    console.log(`   ✅ Base de données "${config.db.database}" prête\n`)

    // =====================================================
    // TABLES SYSTÈME ET CONFIGURATION
    // =====================================================
    console.log('📋 Création des tables système...')

    // Table établissement
    await connection.query(`
      CREATE TABLE IF NOT EXISTS etablissement (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(255) NOT NULL,
        devise VARCHAR(255),
        adresse TEXT,
        telephone VARCHAR(50),
        email VARCHAR(255),
        site_web VARCHAR(255),
        logo VARCHAR(255),
        ministere VARCHAR(255) DEFAULT 'Ministère de l\\'Éducation Nationale - RDC',
        province VARCHAR(100) DEFAULT 'Kinshasa',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table années scolaires
    await connection.query(`
      CREATE TABLE IF NOT EXISTS annees_scolaires (
        id INT PRIMARY KEY AUTO_INCREMENT,
        libelle VARCHAR(50) NOT NULL UNIQUE,
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        est_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES UTILISATEURS ET RBAC
    // =====================================================
    console.log('👥 Création des tables utilisateurs et RBAC...')

    // Table rôles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) NOT NULL UNIQUE,
        libelle VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table permissions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        module VARCHAR(100) NOT NULL,
        action ENUM('create', 'read', 'update', 'delete') NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_permission (module, action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table rôle_permissions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table utilisateurs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(191) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        telephone VARCHAR(50),
        avatar VARCHAR(255),
        role_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table permissions utilisateur (permissions personnalisées)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS utilisateur_permissions (
        utilisateur_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (utilisateur_id, permission_id),
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES STRUCTURE SCOLAIRE
    // =====================================================
    console.log('🏫 Création des tables structure scolaire...')

    // Table cycles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cycles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        libelle VARCHAR(100) NOT NULL,
        ordre INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table niveaux
    await connection.query(`
      CREATE TABLE IF NOT EXISTS niveaux (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        libelle VARCHAR(100) NOT NULL,
        cycle_id INT NOT NULL,
        ordre INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cycle_id) REFERENCES cycles(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table filières/sections
    await connection.query(`
      CREATE TABLE IF NOT EXISTS filieres (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        libelle VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table classes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL,
        libelle VARCHAR(100) NOT NULL,
        niveau_id INT NOT NULL,
        filiere_id INT,
        capacite INT DEFAULT 50,
        annee_scolaire_id INT NOT NULL,
        titulaire_id INT,
        salle VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (niveau_id) REFERENCES niveaux(id),
        FOREIGN KEY (filiere_id) REFERENCES filieres(id),
        FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id),
        UNIQUE KEY unique_classe_annee (code, annee_scolaire_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table matières
    await connection.query(`
      CREATE TABLE IF NOT EXISTS matieres (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        libelle VARCHAR(100) NOT NULL,
        description TEXT,
        coefficient DECIMAL(3,1) DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table classe_matieres (affectation des matières aux classes)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS classe_matieres (
        id INT PRIMARY KEY AUTO_INCREMENT,
        classe_id INT NOT NULL,
        matiere_id INT NOT NULL,
        heures_semaine INT DEFAULT 2,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE,
        UNIQUE KEY unique_classe_matiere (classe_id, matiere_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES ÉLÈVES ET INSCRIPTIONS
    // =====================================================
    console.log('🎓 Création des tables élèves et inscriptions...')

    // Table élèves
    await connection.query(`
      CREATE TABLE IF NOT EXISTS eleves (
        id INT PRIMARY KEY AUTO_INCREMENT,
        matricule VARCHAR(50) NOT NULL UNIQUE,
        nom VARCHAR(100) NOT NULL,
        postnom VARCHAR(100),
        prenom VARCHAR(100) NOT NULL,
        sexe ENUM('M', 'F') NOT NULL,
        date_naissance DATE NOT NULL,
        lieu_naissance VARCHAR(100),
        nationalite VARCHAR(50) DEFAULT 'Congolaise',
        adresse TEXT,
        telephone VARCHAR(50),
        email VARCHAR(255),
        photo VARCHAR(255),
        groupe_sanguin VARCHAR(5),
        allergies TEXT,
        
        -- Informations parents/tuteur
        nom_pere VARCHAR(200),
        telephone_pere VARCHAR(50),
        profession_pere VARCHAR(100),
        nom_mere VARCHAR(200),
        telephone_mere VARCHAR(50),
        profession_mere VARCHAR(100),
        nom_tuteur VARCHAR(200),
        telephone_tuteur VARCHAR(50),
        adresse_tuteur TEXT,
        
        -- Métadonnées
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table inscriptions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inscriptions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero VARCHAR(50) NOT NULL UNIQUE,
        eleve_id INT,
        classe_id INT NOT NULL,
        annee_scolaire_id INT NOT NULL,
        type_inscription ENUM('nouvelle', 'reinscription', 'transfert') NOT NULL,
        date_inscription DATE NOT NULL,
        montant_inscription DECIMAL(15,2) NOT NULL,
        statut ENUM('en_attente', 'validee', 'annulee') DEFAULT 'en_attente',
        observations TEXT,
        
        -- Documents fournis
        extrait_naissance BOOLEAN DEFAULT FALSE,
        photos_identite BOOLEAN DEFAULT FALSE,
        bulletin_anterieur BOOLEAN DEFAULT FALSE,
        attestation_reussite BOOLEAN DEFAULT FALSE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE SET NULL,
        FOREIGN KEY (classe_id) REFERENCES classes(id),
        FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES ENSEIGNANTS ET PERSONNEL
    // =====================================================
    console.log('👨‍🏫 Création des tables enseignants et personnel...')

    // Table enseignants
    await connection.query(`
      CREATE TABLE IF NOT EXISTS enseignants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        matricule VARCHAR(50) NOT NULL UNIQUE,
        utilisateur_id INT,
        nom VARCHAR(100) NOT NULL,
        postnom VARCHAR(100),
        prenom VARCHAR(100) NOT NULL,
        sexe ENUM('M', 'F') NOT NULL,
        date_naissance DATE,
        lieu_naissance VARCHAR(100),
        nationalite VARCHAR(50) DEFAULT 'Congolaise',
        adresse TEXT,
        telephone VARCHAR(50),
        email VARCHAR(255),
        photo VARCHAR(255),
        
        -- Informations professionnelles
        specialite VARCHAR(100),
        diplome VARCHAR(100),
        date_embauche DATE,
        type_contrat ENUM('CDI', 'CDD', 'Vacation') DEFAULT 'CDI',
        salaire_base DECIMAL(15,2),
        
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Ajouter la FK titulaire_id dans classes
    await connection.query(`
      ALTER TABLE classes 
      ADD FOREIGN KEY (titulaire_id) REFERENCES enseignants(id) ON DELETE SET NULL
    `).catch(() => {}) // Ignorer si existe déjà

    // Table affectation enseignants (qui enseigne quelle matière dans quelle classe)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS enseignant_affectations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        enseignant_id INT NOT NULL,
        classe_id INT NOT NULL,
        matiere_id INT NOT NULL,
        annee_scolaire_id INT NOT NULL,
        heures_semaine INT DEFAULT 2,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE,
        FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE,
        FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id),
        UNIQUE KEY unique_affectation (enseignant_id, classe_id, matiere_id, annee_scolaire_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table personnel (non-enseignants)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS personnel (
        id INT PRIMARY KEY AUTO_INCREMENT,
        matricule VARCHAR(50) NOT NULL UNIQUE,
        utilisateur_id INT,
        nom VARCHAR(100) NOT NULL,
        postnom VARCHAR(100),
        prenom VARCHAR(100) NOT NULL,
        sexe ENUM('M', 'F') NOT NULL,
        date_naissance DATE,
        adresse TEXT,
        telephone VARCHAR(50),
        email VARCHAR(255),
        photo VARCHAR(255),
        
        fonction VARCHAR(100) NOT NULL,
        departement VARCHAR(100),
        date_embauche DATE,
        type_contrat ENUM('CDI', 'CDD', 'Stage') DEFAULT 'CDI',
        salaire_base DECIMAL(15,2),
        
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES NOTES ET BULLETINS
    // =====================================================
    console.log('📝 Création des tables notes et bulletins...')

    // Table périodes (trimestres/semestres)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS periodes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL,
        libelle VARCHAR(100) NOT NULL,
        annee_scolaire_id INT NOT NULL,
        date_debut DATE,
        date_fin DATE,
        ordre INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id),
        UNIQUE KEY unique_periode (code, annee_scolaire_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table types d'évaluations
    await connection.query(`
      CREATE TABLE IF NOT EXISTS types_evaluations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        libelle VARCHAR(100) NOT NULL,
        coefficient DECIMAL(3,1) DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table notes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        eleve_id INT NOT NULL,
        matiere_id INT NOT NULL,
        classe_id INT NOT NULL,
        periode_id INT NOT NULL,
        type_evaluation_id INT NOT NULL,
        note DECIMAL(5,2) NOT NULL,
        note_max DECIMAL(5,2) DEFAULT 20.00,
        date_evaluation DATE,
        commentaire TEXT,
        enseignant_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eleve_id) REFERENCES eleves(id),
        FOREIGN KEY (matiere_id) REFERENCES matieres(id),
        FOREIGN KEY (classe_id) REFERENCES classes(id),
        FOREIGN KEY (periode_id) REFERENCES periodes(id),
        FOREIGN KEY (type_evaluation_id) REFERENCES types_evaluations(id),
        FOREIGN KEY (enseignant_id) REFERENCES enseignants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table bulletins
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bulletins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        eleve_id INT NOT NULL,
        classe_id INT NOT NULL,
        periode_id INT NOT NULL,
        moyenne_generale DECIMAL(5,2),
        rang INT,
        total_eleves INT,
        appreciation TEXT,
        decision VARCHAR(100),
        date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        genere_par INT,
        FOREIGN KEY (eleve_id) REFERENCES eleves(id),
        FOREIGN KEY (classe_id) REFERENCES classes(id),
        FOREIGN KEY (periode_id) REFERENCES periodes(id),
        FOREIGN KEY (genere_par) REFERENCES utilisateurs(id),
        UNIQUE KEY unique_bulletin (eleve_id, classe_id, periode_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table délibérations
    await connection.query(`
      CREATE TABLE IF NOT EXISTS deliberations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        classe_id INT NOT NULL,
        periode_id INT NOT NULL,
        date_deliberation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        president VARCHAR(200),
        secretaire VARCHAR(200),
        statut ENUM('en_cours', 'terminee', 'validee') DEFAULT 'en_cours',
        pv TEXT,
        created_by INT,
        FOREIGN KEY (classe_id) REFERENCES classes(id),
        FOREIGN KEY (periode_id) REFERENCES periodes(id),
        FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table résultats délibération
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resultats_deliberation (
        id INT PRIMARY KEY AUTO_INCREMENT,
        deliberation_id INT NOT NULL,
        eleve_id INT NOT NULL,
        moyenne DECIMAL(5,2),
        decision ENUM('admis', 'ajourne', 'reprise', 'exclu') NOT NULL,
        mention VARCHAR(50),
        observations TEXT,
        FOREIGN KEY (deliberation_id) REFERENCES deliberations(id) ON DELETE CASCADE,
        FOREIGN KEY (eleve_id) REFERENCES eleves(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES ATTESTATIONS ET CERTIFICATS
    // =====================================================
    console.log('📜 Création des tables attestations...')

    await connection.query(`
      CREATE TABLE IF NOT EXISTS attestations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero VARCHAR(50) NOT NULL UNIQUE,
        type ENUM('reussite', 'frequentation', 'bonne_conduite', 'scolarite', 'autre') NOT NULL,
        eleve_id INT NOT NULL,
        annee_scolaire_id INT NOT NULL,
        classe_id INT,
        date_emission DATE NOT NULL,
        contenu TEXT,
        genere_par INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eleve_id) REFERENCES eleves(id),
        FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id),
        FOREIGN KEY (classe_id) REFERENCES classes(id),
        FOREIGN KEY (genere_par) REFERENCES utilisateurs(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES COMPTABILITÉ
    // =====================================================
    console.log('💰 Création des tables comptabilité...')

    // Table types de frais
    await connection.query(`
      CREATE TABLE IF NOT EXISTS types_frais (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        libelle VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table frais scolaires
    await connection.query(`
      CREATE TABLE IF NOT EXISTS frais_scolaires (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type_frais_id INT NOT NULL,
        classe_id INT,
        niveau_id INT,
        annee_scolaire_id INT NOT NULL,
        montant DECIMAL(15,2) NOT NULL,
        devise VARCHAR(10) DEFAULT 'FC',
        echeances INT DEFAULT 1,
        date_limite DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (type_frais_id) REFERENCES types_frais(id),
        FOREIGN KEY (classe_id) REFERENCES classes(id),
        FOREIGN KEY (niveau_id) REFERENCES niveaux(id),
        FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table paiements
    await connection.query(`
      CREATE TABLE IF NOT EXISTS paiements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero_recu VARCHAR(50) NOT NULL UNIQUE,
        eleve_id INT NOT NULL,
        inscription_id INT,
        type_frais_id INT NOT NULL,
        annee_scolaire_id INT NOT NULL,
        montant DECIMAL(15,2) NOT NULL,
        devise VARCHAR(10) DEFAULT 'FC',
        mode_paiement ENUM('especes', 'mobile_money', 'virement', 'cheque') DEFAULT 'especes',
        reference_paiement VARCHAR(100),
        date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        statut ENUM('en_attente', 'valide', 'annule') DEFAULT 'valide',
        observations TEXT,
        recu_par INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eleve_id) REFERENCES eleves(id),
        FOREIGN KEY (inscription_id) REFERENCES inscriptions(id),
        FOREIGN KEY (type_frais_id) REFERENCES types_frais(id),
        FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id),
        FOREIGN KEY (recu_par) REFERENCES utilisateurs(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table factures
    await connection.query(`
      CREATE TABLE IF NOT EXISTS factures (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero VARCHAR(50) NOT NULL UNIQUE,
        eleve_id INT NOT NULL,
        annee_scolaire_id INT NOT NULL,
        montant_total DECIMAL(15,2) NOT NULL,
        montant_paye DECIMAL(15,2) DEFAULT 0,
        devise VARCHAR(10) DEFAULT 'FC',
        statut ENUM('en_attente', 'partielle', 'payee', 'annulee') DEFAULT 'en_attente',
        date_emission DATE NOT NULL,
        date_echeance DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eleve_id) REFERENCES eleves(id),
        FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table lignes facture
    await connection.query(`
      CREATE TABLE IF NOT EXISTS facture_lignes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        facture_id INT NOT NULL,
        type_frais_id INT NOT NULL,
        description VARCHAR(255),
        montant DECIMAL(15,2) NOT NULL,
        FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE,
        FOREIGN KEY (type_frais_id) REFERENCES types_frais(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table catégories dépenses
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories_depenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        libelle VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table dépenses
    await connection.query(`
      CREATE TABLE IF NOT EXISTS depenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero VARCHAR(50) NOT NULL UNIQUE,
        categorie_id INT NOT NULL,
        libelle VARCHAR(255) NOT NULL,
        description TEXT,
        montant DECIMAL(15,2) NOT NULL,
        devise VARCHAR(10) DEFAULT 'FC',
        date_depense DATE NOT NULL,
        beneficiaire VARCHAR(200),
        mode_paiement ENUM('especes', 'mobile_money', 'virement', 'cheque') DEFAULT 'especes',
        reference VARCHAR(100),
        justificatif VARCHAR(255),
        statut ENUM('en_attente', 'approuvee', 'rejetee') DEFAULT 'en_attente',
        approuve_par INT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categorie_id) REFERENCES categories_depenses(id),
        FOREIGN KEY (approuve_par) REFERENCES utilisateurs(id),
        FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table mouvements caisse
    await connection.query(`
      CREATE TABLE IF NOT EXISTS mouvements_caisse (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('entree', 'sortie') NOT NULL,
        montant DECIMAL(15,2) NOT NULL,
        devise VARCHAR(10) DEFAULT 'FC',
        libelle VARCHAR(255) NOT NULL,
        reference_id INT,
        reference_type VARCHAR(50),
        date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        solde_apres DECIMAL(15,2),
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES RH - SALAIRES, CONGÉS, CONTRATS
    // =====================================================
    console.log('💼 Création des tables RH...')

    // Table salaires
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salaires (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employe_type ENUM('enseignant', 'personnel') NOT NULL,
        employe_id INT NOT NULL,
        mois INT NOT NULL,
        annee INT NOT NULL,
        salaire_base DECIMAL(15,2) NOT NULL,
        primes DECIMAL(15,2) DEFAULT 0,
        deductions DECIMAL(15,2) DEFAULT 0,
        avance DECIMAL(15,2) DEFAULT 0,
        dette_anterieure DECIMAL(15,2) DEFAULT 0,
        net_a_payer DECIMAL(15,2) NOT NULL,
        devise VARCHAR(10) DEFAULT 'FC',
        statut ENUM('en_attente', 'paye', 'annule') DEFAULT 'en_attente',
        date_paiement DATE,
        mode_paiement ENUM('especes', 'mobile_money', 'virement') DEFAULT 'especes',
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_salaire (employe_type, employe_id, mois, annee)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table types congés
    await connection.query(`
      CREATE TABLE IF NOT EXISTS types_conges (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        libelle VARCHAR(100) NOT NULL,
        jours_max INT DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table congés
    await connection.query(`
      CREATE TABLE IF NOT EXISTS conges (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employe_type ENUM('enseignant', 'personnel') NOT NULL,
        employe_id INT NOT NULL,
        type_conge_id INT NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        motif TEXT,
        statut ENUM('en_attente', 'approuve', 'rejete', 'annule') DEFAULT 'en_attente',
        approuve_par INT,
        date_approbation TIMESTAMP,
        commentaire_approbation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (type_conge_id) REFERENCES types_conges(id),
        FOREIGN KEY (approuve_par) REFERENCES utilisateurs(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table contrats
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contrats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero VARCHAR(50) NOT NULL UNIQUE,
        employe_type ENUM('enseignant', 'personnel') NOT NULL,
        employe_id INT NOT NULL,
        type_contrat ENUM('CDI', 'CDD', 'Stage', 'Vacation') NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE,
        salaire DECIMAL(15,2),
        devise VARCHAR(10) DEFAULT 'FC',
        poste VARCHAR(100),
        departement VARCHAR(100),
        document VARCHAR(255),
        statut ENUM('actif', 'termine', 'renouvele', 'resilie') DEFAULT 'actif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table présences
    await connection.query(`
      CREATE TABLE IF NOT EXISTS presences (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employe_type ENUM('enseignant', 'personnel') NOT NULL,
        employe_id INT NOT NULL,
        date_presence DATE NOT NULL,
        heure_arrivee TIME,
        heure_depart TIME,
        statut ENUM('present', 'absent', 'retard', 'conge', 'mission') DEFAULT 'present',
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_presence (employe_type, employe_id, date_presence)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES EMPLOI DU TEMPS
    // =====================================================
    console.log('📅 Création des tables emploi du temps...')

    // Table salles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        libelle VARCHAR(100) NOT NULL,
        capacite INT DEFAULT 50,
        equipements TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table créneaux horaires
    await connection.query(`
      CREATE TABLE IF NOT EXISTS creneaux_horaires (
        id INT PRIMARY KEY AUTO_INCREMENT,
        libelle VARCHAR(50) NOT NULL,
        heure_debut TIME NOT NULL,
        heure_fin TIME NOT NULL,
        ordre INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table emploi du temps
    await connection.query(`
      CREATE TABLE IF NOT EXISTS emploi_temps (
        id INT PRIMARY KEY AUTO_INCREMENT,
        classe_id INT NOT NULL,
        matiere_id INT NOT NULL,
        enseignant_id INT,
        salle_id INT,
        creneau_id INT NOT NULL,
        jour ENUM('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi') NOT NULL,
        annee_scolaire_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (classe_id) REFERENCES classes(id),
        FOREIGN KEY (matiere_id) REFERENCES matieres(id),
        FOREIGN KEY (enseignant_id) REFERENCES enseignants(id),
        FOREIGN KEY (salle_id) REFERENCES salles(id),
        FOREIGN KEY (creneau_id) REFERENCES creneaux_horaires(id),
        FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES COMMUNICATION
    // =====================================================
    console.log('💬 Création des tables communication...')

    // Table messages (contact parents depuis landing page)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages_contact (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(200) NOT NULL,
        email VARCHAR(255),
        telephone VARCHAR(50),
        sujet VARCHAR(255),
        message TEXT NOT NULL,
        lu BOOLEAN DEFAULT FALSE,
        repondu BOOLEAN DEFAULT FALSE,
        reponse TEXT,
        repondu_par INT,
        date_reponse TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repondu_par) REFERENCES utilisateurs(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table notifications
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        utilisateur_id INT NOT NULL,
        titre VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        lue BOOLEAN DEFAULT FALSE,
        lien VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES LOGS ET HISTORIQUE
    // =====================================================
    console.log('📊 Création des tables logs et historique...')

    // Table logs système
    await connection.query(`
      CREATE TABLE IF NOT EXISTS logs_systeme (
        id INT PRIMARY KEY AUTO_INCREMENT,
        utilisateur_id INT,
        action VARCHAR(100) NOT NULL,
        module VARCHAR(100),
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table historique connexions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS historique_connexions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        utilisateur_id INT NOT NULL,
        date_connexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        localisation VARCHAR(255),
        succes BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // TABLES MULTI-TENANT
    // =====================================================
    console.log('🏢 Création des tables multi-tenant...')

    // Table schools (écoles/tenants)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        logo VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'FC',
        subscription_tier ENUM('basic', 'standard', 'premium') DEFAULT 'basic',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table available_modules (modules disponibles sur la plateforme)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS available_modules (
        id INT PRIMARY KEY AUTO_INCREMENT,
        module_key VARCHAR(100) NOT NULL UNIQUE,
        module_name VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('core', 'academic', 'financial', 'hr', 'communication', 'advanced') DEFAULT 'core',
        is_default_enabled TINYINT(1) DEFAULT 1,
        requires_subscription ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
        icon VARCHAR(50),
        sort_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table school_modules (modules activés par école)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS school_modules (
        id INT PRIMARY KEY AUTO_INCREMENT,
        school_id INT NOT NULL,
        module_key VARCHAR(100) NOT NULL,
        enabled TINYINT(1) DEFAULT 1,
        enabled_at TIMESTAMP NULL,
        disabled_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT,
        UNIQUE KEY unique_school_module (school_id, module_key),
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Table audit_logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        user_email VARCHAR(255),
        user_role VARCHAR(50),
        school_id INT,
        school_code VARCHAR(20),
        action_type VARCHAR(50) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INT,
        entity_name VARCHAR(255),
        description TEXT,
        old_values TEXT,
        new_values TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        request_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_school (school_id),
        INDEX idx_audit_user (user_id),
        INDEX idx_audit_action (action_type),
        INDEX idx_audit_date (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // =====================================================
    // AJOUT COLONNES school_id (multi-tenant)
    // =====================================================
    console.log('🔗 Ajout des colonnes school_id...')

    const tablesNeedingSchoolId = [
      'utilisateurs', 'eleves', 'enseignants', 'personnel',
      'classes', 'inscriptions', 'paiements', 'depenses',
      'frais_scolaires', 'notes', 'contrats', 'conges',
      'salaires', 'presences', 'mouvements_caisse',
      'matieres', 'emploi_temps', 'salles', 'annees_scolaires'
    ]

    for (const table of tablesNeedingSchoolId) {
      try {
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN school_id INT NULL`)
      } catch {
        // Column already exists, ignore
      }
      try {
        await connection.query(`CREATE INDEX idx_${table}_school ON \`${table}\` (school_id)`)
      } catch {
        // Index already exists, ignore
      }
    }

    // Migration: affecter les données orphelines (school_id NULL) à la première école
    try {
      const [schoolRows] = await connection.query(`SELECT id FROM schools ORDER BY id LIMIT 1`)
      const firstSchoolId = (schoolRows as any[])?.[0]?.id
      if (firstSchoolId) {
        for (const table of tablesNeedingSchoolId) {
          try {
            await connection.query(`UPDATE \`${table}\` SET school_id = ? WHERE school_id IS NULL`, [firstSchoolId])
          } catch { /* ignore */ }
        }
        console.log(`📌 Données orphelines assignées à l'école ID ${firstSchoolId}`)
      }
    } catch { /* no schools yet */ }

    console.log('\n✅ Toutes les tables ont été créées avec succès !')

    // =====================================================
    // DONNÉES INITIALES
    // =====================================================
    console.log('\n📥 Insertion des données initiales...')

    // Rôles
    await connection.query(`
      INSERT IGNORE INTO roles (code, libelle, description) VALUES
      ('super_admin', 'Super Administrateur', 'Accès complet à tout le système'),
      ('admin', 'Administrateur', 'Gestion administrative complète'),
      ('comptable', 'Comptable', 'Gestion financière et comptable'),
      ('rh', 'Ressources Humaines', 'Gestion du personnel'),
      ('enseignant', 'Enseignant', 'Gestion pédagogique'),
      ('parent', 'Parent', 'Consultation et paiements'),
      ('eleve', 'Élève', 'Consultation uniquement')
    `)

    // Permissions (modules)
    const modules = [
      'dashboard', 'eleves', 'inscriptions', 'classes', 'matieres', 'notes',
      'bulletins', 'resultats', 'attestations', 'emploi_temps', 'paiements',
      'comptabilite', 'depenses', 'caisse', 'enseignants', 'personnel',
      'presences', 'conges', 'salaires', 'contrats', 'configuration', 'utilisateurs'
    ]
    const actions = ['create', 'read', 'update', 'delete']

    for (const module of modules) {
      for (const action of actions) {
        await connection.query(
          `INSERT IGNORE INTO permissions (module, action, description) VALUES (?, ?, ?)`,
          [module, action, `${action} sur ${module}`]
        )
      }
    }

    // Types de frais
    await connection.query(`
      INSERT IGNORE INTO types_frais (code, libelle, description) VALUES
      ('INSC', 'Frais d\\'inscription', 'Frais payés lors de l\\'inscription'),
      ('SCOL', 'Frais scolaires', 'Minerval mensuel'),
      ('EXAM', 'Frais d\\'examen', 'Frais pour les examens'),
      ('AUTRE', 'Autres frais', 'Frais divers')
    `)

    // Types de congés
    await connection.query(`
      INSERT IGNORE INTO types_conges (code, libelle, jours_max) VALUES
      ('ANNUEL', 'Congé annuel', 30),
      ('MALADIE', 'Congé maladie', 15),
      ('MATERNITE', 'Congé maternité', 90),
      ('PATERNITE', 'Congé paternité', 10),
      ('SPECIAL', 'Congé spécial', 5)
    `)

    // Catégories de dépenses
    await connection.query(`
      INSERT IGNORE INTO categories_depenses (code, libelle) VALUES
      ('FOURNITURES', 'Fournitures de bureau'),
      ('ENTRETIEN', 'Entretien et réparations'),
      ('EQUIPEMENT', 'Équipements'),
      ('SERVICES', 'Services externes'),
      ('TRANSPORT', 'Transport'),
      ('AUTRE', 'Autres dépenses')
    `)

    // Cycles scolaires RDC
    await connection.query(`
      INSERT IGNORE INTO cycles (code, libelle, ordre) VALUES
      ('MATERNELLE', 'Maternelle', 1),
      ('PRIMAIRE', 'Primaire', 2),
      ('SECONDAIRE', 'Secondaire', 3)
    `)

    // Niveaux
    await connection.query(`
      INSERT IGNORE INTO niveaux (code, libelle, cycle_id, ordre) VALUES
      ('MAT1', 'Petite Section', 1, 1),
      ('MAT2', 'Moyenne Section', 1, 2),
      ('MAT3', 'Grande Section', 1, 3),
      ('1ERE', '1ère Primaire', 2, 1),
      ('2EME', '2ème Primaire', 2, 2),
      ('3EME', '3ème Primaire', 2, 3),
      ('4EME', '4ème Primaire', 2, 4),
      ('5EME', '5ème Primaire', 2, 5),
      ('6EME', '6ème Primaire', 2, 6),
      ('7EME', '7ème Secondaire', 3, 1),
      ('8EME', '8ème Secondaire', 3, 2),
      ('1ERE_SEC', '1ère Secondaire', 3, 3),
      ('2EME_SEC', '2ème Secondaire', 3, 4),
      ('3EME_SEC', '3ème Secondaire', 3, 5),
      ('4EME_SEC', '4ème Secondaire', 3, 6)
    `)

    // Filières
    await connection.query(`
      INSERT IGNORE INTO filieres (code, libelle, description) VALUES
      ('GENERAL', 'Général', 'Section générale'),
      ('LITTERAIRE', 'Littéraire', 'Section littéraire'),
      ('SCIENTIFIQUE', 'Scientifique', 'Section scientifique'),
      ('COMMERCIALE', 'Commerciale', 'Section commerciale et gestion'),
      ('TECHNIQUE', 'Technique', 'Section technique')
    `)

    // Types d'évaluations
    await connection.query(`
      INSERT IGNORE INTO types_evaluations (code, libelle, coefficient) VALUES
      ('INTERRO', 'Interrogation', 1.0),
      ('DEVOIR', 'Devoir', 1.5),
      ('EXAMEN', 'Examen', 2.0),
      ('TP', 'Travail Pratique', 1.0)
    `)

    // Créneaux horaires
    await connection.query(`
      INSERT IGNORE INTO creneaux_horaires (libelle, heure_debut, heure_fin, ordre) VALUES
      ('1ère heure', '07:30:00', '08:30:00', 1),
      ('2ème heure', '08:30:00', '09:30:00', 2),
      ('Récréation', '09:30:00', '10:00:00', 3),
      ('3ème heure', '10:00:00', '11:00:00', 4),
      ('4ème heure', '11:00:00', '12:00:00', 5),
      ('Pause déjeuner', '12:00:00', '14:00:00', 6),
      ('5ème heure', '14:00:00', '15:00:00', 7),
      ('6ème heure', '15:00:00', '16:00:00', 8)
    `)

    // Salles par défaut
    await connection.query(`
      INSERT IGNORE INTO salles (code, libelle, capacite) VALUES
      ('SALLE-1A', '1ère A', 50),
      ('SALLE-2A', '2ème A', 50),
      ('SALLE-3A', '3ème A', 50),
      ('SALLE-4A', '4ème A', 50),
      ('SALLE-5A', '5ème A', 50),
      ('SALLE-6A', '6ème A', 50),
      ('LAB-A1', 'Laboratoire A1', 30),
      ('SALLE-INFO', 'Salle Informatique', 25),
      ('SALLE-CHIMIE', 'Salle Chimie', 30),
      ('SALLE-SPORT', 'Salle de Sport', 100),
      ('BIBLIO', 'Bibliothèque', 40)
    `)

    // Matières de base
    await connection.query(`
      INSERT IGNORE INTO matieres (code, libelle, coefficient) VALUES
      ('FR', 'Français', 2.0),
      ('MATH', 'Mathématiques', 2.0),
      ('ANG', 'Anglais', 1.5),
      ('SVT', 'Sciences de la Vie et de la Terre', 1.5),
      ('PHYS', 'Physique', 1.5),
      ('CHIM', 'Chimie', 1.5),
      ('HIST', 'Histoire', 1.0),
      ('GEO', 'Géographie', 1.0),
      ('ECM', 'Éducation Civique et Morale', 1.0),
      ('EPS', 'Éducation Physique et Sportive', 1.0),
      ('INFO', 'Informatique', 1.0),
      ('ARTS', 'Arts Plastiques', 1.0),
      ('MUS', 'Musique', 1.0)
    `)

    // Année scolaire active
    await connection.query(`
      INSERT IGNORE INTO annees_scolaires (libelle, date_debut, date_fin, est_active) VALUES
      ('2024-2025', '2024-09-02', '2025-06-30', TRUE)
    `)

    // Périodes pour l'année active
    await connection.query(`
      INSERT IGNORE INTO periodes (code, libelle, annee_scolaire_id, date_debut, date_fin, ordre) VALUES
      ('T1', '1er Trimestre', 1, '2024-09-02', '2024-12-20', 1),
      ('T2', '2ème Trimestre', 1, '2025-01-06', '2025-03-28', 2),
      ('T3', '3ème Trimestre', 1, '2025-04-07', '2025-06-30', 3)
    `)

    // Établissement par défaut
    await connection.query(`
      INSERT IGNORE INTO etablissement (id, nom, devise, adresse, telephone, email, province) VALUES
      (1, 'Collège & Lycée La Réussite', 'Le Savoir pour la Réussite', 
       'Avenue de l\\'Enseignement, Gombe, Kinshasa', '+243 81 000 00 00', 
       'contact@lareussite-rdc.edu', 'Kinshasa')
    `)

    // Classes par défaut
    await connection.query(`
      INSERT IGNORE INTO classes (code, libelle, niveau_id, filiere_id, capacite, annee_scolaire_id) VALUES
      ('MAT1A', 'Petite Section A', 1, 1, 30, 1),
      ('MAT1B', 'Petite Section B', 1, 1, 30, 1),
      ('MAT2A', 'Moyenne Section A', 2, 1, 30, 1),
      ('MAT3A', 'Grande Section A', 3, 1, 30, 1),
      ('1PRIA', '1ère Primaire A', 4, 1, 35, 1),
      ('1PRIB', '1ère Primaire B', 4, 1, 35, 1),
      ('2PRIA', '2ème Primaire A', 5, 1, 35, 1),
      ('3PRIA', '3ème Primaire A', 6, 1, 35, 1),
      ('4PRIA', '4ème Primaire A', 7, 1, 35, 1),
      ('5PRIA', '5ème Primaire A', 8, 1, 35, 1),
      ('6PRIA', '6ème Primaire A', 9, 1, 35, 1),
      ('7SECA', '7ème Secondaire A', 10, 1, 40, 1),
      ('8SECA', '8ème Secondaire A', 11, 1, 40, 1),
      ('1SECA', '1ère Secondaire A', 12, 1, 40, 1),
      ('2SECA', '2ème Secondaire A', 13, 1, 40, 1),
      ('3SECL', '3ème Secondaire Littéraire', 14, 2, 35, 1),
      ('3SECS', '3ème Secondaire Scientifique', 14, 3, 35, 1),
      ('4SECL', '4ème Secondaire Littéraire', 15, 2, 35, 1),
      ('4SECS', '4ème Secondaire Scientifique', 15, 3, 35, 1)
    `)

    // Modules disponibles
    await connection.query(`
      INSERT IGNORE INTO available_modules (module_key, module_name, description, category, is_default_enabled, requires_subscription, sort_order) VALUES
      ('dashboard', 'Tableau de bord', 'Vue d''ensemble et statistiques', 'core', 1, 'free', 1),
      ('students', 'Gestion des élèves', 'Inscriptions, fiches élèves, classes', 'academic', 1, 'free', 10),
      ('grades', 'Notes et bulletins', 'Saisie des notes, génération de bulletins', 'academic', 1, 'free', 13),
      ('payments', 'Comptabilité', 'Paiements, frais, dépenses, caisse', 'financial', 1, 'free', 20),
      ('teachers', 'Ressources Humaines', 'Enseignants, personnel, salaires, congés', 'hr', 1, 'free', 30),
      ('schedule', 'Emploi du temps', 'Planification des cours', 'academic', 1, 'basic', 15),
      ('certificates', 'Attestations', 'Génération de certificats et attestations', 'academic', 0, 'basic', 16),
      ('notifications', 'Communication', 'Messages et notifications', 'communication', 1, 'free', 40)
    `)

    // =====================================================
    // PERMISSIONS PAR RÔLE
    // =====================================================
    console.log('🔐 Attribution des permissions aux rôles...')

    // Mapping rôle → modules autorisés
    const rolePermissionsMap: Record<string, { module: string; actions: string[] }[]> = {
      admin: modules.map(m => ({ module: m, actions: ['create', 'read', 'update', 'delete'] })),
      comptable: [
        { module: 'dashboard', actions: ['read'] },
        { module: 'eleves', actions: ['read'] },
        { module: 'inscriptions', actions: ['read'] },
        { module: 'classes', actions: ['read'] },
        { module: 'comptabilite', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'paiements', actions: ['create', 'read', 'update'] },
        { module: 'depenses', actions: ['create', 'read', 'update'] },
        { module: 'caisse', actions: ['create', 'read', 'update'] },
        { module: 'salaires', actions: ['read'] },
      ],
      rh: [
        { module: 'dashboard', actions: ['read'] },
        { module: 'enseignants', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'personnel', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'presences', actions: ['create', 'read', 'update'] },
        { module: 'conges', actions: ['create', 'read', 'update'] },
        { module: 'salaires', actions: ['create', 'read', 'update'] },
        { module: 'contrats', actions: ['create', 'read', 'update'] },
      ],
      enseignant: [
        { module: 'dashboard', actions: ['read'] },
        { module: 'eleves', actions: ['read'] },
        { module: 'inscriptions', actions: ['read'] },
        { module: 'classes', actions: ['read'] },
        { module: 'matieres', actions: ['read'] },
        { module: 'notes', actions: ['create', 'read', 'update'] },
        { module: 'bulletins', actions: ['read'] },
        { module: 'resultats', actions: ['read'] },
        { module: 'emploi_temps', actions: ['read'] },
        { module: 'presences', actions: ['read'] },
        { module: 'conges', actions: ['create', 'read'] },
      ],
    }

    for (const [roleCode, perms] of Object.entries(rolePermissionsMap)) {
      const [roleRows] = await connection.query(`SELECT id FROM roles WHERE code = ?`, [roleCode])
      const roleId = (roleRows as any[])?.[0]?.id
      if (!roleId) continue
      for (const perm of perms) {
        for (const action of perm.actions) {
          try {
            const [permRows] = await connection.query(
              `SELECT id FROM permissions WHERE module = ? AND action = ?`,
              [perm.module, action]
            )
            const permId = (permRows as any[])?.[0]?.id
            if (permId) {
              await connection.query(
                `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
                [roleId, permId]
              )
            }
          } catch { /* ignore */ }
        }
      }
    }
    console.log('✅ Permissions attribuées aux rôles')

    // Créer le super admin par défaut
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await connection.query(`
      INSERT IGNORE INTO utilisateurs (email, password, nom, prenom, role_id, is_active) VALUES
      ('admin@sgs-rdc.edu', ?, 'Kabila', 'Joseph', 1, TRUE)
    `, [hashedPassword])

    console.log('✅ Données initiales insérées avec succès !')
    console.log('\n========================================')
    console.log('🎉 Base de données initialisée avec succès !')
    console.log('========================================')
    console.log('\n📧 Compte Super Admin:')
    console.log('   Email: admin@sgs-rdc.edu')
    console.log('   Mot de passe: admin123')
    console.log('\n')

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    throw error
  } finally {
    await connection.end()
  }
}

// Exécuter l'initialisation
initDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))

