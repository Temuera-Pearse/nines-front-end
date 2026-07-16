import { FRONTEND_AUTH_ENABLED, PUBLIC_VIEWER_MODE } from './features'

const DISABLED_ROUTE_PREFIXES = [
  '/login',
  '/register',
  '/signup',
  '/callback',
  '/account',
  '/profile',
  '/settings',
  '/wallet',
  '/bets',
  '/history',
  '/transactions',
  '/deposit',
  '/withdraw',
  '/admin',
]

function normalisePathname(pathname: string): string {
  const clean = pathname.trim().toLowerCase()
  if (!clean || clean === '/') return '/'
  return clean.endsWith('/') ? clean.slice(0, -1) : clean
}

export function isDisabledFrontendRoute(pathname: string): boolean {
  const path = normalisePathname(pathname)
  return DISABLED_ROUTE_PREFIXES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  )
}

export function redirectDisabledFrontendRoute(): boolean {
  if (FRONTEND_AUTH_ENABLED && !PUBLIC_VIEWER_MODE) return false
  if (!isDisabledFrontendRoute(window.location.pathname)) return false

  window.history.replaceState({}, document.title, '/')
  return true
}
