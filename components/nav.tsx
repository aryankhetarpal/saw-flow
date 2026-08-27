"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, CheckCircle2, LayoutGrid, Printer, Settings2, Truck } from "lucide-react"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/", label: "Board", icon: LayoutGrid },
  { href: "/ready", label: "Ready", icon: CheckCircle2 },
  { href: "/md", label: "MD", icon: Truck },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/sheet", label: "Sheet", icon: Printer },
  { href: "/machines", label: "Machines", icon: Settings2 },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur print:hidden">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-[11px] font-bold tracking-tight text-background"
          >
            SF
          </span>
          <span className="text-sm font-semibold tracking-tight">Sawing Planner</span>
        </Link>

        <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
