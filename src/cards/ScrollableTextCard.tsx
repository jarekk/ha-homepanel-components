import { useRef } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { lookupEntityInState } from "../utils/widgetUtils"
import { handleTapAction, type TapAction } from "../utils/actionHandler"
import { getTheme } from "../theme/themeContext"

interface ScrollableTextCardConfig extends LovelaceCardConfig {
  title?: string
  titleIcon?: string
  entity?: string // Entity containing the text to display
  attribute?: string // Attribute name to pull text from (if entity is specified)
  text?: string // Static text (if no entity)
  height?: number // Height in pixels (default: 200)
  tap_action?: TapAction
}

export function ScrollableTextCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as ScrollableTextCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  const handleClick = () => {
    handleTapAction(configTyped?.tap_action, hass, configTyped?.entity)
  }

  // Get text from entity, attribute, or config
  const entityState = lookupEntityInState(hass, configTyped?.entity ?? "")

  let textContent = ""
  if (configTyped?.entity && configTyped?.attribute && entityState?.attributes) {
    // Pull from attribute
    console.log("📥 Pulling text from entity attribute", configTyped.entity, configTyped.attribute)
    console.log("📥 Attributes value:", entityState.attributes)
    textContent = entityState.attributes[configTyped.attribute] || "none"
  } else if (entityState?.state) {
    // Pull from state
    textContent = entityState.state
  } else {
    // Use static text
    textContent = configTyped?.text || ""
  }

  const cardHeight = configTyped?.height || 200

  return (
    <div
      className="bg-card w-full overflow-hidden relative flex flex-col"
      style={{
        borderRadius: theme.card.borderRadius,
        backgroundColor: theme.card.backgroundColor,
        height: `${cardHeight}px`
      }}
    >
      {/* Title bar */}
      {configTyped?.title && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-600">
          {configTyped?.titleIcon && (
            <ha-icon
              icon={configTyped.titleIcon}
              style={{
                "--mdc-icon-size": "20px",
                color: "white"
              } as any}
            />
          )}
          <h2 className="text-sm font-medium text-foreground">{configTyped.title}</h2>
        </div>
      )}

      {/* Scrollable text content */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{
          cursor: configTyped?.tap_action ? 'pointer' : 'default'
        }}
        onClick={handleClick}
      >
        <div className="text-sm text-foreground whitespace-pre-wrap">
          {textContent}
        </div>
      </div>
    </div>
  )
}
