import { useRef } from "react"
import type { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers"

export type IndicatorWidgetCardProps = {
  config: LovelaceCardConfig | undefined
  hass: HomeAssistant | undefined
}
export function IndicatorWidgetCard({
  config,
  hass,
}: IndicatorWidgetCardProps) {
  const renderRef = useRef(0)
  renderRef.current++

  const mainState = hass?.states?.[config?.entity]?.state ?? "N/A"
  const mainTitle =
    hass?.states?.[config?.entity]?.attributes.friendly_name ?? "N/A"
  const stateSW = hass?.states?.[config?.entitySW]?.state ?? "N/A"

  return (
    <div className="w-24 h-24 p-2 bg-orange-400 relative">
      <div className="w-full h-full text-center">
        <div className="text-lg">{mainState}</div>
        <div className="text-sm whitespace-normal font-bold">{mainTitle}</div>
      </div>
      <div className="absolute bottom-0 right-0 p-1 text-xss text-white">
        {renderRef.current}
      </div>
      <div className="absolute bottom-0 left-0 p-1 text-xss text-white">
        {stateSW}
      </div>
    </div>
  )
}
