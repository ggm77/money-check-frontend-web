import { useEffect, useState, type ReactNode } from 'react'
import './App.css'

type View = 'landing' | 'profile' | 'assets' | 'share'

type IconName =
  | 'arrow'
  | 'badge'
  | 'bank'
  | 'card'
  | 'check'
  | 'chevron'
  | 'eye'
  | 'gear'
  | 'home'
  | 'lock'
  | 'plus'
  | 'profile'
  | 'refresh'
  | 'share'
  | 'shield'
  | 'sparkle'

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <path d="m5 12 14 0m-5-5 5 5-5 5" />,
  badge: (
    <>
      <path d="m12 3 2 1.4 2.4-.2.8 2.3 2.1 1.3-.8 2.3.8 2.3-2.1 1.3-.8 2.3-2.4-.2L12 19l-2-1.4-2.4.2-.8-2.3-2.1-1.3.8-2.3-.8-2.3 2.1-1.3.8-2.3 2.4.2L12 3Z" />
      <path d="m9.5 11.7 1.7 1.7 3.6-3.8" />
    </>
  ),
  bank: (
    <>
      <path d="m3 9 9-5 9 5" />
      <path d="M5 10v7m4-7v7m6-7v7m4-7v7M3 20h18" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 13.5v-3l-2-.7-.8-1.9.9-1.9-2.1-2.1-1.9.9-1.9-.8-.7-2h-3l-.7 2-1.9.8-1.9-.9L.9 6l.9 1.9L1 9.8l-2 .7v3l2 .7.8 1.9-.9 1.9L3 20.1l1.9-.9 1.9.8.7 2h3l.7-2 1.9-.8 1.9.9 2.1-2.1-.9-1.9.8-1.9 2-.7Z" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
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

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button className="logo" onClick={onClick} type="button">
      <span className="logo-mark">
        <span />
      </span>
      <span>AssetView</span>
    </button>
  )
}

function Avatar({ small = false }: { small?: boolean }) {
  return (
    <div className={`avatar${small ? ' avatar-small' : ''}`} aria-label="사용자 프로필 사진">
      <span className="avatar-hair" />
      <span className="avatar-face" />
      <span className="avatar-neck" />
      <span className="avatar-shirt" />
    </div>
  )
}

function Header({
  active,
  navigate,
}: {
  active: View
  navigate: (view: View) => void
}) {
  return (
    <header className="site-header">
      <Logo onClick={() => navigate('landing')} />
      <nav className="main-nav" aria-label="주요 메뉴">
        <button
          className={active === 'profile' ? 'active' : ''}
          onClick={() => navigate('profile')}
          type="button"
        >
          <Icon name="profile" size={18} />
          내 프로필
        </button>
        <button
          className={active === 'assets' ? 'active' : ''}
          onClick={() => navigate('assets')}
          type="button"
        >
          <Icon name="home" size={18} />
          연결 자산
        </button>
        <button type="button">
          <Icon name="gear" size={18} />
          설정
        </button>
        <Avatar small />
      </nav>
    </header>
  )
}

function VerifiedCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`verified-card${compact ? ' compact' : ''}`}>
      <div className="verified-label">
        <Icon name="badge" size={17} />
        AssetView Verified
      </div>
      <Avatar />
      <div className="verified-name">
        @sehamin <Icon name="badge" size={18} />
      </div>
      <p>검증된 자산 프로필</p>
      <div className="verified-total">
        <span>총 자산</span>
        <strong>128,450,000<small>원</small></strong>
      </div>
      <time dateTime="2026-05-21">인증일 2026.05.21</time>
    </article>
  )
}

function Landing({ navigate }: { navigate: (view: View) => void }) {
  const benefits: Array<[IconName, string, string]> = [
    ['bank', '완벽한 자산 인증', '금융 데이터로 정확한 자산 확인'],
    ['profile', '간편한 연결', '금융 기관 연동만으로 2분 확인'],
    ['shield', '프라이버시 보호', '필요한 정보만 안전하게 공유'],
  ]

  return (
    <main className="landing-page page-shell">
      <div className="landing-header">
        <Logo onClick={() => navigate('landing')} />
        <nav aria-label="소개 메뉴">
          <button type="button">서비스 소개</button>
          <button type="button">혜택</button>
          <button type="button">FAQ</button>
          <button className="nav-cta" onClick={() => navigate('profile')} type="button">
            앱 둘러보기
          </button>
        </nav>
      </div>

      <section className="landing-content">
        <div className="landing-copy">
          <div>
            <span className="eyebrow">VERIFIED FINANCIAL PROFILE</span>
            <h1>
              검증된 자산으로
              <br />
              <em>나를 보여주세요</em>
            </h1>
            <p className="landing-description">
              기관·금융·PT·부동산 등 다양한 금융기관
              <br />
              Verified Asset 자산의 인증으로
              <br />
              신뢰를 높이고 관계를 확장하세요.
            </p>
          </div>

          <div className="benefit-list">
            {benefits.map(([icon, title, description]) => (
              <div className="benefit" key={title}>
                <span className="benefit-icon">
                  <Icon name={icon} size={19} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </div>
            ))}
          </div>

          <button className="primary-button landing-button" onClick={() => navigate('profile')} type="button">
            자산 인증 시작하기
            <Icon name="arrow" size={18} />
          </button>
        </div>

        <div className="landing-card-wrap">
          <span className="card-glow card-glow-one" />
          <span className="card-glow card-glow-two" />
          <VerifiedCard />
        </div>
      </section>
    </main>
  )
}

function Profile({ navigate }: { navigate: (view: View) => void }) {
  return (
    <main className="app-page page-shell">
      <Header active="profile" navigate={navigate} />
      <section className="profile-content">
        <div className="profile-intro">
          <div className="section-kicker">
            <Icon name="shield" size={24} />
            Verified Asset
          </div>
          <h1>자산 인증 완료</h1>
          <Avatar />
          <div className="profile-name">
            @sehamin <Icon name="badge" size={22} />
          </div>
          <p>검증된 자산 프로필</p>
        </div>

        <article className="total-panel">
          <span>총 자산</span>
          <strong>128,450,000<small>원</small></strong>
        </article>

        <div className="trust-banner">
          <span className="trust-icon">
            <Icon name="shield" size={28} />
          </span>
          <span>
            <strong>신뢰할 수 있는 금융 데이터로 검증되었습니다</strong>
            <small>은행 · 증권 · 보험 등 4개 기관 연동</small>
          </span>
          <Icon name="chevron" size={22} />
        </div>

        <div className="profile-meta">
          <span>인증일 2026.05.21</span>
          <span>
            <Icon name="lock" size={17} />
            데이터는 안전하게 보호됩니다
          </span>
          <button onClick={() => navigate('assets')} type="button">
            자세히 보기 <Icon name="arrow" size={18} />
          </button>
        </div>

        <div className="profile-actions">
          <button className="secondary-button" type="button">
            <Icon name="share" size={20} />
            프로필 공유
          </button>
          <button className="primary-button" onClick={() => navigate('share')} type="button">
            <Icon name="sparkle" size={20} />
            공유 카드 만들기
          </button>
        </div>
      </section>
    </main>
  )
}

type AssetItem = {
  color: string
  institution: string
  product: string
  value: string
  change?: string
  symbol: string
}

type AssetGroup = {
  key: string
  label: string
  total: string
  items: AssetItem[]
}

const assetGroups: AssetGroup[] = [
  {
    key: 'deposit',
    label: '예금 · 2개',
    total: '25,300,000원',
    items: [
      { color: '#1672e9', institution: '국민은행', product: '입출금통장', value: '12,300,000원', change: '+1.5%', symbol: 'K' },
      { color: '#2564d9', institution: '신한은행', product: '저축 · 예금', value: '6,050,000원', change: '+2.1%', symbol: 'S' },
      { color: '#1748d2', institution: '우리은행', product: '적금', value: '6,950,000원', change: '+1.2%', symbol: 'W' },
    ],
  },
  {
    key: 'investment',
    label: '투자',
    total: '73,300,000원',
    items: [
      { color: '#16a0ef', institution: 'NH투자증권', product: '종합 계좌', value: '34,150,000원', change: '+2.7%', symbol: 'N' },
      { color: '#5932bf', institution: '삼성증권', product: '중개 (ISA)', value: '12,020,000원', change: '+1.9%', symbol: 'S' },
      { color: '#17213f', institution: '키움증권', product: '선물옵션', value: '27,130,000원', change: '+1.7%', symbol: 'K' },
    ],
  },
  {
    key: 'insurance',
    label: '보험 · 1개',
    total: '20,950,000원',
    items: [
      { color: '#1f91e9', institution: '삼성화재', product: '종신보험', value: '12,950,000원', change: '+0.6%', symbol: 'S' },
    ],
  },
  {
    key: 'other',
    label: '기타',
    total: '8,900,000원',
    items: [
      { color: '#6a7a91', institution: '부동산 보증금', product: '임차 보증금', value: '8,900,000원', symbol: 'H' },
    ],
  },
]

function Assets({ navigate }: { navigate: (view: View) => void }) {
  const [filter, setFilter] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notice, setNotice] = useState('')
  const tabs = [
    ['all', '전체 자산'],
    ['deposit', '예금'],
    ['investment', '주식'],
    ['card', '카드'],
    ['insurance', '보험'],
    ['other', '기타'],
  ]
  const visibleGroups = filter === 'all'
    ? assetGroups
    : assetGroups.filter((group) => group.key === filter)

  const refresh = () => {
    setIsRefreshing(true)
    window.setTimeout(() => {
      setIsRefreshing(false)
      setNotice('자산 정보가 최신 상태입니다.')
      window.setTimeout(() => setNotice(''), 2200)
    }, 700)
  }

  return (
    <main className="app-page page-shell">
      <Header active="assets" navigate={navigate} />
      <section className="assets-content">
        <div className="assets-title-row">
          <div>
            <h1>연결 자산</h1>
            <p>내 자산을 한눈에 안전하게 관리해요.</p>
          </div>
          <button
            className="add-asset-button"
            onClick={() => setNotice('새 자산 연결 기능을 준비하고 있습니다.')}
            type="button"
          >
            <Icon name="plus" size={17} />
            자산 연결하기
          </button>
        </div>

        <div className="assets-summary">
          <div><span>총 자산 (예상)</span><strong>128,450,000원</strong></div>
          <div><span>연결 기관 수</span><strong>4개</strong></div>
          <div><span>Last 업데이트</span><strong>5일 전</strong></div>
          <button
            aria-label="자산 새로고침"
            className={isRefreshing ? 'refreshing' : ''}
            onClick={refresh}
            type="button"
          >
            <Icon name="refresh" size={20} />
          </button>
        </div>

        <div className="asset-tabs" role="tablist" aria-label="자산 종류">
          {tabs.map(([key, label]) => (
            <button
              aria-selected={filter === key}
              className={filter === key ? 'active' : ''}
              key={key}
              onClick={() => setFilter(key)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="asset-groups">
          {visibleGroups.length > 0 ? visibleGroups.map((group) => (
            <article className="asset-group" key={group.key}>
              <div className="asset-group-heading">
                <strong>{group.label}</strong>
                <strong>{group.total}</strong>
              </div>
              {group.items.map((item) => (
                <div className="asset-row" key={`${group.key}-${item.institution}`}>
                  <span className="institution-logo" style={{ backgroundColor: item.color }}>
                    {item.symbol}
                  </span>
                  <strong>{item.institution}</strong>
                  <span>{item.product}</span>
                  <strong>{item.value}</strong>
                  {item.change && <em>{item.change}</em>}
                </div>
              ))}
            </article>
          )) : (
            <div className="empty-assets">
              <Icon name="card" size={28} />
              <strong>연결된 카드 자산이 없습니다</strong>
              <span>자산 연결하기에서 새로운 기관을 추가해보세요.</span>
            </div>
          )}
        </div>

        <footer className="asset-footer">
          <span><Icon name="shield" size={16} /> 연결 금융 정보는 256bit 암호화로 안전하게 보호됩니다.</span>
          <button type="button">보안 자세히 보기 <Icon name="chevron" size={15} /></button>
        </footer>
      </section>
      {notice && <div className="toast">{notice}</div>}
    </main>
  )
}

type ShareOption = 'total' | 'name' | 'date' | 'badge'

function ShareCard({ navigate }: { navigate: (view: View) => void }) {
  const [theme, setTheme] = useState('navy')
  const [options, setOptions] = useState<Record<ShareOption, boolean>>({
    total: true,
    name: true,
    date: true,
    badge: true,
  })
  const [notice, setNotice] = useState('')
  const themes = [
    ['blue', '딥 네이비'],
    ['navy', '미드나잇'],
    ['cream', '화이트'],
    ['cloud', '클라우드'],
  ]

  const toggleOption = (key: ShareOption) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <main className="app-page page-shell">
      <header className="share-header">
        <Logo onClick={() => navigate('landing')} />
        <div className="share-steps" aria-label="공유 카드 제작 단계">
          <span className="active"><b>1</b> 카드 선택</span>
          <i />
          <span><b>2</b> 스타일 선택</span>
          <i />
          <span><b>3</b> 공유 옵션</span>
        </div>
        <button className="reset-button" onClick={() => setTheme('navy')} type="button">
          카드 리셋 <Icon name="refresh" size={16} />
        </button>
      </header>

      <section className="share-builder">
        <aside className="share-controls">
          <div>
            <h1>공유 카드 만들기</h1>
            <p>나만의 스타일로 인증 프로필을 디자인하고 공유해보세요.</p>
          </div>

          <fieldset>
            <legend>카드 배경</legend>
            <div className="theme-list">
              {themes.map(([key, label]) => (
                <button
                  aria-label={`${label} 배경 선택`}
                  className={`theme-swatch theme-${key}${theme === key ? ' active' : ''}`}
                  key={key}
                  onClick={() => setTheme(key)}
                  type="button"
                />
              ))}
            </div>
            <span className="theme-name">
              {themes.find(([key]) => key === theme)?.[1]}
            </span>
          </fieldset>

          <fieldset>
            <legend>표시 항목</legend>
            <div className="option-list">
              {([
                ['total', '총 자산'],
                ['name', '보유 자산'],
                ['date', '승인일'],
                ['badge', '인증 배지'],
              ] as Array<[ShareOption, string]>).map(([key, label]) => (
                <label key={key}>
                  <input checked={options[key]} onChange={() => toggleOption(key)} type="checkbox" />
                  <span><Icon name="check" size={13} /></span>
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </aside>

        <div
          className={[
            'share-preview',
            `preview-theme-${theme}`,
            !options.badge && 'hide-badge',
            !options.name && 'hide-name',
            !options.total && 'hide-total',
            !options.date && 'hide-date',
          ].filter(Boolean).join(' ')}
        >
          <VerifiedCard compact />
          <div className="share-preview-actions">
            <button className="secondary-button" onClick={() => navigate('profile')} type="button">
              <Icon name="profile" size={19} />
              내 프로필 저장
            </button>
            <button
              className="primary-button"
              onClick={() => {
                setNotice('공유 링크가 복사되었습니다.')
                navigator.clipboard?.writeText(window.location.href)
                window.setTimeout(() => setNotice(''), 2200)
              }}
              type="button"
            >
              <Icon name="sparkle" size={19} />
              공유하기
            </button>
          </div>
        </div>
      </section>
      {notice && <div className="toast">{notice}</div>}
    </main>
  )
}

function App() {
  const getViewFromHash = (): View => {
    const hash = window.location.hash.replace('#', '')
    return ['landing', 'profile', 'assets', 'share'].includes(hash)
      ? hash as View
      : 'landing'
  }
  const [view, setView] = useState<View>(getViewFromHash)

  const navigate = (nextView: View) => {
    setView(nextView)
    window.history.pushState(null, '', `#${nextView}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#landing')
    }
    const handleHashChange = () => setView(getViewFromHash())
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handleHashChange)
    }
  }, [])

  if (view === 'landing') return <Landing navigate={navigate} />
  if (view === 'profile') return <Profile navigate={navigate} />
  if (view === 'assets') return <Assets navigate={navigate} />
  return <ShareCard navigate={navigate} />
}

export default App
