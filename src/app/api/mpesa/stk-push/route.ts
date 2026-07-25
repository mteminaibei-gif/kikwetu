import { NextRequest, NextResponse } from 'next/server';

/**
 * M-Pesa STK Push (Daraja).
 * Requires MPESA_* env vars. Without them returns 503 so the client can fall back to manual till entry.
 */
export async function POST(req: NextRequest) {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  const env = process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox';

  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
    return NextResponse.json(
      {
        configured: false,
        error: 'M-Pesa is not configured. Use manual till payment.',
      },
      { status: 503 },
    );
  }

  let body: { amount?: number; phone?: string; accountReference?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount < 10) {
    return NextResponse.json({ error: 'Amount must be at least KES 10' }, { status: 400 });
  }

  // Normalize Kenyan MSISDN → 2547XXXXXXXX
  let phone = String(body.phone || '').replace(/\s+/g, '');
  if (phone.startsWith('+')) phone = phone.slice(1);
  if (phone.startsWith('0')) phone = '254' + phone.slice(1);
  if (phone.startsWith('7') || phone.startsWith('1')) phone = '254' + phone;
  if (!/^254\d{9}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone. Use 07XXXXXXXX or 2547XXXXXXXX' }, { status: 400 });
  }

  const base =
    env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

  try {
    const tokenRes = await fetch(
      `${base}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        },
      },
    );
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      console.error('[M-Pesa] token error', t);
      return NextResponse.json({ error: 'Failed to authenticate with M-Pesa' }, { status: 502 });
    }
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const stkRes = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: (body.accountReference || 'KikwetuTip').slice(0, 12),
        TransactionDesc: (body.description || 'KikwetuConnect tip').slice(0, 13),
      }),
    });

    const stkJson = await stkRes.json();
    if (!stkRes.ok || stkJson.ResponseCode !== '0') {
      console.error('[M-Pesa] STK error', stkJson);
      return NextResponse.json(
        { error: stkJson.errorMessage || stkJson.ResponseDescription || 'STK push failed' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      configured: true,
      checkoutRequestId: stkJson.CheckoutRequestID,
      merchantRequestId: stkJson.MerchantRequestID,
      customerMessage: stkJson.CustomerMessage,
    });
  } catch (e) {
    console.error('[M-Pesa] exception', e);
    return NextResponse.json({ error: 'M-Pesa request failed' }, { status: 502 });
  }
}
