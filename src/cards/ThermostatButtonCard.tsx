import { useRef, useState } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { getTheme } from "../theme/themeContext"
import { lookupEntityInState } from "../utils/widgetUtils"

interface ThermostatButtonCardConfig extends LovelaceCardConfig {
  title?: string
  entity?: string // Climate entity for target temperature
  current_temperature_entity?: string // Optional separate entity for current temperature
  auto_entity?: string // Entity to control auto mode (e.g., input_boolean or switch)
}

export function ThermostatButtonCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as ThermostatButtonCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  // State for showing +/- controls
  const [showControls, setShowControls] = useState(false)
  const [pressedButton, setPressedButton] = useState<'main' | 'plus' | 'minus' | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Get entity states
  const entityState = lookupEntityInState(hass, configTyped?.entity ?? "")
  const targetTemperature = Number(entityState?.state) ?? 0

  // Get current temperature from either the climate entity or a separate sensor
  const currentTempEntity = configTyped?.current_temperature_entity
    ? lookupEntityInState(hass, configTyped.current_temperature_entity)
    : entityState
  const currentTemperature = currentTempEntity?.attributes?.current_temperature ??
                            Number(currentTempEntity?.state) ??
                            0

  // Get auto mode state
  const autoEntity = configTyped?.auto_entity
    ? lookupEntityInState(hass, configTyped.auto_entity)
    : null
  const isAutoOn = autoEntity?.state === "on"

  // Close controls when clicking outside (no longer needed with overlay)
  // The overlay will handle this

  const handleClick = () => {
    setPressedButton('main')
    setTimeout(() => setPressedButton(null), 150)
    setShowControls(!showControls)
  }

  const adjustTemperature = (delta: number, buttonType: 'plus' | 'minus') => {
    if (!configTyped?.entity || !hass) return

    setPressedButton(buttonType)
    setTimeout(() => setPressedButton(null), 150)

    const newTemp = targetTemperature + delta
    console.log("Setting temperature:", newTemp)

    const entityId = configTyped.entity
    const domain = entityId.split(".")[0]

    if (domain === "input_number") {
      hass.callService("input_number", "set_value", {
        entity_id: entityId,
        value: newTemp
      })
    } else {
      // Assume climate entity
      hass.callService("climate", "set_temperature", {
        entity_id: entityId,
        temperature: newTemp
      })
    }
  }

  const toggleAutoMode = () => {
    if (!configTyped?.auto_entity || !hass) return

    const entityId = configTyped.auto_entity
    const domain = entityId.split(".")[0]

    if (domain === "input_boolean") {
      hass.callService("input_boolean", "toggle", {
        entity_id: entityId
      })
    } else if (domain === "switch") {
      hass.callService("switch", "toggle", {
        entity_id: entityId
      })
    }
  }

  const getBackgroundColor = (buttonType: 'main' | 'plus' | 'minus') => {
    if (pressedButton === buttonType) {
      return theme.card.activeButtonBackgroundColor
    }
    return theme.card.inactiveButtonBackgroundColor
  }

  const backgroundColor = getBackgroundColor('main')

  return (
    <>
      {/* Blurred overlay when controls are open */}
      {showControls && (
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
          onClick={() => setShowControls(false)}
        />
      )}

      <div className="relative" style={{ zIndex: showControls ? 50 : 'auto' }}>
        <button
          ref={buttonRef}
          className="bg-card flex-1 w-28 h-24 px-2 flex flex-col items-center justify-center gap-1 hover:opacity-80 transition-opacity relative"
          style={{
            borderRadius: theme.card.borderRadius,
            backgroundColor: backgroundColor,
            cursor: 'pointer'
          }}
          onClick={handleClick}
        >
        {/* Current temperature in upper right corner */}
        <div
          className="absolute top-1 right-2"
          style={{
            fontSize: '0.75rem',
            opacity: 0.7
          }}
        >
          {Number(currentTemperature).toFixed(1)}°
        </div>

        {/* Target temperature - large in center */}
        <span className="text-foreground" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          {Number(targetTemperature).toFixed(1)}°
        </span>

        {/* Title at bottom */}
        {configTyped?.title && (
          <span className="text-foreground text-sm">{configTyped.title}</span>
        )}

        {/* Auto mode indicator - bottom right corner */}
        {configTyped?.auto_entity && (
          <div
            className="absolute bottom-1 right-2"
            style={{
              opacity: 0.8
            }}
          >
            <ha-icon
              icon="mdi:auto-mode"
              style={{
                "--mdc-icon-size": "14px",
                color: isAutoOn ? "#ff8c00" : "white"
              } as any}
            />
          </div>
        )}
      </button>

      {/* Auto mode button - to the left */}
      {showControls && configTyped?.auto_entity && (
        <button
          className="absolute flex items-center justify-center py-4 hover:opacity-80 transition-opacity z-50"
          style={{
            backgroundColor: backgroundColor,
            borderRadius: theme.card.borderRadius,
            borderLeft: '8px solid black',
            borderTop: '8px solid black',
            borderBottom: '8px solid black',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            color: 'white',
            right: 'calc(100% + 4px)',
            top: 0,
            bottom: 0,
            minWidth: '60px'
          }}
          onClick={(e) => {
            e.stopPropagation()
            toggleAutoMode()
          }}
        >
          <span className="text-sm">Auto</span>
        </button>
      )}

      {/* Temperature controls */}
      {showControls && (
        <>
          {/* Plus button - above */}
          <button
            className="absolute flex items-center justify-center py-4 hover:opacity-80 transition-opacity z-50"
            style={{
              backgroundColor: getBackgroundColor('plus'),
              borderRadius: theme.card.borderRadius,
              borderLeft: '8px solid black',
              borderRight: '8px solid black',
              borderTop: '8px solid black',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
              color: 'white',
              bottom: 'calc(100% + 4px)',
              left: 0,
              right: 0
            }}
            onClick={(e) => {
              e.stopPropagation()
              adjustTemperature(0.5, 'plus')
            }}
          >
            <span className="text-xl">+</span>
          </button>

          {/* Minus button - below */}
          <button
            className="absolute flex items-center justify-center py-4 hover:opacity-80 transition-opacity z-50"
            style={{
              backgroundColor: getBackgroundColor('minus'),
              borderRadius: theme.card.borderRadius,
              borderLeft: '8px solid black',
              borderRight: '8px solid black',
              borderBottom: '8px solid black',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
              color: 'white',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0
            }}
            onClick={(e) => {
              e.stopPropagation()
              adjustTemperature(-0.5, 'minus')
            }}
          >
            <span className="text-xl">−</span>
          </button>
        </>
      )}
      </div>
    </>
  )
}
