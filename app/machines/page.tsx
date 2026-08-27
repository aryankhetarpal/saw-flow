"use client"

import * as React from "react"
import { Plus, RotateCcw, Settings2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { usePlanner } from "@/lib/store"
import { ZONES } from "@/lib/machines"
import type { Machine, Zone } from "@/lib/types"

function MachineRow({ machine, usage }: { machine: Machine; usage: number }) {
  const { dispatch } = usePlanner()
  const [draft, setDraft] = React.useState(machine.name)

  React.useEffect(() => setDraft(machine.name), [machine.name])

  function commit() {
    const name = draft.trim()
    if (name && name !== machine.name) {
      dispatch({ type: "RENAME_MACHINE", id: machine.id, name })
    } else {
      setDraft(machine.name)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return
          if (e.key === "Enter") {
            commit()
            e.currentTarget.blur()
          }
          if (e.key === "Escape") {
            setDraft(machine.name)
            e.currentTarget.blur()
          }
        }}
        className="h-8 text-sm font-medium"
        aria-label={`Machine name, currently ${machine.name}`}
      />
      <span
        className="w-14 shrink-0 font-mono text-[11px] text-muted-foreground"
        title={`${usage} SFs recorded on this machine`}
      >
        {usage} SF{usage === 1 ? "" : "s"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => dispatch({ type: "REMOVE_MACHINE", id: machine.id })}
        aria-label={`Remove ${machine.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function MachinesPage() {
  const { hydrated, state, dispatch, machinesByZone } = usePlanner()
  const [newName, setNewName] = React.useState("")
  const [newZone, setNewZone] = React.useState<Zone>("32T")

  function addMachine(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    dispatch({ type: "ADD_MACHINE", zone: newZone, name: newName })
    setNewName("")
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-80 animate-pulse rounded-lg bg-muted" />
        <span className="sr-only">Loading machines</span>
      </div>
    )
  }

  const usageFor = (id: string) => state.sfs.filter((s) => s.machineId === id).length

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings2 className="h-6 w-6" aria-hidden="true" />
          Machines
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Rename any machine to match the shop floor. Names are saved in this browser and used across
          the Board, Ready, MD and printed sheet. Removing a machine returns its SFs to the
          unassigned pool.
        </p>
      </header>

      <form
        onSubmit={addMachine}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3"
      >
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
          <Label htmlFor="new-machine" className="text-xs font-medium">
            New machine name
          </Label>
          <Input
            id="new-machine"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. K13"
            className="text-sm"
            required
          />
        </div>
        <div className="flex min-w-[10rem] flex-col gap-1.5">
          <Label htmlFor="new-zone" className="text-xs font-medium">
            Zone
          </Label>
          <Select value={newZone} onValueChange={(v) => setNewZone(v as Zone)}>
            <SelectTrigger id="new-zone" className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZONES.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add machine
        </Button>
      </form>

      <div className="flex flex-col gap-4">
        {ZONES.map((zone) => {
          const machines = machinesByZone(zone.id)
          return (
            <section
              key={zone.id}
              aria-label={zone.label}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="mb-2.5 flex items-baseline justify-between gap-3 border-b border-border pb-2">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {zone.label}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {machines.length} machines
                </span>
              </div>
              {machines.length === 0 ? (
                <p className="text-xs text-muted-foreground">No machines in this zone.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {machines.map((m) => (
                    <MachineRow key={m.id} machine={m} usage={usageFor(m.id)} />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-sm font-medium">Reset to the original floor layout</p>
          <p className="text-xs text-muted-foreground">
            Restores the 30 machines from the shop-floor sketch. Custom names and added machines are
            lost; SFs are kept.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => dispatch({ type: "RESET_MACHINES" })}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset machines
        </Button>
      </div>
    </div>
  )
}
