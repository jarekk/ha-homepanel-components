import React from "react"
import ReactDOM from "react-dom/client"
import type { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers"
import styles from "../App.css?inline"
import type { CustomCardReactComponent } from "./registerCard"

const createReactCard = (
  name: string,
  ReactComponent: CustomCardReactComponent
) => {
  return class Card extends HTMLElement {
    private container: HTMLDivElement
    private root: ReactDOM.Root
    private config: LovelaceCardConfig | undefined
    private state: HomeAssistant | undefined

    constructor() {
      super()
      this.attachShadow({ mode: "open" })
      this.container = document.createElement("div")
      this.shadowRoot!.appendChild(this.container)
      const style = document.createElement("style")
      style.textContent = styles
      this.shadowRoot!.appendChild(style)

      this.root = ReactDOM.createRoot(this.container)

      this.render()
    }

    set hass(hass: HomeAssistant) {
      this.state = hass
      this.render()
    }

    render() {
      // const style = document.createElement("style")
      // style.textContent = styles
      // this.shadowRoot!.appendChild(style)

      this.root.render(
        <React.StrictMode>
          <ReactComponent config={this.config} hass={this.state} />
        </React.StrictMode>
      )
    }

    static getConfigElement() {
      return document.createElement(`${name}-editor`)
    }

    setConfig(config: LovelaceCardConfig) {
      this.config = config
      this.render()
    }

    configChanged(newConfig: LovelaceCardConfig) {
      this.config = newConfig
      this.render()
    }

    getCardSize() {
      return Math.max(
        1,
        Math.ceil(this.shadowRoot!.host.getBoundingClientRect().height / 50)
      )
    }
  }
}

export default createReactCard
