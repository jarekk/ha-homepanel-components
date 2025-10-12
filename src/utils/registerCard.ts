import type { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers"
import createReactCard from "./createReactCard"
import type { JSX } from "react"

export interface CardProps {
  config: LovelaceCardConfig | undefined
  hass: HomeAssistant | undefined
}

export type CustomCardReactComponent = (props: CardProps) => JSX.Element

export default function registerCard(
  cardName: string,
  component: CustomCardReactComponent
) {
  const ReactNode = createReactCard(cardName, component)
  customElements.define(cardName, ReactNode)
  console.info("Registered custom card component:", cardName)
}
