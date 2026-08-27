import { CheckCircle2, CircleDashed, Clock, Truck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SFStatus } from "@/lib/types"

const CONFIG: Record<SFStatus, { label: string; icon: typeof Clock; className: string }> = {
  planned: {
    label: "Planned",
    icon: Clock,
    className: "bg-planned-muted text-planned-foreground border-planned/40",
  },
  partial: {
    label: "Partial",
    icon: CircleDashed,
    className: "bg-partial-muted text-partial-foreground border-partial/40",
  },
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    className: "bg-ready-muted text-ready-foreground border-ready/40",
  },
}

/** Status always pairs an icon with a text label so it never relies on color. */
export function StatusBadge({ status, className }: { status: SFStatus; className?: string }) {
  const { label, icon: Icon, className: tone } = CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  )
}

export function MDBadge({ pieces, className }: { pieces?: number | null; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded border border-md/40 bg-md-muted px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-md-foreground",
        className,
      )}
    >
      <Truck className="h-3 w-3" aria-hidden="true" />
      MD
      {pieces != null && pieces > 0 ? <span className="font-mono">{pieces}</span> : null}
    </span>
  )
}
