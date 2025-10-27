import { useRef } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { lookupEntityInState, resolveColor } from "../utils/widgetUtils"
import { handleTapAction, type TapAction } from "../utils/actionHandler"
import { getTheme } from "../theme/themeContext"
import { Separator } from "../components/Separator"

interface TitleBarIconConfig {
  icon: string
  entity?: string
  "color-active"?: string
}

interface EnergyFlowCardConfig extends LovelaceCardConfig {
  title?: string
  titleIcon?: string
  titleBarIcons?: TitleBarIconConfig[]
  tap_action?: TapAction
  // Energy flow entities
  solarPowerEntity?: string
  gridPowerEntity?: string
  housePowerEntity?: string
  batteryPowerEntity?: string
  thermalBatteryPowerEntity?: string
}

export function EnergyFlowCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as EnergyFlowCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  const handleClick = () => {
    handleTapAction(configTyped?.tap_action, hass, configTyped?.entity)
  }

  // Get power values
  const getSolarPower = () => {
    const state = lookupEntityInState(hass, configTyped?.solarPowerEntity ?? "")?.state
    return state && state !== "unknown" && state !== "unavailable" ? parseFloat(state) : 0
  }

  const getGridPower = () => {
    const state = lookupEntityInState(hass, configTyped?.gridPowerEntity ?? "")?.state
    return state && state !== "unknown" && state !== "unavailable" ? parseFloat(state) : 0
  }

  const getHousePower = () => {
    const state = lookupEntityInState(hass, configTyped?.housePowerEntity ?? "")?.state
    return state && state !== "unknown" && state !== "unavailable" ? parseFloat(state) : 0
  }

  const getBatteryPower = () => {
    const state = lookupEntityInState(hass, configTyped?.batteryPowerEntity ?? "")?.state
    return state && state !== "unknown" && state !== "unavailable" ? parseFloat(state) : 0
  }

  const getThermalBatteryPower = () => {
    const state = lookupEntityInState(hass, configTyped?.thermalBatteryPowerEntity ?? "")?.state
    return state && state !== "unknown" && state !== "unavailable" ? parseFloat(state) : 0
  }

  const solarPower = getSolarPower()
  const gridPower = getGridPower()
  const housePower = getHousePower()
  const batteryPower = getBatteryPower()
  const thermalBatteryPower = getThermalBatteryPower()

  // Format power values
  const formatPower = (value: number, showSign = false) => {
    if (value === 0 || isNaN(value)) return "--"
    const formatted = Math.abs(value).toFixed(0)
    if (!showSign) return formatted
    return value > 0 ? `+${formatted}` : `-${formatted}`
  }

  // Get color for signed values (positive = green, negative = red)
  const getSignColor = (value: number) => {
    if (value === 0 || isNaN(value)) return "white"
    return value > 0 ? "#10b981" : "#ef4444"
  }

  return (
    <div
      className="bg-card w-58 h-auto pl-4 pr-2 py-3 overflow-hidden relative"
      style={{
        borderRadius: theme.card.borderRadius,
        backgroundColor: theme.card.backgroundColor,
        cursor: configTyped?.tap_action ? 'pointer' : 'default'
      }}
      onClick={handleClick}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between mb-3">
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
          <h2 className="text-sm font-medium text-foreground">{configTyped?.title || "Energy Flow"}</h2>
        </div>

        {/* Title bar icons */}
        {configTyped?.titleBarIcons && configTyped.titleBarIcons.length > 0 && (
          <div className="flex items-center gap-2">
            {configTyped.titleBarIcons.map((iconConfig, idx) => {
              const entityState = iconConfig.entity
                ? lookupEntityInState(hass, iconConfig.entity)
                : null
              const isActive = entityState?.state === "on" || entityState?.state === "open"
              const iconColor = isActive && iconConfig["color-active"]
                ? resolveColor(iconConfig["color-active"])
                : "white"

              return (
                <span key={idx}>
                  <ha-icon
                    icon={iconConfig.icon}
                    style={{
                      "--mdc-icon-size": "16px",
                      color: iconColor
                    } as any}
                  />
                </span>
              )
            })}
          </div>
        )}
      </div>

      <Separator className="mb-3" />

      {/* Energy statistics table */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center text-xs">
          <span className="text-gray-400 flex-1">Solar</span>
          <span className="text-right w-24" style={{ color: "#10b981" }}>
            {formatPower(solarPower)} W
          </span>
        </div>

        <div className="flex items-center text-xs">
          <span className="text-gray-400 flex-1">Battery</span>
          <span className="text-right w-24" style={{ color: getSignColor(batteryPower) }}>
            {formatPower(batteryPower, true)} W
          </span>
        </div>

        <div className="flex items-center text-xs">
          <span className="text-gray-400 flex-1">Thermal Battery</span>
          <span className="text-right w-24" style={{ color: getSignColor(thermalBatteryPower) }}>
            {formatPower(thermalBatteryPower, true)} W
          </span>
        </div>

        <div className="flex items-center text-xs">
          <span className="text-gray-400 flex-1">Grid</span>
          <span className="text-right w-24" style={{ color: getSignColor(gridPower) }}>
            {formatPower(gridPower, true)} W
          </span>
        </div>
      </div>
    </div>
  )
}
