import { logger } from "@/lib/logger";
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { getSubscriptionAccessState } from '@/lib/subscription-access'
import { isAdminUser, IS_DIGIMYTCH_TALENT_HUB } from '@/lib/digimytch-config'
import { isAdminRoute, isCandidateRoute } from '@/lib/admin-routes'
import {
  getAuthTimeoutForRequest,
  getAuthUserWithTimeout,
  hasSupabaseAuthCookieFromRequest,
  isDataPassthroughRequest,
  isPublicAppRoute,
} from '@/lib/supabase-resilience'
import { getSupabaseAnonKeySafe, getSupabaseUrlSafe } from '@/lib/supabase-url'

const DEBUG = process.env.DEBUG_MIDDLEWARE === '1'

// Routes available on the free plan (auth still required)
const SUBSCRIPTION_EXEMPT_ROUTES = [
  '/home',
  '/profile',
  '/resumes',
  '/jobs',
  '/formations',
  '/candidatures',
  '/entretiens',
  '/linkedin',
  '/settings',
  '/admin',
  '/subscription',
  '/start-trial',
  '/subscription/checkout',
  '/subscription/checkout-return',
  '/auth',
  '/api',
]

function isSubscriptionExemptRoute(pathname: string): boolean {
  return SUBSCRIPTION_EXEMPT_ROUTES.some(route => pathname.startsWith(route))
}

function missingSupabaseConfigResponse(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname
  if (isPublicAppRoute(pathname)) {
    const response = NextResponse.next()
    response.headers.set('x-supabase-status', 'misconfigured')
    return response
  }
  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.searchParams.set('config', 'supabase')
  return NextResponse.redirect(url)
}

async function updateSessionInner(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname
  const digimytch = IS_DIGIMYTCH_TALENT_HUB
  const isPassthrough = isDataPassthroughRequest(request)
  const hasAuthCookie = hasSupabaseAuthCookieFromRequest(request)

  const supabaseUrl = getSupabaseUrlSafe()
  const anonKey = getSupabaseAnonKeySafe()
  if (!supabaseUrl || !anonKey) {
    if (DEBUG) {
      logger.warn('[middleware] Supabase env missing on', pathname)
    }
    return missingSupabaseConfigResponse(request)
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        supabaseResponse = NextResponse.next({
          request: { headers: request.headers },
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const useFastSessionAuth = digimytch || isPassthrough

  let user: User | null = null
  let unavailable = false

  try {
    if (useFastSessionAuth) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      user = session?.user ?? null
    } else {
      const result = await getAuthUserWithTimeout(
        () => supabase.auth.getUser(),
        getAuthTimeoutForRequest(request)
      )
      user = result.user
      unavailable = result.unavailable
    }
  } catch (error) {
    unavailable = true
    if (DEBUG) {
      logger.warn('[middleware] Supabase auth error:', error)
    }
  }

  // Connecté : redirection immédiate / → /home ou /admin (sans charger la landing)
  if (pathname === '/') {
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = digimytch && isAdminUser(user) ? '/admin' : '/home'
      return NextResponse.redirect(url)
    }
    if (hasAuthCookie && unavailable) {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      url.searchParams.set('offline', '1')
      return NextResponse.redirect(url)
    }
  }

  if (unavailable && (isPublicAppRoute(pathname) || hasAuthCookie)) {
    if (DEBUG) logger.warn('Supabase unreachable — allowing request:', pathname)
    supabaseResponse.headers.set('x-supabase-status', 'unavailable')
    return supabaseResponse
  }

  supabaseResponse.cookies.set('show-banner', 'false')

  // Server Actions / RSC / HMR flight: never redirect to HTML (causes "Failed to fetch").
  if (isPassthrough) {
    if (unavailable) {
      supabaseResponse.headers.set('x-supabase-status', 'unavailable')
    }
    if (!user && !hasAuthCookie && !isPublicAppRoute(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (!user) {
    if (isPublicAppRoute(pathname)) {
      return supabaseResponse
    }
    if (unavailable && hasAuthCookie) {
      supabaseResponse.headers.set('x-supabase-status', 'unavailable')
      return supabaseResponse
    }
    // API routes must never receive an HTML redirect — return JSON 401 so
    // non-browser clients (CLI, extensions, fetch()) get a proper error shape.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (digimytch) {
    const admin = isAdminUser(user)
    if (admin) {
      if (isCandidateRoute(pathname)) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
    } else if (isAdminRoute(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (!isSubscriptionExemptRoute(pathname)) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('subscription_plan, stripe_subscription_id, subscription_status, current_period_end, trial_end')
      .eq('user_id', user.id)
      .maybeSingle()

    const subscriptionState = getSubscriptionAccessState(subscription)
    const hasProtectedRouteAccess = subscriptionState.hasProAccess

    if (!hasProtectedRouteAccess) {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  try {
    return await updateSessionInner(request)
  } catch (error) {
    logger.error('[middleware] unhandled error:', error)
    const pathname = request.nextUrl.pathname
    if (isPublicAppRoute(pathname)) {
      return NextResponse.next()
    }
    return new NextResponse('Service temporairement indisponible.', { status: 503 })
  }
}
