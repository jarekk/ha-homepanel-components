/**
 * CSS theme definitions that work alongside the themeContext
 * These define CSS custom properties for each theme
 */

export interface CSSTheme {
  name: string
  cssVariables: Record<string, string>
}

/**
 * Standard CSS Theme - matches the values in App.css
 */
export const standardCSSTheme: CSSTheme = {
  name: 'standard',
  cssVariables: {
    '--text-tiny': '0.625rem',
    '--spacing': '5px',
  }
}

/**
 * Rounded Beauty CSS Theme - same as standard for now
 */
export const roundedBeautyCSSTheme: CSSTheme = {
  name: 'rounded-beauty',
  cssVariables: {
    '--spacing': '0.25rem',
  }
}

// Map of all available CSS themes
export const cssThemes = {
  'standard': standardCSSTheme,
  'rounded-beauty': roundedBeautyCSSTheme,
} as const

export type CSSThemeName = keyof typeof cssThemes
