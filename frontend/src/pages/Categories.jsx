import { useState, useEffect } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Btn, Card, CardHeader, Table, Spinner, Empty, Input } from '../components/ui'
import { ConfirmModal } from '../components/modals/Modal'
import './pages.css'

function TagManager({ endpoint, noun }) {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [edit, setEdit]     = useState(null)   // { id, name }
  const [editName, setEditName] = useState('')
  const [confirm, setConfirm] = useState(null)

  const load = async () => {
    try { setItems(await api.get(`/${endpoint}`)) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!newName.trim()) return
    try { await api.post(`/${endpoint}`, { name: newName }); setNewName(''); toast.success(`${noun} added`); load() }
    catch (e) { toast.error(e.message) }
  }

  const upd = async () => {
    if (!editName.trim()) return
    try { await api.put(`/${endpoint}/${edit.id}`, { name: editName }); setEdit(null); toast.success(`${noun} updated`); load() }
    catch (e) { toast.error(e.message) }
  }

  const del = async () => {
    try { await api.delete(`/${endpoint}/${confirm.id}`); toast.success(`${noun} deleted`); load() }
    catch (e) { toast.error(e.message) }
    setConfirm(null)
  }

  if (loading) return <Spinner />

  return (
    <div style={{ maxWidth: 580 }}>
      <Card style={{ marginBottom: 18 }}>
        <CardHeader>Add {noun}</CardHeader>
        <div className="tag-add-row">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={`${noun} name…`}
            style={{ flex: 1 }}
          />
          <Btn variant="accent" onClick={add}>Add</Btn>
        </div>
      </Card>

      <Card>
        <CardHeader>{noun}s ({items.length})</CardHeader>
        {items.length === 0
          ? <Empty icon="🏷️" title={`No ${noun.toLowerCase()}s yet`} />
          : (
            <Table>
              <thead><tr><th>#</th><th>Name</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="td-mono">#{item.id}</td>
                    <td>
                      {edit?.id === item.id
                        ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && upd()}
                            style={{ width: 200 }}
                            autoFocus
                          />
                        )
                        : item.name
                      }
                    </td>
                    <td>
                      <div className="row-actions">
                        {edit?.id === item.id ? (
                          <>
                            <Btn variant="accent" size="sm" onClick={upd}>Save</Btn>
                            <Btn variant="ghost" size="sm" onClick={() => setEdit(null)}>Cancel</Btn>
                          </>
                        ) : (
                          <>
                            <Btn variant="ghost" size="sm" onClick={() => { setEdit(item); setEditName(item.name) }}>✏️</Btn>
                            <Btn variant="danger" size="sm" onClick={() => setConfirm(item)}>🗑</Btn>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )
        }
      </Card>

      {confirm && (
        <ConfirmModal
          title={`Delete ${noun}`}
          message={`Are you sure you want to delete`}
          name={confirm.name}
          onClose={() => setConfirm(null)}
          onConfirm={del}
        />
      )}
    </div>
  )
}

export function Categories() {
  return <TagManager endpoint="categories" noun="Category" />
}

export function Brands() {
  return <TagManager endpoint="brands" noun="Brand" />
}

export default Categories
