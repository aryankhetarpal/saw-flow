"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, CornerDownRight, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateSwitcher } from "@/components/date-switcher"
import { ItemChips } from "@/components/item-chips-input"
import { MDBadge, StatusBadge } from "@/components/status-badge"
import { ZoneSection } from "@/components/zone-section"
import { usePlanner } from "@/lib/store"
import { ZONES } from "@/lib/machines"
import { formatShort, nextPlanningDay, today } from "@/lib/date"
import type { SF } from "@/lib/types"

function hasMD(sf: SF): boolean {
  if (!sf.md) return false
  return (sf.md.pieces ?? 0) > 0 || sf.md.items.length > 0 || sf.md.note.trim() !== ""
}

function ReadyCard({ sf }: { sf: SF }) {
  const { dispatch } = usePlanner()
  const partial = sf.status === "partial"

  return (
    <div
      className={`flex w-full flex-col gap-2 rounded-md border border-border border-l-2 bg-card p-3 sm:w-72 ${
        partial ? "border-l-partial" : "border-l-ready"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-sm font-semibold tracking-tight">{sf.number}</span>
        <StatusBadge status={sf.status} />
        {hasMD(sf) && <MDBadge pieces={sf.md?.pieces} />}
      </div>

      {sf.description ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{sf.description}</p>
      ) : null}

      {partial ? (
        <div className="flex flex-col gap-1.5">
          <ItemChips items={sf.readyItems} label="Ready items" />
          <p className="flex items-start gap-1 text-[11px] leading-tight text-muted-foreground">
            <CornerDownRight className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            Remainder carries to {formatShort(nextPlanningDay(sf.day))}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 self-start text-xs"
            onClick={() => dispatch({ type: "COMPLETE_SF", id: sf.id })}
          >
            Complete SF
          </Button>
        </div>
      ) : (
        sf.readyItems.length > 0 && <ItemChips items={sf.readyItems} label="Items" />
      )}

      {hasMD(sf) && (
        <div className="rounded border border-md/40 bg-md-muted p-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-md-foreground">
            To Machining Dept
          </p>
          <div className="mt-1 flex flex-col gap-1">
            {sf.md?.pieces ? (
              <span className="font-mono text-xs">{sf.md.pieces} pcs</span>
            ) : null}
            {sf.md && sf.md.items.length > 0 ? <ItemChips items={sf.md.items} /> : null}
            {sf.md?.note ? (
              <p className="text-xs leading-tight text-muted-foreground">{sf.md.note}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReadyPage() {
  const { hydrated, readyForDay, machinesByZone, machineById } = usePlanner()
  const [day, setDay] = React.useState(today)

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
        <span className="sr-only">Loading ready list</span>
      </div>
    )
  }

  const readySFs = readyForDay(day)
  const unassigned = readySFs.filter((s) => s.machineId === null || !machineById(s.machineId))
  const partialCount = readySFs.filter((s) => s.status === "partial").length
  const fullCount = readySFs.filter((s) => s.status === "ready").length

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <CheckCircle2 className="h-6 w-6 text-ready" aria-hidden="true" />
            Ready
          </h1>
          <DateSwitcher day={day} onChange={setDay} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <dl className="flex items-center gap-4 text-sm">
            <div className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Fully ready
              </dt>
              <dd className="font-mono text-lg font-semibold text-ready-foreground">{fullCount}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Partial</dt>
              <dd className="font-mono text-lg font-semibold text-partial-foreground">
                {partialCount}
              </dd>
            </div>
          </dl>
          <Button asChild variant="outline" size="sm">
            <Link href={`/sheet?day=${day}`}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              Planning sheet
            </Link>
          </Button>
        </div>
      </header>

      {readySFs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-12 text-center">
          <p className="text-sm font-medium">Nothing ready yet for this day</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mark SFs ready from the Production Board and they will appear here, grouped by machine.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/">Go to Board</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {ZONES.map((zone) => {
            const machines = machinesByZone(zone.id).filter((m) =>
              readySFs.some((s) => s.machineId === m.id),
            )
            if (machines.length === 0) return null
            const zoneTotal = machines.reduce(
              (n, m) => n + readySFs.filter((s) => s.machineId === m.id).length,
              0,
            )
            return (
              <ZoneSection
                key={zone.id}
                label={zone.label}
                meta={<span className="font-mono">{zoneTotal} SFs</span>}
              >
                {machines.map((m) => {
                  const list = readySFs.filter((s) => s.machineId === m.id)
                  return (
                    <div key={m.id} className="flex w-full flex-col gap-2 sm:w-72">
                      <h3 className="flex items-baseline justify-between gap-2 border-b border-border pb-1">
                        <span className="text-sm font-semibold tracking-tight">{m.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {list.length}
                        </span>
                      </h3>
                      <div className="flex flex-col gap-2">
                        {list.map((sf) => (
                          <ReadyCard key={sf.id} sf={sf} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </ZoneSection>
            )
          })}

          {unassigned.length > 0 && (
            <ZoneSection
              label="No machine recorded"
              meta={<span className="font-mono">{unassigned.length} SFs</span>}
            >
              {unassigned.map((sf) => (
                <ReadyCard key={sf.id} sf={sf} />
              ))}
            </ZoneSection>
          )}
        </div>
      )}
    </div>
  )
}
