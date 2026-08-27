"use client"

import * as React from "react"
import Link from "next/link"
import { Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateSwitcher } from "@/components/date-switcher"
import { ItemChips } from "@/components/item-chips-input"
import { StatusBadge } from "@/components/status-badge"
import { ZoneSection } from "@/components/zone-section"
import { usePlanner } from "@/lib/store"
import { ZONES } from "@/lib/machines"
import { today } from "@/lib/date"
import type { SF } from "@/lib/types"

function MDCard({ sf }: { sf: SF }) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border border-l-2 border-l-md bg-card p-3 sm:w-72">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-sm font-semibold tracking-tight">{sf.number}</span>
        <StatusBadge status={sf.status} />
      </div>

      {sf.description ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{sf.description}</p>
      ) : null}

      <dl className="flex flex-col gap-1.5">
        {sf.md?.pieces ? (
          <div className="flex items-baseline gap-1.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Pieces
            </dt>
            <dd className="font-mono text-sm font-semibold">{sf.md.pieces}</dd>
          </div>
        ) : null}
        {sf.md && sf.md.items.length > 0 ? (
          <div className="flex flex-col gap-1">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Item numbers
            </dt>
            <dd>
              <ItemChips items={sf.md.items} />
            </dd>
          </div>
        ) : null}
        {sf.md?.note ? (
          <div className="flex flex-col gap-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Note
            </dt>
            <dd className="text-xs leading-relaxed">{sf.md.note}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

export default function MDPage() {
  const { hydrated, mdForDay, machinesByZone, machineById } = usePlanner()
  const [day, setDay] = React.useState(today)

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
        <span className="sr-only">Loading MD list</span>
      </div>
    )
  }

  const list = mdForDay(day)
  const totalPieces = list.reduce((n, s) => n + (s.md?.pieces ?? 0), 0)
  const unassigned = list.filter((s) => s.machineId === null || !machineById(s.machineId))

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Truck className="h-6 w-6 text-md" aria-hidden="true" />
            Machining Department
          </h1>
          <DateSwitcher day={day} onChange={setDay} />
        </div>
        <dl className="flex items-center gap-4 text-sm">
          <div className="flex flex-col">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              SFs routed
            </dt>
            <dd className="font-mono text-lg font-semibold text-md-foreground">{list.length}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Total pieces
            </dt>
            <dd className="font-mono text-lg font-semibold text-md-foreground">{totalPieces}</dd>
          </div>
        </dl>
      </header>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-12 text-center">
          <p className="text-sm font-medium">Nothing going to MD for this day</p>
          <p className="mt-1 text-xs text-muted-foreground">
            MD details are captured when you mark an SF ready on the Board.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/ready">View Ready</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {ZONES.map((zone) => {
            const machines = machinesByZone(zone.id).filter((m) =>
              list.some((s) => s.machineId === m.id),
            )
            if (machines.length === 0) return null
            const zonePieces = machines.reduce(
              (n, m) =>
                n +
                list
                  .filter((s) => s.machineId === m.id)
                  .reduce((sum, s) => sum + (s.md?.pieces ?? 0), 0),
              0,
            )
            return (
              <ZoneSection
                key={zone.id}
                label={zone.label}
                meta={<span className="font-mono">{zonePieces} pcs</span>}
              >
                {machines.map((m) => {
                  const rows = list.filter((s) => s.machineId === m.id)
                  return (
                    <div key={m.id} className="flex w-full flex-col gap-2 sm:w-72">
                      <h3 className="flex items-baseline justify-between gap-2 border-b border-border pb-1">
                        <span className="text-sm font-semibold tracking-tight">{m.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {rows.length}
                        </span>
                      </h3>
                      <div className="flex flex-col gap-2">
                        {rows.map((sf) => (
                          <MDCard key={sf.id} sf={sf} />
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
                <MDCard key={sf.id} sf={sf} />
              ))}
            </ZoneSection>
          )}
        </div>
      )}
    </div>
  )
}
