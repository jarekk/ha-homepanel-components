import { useRef } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { handleTapAction, type TapAction } from "../utils/actionHandler"
import { getTheme } from "../theme/themeContext"

interface CoverControlButtonConfig extends LovelaceCardConfig {
  label?: string
  entity?: string
  tap_action_down?: TapAction
  tap_action_stop?: TapAction
  tap_action_up?: TapAction
  hold_action_down?: TapAction
  hold_action_stop?: TapAction
  hold_action_up?: TapAction
}

export function CoverControlButtonCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as CoverControlButtonConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  // Helper to create button handlers with hold detection
  const createButtonHandler = (
    tapAction: TapAction | undefined,
    holdAction: TapAction | undefined,
    defaultService: string
  ) => {
    let holdTimer: number | null = null
    let isHolding = false

    const onMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      isHolding = false

      holdTimer = setTimeout(() => {
        isHolding = true
        // Execute hold action
        let action = holdAction

        if (!action && configTyped?.entity) {
          // No default hold action - just use the tap action
          action = tapAction || {
            action: "call-service",
            service: defaultService,
            target: {
              entity_id: configTyped.entity
            }
          }
        }

        handleTapAction(action, hass, configTyped?.entity)
      }, 500) // 500ms hold threshold
    }

    const onMouseUp = (e: React.MouseEvent) => {
      e.preventDefault()
      if (holdTimer) {
        clearTimeout(holdTimer)
      }

      if (!isHolding) {
        // Execute tap action
        let action = tapAction

        if (!action && configTyped?.entity) {
          action = {
            action: "call-service",
            service: defaultService,
            target: {
              entity_id: configTyped.entity
            }
          }
        }

        handleTapAction(action, hass, configTyped?.entity)
      }
    }

    const onMouseLeave = () => {
      if (holdTimer) {
        clearTimeout(holdTimer)
      }
    }

    return { onMouseDown, onMouseUp, onMouseLeave }
  }

  const downHandlers = createButtonHandler(
    configTyped?.tap_action_down,
    configTyped?.hold_action_down,
    "cover.close_cover"
  )

  const stopHandlers = createButtonHandler(
    configTyped?.tap_action_stop,
    configTyped?.hold_action_stop,
    "cover.stop_cover"
  )

  const upHandlers = createButtonHandler(
    configTyped?.tap_action_up,
    configTyped?.hold_action_up,
    "cover.open_cover"
  )

  return (
    <div
      className="bg-card h-16 flex flex-col gap-1 px-2 py-1 overflow-hidden"
      style={{
        borderRadius: theme.card.borderRadius,
        backgroundColor: theme.card.backgroundColor
      }}
    >
      {/* Label */}
      <span className="text-foreground text-xs font-medium text-center">
        {configTyped?.label || "Cover"}
      </span>

      <div className="flex items-center gap-1 flex-1">
        {/* Down Section */}
        <button
          {...downHandlers}
          className="flex-1 h-full flex items-center justify-center hover:bg-accent/50 transition-colors rounded-sm"
        >
          <ha-icon
            icon="mdi:arrow-down"
            style={{
              "--mdc-icon-size": "18px",
              color: "white"
            } as any}
          />
        </button>

        {/* Stop Section */}
        <button
          {...stopHandlers}
          className="flex items-center justify-center h-full px-3 bg-accent/30 hover:bg-accent/50 transition-colors rounded-sm"
        >
          <ha-icon
            icon="mdi:stop"
            style={{
              "--mdc-icon-size": "14px",
              color: "white"
            } as any}
          />
        </button>

        {/* Up Section */}
        <button
          {...upHandlers}
          className="flex-1 h-full flex items-center justify-center hover:bg-accent/50 transition-colors rounded-sm"
        >
          <ha-icon
            icon="mdi:arrow-up"
            style={{
              "--mdc-icon-size": "18px",
              color: "white"
            } as any}
          />
        </button>
      </div>
    </div>
  )
}
