import type React from "react"

export function ZoneSection({
  label,
  meta,
  children,
}: {
  label: string
  meta?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section aria-label={label} className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </h2>
        {meta ? <div className="shrink-0 text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </section>
  )
}
