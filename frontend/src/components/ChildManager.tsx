import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { useCareScheduleStore } from '../store/careScheduleStore'

function ChildForm() {
  const addChild = useCareScheduleStore((s) => s.addChild)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(1)
  const [commuteMinutes, setCommuteMinutes] = useState(20)

  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('아이 이름을 입력해주세요')
    setError('')
    if (await addChild({ name: trimmed, grade, commuteMinutes })) setName('')
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-4">
      <label htmlFor="child-name" className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        아이 이름
        <input
          id="child-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="focus-ring w-36 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink"
        />
      </label>
      <label htmlFor="child-grade" className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        학년
        <select
          id="child-grade"
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink"
        >
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <option key={g} value={g}>{g}학년</option>
          ))}
        </select>
      </label>
      <label htmlFor="child-commute" className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        통학시간(분)
        <input
          id="child-commute"
          type="number"
          min={0}
          value={commuteMinutes}
          onChange={(e) => setCommuteMinutes(Number(e.target.value))}
          className="focus-ring w-20 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink"
        />
      </label>
      <Button type="submit">아이 추가</Button>
      {error && <p className="w-full text-sm text-error">{error}</p>}
    </form>
  )
}

function ChildEditForm({ id, onClose }: { id: string; onClose: () => void }) {
  const { children, updateChild } = useCareScheduleStore()
  const child = children.find((c) => c.id === id)
  const [name, setName] = useState(child?.name ?? '')
  const [grade, setGrade] = useState(child?.grade ?? 1)
  const [commuteMinutes, setCommuteMinutes] = useState(child?.commuteMinutes ?? 20)
  const [error, setError] = useState('')
  if (!child) return null

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('이름을 입력해주세요')
    if (await updateChild(id, { name: trimmed, grade, commuteMinutes })) onClose()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-ivory-card p-4">
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        이름
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="focus-ring w-36 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink" />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        학년
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
          className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink">
          {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g}학년</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        통학시간(분)
        <input type="number" min={0} value={commuteMinutes} onChange={(e) => setCommuteMinutes(Number(e.target.value))}
          className="focus-ring w-20 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink" />
      </label>
      <Button type="submit">저장</Button>
      <button type="button" onClick={onClose} className="focus-ring text-sm font-semibold text-ink-2">취소</button>
      {error && <p className="w-full text-sm text-error">{error}</p>}
    </form>
  )
}

// 아이 추가 폼 + 등록된 아이 목록(수정/삭제). CareScheduleEditor와 MyPage에서 공용으로 쓴다.
export function ChildManager() {
  const { children, removeChild } = useCareScheduleStore()
  const [editingChildId, setEditingChildId] = useState<string | null>(null)

  const onRemove = (id: string, name: string) => {
    if (window.confirm(`'${name}'을(를) 삭제할까요? 이 아이의 학교·돌봄 일정도 함께 삭제돼요.`)) removeChild(id)
  }

  return (
    <>
      <ChildForm />
      {children.length > 0 && (
        <div className="flex flex-col gap-2">
          {children.map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
              {editingChildId === c.id ? (
                <ChildEditForm key={c.id} id={c.id} onClose={() => setEditingChildId(null)} />
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
                  <span>{c.name} · {c.grade}학년 · 통학 {c.commuteMinutes}분</span>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditingChildId(c.id)} className="focus-ring tap-target text-xs font-semibold text-ink-2">
                      수정
                    </button>
                    <button type="button" onClick={() => onRemove(c.id, c.name)} className="focus-ring tap-target text-xs font-semibold text-error">
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
