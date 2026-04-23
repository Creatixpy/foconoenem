import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { MAX_PLAN_CODE } from '@/lib/constants/subscriptions';
import { createAdminClient } from '@/lib/db/server';
import { handleApiError } from '@/lib/security';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import { getStripe } from '@/lib/server/stripe';
import {
  ensureStripeCustomerForUser,
  getMaxSubscriptionPriceId,
  getUserSubscription,
  hasMaxPlanAccess,
  savePendingSubscriptionCheckout,
} from '@/lib/server/subscriptions';

function isStripeCheckoutPaymentMethodError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes('No valid payment method types for this Checkout Session')
  );
}

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
    const rateResult = await checkRateLimit(auth.userId || ip, '/api/assinatura/checkout', 5, 1);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em instantes.' },
        { status: 429 }
      );
    }

    const stripe = getStripe();
    const existingSubscription = await getUserSubscription(adminClient, auth.userId);
    if (existingSubscription && hasMaxPlanAccess(existingSubscription)) {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura Max ativa.' },
        { status: 409 }
      );
    }

    if (
      existingSubscription?.latest_checkout_session_id &&
      existingSubscription.latest_checkout_expires_at &&
      new Date(existingSubscription.latest_checkout_expires_at).getTime() > Date.now()
    ) {
      const openSession = await stripe.checkout.sessions.retrieve(
        existingSubscription.latest_checkout_session_id
      );
      if (openSession.url && openSession.status === 'open') {
        return NextResponse.json({
          url: openSession.url,
          sessionId: openSession.id,
          reused: true,
        });
      }
    }

    const stripeCustomerId = await ensureStripeCustomerForUser(
      adminClient,
      auth.user,
      existingSubscription
    );

    const origin = request.nextUrl.origin;
    let session;
    try {
      session = await stripe.checkout.sessions.create(
        {
          mode: 'subscription',
          customer: stripeCustomerId,
          client_reference_id: auth.userId,
          success_url: `${origin}/conta?subscription=success`,
          cancel_url: `${origin}/conta?subscription=canceled`,
          allow_promotion_codes: true,
          payment_method_types: ['card'],
          line_items: [
            {
              price: getMaxSubscriptionPriceId(),
              quantity: 1,
            },
          ],
          metadata: {
            plan_code: MAX_PLAN_CODE,
            supabase_user_id: auth.userId,
            source: 'app/conta',
          },
          subscription_data: {
            metadata: {
              plan_code: MAX_PLAN_CODE,
              supabase_user_id: auth.userId,
            },
          },
        },
        {
          idempotencyKey: randomUUID(),
        }
      );
    } catch (error) {
      if (isStripeCheckoutPaymentMethodError(error)) {
        return NextResponse.json(
          {
            error: 'Checkout indisponível',
            message:
              'Os métodos de pagamento do Stripe ainda não estão prontos para esta assinatura. Tente novamente em instantes.',
          },
          { status: 503 }
        );
      }

      throw error;
    }

    if (!session.url) {
      throw new Error('Stripe não retornou URL de checkout para a assinatura.');
    }

    await savePendingSubscriptionCheckout(adminClient, {
      userId: auth.userId,
      stripeCustomerId,
      stripePriceId: getMaxSubscriptionPriceId(),
      checkoutSessionId: session.id,
      checkoutExpiresAt: session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
      metadata: {
        latest_checkout_source: 'subscription_checkout',
        latest_checkout_mode: 'subscription',
        latest_checkout_url: session.url,
        latest_checkout_created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
