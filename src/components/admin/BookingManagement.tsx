'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type BookingItem = {
    id: string
    quantity: number
    priceAtBooking: number
    returned: boolean
    inventoryItem: {
        id: string
        name: string
    }
}

type Booking = {
    id: string
    date: string | Date
    startTime: string
    endTime: string
    clientName: string
    clientPhone: string | null
    totalPrice: number
    status: string
    field: {
        name: string
        type: string
        complex?: {
            downPaymentEnabled: boolean
            downPaymentFixed: number
        }
    }
    paymentType?: string
    calculatedPaidAmount?: number
    items?: BookingItem[]
}

export default function BookingManagement({ initialBookings }: { initialBookings: any[] }) {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings)
    const router = useRouter()

    // Tools
    const [debugDate, setDebugDate] = useState(new Date().toISOString().split('T')[0])
    const [unlocking, setUnlocking] = useState(false)

    useEffect(() => {
        console.log('Admin Bookings List:', bookings)
    }, [bookings])

    // FIX: Helper to display dates in UTC, ignoring local browser timezone
    const formatDate = (dateInput: string | Date) => {
        const date = new Date(dateInput)
        return date.toLocaleDateString('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        if (newStatus === 'DELETE') {
            if (!confirm('¿Eliminar reserva definitivamente y liberar el horario?')) return
            try {
                const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
                if (!res.ok) throw new Error('Failed to delete')
                setBookings(bookings.filter(b => b.id !== id))
                router.refresh()
                return
            } catch (err) {
                alert('Error eliminando reserva')
            }
        }

        if (!confirm(`¿Cambiar estado a ${newStatus}?`)) return
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!res.ok) throw new Error('Failed to update')

            setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b))
            router.refresh()
        } catch (err) {
            alert('Error updating booking')
        }
    }

    const handleReturnItem = async (bookingId: string, itemId: string) => {
        try {
            const res = await fetch(`/api/booking-items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ returned: true })
            })

            if (!res.ok) throw new Error('Failed to return item')

            setBookings(bookings.map(b => {
                if (b.id === bookingId && b.items) {
                    return {
                        ...b,
                        items: b.items.map(item =>
                            item.id === itemId ? { ...item, returned: true } : item
                        )
                    }
                }
                return b
            }))
            router.refresh()
        } catch (err) {
            alert('Error returning item')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
            case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        }
    }

    const handleForceUnlock = async () => {
        if (!confirm(`⚠️ ¿Estás seguro? \n\nEsto eliminará TODAS las reservas "pendientes" o "canceladas" de la fecha ${debugDate}.\n\nÚsalo solo para liberar horarios que se muestran ocupados por error.`)) return

        setUnlocking(true)
        try {
            const res = await fetch('/api/admin/force-unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: debugDate })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                alert(`✅ ${data.message}`)
                window.location.reload()
            } else {
                alert(`⚠️ ${data.message || 'Error desconocido'}`)
            }
        } catch (e) {
            console.error(e)
            alert('❌ Error de conexión.')
        } finally {
            setUnlocking(false)
        }
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <header>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Gestión de Reservas</h2>
                        <p className="text-gray-400">Descubre y gestiona las reservas de tus canchas.</p>
                    </div>
                </div>
            </header>

            <div className="glass overflow-hidden rounded-2xl border border-white/5">
                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/50 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Fecha/Hora</th>
                                <th className="px-6 py-4">Cancha</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {bookings.map(booking => (
                                <React.Fragment key={booking.id}>
                                    <tr className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium flex items-center gap-2">
                                                <span>📅</span>
                                                {formatDate(booking.date)}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1 pl-6 flex items-center gap-1">
                                                <span>⏰</span>
                                                {booking.startTime} - {booking.endTime}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-300 font-medium">{booking.field.name}</span>
                                                <span className="text-[10px] bg-slate-700 w-fit px-1.5 py-0.5 rounded text-gray-400 uppercase tracking-wide">F{booking.field.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{booking.clientName}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{booking.clientPhone || 'Sin teléfono'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-primary font-bold text-lg">
                                                ${booking.totalPrice}
                                            </div>
                                            {(booking.paymentType === 'SPLIT' || booking.paymentType === 'DEPOSIT') && booking.calculatedPaidAmount !== undefined && (
                                                <div className="mt-2 w-32 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-medium">
                                                        <span className={booking.calculatedPaidAmount >= (booking.field.complex?.downPaymentFixed || booking.totalPrice) ? 'text-emerald-400' : 'text-blue-400'}>
                                                            {Math.min(100, Math.round((booking.calculatedPaidAmount / (booking.totalPrice || 1)) * 100))}%
                                                        </span>
                                                        <span>${booking.calculatedPaidAmount}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1 relative">
                                                        {/* Seña Marker */}
                                                        {booking.field.complex?.downPaymentEnabled && booking.field.complex?.downPaymentFixed > 0 && (
                                                            <div
                                                                className="absolute h-full w-0.5 bg-yellow-500/50 z-10"
                                                                style={{ left: `${(booking.field.complex.downPaymentFixed / booking.totalPrice) * 100}%` }}
                                                                title={`Meta Seña: $${booking.field.complex.downPaymentFixed}`}
                                                            />
                                                        )}
                                                        <div
                                                            className={`h-full transition-all duration-500 ${booking.calculatedPaidAmount >= booking.totalPrice ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${Math.min(100, (booking.calculatedPaidAmount / (booking.totalPrice || 1)) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <div className="flex items-center gap-1 text-[9px] text-blue-400 font-bold uppercase tracking-wide">
                                                            <span>{booking.paymentType === 'DEPOSIT' ? '💰 Seña' : '🐄 Vaquita'}</span>
                                                            {booking.calculatedPaidAmount >= (booking.field.complex?.downPaymentFixed || booking.totalPrice) && <span className="text-emerald-500">✓</span>}
                                                        </div>
                                                        <a
                                                            href={`/pay/${booking.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-[9px] bg-slate-700 hover:bg-slate-600 border border-white/10 text-gray-300 hover:text-white px-2 py-0.5 rounded transition-all group/link"
                                                            title="Ver link de pago"
                                                        >
                                                            <span className="group-hover/link:underline decoration-white/30">Link</span>
                                                            <span className="text-[8px]">🔗</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)} uppercase tracking-wider flex items-center gap-1 w-fit`}>
                                                {booking.status === 'pending' && <span className="animate-pulse text-base">⏳</span>}
                                                {booking.status === 'pending' ? 'Esperando Pago' :
                                                    booking.status === 'confirmed' ? 'Confirmada' :
                                                        booking.status === 'cancelled' ? 'Cancelada' : booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {booking.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                        className="text-green-400 hover:text-green-300 font-medium text-xs border border-green-500/30 hover:bg-green-500/10 px-3 py-1.5 rounded-lg transition-all"
                                                    >
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(booking.id, 'DELETE')}
                                                        className="text-red-400 hover:text-red-300 font-medium text-xs border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all"
                                                    >
                                                        Liberar
                                                    </button>
                                                </>
                                            )}
                                            {booking.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                                    className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                            {booking.status === 'cancelled' && (
                                                <span className="text-gray-600 text-xs italic">
                                                    Anulado
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    {booking.items && booking.items.length > 0 && (
                                        <tr className="bg-slate-900/30">
                                            <td colSpan={6} className="px-6 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-xs text-gray-500 mr-2 flex items-center">🛍️ Adicionales:</span>
                                                    {booking.items.map((item: BookingItem) => (
                                                        <span
                                                            key={item.id}
                                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${item.returned
                                                                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                                }`}
                                                        >
                                                            {item.inventoryItem.name} (x{item.quantity})
                                                            {!item.returned && (
                                                                <button
                                                                    onClick={() => handleReturnItem(booking.id, item.id)}
                                                                    className="ml-1 text-[10px] bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded transition-colors"
                                                                >
                                                                    Devolver
                                                                </button>
                                                            )}
                                                            {item.returned && <span className="text-[10px] opacity-50">✓</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-4xl opacity-50">📭</span>
                                            <p>No hay reservas registradas.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className="md:hidden flex flex-col gap-4 p-4">
                    {bookings.map(booking => (
                        <div key={booking.id} className="bg-slate-800/50 rounded-xl border border-white/5 p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-white font-bold text-lg flex items-center gap-2">
                                        {formatDate(booking.date)}
                                    </div>
                                    <div className="text-sm text-gray-400 font-medium">
                                        {booking.startTime} - {booking.endTime}
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(booking.status)} uppercase tracking-wider`}>
                                    {booking.status}
                                </span>
                            </div>

                            <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm border border-white/5">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Cancha</span>
                                    <span className="text-white">{booking.field.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Cliente</span>
                                    <span className="text-white font-medium">{booking.clientName}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                                    <span className="text-gray-500 font-bold">Total</span>
                                    <span className="text-primary font-bold text-lg">${booking.totalPrice}</span>
                                </div>
                            </div>

                            {/* Mobile Actions */}
                            {booking.status === 'pending' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                        className="bg-green-500/10 text-green-400 border border-green-500/30 py-2 rounded-lg font-bold text-xs"
                                    >
                                        Aprobar
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(booking.id, 'DELETE')}
                                        className="bg-red-500/10 text-red-400 border border-red-500/30 py-2 rounded-lg font-bold text-xs"
                                    >
                                        Liberar
                                    </button>
                                </div>
                            )}
                            {booking.status === 'confirmed' && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                        className="text-red-400 text-xs font-medium border-b border-red-400/30 pb-0.5"
                                    >
                                        Cancelar Reserva
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {bookings.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            No hay reservas para mostrar.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 opacity-70 hover:opacity-100 transition-opacity">
                <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                    🛠️ Herramientas de Mantenimiento
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Zona de Peligro</span>
                </h3>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-center gap-4 w-fit">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Fecha a Limpiar</label>
                        <input
                            type="date"
                            value={debugDate}
                            onChange={e => setDebugDate(e.target.value)}
                            className="bg-slate-800 border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:border-red-500/50 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleForceUnlock}
                        disabled={unlocking}
                        className="mt-4 sm:mt-0 bg-red-900/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-900/40 hover:text-red-300 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {unlocking ? (
                            <span className="animate-pulse">Limpiando...</span>
                        ) : (
                            <>
                                <span>🗑️</span>
                                Liberar Horarios Trabados
                            </>
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 max-w-md">
                    Si ves canchas &quot;Ocupadas&quot; en el sitio web pero no hay reservas aquí, selecciona la fecha y usa este botón para eliminar cualquier reserva pendiente oculta.
                </p>
            </div>
        </div>
    )
}
