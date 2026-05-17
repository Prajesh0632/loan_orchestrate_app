import { request } from "../../services/request"

export const loginUser = (data) => {
  return request("/login", {
    method: "POST",
    body: JSON.stringify(data)
  })
}

export const signupUser = (data) => {
  return request("/signup", {
    method: "POST",
    body: JSON.stringify(data),
  })
}