import { Link } from 'react-router-dom'

export type ProductCardProduct = {
  id: string
  name: string
  price: number
  imageUrl?: string
}

type Props = {
  product: ProductCardProduct
}

export function ProductCard({ product }: Props) {
  const { id, name, price, imageUrl } = product
  return (
    <Link to={`/products/${id}`} className="ns-card ns-card--interactive" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      <div className="ns-card__media">
        {imageUrl ? <img src={imageUrl} alt={name} loading="lazy" /> : <span>Ảnh</span>}
      </div>
      <div className="ns-card__body">
        <h3 className="ns-card__title">{name}</h3>
        <p className="ns-card__price">{price?.toLocaleString('vi-VN')}đ</p>
      </div>
    </Link>
  )
}
