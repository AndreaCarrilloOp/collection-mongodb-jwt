import { reactive } from 'vue'

// La interfaz puede consultar la expiración del JWT; la firma siempre se valida en el servidor.
function tokenIsCurrent(token) {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

let storedUser = null
try { storedUser = JSON.parse(sessionStorage.getItem('user') || 'null') } catch { /* sesión dañada */ }
const storedToken = sessionStorage.getItem('jwt') || ''
const validStoredSession = tokenIsCurrent(storedToken) && Boolean(storedUser)
if (!validStoredSession) {
  sessionStorage.removeItem('jwt')
  sessionStorage.removeItem('user')
}

const nativeFetch = window.fetch.bind(window)
let verifiedToken = ''

export const session = reactive({
  token: validStoredSession ? storedToken : '',
  user: validStoredSession ? storedUser : null
})

export function isAuthenticated() {
  if (tokenIsCurrent(session.token) && session.user) return true
  logout()
  return false
}

export function loginSession(data) {
  if (!tokenIsCurrent(data.token) || !data.user) throw new Error('El servidor no devolvió una sesión válida')
  verifiedToken = data.token
  session.token = data.token
  session.user = data.user
  sessionStorage.setItem('jwt', data.token)
  sessionStorage.setItem('user', JSON.stringify(data.user))
}

export function logout() {
  verifiedToken = ''
  session.token = ''
  session.user = null
  sessionStorage.removeItem('jwt')
  sessionStorage.removeItem('user')
}

// Tras recargar la página, verificar el JWT en el servidor antes de mostrar el catálogo.
export async function verifySession() {
  if (!isAuthenticated()) return false
  if (verifiedToken === session.token) return true
  const token = session.token
  try {
    const response = await nativeFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) { logout(); return false }
    const data = await response.json()
    if (session.token !== token || !data.user) return false
    session.user = data.user
    sessionStorage.setItem('user', JSON.stringify(data.user))
    verifiedToken = token
    return true
  } catch {
    logout()
    return false
  }
}

// El token se adjunta de manera automática a todos los recursos del servicio.
export function installApiAuthentication(router) {
  const originalFetch = nativeFetch
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url
    const path = new URL(url, window.location.origin).pathname
    if (!path.startsWith('/api/')) return originalFetch(input, init)

    const publicAuthEndpoint = path === '/api/auth/login' || path === '/api/auth/register'
    const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined))
    if (!publicAuthEndpoint && isAuthenticated()) headers.set('Authorization', `Bearer ${session.token}`)
    const response = await originalFetch(input, { ...init, headers })

    if (response.status === 401 && !publicAuthEndpoint) {
      logout()
      if (router.currentRoute.value.name !== 'login') {
        const redirect = router.currentRoute.value.fullPath
        await router.replace({ name: 'login', query: { redirect } })
      }
    }
    return response
  }
}
