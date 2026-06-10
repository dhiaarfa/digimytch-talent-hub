import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (webhook endpoints)
     * - api/jobs/clip (Chrome extension Bearer auth)
     * - image files (svg, png, jpg, etc.)
     * Run on all other routes to protect them
     */
    '/((?!_next|favicon.ico|api/webhooks|api/openrouter|api/jobs/clip|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
