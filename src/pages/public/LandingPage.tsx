import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Users,
  BookOpen,
  Phone,
  Mail,
  Send,
  MessageCircle,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Shield,
  CreditCard,
  ClipboardList,
  Building2,
  Zap,
  Clock,
  HeartHandshake,
  School,
  Cpu,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/services/api'

const WHATSAPP_NUMBER = '243853123778'
const PHONE_DISPLAY_1 = '0853123778'
const PHONE_DISPLAY_2 = '0986897319'
const WHATSAPP_DISPLAY = '0853123778'
const CONTACT_EMAIL = 'contact@sgs-platform.com'

const fonctionnalites = [
  { icon: Users, titre: 'Gestion des élèves', description: 'Inscriptions, dossiers, suivi académique et bulletins de notes centralisés.' },
  { icon: CreditCard, titre: 'Comptabilité complète', description: 'Paiements, frais scolaires, dépenses, caisse et rapports financiers.' },
  { icon: ClipboardList, titre: 'Ressources humaines', description: 'Personnel, enseignants, présences, congés, contrats et salaires.' },
  { icon: BookOpen, titre: 'Gestion pédagogique', description: 'Emploi du temps, notes, matières, classes et résultats par période.' },
  { icon: BarChart3, titre: 'Tableaux de bord', description: 'Statistiques en temps réel, indicateurs clés et rapports personnalisés.' },
  { icon: Shield, titre: 'Sécurité & rôles', description: 'Gestion fine des utilisateurs, permissions par module et audit complet.' },
]

const avantages = [
  { icon: Cpu, titre: 'Solution complète', description: 'Tous les outils nécessaires pour gérer votre établissement efficacement.' },
  { icon: Zap, titre: 'Rapide & moderne', description: 'Interface intuitive, réactive et accessible depuis tout appareil.' },
  { icon: Clock, titre: 'Gain de temps', description: 'Automatisez les tâches répétitives : bulletins, rapports, paiements.' },
  { icon: HeartHandshake, titre: 'Accompagnement', description: 'Support technique dédié et formation pour votre équipe.' },
]

const LandingPage = () => {
  const navigate = useNavigate()
  const [contactForm, setContactForm] = useState({ nom: '', telephone: '', email: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [stats, setStats] = useState([
    { valeur: '—', label: 'Écoles enregistrées' },
    { valeur: '—', label: 'Élèves gérés' },
    { valeur: '—', label: 'Utilisateurs actifs' },
    { valeur: '99.9%', label: 'Disponibilité' },
  ])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get<any>('/stats/public')
        const d = res.data?.data || res.data || {}
        setStats([
          { valeur: String(d.totalSchools || 0), label: 'Écoles enregistrées' },
          { valeur: String(d.totalStudents || 0), label: 'Élèves gérés' },
          { valeur: String(d.totalUsers || 0), label: 'Utilisateurs actifs' },
          { valeur: '99.9%', label: 'Disponibilité' },
        ])
      } catch {
        // Keep defaults
      }
    }
    fetchStats()
  }, [])

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.nom || !contactForm.message) return
    setIsSubmitting(true)
    try {
      await api.post('/contact', {
        nom: contactForm.nom,
        telephone: contactForm.telephone,
        email: contactForm.email,
        message: contactForm.message,
      })
      setSubmitted(true)
      setContactForm({ nom: '', telephone: '', email: '', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch {
      // Silently handle
    } finally {
      setIsSubmitting(false)
    }
  }

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Bonjour,\n\nJe souhaite avoir des informations sur votre système de gestion scolaire SGS.\n\nCordialement`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg text-surface-900 dark:text-white">SGS</h1>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Système de Gestion Scolaire</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#accueil" className="text-surface-600 hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-400 transition-colors">Accueil</a>
              <a href="#fonctionnalites" className="text-surface-600 hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-400 transition-colors">Fonctionnalités</a>
              <a href="#avantages" className="text-surface-600 hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-400 transition-colors">Avantages</a>
              <a href="#contact" className="text-surface-600 hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-400 transition-colors">Contact</a>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/login')}>Se connecter</Button>
              <Button onClick={() => {
                document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' })
              }} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Inscrire mon école
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="accueil" className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary-200/30 dark:bg-secondary-900/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium">
                <GraduationCap className="h-4 w-4" />
                Solution de gestion scolaire en RDC
              </div>

              <h1 className="text-4xl lg:text-6xl font-heading font-bold text-surface-900 dark:text-white leading-tight">
                Gérez votre <br />
                <span className="text-primary-600">établissement scolaire</span> <br />
                en toute simplicité
              </h1>

              <p className="text-lg text-surface-600 dark:text-surface-400 max-w-xl">
                SGS est la solution tout-en-un pour la gestion scolaire en République Démocratique du Congo.
                Élèves, comptabilité, RH, notes — tout est centralisé et accessible en temps réel.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' })} rightIcon={<ChevronRight className="h-5 w-5" />}>
                  Inscrire mon école
                </Button>
                <Button size="lg" variant="outline" onClick={openWhatsApp} leftIcon={<MessageCircle className="h-5 w-5" />}>
                  Nous contacter
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-surface-200 dark:border-surface-700">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-3xl font-bold text-primary-600">{stat.valeur}</p>
                    <p className="text-sm text-surface-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                  <div className="text-center text-white p-8 space-y-6">
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white font-bold text-5xl">S</span>
                    </div>
                    <h2 className="text-3xl font-bold">SGS</h2>
                    <p className="text-primary-200 text-lg">Système de Gestion Scolaire</p>
                    <div className="flex justify-center gap-4 pt-4">
                      <div className="px-4 py-2 rounded-lg bg-white/10 text-sm">Élèves</div>
                      <div className="px-4 py-2 rounded-lg bg-white/10 text-sm">Finances</div>
                      <div className="px-4 py-2 rounded-lg bg-white/10 text-sm">RH</div>
                      <div className="px-4 py-2 rounded-lg bg-white/10 text-sm">Notes</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-surface-800 rounded-2xl shadow-xl p-4 border border-surface-200 dark:border-surface-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white">99.9%</p>
                    <p className="text-xs text-surface-500">Disponibilité</p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-white dark:bg-surface-800 rounded-2xl shadow-xl p-4 border border-surface-200 dark:border-surface-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                    <Building2 className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white">{stats[0].valeur}</p>
                    <p className="text-xs text-surface-500">Écoles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-50 dark:bg-surface-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-surface-900 dark:text-white mb-4">
              Fonctionnalités complètes
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Tout ce dont votre établissement a besoin, dans une seule solution moderne et intuitive.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fonctionnalites.map((f, idx) => {
              const Icon = f.icon
              return (
                <Card key={idx} hover padding="none" className="group">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="font-semibold text-lg text-surface-900 dark:text-white mb-2">{f.titre}</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{f.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-surface-900 dark:text-white mb-4">
              Pourquoi choisir SGS ?
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Des avantages concrets pour simplifier la gestion de votre établissement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {avantages.map((a, idx) => {
              const Icon = a.icon
              return (
                <div key={idx} className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-semibold text-lg text-surface-900 dark:text-white mb-2">{a.titre}</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">{a.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Inscription école */}
      <section id="inscription" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto text-center">
          <School className="h-16 w-16 mx-auto mb-6 text-white/80" />
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-4">
            Inscrivez votre école dès aujourd'hui
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Modernisez la gestion de votre établissement scolaire avec SGS.
            Contactez-nous pour une démonstration gratuite et un accompagnement personnalisé.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-primary-700 hover:bg-primary-50"
              onClick={openWhatsApp}
              leftIcon={<MessageCircle className="h-5 w-5" />}
            >
              Contacter via WhatsApp
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              leftIcon={<Send className="h-5 w-5" />}
            >
              Envoyer un message
            </Button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-surface-900 dark:text-white mb-4">
              Contactez-nous
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400">
              Notre équipe est disponible pour répondre à toutes vos questions
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-1">Téléphone</h3>
                  <p className="text-surface-600 dark:text-surface-400">{PHONE_DISPLAY_1}</p>
                  <p className="text-surface-600 dark:text-surface-400">{PHONE_DISPLAY_2}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-1">Email</h3>
                  <p className="text-surface-600 dark:text-surface-400">{CONTACT_EMAIL}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-1">WhatsApp</h3>
                  <p className="text-surface-600 dark:text-surface-400">{WHATSAPP_DISPLAY}</p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                leftIcon={<MessageCircle className="h-5 w-5" />}
                onClick={openWhatsApp}
              >
                Ouvrir la conversation WhatsApp
              </Button>
            </div>

            <Card className="bg-white dark:bg-surface-800">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-6">
                  Envoyez-nous un message
                </h3>

                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Message envoyé !</h4>
                    <p className="text-surface-500">Nous vous répondrons dans les plus brefs délais.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <Input
                      label="Votre nom complet *"
                      placeholder="Ex: Jean Kabongo"
                      value={contactForm.nom}
                      onChange={(e) => setContactForm({ ...contactForm, nom: e.target.value })}
                      required
                    />
                    <Input
                      label="Téléphone *"
                      type="tel"
                      placeholder="+243 XX XXX XXXX"
                      value={contactForm.telephone}
                      onChange={(e) => setContactForm({ ...contactForm, telephone: e.target.value })}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="email@exemple.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Votre message *
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Décrivez votre besoin ou posez vos questions..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>
                      Envoyer le message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-900 dark:bg-surface-950 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <div>
                  <h3 className="font-bold">SGS</h3>
                  <p className="text-xs text-surface-400">Système de Gestion Scolaire</p>
                </div>
              </div>
              <p className="text-surface-400 text-sm">
                La solution de référence pour la gestion scolaire en République Démocratique du Congo.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2 text-surface-400">
                <li><a href="#accueil" className="hover:text-white transition-colors">Accueil</a></li>
                <li><a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#avantages" className="hover:text-white transition-colors">Avantages</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/login" className="hover:text-white transition-colors">Connexion</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-surface-400 text-sm">
                <li>{PHONE_DISPLAY_1}</li>
                <li>{PHONE_DISPLAY_2}</li>
                <li>{CONTACT_EMAIL}</li>
                <li>Kinshasa, RDC</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-surface-800 pt-8 text-center text-surface-400 text-sm">
            <p>&copy; {new Date().getFullYear()} SGS - Système de Gestion Scolaire. Tous droits réservés.</p>
            <p className="mt-1">République Démocratique du Congo</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export { LandingPage }
