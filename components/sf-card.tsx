"use client"

import { CornerDownRight, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ItemChips } from "@/components/item-chips-input"
import { MDBadge, StatusBadge } from "@/components/status-badge"
import { usePlanner } from "@/lib/store"
import { ZONES } from "@/lib/machines"
import { formatShort } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { SF } from "@/lib/types"

function hasMD(sf: SF): boolean {
  if (!sf.md) return false
  return (sf.md.pieces ?? 0) > 0 || sf.md.items.length > 0 || sf.md.note.trim() !== ""
}

function CarriedBadge({ sf }: { sf: SF }) {
  const { state } = usePlanner()
  if (!sf.rolledFromId) return null
  const origin = state.sfs.find((s) => s.id === sf.rolledFromId)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          <CornerDownRight className="h-3 w-3" aria-hidden="true" />
          Carried
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {origin
          ? `Carried forward from ${formatShort(origin.day)}${
              origin.readyItems.length > 0 ? ` — ${origin.readyItems.length} item(s) already done` : ""
            }`
          : "Carried forward from an earlier day"}
      </TooltipContent>
    </Tooltip>
  )
}

function SFActions({ sf, onMarkReady }: { sf: SF; onMarkReady: (sf: SF) => void }) {
  const { dispatch, machinesByZone } = usePlanner()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label={`Actions for SF ${sf.number}`}
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-mono">{sf.number}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {sf.status !== "ready" && (
          <DropdownMenuItem onClick={() => onMarkReady(sf)}>Mark ready…</DropdownMenuItem>
        )}
        {sf.status === "partial" && (
          <DropdownMenuItem onClick={() => dispatch({ type: "COMPLETE_SF", id: sf.id })}>
            Complete SF
          </DropdownMenuItem>
        )}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {sf.machineId ? "Reassign to…" : "Assign to…"}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
            {ZONES.map((zone) => (
              <DropdownMenuGroup key={zone.id}>
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {zone.label}
                </DropdownMenuLabel>
                {machinesByZone(zone.id).map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    disabled={m.id === sf.machineId}
                    onClick={() => dispatch({ type: "ASSIGN_SF", id: sf.id, machineId: m.id })}
                  >
                    {m.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {sf.machineId && (
          <DropdownMenuItem onClick={() => dispatch({ type: "UNASSIGN_SF", id: sf.id })}>
            Move to pool
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => dispatch({ type: "DELETE_SF", id: sf.id })}
        >
          Delete SF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const STATUS_EDGE: Record<SF["status"], string> = {
  planned: "border-l-planned",
  partial: "border-l-partial",
  ready: "border-l-ready",
}

/** Compact row used inside machine tiles. */
export function SFRow({ sf, onMarkReady }: { sf: SF; onMarkReady: (sf: SF) => void }) {
  return (
    <li
      className={cn(
        "flex items-start gap-1.5 border-l-2 bg-card py-1.5 pl-2 pr-0.5",
        STATUS_EDGE[sf.status],
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[13px] font-semibold leading-none tracking-tight">
            {sf.number}
          </span>
          <StatusBadge status={sf.status} />
          {hasMD(sf) && <MDBadge pieces={sf.md?.pieces} />}
          <CarriedBadge sf={sf} />
        </div>
        {sf.description ? (
          <p className="truncate text-xs leading-tight text-muted-foreground">{sf.description}</p>
        ) : null}
        {sf.readyItems.length > 0 ? <ItemChips items={sf.readyItems} label="Done" /> : null}
      </div>
      <SFActions sf={sf} onMarkReady={onMarkReady} />
    </li>
  )
}

/** Wider card used in the unassigned pool. */
export function PoolCard({ sf, onMarkReady }: { sf: SF; onMarkReady: (sf: SF) => void }) {
  return (
    <div className="flex w-full items-start gap-1.5 rounded-md border border-border border-l-2 border-l-muted-foreground/40 bg-card p-2.5 sm:w-64">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-sm font-semibold leading-none tracking-tight">
            {sf.number}
          </span>
          <CarriedBadge sf={sf} />
        </div>
        {sf.description ? (
          <p className="truncate text-xs leading-tight text-muted-foreground">{sf.description}</p>
        ) : null}
      </div>
      <SFActions sf={sf} onMarkReady={onMarkReady} />
    </div>
  )
}
