import { useRef, useState, useEffect } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { getTheme } from "../theme/themeContext"
import { lookupEntityInState, resolveColor } from "../utils/widgetUtils"

interface ConfigOption {
  id: string
  title: string
  color: string
  icon?: string
}

interface ConfigSelectorCardConfig extends LovelaceCardConfig {
  entity: string // Entity that holds the current configuration ID
  options: ConfigOption[]
  icon?: string // Default icon used when option doesn't have one
}

export function ConfigSelectorCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as ConfigSelectorCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  // Menu state
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<'above' | 'below'>('below')
  const [pressedOptionId, setPressedOptionId] = useState<string | null>(null)
  const holdTimerRef = useRef<number | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Get entity state
  const entityState = lookupEntityInState(hass, configTyped?.entity ?? "")
  const currentConfigId = entityState?.state ?? ""

  // Find current configuration
  const currentConfig = configTyped?.options?.find(opt => opt.id === currentConfigId)

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
    // Don't trigger click if menu is showing (just close it)
    if (showMenu) {
      setShowMenu(false)
      return
    }

    // Open menu on click
    openMenu()
  }

  const openMenu = () => {
    // Determine if menu should open above or below
    if (buttonRef.current && configTyped?.options) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      // Estimate menu height (40px per item + padding)
      const menuHeight = (configTyped.options.length * 40) + 16

      setMenuPosition(spaceBelow >= menuHeight || spaceBelow > spaceAbove ? 'below' : 'above')
    }
    setShowMenu(true)
  }

  const handleMouseDown = () => {
    holdTimerRef.current = window.setTimeout(() => {
      openMenu()
    }, 500) // 500ms hold time
  }

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    // Suppress context menu on long press
    e.preventDefault()
  }

  const handleOptionClick = (option: ConfigOption) => {
    if (!configTyped?.entity || !hass) return

    console.log("Setting configuration to:", option.id)

    setPressedOptionId(option.id)
    setTimeout(() => setPressedOptionId(null), 150)

    setTimeout(() => {
      setShowMenu(false)

      const entityId = configTyped.entity
      const domain = entityId.split(".")[0]

      if (domain === "input_select") {
        hass.callService("input_select", "select_option", {
          entity_id: entityId,
          option: option.id
        })
      } else if (domain === "select") {
        hass.callService("select", "select_option", {
          entity_id: entityId,
          option: option.id
        })
      } else if (domain === "input_text") {
        hass.callService("input_text", "set_value", {
          entity_id: entityId,
          value: option.id
        })
      }
    }, 150)
  }

  const backgroundColor = theme.card.inactiveButtonBackgroundColor

  return (
    <>
      {/* Blurred overlay when menu is open */}
      {showMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(2px)',
            zIndex: 40,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
          onClick={() => setShowMenu(false)}
        />
      )}

      <div className="relative" style={{ zIndex: showMenu ? 50 : 'auto' }}>
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
          {(currentConfig?.icon || configTyped?.icon) && (
            <ha-icon
              icon={currentConfig?.icon || configTyped?.icon || ""}
              style={{
                "--mdc-icon-size": "20px",
                color: currentConfig?.color ? resolveColor(currentConfig.color) : "#c0c0c0"
              } as any}
            />
          )}
          <span
            className={`text-sm font-medium text-center ${!currentConfig?.color ? 'text-foreground' : ''}`}
            style={{
              ...(currentConfig?.color && { color: resolveColor(currentConfig.color) })
            }}
          >
            {currentConfig?.title ?? "--"}
          </span>

          {/* Menu indicator arrow */}
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
        </button>

        {/* Options menu */}
        {showMenu && configTyped?.options && (
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
            {configTyped.options.map((option, idx) => (
              <button
                key={option.id}
                className="flex items-center justify-center px-3 py-4 hover:opacity-80 transition-opacity whitespace-nowrap"
                style={{
                  backgroundColor: pressedOptionId === option.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                  borderTop: idx > 0 ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                  color: option.color ? resolveColor(option.color) : '#c0c0c0'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleOptionClick(option)
                }}
              >
                <span className="text-sm">{option.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
