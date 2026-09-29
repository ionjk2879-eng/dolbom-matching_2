import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { Card } from '../components/Card'

type Role = 'user' | 'center'
type Step = 1 | 2 | 3

const requiredTerms = ['이용약관 동의 (필수)', '개인정보 수집·이용 동의 (필수)', '만 14세 이상입니다 (필수)']
const optionalTerms = ['마케팅 정보 수신 동의 (선택)']
const allTerms = [...requiredTerms, ...optionalTerms]
const gradeOptions = ['유아', '초1~2', '초3~4', '초5~6']

export function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [role, setRole] = useState<Role>('user')
  const [agreed, setAgreed] = useState<string[]>([])

  const [name, setName] = useState('')
  const [loginId, setLoginId] = useState('')
  const [idChecked, setIdChecked] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneSent, setPhoneSent] = useState(false)
  const [grade, setGrade] = useState('')
  const [centerName, setCenterName] = useState('')
  const [bizNumber, setBizNumber] = useState('')
  const [address, setAddress] = useState('')

  const allRequiredAgreed = requiredTerms.every((t) => agreed.includes(t))
  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm

  const toggleTerm = (t: string) => setAgreed((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  const toggleAll = () => setAgreed(agreed.length === allTerms.length ? [] : [...allTerms])

  const step2Valid =
    name &&
    loginId &&
    idChecked &&
    password &&
    password === passwordConfirm &&
    phone &&
    (role === 'user' || (centerName && bizNumber && address))

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="mb-10 flex items-center justify-center gap-3">
        {(['약관 동의', '정보 입력', '가입 완료'] as const).map((label, i) => {
          const n = (i + 1) as Step
          return (
            <div key={label} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    step >= n ? 'bg-green text-white' : 'bg-line-3 text-ink-3'
                  }`}
                >
                  {n}
                </span>
                <span className={`text-sm font-semibold ${step >= n ? 'text-ink' : 'text-ink-3'}`}>{label}</span>
              </div>
              {n < 3 && <span className="h-px w-8 bg-line-2" />}
            </div>
          )
        })}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            {(['user', 'center'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`focus-ring rounded-2xl border p-5 text-left ${
                  role === r ? 'border-green bg-green-soft/40' : 'border-line bg-ivory-card'
                }`}
              >
                <p className="text-sm font-bold text-ink">{r === 'user' ? '사용자' : '센터 운영자'}</p>
                <p className="mt-1 text-xs text-ink-3">
                  {r === 'user' ? '돌봄기관을 찾고 요청하는 학부모예요' : '돌봄기관을 운영하고 제안을 보내요'}
                </p>
              </button>
            ))}
          </div>

          <Card className="flex flex-col gap-3">
            <label className="flex items-center gap-2 border-b border-line pb-3 text-sm font-bold text-ink">
              <input type="checkbox" checked={agreed.length === allTerms.length} onChange={toggleAll} />
              전체 동의
            </label>
            {allTerms.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm text-ink-2">
                <input type="checkbox" checked={agreed.includes(t)} onChange={() => toggleTerm(t)} />
                {t}
              </label>
            ))}
            {!allRequiredAgreed && <p className="text-xs text-error">필수 약관에 모두 동의해주세요</p>}
          </Card>

          <Button disabled={!allRequiredAgreed} onClick={() => setStep(2)}>
            다음
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="su-name" className="text-sm font-semibold text-ink">
              이름
            </label>
            <input
              id="su-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="su-id" className="text-sm font-semibold text-ink">
              아이디
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="su-id"
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value)
                  setIdChecked(false)
                }}
                className="focus-ring flex-1 rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm"
              />
              <Button type="button" variant="outline" disabled={!loginId} onClick={() => setIdChecked(true)}>
                중복 확인
              </Button>
            </div>
            {idChecked && <p className="mt-1 text-xs text-green">사용 가능한 아이디예요</p>}
          </div>

          <div>
            <label htmlFor="su-pw" className="text-sm font-semibold text-ink">
              비밀번호
            </label>
            <input
              id="su-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="su-pw2" className="text-sm font-semibold text-ink">
              비밀번호 확인
            </label>
            <input
              id="su-pw2"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={`focus-ring mt-1.5 w-full rounded-xl border bg-ivory-card px-4 py-2.5 text-sm ${
                passwordMismatch ? 'border-error' : 'border-line-2'
              }`}
            />
            {passwordMismatch && <p className="mt-1 text-xs text-error">비밀번호가 일치하지 않아요</p>}
          </div>

          <div>
            <label htmlFor="su-phone" className="text-sm font-semibold text-ink">
              휴대폰 번호
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="su-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="focus-ring flex-1 rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm"
              />
              <Button type="button" variant="outline" disabled={!phone} onClick={() => setPhoneSent(true)}>
                인증 요청
              </Button>
            </div>
            {phoneSent && <p className="mt-1 text-xs text-green">인증번호가 발송되었어요</p>}
          </div>

          {role === 'user' && (
            <div>
              <p className="text-sm font-semibold text-ink">자녀 학년 (선택)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {gradeOptions.map((g) => (
                  <Chip key={g} selected={grade === g} onClick={() => setGrade(g)}>
                    {g}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {role === 'center' && (
            <>
              <div>
                <label htmlFor="su-center" className="text-sm font-semibold text-ink">
                  센터 이름
                </label>
                <input
                  id="su-center"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  className="focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="su-biz" className="text-sm font-semibold text-ink">
                  사업자등록번호
                </label>
                <input
                  id="su-biz"
                  value={bizNumber}
                  onChange={(e) => setBizNumber(e.target.value)}
                  className="focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="su-addr" className="text-sm font-semibold text-ink">
                  센터 주소
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="su-addr"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="focus-ring flex-1 rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm"
                  />
                  <Button type="button" variant="outline" onClick={() => setAddress('대전광역시 유성구 대학로 99')}>
                    주소 검색
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="mt-2 flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              이전
            </Button>
            <Button disabled={!step2Valid} onClick={() => setStep(3)} className="flex-1">
              다음
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center">
          <p className="text-2xl font-extrabold text-ink">{name}님, 가입을 환영해요</p>
          <p className="mt-3 text-sm text-ink-2">
            {role === 'center'
              ? '센터 운영자 승인까지 1~2일 정도 소요돼요. 승인 후 이메일로 안내드릴게요.'
              : '이제 우리 아이에게 맞는 돌봄기관을 찾아보세요.'}
          </p>
          <Button onClick={() => navigate('/login')} className="mt-6">
            로그인하러 가기
          </Button>
        </div>
      )}

      {step !== 3 && (
        <p className="mt-6 text-center text-sm text-ink-3">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-semibold text-green underline">
            로그인
          </Link>
        </p>
      )}
    </div>
  )
}
