import Link from "next/link";
import { useId } from "react";

import { appPath } from "@/lib/app-path";

interface FileXLogoProps {
  variant?: "full" | "standard" | "icon";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  linkToHome?: boolean;
  className?: string;
}

const iconSizeMap = {
  xs: 22,
  sm: 26,
  md: 36,
  lg: 48,
  xl: 112,
} as const;

const standardTitleClassMap = {
  xs: "text-sm",
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-5xl",
} as const;

const eyebrowClassMap = {
  xs: "text-[7px]",
  sm: "text-[8px]",
  md: "text-[9px]",
  lg: "text-[10px]",
  xl: "text-xs",
} as const;

const taglineClassMap = {
  xs: "text-[8px]",
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-xs",
  xl: "text-sm",
} as const;

const gapClassMap = {
  xs: "gap-2",
  sm: "gap-2.5",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-5",
} as const;

function FileXGlyph({
  size,
  label,
}: {
  size: number;
  label?: string;
}) {
  const id = useId().replace(/:/g, "");
  const frameGradientId = `${id}-frame`;
  const panelGradientId = `${id}-panel`;
  const sheetGradientId = `${id}-sheet`;
  const accentGradientId = `${id}-accent`;
  const glowGradientId = `${id}-glow`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <defs>
        <linearGradient id={frameGradientId} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5EEBFF" />
          <stop offset="0.55" stopColor="#5B8CFF" />
          <stop offset="1" stopColor="#C8F86A" />
        </linearGradient>
        <linearGradient id={panelGradientId} x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#09111F" />
          <stop offset="1" stopColor="#13243C" />
        </linearGradient>
        <linearGradient id={sheetGradientId} x1="18" y1="16" x2="44" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8FCFF" />
          <stop offset="1" stopColor="#D7E7FF" />
        </linearGradient>
        <linearGradient id={accentGradientId} x1="16" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5EEBFF" />
          <stop offset="1" stopColor="#5B8CFF" />
        </linearGradient>
        <linearGradient id={glowGradientId} x1="30" y1="30" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C8F86A" />
          <stop offset="1" stopColor="#5EEBFF" />
        </linearGradient>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${panelGradientId})`} />
      <rect x="4.75" y="4.75" width="54.5" height="54.5" rx="17.25" stroke={`url(#${frameGradientId})`} strokeOpacity="0.55" strokeWidth="1.5" />

      <path
        d="M22 14H37L46 23V44C46 47.3137 43.3137 50 40 50H22C18.6863 50 16 47.3137 16 44V20C16 16.6863 18.6863 14 22 14Z"
        fill={`url(#${sheetGradientId})`}
      />
      <path d="M37 14V21C37 23.2091 38.7909 25 41 25H46" fill={`url(#${accentGradientId})`} fillOpacity="0.18" />
      <path d="M37 14V21C37 23.2091 38.7909 25 41 25H46" stroke="#EAF7FF" strokeWidth="2.2" strokeLinejoin="round" />

      <rect x="20" y="22" width="14" height="3" rx="1.5" fill={`url(#${accentGradientId})`} />
      <rect x="20" y="28" width="11" height="3" rx="1.5" fill={`url(#${accentGradientId})`} opacity="0.92" />
      <rect x="20" y="34" width="8" height="3" rx="1.5" fill={`url(#${accentGradientId})`} opacity="0.84" />

      <path d="M32 34L44 46" stroke={`url(#${accentGradientId})`} strokeWidth="4.25" strokeLinecap="round" />
      <path d="M44 34L32 46" stroke={`url(#${glowGradientId})`} strokeWidth="4.25" strokeLinecap="round" />

      <circle cx="47.5" cy="16.5" r="2.5" fill="#C8F86A" fillOpacity="0.9" />
    </svg>
  );
}

export default function FileXLogo({
  variant = "standard",
  size = "md",
  linkToHome = true,
  className = "",
}: FileXLogoProps) {
  const iconSize = iconSizeMap[size];

  const content =
    variant === "icon" ? (
      <span className={`inline-flex items-center justify-center ${className}`} role="img" aria-label="FileX by KNIMEX">
        <FileXGlyph size={iconSize} />
      </span>
    ) : variant === "full" ? (
      <div className={`inline-flex flex-col items-start ${gapClassMap[size]} ${className}`}>
        <FileXGlyph size={iconSizeMap[size] + (size === "xl" ? 28 : size === "lg" ? 12 : 6)} />
        <div className="space-y-2">
          <p className={`${eyebrowClassMap[size]} font-mono font-semibold uppercase tracking-[0.28em] text-muted-foreground`}>
            KNIMEX PRIVACY WORKSPACE
          </p>
          <div className="space-y-1">
            <p className={`${standardTitleClassMap[size]} font-black uppercase leading-none tracking-[0.22em] text-transparent bg-clip-text bg-filex-gradient`}>
              FileX
            </p>
            <p className={`${taglineClassMap[size]} max-w-sm font-medium tracking-[0.16em] text-muted-foreground uppercase`}>
              Beyond the file. Own your metadata.
            </p>
          </div>
        </div>
      </div>
    ) : (
      <div className={`inline-flex items-center ${gapClassMap[size]} ${className}`}>
        <FileXGlyph size={iconSize} />
        <div className="flex flex-col">
          <span className={`${eyebrowClassMap[size]} font-mono font-semibold uppercase tracking-[0.28em] text-muted-foreground`}>
            KNIMEX
          </span>
          <span className={`${standardTitleClassMap[size]} font-black uppercase leading-none tracking-[0.18em] text-transparent bg-clip-text bg-filex-gradient`}>
            FileX
          </span>
        </div>
      </div>
    );

  if (!linkToHome) {
    return content;
  }

  return (
    <Link href={appPath("/")} className="inline-flex hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
}
