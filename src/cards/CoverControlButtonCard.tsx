import { useRef } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { handleTapAction, type TapAction } from "../utils/actionHandler"
import { getTheme } from "../theme/themeContext"
import { lookupEntityInState } from "../utils/widgetUtils"

interface CoverControlButtonConfig extends LovelaceCardConfig {
  title?: string
  entity?: string
  tap_action_down?: TapAction
  tap_action_stop?: TapAction
  tap_action_up?: TapAction
  hold_action_down?: TapAction
  hold_action_stop?: TapAction
  hold_action_up?: TapAction
  supports_position?: boolean // Set to false if entity doesn't provide position
}

export function CoverControlButtonCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as CoverControlButtonConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  // Check if entity supports position (default: true for backward compatibility)
  const supportsPosition = configTyped?.supports_position !== false

  // Get cover position
  const entityState = lookupEntityInState(hass, configTyped?.entity ?? "")
  const currentPosition = entityState?.attributes?.current_position // 0-100

  // Calculate indicator height based on position (inverted so bar grows when closing)
  // position 100 (open) = 0% bar height
  // position 0 (closed) = 100% bar height
  const indicatorHeight = currentPosition !== undefined ? (100 - currentPosition) : 50

  // Helper to create button handlers with hold detection
  const createButtonHandler = (
    tapAction: TapAction | undefined,
    holdAction: TapAction | undefined,
    defaultService: string,
    positionAdjustment?: number // +1 or -1 for position adjustment
  ) => {
    // Use refs to persist state across re-renders
    const stateRef = useRef({ holdTimer: null as number | null, isHolding: false, actionExecuted: false })

    const executeHoldAction = () => {
      console.log("⏱️ Hold threshold reached - executing single step", defaultService)
      stateRef.current.actionExecuted = true // Set this FIRST before executing action
      console.log("✅ Set actionExecuted = true")

      // Execute hold action once
      let action = holdAction

      if (!action && configTyped?.entity && positionAdjustment !== undefined && supportsPosition) {
        // For up/down buttons, adjust position by 1% on hold (only if position is supported)
        const currentPos = lookupEntityInState(hass, configTyped.entity)?.attributes?.current_position ?? 50
        const newPosition = Math.max(0, Math.min(100, currentPos + positionAdjustment))
        console.log(`🔧 Adjusting position from ${currentPos} to ${newPosition}`)
        action = {
          action: "call-service",
          service: "cover.set_cover_position",
          target: {
            entity_id: configTyped.entity
          },
          service_data: {
            position: newPosition
          }
        }
      } else if (!action && configTyped?.entity) {
        // For stop button or if no positionAdjustment, use default service
        action = tapAction || {
          action: "call-service",
          service: defaultService,
          target: {
            entity_id: configTyped.entity
          }
        }
      }

      handleTapAction(action, hass, configTyped?.entity)
    }

    const onPointerDown = (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("🖱️ Pointer down", defaultService)
      stateRef.current.isHolding = false
      stateRef.current.actionExecuted = false

      stateRef.current.holdTimer = setTimeout(() => {
        stateRef.current.isHolding = true
        executeHoldAction()
      }, 500) // 500ms hold threshold
    }

    const onPointerUp = (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("🖱️ Pointer up", defaultService, "isHolding:", stateRef.current.isHolding, "actionExecuted:", stateRef.current.actionExecuted)

      if (stateRef.current.holdTimer) {
        clearTimeout(stateRef.current.holdTimer)
      }

      // Only execute tap action if neither hold started nor any action was executed
      if (!stateRef.current.actionExecuted) {
        console.log("👆 Executing tap action", defaultService)
        // Execute tap action only if hold wasn't triggered
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
      } else {
        console.log("⏭️ Skipping tap action (hold action was already executed)")
      }

      stateRef.current.isHolding = false
      stateRef.current.actionExecuted = false
    }

    const onPointerLeave = () => {
      console.log("🖱️ Pointer leave", defaultService)
      if (stateRef.current.holdTimer) {
        clearTimeout(stateRef.current.holdTimer)
      }
      stateRef.current.isHolding = false
      stateRef.current.actionExecuted = false
    }

    const onContextMenu = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("🚫 Context menu prevented")
    }

    return { onPointerDown, onPointerUp, onPointerLeave, onContextMenu }
  }

  const downHandlers = createButtonHandler(
    configTyped?.tap_action_down,
    configTyped?.hold_action_down,
    "cover.close_cover",
    -1 // Decrease position by 1% on hold
  )

  const stopHandlers = createButtonHandler(
    configTyped?.tap_action_stop,
    configTyped?.hold_action_stop,
    "cover.stop_cover"
    // No position adjustment for stop button
  )

  const upHandlers = createButtonHandler(
    configTyped?.tap_action_up,
    configTyped?.hold_action_up,
    "cover.open_cover",
    +1 // Increase position by 1% on hold
  )

  return (
    <div
      className="bg-card w-58 h-24 overflow-hidden relative flex"
      style={{
        borderRadius: theme.card.borderRadius,
        backgroundColor: theme.card.inactiveButtonBackgroundColor
      }}
    >
      {/* Left indicator bar - in background (only if position is supported) */}
      {supportsPosition && (
        <div className="absolute left-0 top-0 bottom-0 w-[15px] z-0">
          <div
            className="absolute top-0 left-0 right-0 transition-all duration-300"
            style={{
              height: `${indicatorHeight}%`,
              backgroundColor: theme.card.activeButtonBackgroundColor
            }}
          />
        </div>
      )}

      {/* Right indicator bar - in background (only if position is supported) */}
      {supportsPosition && (
        <div className="absolute right-0 top-0 bottom-0 w-[15px] z-0">
          <div
            className="absolute top-0 left-0 right-0 transition-all duration-300"
            style={{
              height: `${indicatorHeight}%`,
              backgroundColor: theme.card.activeButtonBackgroundColor
            }}
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 px-2 py-1 relative z-10">
        {/* Title - positioned in background */}
        <span className="text-foreground text-sm text-center absolute bottom-2 left-0 right-0 pointer-events-none">
          {configTyped?.title || "Cover"}
        </span>

        <div className="flex items-center gap-1 h-full relative z-10">
        {/* Down Section */}
        <button
          {...downHandlers}
          className="flex-1 h-full flex items-center justify-center hover:bg-accent/50 transition-colors rounded-sm"
        >
          <ha-icon
            icon="mdi:arrow-down"
            style={{
              "--mdc-icon-size": "18px",
              color: "white",
              marginTop: "-16px"
            } as any}
          />
        </button>

        {/* Separator */}
        <div
          className="w-px bg-gray-600"
          style={{
            height: `calc(100% - ${7+24}px)`,
            marginTop: `${7}px`,
            marginBottom: `${24}px`
          }}
        />

        {/* Stop Section */}
        <button
          {...stopHandlers}
          className="flex items-center justify-center h-full px-3 bg-accent/30 hover:bg-accent/50 transition-colors rounded-sm"
        >
          <ha-icon
            icon="mdi:stop"
            style={{
              "--mdc-icon-size": "14px",
              color: "white",
              marginTop: "-16px"
            } as any}
          />
        </button>

        {/* Separator */}
        <div
          className="w-px bg-gray-600"
          style={{
            height: `calc(100% - ${7+24}px)`,
            marginTop: `${7}px`,
            marginBottom: `${24}px`
          }}
        />

        {/* Up Section */}
        <button
          {...upHandlers}
          className="flex-1 h-full flex items-center justify-center hover:bg-accent/50 transition-colors rounded-sm"
        >
          <ha-icon
            icon="mdi:arrow-up"
            style={{
              "--mdc-icon-size": "18px",
              color: "white",
              marginTop: "-16px"
            } as any}
          />
        </button>
      </div>
      </div>
    </div>
  )
}
