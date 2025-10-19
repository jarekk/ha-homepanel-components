import { useRef } from "react"
import type { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { lookupEntityInState, resolveColor } from "../utils/widgetUtils"
import { Separator } from "../components/Separator"
import { handleTapAction, type TapAction } from "../utils/actionHandler"
import { getTheme } from "../theme/themeContext"

interface TitleBarIconConfig {
  entity: string
  icon: string
  "color-active"?: string
}

interface InfoCardConfig extends LovelaceCardConfig {
  title?: string
  titleIcon?: string
  titleBarStatusEntity?: string
  titleBarIcons?: TitleBarIconConfig[]
  tap_action?: TapAction
  columns?: {
    title: string
    rows: {
      icon: string
      valueEntity: string
      iconColor?: string
      unit?: string
    }[]
  }[]
}

function TitleBarIconComponent({
  iconConfig,
  hass
}: {
  iconConfig: TitleBarIconConfig
  hass: HomeAssistant | undefined
}) {
  const entityState = hass?.states?.[iconConfig.entity]
  const isActive = entityState?.state === "on"
  const colorName = isActive && iconConfig["color-active"] ? iconConfig["color-active"] : "#ccc"
  const color = resolveColor(colorName)

  return (
    <ha-icon
      icon={iconConfig.icon}
      style={{
        "--mdc-icon-size": "20px",
        color: color
      } as any}
    />
  )
}

export function InfoCard ({
  config,
  hass,
}: CardProps) {
  const configTyped = config as InfoCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const status = lookupEntityInState(hass, configTyped?.titleBarStatusEntity ?? "")?.state ?? ""

  const handleClick = () => {
    handleTapAction(configTyped?.tap_action, hass, configTyped?.entity)
  }

  const theme = getTheme()

  return (
    <div
      className="bg-card w-119 h-32 p-4 flex flex-col justify-between"
      style={{
        borderRadius: theme.card.borderRadius,
        backgroundColor: theme.card.backgroundColor,
        cursor: configTyped?.tap_action ? 'pointer' : 'default'
      }}
      onClick={handleClick}
    >
      {/* Upper section */}
      <div className="flex items-center justify-between">
        {/* Upper left - Title with icon */}
        <div className="flex items-center gap-2">
          {configTyped?.titleIcon && (
            <ha-icon
              icon={configTyped.titleIcon}
              style={{
                "--mdc-icon-size": "20px",
                color: "white"
              } as any}
            />
          )}
          <span className="text-foreground font-medium">{configTyped?.title}</span>
        </div>

        {/* Upper right - Status and icons */}
        <div className="flex items-center gap-6">
          <span className="text-foreground text-sm">{status}</span>
          {configTyped?.titleBarIcons && configTyped.titleBarIcons.length > 0 && (
            <div className="flex items-center gap-2">
              {configTyped.titleBarIcons.map((iconConfig, idx) => (
                <TitleBarIconComponent
                  key={`${iconConfig.entity}-${idx}`}
                  iconConfig={iconConfig}
                  hass={hass}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator className="my-1" />

      {/* Lower section - Data columns */}
      {configTyped?.columns && configTyped.columns.length > 0 && (
        <div className="flex items-start justify-between gap-4 text-sm">
          {configTyped.columns.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">{column.title}</span>
              {column.rows.map((row, rowIdx) => {
                const entityState = lookupEntityInState(hass, row.valueEntity ?? "")
                const value = entityState?.state
                const isUnknown = !value || value === "unknown" || value === "unavailable"
                const displayValue = isUnknown ? "--" : value
                const rowColor = isUnknown ? "#888" : "white"
                const iconColorName = isUnknown ? "#888" : (row.iconColor || "white")
                const iconColor = resolveColor(iconColorName)

                return (
                  <div key={rowIdx} className="flex items-center gap-1">
                    <ha-icon
                      icon={row.icon}
                      style={{
                        "--mdc-icon-size": "16px",
                        color: iconColor
                      } as any}
                    />
                    <span style={{ color: rowColor }}>{displayValue}</span>
                    {!isUnknown && row.unit && <span style={{ color: rowColor }} className="text-xs">{row.unit}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
