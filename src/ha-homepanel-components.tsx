import registerCard from "./utils/registerCard"
import styles from "./App.css?inline"
import { IndicatorWidgetCard } from "./cards/IndicatorWidgetCard"

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

registerCard("ha-homepanel-indicator-widget", IndicatorWidgetCard)
