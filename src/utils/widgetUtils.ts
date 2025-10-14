import type { HomeAssistant } from "custom-card-helpers"
import * as nunjucks from "nunjucks"

export function lookupEntityInState(
  hass: HomeAssistant | undefined,
  entityId: string | undefined
) {
  if (!hass || !entityId) return undefined
  return hass.states?.[entityId]
}
nunjucks.configure({ autoescape: true })


export function evaluateTemplate(template: string | undefined, data: object) {
  return nunjucks.renderString(template ?? '', { ...data })
}
