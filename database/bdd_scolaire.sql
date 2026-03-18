-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Client :  127.0.0.1
-- Généré le :  Mer 18 Mars 2026 à 12:18
-- Version du serveur :  5.6.17
-- Version de PHP :  5.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de données :  `bdd_scolaire`
--

-- --------------------------------------------------------

--
-- Structure de la table `annees_scolaires`
--

CREATE TABLE IF NOT EXISTS `annees_scolaires` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `libelle` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `est_active` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  KEY `idx_annees_scolaires_school_id` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=3 ;

--
-- Contenu de la table `annees_scolaires`
--

INSERT INTO `annees_scolaires` (`id`, `libelle`, `date_debut`, `date_fin`, `est_active`, `created_at`, `updated_at`, `school_id`) VALUES
(1, '2024-2025', '2024-09-02', '2025-06-30', 1, '2025-12-03 13:54:20', '2025-12-05 17:23:19', 1),
(2, 'New Year', '2026-03-04', '2026-03-29', 0, '2026-03-04 11:53:24', '2026-03-04 15:07:45', 1);

-- --------------------------------------------------------

--
-- Structure de la table `attestations`
--

CREATE TABLE IF NOT EXISTS `attestations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('reussite','frequentation','bonne_conduite','scolarite','autre') COLLATE utf8mb4_unicode_ci NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `classe_id` int(11) DEFAULT NULL,
  `date_emission` date NOT NULL,
  `contenu` text COLLATE utf8mb4_unicode_ci,
  `genere_par` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `eleve_id` (`eleve_id`),
  KEY `annee_scolaire_id` (`annee_scolaire_id`),
  KEY `classe_id` (`classe_id`),
  KEY `genere_par` (`genere_par`),
  KEY `idx_attestations_school_id` (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `audit_logs`
--

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_id` int(11) DEFAULT NULL,
  `school_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_type` enum('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','ENABLE','DISABLE','RESET_PASSWORD','ASSIGN','UNASSIGN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `entity_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `old_values` text COLLATE utf8mb4_unicode_ci,
  `new_values` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_school` (`school_id`),
  KEY `idx_audit_action` (`action_type`),
  KEY `idx_audit_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `available_modules`
--

CREATE TABLE IF NOT EXISTS `available_modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` enum('core','academic','financial','hr','communication','advanced') COLLATE utf8mb4_unicode_ci DEFAULT 'core',
  `is_default_enabled` tinyint(1) DEFAULT '1',
  `requires_subscription` enum('free','basic','premium','enterprise') COLLATE utf8mb4_unicode_ci DEFAULT 'free',
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `module_key` (`module_key`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=22 ;

--
-- Contenu de la table `available_modules`
--

INSERT INTO `available_modules` (`id`, `module_key`, `module_name`, `description`, `category`, `is_default_enabled`, `requires_subscription`, `icon`, `sort_order`, `is_active`, `created_at`) VALUES
(1, 'dashboard', 'Tableau de bord', NULL, 'core', 1, 'free', 'LayoutDashboard', 1, 1, '2025-12-05 17:21:16'),
(2, 'students', 'Gestion des élèves', NULL, 'academic', 1, 'free', 'Users', 10, 1, '2025-12-05 17:21:16'),
(3, 'classes', 'Classes', NULL, 'academic', 1, 'free', 'School', 11, 1, '2025-12-05 17:21:16'),
(4, 'grades', 'Notes', NULL, 'academic', 1, 'free', 'FileText', 13, 1, '2025-12-05 17:21:16'),
(5, 'payments', 'Paiements', NULL, 'financial', 1, 'free', 'CreditCard', 20, 1, '2025-12-05 17:21:16'),
(6, 'teachers', 'Enseignants', NULL, 'hr', 1, 'free', 'GraduationCap', 30, 1, '2025-12-05 17:21:16'),
(7, 'settings', 'Paramètres', NULL, 'core', 1, 'free', 'Settings', 99, 1, '2025-12-05 17:21:16'),
(8, 'profile', 'Profil utilisateur', 'Gestion du profil personnel', 'core', 1, 'free', 'User', 3, 1, '2025-12-05 17:23:19'),
(9, 'subjects', 'Matières', 'Catalogue des matières', 'academic', 1, 'free', 'BookOpen', 12, 1, '2025-12-05 17:23:19'),
(10, 'report_cards', 'Bulletins', 'Génération des bulletins', 'academic', 1, 'free', 'FileOutput', 14, 1, '2025-12-05 17:23:19'),
(11, 'schedule', 'Emploi du temps', 'Planning des cours', 'academic', 1, 'basic', 'Calendar', 15, 1, '2025-12-05 17:23:19'),
(12, 'fees', 'Frais scolaires', 'Configuration des frais', 'financial', 1, 'free', 'Receipt', 21, 1, '2025-12-05 17:23:19'),
(13, 'expenses', 'Dépenses', 'Suivi des dépenses', 'financial', 1, 'basic', 'TrendingDown', 22, 1, '2025-12-05 17:23:19'),
(14, 'cashbox', 'Caisse', 'Mouvements de caisse', 'financial', 0, 'basic', 'Wallet', 23, 1, '2025-12-05 17:23:19'),
(15, 'staff', 'Personnel', 'Personnel administratif', 'hr', 0, 'basic', 'Briefcase', 31, 1, '2025-12-05 17:23:19'),
(16, 'attendance_hr', 'Présences RH', 'Suivi des présences', 'hr', 0, 'basic', 'UserCheck', 32, 1, '2025-12-05 17:23:19'),
(17, 'leaves', 'Congés', 'Demandes de congés', 'hr', 0, 'basic', 'CalendarOff', 33, 1, '2025-12-05 17:23:19'),
(18, 'payroll', 'Salaires', 'Paie des employés', 'hr', 0, 'premium', 'Banknote', 34, 1, '2025-12-05 17:23:19'),
(19, 'notifications', 'Notifications', 'Alertes internes', 'communication', 1, 'free', 'Bell', 40, 1, '2025-12-05 17:23:19'),
(20, 'announcements', 'Annonces', 'Publications', 'communication', 0, 'basic', 'Megaphone', 41, 1, '2025-12-05 17:23:19'),
(21, 'certificates', 'Attestations', 'Génération de certificats et attestations', 'academic', 0, 'basic', NULL, 16, 1, '2026-03-02 13:19:01');

-- --------------------------------------------------------

--
-- Structure de la table `bulletins`
--

CREATE TABLE IF NOT EXISTS `bulletins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `eleve_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `periode_id` int(11) NOT NULL,
  `moyenne_generale` decimal(5,2) DEFAULT NULL,
  `rang` int(11) DEFAULT NULL,
  `total_eleves` int(11) DEFAULT NULL,
  `appreciation` text COLLATE utf8mb4_unicode_ci,
  `decision` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_generation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `genere_par` int(11) DEFAULT NULL,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_bulletin` (`eleve_id`,`classe_id`,`periode_id`),
  KEY `classe_id` (`classe_id`),
  KEY `periode_id` (`periode_id`),
  KEY `genere_par` (`genere_par`),
  KEY `idx_bulletins_school_id` (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `categories_depenses`
--

CREATE TABLE IF NOT EXISTS `categories_depenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=7 ;

--
-- Contenu de la table `categories_depenses`
--

INSERT INTO `categories_depenses` (`id`, `code`, `libelle`, `created_at`) VALUES
(1, 'FOURNITURES', 'Fournitures de bureau', '2025-12-03 13:54:20'),
(2, 'ENTRETIEN', 'Entretien et réparations', '2025-12-03 13:54:20'),
(3, 'EQUIPEMENT', 'Équipements', '2025-12-03 13:54:20'),
(4, 'SERVICES', 'Services externes', '2025-12-03 13:54:20'),
(5, 'TRANSPORT', 'Transport', '2025-12-03 13:54:20'),
(6, 'AUTRE', 'Autres dépenses', '2025-12-03 13:54:20');

-- --------------------------------------------------------

--
-- Structure de la table `classes`
--

CREATE TABLE IF NOT EXISTS `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `niveau_id` int(11) NOT NULL,
  `filiere_id` int(11) DEFAULT NULL,
  `capacite` int(11) DEFAULT '50',
  `annee_scolaire_id` int(11) NOT NULL,
  `titulaire_id` int(11) DEFAULT NULL,
  `salle` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_classe_annee` (`code`,`annee_scolaire_id`),
  KEY `niveau_id` (`niveau_id`),
  KEY `filiere_id` (`filiere_id`),
  KEY `annee_scolaire_id` (`annee_scolaire_id`),
  KEY `idx_classes_school` (`school_id`),
  KEY `titulaire_id` (`titulaire_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=41 ;

--
-- Contenu de la table `classes`
--

INSERT INTO `classes` (`id`, `code`, `libelle`, `niveau_id`, `filiere_id`, `capacite`, `annee_scolaire_id`, `titulaire_id`, `salle`, `created_at`, `updated_at`, `school_id`) VALUES
(1, 'MAT1A', 'Petite Section A', 1, 1, 30, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(2, 'MAT1B', 'Petite Section B', 1, 1, 30, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(3, 'MAT2A', 'Moyenne Section A', 2, 1, 30, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(4, 'MAT3A', 'Grande Section A', 3, 1, 30, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(5, '1PRIA', '1ère Primaire A', 4, 1, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(6, '1PRI', '1ère Primaire B', 4, 1, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(7, '2PRIA', '2ème Primaire A', 5, 1, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(8, '3PRIA', '3ème Primaire A', 6, 1, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(9, '4PRIA', '4ème Primaire A', 7, 1, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(10, '5PRIA', '5ème Primaire A', 8, 1, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(11, '6PRIA', '6ème Primaire A', 9, 1, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(12, '7SECA', '7ème Secondaire A', 10, 1, 40, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(13, '8SECA', '8ème Secondaire A', 11, 1, 40, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(14, '1SECA', '1ère Secondaire A', 12, 1, 40, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(15, '2SECA', '2ème Secondaire A', 13, 1, 40, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(16, '3SECL', '3ème Secondaire Littéraire', 14, 2, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(17, '3SECS', '3ème Secondaire Scientifique', 14, 3, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(18, '4SECL', '4ème Secondaire Littéraire', 15, 2, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(19, '4SECS', '4ème Secondaire Scientifique', 15, 3, 35, 1, NULL, NULL, '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(40, '1A', '1ere A', 1, NULL, 35, 1, NULL, NULL, '2026-03-02 13:26:37', '2026-03-03 12:25:44', 3);

-- --------------------------------------------------------

--
-- Structure de la table `classe_matieres`
--

CREATE TABLE IF NOT EXISTS `classe_matieres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `classe_id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `heures_semaine` int(11) DEFAULT '2',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_classe_matiere` (`classe_id`,`matiere_id`),
  KEY `matiere_id` (`matiere_id`),
  KEY `idx_classe_matieres_school_id` (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `conges`
--

CREATE TABLE IF NOT EXISTS `conges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employe_type` enum('enseignant','personnel') COLLATE utf8mb4_unicode_ci NOT NULL,
  `employe_id` int(11) NOT NULL,
  `type_conge_id` int(11) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `motif` text COLLATE utf8mb4_unicode_ci,
  `statut` enum('en_attente','approuve','rejete','annule') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `approuve_par` int(11) DEFAULT NULL,
  `date_approbation` timestamp NULL DEFAULT NULL,
  `commentaire_approbation` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `type_conge_id` (`type_conge_id`),
  KEY `approuve_par` (`approuve_par`),
  KEY `idx_conges_school_id` (`school_id`),
  KEY `idx_conges_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2 ;

--
-- Contenu de la table `conges`
--

INSERT INTO `conges` (`id`, `employe_type`, `employe_id`, `type_conge_id`, `date_debut`, `date_fin`, `motif`, `statut`, `approuve_par`, `date_approbation`, `commentaire_approbation`, `created_at`, `school_id`) VALUES
(1, 'personnel', 1, 1, '2026-03-03', '2026-04-03', 'congé', 'approuve', 1, '2026-03-03 14:27:48', NULL, '2026-03-03 14:27:41', 1);

-- --------------------------------------------------------

--
-- Structure de la table `contrats`
--

CREATE TABLE IF NOT EXISTS `contrats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employe_type` enum('enseignant','personnel') COLLATE utf8mb4_unicode_ci NOT NULL,
  `employe_id` int(11) NOT NULL,
  `type_contrat` enum('CDI','CDD','Stage','Vacation') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `salaire` decimal(15,2) DEFAULT NULL,
  `devise` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'FC',
  `poste` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departement` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('actif','termine','renouvele','resilie') COLLATE utf8mb4_unicode_ci DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `idx_contrats_school_id` (`school_id`),
  KEY `idx_contrats_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2 ;

--
-- Contenu de la table `contrats`
--

INSERT INTO `contrats` (`id`, `numero`, `employe_type`, `employe_id`, `type_contrat`, `date_debut`, `date_fin`, `salaire`, `devise`, `poste`, `departement`, `document`, `statut`, `created_at`, `updated_at`, `school_id`) VALUES
(1, 'CTR260001', 'enseignant', 2, 'CDI', '2026-03-03', '2026-03-20', '30000.00', 'FC', 'ENSEIGNANT', NULL, NULL, 'actif', '2026-03-03 14:29:00', '2026-03-04 15:07:45', 1);

-- --------------------------------------------------------

--
-- Structure de la table `creneaux_horaires`
--

CREATE TABLE IF NOT EXISTS `creneaux_horaires` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `libelle` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `ordre` int(11) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_creneaux_horaires_school_id` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=41 ;

--
-- Contenu de la table `creneaux_horaires`
--

INSERT INTO `creneaux_horaires` (`id`, `libelle`, `heure_debut`, `heure_fin`, `ordre`, `created_at`, `school_id`) VALUES
(1, '1ère heure', '07:30:00', '08:30:00', 1, '2025-12-03 13:54:20', 1),
(2, '2ème heure', '08:30:00', '09:30:00', 2, '2025-12-03 13:54:20', 1),
(3, 'Récréation', '09:30:00', '10:00:00', 3, '2025-12-03 13:54:20', 1),
(4, '3ème heure', '10:00:00', '11:00:00', 4, '2025-12-03 13:54:20', 1),
(5, '4ème heure', '11:00:00', '12:00:00', 5, '2025-12-03 13:54:20', 1),
(6, 'Pause déjeuner', '12:00:00', '14:00:00', 6, '2025-12-03 13:54:20', 1),
(7, '5ème heure', '14:00:00', '15:00:00', 7, '2025-12-03 13:54:20', 1),
(8, '6ème heure', '15:00:00', '16:00:00', 8, '2025-12-03 13:54:20', 1),
(9, '1ère heure', '07:30:00', '08:30:00', 1, '2025-12-03 14:36:15', 1),
(10, '2ème heure', '08:30:00', '09:30:00', 2, '2025-12-03 14:36:15', 1),
(11, 'Récréation', '09:30:00', '10:00:00', 3, '2025-12-03 14:36:15', 1),
(12, '3ème heure', '10:00:00', '11:00:00', 4, '2025-12-03 14:36:15', 1),
(13, '4ème heure', '11:00:00', '12:00:00', 5, '2025-12-03 14:36:15', 1),
(14, 'Pause déjeuner', '12:00:00', '14:00:00', 6, '2025-12-03 14:36:15', 1),
(15, '5ème heure', '14:00:00', '15:00:00', 7, '2025-12-03 14:36:15', 1),
(16, '6ème heure', '15:00:00', '16:00:00', 8, '2025-12-03 14:36:15', 1),
(17, '1ère heure', '07:30:00', '08:30:00', 1, '2025-12-05 17:19:19', 1),
(18, '2ème heure', '08:30:00', '09:30:00', 2, '2025-12-05 17:19:19', 1),
(19, 'Récréation', '09:30:00', '10:00:00', 3, '2025-12-05 17:19:19', 1),
(20, '3ème heure', '10:00:00', '11:00:00', 4, '2025-12-05 17:19:19', 1),
(21, '4ème heure', '11:00:00', '12:00:00', 5, '2025-12-05 17:19:19', 1),
(22, 'Pause déjeuner', '12:00:00', '14:00:00', 6, '2025-12-05 17:19:19', 1),
(23, '5ème heure', '14:00:00', '15:00:00', 7, '2025-12-05 17:19:19', 1),
(24, '6ème heure', '15:00:00', '16:00:00', 8, '2025-12-05 17:19:19', 1),
(25, '1ère heure', '07:30:00', '08:30:00', 1, '2026-03-02 13:17:34', 3),
(26, '2ème heure', '08:30:00', '09:30:00', 2, '2026-03-02 13:17:34', 3),
(27, 'Récréation', '09:30:00', '10:00:00', 3, '2026-03-02 13:17:34', 3),
(28, '3ème heure', '10:00:00', '11:00:00', 4, '2026-03-02 13:17:34', 3),
(29, '4ème heure', '11:00:00', '12:00:00', 5, '2026-03-02 13:17:34', 3),
(30, 'Pause déjeuner', '12:00:00', '14:00:00', 6, '2026-03-02 13:17:34', 3),
(31, '5ème heure', '14:00:00', '15:00:00', 7, '2026-03-02 13:17:34', 3),
(32, '6ème heure', '15:00:00', '16:00:00', 8, '2026-03-02 13:17:34', 3),
(33, '1ère heure', '07:30:00', '08:30:00', 1, '2026-03-02 13:19:01', 3),
(34, '2ème heure', '08:30:00', '09:30:00', 2, '2026-03-02 13:19:01', 3),
(35, 'Récréation', '09:30:00', '10:00:00', 3, '2026-03-02 13:19:01', 3),
(36, '3ème heure', '10:00:00', '11:00:00', 4, '2026-03-02 13:19:01', 3),
(37, '4ème heure', '11:00:00', '12:00:00', 5, '2026-03-02 13:19:01', 3),
(38, 'Pause déjeuner', '12:00:00', '14:00:00', 6, '2026-03-02 13:19:01', 3),
(39, '5ème heure', '14:00:00', '15:00:00', 7, '2026-03-02 13:19:01', 3),
(40, '6ème heure', '15:00:00', '16:00:00', 8, '2026-03-02 13:19:01', 3);

-- --------------------------------------------------------

--
-- Structure de la table `cycles`
--

CREATE TABLE IF NOT EXISTS `cycles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ordre` int(11) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=4 ;

--
-- Contenu de la table `cycles`
--

INSERT INTO `cycles` (`id`, `code`, `libelle`, `ordre`, `created_at`) VALUES
(1, 'MATERNELLE', 'Maternelle', 1, '2026-03-02 13:17:34'),
(2, 'PRIMAIRE', 'Primaire', 2, '2026-03-02 13:17:34'),
(3, 'SECONDAIRE', 'Secondaire', 3, '2026-03-02 13:17:34');

-- --------------------------------------------------------

--
-- Structure de la table `deliberations`
--

CREATE TABLE IF NOT EXISTS `deliberations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `classe_id` int(11) NOT NULL,
  `periode_id` int(11) NOT NULL,
  `date_deliberation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `president` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secretaire` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('en_cours','terminee','validee') COLLATE utf8mb4_unicode_ci DEFAULT 'en_cours',
  `pv` text COLLATE utf8mb4_unicode_ci,
  `created_by` int(11) DEFAULT NULL,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `classe_id` (`classe_id`),
  KEY `periode_id` (`periode_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_deliberations_school_id` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=3 ;

--
-- Contenu de la table `deliberations`
--

INSERT INTO `deliberations` (`id`, `classe_id`, `periode_id`, `date_deliberation`, `president`, `secretaire`, `statut`, `pv`, `created_by`, `school_id`) VALUES
(1, 9, 1, '2026-03-03 12:03:12', NULL, NULL, 'validee', NULL, 1, 3),
(2, 40, 1, '2026-03-03 12:39:25', NULL, NULL, 'validee', NULL, 1, 3);

-- --------------------------------------------------------

--
-- Structure de la table `depenses`
--

CREATE TABLE IF NOT EXISTS `depenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie_id` int(11) NOT NULL,
  `libelle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `montant` decimal(15,2) NOT NULL,
  `devise` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'FC',
  `date_depense` date NOT NULL,
  `beneficiaire` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mode_paiement` enum('especes','mobile_money','virement','cheque') COLLATE utf8mb4_unicode_ci DEFAULT 'especes',
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `justificatif` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('en_attente','approuvee','rejetee') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `approuve_par` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `categorie_id` (`categorie_id`),
  KEY `approuve_par` (`approuve_par`),
  KEY `created_by` (`created_by`),
  KEY `idx_depenses_school_id` (`school_id`),
  KEY `idx_depenses_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2 ;

--
-- Contenu de la table `depenses`
--

INSERT INTO `depenses` (`id`, `numero`, `categorie_id`, `libelle`, `description`, `montant`, `devise`, `date_depense`, `beneficiaire`, `mode_paiement`, `reference`, `justificatif`, `statut`, `approuve_par`, `created_by`, `created_at`, `school_id`) VALUES
(1, 'DEP26048860', 3, 'Achat ordinateur', NULL, '20020.00', 'FC', '2026-03-03', 'IT', 'especes', NULL, NULL, 'en_attente', NULL, 1, '2026-03-03 15:00:48', 1);

-- --------------------------------------------------------

--
-- Structure de la table `eleves`
--

CREATE TABLE IF NOT EXISTS `eleves` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `matricule` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postnom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sexe` enum('M','F') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_naissance` date NOT NULL,
  `lieu_naissance` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationalite` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Congolaise',
  `adresse` text COLLATE utf8mb4_unicode_ci,
  `telephone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `groupe_sanguin` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allergies` text COLLATE utf8mb4_unicode_ci,
  `nom_pere` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone_pere` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profession_pere` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom_mere` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone_mere` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profession_mere` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom_tuteur` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone_tuteur` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adresse_tuteur` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricule` (`matricule`),
  KEY `idx_eleves_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=17 ;

--
-- Contenu de la table `eleves`
--

INSERT INTO `eleves` (`id`, `matricule`, `nom`, `postnom`, `prenom`, `sexe`, `date_naissance`, `lieu_naissance`, `nationalite`, `adresse`, `telephone`, `email`, `photo`, `groupe_sanguin`, `allergies`, `nom_pere`, `telephone_pere`, `profession_pere`, `nom_mere`, `telephone_mere`, `profession_mere`, `nom_tuteur`, `telephone_tuteur`, `adresse_tuteur`, `is_active`, `created_at`, `updated_at`, `school_id`) VALUES
(15, 'ELV260001', ' KULE', 'MOGABI', 'Blaise', 'M', '2026-03-12', 'Gbadolite', 'Congolaise', 'Plateau des residents', '0822696915', 'blaisekule2001@gmail.com', '/uploads/eleves/eleve-5bec001d-cd70-417e-8f81-9e73c0b5dd25.jpg', NULL, NULL, 'SONGBA', '0827062841', 'ENSEIGNANT', 'BERNADETTE YAMABA', '0827062841', NULL, 'Blaise KULE MOGABI', '0822696915', NULL, 1, '2026-03-02 16:38:57', '2026-03-04 12:43:21', 3),
(16, 'ELV260002', 'KOLA', 'WASIA', 'Patricia', 'F', '2026-03-12', 'Gbadolite', 'Congolaise', 'Rue Bete bloc B n°36', '0827062841', 'songbakule1958@gmail.com', NULL, NULL, NULL, 'Blaise KULE MOGABI', '0822696915', NULL, 'Blaise KULE MOGABI', '0822696915', NULL, 'Blaise KULE MOGABI', '0822696915', NULL, 1, '2026-03-03 08:49:23', '2026-03-03 12:24:40', 3);

-- --------------------------------------------------------

--
-- Structure de la table `emploi_temps`
--

CREATE TABLE IF NOT EXISTS `emploi_temps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `classe_id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `enseignant_id` int(11) DEFAULT NULL,
  `salle_id` int(11) DEFAULT NULL,
  `creneau_id` int(11) NOT NULL,
  `jour` enum('lundi','mardi','mercredi','jeudi','vendredi','samedi') COLLATE utf8mb4_unicode_ci NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `classe_id` (`classe_id`),
  KEY `matiere_id` (`matiere_id`),
  KEY `enseignant_id` (`enseignant_id`),
  KEY `salle_id` (`salle_id`),
  KEY `creneau_id` (`creneau_id`),
  KEY `annee_scolaire_id` (`annee_scolaire_id`),
  KEY `idx_emploi_temps_school_id` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=5 ;

--
-- Contenu de la table `emploi_temps`
--

INSERT INTO `emploi_temps` (`id`, `classe_id`, `matiere_id`, `enseignant_id`, `salle_id`, `creneau_id`, `jour`, `annee_scolaire_id`, `created_at`, `school_id`) VALUES
(4, 40, 13, 2, 12, 1, 'lundi', 1, '2026-03-03 13:52:00', 1);

-- --------------------------------------------------------

--
-- Structure de la table `enseignants`
--

CREATE TABLE IF NOT EXISTS `enseignants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `matricule` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `utilisateur_id` int(11) DEFAULT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postnom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sexe` enum('M','F') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `lieu_naissance` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationalite` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Congolaise',
  `adresse` text COLLATE utf8mb4_unicode_ci,
  `telephone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialite` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diplome` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_embauche` date DEFAULT NULL,
  `type_contrat` enum('CDI','CDD','Vacation') COLLATE utf8mb4_unicode_ci DEFAULT 'CDI',
  `salaire_base` decimal(15,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricule` (`matricule`),
  KEY `utilisateur_id` (`utilisateur_id`),
  KEY `idx_enseignants_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=3 ;

--
-- Contenu de la table `enseignants`
--

INSERT INTO `enseignants` (`id`, `matricule`, `utilisateur_id`, `nom`, `postnom`, `prenom`, `sexe`, `date_naissance`, `lieu_naissance`, `nationalite`, `adresse`, `telephone`, `email`, `photo`, `specialite`, `diplome`, `date_embauche`, `type_contrat`, `salaire_base`, `is_active`, `created_at`, `updated_at`, `school_id`) VALUES
(1, 'ENS260001', NULL, 'Mukendi', NULL, 'Jean', 'M', '1985-03-20', NULL, 'Congolaise', NULL, NULL, NULL, NULL, 'Maths', NULL, NULL, 'CDI', NULL, 1, '2026-03-02 13:21:17', '2026-03-03 12:25:44', 3),
(2, 'ENS260002', NULL, 'KULE', 'MOGABI', 'Blaise', 'M', '2026-03-03', 'Gbadolite', 'Congolaise', 'Plateau des residents', '0822696915', 'blaisekule2001@gmail.com', NULL, 'Math', 'Licence', '2026-03-03', 'CDI', '30000.00', 1, '2026-03-03 09:05:06', '2026-03-03 14:29:00', 3);

-- --------------------------------------------------------

--
-- Structure de la table `enseignant_affectations`
--

CREATE TABLE IF NOT EXISTS `enseignant_affectations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `enseignant_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `heures_semaine` int(11) DEFAULT '2',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_affectation` (`enseignant_id`,`classe_id`,`matiere_id`,`annee_scolaire_id`),
  KEY `classe_id` (`classe_id`),
  KEY `matiere_id` (`matiere_id`),
  KEY `annee_scolaire_id` (`annee_scolaire_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `etablissement`
--

CREATE TABLE IF NOT EXISTS `etablissement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `devise` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adresse` text COLLATE utf8mb4_unicode_ci,
  `telephone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site_web` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ministere` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Ministère de l''Éducation Nationale - RDC',
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Kinshasa',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2 ;

--
-- Contenu de la table `etablissement`
--

INSERT INTO `etablissement` (`id`, `nom`, `devise`, `adresse`, `telephone`, `email`, `site_web`, `logo`, `ministere`, `province`, `created_at`, `updated_at`) VALUES
(1, 'COLLEGE DE GBADOLITE', 'FC', 'Avenue de l''Enseignement, Gombe, Kinshasa', '+243 81 000 00 00', 'contact@lareussite-rdc.edu', '', '/uploads/etablissement/logo-84561fec-6c8c-448e-951c-043c70a2df2e.jpg', 'Ministère de l''Éducation Nationale - RDC', 'Kinshasa', '2025-12-03 13:54:20', '2026-03-04 12:50:33');

-- --------------------------------------------------------

--
-- Structure de la table `factures`
--

CREATE TABLE IF NOT EXISTS `factures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `montant_total` decimal(15,2) NOT NULL,
  `montant_paye` decimal(15,2) DEFAULT '0.00',
  `devise` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'FC',
  `statut` enum('en_attente','partielle','payee','annulee') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `date_emission` date NOT NULL,
  `date_echeance` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `eleve_id` (`eleve_id`),
  KEY `annee_scolaire_id` (`annee_scolaire_id`),
  KEY `idx_factures_school_id` (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `facture_lignes`
--

CREATE TABLE IF NOT EXISTS `facture_lignes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `facture_id` int(11) NOT NULL,
  `type_frais_id` int(11) NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `montant` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `facture_id` (`facture_id`),
  KEY `type_frais_id` (`type_frais_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `filieres`
--

CREATE TABLE IF NOT EXISTS `filieres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=6 ;

--
-- Contenu de la table `filieres`
--

INSERT INTO `filieres` (`id`, `code`, `libelle`, `description`, `created_at`) VALUES
(1, 'GENERAL', 'Général', 'Section générale', '2025-12-03 13:54:20'),
(2, 'LITTERAIRE', 'Littéraire', 'Section littéraire', '2025-12-03 13:54:20'),
(3, 'SCIENTIFIQUE', 'Scientifique', 'Section scientifique', '2025-12-03 13:54:20'),
(4, 'COMMERCIALE', 'Commerciale', 'Section commerciale et gestion', '2025-12-03 13:54:20'),
(5, 'TECHNIQUE', 'Technique', 'Section technique', '2025-12-03 13:54:20');

-- --------------------------------------------------------

--
-- Structure de la table `frais_scolaires`
--

CREATE TABLE IF NOT EXISTS `frais_scolaires` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_frais_id` int(11) NOT NULL,
  `classe_id` int(11) DEFAULT NULL,
  `niveau_id` int(11) DEFAULT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `montant` decimal(15,2) NOT NULL,
  `devise` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'FC',
  `echeances` int(11) DEFAULT '1',
  `date_limite` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `type_frais_id` (`type_frais_id`),
  KEY `classe_id` (`classe_id`),
  KEY `niveau_id` (`niveau_id`),
  KEY `annee_scolaire_id` (`annee_scolaire_id`),
  KEY `idx_frais_scolaires_school_id` (`school_id`),
  KEY `idx_frais_scolaires_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2 ;

--
-- Contenu de la table `frais_scolaires`
--

INSERT INTO `frais_scolaires` (`id`, `type_frais_id`, `classe_id`, `niveau_id`, `annee_scolaire_id`, `montant`, `devise`, `echeances`, `date_limite`, `created_at`, `school_id`) VALUES
(1, 2, NULL, NULL, 1, '250000.00', 'FC', 1, NULL, '2026-03-03 15:01:15', 1);

-- --------------------------------------------------------

--
-- Structure de la table `historique_connexions`
--

CREATE TABLE IF NOT EXISTS `historique_connexions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int(11) NOT NULL,
  `date_connexion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `localisation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `succes` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `utilisateur_id` (`utilisateur_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=171 ;

--
-- Contenu de la table `historique_connexions`
--

INSERT INTO `historique_connexions` (`id`, `utilisateur_id`, `date_connexion`, `ip_address`, `user_agent`, `localisation`, `succes`) VALUES
(1, 1, '2025-12-03 14:18:10', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7019', NULL, 1),
(2, 1, '2025-12-03 14:19:19', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0', NULL, 1),
(3, 1, '2025-12-03 14:23:32', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0', NULL, 1),
(4, 1, '2025-12-03 14:37:51', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0', NULL, 1),
(5, 1, '2025-12-03 14:38:22', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0', NULL, 1),
(6, 1, '2025-12-03 14:39:13', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0', NULL, 1),
(7, 1, '2025-12-03 14:39:42', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0', NULL, 1),
(8, 1, '2025-12-03 14:49:03', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7019', NULL, 1),
(9, 1, '2025-12-03 14:49:42', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0', NULL, 1),
(10, 1, '2025-12-03 15:01:33', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7019', NULL, 1),
(11, 1, '2025-12-03 15:01:46', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7019', NULL, 1),
(12, 1, '2025-12-03 15:02:29', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0', NULL, 1),
(13, 1, '2025-12-04 10:21:20', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(14, 1, '2025-12-05 07:57:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(15, 1, '2025-12-05 08:10:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(16, 1, '2025-12-05 16:04:13', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(17, 1, '2025-12-05 16:17:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(18, 1, '2025-12-05 16:27:19', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(19, 1, '2025-12-05 16:28:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(20, 1, '2025-12-05 17:26:51', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7309', NULL, 1),
(21, 1, '2025-12-05 17:29:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(22, 1, '2025-12-05 17:31:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(23, 1, '2025-12-05 17:38:11', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(24, 1, '2025-12-05 17:47:30', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7309', NULL, 1),
(25, 1, '2025-12-05 17:48:03', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7309', NULL, 1),
(26, 1, '2025-12-05 17:49:38', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7309', NULL, 1),
(27, 1, '2025-12-05 17:49:52', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7309', NULL, 1),
(28, 1, '2025-12-05 17:54:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(29, 1, '2025-12-05 17:56:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(31, 1, '2025-12-05 18:24:20', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(32, 1, '2025-12-05 19:02:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(33, 1, '2025-12-05 19:08:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(34, 1, '2025-12-05 19:09:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(35, 1, '2025-12-05 19:23:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(36, 1, '2025-12-05 19:38:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(37, 1, '2025-12-05 19:39:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(38, 1, '2025-12-05 19:39:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(39, 1, '2025-12-05 20:06:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(40, 1, '2025-12-05 20:09:13', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(41, 1, '2025-12-05 20:39:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(42, 1, '2025-12-05 20:40:11', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(43, 1, '2025-12-05 20:42:36', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(44, 1, '2025-12-05 20:42:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(45, 1, '2025-12-05 20:43:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(46, 4, '2025-12-05 20:45:12', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(47, 1, '2025-12-05 20:45:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(48, 4, '2025-12-05 20:45:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(49, 1, '2025-12-05 20:46:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(50, 4, '2025-12-05 20:46:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 1),
(51, 1, '2026-01-10 13:55:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', NULL, 1),
(52, 1, '2026-01-10 13:57:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', NULL, 1),
(53, 1, '2026-01-10 14:04:19', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', NULL, 1),
(54, 5, '2026-01-10 14:07:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', NULL, 1),
(55, 1, '2026-01-10 14:18:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', NULL, 1),
(56, 1, '2026-02-27 06:57:14', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(57, 4, '2026-02-27 07:00:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(58, 1, '2026-02-27 07:13:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(59, 1, '2026-02-27 07:15:44', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(60, 1, '2026-02-27 07:28:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(61, 1, '2026-02-27 07:35:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(62, 1, '2026-02-27 19:39:17', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(63, 1, '2026-02-27 19:42:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(64, 1, '2026-02-27 19:53:32', '::ffff:127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1', NULL, 1),
(65, 1, '2026-02-27 20:16:00', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(66, 1, '2026-02-27 20:17:28', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(67, 1, '2026-03-02 12:26:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(68, 4, '2026-03-02 12:33:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(69, 1, '2026-03-02 13:02:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(70, 1, '2026-03-02 13:19:53', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7920', NULL, 1),
(71, 1, '2026-03-02 13:22:03', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(72, 1, '2026-03-02 13:24:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(73, 1, '2026-03-02 14:01:55', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7920', NULL, 1),
(74, 1, '2026-03-02 15:49:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(75, 1, '2026-03-02 15:50:15', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(76, 1, '2026-03-02 15:52:34', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7920', NULL, 1),
(77, 1, '2026-03-02 15:53:07', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7920', NULL, 1),
(78, 1, '2026-03-02 15:55:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(79, 1, '2026-03-02 16:01:59', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7920', NULL, 1),
(80, 1, '2026-03-02 16:02:27', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7920', NULL, 1),
(81, 1, '2026-03-02 16:29:04', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7920', NULL, 1),
(82, 1, '2026-03-02 16:29:24', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7920', NULL, 1),
(83, 1, '2026-03-03 08:28:50', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(84, 5, '2026-03-03 09:36:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(85, 1, '2026-03-03 09:37:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(86, 1, '2026-03-03 09:39:00', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(87, 1, '2026-03-03 12:02:16', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7920', NULL, 1),
(88, 1, '2026-03-03 12:03:12', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.7920', NULL, 1),
(89, 1, '2026-03-03 12:04:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(90, 5, '2026-03-03 12:07:57', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(91, 4, '2026-03-03 12:08:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(92, 1, '2026-03-03 12:11:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(93, 1, '2026-03-03 12:11:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(94, 1, '2026-03-03 12:14:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(95, 1, '2026-03-03 12:16:48', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(96, 1, '2026-03-03 12:31:09', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(97, 4, '2026-03-03 13:25:57', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(98, 1, '2026-03-03 13:26:15', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(99, 1, '2026-03-03 13:30:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(100, 1, '2026-03-03 13:32:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(101, 1, '2026-03-03 13:32:14', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(102, 1, '2026-03-03 13:33:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(103, 1, '2026-03-03 13:39:56', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(104, 1, '2026-03-03 13:45:11', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(105, 1, '2026-03-03 13:55:09', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(106, 1, '2026-03-03 13:57:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(107, 1, '2026-03-03 13:57:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(108, 1, '2026-03-03 13:59:48', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(109, 1, '2026-03-03 14:07:34', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(110, 1, '2026-03-03 15:05:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(111, 1, '2026-03-03 15:14:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(112, 4, '2026-03-03 15:22:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(113, 1, '2026-03-03 15:28:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(114, 1, '2026-03-03 15:30:00', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(115, 1, '2026-03-03 15:33:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(116, 4, '2026-03-03 15:33:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(117, 4, '2026-03-04 11:41:13', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(118, 1, '2026-03-04 11:41:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(119, 4, '2026-03-04 12:39:09', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(120, 1, '2026-03-04 12:41:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(122, 1, '2026-03-04 13:56:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(124, 1, '2026-03-04 13:57:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(125, 7, '2026-03-04 14:00:07', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(126, 1, '2026-03-04 14:05:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(127, 1, '2026-03-04 14:06:28', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(128, 7, '2026-03-04 14:12:54', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(129, 1, '2026-03-04 14:13:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(130, 7, '2026-03-04 14:13:50', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(131, 1, '2026-03-04 14:14:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(132, 1, '2026-03-04 14:14:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(133, 1, '2026-03-04 14:15:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(134, 1, '2026-03-04 14:29:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(135, 7, '2026-03-04 14:30:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(136, 1, '2026-03-04 14:32:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(137, 1, '2026-03-04 14:33:57', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(138, 7, '2026-03-04 14:35:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(139, 1, '2026-03-04 14:37:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(140, 7, '2026-03-04 14:37:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(141, 1, '2026-03-04 15:12:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(142, 7, '2026-03-04 15:13:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(143, 1, '2026-03-04 15:14:57', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(144, 1, '2026-03-04 15:15:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(145, 1, '2026-03-04 15:15:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(146, 7, '2026-03-04 15:18:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(147, 7, '2026-03-04 15:25:51', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 1),
(148, 7, '2026-03-04 15:38:07', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(149, 1, '2026-03-04 15:38:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(150, 1, '2026-03-04 15:38:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(151, 1, '2026-03-04 15:39:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(152, 1, '2026-03-04 15:40:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(153, 1, '2026-03-04 15:42:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(154, 1, '2026-03-04 15:46:25', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(155, 7, '2026-03-04 15:46:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(156, 1, '2026-03-04 15:46:48', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(157, 7, '2026-03-04 15:47:34', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(158, 1, '2026-03-04 15:47:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(159, 7, '2026-03-04 15:48:48', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(160, 1, '2026-03-04 15:49:07', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(161, 7, '2026-03-04 15:49:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(162, 1, '2026-03-04 15:50:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(163, 1, '2026-03-04 15:51:19', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(164, 7, '2026-03-04 15:51:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(165, 1, '2026-03-04 15:52:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(166, 7, '2026-03-04 15:52:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(167, 1, '2026-03-04 15:53:36', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(168, 1, '2026-03-05 17:05:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(169, 1, '2026-03-05 17:14:09', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1),
(170, 1, '2026-03-05 17:16:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `inscriptions`
--

CREATE TABLE IF NOT EXISTS `inscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eleve_id` int(11) DEFAULT NULL,
  `classe_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `type_inscription` enum('nouvelle','reinscription','transfert') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_inscription` date NOT NULL,
  `montant_inscription` decimal(15,2) NOT NULL,
  `statut` enum('en_attente','validee','annulee') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `observations` text COLLATE utf8mb4_unicode_ci,
  `extrait_naissance` tinyint(1) DEFAULT '0',
  `photos_identite` tinyint(1) DEFAULT '0',
  `bulletin_anterieur` tinyint(1) DEFAULT '0',
  `attestation_reussite` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  UNIQUE KEY `unique_eleve_annee` (`eleve_id`,`annee_scolaire_id`),
  KEY `classe_id` (`classe_id`),
  KEY `annee_scolaire_id` (`annee_scolaire_id`),
  KEY `idx_inscriptions_school_id` (`school_id`),
  KEY `idx_inscriptions_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=20 ;

--
-- Contenu de la table `inscriptions`
--

INSERT INTO `inscriptions` (`id`, `numero`, `eleve_id`, `classe_id`, `annee_scolaire_id`, `type_inscription`, `date_inscription`, `montant_inscription`, `statut`, `observations`, `extrait_naissance`, `photos_identite`, `bulletin_anterieur`, `attestation_reussite`, `created_at`, `updated_at`, `school_id`) VALUES
(17, 'INS2600002', 15, 40, 1, 'nouvelle', '2026-03-02', '0.00', 'validee', NULL, 0, 0, 0, 0, '2026-03-02 16:38:57', '2026-03-03 12:24:40', 3),
(19, 'INS2600004', 16, 40, 1, 'nouvelle', '2026-03-03', '0.00', 'validee', NULL, 0, 0, 0, 0, '2026-03-03 08:49:23', '2026-03-03 12:24:40', 3);

-- --------------------------------------------------------

--
-- Structure de la table `logs_systeme`
--

CREATE TABLE IF NOT EXISTS `logs_systeme` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int(11) DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `utilisateur_id` (`utilisateur_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `matieres`
--

CREATE TABLE IF NOT EXISTS `matieres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `coefficient` decimal(3,1) DEFAULT '1.0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_matieres_school_id` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=14 ;

--
-- Contenu de la table `matieres`
--

INSERT INTO `matieres` (`id`, `code`, `libelle`, `description`, `coefficient`, `created_at`, `updated_at`, `school_id`) VALUES
(1, 'FR', 'Français', NULL, '2.0', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(2, 'MATH', 'Mathématiques', NULL, '2.0', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(3, 'ANG', 'Anglais', NULL, '1.5', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(4, 'SVT', 'Sciences de la Vie et de la Terre', NULL, '1.5', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(5, 'PHYS', 'Physique', NULL, '1.5', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(6, 'CHIM', 'Chimie', NULL, '1.5', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(7, 'HIST', 'Histoire', NULL, '1.0', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(8, 'GEO', 'Géographie', NULL, '1.0', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(9, 'ECM', 'Éducation Civique et Morale', NULL, '1.0', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(10, 'EPS', 'Éducation Physique et Sportive', NULL, '1.0', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(11, 'INFO', 'Informatique', NULL, '1.0', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(12, 'ARTS', 'Arts Plastiques', NULL, '1.0', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3),
(13, 'MUS', 'Musique', NULL, '1.0', '2026-03-02 13:17:34', '2026-03-03 12:25:44', 3);

-- --------------------------------------------------------

--
-- Structure de la table `messages_contact`
--

CREATE TABLE IF NOT EXISTS `messages_contact` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sujet` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `lu` tinyint(1) DEFAULT '0',
  `repondu` tinyint(1) DEFAULT '0',
  `reponse` text COLLATE utf8mb4_unicode_ci,
  `repondu_par` int(11) DEFAULT NULL,
  `date_reponse` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `repondu_par` (`repondu_par`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2 ;

--
-- Contenu de la table `messages_contact`
--

INSERT INTO `messages_contact` (`id`, `nom`, `email`, `telephone`, `sujet`, `message`, `lu`, `repondu`, `reponse`, `repondu_par`, `date_reponse`, `created_at`) VALUES
(1, 'BANGOMBE JEAN MARIE', 'bnga@gmail.com', '082773T2772', 'Message depuis le site vitrine', 'Merci pour la plateforme.', 1, 0, NULL, NULL, NULL, '2026-03-03 15:29:50');

-- --------------------------------------------------------

--
-- Structure de la table `mouvements_caisse`
--

CREATE TABLE IF NOT EXISTS `mouvements_caisse` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('entree','sortie') COLLATE utf8mb4_unicode_ci NOT NULL,
  `montant` decimal(15,2) NOT NULL,
  `devise` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'FC',
  `libelle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_mouvement` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `solde_apres` decimal(15,2) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_mouvements_caisse_school_id` (`school_id`),
  KEY `idx_mouvements_caisse_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=6 ;

--
-- Contenu de la table `mouvements_caisse`
--

INSERT INTO `mouvements_caisse` (`id`, `type`, `montant`, `devise`, `libelle`, `reference_id`, `reference_type`, `date_mouvement`, `solde_apres`, `created_by`, `school_id`) VALUES
(1, 'entree', '50000.00', 'FC', 'Paiement REC26000001', 1, 'paiement', '2026-03-02 13:21:47', NULL, 1, 3),
(2, 'sortie', '1997374.00', 'FC', 'Salaire 3/2026', 1, 'salaire', '2026-03-03 14:56:36', NULL, 1, 1),
(3, 'entree', '20000.00', 'FC', 'scolarité premiere tranche', NULL, 'paiements', '2026-03-03 14:57:51', '-1927374.00', 1, 1),
(4, 'sortie', '20000.00', 'FC', 'Facture electricité', NULL, 'depense', '2026-03-03 14:58:43', '-1947374.00', 1, 1),
(5, 'sortie', '20000.00', 'FC', 'Facture electricité', NULL, 'depense', '2026-03-03 14:59:20', '-1967374.00', 1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `niveaux`
--

CREATE TABLE IF NOT EXISTS `niveaux` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycle_id` int(11) NOT NULL,
  `ordre` int(11) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `cycle_id` (`cycle_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=16 ;

--
-- Contenu de la table `niveaux`
--

INSERT INTO `niveaux` (`id`, `code`, `libelle`, `cycle_id`, `ordre`, `created_at`) VALUES
(1, 'MAT1', 'Petite Section', 1, 1, '2026-03-02 13:17:34'),
(2, 'MAT2', 'Moyenne Section', 1, 2, '2026-03-02 13:17:34'),
(3, 'MAT3', 'Grande Section', 1, 3, '2026-03-02 13:17:34'),
(4, '1ERE', '1ère Primaire', 2, 1, '2026-03-02 13:17:34'),
(5, '2EME', '2ème Primaire', 2, 2, '2026-03-02 13:17:34'),
(6, '3EME', '3ème Primaire', 2, 3, '2026-03-02 13:17:34'),
(7, '4EME', '4ème Primaire', 2, 4, '2026-03-02 13:17:34'),
(8, '5EME', '5ème Primaire', 2, 5, '2026-03-02 13:17:34'),
(9, '6EME', '6ème Primaire', 2, 6, '2026-03-02 13:17:34'),
(10, '7EME', '7ème Secondaire', 3, 1, '2026-03-02 13:17:34'),
(11, '8EME', '8ème Secondaire', 3, 2, '2026-03-02 13:17:34'),
(12, '1ERE_SEC', '1ère Secondaire', 3, 3, '2026-03-02 13:17:34'),
(13, '2EME_SEC', '2ème Secondaire', 3, 4, '2026-03-02 13:17:34'),
(14, '3EME_SEC', '3ème Secondaire', 3, 5, '2026-03-02 13:17:34'),
(15, '4EME_SEC', '4ème Secondaire', 3, 6, '2026-03-02 13:17:34');

-- --------------------------------------------------------

--
-- Structure de la table `notes`
--

CREATE TABLE IF NOT EXISTS `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `eleve_id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `periode_id` int(11) NOT NULL,
  `type_evaluation_id` int(11) NOT NULL,
  `note` decimal(5,2) NOT NULL,
  `note_max` decimal(5,2) DEFAULT '20.00',
  `date_evaluation` date DEFAULT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `enseignant_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `eleve_id` (`eleve_id`),
  KEY `matiere_id` (`matiere_id`),
  KEY `classe_id` (`classe_id`),
  KEY `periode_id` (`periode_id`),
  KEY `type_evaluation_id` (`type_evaluation_id`),
  KEY `enseignant_id` (`enseignant_id`),
  KEY `idx_notes_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=19 ;

--
-- Contenu de la table `notes`
--

INSERT INTO `notes` (`id`, `eleve_id`, `matiere_id`, `classe_id`, `periode_id`, `type_evaluation_id`, `note`, `note_max`, `date_evaluation`, `commentaire`, `enseignant_id`, `created_at`, `updated_at`, `school_id`) VALUES
(1, 15, 7, 40, 1, 1, '13.00', '20.00', '2026-03-02', NULL, 1, '2026-03-02 16:40:17', '2026-03-03 12:24:40', 3),
(2, 15, 5, 40, 1, 3, '12.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:32:35', '2026-03-03 12:24:40', 3),
(3, 15, 2, 40, 1, 2, '12.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:33:05', '2026-03-03 12:24:40', 3),
(4, 15, 11, 40, 1, 3, '8.00', '10.00', '2026-03-03', NULL, 1, '2026-03-03 08:34:45', '2026-03-03 12:24:40', 3),
(5, 15, 13, 40, 1, 3, '15.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:35:43', '2026-03-03 12:24:40', 3),
(6, 15, 3, 40, 1, 3, '13.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:50:53', '2026-03-03 12:24:40', 3),
(7, 16, 3, 40, 1, 3, '10.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:50:53', '2026-03-03 12:24:40', 3),
(8, 16, 7, 40, 1, 2, '4.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:52:15', '2026-03-03 12:24:40', 3),
(9, 16, 11, 40, 1, 2, '5.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:52:15', '2026-03-03 12:24:40', 3),
(10, 16, 2, 40, 1, 2, '14.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:52:15', '2026-03-03 12:24:40', 3),
(11, 16, 13, 40, 1, 2, '8.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:52:15', '2026-03-03 12:24:40', 3),
(12, 16, 5, 40, 1, 2, '6.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:52:15', '2026-03-03 12:24:40', 3),
(13, 16, 7, 40, 1, 2, '0.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:54:20', '2026-03-03 12:24:40', 3),
(14, 16, 11, 40, 1, 2, '0.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:54:20', '2026-03-03 12:24:40', 3),
(15, 16, 2, 40, 1, 2, '0.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:54:20', '2026-03-03 12:24:40', 3),
(16, 16, 13, 40, 1, 2, '0.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:54:20', '2026-03-03 12:24:40', 3),
(17, 16, 5, 40, 1, 2, '0.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:54:20', '2026-03-03 12:24:40', 3),
(18, 16, 3, 40, 1, 2, '14.00', '20.00', '2026-03-03', NULL, 1, '2026-03-03 08:54:54', '2026-03-03 12:24:40', 3);

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int(11) NOT NULL,
  `titre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('info','success','warning','error') COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `lue` tinyint(1) DEFAULT '0',
  `lien` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateur_id` (`utilisateur_id`),
  KEY `idx_notifications_school_id` (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `paiements`
--

CREATE TABLE IF NOT EXISTS `paiements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero_recu` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `inscription_id` int(11) DEFAULT NULL,
  `type_frais_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `montant` decimal(15,2) NOT NULL,
  `devise` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'FC',
  `mode_paiement` enum('especes','mobile_money','virement','cheque') COLLATE utf8mb4_unicode_ci DEFAULT 'especes',
  `reference_paiement` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_paiement` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` enum('en_attente','valide','annule') COLLATE utf8mb4_unicode_ci DEFAULT 'valide',
  `observations` text COLLATE utf8mb4_unicode_ci,
  `recu_par` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_recu` (`numero_recu`),
  KEY `eleve_id` (`eleve_id`),
  KEY `inscription_id` (`inscription_id`),
  KEY `type_frais_id` (`type_frais_id`),
  KEY `annee_scolaire_id` (`annee_scolaire_id`),
  KEY `recu_par` (`recu_par`),
  KEY `idx_paiements_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2 ;

--
-- Contenu de la table `paiements`
--

INSERT INTO `paiements` (`id`, `numero_recu`, `eleve_id`, `inscription_id`, `type_frais_id`, `annee_scolaire_id`, `montant`, `devise`, `mode_paiement`, `reference_paiement`, `date_paiement`, `statut`, `observations`, `recu_par`, `created_at`, `school_id`) VALUES
(1, 'REC26000001', 15, NULL, 1, 1, '99999.00', 'FC', 'especes', NULL, '2026-03-03 15:01:43', 'valide', NULL, 1, '2026-03-03 15:01:43', 1);

-- --------------------------------------------------------

--
-- Structure de la table `periodes`
--

CREATE TABLE IF NOT EXISTS `periodes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `ordre` int(11) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_periode` (`code`,`annee_scolaire_id`),
  KEY `annee_scolaire_id` (`annee_scolaire_id`),
  KEY `idx_periodes_school_id` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=4 ;

--
-- Contenu de la table `periodes`
--

INSERT INTO `periodes` (`id`, `code`, `libelle`, `annee_scolaire_id`, `date_debut`, `date_fin`, `ordre`, `created_at`, `school_id`) VALUES
(1, 'T1', '1er Trimestre', 1, '2024-09-02', '2024-12-20', 1, '2025-12-03 13:54:20', 1),
(2, 'T2', '2ème Trimestre', 1, '2025-01-06', '2025-03-28', 2, '2025-12-03 13:54:20', 1),
(3, 'T3', '3ème Trimestre', 1, '2025-04-07', '2025-06-30', 3, '2025-12-03 13:54:20', 1);

-- --------------------------------------------------------

--
-- Structure de la table `permissions`
--

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` enum('create','read','update','delete') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_permission` (`module`,`action`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=89 ;

--
-- Contenu de la table `permissions`
--

INSERT INTO `permissions` (`id`, `module`, `action`, `description`, `created_at`) VALUES
(1, 'dashboard', 'create', 'create sur dashboard', '2025-12-03 13:54:20'),
(2, 'dashboard', 'read', 'read sur dashboard', '2025-12-03 13:54:20'),
(3, 'dashboard', 'update', 'update sur dashboard', '2025-12-03 13:54:20'),
(4, 'dashboard', 'delete', 'delete sur dashboard', '2025-12-03 13:54:20'),
(5, 'eleves', 'create', 'create sur eleves', '2025-12-03 13:54:20'),
(6, 'eleves', 'read', 'read sur eleves', '2025-12-03 13:54:20'),
(7, 'eleves', 'update', 'update sur eleves', '2025-12-03 13:54:20'),
(8, 'eleves', 'delete', 'delete sur eleves', '2025-12-03 13:54:20'),
(9, 'inscriptions', 'create', 'create sur inscriptions', '2025-12-03 13:54:20'),
(10, 'inscriptions', 'read', 'read sur inscriptions', '2025-12-03 13:54:20'),
(11, 'inscriptions', 'update', 'update sur inscriptions', '2025-12-03 13:54:20'),
(12, 'inscriptions', 'delete', 'delete sur inscriptions', '2025-12-03 13:54:20'),
(13, 'classes', 'create', 'create sur classes', '2025-12-03 13:54:20'),
(14, 'classes', 'read', 'read sur classes', '2025-12-03 13:54:20'),
(15, 'classes', 'update', 'update sur classes', '2025-12-03 13:54:20'),
(16, 'classes', 'delete', 'delete sur classes', '2025-12-03 13:54:20'),
(17, 'matieres', 'create', 'create sur matieres', '2025-12-03 13:54:20'),
(18, 'matieres', 'read', 'read sur matieres', '2025-12-03 13:54:20'),
(19, 'matieres', 'update', 'update sur matieres', '2025-12-03 13:54:20'),
(20, 'matieres', 'delete', 'delete sur matieres', '2025-12-03 13:54:20'),
(21, 'notes', 'create', 'create sur notes', '2025-12-03 13:54:20'),
(22, 'notes', 'read', 'read sur notes', '2025-12-03 13:54:20'),
(23, 'notes', 'update', 'update sur notes', '2025-12-03 13:54:20'),
(24, 'notes', 'delete', 'delete sur notes', '2025-12-03 13:54:20'),
(25, 'bulletins', 'create', 'create sur bulletins', '2025-12-03 13:54:20'),
(26, 'bulletins', 'read', 'read sur bulletins', '2025-12-03 13:54:20'),
(27, 'bulletins', 'update', 'update sur bulletins', '2025-12-03 13:54:20'),
(28, 'bulletins', 'delete', 'delete sur bulletins', '2025-12-03 13:54:20'),
(29, 'resultats', 'create', 'create sur resultats', '2025-12-03 13:54:20'),
(30, 'resultats', 'read', 'read sur resultats', '2025-12-03 13:54:20'),
(31, 'resultats', 'update', 'update sur resultats', '2025-12-03 13:54:20'),
(32, 'resultats', 'delete', 'delete sur resultats', '2025-12-03 13:54:20'),
(33, 'attestations', 'create', 'create sur attestations', '2025-12-03 13:54:20'),
(34, 'attestations', 'read', 'read sur attestations', '2025-12-03 13:54:20'),
(35, 'attestations', 'update', 'update sur attestations', '2025-12-03 13:54:20'),
(36, 'attestations', 'delete', 'delete sur attestations', '2025-12-03 13:54:20'),
(37, 'emploi_temps', 'create', 'create sur emploi_temps', '2025-12-03 13:54:20'),
(38, 'emploi_temps', 'read', 'read sur emploi_temps', '2025-12-03 13:54:20'),
(39, 'emploi_temps', 'update', 'update sur emploi_temps', '2025-12-03 13:54:20'),
(40, 'emploi_temps', 'delete', 'delete sur emploi_temps', '2025-12-03 13:54:20'),
(41, 'paiements', 'create', 'create sur paiements', '2025-12-03 13:54:20'),
(42, 'paiements', 'read', 'read sur paiements', '2025-12-03 13:54:20'),
(43, 'paiements', 'update', 'update sur paiements', '2025-12-03 13:54:20'),
(44, 'paiements', 'delete', 'delete sur paiements', '2025-12-03 13:54:20'),
(45, 'comptabilite', 'create', 'create sur comptabilite', '2025-12-03 13:54:20'),
(46, 'comptabilite', 'read', 'read sur comptabilite', '2025-12-03 13:54:20'),
(47, 'comptabilite', 'update', 'update sur comptabilite', '2025-12-03 13:54:20'),
(48, 'comptabilite', 'delete', 'delete sur comptabilite', '2025-12-03 13:54:20'),
(49, 'depenses', 'create', 'create sur depenses', '2025-12-03 13:54:20'),
(50, 'depenses', 'read', 'read sur depenses', '2025-12-03 13:54:20'),
(51, 'depenses', 'update', 'update sur depenses', '2025-12-03 13:54:20'),
(52, 'depenses', 'delete', 'delete sur depenses', '2025-12-03 13:54:20'),
(53, 'caisse', 'create', 'create sur caisse', '2025-12-03 13:54:20'),
(54, 'caisse', 'read', 'read sur caisse', '2025-12-03 13:54:20'),
(55, 'caisse', 'update', 'update sur caisse', '2025-12-03 13:54:20'),
(56, 'caisse', 'delete', 'delete sur caisse', '2025-12-03 13:54:20'),
(57, 'enseignants', 'create', 'create sur enseignants', '2025-12-03 13:54:20'),
(58, 'enseignants', 'read', 'read sur enseignants', '2025-12-03 13:54:20'),
(59, 'enseignants', 'update', 'update sur enseignants', '2025-12-03 13:54:20'),
(60, 'enseignants', 'delete', 'delete sur enseignants', '2025-12-03 13:54:20'),
(61, 'personnel', 'create', 'create sur personnel', '2025-12-03 13:54:20'),
(62, 'personnel', 'read', 'read sur personnel', '2025-12-03 13:54:20'),
(63, 'personnel', 'update', 'update sur personnel', '2025-12-03 13:54:20'),
(64, 'personnel', 'delete', 'delete sur personnel', '2025-12-03 13:54:20'),
(65, 'presences', 'create', 'create sur presences', '2025-12-03 13:54:20'),
(66, 'presences', 'read', 'read sur presences', '2025-12-03 13:54:20'),
(67, 'presences', 'update', 'update sur presences', '2025-12-03 13:54:20'),
(68, 'presences', 'delete', 'delete sur presences', '2025-12-03 13:54:20'),
(69, 'conges', 'create', 'create sur conges', '2025-12-03 13:54:20'),
(70, 'conges', 'read', 'read sur conges', '2025-12-03 13:54:20'),
(71, 'conges', 'update', 'update sur conges', '2025-12-03 13:54:20'),
(72, 'conges', 'delete', 'delete sur conges', '2025-12-03 13:54:20'),
(73, 'salaires', 'create', 'create sur salaires', '2025-12-03 13:54:20'),
(74, 'salaires', 'read', 'read sur salaires', '2025-12-03 13:54:20'),
(75, 'salaires', 'update', 'update sur salaires', '2025-12-03 13:54:20'),
(76, 'salaires', 'delete', 'delete sur salaires', '2025-12-03 13:54:20'),
(77, 'contrats', 'create', 'create sur contrats', '2025-12-03 13:54:20'),
(78, 'contrats', 'read', 'read sur contrats', '2025-12-03 13:54:20'),
(79, 'contrats', 'update', 'update sur contrats', '2025-12-03 13:54:20'),
(80, 'contrats', 'delete', 'delete sur contrats', '2025-12-03 13:54:20'),
(81, 'configuration', 'create', 'create sur configuration', '2025-12-03 13:54:20'),
(82, 'configuration', 'read', 'read sur configuration', '2025-12-03 13:54:20'),
(83, 'configuration', 'update', 'update sur configuration', '2025-12-03 13:54:20'),
(84, 'configuration', 'delete', 'delete sur configuration', '2025-12-03 13:54:20'),
(85, 'utilisateurs', 'create', 'create sur utilisateurs', '2025-12-03 13:54:20'),
(86, 'utilisateurs', 'read', 'read sur utilisateurs', '2025-12-03 13:54:20'),
(87, 'utilisateurs', 'update', 'update sur utilisateurs', '2025-12-03 13:54:20'),
(88, 'utilisateurs', 'delete', 'delete sur utilisateurs', '2025-12-03 13:54:20');

-- --------------------------------------------------------

--
-- Structure de la table `personnel`
--

CREATE TABLE IF NOT EXISTS `personnel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `matricule` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `utilisateur_id` int(11) DEFAULT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postnom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sexe` enum('M','F') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `adresse` text COLLATE utf8mb4_unicode_ci,
  `telephone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fonction` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `departement` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_embauche` date DEFAULT NULL,
  `type_contrat` enum('CDI','CDD','Stage') COLLATE utf8mb4_unicode_ci DEFAULT 'CDI',
  `salaire_base` decimal(15,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricule` (`matricule`),
  KEY `utilisateur_id` (`utilisateur_id`),
  KEY `idx_personnel_school_id` (`school_id`),
  KEY `idx_personnel_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2 ;

--
-- Contenu de la table `personnel`
--

INSERT INTO `personnel` (`id`, `matricule`, `utilisateur_id`, `nom`, `postnom`, `prenom`, `sexe`, `date_naissance`, `adresse`, `telephone`, `email`, `photo`, `fonction`, `departement`, `date_embauche`, `type_contrat`, `salaire_base`, `is_active`, `created_at`, `updated_at`, `school_id`) VALUES
(1, 'PER260001', NULL, 'KOLA', NULL, 'WASIA', 'M', NULL, NULL, '93939393', 'wasia@gmail.com', NULL, 'Gardien', 'Sécurité', '2026-03-03', 'CDI', '200000.00', 1, '2026-03-03 14:26:43', '2026-03-03 14:26:43', 3);

-- --------------------------------------------------------

--
-- Structure de la table `presences`
--

CREATE TABLE IF NOT EXISTS `presences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employe_type` enum('enseignant','personnel') COLLATE utf8mb4_unicode_ci NOT NULL,
  `employe_id` int(11) NOT NULL,
  `date_presence` date NOT NULL,
  `heure_arrivee` time DEFAULT NULL,
  `heure_depart` time DEFAULT NULL,
  `statut` enum('present','absent','retard','conge','mission') COLLATE utf8mb4_unicode_ci DEFAULT 'present',
  `observations` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_presence` (`employe_type`,`employe_id`,`date_presence`),
  KEY `idx_presences_school_id` (`school_id`),
  KEY `idx_presences_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=4 ;

--
-- Contenu de la table `presences`
--

INSERT INTO `presences` (`id`, `employe_type`, `employe_id`, `date_presence`, `heure_arrivee`, `heure_depart`, `statut`, `observations`, `created_at`, `school_id`) VALUES
(1, 'enseignant', 2, '2026-03-03', NULL, NULL, 'present', NULL, '2026-03-03 14:41:39', 1),
(2, 'enseignant', 1, '2026-03-03', NULL, NULL, 'absent', NULL, '2026-03-03 14:41:39', 1),
(3, 'personnel', 1, '2026-03-03', NULL, NULL, 'retard', NULL, '2026-03-03 14:41:39', 1);

-- --------------------------------------------------------

--
-- Structure de la table `resultats_deliberation`
--

CREATE TABLE IF NOT EXISTS `resultats_deliberation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deliberation_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `moyenne` decimal(5,2) DEFAULT NULL,
  `decision` enum('admis','ajourne','reprise','exclu') COLLATE utf8mb4_unicode_ci NOT NULL,
  `mention` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observations` text COLLATE utf8mb4_unicode_ci,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `deliberation_id` (`deliberation_id`),
  KEY `eleve_id` (`eleve_id`),
  KEY `idx_resultats_deliberation_school_id` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=5 ;

--
-- Contenu de la table `resultats_deliberation`
--

INSERT INTO `resultats_deliberation` (`id`, `deliberation_id`, `eleve_id`, `moyenne`, `decision`, `mention`, `observations`, `school_id`) VALUES
(3, 2, 15, '13.19', 'admis', 'Assez Bien', NULL, NULL),
(4, 2, 16, '5.63', 'exclu', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `roles`
--

CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=8 ;

--
-- Contenu de la table `roles`
--

INSERT INTO `roles` (`id`, `code`, `libelle`, `description`, `created_at`) VALUES
(1, 'super_admin', 'Super Administrateur', 'Accès complet à tout le système', '2025-12-03 13:54:20'),
(2, 'admin', 'Administrateur', 'Gestion administrative complète', '2025-12-03 13:54:20'),
(3, 'comptable', 'Comptable', 'Gestion financière et comptable', '2025-12-03 13:54:20'),
(4, 'rh', 'Ressources Humaines', 'Gestion du personnel', '2025-12-03 13:54:20'),
(5, 'enseignant', 'Enseignant', 'Gestion pédagogique', '2025-12-03 13:54:20'),
(6, 'parent', 'Parent', 'Consultation et paiements', '2025-12-03 13:54:20'),
(7, 'eleve', 'Élève', 'Consultation uniquement', '2025-12-03 13:54:20');

-- --------------------------------------------------------

--
-- Structure de la table `role_permissions`
--

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Contenu de la table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(2, 1),
(2, 2),
(3, 2),
(4, 2),
(5, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 6),
(3, 6),
(5, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(3, 10),
(5, 10),
(2, 11),
(2, 12),
(2, 13),
(2, 14),
(3, 14),
(5, 14),
(2, 15),
(2, 16),
(2, 17),
(2, 18),
(5, 18),
(2, 19),
(2, 20),
(2, 21),
(5, 21),
(2, 22),
(5, 22),
(2, 23),
(5, 23),
(2, 24),
(2, 25),
(2, 26),
(5, 26),
(2, 27),
(2, 28),
(2, 29),
(2, 30),
(5, 30),
(2, 31),
(2, 32),
(2, 33),
(2, 34),
(2, 35),
(2, 36),
(2, 37),
(2, 38),
(5, 38),
(2, 39),
(2, 40),
(2, 41),
(3, 41),
(2, 42),
(3, 42),
(2, 43),
(3, 43),
(2, 44),
(2, 45),
(3, 45),
(2, 46),
(3, 46),
(2, 47),
(3, 47),
(2, 48),
(3, 48),
(2, 49),
(3, 49),
(2, 50),
(3, 50),
(2, 51),
(3, 51),
(2, 52),
(2, 53),
(3, 53),
(2, 54),
(3, 54),
(2, 55),
(3, 55),
(2, 56),
(2, 57),
(4, 57),
(2, 58),
(4, 58),
(2, 59),
(4, 59),
(2, 60),
(4, 60),
(2, 61),
(4, 61),
(2, 62),
(4, 62),
(2, 63),
(4, 63),
(2, 64),
(4, 64),
(2, 65),
(4, 65),
(2, 66),
(4, 66),
(5, 66),
(2, 67),
(4, 67),
(2, 68),
(2, 69),
(4, 69),
(5, 69),
(2, 70),
(4, 70),
(5, 70),
(2, 71),
(4, 71),
(2, 72),
(2, 73),
(4, 73),
(2, 74),
(3, 74),
(4, 74),
(2, 75),
(4, 75),
(2, 76),
(2, 77),
(4, 77),
(2, 78),
(4, 78),
(2, 79),
(4, 79),
(2, 80),
(2, 81),
(2, 82),
(2, 83),
(2, 84),
(2, 85),
(2, 86),
(2, 87),
(2, 88);

-- --------------------------------------------------------

--
-- Structure de la table `salaires`
--

CREATE TABLE IF NOT EXISTS `salaires` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employe_type` enum('enseignant','personnel') COLLATE utf8mb4_unicode_ci NOT NULL,
  `employe_id` int(11) NOT NULL,
  `mois` int(11) NOT NULL,
  `annee` int(11) NOT NULL,
  `salaire_base` decimal(15,2) NOT NULL,
  `primes` decimal(15,2) DEFAULT '0.00',
  `deductions` decimal(15,2) DEFAULT '0.00',
  `avance` decimal(15,2) DEFAULT '0.00',
  `dette_anterieure` decimal(15,2) DEFAULT '0.00',
  `net_a_payer` decimal(15,2) NOT NULL,
  `devise` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'FC',
  `statut` enum('en_attente','paye','annule') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `date_paiement` date DEFAULT NULL,
  `mode_paiement` enum('especes','mobile_money','virement') COLLATE utf8mb4_unicode_ci DEFAULT 'especes',
  `observations` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_salaire` (`employe_type`,`employe_id`,`mois`,`annee`),
  KEY `idx_salaires_school_id` (`school_id`),
  KEY `idx_salaires_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=3 ;

--
-- Contenu de la table `salaires`
--

INSERT INTO `salaires` (`id`, `employe_type`, `employe_id`, `mois`, `annee`, `salaire_base`, `primes`, `deductions`, `avance`, `dette_anterieure`, `net_a_payer`, `devise`, `statut`, `date_paiement`, `mode_paiement`, `observations`, `created_at`, `school_id`) VALUES
(1, 'personnel', 1, 3, 2026, '200000.00', '0.00', '0.00', '202626.00', '2222222.00', '-424848.00', 'FC', 'paye', '2026-03-03', 'especes', 'Dette', '2026-03-03 14:54:52', 1),
(2, 'enseignant', 2, 3, 2026, '30000.00', '0.00', '0.00', '0.00', '0.00', '30000.00', 'FC', 'en_attente', NULL, 'especes', NULL, '2026-03-03 14:55:55', 1);

-- --------------------------------------------------------

--
-- Structure de la table `salles`
--

CREATE TABLE IF NOT EXISTS `salles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacite` int(11) DEFAULT '50',
  `equipements` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_salles_school_id` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=13 ;

--
-- Contenu de la table `salles`
--

INSERT INTO `salles` (`id`, `code`, `libelle`, `capacite`, `equipements`, `created_at`, `school_id`) VALUES
(1, 'SALLE-1A', '1ere A', 50, NULL, '2026-03-03 13:05:58', 3),
(2, 'SALLE-2A', '2eme A', 50, NULL, '2026-03-03 13:05:58', 3),
(3, 'SALLE-3A', '3eme A', 50, NULL, '2026-03-03 13:05:58', 3),
(4, 'SALLE-4A', '4eme A', 50, NULL, '2026-03-03 13:05:58', 3),
(5, 'SALLE-5A', '5eme A', 50, NULL, '2026-03-03 13:05:58', 3),
(6, 'SALLE-6A', '6eme A', 50, NULL, '2026-03-03 13:05:58', 3),
(7, 'LAB-A1', 'Laboratoire A1', 30, NULL, '2026-03-03 13:05:58', 3),
(8, 'SALLE-INFO', 'Salle Informatique', 25, NULL, '2026-03-03 13:05:58', 3),
(9, 'SALLE-CHIMIE', 'Salle Chimie', 30, NULL, '2026-03-03 13:05:58', 3),
(10, 'SALLE-SPORT', 'Salle de Sport', 100, NULL, '2026-03-03 13:05:58', 3),
(11, 'BIBLIO', 'Bibliotheque', 40, NULL, '2026-03-03 13:05:58', 3),
(12, 'SALLE-1772544508088', 'Kabenette', 50, NULL, '2026-03-03 13:28:28', 3);

-- --------------------------------------------------------

--
-- Structure de la table `schools`
--

CREATE TABLE IF NOT EXISTS `schools` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'FC',
  `whatsapp_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=4 ;

--
-- Contenu de la table `schools`
--

INSERT INTO `schools` (`id`, `code`, `name`, `currency`, `whatsapp_number`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DEFAULT', 'École par défaut', 'FC', NULL, 1, '2025-12-05 17:21:15', '2025-12-05 20:43:01'),
(3, 'INST001', 'COLLEGE DE GBADOLITE', 'FC', '0826277272', 1, '2025-12-05 20:44:19', '2025-12-05 20:46:26');

-- --------------------------------------------------------

--
-- Structure de la table `school_modules`
--

CREATE TABLE IF NOT EXISTS `school_modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_id` int(11) NOT NULL,
  `module_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `config` text COLLATE utf8mb4_unicode_ci,
  `enabled_at` timestamp NULL DEFAULT NULL,
  `disabled_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_school_module` (`school_id`,`module_key`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=75 ;

--
-- Contenu de la table `school_modules`
--

INSERT INTO `school_modules` (`id`, `school_id`, `module_key`, `enabled`, `config`, `enabled_at`, `disabled_at`, `updated_at`, `updated_by`) VALUES
(1, 1, 'dashboard', 1, NULL, '2025-12-05 17:21:38', NULL, '2025-12-05 17:21:38', NULL),
(2, 1, 'students', 1, NULL, '2025-12-05 17:21:38', NULL, '2025-12-05 17:21:38', NULL),
(3, 1, 'classes', 1, NULL, '2025-12-05 17:21:38', NULL, '2025-12-05 17:21:38', NULL),
(4, 1, 'grades', 1, NULL, '2025-12-05 17:21:38', NULL, '2025-12-05 17:21:38', NULL),
(5, 1, 'payments', 1, NULL, '2025-12-05 17:21:38', NULL, '2025-12-05 17:21:38', NULL),
(6, 1, 'teachers', 1, NULL, '2025-12-05 17:21:38', NULL, '2025-12-05 17:21:38', NULL),
(7, 1, 'settings', 1, NULL, '2025-12-05 17:21:38', NULL, '2025-12-05 17:21:38', NULL),
(8, 1, 'profile', 1, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(9, 1, 'subjects', 1, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(10, 1, 'report_cards', 1, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(11, 1, 'schedule', 1, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(12, 1, 'fees', 1, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(13, 1, 'expenses', 1, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(14, 1, 'cashbox', 0, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(15, 1, 'staff', 0, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(16, 1, 'attendance_hr', 0, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(17, 1, 'leaves', 0, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(18, 1, 'payroll', 0, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(19, 1, 'notifications', 1, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(20, 1, 'announcements', 0, NULL, '2025-12-05 17:23:19', NULL, '2025-12-05 17:23:19', NULL),
(54, 3, 'dashboard', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(55, 3, 'students', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(56, 3, 'classes', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(57, 3, 'grades', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(58, 3, 'payments', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(59, 3, 'teachers', 1, NULL, '2025-12-05 20:44:19', NULL, '2026-03-04 15:15:45', 1),
(60, 3, 'settings', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(61, 3, 'profile', 1, NULL, '2025-12-05 20:44:19', NULL, '2026-03-04 15:15:34', 1),
(62, 3, 'subjects', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(63, 3, 'report_cards', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(64, 3, 'schedule', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(65, 3, 'fees', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(66, 3, 'expenses', 1, NULL, '2025-12-05 20:44:19', NULL, '2025-12-05 20:44:19', NULL),
(67, 3, 'cashbox', 1, NULL, NULL, NULL, '2026-03-03 14:07:08', 1),
(68, 3, 'staff', 1, NULL, NULL, NULL, '2026-03-04 15:16:18', 1),
(69, 3, 'attendance_hr', 1, NULL, NULL, NULL, '2026-03-04 15:51:30', 1),
(70, 3, 'leaves', 1, NULL, NULL, NULL, '2026-03-04 15:52:41', 1),
(71, 3, 'payroll', 1, NULL, NULL, NULL, '2026-03-04 15:52:41', 1),
(72, 3, 'notifications', 0, NULL, '2025-12-05 20:44:19', NULL, '2026-03-04 15:15:34', 1),
(73, 3, 'announcements', 0, NULL, NULL, NULL, '2026-03-04 15:15:34', 1),
(74, 3, 'certificates', 1, NULL, '2026-03-03 14:07:09', NULL, '2026-03-03 14:07:08', 1);

-- --------------------------------------------------------

--
-- Structure de la table `types_conges`
--

CREATE TABLE IF NOT EXISTS `types_conges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jours_max` int(11) DEFAULT '30',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=6 ;

--
-- Contenu de la table `types_conges`
--

INSERT INTO `types_conges` (`id`, `code`, `libelle`, `jours_max`, `created_at`) VALUES
(1, 'ANNUEL', 'Congé annuel', 30, '2025-12-03 13:54:20'),
(2, 'MALADIE', 'Congé maladie', 15, '2025-12-03 13:54:20'),
(3, 'MATERNITE', 'Congé maternité', 90, '2025-12-03 13:54:20'),
(4, 'PATERNITE', 'Congé paternité', 10, '2025-12-03 13:54:20'),
(5, 'SPECIAL', 'Congé spécial', 5, '2025-12-03 13:54:20');

-- --------------------------------------------------------

--
-- Structure de la table `types_evaluations`
--

CREATE TABLE IF NOT EXISTS `types_evaluations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coefficient` decimal(3,1) DEFAULT '1.0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=5 ;

--
-- Contenu de la table `types_evaluations`
--

INSERT INTO `types_evaluations` (`id`, `code`, `libelle`, `coefficient`, `created_at`) VALUES
(1, 'INTERRO', 'Interrogation', '1.0', '2025-12-03 13:54:20'),
(2, 'DEVOIR', 'Devoir', '1.5', '2025-12-03 13:54:20'),
(3, 'EXAMEN', 'Examen', '2.0', '2025-12-03 13:54:20'),
(4, 'TP', 'Travail Pratique', '1.0', '2025-12-03 13:54:20');

-- --------------------------------------------------------

--
-- Structure de la table `types_frais`
--

CREATE TABLE IF NOT EXISTS `types_frais` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_types_frais_school_id` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=5 ;

--
-- Contenu de la table `types_frais`
--

INSERT INTO `types_frais` (`id`, `code`, `libelle`, `description`, `created_at`, `school_id`) VALUES
(1, 'INSC', 'Frais d''inscription', 'Frais payés lors de l''inscription', '2026-03-02 13:17:34', 3),
(2, 'SCOL', 'Frais scolaires', 'Minerval mensuel', '2026-03-02 13:17:34', 3),
(3, 'EXAM', 'Frais d''examen', 'Frais pour les examens', '2026-03-02 13:17:34', 3),
(4, 'AUTRE', 'Autres frais', 'Frais divers', '2026-03-02 13:17:34', 3);

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  KEY `idx_utilisateurs_school` (`school_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=8 ;

--
-- Contenu de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `email`, `password`, `nom`, `prenom`, `telephone`, `avatar`, `role_id`, `is_active`, `last_login`, `created_at`, `updated_at`, `school_id`) VALUES
(1, 'admin@sgs-rdc.edu', '$2b$10$ncZk9VZlZyYF/6Yiw1ZJbuVCXPHiZ/4iSCaJZr6wP608l3hWEIiDi', 'Kabila', 'Joseph', NULL, NULL, 1, 1, '2026-03-05 17:16:26', '2025-12-03 13:54:21', '2026-03-05 17:16:26', 1),
(4, 'admin@ecole-rdc.edu', '$2b$10$zoAFMGwlSBOBwNo72Qy/bOZUA7bfhvRZeKYiiTlYAT0wuzKz72AWu', 'Matakoba', 'Leonard', '028292828282', NULL, 2, 1, '2026-03-04 12:39:09', '2025-12-05 20:45:01', '2026-03-04 12:39:09', 3),
(5, 'blaisekule1993@icloud.com', '$2b$10$glxEH0d.8U2tfj5DpMqpCe8vt4cgtTi/.RAl31g28Lxrje8s9tzCO', 'MOGABI', 'Blaise', '222222222222', NULL, 5, 1, '2026-03-03 12:07:57', '2026-01-10 14:07:11', '2026-03-03 12:07:57', 3),
(7, 'koto@gmail.com', '$2b$10$u31St2KdgYl469qPKyjM4upN3799RI9DzuUucNXs0Fn8SdnpMx3Oi', 'KOTO', 'Gedeon', NULL, NULL, 5, 1, '2026-03-04 15:52:52', '2026-03-04 13:59:27', '2026-03-04 15:52:52', 3);

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur_permissions`
--

CREATE TABLE IF NOT EXISTS `utilisateur_permissions` (
  `utilisateur_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`utilisateur_id`,`permission_id`),
  KEY `permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Contenu de la table `utilisateur_permissions`
--

INSERT INTO `utilisateur_permissions` (`utilisateur_id`, `permission_id`) VALUES
(7, 2),
(7, 5),
(7, 6),
(7, 7),
(7, 8),
(7, 9),
(7, 10),
(7, 11),
(7, 12),
(7, 13),
(7, 14),
(7, 15),
(7, 16),
(7, 17),
(7, 18),
(7, 19),
(7, 20),
(7, 21),
(7, 22),
(7, 23),
(7, 24),
(7, 26),
(7, 29),
(7, 30),
(7, 31),
(7, 32),
(7, 37),
(7, 38),
(7, 39),
(7, 40),
(7, 41),
(7, 42),
(7, 43),
(7, 44),
(7, 45),
(7, 46),
(7, 47),
(7, 48),
(7, 49),
(7, 50),
(7, 51),
(7, 52),
(7, 53),
(7, 54),
(7, 55),
(7, 56),
(7, 57),
(7, 58),
(7, 59),
(7, 60),
(7, 61),
(7, 62),
(7, 63),
(7, 64),
(7, 65),
(7, 66),
(7, 67),
(7, 68),
(7, 69),
(7, 70),
(7, 71),
(7, 72),
(7, 73),
(7, 74),
(7, 75),
(7, 76),
(7, 77),
(7, 78),
(7, 79),
(7, 80);

--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `annees_scolaires`
--
ALTER TABLE `annees_scolaires`
  ADD CONSTRAINT `fk_annees_scolaires_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `attestations`
--
ALTER TABLE `attestations`
  ADD CONSTRAINT `attestations_ibfk_1` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`),
  ADD CONSTRAINT `attestations_ibfk_2` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`),
  ADD CONSTRAINT `attestations_ibfk_3` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `attestations_ibfk_4` FOREIGN KEY (`genere_par`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `fk_attestations_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `bulletins`
--
ALTER TABLE `bulletins`
  ADD CONSTRAINT `bulletins_ibfk_1` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`),
  ADD CONSTRAINT `bulletins_ibfk_2` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `bulletins_ibfk_3` FOREIGN KEY (`periode_id`) REFERENCES `periodes` (`id`),
  ADD CONSTRAINT `bulletins_ibfk_4` FOREIGN KEY (`genere_par`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `fk_bulletins_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`),
  ADD CONSTRAINT `classes_ibfk_2` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`),
  ADD CONSTRAINT `classes_ibfk_3` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`),
  ADD CONSTRAINT `classes_ibfk_4` FOREIGN KEY (`titulaire_id`) REFERENCES `enseignants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `classes_ibfk_5` FOREIGN KEY (`titulaire_id`) REFERENCES `enseignants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `classes_ibfk_6` FOREIGN KEY (`titulaire_id`) REFERENCES `enseignants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `classes_ibfk_7` FOREIGN KEY (`titulaire_id`) REFERENCES `enseignants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `classes_ibfk_8` FOREIGN KEY (`titulaire_id`) REFERENCES `enseignants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `classes_ibfk_9` FOREIGN KEY (`titulaire_id`) REFERENCES `enseignants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_classes_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `classe_matieres`
--
ALTER TABLE `classe_matieres`
  ADD CONSTRAINT `classe_matieres_ibfk_1` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `classe_matieres_ibfk_2` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_classe_matieres_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `conges`
--
ALTER TABLE `conges`
  ADD CONSTRAINT `conges_ibfk_1` FOREIGN KEY (`type_conge_id`) REFERENCES `types_conges` (`id`),
  ADD CONSTRAINT `conges_ibfk_2` FOREIGN KEY (`approuve_par`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `fk_conges_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `contrats`
--
ALTER TABLE `contrats`
  ADD CONSTRAINT `fk_contrats_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `creneaux_horaires`
--
ALTER TABLE `creneaux_horaires`
  ADD CONSTRAINT `fk_creneaux_horaires_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `deliberations`
--
ALTER TABLE `deliberations`
  ADD CONSTRAINT `deliberations_ibfk_1` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `deliberations_ibfk_2` FOREIGN KEY (`periode_id`) REFERENCES `periodes` (`id`),
  ADD CONSTRAINT `deliberations_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `fk_deliberations_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `depenses`
--
ALTER TABLE `depenses`
  ADD CONSTRAINT `depenses_ibfk_1` FOREIGN KEY (`categorie_id`) REFERENCES `categories_depenses` (`id`),
  ADD CONSTRAINT `depenses_ibfk_2` FOREIGN KEY (`approuve_par`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `depenses_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `fk_depenses_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `eleves`
--
ALTER TABLE `eleves`
  ADD CONSTRAINT `fk_eleves_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `emploi_temps`
--
ALTER TABLE `emploi_temps`
  ADD CONSTRAINT `emploi_temps_ibfk_1` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `emploi_temps_ibfk_2` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`),
  ADD CONSTRAINT `emploi_temps_ibfk_3` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`),
  ADD CONSTRAINT `emploi_temps_ibfk_4` FOREIGN KEY (`salle_id`) REFERENCES `salles` (`id`),
  ADD CONSTRAINT `emploi_temps_ibfk_5` FOREIGN KEY (`creneau_id`) REFERENCES `creneaux_horaires` (`id`),
  ADD CONSTRAINT `emploi_temps_ibfk_6` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`),
  ADD CONSTRAINT `fk_emploi_temps_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `enseignants`
--
ALTER TABLE `enseignants`
  ADD CONSTRAINT `enseignants_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_enseignants_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `enseignant_affectations`
--
ALTER TABLE `enseignant_affectations`
  ADD CONSTRAINT `enseignant_affectations_ibfk_1` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enseignant_affectations_ibfk_2` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enseignant_affectations_ibfk_3` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enseignant_affectations_ibfk_4` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`);

--
-- Contraintes pour la table `factures`
--
ALTER TABLE `factures`
  ADD CONSTRAINT `factures_ibfk_1` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`),
  ADD CONSTRAINT `factures_ibfk_2` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`),
  ADD CONSTRAINT `fk_factures_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `facture_lignes`
--
ALTER TABLE `facture_lignes`
  ADD CONSTRAINT `facture_lignes_ibfk_1` FOREIGN KEY (`facture_id`) REFERENCES `factures` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `facture_lignes_ibfk_2` FOREIGN KEY (`type_frais_id`) REFERENCES `types_frais` (`id`);

--
-- Contraintes pour la table `frais_scolaires`
--
ALTER TABLE `frais_scolaires`
  ADD CONSTRAINT `fk_frais_scolaires_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `frais_scolaires_ibfk_1` FOREIGN KEY (`type_frais_id`) REFERENCES `types_frais` (`id`),
  ADD CONSTRAINT `frais_scolaires_ibfk_2` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `frais_scolaires_ibfk_3` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`),
  ADD CONSTRAINT `frais_scolaires_ibfk_4` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`);

--
-- Contraintes pour la table `historique_connexions`
--
ALTER TABLE `historique_connexions`
  ADD CONSTRAINT `historique_connexions_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `inscriptions`
--
ALTER TABLE `inscriptions`
  ADD CONSTRAINT `fk_inscriptions_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `inscriptions_ibfk_1` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`),
  ADD CONSTRAINT `inscriptions_ibfk_2` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `inscriptions_ibfk_3` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`);

--
-- Contraintes pour la table `logs_systeme`
--
ALTER TABLE `logs_systeme`
  ADD CONSTRAINT `logs_systeme_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `matieres`
--
ALTER TABLE `matieres`
  ADD CONSTRAINT `fk_matieres_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `messages_contact`
--
ALTER TABLE `messages_contact`
  ADD CONSTRAINT `messages_contact_ibfk_1` FOREIGN KEY (`repondu_par`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `mouvements_caisse`
--
ALTER TABLE `mouvements_caisse`
  ADD CONSTRAINT `fk_mouvements_caisse_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `mouvements_caisse_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `niveaux`
--
ALTER TABLE `niveaux`
  ADD CONSTRAINT `niveaux_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `cycles` (`id`);

--
-- Contraintes pour la table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `fk_notes_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`),
  ADD CONSTRAINT `notes_ibfk_2` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`),
  ADD CONSTRAINT `notes_ibfk_3` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `notes_ibfk_4` FOREIGN KEY (`periode_id`) REFERENCES `periodes` (`id`),
  ADD CONSTRAINT `notes_ibfk_5` FOREIGN KEY (`type_evaluation_id`) REFERENCES `types_evaluations` (`id`),
  ADD CONSTRAINT `notes_ibfk_6` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`);

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `paiements`
--
ALTER TABLE `paiements`
  ADD CONSTRAINT `fk_paiements_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `paiements_ibfk_1` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`),
  ADD CONSTRAINT `paiements_ibfk_2` FOREIGN KEY (`inscription_id`) REFERENCES `inscriptions` (`id`),
  ADD CONSTRAINT `paiements_ibfk_3` FOREIGN KEY (`type_frais_id`) REFERENCES `types_frais` (`id`),
  ADD CONSTRAINT `paiements_ibfk_4` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`),
  ADD CONSTRAINT `paiements_ibfk_5` FOREIGN KEY (`recu_par`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `periodes`
--
ALTER TABLE `periodes`
  ADD CONSTRAINT `fk_periodes_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `periodes_ibfk_1` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`);

--
-- Contraintes pour la table `personnel`
--
ALTER TABLE `personnel`
  ADD CONSTRAINT `fk_personnel_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `personnel_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `presences`
--
ALTER TABLE `presences`
  ADD CONSTRAINT `fk_presences_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `resultats_deliberation`
--
ALTER TABLE `resultats_deliberation`
  ADD CONSTRAINT `fk_resultats_deliberation_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `resultats_deliberation_ibfk_1` FOREIGN KEY (`deliberation_id`) REFERENCES `deliberations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `resultats_deliberation_ibfk_2` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`);

--
-- Contraintes pour la table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `salaires`
--
ALTER TABLE `salaires`
  ADD CONSTRAINT `fk_salaires_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `salles`
--
ALTER TABLE `salles`
  ADD CONSTRAINT `fk_salles_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `school_modules`
--
ALTER TABLE `school_modules`
  ADD CONSTRAINT `school_modules_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `types_frais`
--
ALTER TABLE `types_frais`
  ADD CONSTRAINT `fk_types_frais_school_id` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD CONSTRAINT `fk_utilisateurs_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `utilisateurs_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Contraintes pour la table `utilisateur_permissions`
--
ALTER TABLE `utilisateur_permissions`
  ADD CONSTRAINT `utilisateur_permissions_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `utilisateur_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
