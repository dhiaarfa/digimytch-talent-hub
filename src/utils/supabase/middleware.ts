import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSubscriptionAccessState } from '@/lib/subscription-access'
import { isDigimytchTalentHub } from '@/lib/digimytch-config'
import { getAuthUserWithTimeout, isPublicAppRoute } from '@/lib/supabase-resilience'

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
  '/settings',
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

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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

  const { user, unavailable: supabaseUnavailable } = await getAuthUserWithTimeout(() =>
    supabase.auth.getUser()
  )

  if (supabaseUnavailable && isPublicAppRoute(pathname)) {
    if (DEBUG) console.warn('Supabase unreachable — public route:', pathname)
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

  if (!user) {
    if (isPublicAppRoute(pathname)) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (digimytch) {
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
