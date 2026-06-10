import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSubscriptionAccessState } from '@/lib/subscription-access'
import { isAdminUser, isDigimytchTalentHub } from '@/lib/digimytch-config'
import { isAdminRoute, isCandidateRoute } from '@/lib/admin-routes'
import {
  getAuthTimeoutForRequest,
  getAuthUserWithTimeout,
  hasSupabaseAuthCookieFromRequest,
  isDataPassthroughRequest,
  isPublicAppRoute,
} from '@/lib/supabase-resilience'
import { getSupabaseUrl } from '@/lib/supabase-url'

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

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const digimytch = isDigimytchTalentHub()
  const isPassthrough = isDataPassthroughRequest(request)
  const hasAuthCookie = hasSupabaseAuthCookieFromRequest(request)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const useFastSessionAuth = digimytch || isPassthrough;

  const { user, unavailable } = useFastSessionAuth
    ? await (async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        return { user: session?.user ?? null, unavailable: false };
      })()
    : await getAuthUserWithTimeout(
        () => supabase.auth.getUser(),
        getAuthTimeoutForRequest(request)
      );

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
    if (DEBUG) console.warn('Supabase unreachable — allowing request:', pathname)
    supabaseResponse.headers.set('x-supabase-status', 'unavailable')
    return supabaseResponse
  }

  const requestHeaders = new Headers(request.headers)

  supabaseResponse = NextResponse.next({
    request: {
      ...request,
      headers: requestHeaders,
    },
  })

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
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (digimytch) {
    const admin = isAdminUser(user);
    if (admin) {
      if (isCandidateRoute(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    } else if (isAdminRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
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
