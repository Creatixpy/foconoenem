'use client';

type CookiePreferencesButtonProps = {
  className?: string;
};

export default function CookiePreferencesButton({ className }: CookiePreferencesButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event('fne:open-cookie-preferences'))}
    >
      Preferências de cookies
    </button>
  );
}
