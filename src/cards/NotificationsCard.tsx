import { useRef, useState, useEffect } from "react"
import type { LovelaceCardConfig } from "custom-card-helpers"
import type { CardProps } from "../utils/registerCard"
import { lookupEntityInState } from "../utils/widgetUtils"
import { handleTapAction, type TapAction } from "../utils/actionHandler"
import { getTheme } from "../theme/themeContext"
import { Separator } from "../components/Separator"
import { isTemplate, evaluateTemplates } from "../utils/templateHelper"

type NotificationType = "garbage" | "battery_low"
type NotificationSeverity = "critical" | "warning" | "info"

interface NotificationConfig {
  type: NotificationType
  severity?: NotificationSeverity // Severity level (default: info)
  enabled_entity?: string // Entity that determines if notification is shown (boolean)
  enabled?: boolean // Static boolean value (if no enabled_entity)
  silence_entity?: string // input_boolean entity to silence notification until end of day
  text_entity?: string // Optional entity for dynamic text
  text?: string // Static text (if no text_entity)
  priority: number // Lower number = higher priority (1 is highest)
  tap_action?: TapAction
}

interface NotificationsCardConfig extends LovelaceCardConfig {
  title?: string
  titleIcon?: string
  notifications?: NotificationConfig[]
  no_notifications_text?: string // Text to display when there are no active notifications
  tap_action?: TapAction
}

export function NotificationsCard({
  config,
  hass,
}: CardProps) {
  const configTyped = config as NotificationsCardConfig | undefined

  const renderRef = useRef(0)
  renderRef.current++

  const theme = getTheme()

  // State to store evaluated template results
  const [templateResults, setTemplateResults] = useState<Record<number, boolean>>({})

  const handleClick = () => {
    handleTapAction(configTyped?.tap_action, hass, configTyped?.entity)
  }

  // Evaluate templates for enabled field
  useEffect(() => {
    if (!hass || !configTyped?.notifications) return

    const notifications = configTyped.notifications

    const evaluateAllTemplates = async () => {
      // Collect all templates that need evaluation
      const templatesToEvaluate: Array<{ index: number; template: string }> = []

      for (let i = 0; i < notifications.length; i++) {
        const notification = notifications[i]

        if (notification.enabled !== undefined && typeof notification.enabled === 'string' && isTemplate(notification.enabled)) {
          templatesToEvaluate.push({ index: i, template: notification.enabled })
        }
      }

      // Evaluate all templates in parallel
      if (templatesToEvaluate.length > 0) {
        const results = await evaluateTemplates(hass, templatesToEvaluate)
        setTemplateResults(results)
      }
    }

    evaluateAllTemplates()

    // Re-evaluate templates periodically (every 5 seconds)
    const interval = setInterval(evaluateAllTemplates, 5000)
    return () => clearInterval(interval)
  }, [hass, configTyped?.notifications])

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case "garbage":
        return "mdi:trash-can"
      case "battery_low":
        return "mdi:battery-alert"
      default:
        return "mdi:bell"
    }
  }

  // Get background color for severity
  const getSeverityBackgroundColor = (severity: NotificationSeverity = "info"): string => {
    switch (severity) {
      case "critical":
        return "#ef44449e" // red-ish
      case "warning":
        return "#f59e0ba3" // yellow-ish
      case "info":
      default:
        return theme.card.activeButtonBackgroundColor
    }
  }

  // Filter and sort notifications
  const activeNotifications = (configTyped?.notifications || [])
    .map((notification, idx) => {
      // Check if notification is enabled (either via entity, template, or static value)
      let isEnabled = false
      if (notification.enabled_entity) {
        const enabledState = lookupEntityInState(hass, notification.enabled_entity)
        isEnabled = enabledState?.state === "on" || enabledState?.state === "true"
      } else if (notification.enabled !== undefined) {
        // Check if it's a template that was evaluated
        if (typeof notification.enabled === 'string' && isTemplate(notification.enabled)) {
          isEnabled = templateResults[idx] || false
        } else {
          // Static boolean value
          isEnabled = notification.enabled
        }
      }

      // Check if notification is silenced
      let isSilenced = false
      if (notification.silence_entity) {
        const silenceState = lookupEntityInState(hass, notification.silence_entity)
        isSilenced = silenceState?.state === "on" || silenceState?.state === "true"
      }

      let text = notification.text || ""
      if (notification.text_entity) {
        const textState = lookupEntityInState(hass, notification.text_entity)
        text = textState?.state || text
      }

      return {
        ...notification,
        isEnabled,
        isSilenced,
        text
      }
    })
    .filter(n => n.isEnabled && !n.isSilenced)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4)

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes haNotificationPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}} />
      <div
        className="bg-card w-119 px-4 py-3 overflow-hidden relative"
        style={{
          height: 'auto',
          minHeight: '128px',
          borderRadius: theme.card.borderRadius,
          backgroundColor: theme.card.backgroundColor,
          cursor: configTyped?.tap_action ? 'pointer' : 'default'
        }}
        onClick={handleClick}
      >
      {/* Title bar */}
      <div className="flex items-center gap-2 mb-2">
        {configTyped?.titleIcon && (
          <ha-icon
            icon={configTyped.titleIcon}
            style={{
              "--mdc-icon-size": "20px",
              color: "white"
            } as any}
          />
        )}
        <h2 className="text-sm font-medium text-foreground">{configTyped?.title || "Notifications"}</h2>
      </div>

      <Separator className="mb-3" />

      {/* Notifications */}
      <div className="grid grid-cols-2 gap-2">
        {activeNotifications.length === 0 ? (
          <div className="col-span-2 text-xs text-gray-400 text-center py-4">
            {configTyped?.no_notifications_text || "No active notifications"}
          </div>
        ) : (
          activeNotifications.map((notification, idx) => {
            const icon = getNotificationIcon(notification.type)
            const backgroundColor = getSeverityBackgroundColor(notification.severity)

            const handleNotificationClick = (e: React.MouseEvent) => {
              e.stopPropagation()

              if (!hass) return

              // If silence_entity is configured, silence the notification
              if (notification.silence_entity) {
                hass.callService("input_boolean", "turn_on", {
                  entity_id: notification.silence_entity
                })
              }
              // Otherwise, execute tap action if configured
              else if (notification.tap_action) {
                handleTapAction(notification.tap_action, hass, notification.enabled_entity)
              }
            }

            return (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs px-3 py-2"
                style={{
                  cursor: (notification.silence_entity || notification.tap_action) ? 'pointer' : 'inherit',
                  backgroundColor,
                  borderRadius: theme.card.borderRadius,
                  animation: 'haNotificationPulse 2s ease-in-out infinite'
                }}
                onClick={handleNotificationClick}
              >
                <ha-icon
                  icon={icon}
                  style={{
                    "--mdc-icon-size": "18px",
                    color: "white",
                    flexShrink: 0
                  } as any}
                />
                <span className="text-foreground flex-1">{notification.text}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
    </>
  )
}
