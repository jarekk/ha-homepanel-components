import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ha-icon': {
        icon?: string
        style?: React.CSSProperties
      }
    }
  }
}
