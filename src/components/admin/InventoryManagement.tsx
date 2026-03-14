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
        <div className="space-y-12 pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tighter">
                        Stock de <span className="text-primary italic">Alquiler</span>
                    </h2>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Gestiona los elementos adicionales para tus clientes</p>
                </div>
            </header>

            <div className="glass-card p-1 border border-white/[0.03] max-w-2xl shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="p-8 md:p-10 relative z-10">
                    <h3 className="text-white font-black text-2xl tracking-tight mb-8">
                        {editingId ? 'Editar Elemento' : 'Nuevo Item de Inventario'}
                    </h3>
    
                    {successMessage && <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-fade-in mb-8">
                        <span className="text-lg">✓</span> {successMessage}
                    </div>}
                    
                    {error && <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-full text-red-200 text-[10px] font-black uppercase tracking-widest mb-8">⚠ {error}</div>}
    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 group">
                                <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-3 ml-1">Identificación del Item</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Pelota Profesional N°5"
                                    className="w-full p-5 bg-black/20 border border-white/5 rounded-full text-white font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all placeholder:text-gray-800"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="group">
                                <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-3 ml-1">Precio Alquiler</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-black text-xl">$</span>
                                    <input
                                        type="number"
                                        placeholder="1500"
                                        className="w-full pl-12 p-5 bg-black/20 border border-white/5 rounded-full text-white font-black text-2xl outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-mono tracking-tighter"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-3 ml-1">Stock Disponible</label>
                                <input
                                    type="number"
                                    placeholder="10"
                                    className="w-full p-5 bg-black/20 border border-white/5 rounded-full text-white font-black text-2xl outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-mono tracking-tighter"
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
    
                        <div className="flex gap-4 pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 btn-primary py-6 rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-[0.98] disabled:opacity-30"
                            >
                                {isLoading ? 'Sincronizando...' : editingId ? 'Guardar Cambios' : 'Publicar Item ⚡'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="px-10 py-6 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map(item => (
                    <div key={item.id} className="glass-card group relative p-8 flex flex-col hover:shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all duration-700 border border-white/[0.03]">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-slate-800 to-black border border-white/5 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-2xl">
                                🎾
                            </div>
                            <div className="bg-primary/10 text-primary text-[9px] font-black px-4 py-2 rounded-full border border-primary/20 uppercase tracking-widest shadow-2xl">
                                DISPONIBLES: {item.stock}
                            </div>
                        </div>
                        <h4 className="text-white font-black text-2xl tracking-tight leading-none mb-2 group-hover:text-primary transition-colors">{item.name}</h4>
                        <div className="mb-10">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-white font-black text-4xl tracking-tighter opacity-90">${item.price.toLocaleString()}</span>
                                <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">/ Alquiler</span>
                            </div>
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-4 pt-8 border-t border-white/5">
                            <button 
                                onClick={() => handleEdit(item)} 
                                className="py-3 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                            >
                               ✎ EDITAR
                            </button>
                            <button 
                                onClick={() => handleDelete(item.id)} 
                                className="py-3 px-4 rounded-full bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                            >
                               🗑 BORRAR
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="text-center md:col-span-3 py-24 bg-white/[0.01] rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center px-10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 text-2xl opacity-40">📦</div>
                        <p className="text-gray-500 font-black text-sm uppercase tracking-widest">Inventario Vacío</p>
                    </div>
                )}
            </div>
        </div>
    )
}
