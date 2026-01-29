import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SplitPaymentClient from './SplitPaymentClient'

export const dynamic = 'force-dynamic'

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            field: { include: { complex: true } },
            payments: { orderBy: { createdAt: 'desc' } }
        }
    })

    if (!booking) return notFound()

    // Calcular totales
    const totalPaid = booking.payments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0)

    // Sumar también si paidAmount tiene algo (migración legacy o carga manual)
    const grandTotalPaid = totalPaid + (booking.paidAmount || 0)

    const remaining = Math.max(0, booking.totalPrice - grandTotalPaid)
    const progress = Math.min(100, (grandTotalPaid / booking.totalPrice) * 100)
    const isCompleted = remaining <= 10 // Margen de error de $10

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20 font-sans selection:bg-primary/30">
            {/* Header Hero */}
            <div className="relative h-64 md:h-72 overflow-hidden">
                {/* Background Image Logic would go here */}
                {booking.field.imageUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
                        style={{ backgroundImage: `url(${booking.field.imageUrl})` }}
                    ></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/80 to-slate-950 z-10"></div>

                <div className="absolute bottom-16 left-0 w-full text-center z-20 px-4">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-4 backdrop-blur-md">
                        <span className="text-xl">⚽</span>
                        <span className="text-xs font-bold uppercase tracking-wider">{booking.field.name}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        La Vaquita 🐄
                    </h1>
                    <p className="text-gray-400 font-medium max-w-sm mx-auto">
                        Ayudá a completar el pago para el partido del {new Date(booking.date).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-8 relative z-30">
                {/* Card de Progreso */}
                <div className="glass-card p-6 mb-6 transform hover:scale-[1.01] transition-transform duration-500">
                    <div className="flex justify-between items-end mb-3">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Progreso de Pago</span>
                        <div className="text-right">
                            <span className="block text-2xl font-black text-white leading-none">${booking.totalPrice}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Total Partido</span>
                        </div>
                    </div>

                    <div className="h-6 bg-slate-900/80 rounded-full overflow-hidden mb-4 shadow-inner border border-white/5 relative">
                        {/* Background Grid Pattern */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.1) 50%)', backgroundSize: '10px 10px' }}></div>

                        <div
                            className="h-full bg-gradient-to-r from-primary to-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.5)] relative transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            {/* Shine effect */}
                            <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 blur-[2px]"></div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase">Juntado</span>
                            <span className="text-emerald-400 text-lg">${grandTotalPaid}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase">Falta</span>
                            <span className="text-red-400 text-lg">${remaining}</span>
                        </div>
                    </div>
                </div>

                {/* Cliente Interactivo */}
                <SplitPaymentClient
                    booking={booking}
                    remaining={remaining}
                    isCompleted={isCompleted}
                />

                {/* Lista de Pagos Recientes */}
                {booking.payments.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 pl-2">Últimos Pagos</h3>
                        <div className="space-y-3">
                            {booking.payments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 border border-white/5 hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {p.status === 'approved' ? '✓' : '⏳'}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">
                                                {p.payerEmail || 'Anónimo'}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-mono font-bold ${p.status === 'approved' ? 'text-white' : 'text-gray-500 opacity-50'}`}>
                                        +${p.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
