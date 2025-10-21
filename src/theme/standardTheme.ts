import { baseTheme } from "./baseTheme"

export const standardTheme = {
  ...baseTheme,

  card: {
    backgroundColor: 'rgb(23 34 59)',
    borderRadius: '2px',
    inactiveButtonBackgroundColor: '#2c3b5c',
    activeButtonBackgroundColor: '#5370b1',
    activeLightButtonBackgroundColor: '#b17d53',
  }
} as const

export type NamedColorKeys = keyof typeof standardTheme.namedColors
