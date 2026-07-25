import { NextRequest, NextResponse } from 'next/server';

/**
 * Daraja STK callback — logs payload. Wire to tip status updates when DB is ready.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.info('[M-Pesa callback]', JSON.stringify(body));
  } catch {
    console.warn('[M-Pesa callback] non-JSON body');
  }
  // Always ACK so Safaricom does not retry aggressively
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
