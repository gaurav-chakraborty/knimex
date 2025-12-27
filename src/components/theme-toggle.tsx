"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="border-white/20 bg-white/5 hover:bg-white/10"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-105"
    >
      {theme === "light" ? (
        <Moon className="h-[1.2rem] w-[1.2rem] text-slate-900 transition-all" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-400 transition-all rotate-0 scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
