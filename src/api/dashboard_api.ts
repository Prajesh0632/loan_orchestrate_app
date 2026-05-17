import { request } from "../../services/request"

export interface DashboardData {
  username?: string
  [key: string]: unknown
}

export const getDashboard = (): Promise<DashboardData | undefined> => {
  return request("/dashboard")
}
