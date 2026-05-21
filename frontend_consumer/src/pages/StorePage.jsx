import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import ProductCard from '../components/ui/ProductCard'
import Spinner from '../components/ui/Spinner'
import './StorePage.css'

export default function StorePage() {
  const { id } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ sort: 'newest', category: '', brand: '' })

  useEffect(() => {
    ;(async () => {
      try {
        const [s, p, cats, brds] = await Promise.all([
          api.get(`/stores/${id}`),
          api.get(`/products?store_id=${id}`),
          api.get('/categories'),
          api.get('/brands'),
        ])
        setStore(s)
        setProducts(p)
        setCategories(cats)
        setBrands(brds)
      } catch {}
      setLoading(false)
    })()
  }, [id])

  useEffect(() => {
    let list = [...products]
    if (filters.category) list = list.filter(p => String(p.category_id) === filters.category)
    if (filters.brand) list = list.filter(p => String(p.brand_id) === filters.brand)
    if (filters.sort === 'newest') list.sort((a, b) => b.id - a.id)
    if (filters.sort === 'oldest') list.sort((a, b) => a.id - b.id)
    if (filters.sort === 'price-asc') list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    if (filters.sort === 'price-desc') list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
    setFiltered(list)
  }, [products, filters])

  const sf = (k, v) => setFilters(p => ({ ...p, [k]: v }))

  if (loading) return <Spinner />
  if (!store) return <div className="store-notfound"><h2>Store not found.</h2><Link to="/">← Home</Link></div>

  return (
    <div className="store-page">
      {/* Store Header */}
      <div className="store-hero">
        <div className="store-hero-inner">
          <div className="store-logo-wrap">
            {store.store_logo
              ? <img src={store.store_logo} alt={store.store_name} className="store-logo-img" onError={e => e.target.style.display='none'}/>
              : <div className="store-logo-fallback">🏪</div>}
          </div>
          <div>
            <h1 className="store-name">{store.store_name}</h1>
            <p className="store-meta">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="store-body">
        {/* Filters */}
        <div className="store-filters">
          <select value={filters.sort} onChange={e => sf('sort', e.target.value)} className="sf-select">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
          <select value={filters.category} onChange={e => sf('category', e.target.value)} className="sf-select">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.brand} onChange={e => sf('brand', e.target.value)} className="sf-select">
            <option value="">All Brands</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {(filters.category || filters.brand || filters.sort !== 'newest') && (
            <button className="sf-clear" onClick={() => setFilters({ sort: 'newest', category: '', brand: '' })}>
              Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0
          ? <div className="empty-state"><div className="empty-icon">📦</div><h3>No products found</h3><p>Try adjusting your filters.</p></div>
          : <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p}/>)}</div>
        }
      </div>
    </div>
  )
}
