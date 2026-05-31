import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, fetchContaData } from '@/lib/server/conta';
import { handleApiError } from '@/lib/security';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const originError = ensureTrustedOrigin(request);
        if (originError) {
            return originError;
        }

        const userId = await getAuthenticatedUserId();

        if (!userId) {
            // Sentinel Security: Use standardized 401 response
            return NextResponse.json(
                { error: 'Unauthorized Access' },
                { status: 401 }
            );
        }

        const data = await fetchContaData(userId);

        // Sentinel Security: Ensure no sensitive fields (like password hashes) are accidentally leaked in `data`.
        // Assuming fetchContaData returns a clean object, but a DTO mapping here would be ideal in a full audit.

        return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        // Sentinel Security: Blind Error Handling
        return handleApiError(error);
    }
}
