import { useCallback, useEffect, useState } from 'react'

export function useHashTab(tabs: string[], fallback = tabs[0]) {
  const read = () => {
    const h = window.location.hash.replace('#', '')
    return tabs.includes(h) ? h : fallback
  }
  const [tab, setTabState] = useState(read)

  useEffect(() => {
    const onHash = () => setTabState(read())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setTab = useCallback((next: string) => {
    window.location.hash = next
    setTabState(next)
  }, [])

  return [tab, setTab] as const
}
