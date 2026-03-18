import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mail,
  MailOpen,
  Trash2,
  Phone,
  Calendar,
  User,
  MessageSquare,
  Eye,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
  TableEmpty,
  TableSkeleton,
} from '@/components/ui/Table'
import { api } from '@/services/api'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/useToast'

const MessagesContactPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages-contact'],
    queryFn: async () => {
      const res = await api.get<any>('/contact', { params: { per_page: 100 } })
      return res.data
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => api.put(`/contact/${id}/lu`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages-contact'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/contact/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages-contact'] })
      addToast({ type: 'success', title: 'Succès', message: 'Message supprimé' })
      setShowDetailModal(false)
    },
  })

  const messages: any[] = messagesData?.data || []
  const nonLus = messages.filter(m => !m.lu).length

  const openMessage = (msg: any) => {
    setSelectedMessage(msg)
    setShowDetailModal(true)
    if (!msg.lu) markReadMutation.mutate(msg.id)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Messages de contact
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Messages reçus depuis le site vitrine
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate(-1)}
        >
          Retour
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total messages" value={messages.length} icon={<MessageSquare className="h-6 w-6" />} color="primary" />
        <StatCard title="Non lus" value={nonLus} icon={<Mail className="h-6 w-6" />} color="warning" />
        <StatCard title="Lus" value={messages.length - nonLus} icon={<MailOpen className="h-6 w-6" />} color="success" />
      </div>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh></TableTh>
              <TableTh>Nom</TableTh>
              <TableTh>Contact</TableTh>
              <TableTh>Message</TableTh>
              <TableTh>Date</TableTh>
              <TableTh className="w-20">Actions</TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={6} rows={8} />
            ) : messages.length === 0 ? (
              <TableEmpty colSpan={6} message="Aucun message reçu" />
            ) : (
              messages.map((msg: any) => (
                <TableRow key={msg.id} className={!msg.lu ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}>
                  <TableTd className="w-8">
                    {!msg.lu ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    ) : (
                      <MailOpen className="h-4 w-4 text-surface-300" />
                    )}
                  </TableTd>
                  <TableTd>
                    <p className={!msg.lu ? 'font-semibold' : 'font-medium'}>{msg.nom}</p>
                  </TableTd>
                  <TableTd>
                    <div className="text-sm space-y-1">
                      {msg.telephone && <p className="flex items-center gap-1"><Phone className="h-3 w-3 text-surface-400" />{msg.telephone}</p>}
                      {msg.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3 text-surface-400" />{msg.email}</p>}
                    </div>
                  </TableTd>
                  <TableTd>
                    <p className="text-sm truncate max-w-xs">{msg.message}</p>
                  </TableTd>
                  <TableTd>
                    <span className="text-sm text-surface-500">{formatDate(msg.created_at)}</span>
                  </TableTd>
                  <TableTd>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openMessage(msg)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(msg.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableTd>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Détail du message" size="lg">
        {selectedMessage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <User className="h-5 w-5 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-500">Nom</p>
                  <p className="font-medium">{selectedMessage.nom}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <Calendar className="h-5 w-5 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-500">Date</p>
                  <p className="font-medium">{formatDate(selectedMessage.created_at)}</p>
                </div>
              </div>
              {selectedMessage.telephone && (
                <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                  <Phone className="h-5 w-5 text-surface-400" />
                  <div>
                    <p className="text-xs text-surface-500">Téléphone</p>
                    <p className="font-medium">{selectedMessage.telephone}</p>
                  </div>
                </div>
              )}
              {selectedMessage.email && (
                <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                  <Mail className="h-5 w-5 text-surface-400" />
                  <div>
                    <p className="text-xs text-surface-500">Email</p>
                    <p className="font-medium">{selectedMessage.email}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <p className="text-xs text-surface-500 mb-2">Message</p>
              <p className="text-surface-900 dark:text-white whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Fermer</Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(selectedMessage.id)} disabled={deleteMutation.isPending}>
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export { MessagesContactPage }
