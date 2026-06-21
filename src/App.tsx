import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { api, ApiError, type Account, type AuthResponse, type Balance } from './api'
import './App.css'

type View = 'landing' | 'login' | 'assets' | 'showcase'
type AuthMode = 'login' | 'signup'
type ShowcaseTheme = 'navy' | 'blue' | 'cream' | 'cloud'

type AuthSession = {
  accessToken: string
  email: string
  expiresAt: number
}

type IconName =
  | 'arrow'
  | 'bank'
  | 'check'
  | 'eye'
  | 'link'
  | 'lock'
  | 'logout'
  | 'profile'
  | 'refresh'
  | 'share'
  | 'shield'
  | 'sparkle'
  | 'wallet'

type BalanceState =
  | { status: 'loading' }
  | { status: 'success'; data: Balance }
  | { status: 'server-error' }
  | { status: 'error'; message: string }

const AUTH_STORAGE_KEY = 'assetview-session'

function getViewFromHash(): View {
  const hash = window.location.hash.replace('#', '')
  return ['landing', 'login', 'assets', 'showcase'].includes(hash) ? hash as View : 'landing'
}

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <path d="m5 12 14 0m-5-5 5 5-5 5" />,
  bank: (
    <>
      <path d="m3 9 9-5 9 5" />
      <path d="M5 10v7m4-7v7m6-7v7m4-7v7M3 20h18" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  link: (
    <>
      <path d="m10 13 4-4" />
      <path d="m7.5 15.5-1 1a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0" />
      <path d="m16.5 8.5 1-1a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5H5v14h5M14 8l4 4-4 4m-5-4h9" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.8-4.2 3.4-6.4 8-6.4s7.2 2.2 8 6.4" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M18.2 9A7 7 0 0 0 6.1 6.5L4 12m2 3a7 7 0 0 0 12 2.5L20 12" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.5m-7.6 6.9 7.6 4.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 4 5v6c0 5.1 3.1 8.9 8 11 4.9-2.1 8-5.9 8-11V5l-8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  sparkle: <path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Zm6 13 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" />,
  wallet: (
    <>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3" />
      <path d="M15 10h6v5h-6a2.5 2.5 0 0 1 0-5Z" />
    </>
  ),
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {iconPaths[name]}
    </svg>
  )
}

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button className="logo" onClick={onClick} type="button">
      <span className="logo-mark"><span /></span>
      <span>AssetView</span>
    </button>
  )
}

function formatWon(value: number | null) {
  if (value === null) return '-'
  return `${new Intl.NumberFormat('ko-KR').format(value)}원`
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  return '백엔드 서버에 연결할 수 없습니다.'
}

function clearStoredSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

function loadStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    ?? sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AuthSession
    if (!session.accessToken || session.expiresAt <= Date.now()) {
      clearStoredSession()
      return null
    }
    return session
  } catch {
    clearStoredSession()
    return null
  }
}

function saveSession(auth: AuthResponse, email: string, remember: boolean) {
  const session: AuthSession = {
    accessToken: auth.accessToken,
    email,
    expiresAt: Date.now() + auth.expiresInSeconds * 1000,
  }
  clearStoredSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  return session
}

function Landing({ navigate }: { navigate: (view: View) => void }) {
  return (
    <main className="page-shell landing-page">
      <header className="public-header">
        <Logo onClick={() => navigate('landing')} />
        <button className="header-login-button" onClick={() => navigate('login')} type="button">
          로그인
        </button>
      </header>

      <section className="landing-content">
        <div className="landing-copy">
          <span className="eyebrow">OPEN BANKING ACCOUNT VIEW</span>
          <h1>
            연결한 계좌와 잔액을
            <br />
            <em>한곳에서 확인하세요</em>
          </h1>
          <p>
            로그인 후 오픈뱅킹 인증을 진행하면 연결된 계좌 목록과
            계좌별 잔액을 조회할 수 있습니다.
          </p>
          <button className="primary-button landing-button" onClick={() => navigate('login')} type="button">
            시작하기
            <Icon name="arrow" size={18} />
          </button>
        </div>

        <div className="api-feature-panel">
          <div className="api-feature-icon"><Icon name="shield" size={28} /></div>
          <h2>JWT 인증</h2>
          <p>로그인 또는 회원가입으로 발급된 토큰으로 보호된 API를 호출합니다.</p>
          <div className="api-feature-list">
            <span><Icon name="link" size={18} /> 오픈뱅킹 사용자 인증</span>
            <span><Icon name="bank" size={18} /> 연결 계좌 목록 조회</span>
            <span><Icon name="wallet" size={18} /> 계좌 잔액 조회</span>
          </div>
        </div>
      </section>
    </main>
  )
}

function AuthPage({
  initialMode,
  navigate,
  onAuthenticated,
}: {
  initialMode: AuthMode
  navigate: (view: View) => void
  onAuthenticated: (auth: AuthResponse, email: string, remember: boolean) => void
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setServerError(false)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('올바른 이메일 주소를 입력해주세요.')
      return
    }
    if (password.length < 8 || password.length > 72) {
      setError('비밀번호는 8자 이상 72자 이하로 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const auth = mode === 'login'
        ? await api.login(normalizedEmail, password)
        : await api.signup(normalizedEmail, password)
      onAuthenticated(auth, normalizedEmail, remember)
    } catch (requestError) {
      setServerError(requestError instanceof ApiError && requestError.isServerError)
      setError(getApiErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
    setServerError(false)
  }

  return (
    <main className="page-shell auth-page">
      <header className="public-header">
        <Logo onClick={() => navigate('landing')} />
        <button className="home-link" onClick={() => navigate('landing')} type="button">
          홈으로 <Icon name="arrow" size={16} />
        </button>
      </header>

      <section className="auth-layout">
        <div className="auth-aside">
          <div>
            <span className="section-kicker light"><Icon name="shield" size={22} /> JWT Authentication</span>
            <h1>{mode === 'login' ? '계좌를 확인하려면\n로그인하세요' : '새 계정을\n만드세요'}</h1>
            <p>인증 성공 시 발급되는 accessToken으로 계좌 API를 호출합니다.</p>
          </div>
          <div className="auth-api-path">
            <span>{mode === 'login' ? 'POST' : 'POST'}</span>
            <code>/api/v1/auth/{mode === 'login' ? 'login' : 'signup'}</code>
          </div>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-tabs" role="tablist" aria-label="인증 방식">
            <button
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => changeMode('login')}
              role="tab"
              type="button"
            >
              로그인
            </button>
            <button
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => changeMode('signup')}
              role="tab"
              type="button"
            >
              회원가입
            </button>
          </div>

          <div className="auth-heading">
            <span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</span>
            <h2>{mode === 'login' ? 'AssetView 로그인' : 'AssetView 회원가입'}</h2>
            <p>이메일과 비밀번호를 입력해주세요.</p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <label>
              이메일
              <span className="auth-input">
                <Icon name="profile" size={18} />
                <input
                  autoComplete="email"
                  maxLength={255}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                />
              </span>
            </label>

            <label>
              비밀번호
              <span className="auth-input">
                <Icon name="lock" size={18} />
                <input
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  maxLength={72}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8자 이상 72자 이하"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  <Icon name="eye" size={18} />
                </button>
              </span>
            </label>

            <label className="remember-option">
              <input
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                type="checkbox"
              />
              <span><Icon name="check" size={12} /></span>
              로그인 상태 유지
            </label>

            {error && (
              <div className={`api-error-banner${serverError ? ' server-error' : ''}`} role="alert">
                {serverError && <strong>-1</strong>}
                <span>{error}</span>
              </div>
            )}

            <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? '요청 중...' : mode === 'login' ? '로그인' : '회원가입'}
              {!isSubmitting && <Icon name="arrow" size={18} />}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

function AppHeader({
  email,
  navigate,
  onLogout,
}: {
  email: string
  navigate: (view: View) => void
  onLogout: () => void
}) {
  return (
    <header className="app-header">
      <Logo onClick={() => navigate('assets')} />
      <div className="app-header-actions">
        <span className="session-email">{email}</span>
        <button onClick={onLogout} type="button">
          <Icon name="logout" size={18} />
          로그아웃
        </button>
      </div>
    </header>
  )
}

function AccountCard({
  account,
  balanceState,
}: {
  account: Account
  balanceState: BalanceState
}) {
  const balance = balanceState.status === 'success' ? balanceState.data : null

  return (
    <article className="account-card">
      <div className="account-card-heading">
        <span className="bank-symbol">{account.bankName.slice(0, 1) || 'B'}</span>
        <div>
          <h3>{account.bankName}</h3>
          <p>{account.accountAlias}</p>
        </div>
        <span className="bank-code">은행 코드 {account.bankCodeStd}</span>
      </div>

      <div className="account-number">
        <span>계좌번호</span>
        <strong>{account.accountNumMasked}</strong>
      </div>

      <div className="balance-grid">
        <div>
          <span>계좌 잔액</span>
          <strong>
            {balanceState.status === 'loading' && '조회 중'}
            {balanceState.status === 'success' && formatWon(balance?.balanceAmt ?? null)}
            {balanceState.status === 'server-error' && '-1'}
            {balanceState.status === 'error' && '-'}
          </strong>
        </div>
        <div>
          <span>출금 가능 금액</span>
          <strong>
            {balanceState.status === 'loading' && '조회 중'}
            {balanceState.status === 'success' && formatWon(balance?.availableAmt ?? null)}
            {balanceState.status === 'server-error' && '-1'}
            {balanceState.status === 'error' && '-'}
          </strong>
        </div>
      </div>

      <dl className="account-details">
        <div><dt>예금주</dt><dd>{account.accountHolderName}</dd></div>
        {balance && <div><dt>상품명</dt><dd>{balance.productName}</dd></div>}
        {balance && <div><dt>계좌 유형 코드</dt><dd>{balance.accountType}</dd></div>}
        {balance && <div><dt>응답 메시지</dt><dd>{balance.rspMessage}</dd></div>}
      </dl>

      {balanceState.status === 'error' && (
        <p className="account-error">{balanceState.message}</p>
      )}
    </article>
  )
}

function AccountsPage({
  session,
  navigate,
  onLogout,
}: {
  session: AuthSession
  navigate: (view: View) => void
  onLogout: () => void
}) {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [balances, setBalances] = useState<Record<string, BalanceState>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [message, setMessage] = useState('')
  const [serverError, setServerError] = useState(false)
  const [notLinked, setNotLinked] = useState(false)

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      onLogout()
      return true
    }
    return false
  }, [onLogout])

  const loadAccounts = useCallback(async () => {
    setIsLoading(true)
    setMessage('')
    setServerError(false)
    setNotLinked(false)

    try {
      const response = await api.getAccounts(session.accessToken)
      setAccounts(response.accounts)
      setBalances(Object.fromEntries(
        response.accounts.map((account) => [account.fintechUseNum, { status: 'loading' }]),
      ))

      await Promise.all(response.accounts.map(async (account) => {
        try {
          const balance = await api.getBalance(session.accessToken, account.fintechUseNum)
          setBalances((current) => ({
            ...current,
            [account.fintechUseNum]: { status: 'success', data: balance },
          }))
        } catch (error) {
          if (handleApiError(error)) return
          const nextState: BalanceState = error instanceof ApiError && error.isServerError
            ? { status: 'server-error' }
            : { status: 'error', message: getApiErrorMessage(error) }
          setBalances((current) => ({
            ...current,
            [account.fintechUseNum]: nextState,
          }))
        }
      }))
    } catch (error) {
      if (handleApiError(error)) return
      if (error instanceof ApiError && error.status === 404) {
        setAccounts([])
        setNotLinked(true)
      } else {
        setAccounts(null)
        setServerError(error instanceof ApiError && error.isServerError)
        setMessage(getApiErrorMessage(error))
      }
    } finally {
      setIsLoading(false)
    }
  }, [handleApiError, session.accessToken])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAccounts()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadAccounts])

  const startOpenBanking = async () => {
    const authorizeWindow = window.open('about:blank', '_blank')
    if (authorizeWindow) authorizeWindow.opener = null
    setIsAuthorizing(true)
    setMessage('')
    setServerError(false)
    try {
      const response = await api.getAuthorizeUrl(session.accessToken)
      if (authorizeWindow) {
        authorizeWindow.location.href = response.authorizeUrl
        setMessage('오픈뱅킹 인증 완료 후 이 화면에서 새로고침을 눌러주세요.')
      } else {
        setMessage('팝업이 차단되었습니다. 팝업을 허용한 후 다시 시도해주세요.')
      }
    } catch (error) {
      authorizeWindow?.close()
      if (handleApiError(error)) return
      setServerError(error instanceof ApiError && error.isServerError)
      setMessage(getApiErrorMessage(error))
    } finally {
      setIsAuthorizing(false)
    }
  }

  const totalBalance = useMemo(() => {
    if (serverError) return '-1'
    if (!accounts || isLoading) return '조회 중'
    if (accounts.length === 0) return '-'

    const states = accounts.map((account) => balances[account.fintechUseNum])
    if (states.some((state) => state?.status === 'server-error')) return '-1'
    if (states.some((state) => !state || state.status === 'loading')) return '조회 중'

    const values = states
      .filter((state): state is Extract<BalanceState, { status: 'success' }> => state.status === 'success')
      .map((state) => state.data.balanceAmt)
      .filter((value): value is number => value !== null)
    return values.length > 0 ? formatWon(values.reduce((sum, value) => sum + value, 0)) : '-'
  }, [accounts, balances, isLoading, serverError])

  return (
    <main className="page-shell accounts-page">
      <AppHeader email={session.email} navigate={navigate} onLogout={onLogout} />
      <section className="accounts-content">
        <div className="accounts-title-row">
          <div>
            <span className="eyebrow">OPEN BANKING ACCOUNTS</span>
            <h1>연결 계좌</h1>
          </div>
          <div className="account-actions">
            <button
              className="secondary-button compact-button showcase-entry-button"
              onClick={() => navigate('showcase')}
              type="button"
            >
              <Icon name="sparkle" size={17} />
              잔액 자랑하기
            </button>
            <button className="secondary-button compact-button" onClick={() => void loadAccounts()} type="button">
              <Icon name="refresh" size={17} />
              새로고침
            </button>
            <button
              className="primary-button compact-button"
              disabled={isAuthorizing}
              onClick={() => void startOpenBanking()}
              type="button"
            >
              <Icon name="link" size={17} />
              {isAuthorizing ? '요청 중' : '오픈뱅킹 연결'}
            </button>
          </div>
        </div>

        <div className="account-summary">
          <div>
            <span>계좌 수</span>
            <strong>{serverError ? '-1' : accounts?.length ?? (isLoading ? '조회 중' : '-')}</strong>
          </div>
          <div>
            <span>조회된 계좌 잔액 합계</span>
            <strong>{totalBalance}</strong>
          </div>
        </div>

        {message && (
          <div className={`api-message${serverError ? ' server-error' : ''}`}>
            {serverError && <strong>-1</strong>}
            <span>{message}</span>
          </div>
        )}

        {isLoading && <div className="accounts-state">계좌 정보를 조회하고 있습니다.</div>}

        {!isLoading && notLinked && (
          <div className="accounts-state empty">
            <Icon name="link" size={34} />
            <h2>연결된 오픈뱅킹 계좌가 없습니다</h2>
            <p>오픈뱅킹 연결 버튼을 눌러 사용자 인증과 계좌 등록을 진행해주세요.</p>
          </div>
        )}

        {!isLoading && accounts && accounts.length > 0 && (
          <div className="account-list">
            {accounts.map((account) => (
              <AccountCard
                account={account}
                balanceState={balances[account.fintechUseNum] ?? { status: 'loading' }}
                key={account.fintechUseNum}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function ShowcasePage({
  session,
  navigate,
  onLogout,
}: {
  session: AuthSession
  navigate: (view: View) => void
  onLogout: () => void
}) {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [balances, setBalances] = useState<Record<string, BalanceState>>({})
  const [theme, setTheme] = useState<ShowcaseTheme>('navy')
  const [isLoading, setIsLoading] = useState(true)
  const [serverError, setServerError] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const loadShowcase = useCallback(async () => {
    setIsLoading(true)
    setServerError(false)
    setMessage('')

    try {
      const response = await api.getAccounts(session.accessToken)
      setAccounts(response.accounts)
      setBalances(Object.fromEntries(
        response.accounts.map((account) => [account.fintechUseNum, { status: 'loading' }]),
      ))

      await Promise.all(response.accounts.map(async (account) => {
        try {
          const balance = await api.getBalance(session.accessToken, account.fintechUseNum)
          setBalances((current) => ({
            ...current,
            [account.fintechUseNum]: { status: 'success', data: balance },
          }))
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            onLogout()
            return
          }
          const nextState: BalanceState = error instanceof ApiError && error.isServerError
            ? { status: 'server-error' }
            : { status: 'error', message: getApiErrorMessage(error) }
          setBalances((current) => ({
            ...current,
            [account.fintechUseNum]: nextState,
          }))
        }
      }))
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onLogout()
        return
      }
      if (error instanceof ApiError && error.status === 404) {
        setAccounts([])
        setMessage(error.message)
      } else {
        setAccounts(null)
        setServerError(error instanceof ApiError && error.isServerError)
        setMessage(getApiErrorMessage(error))
      }
    } finally {
      setIsLoading(false)
    }
  }, [onLogout, session.accessToken])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadShowcase()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadShowcase])

  const totalBalance = useMemo<number | 'loading' | 'error' | 'server-error'>(() => {
    if (serverError) return 'server-error'
    if (!accounts || isLoading) return 'loading'
    if (accounts.length === 0) return 'error'

    const states = accounts.map((account) => balances[account.fintechUseNum])
    if (states.some((state) => state?.status === 'server-error')) return 'server-error'
    if (states.some((state) => !state || state.status === 'loading')) return 'loading'

    const values = states
      .filter((state): state is Extract<BalanceState, { status: 'success' }> => state.status === 'success')
      .map((state) => state.data.balanceAmt)
      .filter((value): value is number => value !== null)
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : 'error'
  }, [accounts, balances, isLoading, serverError])

  const bankNames = useMemo(
    () => [...new Set((accounts ?? []).map((account) => account.bankName))],
    [accounts],
  )

  const totalLabel = totalBalance === 'server-error'
    ? '-1'
    : totalBalance === 'loading'
      ? '조회 중'
      : totalBalance === 'error'
        ? '-'
        : formatWon(totalBalance)

  const copyShowcase = async () => {
    if (typeof totalBalance !== 'number') return
    const shareText = [
      `내 오픈뱅킹 계좌 잔액은 ${formatWon(totalBalance)}입니다.`,
      `연결 계좌 ${accounts?.length ?? 0}개`,
      bankNames.length > 0 ? `연결 은행: ${bankNames.join(', ')}` : '',
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setMessage('공유 문구를 복사하지 못했습니다.')
    }
  }

  const themes: Array<{ key: ShowcaseTheme; label: string }> = [
    { key: 'navy', label: '미드나잇' },
    { key: 'blue', label: '블루' },
    { key: 'cream', label: '크림' },
    { key: 'cloud', label: '클라우드' },
  ]

  return (
    <main className="page-shell showcase-page">
      <AppHeader email={session.email} navigate={navigate} onLogout={onLogout} />
      <section className="showcase-layout">
        <aside className="showcase-controls">
          <button className="back-button" onClick={() => navigate('assets')} type="button">
            <Icon name="arrow" size={16} />
            연결 계좌로 돌아가기
          </button>
          <div>
            <span className="eyebrow">BALANCE SHOWCASE</span>
            <h1>잔액 자랑 카드</h1>
            <p>백엔드에서 조회한 실제 계좌 잔액 합계를 카드로 보여줍니다.</p>
          </div>

          <fieldset>
            <legend>카드 배경</legend>
            <div className="showcase-theme-list">
              {themes.map((item) => (
                <button
                  aria-label={`${item.label} 테마 선택`}
                  className={`showcase-theme showcase-theme-${item.key}${theme === item.key ? ' active' : ''}`}
                  key={item.key}
                  onClick={() => setTheme(item.key)}
                  type="button"
                />
              ))}
            </div>
            <span className="selected-theme">
              {themes.find((item) => item.key === theme)?.label}
            </span>
          </fieldset>

          <div className="showcase-source">
            <Icon name="shield" size={19} />
            <span>
              <strong>API 조회 데이터</strong>
              <small>계좌 목록과 잔액 응답만 표시합니다.</small>
            </span>
          </div>
        </aside>

        <div className="showcase-preview">
          <article className={`balance-showcase-card theme-${theme}`}>
            <div className="showcase-card-brand">
              <span className="logo-mark"><span /></span>
              AssetView
            </div>
            <div className="showcase-card-title">
              <Icon name="wallet" size={22} />
              오픈뱅킹 계좌 잔액
            </div>
            <div className="showcase-card-total">
              <span>조회된 계좌 잔액 합계</span>
              <strong>{totalLabel}</strong>
            </div>
            <div className="showcase-card-meta">
              <div>
                <span>연결 계좌</span>
                <strong>{serverError ? '-1' : accounts?.length ?? (isLoading ? '조회 중' : '-')}</strong>
              </div>
              <div>
                <span>연결 은행</span>
                <strong>{serverError ? '-1' : bankNames.length || (isLoading ? '조회 중' : '-')}</strong>
              </div>
            </div>
            {bankNames.length > 0 && (
              <div className="showcase-banks">
                {bankNames.map((bankName) => <span key={bankName}>{bankName}</span>)}
              </div>
            )}
          </article>

          {message && (
            <div className={`api-message showcase-message${serverError ? ' server-error' : ''}`}>
              {serverError && <strong>-1</strong>}
              <span>{message}</span>
            </div>
          )}

          <div className="showcase-actions">
            <button className="secondary-button" onClick={() => void loadShowcase()} type="button">
              <Icon name="refresh" size={18} />
              잔액 다시 조회
            </button>
            <button
              className="primary-button"
              disabled={typeof totalBalance !== 'number'}
              onClick={() => void copyShowcase()}
              type="button"
            >
              <Icon name="share" size={18} />
              {copied ? '복사 완료' : '공유 문구 복사'}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [session, setSession] = useState<AuthSession | null>(loadStoredSession)
  const [view, setView] = useState<View>(() => {
    const requestedView = getViewFromHash()
    return ['assets', 'showcase'].includes(requestedView) && !loadStoredSession()
      ? 'login'
      : requestedView
  })

  const navigate = useCallback((nextView: View) => {
    const destination = ['assets', 'showcase'].includes(nextView) && !session ? 'login' : nextView
    setView(destination)
    window.history.pushState(null, '', `#${destination}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [session])

  const authenticated = (auth: AuthResponse, email: string, remember: boolean) => {
    const nextSession = saveSession(auth, email, remember)
    setSession(nextSession)
    setView('assets')
    window.history.replaceState(null, '', '#assets')
  }

  const logout = useCallback(() => {
    clearStoredSession()
    setSession(null)
    setView('login')
    window.history.replaceState(null, '', '#login')
  }, [])

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', session ? '#assets' : '#landing')
    } else if (['#assets', '#showcase'].includes(window.location.hash) && !loadStoredSession()) {
      window.history.replaceState(null, '', '#login')
    }

    const handleNavigation = () => {
      const requestedView = getViewFromHash()
      if (['assets', 'showcase'].includes(requestedView) && !loadStoredSession()) {
        setSession(null)
        setView('login')
        window.history.replaceState(null, '', '#login')
        return
      }
      setView(requestedView)
    }

    window.addEventListener('hashchange', handleNavigation)
    window.addEventListener('popstate', handleNavigation)
    return () => {
      window.removeEventListener('hashchange', handleNavigation)
      window.removeEventListener('popstate', handleNavigation)
    }
  }, [session])

  if (view === 'landing') return <Landing navigate={navigate} />
  if (view === 'login') {
    return (
      <AuthPage
        initialMode="login"
        navigate={navigate}
        onAuthenticated={authenticated}
      />
    )
  }
  if (!session) {
    return (
      <AuthPage
        initialMode="login"
        navigate={navigate}
        onAuthenticated={authenticated}
      />
    )
  }
  if (view === 'showcase') {
    return <ShowcasePage navigate={navigate} onLogout={logout} session={session} />
  }
  return <AccountsPage navigate={navigate} onLogout={logout} session={session} />
}

export default App
