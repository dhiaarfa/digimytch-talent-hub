'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export type Notification = {
  id: string
  type: 'success' | 'info' | 'warning'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: { label: string; href: string }
}

const notifications: Notification[] = []
const listeners = new Set<() => void>()

function emitNotificationChange() {
  listeners.forEach((l) => l())
}

export function addNotification(
  notif: Omit<Notification, 'id' | 'timestamp' | 'read'>
) {
  const newNotif: Notification = {
    ...notif,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    read: false,
  }
  notifications.unshift(newNotif)
  emitNotificationChange()
  toast(notif.title, { description: notif.message })
}

export function NotificationBell({ align = "start" }: { align?: "start" | "end" }) {
  const [open, setOpen] = useState(false)
  const panelAlign =
    align === "end"
      ? "right-0 left-auto"
      : "left-0 right-auto"
  const [notifs, setNotifs] = useState<Notification[]>([])

  useEffect(() => {
    const update = () => setNotifs([...notifications])
    listeners.add(update)
    update()
    return () => {
      listeners.delete(update)
    }
  }, [])

  const unread = notifs.filter((n) => !n.read).length

  const markRead = (id: string) => {
    const item = notifications.find((n) => n.id === id)
    if (item) item.read = true
    setNotifs([...notifications])
  }

  const markAllRead = () => {
    notifications.forEach((n) => {
      n.read = true
    })
    setNotifs([...notifications])
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${unread > 0 ? `, ${unread} non lues` : ''}`}
        aria-expanded={open}
      >
        <Bell size={18} aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 bg-[#D10069] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Fermer les notifications"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={cn(
                "absolute top-full mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-w-80 bg-white border border-[var(--digi-border)] rounded-xl shadow-xl z-50 overflow-hidden",
                panelAlign
              )}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      type="button"
                      className="text-[10px] text-[#030A8C] hover:underline"
                      onClick={markAllRead}
                    >
                      Tout lire
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Fermer"
                  >
                    <X size={14} aria-hidden />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Aucune notification
                  </p>
                ) : (
                  notifs.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${
                        !notif.read ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => markRead(notif.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') markRead(notif.id)
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start gap-2">
                        {notif.type === 'success' && (
                          <CheckCircle
                            size={14}
                            className="text-green-500 mt-0.5 shrink-0"
                            aria-hidden
                          />
                        )}
                        {notif.type === 'info' && (
                          <Info
                            size={14}
                            className="text-blue-500 mt-0.5 shrink-0"
                            aria-hidden
                          />
                        )}
                        {notif.type === 'warning' && (
                          <AlertCircle
                            size={14}
                            className="text-amber-500 mt-0.5 shrink-0"
                            aria-hidden
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notif.message}
                          </p>
                          {notif.action && (
                            <a
                              href={notif.action.href}
                              className="text-xs text-[#030A8C] underline mt-1 block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {notif.action.label}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
