import { useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

// index.html has an inline script that applies the saved/system theme before
// first paint (avoids a light->dark flash); this just keeps React state in sync.
export function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    applyTheme(dark)
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark((v) => !v) }
}
