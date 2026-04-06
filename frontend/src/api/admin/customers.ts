import api from '../client'
import type { Customer } from './types'

export async function getAdminCustomers(params: { page: number; pageSize: number }) {
  const { data } = await api.get<Customer[]>('/admin/users', { params })
  return data
}

export async function updateAdminCustomer(id: string, payload: { firstName?: string; lastName?: string; phone?: string }) {
  await api.put(`/admin/users/${id}`, payload)
}

export async function deleteAdminCustomer(id: string) {
  await api.delete(`/admin/users/${id}`)
}
