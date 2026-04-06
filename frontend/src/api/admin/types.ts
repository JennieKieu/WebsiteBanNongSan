export type Product = {
  id: string
  name: string
  slug: string
  description?: string
  useTags?: string[]
  price: number
  stock: number
  imageUrl?: string
  imageUrls?: string[]
  imagePublicIds?: string[]
  categoryId: string
  categoryName?: string
  isFeatured: boolean
  isActive: boolean
}

export type Category = {
  id: string
  name: string
  slug: string
  icon?: string
  order: number
  isActive: boolean
}

export type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  createdAt: string
}

export type Order = {
  id: string
  userName?: string
  userEmail?: string
  userPhone?: string
  shippingAddress?: string
  status: string
  totalAmount: number
  createdAt: string
}

export type Banner = {
  id: string
  imageUrl: string
  productId?: string
  linkUrl?: string
  title?: string
  order: number
  isActive: boolean
}

export type Contact = {
  id: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  status: string
  createdAt: string
}
