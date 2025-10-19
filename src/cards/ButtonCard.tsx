import { useRef } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { handleTapAction, type TapAction } from "../utils/actionHandler"
import { getTheme } from "../theme/themeContext"
import { lookupEntityInState } from "../utils/widgetUtils"

interface ButtonCardConfig extends LovelaceCardConfig {
  title?: string
  icon?: string
  entity?: string
  isLight?: boolean
  tap_action?: TapAction
  tap_action_active?: TapAction
  tap_action_inactive?: TapAction
}

export function ButtonCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as ButtonCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  // Get entity state first (needed to determine which action to use)
  const entityState = lookupEntityInState(hass, configTyped?.entity ?? "")
  const state = entityState?.state
  const isOn = state === "on" || state === "open" || state === "active" || state === "unlocked"

  const handleClick = () => {
    let action: TapAction | undefined

    // Priority:
    // 1. State-specific actions (tap_action_active / tap_action_inactive)
    // 2. General tap_action
    // 3. Default toggle for light/switch

    if (isOn && configTyped?.tap_action_active) {
      action = configTyped.tap_action_active
    } else if (!isOn && configTyped?.tap_action_inactive) {
      action = configTyped.tap_action_inactive
    } else if (configTyped?.tap_action) {
      action = configTyped.tap_action
    } else if (configTyped?.entity && hass) {
      // Default toggle action for light/switch entities
      const entityId = configTyped.entity
      const domain = entityId.split(".")[0]

      if (domain === "light" || domain === "switch") {
        action = {
          action: "call-service",
          service: `${domain}.toggle`,
          service_data: {
            entity_id: entityId
          }
        }
      }
    }

    handleTapAction(action, hass, configTyped?.entity)
  }

  // Check if entity is a light (from config or domain)
  const isLight = configTyped?.isLight ?? configTyped?.entity?.startsWith("light.")

  // Determine background color based on state
  const backgroundColor = isOn
    ? (isLight ? theme.card.activeLightButtonBackgroundColor : theme.card.activeButtonBackgroundColor)
    : theme.card.inactiveButtonBackgroundColor

  return (
    <button
      className="bg-card flex-1 w-28 h-24 px-2 flex flex-col items-center justify-center gap-2 hover:opacity-80 transition-opacity"
      style={{
        borderRadius: theme.card.borderRadius,
        backgroundColor: backgroundColor,
        cursor: 'pointer'
      }}
      onClick={handleClick}
    >
      {configTyped?.icon && (
        <ha-icon
          icon={configTyped.icon}
          style={{
            "--mdc-icon-size": "20px",
            color: "white"
          } as any}
        />
      )}
      <span className="text-foreground text-xs">{configTyped?.title || "--"}</span>
    </button>
  )
}
