"use client"

import * as React from "react"
import { Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SFRow } from "@/components/sf-card"
import { usePlanner } from "@/lib/store"
import type { Machine, SF } from "@/lib/types"

function MachineName({ machine }: { machine: Machine }) {
  const { dispatch } = usePlanner()
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(machine.name)

  React.useEffect(() => setDraft(machine.name), [machine.name])

  function commit() {
    const name = draft.trim()
    if (name && name !== machine.name) {
      dispatch({ type: "RENAME_MACHINE", id: machine.id, name })
    } else {
      setDraft(machine.name)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return
          if (e.key === "Enter") commit()
          if (e.key === "Escape") {
            setDraft(machine.name)
            setEditing(false)
          }
        }}
        className="h-6 px-1 py-0 text-sm font-semibold"
        aria-label={`Rename ${machine.name}`}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group flex min-w-0 items-center gap-1 text-left"
      aria-label={`Rename ${machine.name}`}
    >
      <span className="truncate text-sm font-semibold tracking-tight">{machine.name}</span>
      <Pencil
        className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
    </button>
  )
}

export function MachineTile({
  machine,
  sfs,
  onMarkReady,
}: {
  machine: Machine
  sfs: SF[]
  onMarkReady: (sf: SF) => void
}) {
  const readyCount = sfs.filter((s) => s.status === "ready").length

  return (
    <div className="flex w-full flex-col rounded-md border border-border bg-card sm:w-[15.5rem]">
      <div className="flex items-center justify-between gap-2 border-b border-border px-2.5 py-1.5">
        <MachineName machine={machine} />
        <span
          className="shrink-0 font-mono text-[11px] text-muted-foreground"
          title={`${readyCount} ready of ${sfs.length} on tile`}
        >
          {readyCount}/{sfs.length}
        </span>
      </div>

      {sfs.length === 0 ? (
        <p className="px-2.5 py-3 text-xs text-muted-foreground">No SFs</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {sfs.map((sf) => (
            <SFRow key={sf.id} sf={sf} onMarkReady={onMarkReady} />
          ))}
        </ul>
      )}
    </div>
  )
}
