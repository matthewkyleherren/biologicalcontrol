import {clerkMiddleware, createRouteMatcher} from '@clerk/nextjs/server'

/** Browser pages that need a Clerk session. API auth is Bearer JWT in Hono. */
const isProtectedPage = createRouteMatcher([
  // Add private app pages here as they land (e.g. /me, /chat)
])

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return
  }
  if (isProtectedPage(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
