import React from 'react';

type BrandTone = 'default' | 'inverse';

type Palette = {
  primary: string;
  muted: string;
  accent: string;
};

const tonePalette: Record<BrandTone, Palette> = {
  default: {
    primary: '#0D1B2A',
    muted: '#94A3B8',
    accent: '#14C99A',
  },
  inverse: {
    primary: '#F8FAFC',
    muted: '#CBD5E1',
    accent: '#2CE1B3',
  },
};

type BrandLogoProps = {
  className?: string;
  tone?: BrandTone;
  title?: string;
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-8 w-auto',
  tone = 'default',
  title = 'GetSoloDesk',
}) => {
  const palette = tonePalette[tone];

  return (
    <svg
      className={className}
      viewBox="0 0 310 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      preserveAspectRatio="xMinYMid meet"
    >
      <title>{title}</title>
      <text
        x="0"
        y="43"
        fill={palette.primary}
        fontFamily="'DM Sans', sans-serif"
        fontSize="46"
        fontWeight="300"
        letterSpacing="-2"
      >
        Get
      </text>

      <text
        x="78"
        y="43"
        fill={palette.primary}
        fontFamily="'DM Sans', sans-serif"
        fontSize="46"
        fontWeight="700"
        letterSpacing="-2"
      >
        Sol
      </text>

      <ellipse
        cx="161"
        cy="31"
        rx="15"
        ry="16.5"
        stroke={palette.primary}
        strokeWidth="3.2"
      />
      <polyline
        points="153,31 159,38.5 170,21"
        stroke={palette.accent}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <text
        x="176"
        y="43"
        fill={palette.primary}
        fontFamily="'DM Sans', sans-serif"
        fontSize="46"
        fontWeight="700"
        letterSpacing="-2"
      >
        Desk
      </text>
    </svg>
  );
};

type BrandMarkProps = {
  className?: string;
  tone?: BrandTone;
  title?: string;
};

export const BrandMark: React.FC<BrandMarkProps> = ({
  className = 'h-8 w-8',
  tone = 'default',
  title = 'GetSoloDesk mark',
}) => {
  const palette = tonePalette[tone];

  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <ellipse cx="32" cy="34" rx="22" ry="24" stroke={palette.primary} strokeWidth="3.4" />
      <polyline
        points="21,34 29,43 44,25"
        stroke={palette.accent}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
