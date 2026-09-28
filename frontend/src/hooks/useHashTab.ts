import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Reads the tab from the router location so <Link to="/page#tab"> on the same page also switches tabs
export function useHashTab(tabs: string[], fallback = tabs[0]) {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const h = hash.replace('#', '')
  const tab = tabs.includes(h) ? h : fallback

  const setTab = useCallback((next: string) => navigate({ hash: next }), [navigate])

  return [tab, setTab] as const
}
