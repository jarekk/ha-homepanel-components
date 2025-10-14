import { memo, useRef } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import { NumberRangeValueClassifier } from "../registry/numberRangeValueClassifier"
import type { CardProps } from "../utils/registerCard"
import { theme } from "../config"
import { lookupEntityInState } from "../utils/widgetUtils"

interface IndicatorWidgetCardConfig extends LovelaceCardConfig {
  title?: string
  entity: string
  entitySW?: string
  bgColor?: string
  bgColorClassifyRanges?: string
  valueFormat?: string
}

const IndicatorWidgetMemo = memo(IndicatorWidgetView)

export function IndicatorWidgetCard({ config, hass }: CardProps) {
  const configTyped = config as IndicatorWidgetCardConfig | undefined

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

  let value = entityMain?.state
  if (configTyped?.valueFormat && value) {
    value = configTyped?.valueFormat.replaceAll("{value}", value)
  }

  return (
    <IndicatorWidgetMemo
      mainTitle={mainTitle}
      bgColor={bgColor}
      value={value}
      stateSW={stateSW}
    />
  )
}

type IndicatorWidgetViewProps = {
  mainTitle: string
  bgColor: string
  value: string | undefined
  stateSW: string
}

function IndicatorWidgetView(props: IndicatorWidgetViewProps) {
  const renderRef = useRef(0)
  renderRef.current++
  return (
    <div
      className="w-24 h-24 p-2 relative"
      style={{ backgroundColor: props.bgColor }}
    >
      <div className="w-full h-full text-center">
        <div className="text-lg">{props.value ?? "N/A"}</div>
        <div className="text-sm whitespace-normal font-bold">
          {props.mainTitle}
        </div>
      </div>
      <div className="absolute bottom-0 right-0 p-1 text-xss text-white">
        {renderRef.current}
      </div>
      <div className="absolute bottom-0 left-0 p-1 text-xss text-white">
        {props.stateSW}
      </div>
    </div>
  )
}
