"use client";

import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";

type AccountLinkButtonProps = {
  className?: string;
  loggedOutLabel?: string;
  loggedInLabel?: string;
  loggedOutHref?: string;
  loggedInHref?: string;
  prefetch?: boolean;
};

export default function AccountLinkButton({
  className = "",
  loggedOutLabel = "Criar minha conta",
  loggedInLabel = "Ir para minha conta",
  loggedOutHref = "/auth/register",
  loggedInHref = "/conta",
  prefetch,
}: AccountLinkButtonProps) {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  const label = isAuthenticated ? loggedInLabel : loggedOutLabel;
  const href = isAuthenticated ? loggedInHref : loggedOutHref;

  return (
    <Link href={href} className={className} prefetch={prefetch}>
      {label}
    </Link>
  );
}
