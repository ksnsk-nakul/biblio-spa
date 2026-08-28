import { apiClient } from './client'
import type { DashboardData } from '../types'

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<DashboardData>('/api/dashboard')
  return data
}
