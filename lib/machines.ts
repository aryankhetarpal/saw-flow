import type { Machine, Zone } from "./types"

export const ZONES: { id: Zone; label: string }[] = [
  { id: "32T", label: "32 Ton Zone" },
  { id: "25T", label: "25 Ton Zone" },
  { id: "16T", label: "16 Ton Zone" },
  { id: "5T", label: "5 Ton Zone" },
]

function build(zone: Zone, names: string[]): Machine[] {
  return names.map((name, i) => ({
    id: `${zone.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    zone,
    order: i,
  }))
}

/**
 * 30 machines taken from the shop-floor sketch.
 * ITL2 (16T) is a distinct family from the ITM series, same as BITL (32T).
 * ITM2 exists only in the 5T zone.
 */
export const SEED_MACHINES: Machine[] = [
  ...build("32T", ["V6", "V3", "V5", "BITL"]),
  ...build("25T", ["K12", "K11", "V7", "V8", "B1", "Gantry 1", "Gantry 2", "K9"]),
  ...build("16T", ["J1", "K1", "ITM3", "ITM4", "ITL2", "K10", "K5", "B2", "Friggi"]),
  ...build("5T", ["K2", "K3", "K4", "K6", "K7", "K8", "R", "J2", "ITM2"]),
]

export function zoneLabel(zone: Zone): string {
  return ZONES.find((z) => z.id === zone)?.label ?? zone
}
