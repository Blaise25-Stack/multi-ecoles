import { z } from 'zod'

// ===== VALIDATIONS COMMUNES =====

export const emailSchema = z
  .string()
  .min(1, 'L\'email est requis')
  .email('Format d\'email invalide')

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')

export const phoneSchema = z
  .string()
  .min(9, 'Numéro de téléphone invalide')
  .regex(/^[0-9+\s-]+$/, 'Format de téléphone invalide')

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')

// ===== SCHÉMAS D'AUTHENTIFICATION =====

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

// ===== SCHÉMAS ÉLÈVE =====

export const tuteurSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  telephone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  profession: z.string().optional(),
  lienParente: z.enum(['pere', 'mere', 'tuteur', 'autre']),
  adresse: z.string().optional(),
})

export const eleveSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  dateNaissance: dateSchema,
  lieuNaissance: z.string().min(2, 'Le lieu de naissance est requis'),
  sexe: z.enum(['M', 'F'], { required_error: 'Le sexe est requis' }),
  nationalite: z.string().min(2, 'La nationalité est requise'),
  adresse: z.string().optional(),
  telephone: phoneSchema.optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
  groupeSanguin: z.string().optional(),
  allergies: z.string().optional(),
  observations: z.string().optional(),
  tuteurs: z.array(tuteurSchema).min(1, 'Au moins un tuteur est requis'),
})

export const inscriptionSchema = z.object({
  eleveId: z.string().optional(),
  classeId: z.string().min(1, 'La classe est requise'),
  anneeScolaireId: z.string().min(1, 'L\'année scolaire est requise'),
  observations: z.string().optional(),
})

// ===== SCHÉMAS ENSEIGNANT/PERSONNEL =====

export const enseignantSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: emailSchema,
  telephone: phoneSchema,
  sexe: z.enum(['M', 'F']),
  dateNaissance: dateSchema.optional(),
  adresse: z.string().optional(),
  specialite: z.string().min(2, 'La spécialité est requise'),
  diplome: z.string().optional(),
  dateEmbauche: dateSchema,
  typeContrat: z.enum(['cdi', 'cdd', 'vacation', 'stage']),
  salaireBase: z.number().min(0, 'Le salaire doit être positif'),
  matiereIds: z.array(z.string()).min(1, 'Au moins une matière est requise'),
})

export const personnelSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: emailSchema,
  telephone: phoneSchema,
  sexe: z.enum(['M', 'F']),
  fonction: z.string().min(2, 'La fonction est requise'),
  departement: z.string().min(2, 'Le département est requis'),
  dateEmbauche: dateSchema,
  typeContrat: z.enum(['cdi', 'cdd', 'vacation', 'stage']),
  salaireBase: z.number().min(0, 'Le salaire doit être positif'),
})

// ===== SCHÉMAS COMPTABILITÉ =====

export const paiementSchema = z.object({
  eleveId: z.string().min(1, 'L\'élève est requis'),
  fraisId: z.string().min(1, 'Le type de frais est requis'),
  montant: z.number().min(1, 'Le montant doit être supérieur à 0'),
  modePaiement: z.enum(['especes', 'cheque', 'virement', 'mobile_money', 'carte']),
  reference: z.string().optional(),
  observations: z.string().optional(),
})

export const depenseSchema = z.object({
  libelle: z.string().min(3, 'Le libellé doit contenir au moins 3 caractères'),
  categorie: z.enum(['fournitures', 'equipement', 'maintenance', 'salaires', 'services', 'autre']),
  montant: z.number().min(1, 'Le montant doit être supérieur à 0'),
  dateDepense: dateSchema,
  beneficiaire: z.string().optional(),
  modePaiement: z.enum(['especes', 'cheque', 'virement', 'mobile_money', 'carte']),
  reference: z.string().optional(),
  observations: z.string().optional(),
})

export const fraisScolaireSchema = z.object({
  libelle: z.string().min(3, 'Le libellé est requis'),
  type: z.enum(['inscription', 'scolarite', 'cantine', 'transport', 'uniforme', 'autre']),
  montant: z.number().min(0, 'Le montant doit être positif'),
  niveauId: z.string().optional(),
  classeId: z.string().optional(),
  obligatoire: z.boolean().default(true),
  echeances: z.array(z.object({
    numero: z.number(),
    montant: z.number().min(0),
    dateLimite: dateSchema,
  })).optional(),
})

// ===== SCHÉMAS NOTES =====

export const noteSchema = z.object({
  eleveId: z.string().min(1, 'L\'élève est requis'),
  matiereId: z.string().min(1, 'La matière est requise'),
  type: z.enum(['devoir', 'examen', 'tp', 'oral', 'participation']),
  note: z.number().min(0).max(20, 'La note doit être entre 0 et 20'),
  noteMax: z.number().default(20),
  coefficient: z.number().min(0.5).default(1),
  periode: z.enum(['trimestre1', 'trimestre2', 'trimestre3', 'semestre1', 'semestre2']),
  dateEvaluation: dateSchema,
  observations: z.string().optional(),
})

// ===== SCHÉMAS EMPLOI DU TEMPS =====

export const seanceSchema = z.object({
  classeId: z.string().min(1, 'La classe est requise'),
  matiereId: z.string().min(1, 'La matière est requise'),
  enseignantId: z.string().min(1, 'L\'enseignant est requis'),
  salleId: z.string().optional(),
  jour: z.enum(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']),
  creneauId: z.string().min(1, 'Le créneau horaire est requis'),
})

// ===== SCHÉMAS CONGÉS =====

export const congeSchema = z.object({
  type: z.enum(['annuel', 'maladie', 'maternite', 'sans_solde', 'exceptionnel']),
  dateDebut: dateSchema,
  dateFin: dateSchema,
  motif: z.string().min(10, 'Le motif doit contenir au moins 10 caractères'),
}).refine((data) => new Date(data.dateFin) >= new Date(data.dateDebut), {
  message: 'La date de fin doit être après la date de début',
  path: ['dateFin'],
})

// ===== TYPES INFÉRÉS =====

export type LoginFormData = z.infer<typeof loginSchema>
export type EleveFormData = z.infer<typeof eleveSchema>
export type TuteurFormData = z.infer<typeof tuteurSchema>
export type InscriptionFormData = z.infer<typeof inscriptionSchema>
export type EnseignantFormData = z.infer<typeof enseignantSchema>
export type PersonnelFormData = z.infer<typeof personnelSchema>
export type PaiementFormData = z.infer<typeof paiementSchema>
export type DepenseFormData = z.infer<typeof depenseSchema>
export type NoteFormData = z.infer<typeof noteSchema>
export type CongeFormData = z.infer<typeof congeSchema>



