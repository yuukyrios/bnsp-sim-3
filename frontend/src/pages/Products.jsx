import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  Btn, Card, Table, Badge, Spinner, Empty,
  Field, Input, Textarea, Select, PageHeader, SearchInput
} from '../components/ui'
import { Modal, ConfirmModal, FormRow, UploadZone } from '../components/modals/Modal'
import './pages.css'

function ProductModal({ product, stores, categories, brands, onClose, onSaved }) {
  const [form, setForm] = useState({
    store_id:    product?.store_id    ?? (stores[0]?.id ?? ''),
    category_id: product?.category_id ?? '',
    brand_id:    product?.brand_id    ?? '',
    name:        product?.name        ?? '',
    description: product?.description ?? '',
    price:       product?.price       ?? '',
    quantity:    product?.quantity    ?? '',
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(product?.image || null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    if (!form.name.trim() || !form.price || form.quantity === '' || !form.store_id) {
      toast.error('Please fill all required fields'); return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      if (file) fd.append('image', file)
      if (product) {
        await api.put(`/products/${product.id}`, fd)
      } else {
        await api.post('/products', fd)
      }
      toast.success(product ? 'Product updated!' : 'Product created!')
      onSaved()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={product ? 'Edit Product' : 'New Product'}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="accent" onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save Product'}</Btn>
        </>
      }
    >
      <Field label="Store" required>
        <Select value={form.store_id} onChange={f('store_id')}>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.store_name}</option>)}
        </Select>
      </Field>

      <Field label="Product Name" required>
        <Input value={form.name} onChange={f('name')} placeholder="e.g. Wireless Headphones" />
      </Field>

      <FormRow>
        <Field label="Price (USD)" required>
          <Input type="number" value={form.price} onChange={f('price')} placeholder="0.00" min="0" step="0.01" />
        </Field>
        <Field label="Stock Quantity" required>
          <Input type="number" value={form.quantity} onChange={f('quantity')} placeholder="0" min="0" />
        </Field>
      </FormRow>

      <FormRow>
        <Field label="Category">
          <Select value={form.category_id} onChange={f('category_id')}>
            <option value="">— None —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Brand / Series">
          <Select value={form.brand_id} onChange={f('brand_id')}>
            <option value="">— None —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </Field>
      </FormRow>

      <Field label="Description">
        <Textarea value={form.description} onChange={f('description')} placeholder="Describe the product…" />
      </Field>

      <Field label="Product Image">
        <UploadZone preview={preview} onClick={() => fileRef.current.click()} label="Click to upload product image" hint="PNG, JPG, WEBP — max 5MB" />
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f2 = e.target.files[0]; if (f2) { setFile(f2); setPreview(URL.createObjectURL(f2)) } }} />
      </Field>
    </Modal>
  )
}

function stockBadge(qty) {
  if (qty === 0) return <Badge color="red">Out of stock</Badge>
  if (qty < 10)  return <Badge color="orange">{qty}</Badge>
  return <Badge color="green">{qty}</Badge>
}

export default function Products() {
  const [products, setProducts]   = useState([])
  const [stores, setStores]       = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [confirm, setConfirm]     = useState(null)
  const [search, setSearch]       = useState('')

  const load = async () => {
    try {
      const [storeList, cats, brds] = await Promise.all([
        api.get('/stores'), api.get('/categories'), api.get('/brands'),
      ])
      setStores(storeList); setCategories(cats); setBrands(brds)
      let all = []
      for (const s of storeList) {
        const p = await api.get(`/products?store_id=${s.id}`)
        all = [...all, ...p]
      }
      setProducts(all)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const del = async () => {
    try { await api.delete(`/products/${confirm.id}`); toast.success('Product deleted'); load() }
    catch (e) { toast.error(e.message) }
    setConfirm(null)
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" />
        <Btn variant="accent" onClick={() => setModal('new')} disabled={stores.length === 0}>
          ＋ New Product
        </Btn>
      </PageHeader>

      {stores.length === 0 && (
        <div style={{ background: 'rgba(255,183,77,0.1)', border: '1px solid rgba(255,183,77,0.25)', color: 'var(--warning)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 16 }}>
          ⚠️ You need to create a store before adding products.
        </div>
      )}

      <Card>
        {filtered.length === 0
          ? <Empty icon="📦" title="No products" desc={search ? 'No results match your search' : 'Add your first product to start selling'} />
          : (
            <Table>
              <thead>
                <tr>
                  <th>Image</th><th>Name</th><th>Store</th>
                  <th>Price</th><th>Stock</th><th>Category</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="img-thumb">
                        {p.image
                          ? <img src={p.image} alt={p.name} onError={(e) => e.target.style.display='none'} />
                          : '📦'}
                      </div>
                    </td>
                    <td className="td-bold">{p.name}</td>
                    <td className="td-muted">{p.store_name}</td>
                    <td className="td-bold">${parseFloat(p.price).toFixed(2)}</td>
                    <td>{stockBadge(p.quantity)}</td>
                    <td className="td-muted">{p.category_name || '—'}</td>
                    <td>
                      <div className="row-actions">
                        <Btn variant="ghost" size="sm" onClick={() => setModal(p)}>✏️</Btn>
                        <Btn variant="danger" size="sm" onClick={() => setConfirm(p)}>🗑</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )
        }
      </Card>

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          stores={stores} categories={categories} brands={brands}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
      {confirm && (
        <ConfirmModal
          title="Delete Product"
          message="Are you sure you want to delete"
          name={confirm.name}
          onClose={() => setConfirm(null)}
          onConfirm={del}
        />
      )}
    </div>
  )
}
