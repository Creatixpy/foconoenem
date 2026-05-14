import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/lib/db/server';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import {
  buildFreeSubscriptionSummary,
  getUserSubscription,
  toSubscriptionSummary,
} from '@/lib/server/subscriptions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const originError = ensureTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
        subscription: buildFreeSubscriptionSummary(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'Serviço de assinatura indisponível.' },
      { status: 500 }
    );
  }

  const subscription = await getUserSubscription(adminClient, user.id);

  return NextResponse.json(
    {
      authenticated: true,
      subscription: toSubscriptionSummary(subscription),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
