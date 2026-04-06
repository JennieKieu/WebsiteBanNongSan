import api from '../client'
import type { Banner } from './types'

export async function getAdminBanners() {
  const { data } = await api.get<Banner[]>('/admin/banners')
  return data
}

export async function createAdminBanner(payload: Partial<Banner>) {
  const { data } = await api.post<Banner>('/admin/banners', payload)
  return data
}

export async function updateAdminBanner(id: string, payload: Partial<Banner>) {
  await api.put(`/admin/banners/${id}`, payload)
}

export async function deleteAdminBanner(id: string) {
  await api.delete(`/admin/banners/${id}`)
}
