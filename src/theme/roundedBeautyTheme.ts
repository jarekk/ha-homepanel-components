import { baseTheme } from "./baseTheme"

/**
 * Rounded Beauty theme - inherits from baseTheme
 * Currently uses the same values as baseTheme
 */
export const roundedBeautyTheme = {
  ...baseTheme,
  
  card: {
    backgroundColor: 'rgb(23 34 59)',
    borderRadius: '2px',
    inactiveButtonBackgroundColor: '#2c3b5c',
    activeButtonBackgroundColor: '#5370b1',
    activeLightButtonBackgroundColor: '#b17d53',
  }
} as const

export type RoundedBeautyTheme = typeof roundedBeautyTheme
