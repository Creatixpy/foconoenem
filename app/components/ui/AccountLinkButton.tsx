'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

interface AccountLinkButtonProps {
    className?: string;
    loggedInLabel?: string;
    loggedOutLabel?: string;
}

export default function AccountLinkButton({
    className = 'btn btn-primary',
    loggedInLabel = 'Minha conta',
    loggedOutLabel = 'Começar agora',
}: AccountLinkButtonProps) {
    const { user } = useAuth();

    return (
        <Link
            href={user ? '/conta' : '/auth/register'}
            className={className}
        >
            {user ? loggedInLabel : loggedOutLabel}
        </Link>
    );
}
