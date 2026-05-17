const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/"

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem("access_token")

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  })

  let data = null
  try {
    data = await response.json()
  } catch (e) {
    data = null
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access_token")
      return
    }

    throw new Error((data && data.detail) || "API Error")
  }

  return data
}