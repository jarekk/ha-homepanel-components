import { useRef, useState, useEffect } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { handleTapAction, type TapAction } from "../utils/actionHandler"
import { getTheme } from "../theme/themeContext"
import { lookupEntityInState } from "../utils/widgetUtils"

interface HoldChoice {
  label: string
  icon?: string
  action: TapAction
}

interface ButtonCardConfig extends LovelaceCardConfig {
  title?: string
  icon?: string
  entity?: string
  isLight?: boolean
  brightness?: number // 0-100, if provided will turn on light to this brightness percentage
  tap_action?: TapAction
  tap_action_active?: TapAction
  tap_action_inactive?: TapAction
  hold_action?: {
    choices: HoldChoice[]
  }
}

export function ButtonCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as ButtonCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  // Hold action state
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<'above' | 'below'>('below')
  const [isPressed, setIsPressed] = useState(false)
  const [pressedChoiceIndex, setPressedChoiceIndex] = useState<number | null>(null)
  const holdTimerRef = useRef<number | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Get entity state first (needed to determine which action to use)
  const entityState = lookupEntityInState(hass, configTyped?.entity ?? "")
  const state = entityState?.state

  // Check if entity is active
  // If brightness is specified, only consider it "on" if the light is on AND has that brightness
  let isOn = state === "on" || state === "open" || state === "active" || state === "unlocked"

  if (configTyped?.brightness !== undefined && state === "on") {
    const currentBrightness = entityState?.attributes?.brightness // 0-255 in HA
    const targetBrightness = Math.round((configTyped.brightness / 100) * 255) // Convert 0-100 to 0-255
    // Allow ±2 tolerance for rounding errors
    const tolerance = 2
    isOn = Math.abs(currentBrightness - targetBrightness) <= tolerance
  }

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleClick = () => {
    // Visual feedback
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)

    // Don't trigger tap action if menu is showing
    if (showMenu) {
      setShowMenu(false)
      return
    }

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

      if (domain === "light") {
        // For lights with brightness specified, turn on/off based on current state
        if (configTyped.brightness !== undefined) {
          if (isOn) {
            // If button is active (light at target brightness), turn off
            action = {
              action: "call-service",
              service: "light.turn_off",
              service_data: {
                entity_id: entityId
              }
            }
          } else {
            // If button is inactive, turn on to target brightness
            action = {
              action: "call-service",
              service: "light.turn_on",
              service_data: {
                entity_id: entityId,
                brightness_pct: configTyped.brightness
              }
            }
          }
        } else {
          action = {
            action: "call-service",
            service: "light.toggle",
            service_data: {
              entity_id: entityId
            }
          }
        }
      } else if (domain === "switch") {
        action = {
          action: "call-service",
          service: "switch.toggle",
          service_data: {
            entity_id: entityId
          }
        }
      }
    }

    handleTapAction(action, hass, configTyped?.entity)
  }

  const handleMouseDown = () => {
    if (!configTyped?.hold_action?.choices?.length) return

    holdTimerRef.current = window.setTimeout(() => {
      // Determine if menu should open above or below
      if (buttonRef.current && configTyped?.hold_action?.choices) {
        const rect = buttonRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top

        // Estimate menu height (40px per item + padding)
        const menuHeight = (configTyped.hold_action.choices.length * 40) + 16

        setMenuPosition(spaceBelow >= menuHeight || spaceBelow > spaceAbove ? 'below' : 'above')
      }
      setShowMenu(true)
    }, 500) // 500ms hold time
  }

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    // Suppress context menu if hold action is configured
    if (configTyped?.hold_action?.choices?.length) {
      e.preventDefault()
    }
  }

  const handleChoiceClick = (choice: HoldChoice, index: number) => {
    console.log("Handling tap action:", choice)

    setPressedChoiceIndex(index)
    setTimeout(() => setPressedChoiceIndex(null), 150)

    setTimeout(() => {
      setShowMenu(false)
      handleTapAction(choice.action, hass, configTyped?.entity)
    }, 150)
  }

  // Check if entity is a light (from config or domain)
  const isLight = configTyped?.isLight ?? configTyped?.entity?.startsWith("light.")

  // Determine background color based on state
  const getBackgroundColor = () => {
    if (isPressed) {
      return isLight ? theme.card.activeLightButtonBackgroundColor : theme.card.activeButtonBackgroundColor
    }
    return isOn
      ? (isLight ? theme.card.activeLightButtonBackgroundColor : theme.card.activeButtonBackgroundColor)
      : theme.card.inactiveButtonBackgroundColor
  }

  const backgroundColor = getBackgroundColor()

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="bg-card flex-1 w-28 h-24 px-2 flex flex-col items-center justify-center gap-2 hover:opacity-80 transition-opacity relative"
        style={{
          borderRadius: theme.card.borderRadius,
          backgroundColor: backgroundColor,
          cursor: 'pointer'
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onContextMenu={handleContextMenu}
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
        <span className="text-foreground text-sm">{configTyped?.title || "--"}</span>

        {/* Hold action indicator arrow */}
        {configTyped?.hold_action?.choices && configTyped.hold_action.choices.length > 0 && (
          <div
            className="absolute bottom-1 right-1"
            style={{
              opacity: 0.6
            }}
          >
            <ha-icon
              icon="mdi:chevron-right"
              style={{
                "--mdc-icon-size": "12px",
                color: "white"
              } as any}
            />
          </div>
        )}
      </button>

      {/* Hold action menu */}
      {showMenu && configTyped?.hold_action?.choices && (
        <div
          ref={menuRef}
          className="absolute right-0 z-50 flex flex-col"
          style={{
            backgroundColor: backgroundColor,
            borderRadius: theme.card.borderRadius,
            borderLeft: '8px solid black',
            borderRight: '8px solid black',
            borderTop: menuPosition === 'below' ? 'none' : '8px solid black',
            borderBottom: menuPosition === 'above' ? 'none' : '8px solid black',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            [menuPosition === 'above' ? 'bottom' : 'top']: '100%',
            marginTop: menuPosition === 'below' ? '4px' : '0',
            marginBottom: menuPosition === 'above' ? '4px' : '0',
            marginRight: '-8px',
            minWidth: '100%',
            width: 'max-content'
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {configTyped.hold_action.choices.map((choice, idx) => (
            <button
              key={idx}
              className="flex items-center justify-center px-3 py-4 hover:opacity-80 transition-opacity whitespace-nowrap"
              style={{
                backgroundColor: pressedChoiceIndex === idx ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                cursor: 'pointer',
                border: 'none',
                borderTop: idx > 0 ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                color: 'white'
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                console.log("Choice mousedown:", choice.label)
              }}
              onClick={(e) => {
                e.stopPropagation()
                console.log("Choice clicked:", choice.label)
                handleChoiceClick(choice, idx)
              }}
            >
              <span className="text-sm">{choice.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
