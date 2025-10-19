import { roundedBeautyTheme } from "./roundedBeautyTheme"

// Default theme is rounded-beauty
let currentTheme = roundedBeautyTheme

export const getTheme = () => currentTheme

export const setTheme = (theme: typeof roundedBeautyTheme) => {
  currentTheme = theme
}

// Export for convenience
export { roundedBeautyTheme }
