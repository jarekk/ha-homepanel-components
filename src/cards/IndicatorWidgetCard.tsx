import { useRef } from "react"
import type { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers"
import { NumberRangeValueClassifier } from "../registry/numberRangeValueClassifier"
import type { CardProps } from "../utils/registerCard"
import { theme } from "../config"

interface IndicatorWidgetCardConfig extends LovelaceCardConfig {
  title?: string
  entity: string
  entitySW?: string
  bgColor?: string
  bgColorClassifyRanges?: string
}

function lookupEntityInState(
  hass: HomeAssistant | undefined,
  entityId: string | undefined
) {
  if (!hass || !entityId) return undefined
  return hass.states?.[entityId]
}

export function IndicatorWidgetCard({ config, hass }: CardProps) {
  const configTyped = config as IndicatorWidgetCardConfig | undefined
  const renderRef = useRef(0)
  renderRef.current++

  const entityMain = lookupEntityInState(hass, configTyped?.entity)
  const entitySW = lookupEntityInState(hass, configTyped?.entitySW)

  const mainTitle =
    config?.title ?? entityMain?.attributes.friendly_name ?? "N/A"
  const stateSW = entitySW?.state ?? "N/A"

  let bgColor = theme.namedColors.Undefined

  if (configTyped?.bgColorClassifyRanges && entityMain) {
    const classifier = new NumberRangeValueClassifier(
      configTyped.bgColorClassifyRanges
    )
    bgColor = classifier.classify(entityMain.state)
  }
  if (configTyped?.bgColor) {
    bgColor = configTyped.bgColor
  }

  return (
    <div
      className="w-24 h-24 p-2 relative"
      style={{ backgroundColor: bgColor }}
    >
      <div className="w-full h-full text-center">
        <div className="text-lg">{entityMain?.state}</div>
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
