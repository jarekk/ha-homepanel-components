import type { HomeAssistant } from "custom-card-helpers"

export function lookupEntityInState(
  hass: HomeAssistant | undefined,
  entityId: string | undefined
) {
  if (!hass || !entityId) return undefined
  return hass.states?.[entityId]
}