import api from '../client'
import type { Contact } from './types'

export async function getAdminContacts(params: { page: number; pageSize: number }) {
  const { data } = await api.get<Contact[]>('/admin/contacts', { params })
  return data
}

export async function updateAdminContactStatus(id: string, status: string) {
  await api.patch(`/admin/contacts/${id}/status`, { status })
}

export async function deleteAdminContact(id: string) {
  await api.delete(`/admin/contacts/${id}`)
}
