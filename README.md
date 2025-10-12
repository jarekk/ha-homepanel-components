# Homepanel custom components for Home Assistant

## Building

```
yarn
yarn run build
```

this produces `dist/ha-homepanel-components.js` which needs to be copied to HA's `www` directory.

## Installation in HA

- add `local/ha-homepanel-components.js` as custom resource

## Usage

Example:

```
      - type: custom:ha-homepanel-indicator-widget
        entity: sensor.meter_1_phase_b_voltage
      - type: custom:ha-homepanel-indicator-widget
        entity: sensor.plant_monitor_01_soil_moisture
        entitySW: sensor.plant_monitor_01_tze284_aao3yzhs_ts0601_temperature
```

## React

The custom components are implemented in React and Tailwind.

Bridging between React and web components (used by HA) is not trivial and implementation was heavily inspired by:

- https://community.home-assistant.io/t/lovelace-react-custom-lovelace-card-with-preact-signals-react/640053/14
- https://github.com/samuelthng/homeassistant-react-lovelace
- https://github.com/EnkodoNL/tabbed-card-programmable

As of now, the rendering is not optimized and components are re-rendered on each change of the `hass` object (callback from HA). The `homeassistant-react-lovelace` project explores the possibility of using preact signals to optimize this, but I had problems with this approach (all cards shared the same state).
