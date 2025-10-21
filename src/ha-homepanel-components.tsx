import registerCard from "./utils/registerCard"
import styles from "./App.css?inline"
import { IndicatorWidgetCard } from "./cards/IndicatorWidgetCard"
import { InfoCard } from "./cards/InfoCard"
import { RainWateringCard } from "./cards/RainWateringCard"
import { ButtonCard } from "./cards/ButtonCard"
import { ContainerCard } from "./cards/ContainerCard"
import { CoverControlButtonCard } from "./cards/CoverControlButtonCard"
import { EnergyUsageInfoCard } from "./cards/EnergyUsageInfoCard"
import { ScrollableTextCard } from "./cards/ScrollableTextCard"
import { NotificationsCard } from "./cards/NotificationsCard"
import { HorizontalStackCard } from "./cards/HorizontalStackCard"
import { initializeTheme } from "./theme/themeContext"

// function loadCSS(url: string) {
//   const link = document.createElement("link")
//   link.type = "text/css"
//   link.rel = "stylesheet"
//   link.href = url
//   document.head.appendChild(link)
// }

function loadDirectCSS(styles: string) {
  const style = document.createElement("style")
  style.textContent = styles
  document.head.appendChild(style)
}

loadDirectCSS(styles)

// Initialize theme with CSS variables
initializeTheme('rounded-beauty')

// Display startup logo
console.log(`
 _   _                                            _
| | | | ___  _ __ ___   ___ _ __   __ _ _ __   ___| |
| |_| |/ _ \\| '_ \` _ \\ / _ \\ '_ \\ / _\` | '_ \\ / _ \\ |
|  _  | (_) | | | | | |  __/ |_) | (_| | | | |  __/ |
|_| |_|\\___/|_| |_| |_|\\___| .__/ \\__,_|_| |_|\\___|_|
                           |_|
  v0.1 Loaded Successfully
`)

registerCard("ha-homepanel-indicator-widget", IndicatorWidgetCard)
registerCard("ha-homepanel-info", InfoCard)
registerCard("ha-homepanel-rain-watering", RainWateringCard)
registerCard("ha-homepanel-button", ButtonCard)
registerCard("ha-homepanel-container", ContainerCard)
registerCard("ha-homepanel-cover-control", CoverControlButtonCard)
registerCard("ha-homepanel-energy-usage", EnergyUsageInfoCard)
registerCard("ha-homepanel-scrollable-text", ScrollableTextCard)
registerCard("ha-homepanel-notifications", NotificationsCard)
registerCard("ha-homepanel-horizontal-stack", HorizontalStackCard)
