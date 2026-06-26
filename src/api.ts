const DEFAULT_API_SERVER_URL = 'https://money.seohamin.com'
const DEFAULT_API_PREFIX = '/api/v1'

function hasProtocol(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value)
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('/') || hasProtocol(trimmed)) {
    return stripTrailingSlash(trimmed)
  }

  return stripTrailingSlash(`https://${trimmed}`)
}

function normalizePathPrefix(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  return stripTrailingSlash(trimmed.startsWith('/') ? trimmed : `/${trimmed}`)
}

function getDefaultApiServerUrl() {
  return import.meta.env.DEV ? '' : DEFAULT_API_SERVER_URL
}

function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL
  if (configuredBaseUrl?.trim()) {
    return normalizeBaseUrl(configuredBaseUrl)
  }

  const apiServerUrl = normalizeBaseUrl(
    import.meta.env.VITE_API_SERVER_URL ?? getDefaultApiServerUrl(),
  )
  const apiPrefix = normalizePathPrefix(import.meta.env.VITE_API_PREFIX ?? DEFAULT_API_PREFIX)

  return `${apiServerUrl}${apiPrefix}`
}

export const API_BASE_URL = getApiBaseUrl()

export type AuthResponse = {
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresInSeconds: number
  refreshTokenExpiresInSeconds?: number
}

export type Account = {
  fintechUseNum: string
  bankCodeStd: string
  bankName: string
  accountAlias: string
  accountNumMasked: string
  accountHolderName: string
}

export type AccountsResponse = {
  accounts: Account[]
}

export type Balance = {
  fintechUseNum: string
  bankName: string
  balanceAmt: number | null
  availableAmt: number | null
  accountType: string
  productName: string
  apiTranId: string
  rspCode: string
  rspMessage: string
}

export type AuthorizeResponse = {
  authorizeUrl: string
}

export type Profile = {
  id: number
  email: string
  createdAt: string
}

export type ApiErrorBody = {
  timestamp?: string
  httpStatus?: string
  status?: number
  error?: string
  code?: string
  message?: string
  path?: string
}

export class ApiError extends Error {
  status: number
  body: ApiErrorBody | null

  constructor(status: number, body: ApiErrorBody | null, fallbackMessage: string) {
    super(body?.message || fallbackMessage)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  get isServerError() {
    return this.status >= 500 && this.status <= 599
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  token?: string
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const requestUrl = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(requestUrl, {
    method,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const responseBody = contentType.includes('application/json')
    ? await response.json() as ApiErrorBody | T
    : null

  if (!response.ok) {
    if (response.status >= 500 && response.status <= 599) {
      console.error('[AssetView API 5xx]', {
        method,
        path: requestUrl,
        status: response.status,
        response: responseBody,
      })
    }

    throw new ApiError(
      response.status,
      responseBody as ApiErrorBody | null,
      `API 요청에 실패했습니다. (${response.status})`,
    )
  }

  return responseBody as T
}

export const api = {
  signup(email: string, password: string) {
    return request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: { email, password },
    })
  },

  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  },

  refresh(refreshToken: string) {
    return request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })
  },

  getProfile(token: string) {
    return request<Profile>('/members/me', { token })
  },

  changeEmail(token: string, email: string) {
    return request<void>('/members/me/email', {
      method: 'PATCH',
      token,
      body: { email },
    })
  },

  changePassword(token: string, currentPassword: string, newPassword: string) {
    return request<void>('/members/me/password', {
      method: 'PATCH',
      token,
      body: { currentPassword, newPassword },
    })
  },

  deleteAccount(token: string) {
    return request<void>('/members/me', { method: 'DELETE', token })
  },

  getAuthorizeUrl(token: string) {
    return request<AuthorizeResponse>('/openbanking/authorize', { token })
  },

  getAccounts(token: string) {
    return request<AccountsResponse>('/accounts', { token })
  },

  getBalance(token: string, fintechUseNum: string) {
    const query = new URLSearchParams({ fintechUseNum })
    return request<Balance>(`/accounts/balance?${query.toString()}`, { token })
  },
}
