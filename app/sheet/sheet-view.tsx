"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, CircleDashed, Clock, ChevronDown, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateSwitcher } from "@/components/date-switcher"
import { usePlanner } from "@/lib/store"
import { ZONES } from "@/lib/machines"
import { formatLong, today } from "@/lib/date"
import type { SF, SFStatus } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

function hasMD(sf: SF): boolean {
  if (!sf.md) return false
  return (sf.md.pieces ?? 0) > 0 || sf.md.items.length > 0 || sf.md.note.trim() !== ""
}

/**
 * Print rows use borders and glyph markers rather than fills, so the sheet stays
 * legible on a mono laser printer where background colors are dropped.
 */
const STATUS_OPTIONS: Array<{ value: SFStatus; label: string; icon: typeof Clock; className: string }> = [
  {
    value: "planned",
    label: "Planned",
    icon: Clock,
    className: "bg-planned-muted text-planned-foreground border-planned/40",
  },
  {
    value: "partial",
    label: "Partial",
    icon: CircleDashed,
    className: "bg-partial-muted text-partial-foreground border-partial/40",
  },
  {
    value: "ready",
    label: "Ready",
    icon: CheckCircle2,
    className: "bg-ready-muted text-ready-foreground border-ready/40",
  },
]

function StatusControl({ sf, onChange }: { sf: SF; onChange: (status: SFStatus) => void }) {
  const current = STATUS_OPTIONS.find((option) => option.value === sf.status) ?? STATUS_OPTIONS[0]
  const Icon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={`Change status for SF ${sf.number}`}
        title={`Change status — currently ${current.label}`}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring print:hidden",
          current.className,
        )}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        {current.label}
        <ChevronDown className="ml-0.5 h-3 w-3" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-[112px]">
        {STATUS_OPTIONS.map((option) => {
          const OptionIcon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => onChange(option.value)}
              className={cn(
                "gap-2 font-medium",
                option.value === sf.status && "bg-accent",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  option.className,
                )}
              >
                <OptionIcon className="h-3 w-3" aria-hidden="true" />
                {option.label}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SheetLine({ sf, onStatusChange }: { sf: SF; onStatusChange: (status: SFStatus) => void }) {
  const marker = sf.status === "ready" ? "✓" : sf.status === "partial" ? "½" : "○"

  return (
    <li className="flex items-start gap-1.5 border-b border-sheet-line py-[3px] last:border-b-0">
      <span
        className="mt-[1px] hidden w-3 shrink-0 text-center font-mono text-[10px] font-bold leading-tight print:inline"
        title={sf.status}
      >
        {marker}
      </span>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-mono text-[11px] font-bold tracking-tight">{sf.number}</span>
          <StatusControl sf={sf} onChange={onStatusChange} />
          {sf.description ? (
            <span className="truncate text-[10px] text-sheet-dim">{sf.description}</span>
          ) : null}
        </div>
        {sf.readyItems.length > 0 && (
          <span className="font-mono text-[9.5px] text-sheet-dim">
            done: {sf.readyItems.join(", ")}
          </span>
        )}
        {hasMD(sf) && (
          <span className="font-mono text-[9.5px] font-semibold">
            MD
            {sf.md?.pieces ? ` ${sf.md.pieces}pcs` : ""}
            {sf.md && sf.md.items.length > 0 ? ` · ${sf.md.items.join(", ")}` : ""}
            {sf.md?.note ? ` · ${sf.md.note}` : ""}
          </span>
        )}
      </div>
    </li>
  )
}

/** Blank ruled lines so an empty machine can be filled in by hand on paper. */
function BlankSlots({ count = 3 }: { count?: number }) {
  return (
    <ul aria-hidden="true" className="flex flex-col">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="h-[15px] border-b border-sheet-line last:border-b-0" />
      ))}
    </ul>
  )
}

export function SheetView() {
  const params = useSearchParams()
  const { hydrated, sfsForDay, machinesByZone, machineById, countsForDay, dispatch } = usePlanner()
  const [day, setDay] = React.useState(() => params.get("day") ?? today())

  if (!hydrated) {
    return (
      <div className="h-64 animate-pulse rounded-lg bg-muted" aria-busy="true">
        <span className="sr-only">Loading planning sheet</span>
      </div>
    )
  }

  const daySFs = sfsForDay(day)
  const pool = daySFs.filter((s) => s.machineId === null || !machineById(s.machineId))
  const counts = countsForDay(day)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Planning Sheet</h1>
          <DateSwitcher day={day} onChange={setDay} />
        </div>
        <Button type="button" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print / Save PDF
        </Button>
      </div>

      <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground print:hidden">
        Prints as a single landscape A4 page with all machines, including empty ones as blank
        write-in slots. Choose “Landscape” in the print dialog if your browser does not pick it up
        automatically.
      </p>

      {/* The printable artifact */}
      <div className="sheet rounded-lg border border-border bg-card p-4 print:rounded-none print:border-0 print:p-0">
        <header className="mb-2 flex items-end justify-between gap-4 border-b-2 border-sheet-ink pb-1.5">
          <div className="flex flex-col">
            <h2 className="text-[15px] font-bold uppercase tracking-[0.08em]">
              Sawing Planning Sheet
            </h2>
            <p className="text-[11px] text-sheet-dim">{formatLong(day)}</p>
          </div>
          <dl className="flex gap-3 font-mono text-[10px]">
            <div className="flex gap-1">
              <dt className="text-sheet-dim">Planned</dt>
              <dd className="font-bold">{counts.planned}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-sheet-dim">Partial</dt>
              <dd className="font-bold">{counts.partial}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-sheet-dim">Ready</dt>
              <dd className="font-bold">{counts.ready}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-sheet-dim">MD</dt>
              <dd className="font-bold">{counts.md}</dd>
            </div>
          </dl>
        </header>

        <p className="mb-2 font-mono text-[9.5px] text-sheet-dim">
          ○ planned · ½ partially ready · ✓ ready · MD = to Machining Dept
        </p>

        <div className="flex flex-col gap-2">
          {ZONES.map((zone) => {
            const machines = machinesByZone(zone.id)
            return (
              <section key={zone.id} className="sheet-zone">
                <h3 className="mb-1 border-b border-sheet-ink pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                  {zone.label}
                </h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-5 print:grid-cols-5">
                  {machines.map((m) => {
                    // The sheet is a full record: partials appear here even though
                    // they have left the live machine tile on the Board.
                    const rows = daySFs.filter((s) => s.machineId === m.id)
                    return (
                      <div key={m.id} className="sheet-cell flex flex-col">
                        <h4 className="flex items-baseline justify-between gap-1 border-b border-sheet-ink pb-[1px]">
                          <span className="truncate text-[11px] font-bold tracking-tight">
                            {m.name}
                          </span>
                          {rows.length > 0 ? (
                            <span className="font-mono text-[9px] text-sheet-dim">
                              {rows.length}
                            </span>
                          ) : null}
                        </h4>
                        {rows.length === 0 ? (
                          <BlankSlots />
                        ) : (
                          <ul className="flex flex-col">
                            {rows.map((sf) => (
                              <SheetLine
                                key={sf.id}
                                sf={sf}
                                onStatusChange={(status) =>
                                  dispatch({
                                    type: "UPDATE_SF",
                                    id: sf.id,
                                    patch: { status, readyAt: status === "ready" ? Date.now() : sf.readyAt },
                                  })
                                }
                              />
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {pool.length > 0 && (
            <section className="sheet-zone">
              <h3 className="mb-1 border-b border-sheet-ink pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                Unassigned
              </h3>
              <div className="grid grid-cols-2 gap-x-3 sm:grid-cols-3 lg:grid-cols-5 print:grid-cols-5">
                <div className="sheet-cell flex flex-col">
                  <ul className="flex flex-col">
                    {pool.map((sf) => (
                      <SheetLine
                                key={sf.id}
                                sf={sf}
                                onStatusChange={(status) =>
                                  dispatch({
                                    type: "UPDATE_SF",
                                    id: sf.id,
                                    patch: { status, readyAt: status === "ready" ? Date.now() : sf.readyAt },
                                  })
                                }
                              />
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </div>

        <footer className="mt-2 flex justify-between border-t border-sheet-ink pt-1 font-mono text-[9px] text-sheet-dim">
          <span>Supervisor _______________</span>
          <span>Shift _______</span>
          <span>Printed {formatLong(today())}</span>
        </footer>
      </div>
    </div>
  )
}
