import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/server';
import { handleApiError } from '@/lib/security';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import { getStripe } from '@/lib/server/stripe';
import { getUserSubscription } from '@/lib/server/subscriptions';

export async function POST(request: NextRequest) {
  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) {
      return originError;
    }

    const auth = await resolveRequestUserFromCookies({ requireEmailConfirmed: true });
    if ('error' in auth) {
      return auth.error;
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Serviço de assinatura indisponível.' },
        { status: 500 }
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateResult = await checkRateLimit(auth.userId || ip, '/api/assinatura/portal', 10, 1);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em instantes.' },
        { status: 429 }
      );
    }

    const subscription = await getUserSubscription(adminClient, auth.userId);
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura encontrada para gerenciamento.' },
        { status: 404 }
      );
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/conta`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
