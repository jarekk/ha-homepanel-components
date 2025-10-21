import { standardTheme } from "./standardTheme"
import { roundedBeautyTheme } from "./roundedBeautyTheme"
import { cssThemes, type CSSThemeName } from "./cssThemes"

// Define theme type
export type Theme = typeof standardTheme | typeof roundedBeautyTheme

// Default theme is standard
let currentTheme: Theme = standardTheme
let currentCSSTheme: CSSThemeName = 'standard'

// Mapping between JS themes and CSS theme names
const themeMapping: Map<Theme, CSSThemeName> = new Map([
  [standardTheme, 'standard'],
  [roundedBeautyTheme, 'rounded-beauty'],
])

export const getTheme = () => currentTheme

export const setTheme = (theme: Theme) => {
  currentTheme = theme
  currentCSSTheme = themeMapping.get(theme) || 'standard'
  applyCSSTheme(currentCSSTheme)
}

export const setThemeByName = (themeName: CSSThemeName) => {
  currentCSSTheme = themeName
  applyCSSTheme(themeName)

  // Update JS theme to match
  switch (themeName) {
    case 'standard':
      currentTheme = standardTheme
      break
    case 'rounded-beauty':
      currentTheme = roundedBeautyTheme
      break
  }
}

/**
 * Apply CSS theme variables to the document root
 */
export const applyCSSTheme = (themeName: CSSThemeName) => {
  const theme = cssThemes[themeName]
  console.log("Applying CSS theme:", themeName, theme)
  if (!theme) {
    console.warn(`Theme "${themeName}" not found, using standard`)
    return
  }

  const root = document.documentElement

  // Apply all CSS variables
  Object.entries(theme.cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

/**
 * Initialize theme on load
 */
export const initializeTheme = (themeName: CSSThemeName = 'standard') => {
  setThemeByName(themeName)
}

// Export all themes
export { standardTheme, roundedBeautyTheme }
export { cssThemes } from "./cssThemes"
