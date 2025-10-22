import type { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers"
import createReactCard from "./createReactCard"
import type { JSX } from "react"

export interface CardProps {
  config: LovelaceCardConfig | undefined
  hass: HomeAssistant | undefined
}

export type CustomCardReactComponent = (props: CardProps) => JSX.Element

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string }>
  }
}

export default function registerCard(
  cardName: string,
  component: CustomCardReactComponent
) {
  const ReactNode = createReactCard(cardName, component)

  // Check if already registered
  if (customElements.get(cardName)) {
    return
  }

  customElements.define(cardName, ReactNode)

  // Register in window.customCards for Home Assistant UI card picker
  if (!window.customCards) {
    window.customCards = []
  }

  window.customCards.push({
    type: cardName,
    name: cardName,
    description: `Custom card: ${cardName}`
  })

  console.info("Registered custom card component:", cardName)
}
