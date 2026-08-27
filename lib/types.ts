export type Zone = "32T" | "25T" | "16T" | "5T"

export type Machine = {
  id: string
  name: string
  zone: Zone
  order: number
}

export type SFStatus = "planned" | "partial" | "ready"

export type MDInfo = {
  pieces: number | null
  items: string[]
  note: string
}

export type SF = {
  id: string
  number: string
  description: string
  /** "YYYY-MM-DD", built from local date parts only */
  day: string
  /** null = sitting in the unassigned pool */
  machineId: string | null
  status: SFStatus
  /** item numbers logged as ready (free text, no upfront total) */
  readyItems: string[]
  md: MDInfo | null
  rolledFromId: string | null
  rolledToId: string | null
  createdAt: number
  readyAt: number | null
}

export type PlannerState = {
  machines: Machine[]
  sfs: SF[]
}
