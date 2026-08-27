"use client"

import * as React from "react"
import { CheckCircle2, CircleDashed } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { ItemChipsInput } from "@/components/item-chips-input"
import { usePlanner } from "@/lib/store"
import type { SF } from "@/lib/types"
import { nextPlanningDay, formatShort } from "@/lib/date"

export function ReadyDialog({
  sf,
  open,
  onOpenChange,
}: {
  sf: SF | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch, machineById } = usePlanner()
  const [mode, setMode] = React.useState<"whole" | "items">("whole")
  const [items, setItems] = React.useState<string[]>([])
  const [mdPieces, setMdPieces] = React.useState("")
  const [mdItems, setMdItems] = React.useState<string[]>([])
  const [mdNote, setMdNote] = React.useState("")

  // Reset the form whenever a different SF is opened.
  React.useEffect(() => {
    if (open && sf) {
      setMode("whole")
      setItems([])
      setMdPieces(sf.md?.pieces != null ? String(sf.md.pieces) : "")
      setMdItems(sf.md?.items ?? [])
      setMdNote(sf.md?.note ?? "")
    }
  }, [open, sf])

  if (!sf) return null

  const machine = machineById(sf.machineId)
  const piecesNum = mdPieces.trim() === "" ? null : Number(mdPieces)
  const hasMD = (piecesNum != null && piecesNum > 0) || mdItems.length > 0 || mdNote.trim() !== ""
  const canSubmit = mode === "whole" || items.length > 0

  function submit() {
    if (!canSubmit) return
    dispatch({
      type: "MARK_READY",
      id: sf.id,
      whole: mode === "whole",
      items,
      md: hasMD
        ? { pieces: piecesNum != null && piecesNum > 0 ? piecesNum : null, items: mdItems, note: mdNote.trim() }
        : null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-baseline gap-2">
            <span>Mark ready</span>
            <span className="font-mono text-base font-semibold">{sf.number}</span>
          </DialogTitle>
          <DialogDescription>
            {machine ? `On ${machine.name}` : "Unassigned"}
            {sf.description ? ` — ${sf.description}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {sf.readyItems.length > 0 && (
            <div className="rounded-md border border-partial/40 bg-partial-muted p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-partial-foreground">
                Already logged ready
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {sf.readyItems.map((i) => (
                  <span
                    key={i}
                    className="rounded border border-partial/40 bg-background px-1.5 py-0.5 font-mono text-xs"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold">What is ready?</legend>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "whole" | "items")}>
              <div className="flex items-start gap-2.5 rounded-md border border-border p-3 has-[:checked]:border-ready has-[:checked]:bg-ready-muted">
                <RadioGroupItem value="whole" id="mode-whole" className="mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="mode-whole" className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-ready" aria-hidden="true" />
                    Whole SF
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Everything is done. The SF closes and will not carry over.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-md border border-border p-3 has-[:checked]:border-partial has-[:checked]:bg-partial-muted">
                <RadioGroupItem value="items" id="mode-items" className="mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="mode-items" className="flex items-center gap-1.5 font-medium">
                    <CircleDashed className="h-4 w-4 text-partial" aria-hidden="true" />
                    Specific item numbers
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    The rest carries over to {formatShort(nextPlanningDay(sf.day))} for reassignment.
                  </span>
                </div>
              </div>
            </RadioGroup>

            {mode === "items" && (
              <div className="flex flex-col gap-1.5 pl-1">
                <Label htmlFor="ready-items" className="text-xs font-medium">
                  Item numbers ready now
                </Label>
                <ItemChipsInput id="ready-items" value={items} onChange={setItems} />
                <p className="text-xs text-muted-foreground">Type a number and press Enter or comma.</p>
              </div>
            )}
          </fieldset>

          <Separator />

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold">
              Going to MD <span className="font-normal text-muted-foreground">(optional)</span>
            </legend>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="md-pieces" className="text-xs font-medium">
                Pieces to Machining Department
              </Label>
              <Input
                id="md-pieces"
                type="number"
                min={0}
                value={mdPieces}
                onChange={(e) => setMdPieces(e.target.value)}
                placeholder="0"
                className="w-32 font-mono text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="md-items" className="text-xs font-medium">
                Item numbers to MD
              </Label>
              <ItemChipsInput id="md-items" value={mdItems} onChange={setMdItems} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="md-note" className="text-xs font-medium">
                Note
              </Label>
              <Input
                id="md-note"
                value={mdNote}
                onChange={(e) => setMdNote(e.target.value)}
                placeholder="Anything the MD team should know"
                className="text-sm"
              />
            </div>
          </fieldset>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!canSubmit}>
            {mode === "whole" ? "Mark whole SF ready" : `Log ${items.length || ""} item${items.length === 1 ? "" : "s"} ready`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
