import type { HomeAssistant } from "custom-card-helpers"

export interface TapAction {
  action: string
  navigation_path?: string
  url_path?: string
  service?: string
  service_data?: any
  target?: {
    entity_id?: string | string[]
    device_id?: string | string[]
    area_id?: string | string[]
  }
  entity?: string
}

export function handleTapAction(
  tapAction: TapAction | undefined,
  hass: HomeAssistant | undefined,
  entityId?: string
) {
  if (!tapAction || !hass) return

  const action = tapAction.action

  switch (action) {
    case "navigate":
      if (tapAction.navigation_path) {
        window.history.pushState(null, "", tapAction.navigation_path)
        window.dispatchEvent(new CustomEvent("location-changed"))
      }
      break
    case "url":
      if (tapAction.url_path) {
        window.open(tapAction.url_path, "_blank")
      }
      break
    case "call-service":
      if (tapAction.service) {
        const [domain, service] = tapAction.service.split(".")
        const serviceData = { ...tapAction.service_data }

        // Merge target into service_data if provided
        if (tapAction.target) {
          Object.assign(serviceData, tapAction.target)
        }

        hass.callService(domain, service, serviceData)
      }
      break
    case "more-info":
      const event = new CustomEvent("hass-more-info", {
        detail: { entityId: tapAction.entity || entityId },
        bubbles: true,
        composed: true
      })
      document.dispatchEvent(event)
      break
  }
}
