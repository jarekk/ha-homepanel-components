import { useRef } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { lookupEntityInState, resolveColor, evaluateExpression } from "../utils/widgetUtils"
import { handleTapAction, type TapAction } from "../utils/actionHandler"
import { getTheme } from "../theme/themeContext"

interface ValueConfig {
  title: string
  entity: string
  icon?: string
  iconColor?: string
  unit?: string
  displayValue?: string
}

interface ValueCardConfig extends LovelaceCardConfig {
  values?: ValueConfig[]
  // Alternative simple format
  title?: string
  entity?: string
  icon?: string
  iconColor?: string
  unit?: string
  displayValue?: string
  tap_action?: TapAction
}

export function ValueCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as ValueCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  const handleClick = () => {
    handleTapAction(configTyped?.tap_action, hass, configTyped?.entity)
  }

  // Support both array format and simple format
  let values: ValueConfig[]
  if (configTyped?.values && configTyped.values.length > 0) {
    // Array format
    values = configTyped.values
  } else if (configTyped?.entity && configTyped?.title) {
    // Simple format - convert to array
    values = [{
      title: configTyped.title,
      entity: configTyped.entity,
      icon: configTyped.icon,
      iconColor: configTyped.iconColor,
      unit: configTyped.unit,
      displayValue: configTyped.displayValue
    }]
  } else {
    values = []
  }

  console.log('ValueCard render:', {
    configTyped,
    values,
    hassAvailable: !!hass,
    statesCount: Object.keys(hass?.states || {}).length
  })

  return (
    <div
      className="bg-card w-28 h-24 px-2 py-3 flex flex-col items-center justify-center gap-2"
      style={{
        borderRadius: theme.card.borderRadius,
        backgroundColor: theme.card.backgroundColor,
        cursor: configTyped?.tap_action ? 'pointer' : 'default'
      }}
      onClick={handleClick}
    >
      {values.map((valueConfig, idx) => {
        const entityState = lookupEntityInState(hass, valueConfig.entity)
        const rawValue = entityState?.state
        const isUnknown = !rawValue || rawValue === "unknown" || rawValue === "unavailable"

        let displayValue: string
        if (isUnknown) {
          displayValue = "--"
        } else if (valueConfig.displayValue) {
          // Evaluate expression if displayValue is provided
          displayValue = evaluateExpression(
            valueConfig.displayValue,
            rawValue,
            {
              entity: entityState,
              states: hass?.states
            },
            hass
          ) ?? rawValue
        } else {
          displayValue = rawValue
        }

        const iconColorName = isUnknown ? "#888" : (valueConfig.iconColor || "white")
        const iconColor = resolveColor(iconColorName)
        const textColor = isUnknown ? "#888" : "white"

        return (
          <div key={idx} className="flex flex-col items-center gap-1 w-full">
            <div className="flex items-center justify-center gap-1.5">
              {valueConfig.icon && (
                <ha-icon
                  icon={valueConfig.icon}
                  style={{
                    "--mdc-icon-size": "16px",
                    color: iconColor
                  } as any}
                />
              )}
              <span className="text-xs" style={{ color: textColor, fontSize: '15px', fontWeight: 500 }}>
                {displayValue}
                {!isUnknown && valueConfig.unit && <span style={{ fontSize: '13px', marginLeft: '2px' }}>{valueConfig.unit}</span>}
              </span>
            </div>
            <span className="text-xs text-muted-foreground" style={{ fontSize: '11px' }}>
              {valueConfig.title}
            </span>
          </div>
        )
      })}
    </div>
  )
}
