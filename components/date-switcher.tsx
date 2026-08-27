"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addDays, formatLong, today } from "@/lib/date"

export function DateSwitcher({
  day,
  onChange,
  className,
}: {
  day: string
  onChange: (day: string) => void
  className?: string
}) {
  const isToday = day === today()

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={() => onChange(addDays(day, -1))}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-l-none border-l border-border"
            onClick={() => onChange(addDays(day, 1))}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">{formatLong(day)}</span>
          <span className="font-mono text-[11px] leading-tight text-muted-foreground">{day}</span>
        </div>

        {!isToday && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onChange(today())}
          >
            Today
          </Button>
        )}
      </div>
    </div>
  )
}
