"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarDays, ChevronLeft, ChevronRight, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ItemChips } from "@/components/item-chips-input"
import { MDBadge, StatusBadge } from "@/components/status-badge"
import { ZoneSection } from "@/components/zone-section"
import { usePlanner } from "@/lib/store"
import { ZONES } from "@/lib/machines"
import {
  WEEKDAY_LABELS,
  formatLong,
  formatMonth,
  monthMatrix,
  parseDayKey,
  today,
} from "@/lib/date"
import { cn } from "@/lib/utils"
import type { SF } from "@/lib/types"

function hasMD(sf: SF): boolean {
  if (!sf.md) return false
  return (sf.md.pieces ?? 0) > 0 || sf.md.items.length > 0 || sf.md.note.trim() !== ""
}

function SheetRow({ sf }: { sf: SF }) {
  return (
    <li className="flex flex-col gap-1 py-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[13px] font-semibold tracking-tight">{sf.number}</span>
        <StatusBadge status={sf.status} />
        {hasMD(sf) && <MDBadge pieces={sf.md?.pieces} />}
      </div>
      {sf.description ? (
        <p className="truncate text-xs leading-tight text-muted-foreground">{sf.description}</p>
      ) : null}
      {sf.readyItems.length > 0 ? <ItemChips items={sf.readyItems} label="Done" /> : null}
    </li>
  )
}

export default function CalendarPage() {
  const { hydrated, countsForDay, sfsForDay, machinesByZone, machineById } = usePlanner()
  const initial = React.useMemo(() => parseDayKey(today()), [])
  const [year, setYear] = React.useState(initial.getFullYear())
  const [month, setMonth] = React.useState(initial.getMonth())
  const [selected, setSelected] = React.useState(today)

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-80 animate-pulse rounded-lg bg-muted" />
        <span className="sr-only">Loading calendar</span>
      </div>
    )
  }

  const cells = monthMatrix(year, month)
  const t = today()
  const daySFs = sfsForDay(selected)
  const pool = daySFs.filter((s) => s.machineId === null || !machineById(s.machineId))
  const selectedCounts = countsForDay(selected)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <CalendarDays className="h-6 w-6" aria-hidden="true" />
          Calendar
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href={`/sheet?day=${selected}`}>
            <Printer className="h-4 w-4" aria-hidden="true" />
            Planning sheet
          </Link>
        </Button>
      </header>

      <section aria-label="Month" className="rounded-lg border border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight">{formatMonth(year, month)}</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                const d = parseDayKey(t)
                setYear(d.getFullYear())
                setMonth(d.getMonth())
                setSelected(t)
              }}
            >
              Today
            </Button>
            <div className="flex items-center rounded-md border border-border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-l-none border-l border-border"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              aria-hidden="true"
            >
              {label}
            </div>
          ))}

          {cells.map((cell) => {
            const c = countsForDay(cell.key)
            const total = c.planned + c.partial + c.ready
            const isSelected = cell.key === selected
            const isToday = cell.key === t
            const dayNum = parseDayKey(cell.key).getDate()

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelected(cell.key)}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                className={cn(
                  "flex min-h-[4.75rem] flex-col gap-1 rounded-md border p-1.5 text-left transition-colors",
                  isSelected
                    ? "border-foreground bg-secondary"
                    : "border-border hover:border-muted-foreground/50 hover:bg-secondary/50",
                  !cell.inMonth && "opacity-40",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-xs",
                    isToday ? "font-bold underline decoration-2 underline-offset-2" : "font-medium",
                  )}
                >
                  {dayNum}
                </span>

                {total === 0 && c.md === 0 ? null : (
                  <span className="flex flex-wrap gap-1">
                    {c.planned > 0 && (
                      <span className="rounded border border-planned/40 bg-planned-muted px-1 font-mono text-[10px] font-semibold leading-tight text-planned-foreground">
                        P{c.planned}
                      </span>
                    )}
                    {c.partial > 0 && (
                      <span className="rounded border border-partial/40 bg-partial-muted px-1 font-mono text-[10px] font-semibold leading-tight text-partial-foreground">
                        ½{c.partial}
                      </span>
                    )}
                    {c.ready > 0 && (
                      <span className="rounded border border-ready/40 bg-ready-muted px-1 font-mono text-[10px] font-semibold leading-tight text-ready-foreground">
                        R{c.ready}
                      </span>
                    )}
                    {c.md > 0 && (
                      <span className="rounded border border-md/40 bg-md-muted px-1 font-mono text-[10px] font-semibold leading-tight text-md-foreground">
                        MD{c.md}
                      </span>
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>
            <strong className="font-semibold">P</strong> Planned
          </span>
          <span>
            <strong className="font-semibold">½</strong> Partially ready
          </span>
          <span>
            <strong className="font-semibold">R</strong> Ready
          </span>
          <span>
            <strong className="font-semibold">MD</strong> To Machining Dept
          </span>
        </p>
      </section>

      <section aria-label="Planning sheet for selected day" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-lg font-semibold tracking-tight">{formatLong(selected)}</h2>
          <p className="flex gap-3 font-mono text-xs text-muted-foreground">
            <span>{selectedCounts.planned} planned</span>
            <span>{selectedCounts.partial} partial</span>
            <span>{selectedCounts.ready} ready</span>
            <span>{selectedCounts.md} to MD</span>
          </p>
        </div>

        {daySFs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
            <p className="text-sm font-medium">No SFs recorded for this day</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick another date, or add SFs from the Production Board.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {ZONES.map((zone) => {
              const machines = machinesByZone(zone.id).filter((m) =>
                daySFs.some((s) => s.machineId === m.id),
              )
              if (machines.length === 0) return null
              return (
                <ZoneSection key={zone.id} label={zone.label}>
                  {machines.map((m) => {
                    const rows = daySFs.filter((s) => s.machineId === m.id)
                    return (
                      <div
                        key={m.id}
                        className="flex w-full flex-col rounded-md border border-border bg-card sm:w-[15.5rem]"
                      >
                        <h3 className="flex items-baseline justify-between gap-2 border-b border-border px-2.5 py-1.5">
                          <span className="text-sm font-semibold tracking-tight">{m.name}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {rows.length}
                          </span>
                        </h3>
                        <ul className="flex flex-col divide-y divide-border px-2.5">
                          {rows.map((sf) => (
                            <SheetRow key={sf.id} sf={sf} />
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </ZoneSection>
              )
            })}

            {pool.length > 0 && (
              <ZoneSection
                label="Unassigned"
                meta={<span className="font-mono">{pool.length} SFs</span>}
              >
                <ul className="flex w-full flex-col divide-y divide-border rounded-md border border-border bg-card px-2.5 sm:w-[15.5rem]">
                  {pool.map((sf) => (
                    <SheetRow key={sf.id} sf={sf} />
                  ))}
                </ul>
              </ZoneSection>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
