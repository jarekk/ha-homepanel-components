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
  batteryStateOfChargeEntity?: string // Battery state of charge percentage
  waterUsageEntity?: string // Current water usage
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

  // Get battery state of charge
  const getBatteryStateOfCharge = () => {
    const state = lookupEntityInState(hass, configTyped?.batteryStateOfChargeEntity ?? "")?.state
    return state && state !== "unknown" && state !== "unavailable" ? parseFloat(state) : undefined
  }

  const getWaterUsage = () => {
    const state = lookupEntityInState(hass, configTyped?.waterUsageEntity ?? "")?.state
    return state && state !== "unknown" && state !== "unavailable" ? parseFloat(state) : 0
  }

  const batterySOC = getBatteryStateOfCharge()
  const waterUsage = getWaterUsage()

  // Format power values
  const formatPower = (value: number, showSign = false) => {
    if (isNaN(value)) return "0"
    if (value === 0) return "0"
    const formatted = Math.abs(value).toFixed(0)
    if (!showSign) return formatted
    return value > 0 ? `+${formatted}` : `-${formatted}`
  }

  // Get color for signed values (positive = green, negative = red, zero = grey)
  const getSignColor = (value: number) => {
    if (value === 0 || isNaN(value)) return "#9ca3af"
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

        <div className="flex items-center gap-4">
          {/* Battery state of charge */}
          {configTyped?.batteryStateOfChargeEntity && batterySOC !== undefined && (
            <div className="flex items-center gap-1">
              <ha-icon
                icon="mdi:battery"
                style={{
                  "--mdc-icon-size": "16px",
                  color: "white"
                } as any}
              />
              <span className="text-foreground text-sm">{batterySOC.toFixed(0)}%</span>
            </div>
          )}

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
      </div>

      <Separator className="mb-3" />

      {/* Energy statistics table */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center text-xs">
          <span className="text-gray-400 flex-1">Solar</span>
          <span className="text-right w-24" style={{ color: solarPower === 0 || isNaN(solarPower) ? "#9ca3af" : "#10b981" }}>
            {formatPower(solarPower)} W
          </span>
        </div>

        <div className="flex items-center text-xs">
          <span className="text-gray-400 flex-1">House</span>
          <span className="text-right w-24" style={{ color: housePower === 0 || isNaN(housePower) ? "#9ca3af" : "white" }}>
            {formatPower(housePower)} W
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
          <span className="text-right w-24" style={{ color: getSignColor(-gridPower) }}>
            {formatPower(-gridPower, true)} W
          </span>
        </div>

        {configTyped?.waterUsageEntity && (
          <>
            <div className="border-t border-gray-600 my-2" />
            <div className="flex items-center text-xs">
              <span className="text-gray-400 flex-1">Water</span>
              <span className="text-right w-24" style={{ color: waterUsage === 0 || isNaN(waterUsage) ? "#9ca3af" : "white" }}>
                {formatPower(waterUsage)} L/min
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
