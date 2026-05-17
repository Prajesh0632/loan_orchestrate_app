import { request } from "../../services/request"

interface LoginCredentials {
  username: string
  password: string
}

interface SignupCredentials {
  username: string
  password: string
}

interface AuthResponse {
  status: boolean
  message: string
  access_token: string
}

export const loginUser = (data: LoginCredentials): Promise<AuthResponse> => {
  return request("/login", {
    method: "POST",
    body: JSON.stringify(data)
  })
}

export const signupUser = (data: SignupCredentials): Promise<AuthResponse> => {
  return request("/signup", {
    method: "POST",
    body: JSON.stringify(data),
  })
}
