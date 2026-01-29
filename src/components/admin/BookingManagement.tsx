'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
}

export default function BookingManagement({ initialBookings }: { initialBookings: any[] }) {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings)
    const router = useRouter()

    const handleStatusChange = async (id: string, newStatus: string) => {
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
            default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        }
    }

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Gestión de Reservas</h2>
                <p className="text-gray-400">Administra las solicitures de reserva de tus clientes.</p>
            </header>

            <div className="glass overflow-hidden rounded-2xl">
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
                                <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-white font-medium">
                                            {new Date(booking.date).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {booking.startTime} - {booking.endTime}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-300">{booking.field.name}</span>
                                        <span className="ml-2 text-xs bg-slate-700 px-1.5 py-0.5 rounded text-gray-400">F{booking.field.type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-white">{booking.clientName}</div>
                                        <div className="text-xs text-gray-500">{booking.clientPhone || 'No phone'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-primary font-bold">
                                        ${booking.totalPrice}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)} uppercase tracking-wider`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {booking.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                    className="text-green-400 hover:text-green-300 font-medium text-sm transition-colors"
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                                    className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </>
                                        )}
                                        {booking.status === 'confirmed' && (
                                            <button
                                                onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                                className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No hay reservas registradas.
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
