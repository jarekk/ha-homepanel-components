export function Separator({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border-b border-gray-600 ${className}`}
      style={{ borderBottomWidth: '1px', paddingTop: '2px', paddingBottom: '2px' }}
    />
  )
}
