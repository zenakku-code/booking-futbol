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
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
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

            <div className="glass overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-3xl">
                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.03] text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                            <tr>
                                <th className="px-8 py-5">Fecha/Hora</th>
                                <th className="px-8 py-5">Cancha</th>
                                <th className="px-8 py-5">Cliente</th>
                                <th className="px-8 py-5">Total</th>
                                <th className="px-8 py-5">Estado</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {bookings.map(booking => (
                                <React.Fragment key={booking.id}>
                                    <tr className="hover:bg-white/[0.03] transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="text-white font-black flex items-center gap-3">
                                                <span className="opacity-50 grayscale group-hover:grayscale-0 transition-all">📅</span>
                                                {formatDate(booking.date)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1.5 pl-8 flex items-center gap-2 font-bold tracking-tight">
                                                <span className="opacity-40 whitespace-nowrap">⏰ {booking.startTime} - {booking.endTime}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-gray-200 font-bold group-hover:text-primary transition-colors">{booking.field.name}</span>
                                                <span className="text-[9px] bg-white/5 w-fit px-2 py-0.5 rounded-full text-gray-400 font-black uppercase tracking-widest border border-white/5">F{booking.field.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-white font-black">{booking.clientName}</div>
                                            <div className="text-[11px] text-gray-500 font-bold mt-1 tracking-tight">{booking.clientPhone || 'Sin teléfono'}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-primary font-black text-xl tracking-tighter">
                                                ${booking.totalPrice.toLocaleString()}
                                            </div>
                                            {(booking.paymentType === 'SPLIT' || booking.paymentType === 'DEPOSIT') && booking.calculatedPaidAmount !== undefined && (
                                                <div className="mt-3 w-36 bg-black/20 p-2.5 rounded-full border border-white/5 shadow-inner">
                                                    <div className="flex justify-between text-[9px] text-gray-500 mb-1.5 font-black uppercase tracking-widest">
                                                        <span className={booking.calculatedPaidAmount >= (booking.field.complex?.downPaymentFixed || booking.totalPrice) ? 'text-emerald-400' : 'text-blue-400'}>
                                                            {Math.min(100, Math.round((booking.calculatedPaidAmount / (booking.totalPrice || 1)) * 100))}%
                                                        </span>
                                                        <span className="text-gray-300">${booking.calculatedPaidAmount}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5 relative shadow-inner">
                                                        {booking.field.complex?.downPaymentEnabled && (booking.field.complex?.downPaymentFixed || 0) > 0 && (
                                                            <div
                                                                className={`absolute h-full w-0.5 z-10 ${booking.calculatedPaidAmount >= (booking.field.complex.downPaymentFixed || 0) ? 'bg-emerald-400 opacity-20' : 'bg-amber-400'}`}
                                                                style={{ left: `${((booking.field.complex.downPaymentFixed || 0) / (booking.totalPrice || 1)) * 100}%` }}
                                                            />
                                                        )}
                                                        <div
                                                            className={`h-full transition-all duration-700 ${booking.calculatedPaidAmount >= booking.totalPrice ? 'bg-emerald-500' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                                                            style={{ width: `${Math.min(100, (booking.calculatedPaidAmount / (booking.totalPrice || 1)) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest">
                                                            <span className="text-blue-400">{booking.paymentType === 'DEPOSIT' ? 'Seña' : 'Vaquita'}</span>
                                                            {booking.calculatedPaidAmount >= (booking.field.complex?.downPaymentFixed || booking.totalPrice) && <span className="text-emerald-500">✓</span>}
                                                        </div>
                                                        {booking.paymentType === 'SPLIT' && (
                                                            <a
                                                                href={`/pay/${booking.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-[8px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white px-2 py-0.5 rounded-lg transition-all"
                                                            >
                                                                Link 🔗
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black border ${getStatusColor(booking.status)} uppercase tracking-widest flex items-center gap-2 w-fit shadow-sm`}>
                                                {booking.status === 'pending' && <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_5px_rgba(251,146,60,0.8)]"></span>}
                                                {booking.status === 'pending' ? 'Esperando Pago' :
                                                    booking.status === 'confirmed' ? 'Confirmada' :
                                                        booking.status === 'cancelled' ? 'Cancelada' : booking.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => setSelectedBooking(booking)}
                                                className="text-primary hover:text-white font-black text-[10px] uppercase tracking-widest bg-primary/10 hover:bg-primary border border-primary/20 px-4 py-2 rounded-full transition-all active:scale-95 shadow-lg shadow-primary/5"
                                            >
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Booking Detail Modal */}
                {selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/60 animate-fade-in">
                        <div 
                            className="absolute inset-0" 
                            onClick={() => setSelectedBooking(null)} 
                        />
                        <div className="glass-card w-full max-w-2xl bg-[#0a0a0a] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden relative animate-scale-up max-h-[90vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight">Detalles de Reserva</h3>
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">ID: #{selectedBooking.id.slice(0,8)}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedBooking(null)}
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10 flex items-center justify-center"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Modal Content - Scrollable */}
                            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                                {/* Key Info Grid */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fecha y Hora</p>
                                        <p className="text-white font-bold text-lg">{formatDate(selectedBooking.date)}</p>
                                        <p className="text-primary font-black">{selectedBooking.startTime} - {selectedBooking.endTime} hs</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cancha</p>
                                        <p className="text-white font-bold text-lg">{selectedBooking.field.name}</p>
                                        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-gray-400 font-black uppercase tracking-widest border border-white/5">Fútbol {selectedBooking.field.type}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cliente</p>
                                        <p className="text-white font-bold text-lg">{selectedBooking.clientName}</p>
                                        <p className="text-gray-400 text-sm">{selectedBooking.clientPhone || 'Sin teléfono'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estado</p>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusColor(selectedBooking.status)} uppercase tracking-widest flex items-center gap-2 w-fit mt-1`}>
                                            {selectedBooking.status === 'pending' && <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-orange-400"></span>}
                                            {selectedBooking.status === 'pending' ? 'Pendiente' : 
                                             selectedBooking.status === 'confirmed' ? 'Confirmada' : 
                                             selectedBooking.status === 'cancelled' ? 'Cancelada' : selectedBooking.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Financial Details */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-3">Resumen de Pago</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm font-bold">Total del Turno</span>
                                        <span className="text-white font-black text-xl">${selectedBooking.totalPrice.toLocaleString()}</span>
                                    </div>
                                    {selectedBooking.calculatedPaidAmount !== undefined && (
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-gray-500 text-sm font-bold">Monto Abonado</span>
                                            <span className="text-emerald-400 font-black text-xl">${selectedBooking.calculatedPaidAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-gray-500 text-sm font-bold">Tipo de Reserva</span>
                                        <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                            {selectedBooking.paymentType === 'FULL' ? 'Pago Total' : 
                                             selectedBooking.paymentType === 'DEPOSIT' ? 'Seña' : 
                                             selectedBooking.paymentType === 'SPLIT' ? 'Vaquita' : 'Manual'}
                                        </span>
                                    </div>
                                </div>

                                {/* Inventory Items */}
                                {selectedBooking.items && selectedBooking.items.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Elementos Alquilados</h4>
                                        <div className="space-y-2">
                                            {selectedBooking.items.map(item => (
                                                <div key={item.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">🎒</span>
                                                        <div>
                                                            <p className="text-white font-bold text-sm">{item.inventoryItem.name} (x{item.quantity})</p>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">${item.priceAtBooking} c/u</p>
                                                        </div>
                                                    </div>
                                                    {item.returned ? (
                                                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
                                                            ✓ Devuelto
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleReturnItem(selectedBooking.id, item.id)}
                                                            className="text-orange-400 hover:text-white text-[10px] font-black uppercase tracking-widest bg-orange-500/10 hover:bg-orange-500 border border-orange-500/20 px-4 py-2 rounded-full transition-all"
                                                        >
                                                            Marcar Devolución
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer - Actions */}
                            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex gap-4">
                                    {selectedBooking.status === 'pending' && (
                                        <button
                                            onClick={() => {
                                                handleStatusChange(selectedBooking.id, 'confirmed');
                                                setSelectedBooking(null);
                                            }}
                                            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs uppercase tracking-[0.2em] rounded-full transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                        >
                                            Aprobar Pago
                                        </button>
                                    )}
                                    {selectedBooking.status !== 'cancelled' && (
                                        <button
                                            onClick={() => {
                                                handleStatusChange(selectedBooking.id, 'cancelled');
                                                setSelectedBooking(null);
                                            }}
                                            className="px-8 py-4 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/20 font-black text-xs uppercase tracking-[0.2em] rounded-full transition-all active:scale-95"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        handleStatusChange(selectedBooking.id, 'DELETE');
                                        setSelectedBooking(null);
                                    }}
                                    className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-full transition-all active:scale-95 shadow-lg shadow-red-500/20 ml-auto"
                                >
                                    Eliminar y Liberar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile View (Cards) */}
                <div className="md:hidden flex flex-col gap-5 p-5">
                    {bookings.map(booking => (
                        <div key={booking.id} className="glass-card group p-5 space-y-5 border border-white/[0.03] hover:border-white/10 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="text-white font-black text-xl tracking-tighter flex items-center gap-2">
                                        <span className="text-primary text-base">📅</span>
                                        {formatDate(booking.date)}
                                    </div>
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-widest opacity-70 flex items-center gap-2">
                                        <span className="text-sm">⏰</span> {booking.startTime} - {booking.endTime}
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1.5 rounded-full text-[9px] font-black border ${getStatusColor(booking.status)} uppercase tracking-[0.15em] shadow-lg`}>
                                    {booking.status === 'pending' ? 'Pendiente' : booking.status}
                                </span>
                            </div>

                            <div className="bg-black/20 rounded-full p-4 space-y-3.5 text-sm border border-white/[0.03] shadow-inner">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cancha</span>
                                    <span className="text-white font-bold">{booking.field.name} <span className="text-[9px] opacity-40 ml-1">F{booking.field.type}</span></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cliente</span>
                                    <div className="text-right">
                                        <div className="text-white font-black">{booking.clientName}</div>
                                        <div className="text-[10px] text-gray-500 font-bold tracking-tight opacity-70">{booking.clientPhone || 'Sin tel.'}</div>
                                    </div>
                                </div>

                                {(booking.paymentType === 'SPLIT' || booking.paymentType === 'DEPOSIT') && booking.calculatedPaidAmount !== undefined && (
                                    <div className="mt-4 pt-4 border-t border-white/[0.05]">
                                        <div className="flex justify-between text-[9px] text-gray-500 mb-2 font-black uppercase tracking-widest">
                                            <span className={booking.calculatedPaidAmount >= (booking.field.complex?.downPaymentFixed || booking.totalPrice) ? 'text-emerald-400' : 'text-blue-400'}>
                                                Pago: {Math.min(100, Math.round((booking.calculatedPaidAmount / (booking.totalPrice || 1)) * 100))}%
                                            </span>
                                            <span className="text-gray-300 font-mono">${booking.calculatedPaidAmount}</span>
                                        </div>
                                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden relative shadow-inner">
                                            <div
                                                className={`h-full transition-all duration-1000 ${booking.calculatedPaidAmount >= booking.totalPrice ? 'bg-emerald-500' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`}
                                                style={{ width: `${Math.min(100, (booking.calculatedPaidAmount / (booking.totalPrice || 1)) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1.5 text-[8px] text-blue-400 font-black uppercase tracking-widest">
                                                <span>{booking.paymentType === 'DEPOSIT' ? '💰 Seña' : '🐄 Vaquita'}</span>
                                                {booking.calculatedPaidAmount >= (booking.field.complex?.downPaymentFixed || booking.totalPrice) && <span className="text-emerald-500">✓</span>}
                                            </div>
                                            {booking.paymentType === 'SPLIT' && (
                                                <a href={`/pay/${booking.id}`} className="text-[9px] text-gray-500 underline font-bold">Ver link</a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-3.5 border-t border-white/[0.05] mt-3">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Importe Total</span>
                                    <span className="text-primary font-black text-2xl tracking-tighter">${booking.totalPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Mobile Actions */}
                            <button
                                onClick={() => setSelectedBooking(booking)}
                                className="w-full btn-primary py-3.5 text-[10px] font-black uppercase tracking-widest shadow-primary/10 active:scale-95 transition-all text-center"
                            >
                                Ver Detalles Completos
                            </button>
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
                <div className="bg-slate-900/50 p-4 rounded-full border border-white/5 flex flex-col sm:flex-row items-center gap-4 w-fit">
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
