import { useLocation, useNavigate } from 'react-router-dom'

// Back to the previous in-app page when there is one; a page opened directly
// (shared link, refresh) has no in-app history, so go to its parent instead of leaving the site
export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  const location = useLocation()
  return () => {
    if (location.key !== 'default') navigate(-1)
    else navigate(fallback, { replace: true })
  }
}
