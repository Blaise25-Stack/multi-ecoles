import { api } from './api'
import type { ID } from '@/types'

export const notesService = {
  async getNotes(params?: { classe_id?: ID; matiere_id?: ID; periode_id?: ID; eleve_id?: ID }) {
    return api.get('/notes', { params })
  },

  async saveNotes(notes: Array<{
    eleve_id: ID
    matiere_id: ID
    classe_id: ID
    periode_id: ID
    type_evaluation_id: ID
    note: number
    note_max?: number
    date_evaluation?: string
    commentaire?: string
  }>) {
    return api.post('/notes', { notes })
  },

  async getBulletin(eleveId: ID, periodeId: ID) {
    return api.get(`/notes/bulletin/${eleveId}/${periodeId}`)
  },

  async getPeriodes() {
    return api.get('/notes/periodes/list')
  },

  async getTypesEvaluations() {
    return api.get('/notes/types-evaluations/list')
  },
}
