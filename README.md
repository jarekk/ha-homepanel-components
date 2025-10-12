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
