import { theme } from "../config"

interface RangeData {
  value: number | null
  color: string
}

export class NumberRangeValueClassifier {

  private ranges: RangeData[]

  constructor(spec: string) {
    this.ranges = spec.split(";").map((part) => {
      const [valueStr, color] = part.split(":").map((s) => s.trim())
      const value = valueStr === "*" ? null : Number(valueStr)
      return {
        value: value,
        color: color,
      }
    })
  }

  public classify(value: string): string {
    const undefinedValue = ""
    const val = Number(value)
    if (value === undefined || value === null || isNaN(val)) {
      return undefinedValue
    }
    for (const range of this.ranges) {
      if (range.value === null || val < range.value) {
        return theme.namedColors[range.color as keyof typeof theme.namedColors] ?? range.color
      }
    }
    return undefinedValue
  }
}