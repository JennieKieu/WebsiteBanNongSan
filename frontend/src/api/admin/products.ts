import api from '../client'
import type { Product } from './types'

type ProductListParams = {
  page?: number
  pageSize?: number
  search?: string
  categoryId?: string
  isActive?: boolean
}

export async function getAdminProducts(params: ProductListParams) {
  const { data } = await api.get<{ items: Product[]; total: number }>('/admin/products', { params })
  return data
}

export async function getAdminProductById(id: string) {
  const { data } = await api.get<Product>(`/admin/products/${id}`)
  return data
}

export async function createAdminProduct(payload: Partial<Product>) {
  const { data } = await api.post<Product>('/admin/products', payload)
  return data
}

export async function updateAdminProduct(id: string, payload: Partial<Product>) {
  await api.put(`/admin/products/${id}`, payload)
}

export async function deleteAdminProduct(id: string) {
  await api.delete(`/admin/products/${id}`)
}

export async function uploadAdminProductImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const token = localStorage.getItem('token')
  const res = await fetch('/api/admin/products/upload-image', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Upload ảnh thất bại.')
  }
  return data as { url: string; publicId: string }
}
