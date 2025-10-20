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

interface EnergyRowConfig {
  name: string
  currentPowerEntity: string
  dailyEnergyEntity: string
}

interface EnergyUsageInfoCardConfig extends LovelaceCardConfig {
  title?: string
  titleIcon?: string
  titleBarIcons?: TitleBarIconConfig[]
  rows?: EnergyRowConfig[]
  totalHouseLoadEntity?: string
  tap_action?: TapAction
}

export function EnergyUsageInfoCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as EnergyUsageInfoCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  const handleClick = () => {
    handleTapAction(configTyped?.tap_action, hass, configTyped?.entity)
  }

  // Calculate total of all appliances
  const calculateTotal = () => {
    let totalPower = 0
    let totalEnergy = 0

    configTyped?.rows?.forEach(row => {
      const powerState = lookupEntityInState(hass, row.currentPowerEntity)?.state
      const energyState = lookupEntityInState(hass, row.dailyEnergyEntity)?.state

      const power = powerState && powerState !== "unknown" && powerState !== "unavailable"
        ? parseFloat(powerState)
        : 0
      const energy = energyState && energyState !== "unknown" && energyState !== "unavailable"
        ? parseFloat(energyState)
        : 0

      if (!isNaN(power)) totalPower += power
      if (!isNaN(energy)) totalEnergy += energy
    })

    return { power: totalPower, energy: totalEnergy }
  }

  const total = calculateTotal()
  const houseLoadState = lookupEntityInState(hass, configTyped?.totalHouseLoadEntity ?? "")?.state
  const houseLoad = houseLoadState && houseLoadState !== "unknown" && houseLoadState !== "unavailable"
    ? parseFloat(houseLoadState)
    : 0

  // Format values
  const formatPower = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return "--"
    return value.toFixed(0)
  }

  const formatEnergy = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return "--"
    return value.toFixed(1)
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
          <h2 className="text-sm font-medium text-foreground">{configTyped?.title || "Energy Usage"}</h2>
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

      {/* Energy rows */}
      <div className="flex flex-col gap-1">
        {configTyped?.rows?.map((row, idx) => {
          const powerState = lookupEntityInState(hass, row.currentPowerEntity)?.state
          const energyState = lookupEntityInState(hass, row.dailyEnergyEntity)?.state

          const power = powerState && powerState !== "unknown" && powerState !== "unavailable"
            ? parseFloat(powerState)
            : undefined
          const energy = energyState && energyState !== "unknown" && energyState !== "unavailable"
            ? parseFloat(energyState)
            : undefined

          return (
            <div key={idx} className="flex items-center text-xs">
              <span className="text-gray-400 flex-1 text-left">{row.name}</span>
              <div className="flex items-center gap-2 w-[110px] justify-end">
                <span className="text-white text-right">{formatPower(power)} W</span>
                <span className="text-gray-400 w-[45px] text-right">{formatEnergy(energy)} kWh</span>
              </div>
            </div>
          )
        })}
      </div>
            {/* House load row */}
      {configTyped?.totalHouseLoadEntity && (
        <>
          <div className="flex items-center text-xs font-medium mt-1">
            <span className="text-gray-400 flex-1">Andere</span>
            <div className="flex items-center gap-2 w-[110px] justify-end">
              <span className="text-white text-right">{formatPower(houseLoad-total.power)} W</span>
              <span className="text-gray-400 w-[45px] text-right">{formatEnergy(0)} kWh</span>
            </div>
          </div>
        </>
      )}

      {/* Separator */}
      <div className="border-t border-gray-600 my-2" />

      {/* Total row */}
      <div className="flex items-center text-xs font-medium">
        <span className="text-gray-400 flex-1">Summe</span>
        <div className="flex items-center gap-2 w-[110px] justify-end">
          <span className="text-white text-right">{formatPower(houseLoad)} W</span>
          <span className="text-gray-400 w-[45px] text-right">{formatEnergy(total.energy)} kWh</span>
        </div>
      </div>


    </div>
  )
}
