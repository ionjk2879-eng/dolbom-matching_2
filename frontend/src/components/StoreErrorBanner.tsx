import { useCareScheduleStore } from '../store/careScheduleStore'

// Shows the last failed child/schedule request so failures aren't silent
export function StoreErrorBanner() {
  const error = useCareScheduleStore((s) => s.error)
  const clearError = useCareScheduleStore((s) => s.clearError)
  // If the initial load failed there is no data yet: closing would leave pages stuck on "loading",
  // so offer a retry instead
  const loaded = useCareScheduleStore((s) => s.loaded)
  if (!error) return null

  const retry = () => {
    clearError()
    useCareScheduleStore.getState().loadAll()
  }

  return (
    <div role="alert" className="border-b border-error/30 bg-warn-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 text-sm text-warn">
        <p>{error}. 잠시 후 다시 시도해주세요.</p>
        <button
          type="button"
          onClick={loaded ? clearError : retry}
          className="focus-ring shrink-0 text-xs font-semibold underline"
        >
          {loaded ? '닫기' : '다시 시도'}
        </button>
      </div>
    </div>
  )
}
