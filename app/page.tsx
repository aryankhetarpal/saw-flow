"use client"

import * as React from "react"
import Link from "next/link"
import { Inbox, Plus, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateSwitcher } from "@/components/date-switcher"
import { MachineTile } from "@/components/machine-tile"
import { PoolCard } from "@/components/sf-card"
import { ReadyDialog } from "@/components/ready-dialog"
import { ZoneSection } from "@/components/zone-section"
import { usePlanner } from "@/lib/store"
import { ZONES } from "@/lib/machines"
import { today } from "@/lib/date"
import type { SF } from "@/lib/types"

const POOL = "__pool__"

export default function BoardPage() {
  const { hydrated, dispatch, machinesByZone, poolForDay, sfsOnMachine, countsForDay } = usePlanner()
  const [day, setDay] = React.useState(today)
  const [number, setNumber] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [machineId, setMachineId] = React.useState<string>(POOL)
  const [readyTarget, setReadyTarget] = React.useState<SF | null>(null)

  function addSF(e: React.FormEvent) {
    e.preventDefault()
    if (!number.trim()) return
    dispatch({
      type: "ADD_SF",
      number,
      description,
      day,
      machineId: machineId === POOL ? null : machineId,
    })
    setNumber("")
    setDescription("")
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
        <span className="sr-only">Loading planner</span>
      </div>
    )
  }

  const pool = poolForDay(day)
  const counts = countsForDay(day)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Production Board</h1>
          <DateSwitcher day={day} onChange={setDay} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <dl className="flex items-center gap-4 text-sm">
            <div className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Planned</dt>
              <dd className="font-mono text-lg font-semibold text-planned-foreground">
                {counts.planned}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Partial</dt>
              <dd className="font-mono text-lg font-semibold text-partial-foreground">
                {counts.partial}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Ready</dt>
              <dd className="font-mono text-lg font-semibold text-ready-foreground">
                {counts.ready}
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

      <form
        onSubmit={addSF}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3"
      >
        <div className="flex min-w-[9rem] flex-col gap-1.5">
          <Label htmlFor="sf-number" className="text-xs font-medium">
            SF number
          </Label>
          <Input
            id="sf-number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="SF-1042"
            className="font-mono text-sm"
            required
          />
        </div>

        <div className="flex min-w-[14rem] flex-1 flex-col gap-1.5">
          <Label htmlFor="sf-desc" className="text-xs font-medium">
            Description / part name
          </Label>
          <Input
            id="sf-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            className="text-sm"
          />
        </div>

        <div className="flex min-w-[12rem] flex-col gap-1.5">
          <Label htmlFor="sf-machine" className="text-xs font-medium">
            Machine
          </Label>
          <Select value={machineId} onValueChange={setMachineId}>
            <SelectTrigger id="sf-machine" className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={POOL}>Unassigned pool</SelectItem>
              {ZONES.map((zone) => (
                <SelectGroup key={zone.id}>
                  <SelectLabel>{zone.label}</SelectLabel>
                  {machinesByZone(zone.id).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add SF
        </Button>
      </form>

      <section
        aria-label="Unassigned pool"
        className="rounded-lg border border-dashed border-border bg-muted/30 p-3"
      >
        <div className="mb-2.5 flex items-center gap-2">
          <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Unassigned pool
          </h2>
          <span className="font-mono text-xs text-muted-foreground">{pool.length}</span>
        </div>
        {pool.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nothing waiting. SFs added without a machine — and anything carried over from a previous
            day — land here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {pool.map((sf) => (
              <PoolCard key={sf.id} sf={sf} onMarkReady={setReadyTarget} />
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-4">
        {ZONES.map((zone) => {
          const machines = machinesByZone(zone.id)
          const zoneCount = machines.reduce((n, m) => n + sfsOnMachine(day, m.id).length, 0)
          return (
            <ZoneSection
              key={zone.id}
              label={zone.label}
              meta={
                <span className="font-mono">
                  {machines.length} machines · {zoneCount} SFs
                </span>
              }
            >
              {machines.map((m) => (
                <MachineTile
                  key={m.id}
                  machine={m}
                  sfs={sfsOnMachine(day, m.id)}
                  onMarkReady={setReadyTarget}
                />
              ))}
            </ZoneSection>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Partly-finished SFs move off the machine tile to the Ready page, and the remainder returns to
        the unassigned pool on the next working day.
      </p>

      <ReadyDialog
        sf={readyTarget}
        open={readyTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReadyTarget(null)
        }}
      />
    </div>
  )
}
