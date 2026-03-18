import { http, HttpResponse, delay } from 'msw'
import { mockUsers, mockPasswords } from '../data/users'

export const authHandlers = [
  // Login
  http.post('/api/auth/login', async ({ request }) => {
    await delay(500)
    
    const body = await request.json() as { email: string; password: string }
    const { email, password } = body
    
    const user = mockUsers.find((u) => u.email === email)
    
    if (!user) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email ou mot de passe incorrect',
          },
        },
        { status: 401 }
      )
    }
    
    if (mockPasswords[email] !== password) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email ou mot de passe incorrect',
          },
        },
        { status: 401 }
      )
    }
    
    if (!user.isActive) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Ce compte a été désactivé',
          },
        },
        { status: 403 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        user,
        token: `mock-jwt-token-${user.id}-${Date.now()}`,
        refreshToken: `mock-refresh-token-${user.id}-${Date.now()}`,
      },
    })
  }),

  // Logout
  http.post('/api/auth/logout', async () => {
    await delay(200)
    return HttpResponse.json({ success: true, data: null })
  }),

  // Get current user
  http.get('/api/auth/me', async ({ request }) => {
    await delay(300)
    
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token non fourni',
          },
        },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    // Extraire l'ID utilisateur du token mock
    const match = token.match(/mock-jwt-token-(\d+)-/)
    
    if (!match) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token invalide',
          },
        },
        { status: 401 }
      )
    }
    
    const userId = match[1]
    const user = mockUsers.find((u) => u.id === userId)
    
    if (!user) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Utilisateur non trouvé',
          },
        },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: user,
    })
  }),

  // Refresh token
  http.post('/api/auth/refresh', async () => {
    await delay(200)
    
    return HttpResponse.json({
      success: true,
      data: {
        token: `mock-jwt-token-1-${Date.now()}`,
        refreshToken: `mock-refresh-token-1-${Date.now()}`,
      },
    })
  }),

  // Change password
  http.post('/api/auth/change-password', async () => {
    await delay(300)
    
    return HttpResponse.json({
      success: true,
      data: null,
      message: 'Mot de passe modifié avec succès',
    })
  }),

  // Forgot password
  http.post('/api/auth/forgot-password', async () => {
    await delay(500)
    
    return HttpResponse.json({
      success: true,
      data: null,
      message: 'Un email de réinitialisation a été envoyé',
    })
  }),
]



