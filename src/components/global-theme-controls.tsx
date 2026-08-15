"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";

export default function GlobalThemeControls() {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90] sm:right-6 sm:top-6">
      <div className="pointer-events-auto rounded-full border border-border/80 bg-background/90 p-1 shadow-lg shadow-black/10 backdrop-blur-xl">
        <ThemeSwitcher />
      </div>
    </div>
  );
}

export { GlobalThemeControls };
