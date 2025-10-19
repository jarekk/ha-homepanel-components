import { useRef } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { lookupEntityInState } from "../utils/widgetUtils"
import { Separator } from "../components/Separator"
import { handleTapAction, type TapAction } from "../utils/actionHandler"
import { getTheme } from "../theme/themeContext"

interface RainWateringCardConfig extends LovelaceCardConfig {
  title?: string
  titleIcon?: string
  titleBarStatusEntity?: string
  tap_action?: TapAction
  labels?: {
    rain?: string
    plants?: string
    lawn?: string
    today?: string
    thisWeek?: string
    lastWeek?: string
  }
  rainData?: {
    todayEntity: string
    thisWeekEntity: string
    lastWeekEntity: string
  }
  plantsData?: {
    todayEntity: string
    thisWeekEntity: string
    lastWeekEntity: string
  }
  lawnData?: {
    todayEntity: string
    thisWeekEntity: string
    lastWeekEntity: string
  }
  currentWindEntity?: string
  currentWindIcon?: string
  currentRainEntity?: string
  currentRainIcon?: string
}

export function RainWateringCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as RainWateringCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  // Helper function to format values
  const formatValue = (value: string | undefined, unit: string): string => {
    if (!value || value === "unknown" || value === "unavailable") return "--"
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return "--"
    return `${numValue.toFixed(1)} ${unit}`
  }

  // Get rain data
  const rainTodayRaw = lookupEntityInState(hass, configTyped?.rainData?.todayEntity ?? "")?.state
  const rainThisWeekRaw = lookupEntityInState(hass, configTyped?.rainData?.thisWeekEntity ?? "")?.state
  const rainLastWeekRaw = lookupEntityInState(hass, configTyped?.rainData?.lastWeekEntity ?? "")?.state

  const rainToday = formatValue(rainTodayRaw, "mm")
  const rainThisWeek = formatValue(rainThisWeekRaw, "mm")
  const rainLastWeek = formatValue(rainLastWeekRaw, "mm")

  // Get plants watering data
  const plantsTodayRaw = lookupEntityInState(hass, configTyped?.plantsData?.todayEntity ?? "")?.state
  const plantsThisWeekRaw = lookupEntityInState(hass, configTyped?.plantsData?.thisWeekEntity ?? "")?.state
  const plantsLastWeekRaw = lookupEntityInState(hass, configTyped?.plantsData?.lastWeekEntity ?? "")?.state

  const plantsToday = formatValue(plantsTodayRaw, "h")
  const plantsThisWeek = formatValue(plantsThisWeekRaw, "h")
  const plantsLastWeek = formatValue(plantsLastWeekRaw, "h")

  // Get lawn watering data
  const lawnTodayRaw = lookupEntityInState(hass, configTyped?.lawnData?.todayEntity ?? "")?.state
  const lawnThisWeekRaw = lookupEntityInState(hass, configTyped?.lawnData?.thisWeekEntity ?? "")?.state
  const lawnLastWeekRaw = lookupEntityInState(hass, configTyped?.lawnData?.lastWeekEntity ?? "")?.state

  const lawnToday = formatValue(lawnTodayRaw, "h")
  const lawnThisWeek = formatValue(lawnThisWeekRaw, "h")
  const lawnLastWeek = formatValue(lawnLastWeekRaw, "h")

  // Get current conditions
  const currentWindRaw = lookupEntityInState(hass, configTyped?.currentWindEntity ?? "")?.state
  const currentRainRaw = lookupEntityInState(hass, configTyped?.currentRainEntity ?? "")?.state

  // Helper function to format current conditions
  const formatCurrentValue = (value: string | undefined, unit: string): string | undefined => {
    if (!value || value === "unknown" || value === "unavailable") return undefined
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return undefined
    return `${numValue.toFixed(1)} ${unit}`
  }

  const currentWind = formatCurrentValue(currentWindRaw, "m/s")
  const currentRain = formatCurrentValue(currentRainRaw, "mm")

  // Check if it's actually raining (value > 0)
  const isRaining = currentRainRaw && parseFloat(currentRainRaw) > 0

  const handleClick = () => {
    handleTapAction(configTyped?.tap_action, hass, configTyped?.entity)
  }

  // Labels with defaults
  const labels = {
    rain: configTyped?.labels?.rain || "Rain",
    plants: configTyped?.labels?.plants || "Watering plants",
    lawn: configTyped?.labels?.lawn || "Watering lawn",
    today: configTyped?.labels?.today || "today",
    thisWeek: configTyped?.labels?.thisWeek || "this week",
    lastWeek: configTyped?.labels?.lastWeek || "last week"
  }

  const theme = getTheme()

  return (
    <div
      className="bg-card w-119 relative overflow-hidden"
      style={{
        borderRadius: theme.card.borderRadius,
        backgroundColor: theme.card.backgroundColor,
        cursor: configTyped?.tap_action ? 'pointer' : 'default'
      }}
      onClick={handleClick}
    >
      {/* Background Trend Line 
      <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none" viewBox="0 0 500 200">
        <path
          d="M0,100 Q50,80 100,90 T200,85 T300,95 T400,90 T500,100 L500,200 L0,200 Z"
          fill="currentColor"
          className="text-primary"
        />
      </svg>*/}

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
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
            <h2 className="text-sm font-medium text-foreground">{configTyped?.title || "Rain & Watering"}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <ha-icon
                icon={configTyped?.currentWindIcon || "mdi:weather-windy"}
                style={{
                  "--mdc-icon-size": "16px",
                  color: "white"
                } as any}
              />
              <span className="text-xs text-foreground">{currentWind || "--"}</span>
            </div>
            <div className="flex items-center gap-1">
              <ha-icon
                icon={configTyped?.currentRainIcon || "mdi:weather-rainy"}
                style={{
                  "--mdc-icon-size": "16px",
                  color: isRaining ? "#3b82f6" : "white"
                } as any}
              />
              <span className="text-xs text-foreground">{currentRain || "--"}</span>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Data Columns */}
        <div className="grid gap-2" style={{ gridTemplateColumns: 'auto 0.8fr 1fr 1fr' }}>
          {/* Row Labels Column */}
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-2 opacity-0">Label</div>
            <div className="flex items-center h-5">
              <span className="text-xs text-muted-foreground">{labels.today}</span>
            </div>
            <div className="flex items-center h-5">
              <span className="text-xs text-muted-foreground">{labels.thisWeek}</span>
            </div>
            <div className="flex items-center h-5">
              <span className="text-xs text-muted-foreground">{labels.lastWeek}</span>
            </div>
          </div>

          {/* Rain Column */}
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-2">{labels.rain}</div>
            <div className="flex items-center gap-1 h-5">
              <ha-icon
                icon="mdi:water"
                style={{
                  "--mdc-icon-size": "14px",
                  color: "#ccc"
                } as any}
              />
              <span className="text-xs text-foreground">{rainToday}</span>
            </div>
            <div className="flex items-center gap-1 h-5">
              <ha-icon
                icon="mdi:water"
                style={{
                  "--mdc-icon-size": "14px",
                  color: "#ccc"
                } as any}
              />
              <span className="text-xs text-foreground">{rainThisWeek}</span>
            </div>
            <div className="flex items-center gap-1 h-5">
              <ha-icon
                icon="mdi:water"
                style={{
                  "--mdc-icon-size": "14px",
                  color: "#ccc"
                } as any}
              />
              <span className="text-xs text-foreground">{rainLastWeek}</span>
            </div>
          </div>

          {/* Watering Plants Column */}
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-2 whitespace-nowrap">{labels.plants}</div>
            <div className="flex items-center gap-1 h-5">
              <ha-icon
                icon="mdi:water"
                style={{
                  "--mdc-icon-size": "14px",
                  color: "#ccc"
                } as any}
              />
              <span className="text-xs text-foreground">{plantsToday}</span>
            </div>
            <div className="flex items-center gap-1 h-5">
              <ha-icon
                icon="mdi:water"
                style={{
                  "--mdc-icon-size": "14px",
                  color: "#ccc"
                } as any}
              />
              <span className="text-xs text-foreground">{plantsThisWeek}</span>
            </div>
            <div className="flex items-center gap-1 h-5">
              <ha-icon
                icon="mdi:water"
                style={{
                  "--mdc-icon-size": "14px",
                  color: "#ccc"
                } as any}
              />
              <span className="text-xs text-foreground">{plantsLastWeek}</span>
            </div>
          </div>

          {/* Watering Lawn Column */}
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-2">{labels.lawn}</div>
            <div className="flex items-center gap-1 h-5">
              <ha-icon
                icon="mdi:water"
                style={{
                  "--mdc-icon-size": "14px",
                  color: "#ccc"
                } as any}
              />
              <span className="text-xs text-foreground">{lawnToday}</span>
            </div>
            <div className="flex items-center gap-1 h-5">
              <ha-icon
                icon="mdi:water"
                style={{
                  "--mdc-icon-size": "14px",
                  color: "#ccc"
                } as any}
              />
              <span className="text-xs text-foreground">{lawnThisWeek}</span>
            </div>
            <div className="flex items-center gap-1 h-5">
              <ha-icon
                icon="mdi:water"
                style={{
                  "--mdc-icon-size": "14px",
                  color: "#ccc"
                } as any}
              />
              <span className="text-xs text-foreground">{lawnLastWeek}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
