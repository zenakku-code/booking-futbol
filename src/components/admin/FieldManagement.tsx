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

export default function FieldManagement({ initialFields, subscriptionActive }: { initialFields: Field[], subscriptionActive: boolean }) {
    const [fields, setFields] = useState<Field[]>(initialFields)
    const [successMessage, setSuccessMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
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
        setShowForm(true)
        setFormData({
            name: field.name,
            type: field.type,
            price: field.price.toString(),
            imageUrl: field.imageUrl || '',
            availableDays: field.availableDays ? field.availableDays.split(',') : DAYS_OF_WEEK,
            openTime: field.openTime || '09:00',
            closeTime: field.closeTime || '23:00'
        })
        // Scroll to form if needed, or simple show
    }

    const cancelEdit = () => {
        setEditingId(null)
        setShowForm(false)
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

            setTimeout(() => setSuccessMessage(''), 3000)

            // Cerrar formulario y resetear
            cancelEdit()
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
        <div className="space-y-12 pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tighter">
                        Mis <span className="text-primary italic">Canchas</span>
                    </h2>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Configuración técnica y comercial de tus campos de juego</p>
                </div>
            </header>

            <div className="relative">
                {!subscriptionActive && (
                    <div className="absolute inset-0 z-[60] backdrop-blur-xl bg-black/60 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 relative group">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20"></div>
                            <span className="text-5xl group-hover:scale-110 transition-transform">🔒</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Módulo Bloqueado</h3>
                        <p className="text-gray-400 font-bold text-sm max-w-md mb-10 leading-relaxed uppercase tracking-widest">
                            Para empezar a gestionar tu complejo y recibir reservas reales, activa tu membresía profesional.
                        </p>
                        <button
                            onClick={() => router.push('/admin/subscription')}
                            className="btn-primary px-12 py-5 text-sm font-black uppercase tracking-[0.25em] shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:scale-105 transition-all rounded-full"
                        >
                            Activar Membresía Pro ⚡
                        </button>
                    </div>
                )}

                {/* Header Actions */}
                <div className="flex justify-between items-center mb-10">
                    {!showForm && !editingId && fields.length > 0 ? (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary px-10 py-5 text-xs font-black uppercase tracking-[0.25em] flex items-center gap-3 shadow-2xl shadow-primary/10 active:scale-95 transition-all rounded-full"
                        >
                            <span className="text-xl leading-none font-light">+</span> Nueva Cancha
                        </button>
                    ) : (showForm || editingId) ? (
                        <div className="flex items-center gap-6 w-full justify-between">
                            <div>
                                <h3 className="text-white font-black text-2xl tracking-tight">
                                    {editingId ? 'Editando Parámetros' : 'Nueva Configuración'}
                                </h3>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Define los detalles de tu campo</p>
                            </div>
                            <button 
                                onClick={cancelEdit} 
                                className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-3 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                            >
                                {editingId ? 'Cancelar ✕' : 'Cerrar ✕'}
                            </button>
                        </div>
                    ) : null}
                </div>

                {/* Form Card (Collapsible) */}
                {(showForm || editingId) && (
                    <div className="glass-card p-1 border border-white/[0.03] mb-12 animate-fade-in shadow-2xl">
                        <div className="p-8 space-y-8">
                            {successMessage && (
                                <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-fade-in">
                                    <span className="text-lg">✓</span> {successMessage}
                                </div>
                            )}

                            {error && <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-full text-red-200 text-[10px] font-black uppercase tracking-widest leading-relaxed">⚠ Error: {error}</div>}

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className="group">
                                        <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-3 ml-1">Identidad de la Cancha</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Estadio principal LED"
                                            className="w-full p-5 bg-black/20 border border-white/5 rounded-full text-white font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all placeholder:text-gray-800"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-3 ml-1">Modalidad</label>
                                            <select
                                                className="w-full p-5 bg-black/20 border border-white/5 rounded-full text-white font-bold focus:border-primary/50 outline-none appearance-none cursor-pointer"
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="5">Fútbol 5 (Clásico)</option>
                                                <option value="7">Fútbol 7 (Intermedio)</option>
                                                <option value="11">Fútbol 11 (Profesional)</option>
                                            </select>
                                        </div>
                                        <div className="group">
                                            <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-3 ml-1">Valor / Hora</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-black text-xl">$</span>
                                                <input
                                                    type="number"
                                                    placeholder="25000"
                                                    className="w-full pl-12 p-5 bg-black/20 border border-white/5 rounded-full text-white font-black text-2xl outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-mono tracking-tighter"
                                                    value={formData.price}
                                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-3 ml-1">Link Visual (Avatar de Cancha)</label>
                                        <input
                                            type="text"
                                            placeholder="https://..."
                                            className="w-full p-5 bg-black/20 border border-white/5 rounded-full text-white font-bold focus:border-primary/50 outline-none transition-all placeholder:text-gray-800 text-sm"
                                            value={formData.imageUrl}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-4 ml-1">Cronograma de Disponibilidad</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {DAYS_OF_WEEK.map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(day)}
                                                    className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${formData.availableDays.includes(day)
                                                        ? 'bg-primary border-primary shadow-[0_0_15px_rgba(16,185,129,0.3)] text-slate-950 translate-y-[-2px]'
                                                        : 'bg-white/[0.02] text-gray-600 border-white/5 hover:border-white/20'
                                                        }`}
                                                >
                                                    {day.slice(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 bg-white/[0.02] p-8 rounded-full border border-white/5">
                                        <div className="group">
                                            <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-3 ml-1">Hora Apertura</label>
                                            <input
                                                type="time"
                                                className="w-full p-4 bg-black/30 border border-white/5 rounded-full text-white font-black text-xl outline-none focus:border-primary/50 transition-all font-mono"
                                                value={formData.openTime}
                                                onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-3 ml-1">Hora Cierre</label>
                                            <input
                                                type="time"
                                                className="w-full p-4 bg-black/30 border border-white/5 rounded-full text-white font-black text-xl outline-none focus:border-primary/50 transition-all font-mono"
                                                value={formData.closeTime}
                                                onChange={e => setFormData({ ...formData, closeTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2 pt-2">
                                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
                                                Los clientes solo podrán reservar turnos dentro de esta franja horaria.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 pt-10 border-t border-white/5">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full py-6 rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-[0.98] ${editingId
                                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-indigo-500/20'
                                            : 'btn-primary text-slate-950 shadow-primary/20'
                                            } disabled:opacity-30 disabled:scale-100`}
                                    >
                                        {isLoading ? 'Sincronizando...' : editingId ? 'Guardar Modificaciones' : 'Publicar Nueva Cancha ⚡'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {fields.map(field => (
                        <div key={field.id} className="glass-card group relative overflow-hidden flex flex-col h-full hover:shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all duration-700 border border-white/[0.03]">
                            <div className="h-56 bg-black relative overflow-hidden">
                                {field.imageUrl ? (
                                    <img src={field.imageUrl} alt={field.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
                                        <span className="text-5xl transform group-hover:scale-125 transition-transform duration-500 opacity-50">⚽</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                                <div className="absolute top-6 right-6">
                                    <span className="bg-white/10 backdrop-blur-xl text-white text-[10px] font-black px-4 py-2 rounded-full border border-white/10 uppercase tracking-widest shadow-2xl">
                                        Fútbol {field.type}
                                    </span>
                                </div>
                                <div className="absolute bottom-6 left-8 right-8">
                                    <h4 className="text-white font-black text-2xl tracking-tight leading-none mb-1 group-hover:text-primary transition-colors">{field.name}</h4>
                                    <div className="flex items-center gap-2">
                                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Activo para reservas</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 flex-1 flex flex-col pt-4">
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-primary font-black text-4xl tracking-tighter">${field.price.toLocaleString()}</span>
                                        <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">/ Turno</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-10 bg-white/[0.01] p-5 rounded-full border border-white/[0.03]">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-500">
                                        <span>Horario</span>
                                        <span className="text-gray-300">{field.openTime} - {field.closeTime} hs</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-500">
                                        <span>Días</span>
                                        <span className="text-gray-300">{field.availableDays?.split(',').length === 7 ? 'Toda la semana' : 'Días seleccionados'}</span>
                                    </div>
                                </div>

                                <div className="mt-auto grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleEdit(field)}
                                        className="py-3 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <span>✎</span> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(field.id)}
                                        className="py-3 px-4 rounded-full bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <span>🗑</span> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!showForm && fields.length === 0 && (
                        <div className="text-center md:col-span-3 py-32 bg-white/[0.01] rounded-full border-2 border-dashed border-white/5 flex flex-col items-center justify-center px-10">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-3xl">🏟️</div>
                            <p className="text-gray-400 font-black text-xl tracking-tight mb-2">No hay canchas registradas</p>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-8">Comienza configurando tu primer campo de juego para recibir reservas.</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="btn-primary px-10 py-5 text-xs font-black uppercase tracking-[0.25em] shadow-xl rounded-full"
                            >
                                Configurar Primera Cancha ⚡
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
