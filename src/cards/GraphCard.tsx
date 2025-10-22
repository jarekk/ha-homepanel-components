import { useState, useEffect, useRef, useMemo } from 'react'
import type { HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getTheme } from '../theme/themeContext'
import { resolveColor } from '../utils/widgetUtils'

export interface GraphCardConfig extends LovelaceCardConfig {
  title?: string
  entity?: string
  hours?: number // Time range in hours (default: 24)
  line_color?: string // Color of the graph line (default: white)
  fill_color?: string // Fill color under the line
  show_points?: boolean // Show data points on the line
  show_grid?: boolean // Show grid lines
  min_value?: number // Manual min Y value (auto if not set)
  max_value?: number // Manual max Y value (auto if not set)
  update_interval?: number // Refresh interval in seconds (default: 60)
  smoothing_delta?: number // Smooth out value changes smaller than this delta
}

export interface CardProps {
  config: LovelaceCardConfig | undefined
  hass: HomeAssistant | undefined
}

interface HistoryDataPoint {
  timestamp: number
  value: number
  state: string
}

interface ChartDataPoint {
  time: string
  value: number
  timestamp: number
}

export function GraphCard({ config, hass }: CardProps) {
  const configTyped = config as GraphCardConfig | undefined
  const renderRef = useRef(0)
  renderRef.current++
  const theme = getTheme()

  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)
  const hassRef = useRef(hass)

  // Update hass ref without triggering effects
  useEffect(() => {
    hassRef.current = hass
  }, [hass])

  // Memoize config values to prevent unnecessary re-renders
  const entityId = useMemo(() => configTyped?.entity, [configTyped?.entity])
  const hours = useMemo(() => configTyped?.hours ?? 24, [configTyped?.hours])
  const updateInterval = useMemo(() => (configTyped?.update_interval ?? 60) * 1000, [configTyped?.update_interval])
  const lineColor = useMemo(() => resolveColor(configTyped?.line_color ?? '#ffffff'), [configTyped?.line_color])
  const fillColor = useMemo(() => resolveColor(configTyped?.fill_color ?? 'transparent'), [configTyped?.fill_color])
  const showPoints = useMemo(() => configTyped?.show_points ?? false, [configTyped?.show_points])
  const showGrid = useMemo(() => configTyped?.show_grid ?? true, [configTyped?.show_grid])
  const smoothingDelta = useMemo(() => configTyped?.smoothing_delta, [configTyped?.smoothing_delta])

  // Fetch history data from Home Assistant
  useEffect(() => {
    if (!hassRef.current || !entityId) {
      setError('No entity configured')
      setLoading(false)
      return
    }

    const fetchHistory = async () => {
      const currentHass = hassRef.current
      if (!currentHass) return

      try {
        setLoading(true)
        const endTime = new Date()

        // Calculate start time and round to a clean hour
        const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000)
        startTime.setMinutes(0, 0, 0) // Round to the start of the hour

        const startTimeStr = startTime.toISOString()
        const url = `/api/history/period/${startTimeStr}?filter_entity_id=${entityId}`

        const response = await fetch(url, {
          headers: currentHass.auth?.data?.access_token
            ? { Authorization: `Bearer ${currentHass.auth.data.access_token}` }
            : {}
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data || data.length === 0 || !data[0] || data[0].length === 0) {
          setError('No history data available')
          setHistoryData([])
          setLoading(false)
          return
        }

        // Parse history data
        const entityHistory = data[0]
        const parsedData: HistoryDataPoint[] = entityHistory
          .map((item: any) => {
            const value = parseFloat(item.state)
            if (isNaN(value)) return null

            return {
              timestamp: new Date(item.last_updated).getTime(),
              value: value,
              state: item.state
            }
          })
          .filter((item: any) => item !== null)

        setHistoryData(parsedData)
        setError(null)
        setLoading(false)
        hasLoadedRef.current = true
      } catch (err) {
        console.error('GraphCard: Error fetching history:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch history')
        setLoading(false)
      }
    }

    fetchHistory()

    // Set up periodic refresh
    const interval = setInterval(fetchHistory, updateInterval)
    return () => clearInterval(interval)
  }, [entityId, hours, updateInterval])

  // Transform data for chart with optional smoothing and interpolation
  const chartData: ChartDataPoint[] = useMemo(() => {
    let processedData = historyData

    // Apply smoothing if delta is configured
    if (smoothingDelta !== undefined && smoothingDelta > 0 && historyData.length > 0) {
      const smoothed: HistoryDataPoint[] = [historyData[0]] // Always keep first point

      for (let i = 1; i < historyData.length; i++) {
        const current = historyData[i]
        const previous = smoothed[smoothed.length - 1]

        // Only add point if change is greater than delta
        if (Math.abs(current.value - previous.value) >= smoothingDelta) {
          smoothed.push(current)
        }
      }

      // Always include last point to ensure chart ends at current value
      if (smoothed[smoothed.length - 1] !== historyData[historyData.length - 1]) {
        smoothed.push(historyData[historyData.length - 1])
      }

      processedData = smoothed
    }

    // Interpolate data to have points at clean 20-minute intervals (xx:00, xx:20, xx:40)
    if (processedData.length >= 2) {
      console.log('[GraphCard] Starting interpolation with', processedData.length, 'data points')

      const firstTimestamp = processedData[0].timestamp
      const lastTimestamp = processedData[processedData.length - 1].timestamp

      // Find the first clean 20-minute mark at or after the first data point
      const firstDate = new Date(firstTimestamp)
      const firstMinute = firstDate.getMinutes()
      const nextCleanMinute = Math.ceil(firstMinute / 20) * 20

      const firstCleanTime = new Date(firstDate)
      if (nextCleanMinute >= 60) {
        firstCleanTime.setHours(firstCleanTime.getHours() + 1)
        firstCleanTime.setMinutes(0, 0, 0)
      } else {
        firstCleanTime.setMinutes(nextCleanMinute, 0, 0)
      }

      const interpolated: HistoryDataPoint[] = []
      const intervalMs = 20 * 60 * 1000 // 20 minutes

      // Generate points at clean 20-minute intervals
      let currentTime = firstCleanTime.getTime()
      let dataIndex = 0

      while (currentTime <= lastTimestamp) {
        // Find the two data points that surround this time
        while (dataIndex < processedData.length - 1 && processedData[dataIndex + 1].timestamp < currentTime) {
          dataIndex++
        }

        const before = processedData[dataIndex]
        const after = processedData[dataIndex + 1] || processedData[dataIndex]

        // Linear interpolation
        let interpolatedValue: number
        if (before === after || before.timestamp === after.timestamp) {
          interpolatedValue = before.value
        } else {
          const timeDiff = after.timestamp - before.timestamp
          const valueDiff = after.value - before.value
          const progress = (currentTime - before.timestamp) / timeDiff
          interpolatedValue = before.value + (valueDiff * progress)
        }

        interpolated.push({
          timestamp: currentTime,
          value: interpolatedValue,
          state: interpolatedValue.toFixed(1)
        })

        currentTime += intervalMs
      }

      processedData = interpolated
      console.log('[GraphCard] After interpolation:', processedData.length, 'data points at clean 20-min intervals')
    }

    return processedData.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      value: point.value,
      timestamp: point.timestamp
    }))
  }, [historyData, smoothingDelta])

  // Generate ticks at 4-hour intervals based on actual data
  const xAxisTicks = useMemo(() => {
    if (chartData.length === 0) {
      console.log('[GraphCard] xAxisTicks: no chart data')
      return undefined
    }

    console.log('[GraphCard] Generating ticks from', chartData.length, 'data points')
    console.log('[GraphCard] First point:', chartData[0])
    console.log('[GraphCard] Last point:', chartData[chartData.length - 1])

    // Get the closest data point to each 4-hour boundary
    const ticksMap = new Map<number, ChartDataPoint>() // hour -> closest data point

    chartData.forEach((point, index) => {
      const date = new Date(point.timestamp)
      const hour = date.getHours()
      const minute = date.getMinutes()

      // Check if this hour is on a 4-hour boundary
      if (hour % 4 === 0) {
        // Only add if it's within 10 minutes of the hour
        if (minute < 10) {
          // Use the actual time from the data point, not a rounded version
          const existing = ticksMap.get(hour)
          if (!existing || minute < new Date(existing.timestamp).getMinutes()) {
            console.log(`[GraphCard] Found 4-hour boundary at index ${index}: ${point.time} (hour=${hour}, minute=${minute})`)
            ticksMap.set(hour, point)
          }
        }
      }
    })

    const ticks = Array.from(ticksMap.values()).map(point => point.time).sort()
    console.log('[GraphCard] Final ticks:', ticks)
    return ticks.length > 0 ? ticks : undefined
  }, [chartData])

  // Calculate Y-axis domain (min/max)
  const yAxisDomain = useMemo(() => {
    if (configTyped?.min_value !== undefined && configTyped?.max_value !== undefined) {
      return [configTyped.min_value, configTyped.max_value]
    }

    if (historyData.length === 0) {
      return [0, 100]
    }

    const values = historyData.map(d => d.value)
    const minValue = configTyped?.min_value ?? Math.min(...values)
    const maxValue = configTyped?.max_value ?? Math.max(...values)

    // Add 10% padding to min/max for better visualization
    const padding = (maxValue - minValue) * 0.1
    return [
      Math.floor(minValue - padding),
      Math.ceil(maxValue + padding)
    ]
  }, [historyData, configTyped?.min_value, configTyped?.max_value])

  // Get entity info for display
  const entity = entityId && hass?.states?.[entityId]
  const entityName = (entity && typeof entity === 'object' && entity.attributes?.friendly_name) || entityId || 'Unknown'
  const unit = (entity && typeof entity === 'object' && entity.attributes?.unit_of_measurement) || ''
  const title = configTyped?.title || `${entityName} History`
 
  return (
    <div
      className="p-4 rounded-lg w-119"
      style={{
        backgroundColor: theme.card.backgroundColor,
        borderRadius: theme.card.borderRadius,
        color: '#ffffff',
        height: '400px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
        <h3 className="text-lg font-medium">{title}</h3>
        {hours && (
          <p className="text-sm opacity-70">Last {hours} hour{hours !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Chart Area */}
      <div style={{ flex: '1 1 auto', minHeight: '200px', position: 'relative' }}>
        {loading && (
          <div className="flex items-center justify-center h-full">
            <p className="opacity-70">Loading history...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && chartData.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="opacity-70">No data available</p>
          </div>
        )}

        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              )}
              <XAxis
                dataKey="time"
                stroke="rgba(255, 255, 255, 0.5)"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                ticks={xAxisTicks}
                interval={0}
              />
              <YAxis
                stroke="rgba(255, 255, 255, 0.5)"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                domain={yAxisDomain}
                tickFormatter={(value) => `${value}${unit ? ' ' + unit : ''}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: '#ffffff'
                }}
                formatter={(value: any) => [`${value}${unit ? ' ' + unit : ''}`, 'Value']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                fill={fillColor}
                strokeWidth={2}
                dot={showPoints}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
