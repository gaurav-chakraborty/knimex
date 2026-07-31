"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: NavLink[];
  footer?: React.ReactNode;
}

/**
 * Hamburger + slide-in nav for small screens, mirroring the desktop nav
 * that's hidden below `md`. Without this, mobile visitors have no way to
 * reach Pricing/Account from the app or marketing pages.
 */
export default function MobileNav({ links, footer }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden bg-white/5 border-white/10 hover:bg-white/10 rounded-xl"
        >
          <Menu className="w-5 h-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-[#0b1120] border-white/10 text-white w-[80%]">
        <SheetHeader>
          <SheetTitle className="text-white">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="py-3 px-3 rounded-xl text-base font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        {footer && <div className="px-4 mt-auto pb-6 space-y-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
