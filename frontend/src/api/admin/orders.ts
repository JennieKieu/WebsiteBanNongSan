import api from '../client'
import type { Order } from './types'

export async function getAdminOrders(params: { page: number; pageSize: number }) {
  const { data } = await api.get<Order[]>('/admin/orders', { params })
  return data
}

export async function updateAdminOrderStatus(id: string, status: string) {
  await api.patch(`/admin/orders/${id}/status`, { status })
}
