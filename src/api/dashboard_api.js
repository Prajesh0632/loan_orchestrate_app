import { request } from "../../services/request"

export const getDashboard = () => {
  return request("/dashboard")
}