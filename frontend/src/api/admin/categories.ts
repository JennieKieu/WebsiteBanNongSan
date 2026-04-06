import api from '../client'
import type { Category } from './types'

export async function getAdminCategories(params?: { search?: string; isActive?: boolean }) {
  const { data } = await api.get<Category[]>('/admin/categories', { params })
  return data
}

export async function createAdminCategory(payload: Partial<Category>) {
  const { data } = await api.post<Category>('/admin/categories', payload)
  return data
}

export async function updateAdminCategory(id: string, payload: Partial<Category>) {
  await api.put(`/admin/categories/${id}`, payload)
}

export async function deleteAdminCategory(id: string) {
  await api.delete(`/admin/categories/${id}`)
}
