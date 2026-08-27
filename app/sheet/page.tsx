import { Suspense } from "react"
import { SheetView } from "./sheet-view"

export default function SheetPage() {
  return (
    <Suspense
      fallback={
        <div className="h-64 animate-pulse rounded-lg bg-muted" aria-busy="true">
          <span className="sr-only">Loading planning sheet</span>
        </div>
      }
    >
      <SheetView />
    </Suspense>
  )
}
