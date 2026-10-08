import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <title>페이지를 찾을 수 없어요 | After School</title>
      <p className="text-5xl font-extrabold tracking-[-0.03em] text-green">404</p>
      <h1 className="mt-4 text-xl font-extrabold text-ink">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-sm text-ink-2">주소가 바뀌었거나 없는 페이지예요. 주소를 다시 확인해 주세요.</p>
      <div className="mt-8 flex gap-2">
        <Link
          to="/"
          className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          홈으로
        </Link>
        <Link
          to="/find"
          className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-line-2 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ivory-deep"
        >
          돌봄 찾기
        </Link>
      </div>
    </div>
  )
}
