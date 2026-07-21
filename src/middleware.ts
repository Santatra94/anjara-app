import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Exclure : assets Next, favicon, images, ET fichiers PWA (sw, workbox, manifest)
    '/((?!_next/static|_next/image|favicon.ico|sw.js|sw.js.map|workbox-.*\\.js|workbox-.*\\.js.map|manifest.json|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};