import { NextResponse } from 'next/server'

/**
 * Safely parse JSON from a Request body.
 * Returns the parsed object or a 400 NextResponse if the body is malformed.
 */
export async function safeJson<T = unknown>(
  req: Request
): Promise<T | NextResponse> {
  try {
    return (await req.json()) as T
  } catch {
    return NextResponse.json(
      { error: 'Invalid or missing JSON body' },
      { status: 400 }
    )
  }
}

/** Type guard — true when safeJson returned an error response */
export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse
}
