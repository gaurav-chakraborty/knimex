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
          className="md:hidden bg-background/80 border-border text-foreground hover:bg-accent rounded-xl"
        >
          <Menu className="w-5 h-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-popover border-border text-popover-foreground w-[80%]">
        <SheetHeader>
          <SheetTitle className="text-popover-foreground">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="py-3 px-3 rounded-xl text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
