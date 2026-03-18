import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useConfigStore } from '@/stores/configStore'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SuperAdminRoute } from '@/components/auth/SuperAdminRoute'
import { Toast } from '@/components/ui/Toast'

// Page publique (vitrine)
import { LandingPage } from '@/pages/public/LandingPage'

// Pages - Auth
import { LoginPage } from '@/pages/auth/LoginPage'

// Pages - SuperAdmin
import {
  SuperAdminDashboard, ModulesManager, SchoolsManager, SchoolUsersManager,
  PlatformUsersPage, GlobalModulesPage, GlobalReportsPage, PlatformSettingsPage,
  MessagesContactPage,
} from '@/pages/superadmin'

// Pages - Dashboard
import { DashboardPage } from '@/pages/dashboard/DashboardPage'

// Pages - Élèves
import { ElevesPage } from '@/pages/eleves/ElevesPage'
import { NouvelElevePage } from '@/pages/eleves/NouvelElevePage'
import { EleveDetailPage } from '@/pages/eleves/EleveDetailPage'
import { ModifierElevePage } from '@/pages/eleves/ModifierElevePage'
import { BulletinElevePage } from '@/pages/eleves/BulletinElevePage'
import { InscriptionsPage } from '@/pages/eleves/InscriptionsPage'
import { NouvelleInscriptionPage } from '@/pages/eleves/NouvelleInscriptionPage'
import { ClassesPage } from '@/pages/eleves/ClassesPage'
import { NotesPage } from '@/pages/eleves/NotesPage'
import { EmploiDuTempsPage } from '@/pages/eleves/EmploiDuTempsPage'
import { MatieresPage } from '@/pages/eleves/MatieresPage'
import { ResultatsPage } from '@/pages/eleves/ResultatsPage'
import { AttestationsPage } from '@/pages/eleves/AttestationsPage'

// Pages - Comptabilité
import { PaiementsPage } from '@/pages/comptabilite/PaiementsPage'
import { FraisScolairesPage } from '@/pages/comptabilite/FraisScolairesPage'
import { DepensesPage } from '@/pages/comptabilite/DepensesPage'
import { CaissePage } from '@/pages/comptabilite/CaissePage'

// Pages - RH
import { EnseignantsPage } from '@/pages/rh/EnseignantsPage'
import { NouvelEnseignantPage } from '@/pages/rh/NouvelEnseignantPage'
import { EnseignantDetailPage } from '@/pages/rh/EnseignantDetailPage'
import { PersonnelPage } from '@/pages/rh/PersonnelPage'
import { NouveauPersonnelPage } from '@/pages/rh/NouveauPersonnelPage'
import { PresencesPage } from '@/pages/rh/PresencesPage'
import { CongesPage } from '@/pages/rh/CongesPage'
import { SalairesPage } from '@/pages/rh/SalairesPage'
import { ContratsPage } from '@/pages/rh/ContratsPage'

// Pages - Configuration
import { ParametresPage } from '@/pages/config/ParametresPage'
import { UtilisateursPage } from '@/pages/config/UtilisateursPage'
import { ProfilsAccesPage } from '@/pages/config/ProfilsAccesPage'

// Pages - Profil
import { ProfilePage } from '@/pages/profile/ProfilePage'

// Pages - Erreurs
import { UnauthorizedPage } from '@/pages/errors/UnauthorizedPage'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'


function App() {
  const { theme, setTheme } = useUIStore()
  const { setLoading } = useAuthStore()
  const { setAnneeScolaireActive } = useConfigStore()

  // Initialisation du thème
  useEffect(() => {
    setTheme(theme)
  }, [])

  // Initialisation de l'application
  useEffect(() => {
    const initApp = async () => {
      try {
        setAnneeScolaireActive({
          id: '2024-2025',
          libelle: '2024-2025',
          dateDebut: '2024-09-02',
          dateFin: '2025-06-30',
          estActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        })
      } catch (error) {
        console.error('Erreur initialisation:', error)
      } finally {
        setLoading(false)
      }
    }

    initApp()
  }, [])

  return (
    <>
      <Routes>
        {/* ========================================= */}
        {/* ROUTES PUBLIQUES                         */}
        {/* ========================================= */}
        
        {/* Page vitrine (accueil public) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Page de connexion */}
        <Route path="/login" element={<LoginPage />} />

        {/* ========================================= */}
        {/* ROUTES SUPER ADMIN                       */}
        {/* ========================================= */}
        <Route path="/superadmin" element={<SuperAdminRoute />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="schools" element={<SchoolsManager />} />
          <Route path="schools/:schoolId/modules" element={<ModulesManager />} />
          <Route path="schools/:schoolId/users" element={<SchoolUsersManager />} />
          <Route path="users" element={<PlatformUsersPage />} />
          <Route path="modules" element={<GlobalModulesPage />} />
          <Route path="reports" element={<GlobalReportsPage />} />
          <Route path="settings" element={<PlatformSettingsPage />} />
          <Route path="messages" element={<MessagesContactPage />} />
        </Route>

        {/* ========================================= */}
        {/* ROUTES PROTÉGÉES (après authentification)*/}
        {/* ========================================= */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* ========================================= */}
          {/* MODULE ÉLÈVES / ÉTUDIANTS                */}
          {/* ========================================= */}
          <Route path="/eleves" element={<ElevesPage />} />
          <Route path="/eleves/nouveau" element={<NouvelElevePage />} />
          <Route path="/eleves/:id" element={<EleveDetailPage />} />
          <Route path="/eleves/:id/modifier" element={<ModifierElevePage />} />
          <Route path="/eleves/:id/bulletin" element={<BulletinElevePage />} />
          
          {/* Inscriptions & Réinscriptions */}
          <Route path="/inscriptions" element={<InscriptionsPage />} />
          <Route path="/inscriptions/nouvelle" element={<NouvelleInscriptionPage />} />

          {/* Classes, filières, niveaux */}
          <Route path="/classes" element={<ClassesPage />} />

          {/* Matières */}
          <Route path="/matieres" element={<MatieresPage />} />

          {/* Notes & Bulletins */}
          <Route path="/notes" element={<NotesPage />} />
          
          {/* Emploi du temps */}
          <Route path="/emploi-du-temps" element={<EmploiDuTempsPage />} />
          
          {/* Résultats & Délibérations */}
          <Route path="/resultats" element={<ResultatsPage />} />
          
          {/* Attestations & Certificats */}
          <Route path="/attestations" element={<AttestationsPage />} />

          {/* ========================================= */}
          {/* MODULE COMPTABILITÉ                      */}
          {/* ========================================= */}
          
          {/* Paiements */}
          <Route path="/paiements" element={<PaiementsPage />} />
          <Route path="/paiements/nouveau" element={<Navigate to="/paiements" replace />} />
          
          {/* Frais scolaires */}
          <Route path="/frais" element={<FraisScolairesPage />} />
          
          {/* Dépenses internes */}
          <Route path="/depenses" element={<DepensesPage />} />
          
          {/* Gestion de caisse */}
          <Route path="/caisse" element={<CaissePage />} />

          {/* ========================================= */}
          {/* MODULE RH                                */}
          {/* ========================================= */}
          
          {/* Enseignants */}
          <Route path="/enseignants" element={<EnseignantsPage />} />
          <Route path="/enseignants/nouveau" element={<NouvelEnseignantPage />} />
          <Route path="/enseignants/:id" element={<EnseignantDetailPage />} />
          
          {/* Personnel administratif */}
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/personnel/nouveau" element={<NouveauPersonnelPage />} />
          
          {/* Présences / Absences */}
          <Route path="/presences" element={<PresencesPage />} />
          
          {/* Congés */}
          <Route path="/conges" element={<CongesPage />} />
          
          {/* Salaires */}
          <Route path="/salaires" element={<SalairesPage />} />
          
          {/* Contrats */}
          <Route path="/contrats" element={<ContratsPage />} />

          {/* ========================================= */}
          {/* MODULE CONFIGURATION                     */}
          {/* ========================================= */}
          
          {/* Paramètres généraux */}
          <Route path="/parametres" element={<ParametresPage />} />
          
          {/* Profils d'accès */}
          <Route path="/profils" element={<ProfilsAccesPage />} />
          
          {/* Utilisateurs */}
          <Route path="/utilisateurs" element={<UtilisateursPage />} />

          {/* Messages de contact */}
          <Route path="/messages-contact" element={<MessagesContactPage />} />

          {/* ========================================= */}
          {/* PROFIL UTILISATEUR                       */}
          {/* ========================================= */}
          <Route path="/profil" element={<ProfilePage />} />
        </Route>

        {/* Pages d'erreur */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Toast global */}
      <Toast />
    </>
  )
}

export default App
