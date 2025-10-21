/**
 * Base theme with default values
 * Other themes inherit from this
 */
export const baseTheme = {
  namedColors: {
    // https://htmlcolorcodes.com/
    // https://tailwindcolor.com/
    Normal: "#28b463",
    Information: "#d4ac0d",
    Warning: "#d68910",
    Error: "#ba4a00",
    Critical: "#cb4335",
    Disaster: "#a93226",
 
    VeryLowTemperature: "#2471a3",
    LowTemperature: "#138d75",
    StandardTemperature: "#28b463",
    HighTemperature: "#d68910",
    VeryHighTemperature: "#ba4a00",

    BalanceVeryPositive: "#8e44ad",
    BalancePositive: "#3498db",
    BalanceNormal: "#27ae60",
    BalanceNegative: "#27ae60",
    BalanceVeryNegative: "#e67e22",

    Undefined: "#707b7c",

    LevelLowest: "#a93226",
    LevelVeryLow: "#e67e22",
    LevelLow: "#d68910",
    LevelHalf: "#d4ac0d",
    LevelHigh: "#27ae60",
    LevelVeryHigh: "#28b463",
    LevelHighest: "#3bcb27",

    ActiveIconGreen: "#28b463",
    ActiveIconOrange: "#d68910",
    ActiveIconBlue: "#3498db",
  },

} as const

export type BaseTheme = typeof baseTheme
export type NamedColorKeys = keyof typeof baseTheme.namedColors
