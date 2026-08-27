"use client"

import * as React from "react"
import { SEED_MACHINES, ZONES } from "./machines"
import { isBefore, nextPlanningDay, today } from "./date"
import type { MDInfo, Machine, PlannerState, SF, Zone } from "./types"

const STORAGE_KEY = "sawing-planner:v1"

const initialState: PlannerState = { machines: SEED_MACHINES, sfs: [] }

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

type Action =
  | { type: "HYDRATE"; state: PlannerState }
  | { type: "ADD_SF"; number: string; description: string; day: string; machineId: string | null }
  | { type: "ASSIGN_SF"; id: string; machineId: string }
  | { type: "UNASSIGN_SF"; id: string }
  | { type: "MARK_READY"; id: string; whole: boolean; items: string[]; md: MDInfo | null }
  | { type: "COMPLETE_SF"; id: string }
  | { type: "UPDATE_SF"; id: string; patch: Partial<SF> }
  | { type: "DELETE_SF"; id: string }
  | { type: "RENAME_MACHINE"; id: string; name: string }
  | { type: "ADD_MACHINE"; zone: Zone; name: string }
  | { type: "REMOVE_MACHINE"; id: string }
  | { type: "RESET_MACHINES" }

/**
 * Merge stored machines with the seed, keyed on id so user renames always win.
 * Never keys on index or name.
 */
function mergeMachines(stored: Machine[]): Machine[] {
  const byId = new Map(stored.map((m) => [m.id, m]))
  const merged: Machine[] = stored.map((m) => ({ ...m }))
  for (const seed of SEED_MACHINES) {
    if (!byId.has(seed.id)) merged.push({ ...seed })
  }
  return merged
}

/**
 * Any SF on a PAST day that is not fully ready spawns a continuation on its
 * next planning day, dropped into the unassigned pool for reassignment.
 * Idempotent via rolledToId, so reloads and multiple tabs cannot duplicate.
 */
function reconcileRollovers(state: PlannerState): PlannerState {
  const t = today()
  const pending = state.sfs.filter(
    (sf) => isBefore(sf.day, t) && sf.status !== "ready" && sf.rolledToId === null,
  )
  if (pending.length === 0) return state

  const sfs = state.sfs.map((s) => ({ ...s }))
  const index = new Map(sfs.map((s) => [s.id, s]))

  for (const original of pending) {
    const target = index.get(original.id)
    if (!target) continue
    const continuation: SF = {
      id: uid(),
      number: original.number,
      description: original.description,
      day: nextPlanningDay(original.day),
      machineId: null,
      status: "planned",
      readyItems: [],
      md: null,
      rolledFromId: original.id,
      rolledToId: null,
      createdAt: Date.now(),
      readyAt: null,
    }
    target.rolledToId = continuation.id
    sfs.push(continuation)
  }

  return { ...state, sfs }
}

function reducer(state: PlannerState, action: Action): PlannerState {
  switch (action.type) {
    case "HYDRATE":
      return action.state

    case "ADD_SF": {
      const sf: SF = {
        id: uid(),
        number: action.number.trim(),
        description: action.description.trim(),
        day: action.day,
        machineId: action.machineId,
        status: "planned",
        readyItems: [],
        md: null,
        rolledFromId: null,
        rolledToId: null,
        createdAt: Date.now(),
        readyAt: null,
      }
      return { ...state, sfs: [...state.sfs, sf] }
    }

    case "ASSIGN_SF":
      return {
        ...state,
        sfs: state.sfs.map((s) => (s.id === action.id ? { ...s, machineId: action.machineId } : s)),
      }

    case "UNASSIGN_SF":
      return {
        ...state,
        sfs: state.sfs.map((s) => (s.id === action.id ? { ...s, machineId: null } : s)),
      }

    case "MARK_READY":
      return {
        ...state,
        sfs: state.sfs.map((s) => {
          if (s.id !== action.id) return s
          const mergedItems = action.whole
            ? s.readyItems
            : Array.from(new Set([...s.readyItems, ...action.items]))
          return {
            ...s,
            status: action.whole ? "ready" : "partial",
            readyItems: mergedItems,
            md: action.md ?? s.md,
            readyAt: Date.now(),
          }
        }),
      }

    case "COMPLETE_SF":
      return {
        ...state,
        sfs: state.sfs.map((s) =>
          s.id === action.id ? { ...s, status: "ready", readyAt: Date.now() } : s,
        ),
      }

    case "UPDATE_SF":
      return {
        ...state,
        sfs: state.sfs.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      }

    case "DELETE_SF":
      return { ...state, sfs: state.sfs.filter((s) => s.id !== action.id) }

    case "RENAME_MACHINE": {
      const name = action.name.trim()
      if (!name) return state
      return {
        ...state,
        machines: state.machines.map((m) => (m.id === action.id ? { ...m, name } : m)),
      }
    }

    case "ADD_MACHINE": {
      const name = action.name.trim()
      if (!name) return state
      const inZone = state.machines.filter((m) => m.zone === action.zone)
      const base = `${action.zone.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, "-")}`
      let id = base
      let n = 2
      while (state.machines.some((m) => m.id === id)) id = `${base}-${n++}`
      const machine: Machine = {
        id,
        name,
        zone: action.zone,
        order: inZone.length,
      }
      return { ...state, machines: [...state.machines, machine] }
    }

    case "REMOVE_MACHINE":
      return {
        ...state,
        machines: state.machines.filter((m) => m.id !== action.id),
        sfs: state.sfs.map((s) => (s.machineId === action.id ? { ...s, machineId: null } : s)),
      }

    case "RESET_MACHINES":
      return { ...state, machines: SEED_MACHINES.map((m) => ({ ...m })) }

    default:
      return state
  }
}

type PlannerContextValue = {
  state: PlannerState
  hydrated: boolean
  dispatch: React.Dispatch<Action>
  machinesByZone: (zone: Zone) => Machine[]
  machineById: (id: string | null) => Machine | undefined
  sfsForDay: (day: string) => SF[]
  poolForDay: (day: string) => SF[]
  sfsOnMachine: (day: string, machineId: string) => SF[]
  readyForDay: (day: string) => SF[]
  mdForDay: (day: string) => SF[]
  countsForDay: (day: string) => { planned: number; partial: number; ready: number; md: number }
}

const PlannerContext = React.createContext<PlannerContextValue | null>(null)

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const [hydrated, setHydrated] = React.useState(false)

  // Read persisted state on the client only, then reconcile rollovers in the
  // same dispatch so SSR output and first client paint always match.
  React.useEffect(() => {
    let next: PlannerState = initialState
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PlannerState>
        next = {
          machines: Array.isArray(parsed.machines)
            ? mergeMachines(parsed.machines as Machine[])
            : SEED_MACHINES.map((m) => ({ ...m })),
          sfs: Array.isArray(parsed.sfs) ? (parsed.sfs as SF[]) : [],
        }
      }
    } catch {
      next = initialState
    }
    dispatch({ type: "HYDRATE", state: reconcileRollovers(next) })
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full or unavailable — keep the session usable in memory
    }
  }, [state, hydrated])

  const value = React.useMemo<PlannerContextValue>(() => {
    const sortSFs = (list: SF[]) =>
      [...list].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))

    return {
      state,
      hydrated,
      dispatch,
      machinesByZone: (zone) =>
        state.machines.filter((m) => m.zone === zone).sort((a, b) => a.order - b.order),
      machineById: (id) => (id ? state.machines.find((m) => m.id === id) : undefined),
      sfsForDay: (day) => sortSFs(state.sfs.filter((s) => s.day === day)),
      poolForDay: (day) => sortSFs(state.sfs.filter((s) => s.day === day && s.machineId === null)),
      // Partials leave the machine tile entirely — tiles show planned + ready only.
      sfsOnMachine: (day, machineId) =>
        sortSFs(
          state.sfs.filter(
            (s) => s.day === day && s.machineId === machineId && s.status !== "partial",
          ),
        ),
      readyForDay: (day) =>
        sortSFs(state.sfs.filter((s) => s.day === day && s.status !== "planned")),
      mdForDay: (day) =>
        sortSFs(
          state.sfs.filter(
            (s) =>
              s.day === day &&
              s.md !== null &&
              ((s.md.pieces ?? 0) > 0 || s.md.items.length > 0 || s.md.note.trim().length > 0),
          ),
        ),
      countsForDay: (day) => {
        const list = state.sfs.filter((s) => s.day === day)
        return {
          planned: list.filter((s) => s.status === "planned").length,
          partial: list.filter((s) => s.status === "partial").length,
          ready: list.filter((s) => s.status === "ready").length,
          md: list.filter(
            (s) =>
              s.md !== null &&
              ((s.md.pieces ?? 0) > 0 || s.md.items.length > 0 || s.md.note.trim().length > 0),
          ).length,
        }
      },
    }
  }, [state, hydrated])

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}

export function usePlanner(): PlannerContextValue {
  const ctx = React.useContext(PlannerContext)
  if (!ctx) throw new Error("usePlanner must be used inside PlannerProvider")
  return ctx
}

export { ZONES }
