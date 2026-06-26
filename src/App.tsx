import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent } from 'react'
import {
  ArrowRight,
  Check,
  Eye,
  Landmark,
  Link2,
  Lock,
  LogOut,
  RefreshCw,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Wallet,
  type LucideProps,
} from 'lucide-react'
import { api, ApiError, type Account, type AuthResponse, type Balance, type Profile } from './api'
import './App.css'

type View = 'landing' | 'login' | 'assets' | 'showcase' | 'profile'
type AuthMode = 'login' | 'signup'
type ShowcaseTheme = 'navy' | 'blue' | 'cream' | 'cloud'

type AuthSession = {
  accessToken: string
  refreshToken: string
  email: string
  expiresAt: number
  refreshExpiresAt: number | null
  remember: boolean
}

type AuthenticatedRequest = <T>(request: (token: string) => Promise<T>) => Promise<T>

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
  | 'settings'
  | 'share'
  | 'shield'
  | 'sparkle'
  | 'trash'
  | 'wallet'

type BalanceState =
  | { status: 'loading' }
  | { status: 'success'; data: Balance }
  | { status: 'server-error' }
  | { status: 'error'; message: string }

const AUTH_STORAGE_KEY = 'assetview-session'
// 액세스 토큰 만료 약간 전에 미리 재발급해 401을 피한다.
const REFRESH_BUFFER_MS = 60_000

class SessionRefreshError extends Error {
  constructor() {
    super('로그인 세션을 갱신할 수 없습니다. 잠시 후 다시 시도해주세요.')
    this.name = 'SessionRefreshError'
  }
}

function getViewFromHash(): View {
  const hash = window.location.hash.replace('#', '')
  return ['landing', 'login', 'assets', 'showcase', 'profile'].includes(hash) ? hash as View : 'landing'
}

const iconComponents: Record<IconName, ComponentType<LucideProps>> = {
  arrow: ArrowRight,
  bank: Landmark,
  check: Check,
  eye: Eye,
  link: Link2,
  lock: Lock,
  logout: LogOut,
  profile: User,
  refresh: RefreshCw,
  settings: Settings,
  share: Share2,
  shield: ShieldCheck,
  sparkle: Sparkles,
  trash: Trash2,
  wallet: Wallet,
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const LucideIcon = iconComponents[name]
  return <LucideIcon aria-hidden="true" className="icon" size={size} />
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
  if (error instanceof Error) return error.message
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
    if (
      !session.accessToken
      || !session.refreshToken
      || isRefreshTokenExpired(session)
    ) {
      clearStoredSession()
      return null
    }
    return session
  } catch {
    clearStoredSession()
    return null
  }
}

function isRefreshTokenExpired(session: AuthSession) {
  return typeof session.refreshExpiresAt === 'number'
    && session.refreshExpiresAt <= Date.now()
}

function saveSession(
  auth: AuthResponse,
  email: string,
  remember: boolean,
  previousSession?: AuthSession,
) {
  const now = Date.now()
  const refreshToken = auth.refreshToken ?? previousSession?.refreshToken
  if (!refreshToken) {
    throw new Error('서버 응답에 refreshToken이 없습니다.')
  }

  const session: AuthSession = {
    accessToken: auth.accessToken,
    refreshToken,
    email,
    expiresAt: now + auth.expiresInSeconds * 1000,
    refreshExpiresAt: typeof auth.refreshTokenExpiresInSeconds === 'number'
      ? now + auth.refreshTokenExpiresInSeconds * 1000
      : previousSession?.refreshExpiresAt ?? null,
    remember,
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

          <form className="auth-form" noValidate onSubmit={submit}>
            <label>
              이메일
              <span className="auth-input">
                <Icon name="profile" size={18} />
                <input
                  autoComplete="email"
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
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호"
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
        <button onClick={() => navigate('profile')} type="button">
          <Icon name="settings" size={18} />
          {email}
        </button>
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
  requestWithAuth,
}: {
  session: AuthSession
  navigate: (view: View) => void
  onLogout: () => void
  requestWithAuth: AuthenticatedRequest
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
      const response = await requestWithAuth((token) => api.getAccounts(token))
      setAccounts(response.accounts)
      setBalances(Object.fromEntries(
        response.accounts.map((account) => [account.fintechUseNum, { status: 'loading' }]),
      ))

      await Promise.all(response.accounts.map(async (account) => {
        try {
          const balance = await requestWithAuth((token) => api.getBalance(token, account.fintechUseNum))
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
  }, [handleApiError, requestWithAuth])

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
      const response = await requestWithAuth((token) => api.getAuthorizeUrl(token))
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
  requestWithAuth,
}: {
  session: AuthSession
  navigate: (view: View) => void
  onLogout: () => void
  requestWithAuth: AuthenticatedRequest
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
      const response = await requestWithAuth((token) => api.getAccounts(token))
      setAccounts(response.accounts)
      setBalances(Object.fromEntries(
        response.accounts.map((account) => [account.fintechUseNum, { status: 'loading' }]),
      ))

      await Promise.all(response.accounts.map(async (account) => {
        try {
          const balance = await requestWithAuth((token) => api.getBalance(token, account.fintechUseNum))
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
  }, [onLogout, requestWithAuth])

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

  const holderName = useMemo(
    () => (accounts ?? []).map((account) => account.accountHolderName).find(Boolean) ?? '',
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
      holderName
        ? `${holderName}님의 오픈뱅킹 계좌 잔액은 ${formatWon(totalBalance)}입니다.`
        : `내 오픈뱅킹 계좌 잔액은 ${formatWon(totalBalance)}입니다.`,
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
            {holderName && (
              <div className="showcase-card-name">
                <Icon name="profile" size={16} />
                <span>{holderName}</span>
                <small>님</small>
              </div>
            )}
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

type ProfileState =
  | { status: 'loading' }
  | { status: 'success'; data: Profile }
  | { status: 'server-error' }
  | { status: 'error'; message: string }

function formatJoinedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function ProfilePage({
  session,
  navigate,
  onLogout,
  onEmailChange,
  requestWithAuth,
}: {
  session: AuthSession
  navigate: (view: View) => void
  onLogout: () => void
  onEmailChange: (email: string) => void
  requestWithAuth: AuthenticatedRequest
}) {
  const [profileState, setProfileState] = useState<ProfileState>({ status: 'loading' })

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailServerError, setEmailServerError] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [isChangingEmail, setIsChangingEmail] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordServerError, setPasswordServerError] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteServerError, setDeleteServerError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      onLogout()
      return true
    }
    return false
  }, [onLogout])

  const loadProfile = useCallback(async () => {
    setProfileState({ status: 'loading' })
    try {
      const profile = await requestWithAuth((token) => api.getProfile(token))
      setProfileState({ status: 'success', data: profile })
    } catch (error) {
      if (handleApiError(error)) return
      setProfileState(
        error instanceof ApiError && error.isServerError
          ? { status: 'server-error' }
          : { status: 'error', message: getApiErrorMessage(error) },
      )
    }
  }, [handleApiError, requestWithAuth])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadProfile])

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEmailError('')
    setEmailServerError(false)
    setEmailSuccess(false)

    // 서버와 동일하게 공백 제거 후 소문자로 정규화한다.
    const normalizedEmail = email.trim().toLowerCase()
    const currentEmail = profileState.status === 'success' ? profileState.data.email : session.email
    if (normalizedEmail === currentEmail) {
      setEmailError('현재 이메일과 동일합니다.')
      return
    }

    setIsChangingEmail(true)
    try {
      await requestWithAuth((token) => api.changeEmail(token, normalizedEmail))
      onEmailChange(normalizedEmail)
      setProfileState((current) =>
        current.status === 'success'
          ? { status: 'success', data: { ...current.data, email: normalizedEmail } }
          : current,
      )
      setEmailSuccess(true)
      setEmail('')
    } catch (error) {
      if (handleApiError(error)) return
      setEmailServerError(error instanceof ApiError && error.isServerError)
      if (error instanceof ApiError && error.status === 409) {
        setEmailError('이미 사용 중인 이메일입니다.')
      } else if (error instanceof ApiError && error.status === 400) {
        setEmailError('올바른 이메일 형식이 아닙니다.')
      } else {
        setEmailError(getApiErrorMessage(error))
      }
    } finally {
      setIsChangingEmail(false)
    }
  }

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordServerError(false)
    setPasswordSuccess(false)

    if (newPassword.length < 8 || newPassword.length > 72) {
      setPasswordError('새 비밀번호는 8~72자로 입력해주세요.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('새 비밀번호가 기존 비밀번호와 같습니다.')
      return
    }

    setIsChangingPassword(true)
    try {
      await requestWithAuth((token) => api.changePassword(token, currentPassword, newPassword))
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      if (handleApiError(error)) return
      setPasswordServerError(error instanceof ApiError && error.isServerError)
      if (error instanceof ApiError && error.body?.code === 'INVALID_CURRENT_PASSWORD') {
        setPasswordError('현재 비밀번호가 일치하지 않습니다.')
      } else {
        setPasswordError(getApiErrorMessage(error))
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  const deleteAccount = async () => {
    setDeleteError('')
    setDeleteServerError(false)
    setIsDeleting(true)
    try {
      await requestWithAuth((token) => api.deleteAccount(token))
      onLogout()
    } catch (error) {
      if (handleApiError(error)) return
      // 회원이 이미 존재하지 않으면(404) 세션이 무효하므로 탈퇴와 동일하게 로그아웃한다.
      if (error instanceof ApiError && error.status === 404) {
        onLogout()
        return
      }
      setDeleteServerError(error instanceof ApiError && error.isServerError)
      setDeleteError(getApiErrorMessage(error))
      setIsDeleting(false)
    }
  }

  const canSubmitEmail = email.trim().length > 0 && !isChangingEmail

  const canSubmitPassword = currentPassword.length > 0
    && newPassword.length > 0
    && confirmPassword.length > 0
    && !isChangingPassword

  return (
    <main className="page-shell profile-page">
      <AppHeader email={session.email} navigate={navigate} onLogout={onLogout} />
      <section className="profile-content">
        <button className="back-button" onClick={() => navigate('assets')} type="button">
          <Icon name="arrow" size={16} />
          연결 계좌로 돌아가기
        </button>

        <div className="profile-heading">
          <span className="eyebrow">ACCOUNT SETTINGS</span>
          <h1>회원 정보 관리</h1>
          <p>계정 정보를 확인하고 이메일·비밀번호 변경 또는 회원 탈퇴를 진행할 수 있습니다.</p>
        </div>

        <article className="profile-card">
          <div className="profile-card-head">
            <span className="profile-avatar"><Icon name="profile" size={22} /></span>
            <div>
              <h2>내 계정</h2>
              <p>로그인에 사용하는 기본 정보입니다.</p>
            </div>
          </div>

          {profileState.status === 'loading' && (
            <div className="profile-state">계정 정보를 조회하고 있습니다.</div>
          )}

          {(profileState.status === 'error' || profileState.status === 'server-error') && (
            <>
              <div className={`api-message${profileState.status === 'server-error' ? ' server-error' : ''}`}>
                {profileState.status === 'server-error' && <strong>-1</strong>}
                <span>
                  {profileState.status === 'server-error'
                    ? '계정 정보를 불러오지 못했습니다.'
                    : profileState.message}
                </span>
              </div>
              <button className="secondary-button compact-button profile-retry" onClick={() => void loadProfile()} type="button">
                <Icon name="refresh" size={16} />
                다시 시도
              </button>
            </>
          )}

          {profileState.status === 'success' && (
            <dl className="profile-details">
              <div><dt>회원 번호</dt><dd>{profileState.data.id}</dd></div>
              <div><dt>이메일</dt><dd>{profileState.data.email}</dd></div>
              <div><dt>가입일</dt><dd>{formatJoinedAt(profileState.data.createdAt)}</dd></div>
            </dl>
          )}
        </article>

        <article className="profile-card">
          <div className="profile-card-head">
            <span className="profile-avatar"><Icon name="profile" size={22} /></span>
            <div>
              <h2>이메일 변경</h2>
              <p>로그인에 사용할 새 이메일을 입력하세요.</p>
            </div>
          </div>

          <form className="auth-form profile-form" noValidate onSubmit={submitEmail}>
            <label>
              새 이메일
              <span className="auth-input">
                <Icon name="profile" size={18} />
                <input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="new@example.com"
                  type="email"
                  value={email}
                />
              </span>
            </label>

            {emailError && (
              <div className={`api-error-banner${emailServerError ? ' server-error' : ''}`} role="alert">
                {emailServerError && <strong>-1</strong>}
                <span>{emailError}</span>
              </div>
            )}

            {emailSuccess && (
              <div className="api-message profile-success">
                <Icon name="check" size={16} />
                <span>이메일이 변경되었습니다.</span>
              </div>
            )}

            <button className="primary-button" disabled={!canSubmitEmail} type="submit">
              {isChangingEmail ? '변경 중...' : '이메일 변경'}
              {!isChangingEmail && <Icon name="arrow" size={18} />}
            </button>
          </form>
        </article>

        <article className="profile-card">
          <div className="profile-card-head">
            <span className="profile-avatar"><Icon name="lock" size={22} /></span>
            <div>
              <h2>비밀번호 변경</h2>
              <p>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</p>
            </div>
          </div>

          <form className="auth-form profile-form" noValidate onSubmit={submitPassword}>
            <label>
              현재 비밀번호
              <span className="auth-input">
                <Icon name="lock" size={18} />
                <input
                  autoComplete="current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="현재 비밀번호"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                />
              </span>
            </label>

            <label>
              새 비밀번호
              <span className="auth-input">
                <Icon name="lock" size={18} />
                <input
                  autoComplete="new-password"
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="새 비밀번호"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                />
              </span>
            </label>

            <label>
              새 비밀번호 확인
              <span className="auth-input">
                <Icon name="lock" size={18} />
                <input
                  autoComplete="new-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="새 비밀번호 확인"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                />
                <button
                  aria-label={showPasswords ? '비밀번호 숨기기' : '비밀번호 보기'}
                  onClick={() => setShowPasswords((current) => !current)}
                  type="button"
                >
                  <Icon name="eye" size={18} />
                </button>
              </span>
            </label>

            {passwordError && (
              <div className={`api-error-banner${passwordServerError ? ' server-error' : ''}`} role="alert">
                {passwordServerError && <strong>-1</strong>}
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="api-message profile-success">
                <Icon name="check" size={16} />
                <span>비밀번호가 변경되었습니다.</span>
              </div>
            )}

            <button className="primary-button" disabled={!canSubmitPassword} type="submit">
              {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
              {!isChangingPassword && <Icon name="arrow" size={18} />}
            </button>
          </form>
        </article>

        <article className="profile-card profile-danger">
          <div className="profile-card-head">
            <span className="profile-avatar danger"><Icon name="trash" size={22} /></span>
            <div>
              <h2>회원 탈퇴</h2>
              <p>탈퇴하면 계정과 연결된 모든 정보가 삭제되며 되돌릴 수 없습니다.</p>
            </div>
          </div>

          {deleteError && (
            <div className={`api-error-banner${deleteServerError ? ' server-error' : ''}`} role="alert">
              {deleteServerError && <strong>-1</strong>}
              <span>{deleteError}</span>
            </div>
          )}

          {!isConfirmingDelete ? (
            <button
              className="secondary-button profile-delete-button"
              onClick={() => setIsConfirmingDelete(true)}
              type="button"
            >
              <Icon name="trash" size={18} />
              회원 탈퇴
            </button>
          ) : (
            <div className="profile-delete-confirm">
              <p>정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다.</p>
              <div className="profile-delete-actions">
                <button
                  className="secondary-button compact-button"
                  disabled={isDeleting}
                  onClick={() => setIsConfirmingDelete(false)}
                  type="button"
                >
                  취소
                </button>
                <button
                  className="primary-button compact-button profile-delete-button"
                  disabled={isDeleting}
                  onClick={() => void deleteAccount()}
                  type="button"
                >
                  <Icon name="trash" size={16} />
                  {isDeleting ? '탈퇴 중...' : '탈퇴 확정'}
                </button>
              </div>
            </div>
          )}
        </article>
      </section>
    </main>
  )
}

function App() {
  const [session, setSession] = useState<AuthSession | null>(loadStoredSession)
  const [isBootstrapping, setIsBootstrapping] = useState(() => {
    const stored = loadStoredSession()
    return stored !== null && stored.expiresAt <= Date.now()
  })
  const [view, setView] = useState<View>(() => {
    const requestedView = getViewFromHash()
    return ['assets', 'showcase', 'profile'].includes(requestedView) && !loadStoredSession()
      ? 'login'
      : requestedView
  })
  const sessionRef = useRef<AuthSession | null>(session)
  const refreshPromiseRef = useRef<Promise<AuthSession | null> | null>(null)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const navigate = useCallback((nextView: View) => {
    const destination = ['assets', 'showcase', 'profile'].includes(nextView) && !session ? 'login' : nextView
    setView(destination)
    window.history.pushState(null, '', `#${destination}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [session])

  const authenticated = (auth: AuthResponse, email: string, remember: boolean) => {
    const nextSession = saveSession(auth, email, remember)
    sessionRef.current = nextSession
    setSession(nextSession)
    setIsBootstrapping(false)
    setView('assets')
    window.history.replaceState(null, '', '#assets')
  }

  const logout = useCallback(() => {
    sessionRef.current = null
    refreshPromiseRef.current = null
    clearStoredSession()
    setSession(null)
    setIsBootstrapping(false)
    setView('login')
    window.history.replaceState(null, '', '#login')
  }, [])

  const changeEmail = useCallback((email: string) => {
    setSession((current) => {
      if (!current) return current
      const next = { ...current, email }
      // 토큰을 보관 중인 스토리지에만 갱신된 이메일을 다시 기록한다.
      const storage = current.remember ? localStorage : sessionStorage
      storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next))
      sessionRef.current = next
      return next
    })
  }, [])

  const refreshSession = useCallback(async (): Promise<AuthSession | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const current = sessionRef.current ?? loadStoredSession()
    if (!current) {
      logout()
      return null
    }
    if (isRefreshTokenExpired(current)) {
      logout()
      return null
    }

    const refreshPromise = (async () => {
      try {
        const auth = await api.refresh(current.refreshToken)
        const latest = sessionRef.current
        if (!latest || latest.refreshToken !== current.refreshToken) {
          return latest
        }

        const next = saveSession(auth, latest.email, latest.remember, latest)
        sessionRef.current = next
        setSession(next)
        return next
      } catch (error) {
        // 리프레시 토큰이 무효한 경우에만 로그아웃하고, 일시적 오류는 다음 시도에 맡긴다.
        if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
          logout()
        }
        return null
      }
    })()

    refreshPromiseRef.current = refreshPromise
    try {
      return await refreshPromise
    } finally {
      if (refreshPromiseRef.current === refreshPromise) {
        refreshPromiseRef.current = null
      }
    }
  }, [logout])

  const getFreshSession = useCallback(async () => {
    const current = sessionRef.current ?? loadStoredSession()
    if (!current || isRefreshTokenExpired(current)) {
      logout()
      return null
    }

    if (current.expiresAt - Date.now() <= REFRESH_BUFFER_MS) {
      return refreshSession()
    }

    return current
  }, [logout, refreshSession])

  const requestWithAuth = useCallback(async <T,>(request: (token: string) => Promise<T>) => {
    const current = await getFreshSession()
    if (!current) {
      throw new SessionRefreshError()
    }

    try {
      return await request(current.accessToken)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error
      }

      const refreshed = await refreshSession()
      if (!refreshed) {
        if (sessionRef.current) {
          throw new SessionRefreshError()
        }
        throw error
      }

      return request(refreshed.accessToken)
    }
  }, [getFreshSession, refreshSession])

  useEffect(() => {
    if (!session) return
    let cancelled = false

    const renew = async () => {
      await refreshSession()
      if (!cancelled) setIsBootstrapping(false)
    }

    const msUntilRefresh = session.expiresAt - Date.now() - REFRESH_BUFFER_MS
    if (msUntilRefresh <= 0) {
      void renew()
      return () => { cancelled = true }
    }

    // 만료 전 상태로 진입했으므로 부트스트랩 게이트는 이미 닫혀 있다.
    const timer = window.setTimeout(() => { void renew() }, msUntilRefresh)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [session, refreshSession])

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', session ? '#assets' : '#landing')
    } else if (['#assets', '#showcase', '#profile'].includes(window.location.hash) && !loadStoredSession()) {
      window.history.replaceState(null, '', '#login')
    }

    const handleNavigation = () => {
      const requestedView = getViewFromHash()
      if (['assets', 'showcase', 'profile'].includes(requestedView) && !loadStoredSession()) {
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
  if (isBootstrapping) {
    return (
      <main className="page-shell accounts-page">
        <div className="accounts-state">세션을 갱신하고 있습니다.</div>
      </main>
    )
  }
  if (view === 'showcase') {
    return (
      <ShowcasePage
        navigate={navigate}
        onLogout={logout}
        requestWithAuth={requestWithAuth}
        session={session}
      />
    )
  }
  if (view === 'profile') {
    return (
      <ProfilePage
        navigate={navigate}
        onEmailChange={changeEmail}
        onLogout={logout}
        requestWithAuth={requestWithAuth}
        session={session}
      />
    )
  }
  return (
    <AccountsPage
      navigate={navigate}
      onLogout={logout}
      requestWithAuth={requestWithAuth}
      session={session}
    />
  )
}

export default App
