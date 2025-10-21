import { useRef, useEffect, useCallback, useMemo, memo } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"

interface HorizontalStackCardConfig extends LovelaceCardConfig {
  cards?: LovelaceCardConfig[] // Array of cards to stack horizontally
}

// Render a card in a ref container - moved outside to prevent recreation
const CardContainer = memo(({
  cardConfig,
  hass,
  createCardElement
}: {
  cardConfig: LovelaceCardConfig
  hass: any
  createCardElement: (config: LovelaceCardConfig) => Promise<any>
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardElementRef = useRef<any>(null)

  // Create a stable key from the cardConfig to prevent unnecessary re-renders
  const configKey = useMemo(() => JSON.stringify(cardConfig), [cardConfig])

  // Create card element only once when cardConfig changes
  useEffect(() => {
    let isMounted = true

    const initCard = async () => {
      if (containerRef.current) {
        // Clear previous content
        containerRef.current.innerHTML = ''
        cardElementRef.current = null

        // Create and append the card element
        const cardElement = await createCardElement(cardConfig)
        cardElementRef.current = cardElement

        // Set initial hass
        if (hass) {
          cardElement.hass = hass
        }

        // Only append if still mounted
        if (isMounted && containerRef.current) {
          containerRef.current.appendChild(cardElement)
        }
      }
    }

    initCard()

    return () => {
      isMounted = false
      cardElementRef.current = null
      // Cleanup when unmounting
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [configKey, createCardElement])

  // Update hass when it changes (without recreating the card)
  useEffect(() => {
    if (cardElementRef.current && hass) {
      cardElementRef.current.hass = hass
    }
  }, [hass])

  return <div ref={containerRef} />
})

CardContainer.displayName = 'CardContainer'

export function HorizontalStackCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as HorizontalStackCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  // Memoize cards to prevent unnecessary re-renders
  const cards = useMemo(() => configTyped?.cards || [], [configTyped?.cards])

  // Create a card element using Home Assistant's card system (stable - no hass dependency)
  const createCardElement = useCallback(async (cardConfig: LovelaceCardConfig) => {
    const helpers = await (window as any).loadCardHelpers()
    const element = await helpers.createCardElement(cardConfig)
    return element
  }, [])

  return (
    <div className="w-full flex justify-start" >
      <div className="flex gap-2">
        {cards.map((cardConfig, cardIdx) => (
          <CardContainer
            key={`card-${cardIdx}`}
            cardConfig={cardConfig}
            hass={hass}
            createCardElement={createCardElement}
          />
        ))}
      </div>
    </div>
  )
}
