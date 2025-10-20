import type { HomeAssistant } from "custom-card-helpers"

/**
 * Check if a value is a Jinja2 template
 */
export function isTemplate(value: any): boolean {
  return typeof value === 'string' && (value.includes('{{') || value.includes('{%'))
}

/**
 * Evaluate a Jinja2 template using Home Assistant's render_template service
 */
export async function evaluateTemplate(hass: HomeAssistant, template: string): Promise<string> {
  try {
    // Try using hass.callApi for template rendering
    const response = await hass.callApi('POST', 'template', { template: template })

    // Handle null/undefined responses
    if (response === null || response === undefined) {
      return 'null'
    }

    return String(response)
  } catch (error) {
    // Fallback to WebSocket
    try {
      const wsResponse = await hass.callWS({
        type: 'render_template',
        template: template
      })
      return String(wsResponse || 'null')
    } catch (wsError) {
      console.error('Failed to evaluate template:', template, wsError)
      throw wsError
    }
  }
}

/**
 * Evaluate a template and convert result to boolean
 */
export async function evaluateTemplateAsBoolean(hass: HomeAssistant, template: string): Promise<boolean> {
  const result = await evaluateTemplate(hass, template)

  // Handle various boolean representations
  if (result === 'True' || result === 'true') return true
  if (result === 'False' || result === 'false') return false
  if (result === 'null' || result === null || result === 'None') return false

  return false
}

/**
 * Evaluate multiple templates in parallel
 * Returns a record mapping index to boolean result
 */
export async function evaluateTemplates(
  hass: HomeAssistant,
  templates: Array<{ index: number; template: string }>
): Promise<Record<number, boolean>> {
  const results: Record<number, boolean> = {}

  await Promise.all(
    templates.map(async ({ index, template }) => {
      try {
        results[index] = await evaluateTemplateAsBoolean(hass, template)
      } catch (error) {
        console.error(`Failed to evaluate template at index ${index}:`, error)
        results[index] = false
      }
    })
  )

  return results
}
