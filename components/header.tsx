"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Analyzer" },
  { href: "/decks", label: "Decks", disabled: true },
  { href: "/about", label: "About", disabled: true },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/70 backdrop-blur bg-background/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Commander Stats
          </Link>
          <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent-foreground">
            Beta
          </span>
        </div>
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                pathname === item.href && "text-foreground",
                item.disabled && "cursor-not-allowed opacity-50",
              )}
              aria-disabled={item.disabled}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="secondary">Import Deck</Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
