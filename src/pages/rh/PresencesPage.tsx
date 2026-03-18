import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { api } from '@/services/api'
import { useToast } from '@/hooks/useToast'

type StatutPresence = 'present' | 'absent' | 'retard' | 'conge'

const statutConfig: Record<StatutPresence, { label: string; color: string; icon: React.ElementType }> = {
  present: { label: 'Présent', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  retard: { label: 'Retard', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  conge: { label: 'Congé', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Calendar },
}

const statusCycle: StatutPresence[] = ['present', 'absent', 'retard', 'conge']

const PresencesPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [typeFilter, setTypeFilter] = useState('')
  const [localPresences, setLocalPresences] = useState<Record<string, Record<string, StatutPresence>>>({})
  const [saving, setSaving] = useState(false)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const { data: enseignantsData } = useQuery({
    queryKey: ['presences-enseignants'],
    queryFn: async () => {
      const res = await api.get<any>('/rh/enseignants', { params: { limit: 200 } })
      return (res.data?.data || []).map((e: any) => ({
        id: e.id,
        type: 'enseignant' as const,
        nom: e.nom,
        prenom: e.prenom,
      }))
    },
  })

  const { data: personnelData } = useQuery({
    queryKey: ['presences-personnel'],
    queryFn: async () => {
      const res = await api.get<any>('/rh/personnel', { params: { limit: 200 } })
      return (res.data?.data || []).map((p: any) => ({
        id: p.id,
        type: 'personnel' as const,
        nom: p.nom,
        prenom: p.prenom,
      }))
    },
  })

  const { data: presencesData } = useQuery({
    queryKey: ['presences', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const dateDebut = format(weekStart, 'yyyy-MM-dd')
      const dateFin = format(addDays(weekStart, 5), 'yyyy-MM-dd')
      const res = await api.get<any>('/rh/presences', {
        params: { date_debut: dateDebut, date_fin: dateFin, per_page: 1000 },
      })
      return res.data?.data || []
    },
  })

  const allEmployes = useMemo(() => {
    const ens = enseignantsData || []
    const pers = personnelData || []
    return [...ens, ...pers]
  }, [enseignantsData, personnelData])

  const filteredEmployes = useMemo(() => {
    if (!typeFilter) return allEmployes
    return allEmployes.filter(e => e.type === typeFilter)
  }, [allEmployes, typeFilter])

  const presencesMap = useMemo(() => {
    const map: Record<string, Record<string, StatutPresence>> = {}
    for (const p of (presencesData || [])) {
      const key = `${p.employe_type}-${p.employe_id}`
      if (!map[key]) map[key] = {}
      map[key][p.date_presence?.split('T')[0] || p.date_presence] = p.statut as StatutPresence
    }
    return map
  }, [presencesData])

  const getPresenceStatus = useCallback((empType: string, empId: number, dateStr: string): StatutPresence => {
    const key = `${empType}-${empId}`
    return localPresences[key]?.[dateStr] ?? presencesMap[key]?.[dateStr] ?? 'present'
  }, [localPresences, presencesMap])

  const cycleStatus = (empType: string, empId: number, dateStr: string) => {
    const current = getPresenceStatus(empType, empId, dateStr)
    const idx = statusCycle.indexOf(current)
    const next = statusCycle[(idx + 1) % statusCycle.length]
    const key = `${empType}-${empId}`
    setLocalPresences(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [dateStr]: next },
    }))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries: { employe_id: number; employe_type: string; date: string; statut: string }[] = []
      for (const [key, dates] of Object.entries(localPresences)) {
        const [type, idStr] = key.split('-')
        for (const [date, statut] of Object.entries(dates)) {
          entries.push({ employe_type: type, employe_id: parseInt(idStr), date, statut })
        }
      }
      const results = await Promise.allSettled(
        entries.map(e => api.post('/rh/presences', e))
      )
      const failures = results.filter(r => r.status === 'rejected').length
      if (failures > 0) throw new Error(`${failures} erreur(s)`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presences'] })
      setLocalPresences({})
      addToast({ type: 'success', title: 'Succès', message: 'Présences enregistrées' })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de l\'enregistrement' })
    },
  })

  const markAllPresent = () => {
    const updates: Record<string, Record<string, StatutPresence>> = {}
    for (const emp of filteredEmployes) {
      const key = `${emp.type}-${emp.id}`
      updates[key] = { ...(localPresences[key] || {}), [todayStr]: 'present' }
    }
    setLocalPresences(prev => ({ ...prev, ...updates }))
  }

  const hasChanges = Object.keys(localPresences).length > 0

  const stats = useMemo(() => {
    let presents = 0, absents = 0, retards = 0
    for (const emp of filteredEmployes) {
      const s = getPresenceStatus(emp.type, emp.id, todayStr)
      if (s === 'present') presents++
      else if (s === 'absent') absents++
      else if (s === 'retard') retards++
    }
    return { presents, absents, retards }
  }, [filteredEmployes, todayStr, getPresenceStatus])

  const previousWeek = () => setCurrentDate(addDays(currentDate, -7))
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Présences
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Suivi des présences du personnel — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={markAllPresent}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Tous présents aujourd'hui
          </Button>
          {hasChanges && (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              leftIcon={saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            >
              Enregistrer ({Object.values(localPresences).reduce((s, d) => s + Object.keys(d).length, 0)})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredEmployes.length}</p>
              <p className="text-sm text-surface-500">Total employés</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.presents}</p>
              <p className="text-sm text-surface-500">Présents</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.absents}</p>
              <p className="text-sm text-surface-500">Absents</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.retards}</p>
              <p className="text-sm text-surface-500">Retards</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Navigation */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Select
            options={[
              { value: '', label: 'Tous les employés' },
              { value: 'enseignant', label: 'Enseignants' },
              { value: 'personnel', label: 'Personnel' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-48"
          />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[200px] text-center">
              Semaine du {format(weekStart, 'd MMMM yyyy', { locale: fr })}
            </span>
            <Button variant="ghost" size="sm" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Aujourd'hui
          </Button>
        </div>
      </Card>

      {/* Tableau des présences */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-900/50">
                <th className="px-4 py-3 text-left font-semibold border-b border-surface-200 dark:border-surface-700 min-w-[200px]">
                  Employé
                </th>
                {weekDays.map((day, idx) => (
                  <th
                    key={idx}
                    className={cn(
                      'px-4 py-3 text-center font-semibold border-b border-surface-200 dark:border-surface-700',
                      isSameDay(day, new Date()) && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                  >
                    <div className="text-sm">{format(day, 'EEEE', { locale: fr })}</div>
                    <div className="text-xs text-surface-500">{format(day, 'd MMM', { locale: fr })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-surface-500">
                    Aucun employé trouvé
                  </td>
                </tr>
              ) : (
                filteredEmployes.map((employe) => (
                  <tr key={`${employe.type}-${employe.id}`} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                    <td className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-3">
                        <Avatar nom={employe.nom} prenom={employe.prenom} size="sm" />
                        <div>
                          <p className="font-medium">{employe.prenom} {employe.nom}</p>
                          <p className="text-xs text-surface-500 capitalize">{employe.type}</p>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((day, dayIdx) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const statut = getPresenceStatus(employe.type, employe.id, dateStr)
                      const config = statutConfig[statut]
                      const Icon = config.icon
                      const isModified = localPresences[`${employe.type}-${employe.id}`]?.[dateStr] !== undefined

                      return (
                        <td
                          key={dayIdx}
                          className={cn(
                            'px-4 py-3 text-center border-b border-surface-100 dark:border-surface-800',
                            isSameDay(day, new Date()) && 'bg-primary-50/50 dark:bg-primary-900/10'
                          )}
                        >
                          <button
                            onClick={() => cycleStatus(employe.type, employe.id, dateStr)}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                              config.color,
                              'hover:opacity-80 transition-opacity cursor-pointer',
                              isModified && 'ring-2 ring-primary-400 ring-offset-1'
                            )}
                          >
                            <Icon className="h-3 w-3" />
                            <span className="hidden sm:inline">{config.label}</span>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 justify-center">
        {Object.entries(statutConfig).map(([key, config]) => {
          const Icon = config.icon
          return (
            <div key={key} className="flex items-center gap-2">
              <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.color)}>
                <Icon className="h-3 w-3" />
                {config.label}
              </span>
            </div>
          )
        })}
        <div className="text-xs text-surface-500 flex items-center">
          Cliquez sur un statut pour le changer
        </div>
      </div>
    </div>
  )
}

export { PresencesPage }
