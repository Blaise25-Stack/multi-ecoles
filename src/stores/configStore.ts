import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AnneeScolaire, Etablissement } from '@/types'

interface ConfigState {
  // Établissement
  etablissement: Etablissement | null
  
  // Année scolaire active
  anneeScolaireActive: AnneeScolaire | null
  anneeScolaires: AnneeScolaire[]
  
  // Langue
  langue: 'fr' | 'en'
  
  // Devise
  devise: string
  
  // Actions
  setEtablissement: (etablissement: Etablissement) => void
  setAnneeScolaireActive: (annee: AnneeScolaire) => void
  setAnneeScolaires: (annees: AnneeScolaire[]) => void
  setLangue: (langue: 'fr' | 'en') => void
  setDevise: (devise: string) => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      etablissement: null,
      anneeScolaireActive: null,
      anneeScolaires: [],
      langue: 'fr',
      devise: 'XAF',
      
      setEtablissement: (etablissement) => set({ etablissement }),
      setAnneeScolaireActive: (annee) => set({ anneeScolaireActive: annee }),
      setAnneeScolaires: (annees) => set({ anneeScolaires: annees }),
      setLangue: (langue) => set({ langue }),
      setDevise: (devise) => set({ devise }),
    }),
    {
      name: 'sgs-config',
      storage: createJSONStorage(() => localStorage),
    }
  )
)



