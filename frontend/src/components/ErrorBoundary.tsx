import { Component, type ErrorInfo, type ReactNode } from 'react'
import logo from '../assets/logo.png'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      // Sits outside the router, so leave with a full page load: that also clears the broken state.
      // bg-ivory-card matches the logo image's background, as in the header
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-ivory-card px-4 py-16 text-center">
          <a href="/" className="focus-ring tap-target inline-flex items-center">
            <img src={logo} alt="After School" className="h-10 w-auto" />
          </a>
          <div className="mt-10 flex h-24 w-24 items-center justify-center rounded-full bg-sand">
            <p className="text-3xl font-extrabold tracking-[-0.03em] text-ink">앗!</p>
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-ink">문제가 생겼어요</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-2">
            일시적인 오류일 수 있어요. 새로고침하거나 메인으로 돌아가 다시 시도해 주세요.
          </p>
          <div className="mt-8 flex gap-2">
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="focus-ring tap-target rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              메인으로
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="focus-ring tap-target rounded-xl border border-line-2 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ivory-deep"
            >
              새로고침
            </button>
          </div>
          {/* The raw message helps while developing; users only see the friendly text above */}
          {import.meta.env.DEV && (
            <pre className="mt-8 max-w-xl whitespace-pre-wrap break-all rounded-lg bg-ivory-deep p-4 text-left text-xs text-ink-2">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
