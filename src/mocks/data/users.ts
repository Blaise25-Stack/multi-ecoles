import type { User } from '@/types'
import { getRolePermissions } from '@/stores/authStore'

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@sgs.edu',
    nom: 'Dupont',
    prenom: 'Jean',
    role: 'super_admin',
    telephone: '699000001',
    permissions: getRolePermissions('super_admin'),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-12-03T08:00:00Z',
  },
  {
    id: '2',
    email: 'comptable@sgs.edu',
    nom: 'Martin',
    prenom: 'Marie',
    role: 'comptable',
    telephone: '699000002',
    permissions: getRolePermissions('comptable'),
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    lastLogin: '2024-12-02T14:30:00Z',
  },
  {
    id: '3',
    email: 'rh@sgs.edu',
    nom: 'Bernard',
    prenom: 'Pierre',
    role: 'rh',
    telephone: '699000003',
    permissions: getRolePermissions('rh'),
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    lastLogin: '2024-12-01T09:00:00Z',
  },
  {
    id: '4',
    email: 'enseignant@sgs.edu',
    nom: 'Lefebvre',
    prenom: 'Sophie',
    role: 'enseignant',
    telephone: '699000004',
    permissions: getRolePermissions('enseignant'),
    isActive: true,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    lastLogin: '2024-12-03T07:30:00Z',
  },
  {
    id: '5',
    email: 'parent@sgs.edu',
    nom: 'Moreau',
    prenom: 'Catherine',
    role: 'parent',
    telephone: '699000005',
    permissions: getRolePermissions('parent'),
    isActive: true,
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-04-01T00:00:00Z',
  },
]

// Mot de passe par défaut pour les tests : "Password123"
export const mockPasswords: Record<string, string> = {
  'admin@sgs.edu': 'Password123',
  'comptable@sgs.edu': 'Password123',
  'rh@sgs.edu': 'Password123',
  'enseignant@sgs.edu': 'Password123',
  'parent@sgs.edu': 'Password123',
}



