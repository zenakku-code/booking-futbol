'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type InventoryItem = {
    id: string
    name: string
    price: number
    stock: number
}

export default function InventoryManagement({ initialItems }: { initialItems: InventoryItem[] }) {
    const [items, setItems] = useState<InventoryItem[]>(initialItems)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '0',
    })

    const handleEdit = (item: InventoryItem) => {
        setEditingId(item.id)
        setFormData({
            name: item.name,
            price: item.price.toString(),
            stock: item.stock.toString(),
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setFormData({ name: '', price: '', stock: '0' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccessMessage('')

        try {
            const url = editingId ? `/api/inventory/${editingId}` : '/api/inventory'
            const method = editingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Error al guardar')

            const savedItem = await res.json()

            if (editingId) {
                setItems(items.map(i => i.id === editingId ? savedItem : i))
                setSuccessMessage('Item actualizado')
            } else {
                setItems([...items, savedItem])
                setSuccessMessage('Item creado')
            }

            setTimeout(() => setSuccessMessage(''), 3000)
            cancelEdit()
            router.refresh()
        } catch (err) {
            setError('Error al conectar con el servidor')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Deseas eliminar este item?')) return
        try {
            const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setItems(items.filter(i => i.id !== id))
                router.refresh()
            }
        } catch (err) {
            alert('Error al eliminar')
        }
    }

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Inventario de Alquiler</h2>
                <p className="text-gray-400">Gestiona los elementos que los clientes pueden alquilar junto con su cancha (ej: Pelotas, Pecheras).</p>
            </header>

            <div className="glass-card p-6 md:p-8 max-w-2xl">
                <h3 className="text-xl font-bold text-white mb-6">
                    {editingId ? 'Editar Item' : 'Agregar Nuevo Item'}
                </h3>

                {successMessage && <div className="p-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl mb-6 text-sm">✓ {successMessage}</div>}
                {error && <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl mb-6 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre del Item</label>
                            <input
                                type="text"
                                placeholder="Ej: Pelota Profesional"
                                className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/50"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Precio Alquiler</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-500">$</span>
                                <input
                                    type="number"
                                    placeholder="500"
                                    className="w-full pl-8 p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/50"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Stock Disponible</label>
                            <input
                                type="number"
                                placeholder="10"
                                className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/50"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 btn btn-primary py-3 rounded-xl font-bold shadow-lg shadow-primary/20"
                        >
                            {isLoading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Item'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-6 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => (
                    <div key={item.id} className="glass-card p-6 flex flex-col group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                🎾
                            </div>
                            <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-full uppercase">
                                Stock: {item.stock}
                            </div>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">{item.name}</h4>
                        <p className="text-2xl font-black text-white/90 mb-6">${item.price}</p>

                        <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                            <button onClick={() => handleEdit(item)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all">
                                EDITAR
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all">
                                BORRAR
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
