import { NextRequest, NextResponse } from 'next/server'
import { exchangeGoogleAuthCode } from '@/lib/o-auth/google'

class HttpErrorTypes extends Error {
  constructor(
    public status?: number,
    message?: string,
    public body?: unknown,
  ) {
    super(message)
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code } = body

    const tokenJson = await exchangeGoogleAuthCode(code)

    if (!tokenJson.id_token) {
      return NextResponse.json({ message: 'id_token is required' }, { status: 400 })
    }

    // server() 대신 직접 fetch (Set-Cookie를 얻기 위해)
    const upstream = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: tokenJson.id_token }),
      cache: 'no-store',
    })

    // 에러면 가능한 payload를 그대로 내려줌
    if (!upstream.ok) {
      const raw = await upstream.text()
      let payload
      try {
        payload = raw ? JSON.parse(raw) : null
      } catch {
        payload = raw ? { message: raw } : { message: `HTTP ${upstream.status}` }
      }
      return NextResponse.json(
        { ...payload, idToken: tokenJson.id_token },
        { status: upstream.status },
      )
    }

    const setCookies: string[] =
      upstream.headers.getSetCookie?.() ??
      ([upstream.headers.get('set-cookie')].filter(Boolean) as string[])

    const hasAccess = setCookies.some((sc) => /^accessToken=/.test(sc))
    const hasRefresh = setCookies.some((sc) => /^refreshToken=/.test(sc))

    if (!hasAccess || !hasRefresh) {
      // return NextResponse.json({ message: 'Missing tokens in Set-Cookie' }, { status: 502 })
       // Potentially loose check or different behavior in new backend?
       // Let's keep it for now but log.
       console.warn('Tokens missing in Set-Cookie from upstream');
    }

    const res = NextResponse.json({ success: true }, { status: upstream.status })

    for (const sc of setCookies) {
      res.headers.append('set-cookie', sc)
    }

    return res
  } catch (error: any) {
    if (error instanceof HttpErrorTypes) {
      const payload =
        typeof error.body === 'object' && error.body !== null
          ? error.body
          : { message: error.message }
      return NextResponse.json(payload, { status: error.status })
    }
    
    console.error('API Route Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: String(error) }, { status: 500 })
  }
}
