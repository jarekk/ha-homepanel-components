import { memo } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import {
  evaluateExpression,
  resolveColor,
  lookupEntityInState,
} from "../utils/widgetUtils"
import type { NamedColorKeys } from "../theme/standardTheme"

interface IndicatorWidgetCardConfig extends LovelaceCardConfig {
  title?: string
  titleExpr?: string
  entity: string
  valueExpr?: string
  entityNW?: string
  entityNE?: string
  entitySW?: string
  entitySE?: string
  bgColor?: string
  bgColorExpr?: string
}

const IndicatorWidgetMemo = memo(IndicatorWidgetView)

export function IndicatorWidgetCard({ config, hass }: CardProps) {
  const configTyped = config as IndicatorWidgetCardConfig | undefined

  const entityMain = lookupEntityInState(hass, configTyped?.entity)
  const rawValue = entityMain?.state

  const rawValueNW = lookupEntityInState(hass, configTyped?.entityNW)?.state
  const rawValueNE = lookupEntityInState(hass, configTyped?.entityNE)?.state
  const rawValueSW = lookupEntityInState(hass, configTyped?.entitySW)?.state
  const rawValueSE = lookupEntityInState(hass, configTyped?.entitySE)?.state

  let title: string =
    config?.title ?? entityMain?.attributes.friendly_name ?? ""

  if (configTyped?.titleExpr) {
    title =
      evaluateExpression(
        configTyped?.titleExpr,
        rawValue ?? "",
        { fn: entityMain?.attributes.friendly_name },
        hass
      ) ?? ""
  }

  let bgColorName: string = "Undefined" as const satisfies NamedColorKeys

  if (configTyped?.bgColor) {
    bgColorName = configTyped.bgColor
  }
  if (configTyped?.bgColorExpr) {
    bgColorName =
      evaluateExpression(configTyped.bgColorExpr, rawValue ?? "", {}, hass) ??
      ""
  }

  let value: string = rawValue ?? ""
  if (configTyped?.valueExpr) {
    value =
      evaluateExpression(configTyped?.valueExpr, rawValue ?? "", {}, hass) ?? ""
  }
  const valueNW = rawValueNW
  const valueNE = rawValueNE
  const valueSW = rawValueSW
  const valueSE = rawValueSE

  return (
    <IndicatorWidgetMemo
      title={title}
      bgColor={resolveColor(bgColorName)}
      value={value}
      valueSW={valueSW}
      valueSE={valueSE}
      valueNW={valueNW}
      valueNE={valueNE}
    />
  )
}

type IndicatorWidgetViewProps = {
  title: string
  bgColor: string
  value: string | undefined
  valueNW: string | undefined
  valueNE: string | undefined
  valueSW: string | undefined
  valueSE: string | undefined
}

function IndicatorWidgetView(props: IndicatorWidgetViewProps) {
  return (
    <div
      className="w-24 h-24 p-2 relative"
      style={{ backgroundColor: props.bgColor }}
    >
      <div className="w-full h-full text-center">
        <div className="text-lg">{props.value ?? "N/A"}</div>
        <div className="text-sm whitespace-normal font-bold">{props.title}</div>
      </div>
      {props.valueNW && (
        <div className="absolute top-0 left-0 p-1 text-xss text-white">
          {props.valueNW}
        </div>
      )}
      {props.valueNE && (
        <div className="absolute top-0 right-0 p-1 text-xss text-white">
          {props.valueNE}
        </div>
      )}
      {props.valueSW && (
        <div className="absolute bottom-0 left-0 p-1 text-xss text-white">
          {props.valueSW}
        </div>
      )}
      {props.valueSE && (
        <div className="absolute bottom-0 right-0 p-1 text-xss text-white">
          {props.valueSE}
        </div>
      )}
    </div>
  )
}
