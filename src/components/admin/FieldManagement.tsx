'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Field = {
    id: string
    name: string
    type: string
    price: number
    imageUrl?: string | null
    availableDays?: string
    openTime?: string
    closeTime?: string
}

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

export default function FieldManagement({ initialFields }: { initialFields: Field[] }) {
    const [fields, setFields] = useState<Field[]>(initialFields)
    const [successMessage, setSuccessMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const router = useRouter()

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: '5',
        price: '',
        imageUrl: '',
        availableDays: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        openTime: '09:00',
        closeTime: '23:00'
    })

    const handleEdit = (field: Field) => {
        setSuccessMessage('')
        setEditingId(field.id)
        setFormData({
            name: field.name,
            type: field.type,
            price: field.price.toString(),
            imageUrl: field.imageUrl || '',
            availableDays: field.availableDays ? field.availableDays.split(',') : DAYS_OF_WEEK,
            openTime: field.openTime || '09:00',
            closeTime: field.closeTime || '23:00'
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setFormData({
            name: '',
            type: '5',
            price: '',
            imageUrl: '',
            availableDays: DAYS_OF_WEEK,
            openTime: '09:00',
            closeTime: '23:00'
        })
    }

    const toggleDay = (day: string) => {
        if (formData.availableDays.includes(day)) {
            setFormData({ ...formData, availableDays: formData.availableDays.filter(d => d !== day) })
        } else {
            setFormData({ ...formData, availableDays: [...formData.availableDays, day] })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccessMessage('')

        const payload = {
            ...formData,
            availableDays: formData.availableDays.join(',')
        }

        try {
            const url = editingId ? `/api/fields/${editingId}` : '/api/fields'
            const method = editingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.details || errorData.error || 'Error saving field')
            }

            const savedField = await res.json()

            if (editingId) {
                setFields(fields.map(f => f.id === editingId ? savedField : f))
                setSuccessMessage('¡Cancha actualizada correctamente!')
            } else {
                setFields([...fields, savedField])
                setSuccessMessage('¡Cancha creada correctamente!')
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000)

            cancelEdit() // Reset form
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save field')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta cancha?')) return

        try {
            const res = await fetch(`/api/fields/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            setFields(fields.filter(f => f.id !== id))
            router.refresh()
        } catch (err) {
            alert('Error deleting field')
        }
    }

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Gestión de Canchas</h2>
                <p className="text-gray-400">Agrega, edita o elimina las canchas disponibles.</p>
            </header>

            {/* Form Card */}
            <div className="glass-card p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {editingId ? <span className="text-accent">✎ Editando Cancha</span> : <span className="text-primary">+ Nueva Cancha</span>}
                    </h3>
                    {editingId && (
                        <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-white underline">
                            Cancelar Edición
                        </button>
                    )}
                </div>

                {successMessage && (
                    <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-200 mb-6 flex items-center gap-2 animate-fade-in">
                        <span>✓</span> {successMessage}
                    </div>
                )}

                {error && <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                            <input
                                type="text"
                                placeholder="Ej: Cancha Principal"
                                className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                                <select
                                    className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="5">Fútbol 5</option>
                                    <option value="7">Fútbol 7</option>
                                    <option value="11">Fútbol 11</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Precio / Hora</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        placeholder="1500"
                                        className="w-full pl-8 p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">URL Imagen</label>
                            <input
                                type="text"
                                placeholder="https://..."
                                className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none"
                                value={formData.imageUrl}
                                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Días Disponibles</label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS_OF_WEEK.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.availableDays.includes(day)
                                            ? 'bg-primary text-slate-900 border-primary'
                                            : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Apertura</label>
                                <input
                                    type="time"
                                    className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.openTime}
                                    onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Cierre</label>
                                <input
                                    type="time"
                                    className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.closeTime}
                                    onChange={e => setFormData({ ...formData, closeTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 ${editingId
                                ? 'bg-gradient-to-r from-accent to-blue-600 text-white shadow-accent/20'
                                : 'bg-gradient-to-r from-primary to-green-600 text-slate-900 shadow-primary/20'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isLoading ? 'Guardando...' : editingId ? 'Actualizar Cancha' : 'Crear Nueva Cancha'}
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fields.map(field => (
                    <div key={field.id} className="glass-card group relative overflow-hidden flex flex-col h-full hover:shadow-2xl transition-all duration-300">
                        <div className="h-48 bg-slate-800 relative">
                            {field.imageUrl ? (
                                <img src={field.imageUrl} alt={field.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                    <span className="text-4xl">⚽</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4">
                                <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                                    F{field.type}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <h4 className="text-xl font-bold text-white mb-1">{field.name}</h4>
                            <p className="text-primary font-bold text-2xl mb-4">${field.price}</p>

                            <div className="border-t border-white/5 pt-4 mt-auto grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleEdit(field)}
                                    className="py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>✎</span> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(field.id)}
                                    className="py-2 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>🗑</span> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {fields.length === 0 && (
                    <div className="text-center md:col-span-3 text-gray-500 py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-xl mb-2">No hay canchas registradas</p>
                        <p className="text-sm">Utiliza el formulario de arriba para crear la primera.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
