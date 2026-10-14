import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { PERAN, bolehAkses, aturanUntuk } from '@/lib/akses'

export async function proxy(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const alihkan = (tujuan) => {
    const hasil = NextResponse.redirect(new URL(tujuan, request.url))
    // bawa cookie sesi yang mungkin baru diperbarui
    response.cookies.getAll().forEach((c) => hasil.cookies.set(c))
    return hasil
  }

  const { pathname } = request.nextUrl
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return pathname === '/login' ? response : alihkan('/login')
  }
  if (pathname === '/login') return response

  const { data: profil, error } = await supabase
    .from('admin_profile')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) console.error('Gagal membaca peran:', error)

  const peran = profil?.role
  const punyaPeran = Object.values(PERAN).includes(peran)

  if (!punyaPeran) {
    return pathname === '/tanpa-akses' ? response : alihkan('/tanpa-akses')
  }
  if (pathname === '/tanpa-akses') return alihkan('/')

  const aturan = aturanUntuk(pathname)
  if (aturan && !bolehAkses(peran, aturan)) return alihkan('/')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}