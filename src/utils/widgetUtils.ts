import type { HomeAssistant } from "custom-card-helpers"
import * as nunjucks from "nunjucks"
import { theme } from "../config"

export function lookupEntityInState(
  hass: HomeAssistant | undefined,
  entityId: string | undefined
) {
  if (!hass || !entityId) return undefined
  return hass.states?.[entityId]
}
nunjucks.configure({ autoescape: true })


export function evaluateExpression(expr: string, value: string, data: object, hass: HomeAssistant | undefined) {
  if (expr.startsWith("nr:")) {
    const spec = expr.substring(3)
    return findInNumberRange(spec, value) ?? undefined
  }

  return nunjucks.renderString(expr, { v: value, hass: hass, ...data })
}

export function evaluateTemplate(template: string | undefined, data: object) {
  return nunjucks.renderString(template ?? '', { ...data })
}

export function resolveColor(color: string) {
  return theme.namedColors[color as keyof typeof theme.namedColors] ?? color
}


export function findInNumberRange(spec: string, value: string): string | undefined {

  function parse(spec: string) {
    return spec.split(";").map((part) => {
      const [rangeStr, value] = part.split(":").map((s) => s.trim())
      const range = rangeStr === "*" ? null : Number(rangeStr)
      return {
        range: range,
        value: value,
      }
    })
  }

  const ranges = parse(spec)

  const val = Number(value)
  if (value === undefined || value === null || isNaN(val)) {
    return undefined
  }
  for (const range of ranges) {
    if (range.range === null || val < range.range) {
      return range.value
    }
  }
  return undefined
}