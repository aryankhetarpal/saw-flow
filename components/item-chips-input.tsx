"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"

/**
 * Free-text item numbers entered as chips. Comma or Enter commits.
 * There is no upfront item list for an SF, so this never shows a total.
 */
export function ItemChipsInput({
  value,
  onChange,
  placeholder = "e.g. 101, 102",
  id,
}: {
  value: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  id?: string
}) {
  const [draft, setDraft] = React.useState("")

  function commit(raw: string) {
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length === 0) return
    onChange(Array.from(new Set([...value, ...parts])))
    setDraft("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Enter can confirm CJK IME composition — don't treat that as a commit.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      commit(draft)
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        id={id}
        value={draft}
        onChange={(e) => {
          const v = e.target.value
          if (v.includes(",")) commit(v)
          else setDraft(v)
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        placeholder={placeholder}
        className="font-mono text-sm"
        inputMode="numeric"
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(value.filter((i) => i !== item))}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label={`Remove item ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Read-only chip list used across Ready, MD and the printed sheet. */
export function ItemChips({ items, label }: { items: string[]; label?: string }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1">
      {label ? (
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      ) : null}
      {items.map((item) => (
        <span
          key={item}
          className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] leading-tight"
        >
          {item}
        </span>
      ))}
    </div>
  )
}
