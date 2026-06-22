import { useId } from 'react';

type AprovIALogoProps = {
  size?: 'sm' | 'md' | 'lg';
  hideSymbol?: boolean;
  className?: string;
};

const SIZES = {
  sm: { symbol: 'h-7 w-7', wordmark: 'text-lg' },
  md: { symbol: 'h-9 w-9', wordmark: 'text-2xl' },
  lg: { symbol: 'h-12 w-12', wordmark: 'text-3xl' },
} as const;

export default function AprovIALogo({
  size = 'md',
  hideSymbol = false,
  className = '',
}: AprovIALogoProps) {
  const gradientId = `aprovia-logo-${useId().replaceAll(':', '')}`;
  const dimensions = SIZES[size];

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      {!hideSymbol ? (
        <svg
          className={`${dimensions.symbol} shrink-0`}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="7" y1="7" x2="41" y2="41" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--brand)" />
              <stop offset="1" stopColor="var(--ai)" />
            </linearGradient>
          </defs>
          <path
            d="M24 3.5 41.75 13.75v20.5L24 44.5 6.25 34.25v-20.5L24 3.5Z"
            fill={`url(#${gradientId})`}
          />
          <path
            d="m15.75 24.25 5.25 5.5 11.75-12"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      <span
        className={`${dimensions.wordmark} font-display font-extrabold leading-none tracking-[-0.04em] text-[var(--text)]`}
        aria-label="AprovIA"
      >
        <span aria-hidden="true">Aprov</span>
        <span className="text-[var(--ai)]" aria-hidden="true">IA</span>
      </span>
    </span>
  );
}
