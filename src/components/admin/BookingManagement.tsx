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
    }
    paymentType?: string
    calculatedPaidAmount?: number
    items?: BookingItem[]
}

export default function BookingManagement({ initialBookings }: { initialBookings: any[] }) {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings)
    const router = useRouter()

    useEffect(() => {
        // Debug para ver si llegan pending bookings
        console.log('Admin Bookings List:', bookings)
    }, [bookings])

    const handleStatusChange = async (id: string, newStatus: string) => {
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

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Gestión de Reservas</h2>
                        <p className="text-gray-400">Descubre y gestiona las reservas de tus canchas.</p>
                    </div>
                </div>
            </header>

            <div className="glass overflow-hidden rounded-2xl border border-white/5">
                <div className="overflow-x-auto">
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
                                                {new Date(booking.date).toLocaleDateString()}
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
                                            {booking.paymentType === 'SPLIT' && booking.calculatedPaidAmount !== undefined && (
                                                <div className="mt-2 w-32 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-medium">
                                                        <span className={booking.calculatedPaidAmount >= booking.totalPrice ? 'text-emerald-400' : 'text-blue-400'}>
                                                            {Math.min(100, Math.round((booking.calculatedPaidAmount / (booking.totalPrice || 1)) * 100))}%
                                                        </span>
                                                        <span>${booking.calculatedPaidAmount}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${booking.calculatedPaidAmount >= booking.totalPrice ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${Math.min(100, (booking.calculatedPaidAmount / (booking.totalPrice || 1)) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <div className="flex items-center gap-1 text-[9px] text-blue-400 font-bold uppercase tracking-wide">
                                                            <span>🐄 Vaquita</span>
                                                            {booking.calculatedPaidAmount >= booking.totalPrice && <span className="text-emerald-500">✓</span>}
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
                                            {booking.status === 'pending' && (
                                                <div className="text-[10px] text-orange-400/70 mt-1 max-w-[120px] leading-tight">
                                                    Bloqueando horario. Cancelar si no paga.
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {booking.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                        className="text-green-400 hover:text-green-300 font-medium text-xs border border-green-500/30 hover:bg-green-500/10 px-3 py-1.5 rounded-lg transition-all"
                                                    >
                                                        Aprobar Manual
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                                        className="text-red-400 hover:text-red-300 font-medium text-xs border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all"
                                                    >
                                                        Liberar Cancha
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
            </div>
        </div>
    )
}
