const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

export interface RequestOptions extends RequestInit {
  headers?: HeadersInit
}

type ApiErrorResponse = {
  detail?: string
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T | undefined> {
  const token = localStorage.getItem('access_token')
  const isFormData = options.body instanceof FormData

  const headers = new Headers(options.headers)

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('access_token')
      return undefined
    }

    const errorData = data as ApiErrorResponse | null
    throw new Error(errorData?.detail || 'API Error')
  }

  return data as T
}
