import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SplitPaymentForm from './SplitPaymentForm'

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
    const totalPaid = (booking as any).payments
        .filter((p: any) => p.status === 'approved')
        .reduce((sum: number, p: any) => sum + p.amount, 0)

    // Sumar también si paidAmount tiene algo (migración legacy o carga manual)
    const grandTotalPaid = totalPaid + ((booking as any).paidAmount || 0)

    const remaining = Math.max(0, booking.totalPrice - grandTotalPaid)
    const progress = Math.min(100, (grandTotalPaid / booking.totalPrice) * 100)

    // Consideramos "Reservado" si se alcanzó la seña. "Completado" si falta poco dinero.
    const hasDeposit = (booking as any).field.complex?.downPaymentEnabled && (booking as any).field.complex?.downPaymentFixed > 0
    const depositGoal = hasDeposit ? (booking as any).field.complex.downPaymentFixed : 0
    const depositReached = hasDeposit && grandTotalPaid >= depositGoal

    // El estado de completado ahora es flexible: total pagado O seña alcanzada
    const isCompleted = remaining <= 10 || booking.status === 'confirmed' || booking.status === 'approved' || (hasDeposit && depositReached)

    const isFullPaid = remaining <= 10 || booking.status === 'confirmed' || booking.status === 'approved'

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20 font-sans selection:bg-primary/30">
            {/* Header Hero */}
            <div className="relative h-64 md:h-80 overflow-hidden">
                {/* Background Image Logic */}
                {(booking as any).field.imageUrl ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 scale-110 blur-[2px]"
                        style={{ backgroundImage: `url(${(booking as any).field.imageUrl})` }}
                    ></div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-slate-950 to-accent/20"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950 z-10"></div>

                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent z-10"></div>

                <div className="absolute bottom-20 left-0 w-full text-center z-20 px-6">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-6 backdrop-blur-xl shadow-2xl">
                        <span className="text-xl animate-bounce">⚽</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{(booking as any).field.name}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tightest mb-3 text-white drop-shadow-2xl">
                        LA <span className="text-primary italic">VAQUITA</span> 🐄
                    </h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] max-w-sm mx-auto opacity-80">
                         {new Date((booking as any).date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-8 relative z-30">
                {/* Card de Progreso */}
                <div className="glass-card p-8 mb-8 relative border-white/10 shadow-2xl overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>
                    
                    <div className="flex justify-between items-end mb-5">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Estado del Pago</span>
                        <div className="text-right">
                            <span className="block text-3xl font-black text-white tracking-tighter mb-0.5">${booking.totalPrice}</span>
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Monto Total</span>
                        </div>
                    </div>

                    <div className="h-4 bg-white/5 rounded-full overflow-hidden mb-6 p-[2px] border border-white/5 relative">
                        <div
                            className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary rounded-full shadow-[0_0_20px_rgba(34,197,94,0.3)] relative transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>

                        {/* Meta Seña Indicator */}
                        {hasDeposit && depositGoal < booking.totalPrice && (
                            <div
                                className={`absolute top-0 h-full w-[2px] z-20 transition-all duration-700 ${depositReached ? 'bg-primary/40' : 'bg-amber-400'}`}
                                style={{ left: `${(depositGoal / booking.totalPrice) * 100}%` }}
                            >
                                <div className={`absolute -top-1 -left-1 w-2 h-2 rounded-full ${depositReached ? 'bg-primary' : 'bg-amber-400'} shadow-[0_0_10px_currentColor]`}></div>
                                <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase tracking-widest ${depositReached ? 'text-primary' : 'text-amber-500'}`}>
                                    Meta Seña
                                </div>
                            </div>
                        )}
                    </div>

                    {hasDeposit && !depositReached && (
                        <div className="mb-6 p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center justify-center gap-3">
                            <span className="text-xl animate-pulse">📢</span>
                            <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">
                                Faltan <span className="text-white">${depositGoal - grandTotalPaid}</span> para asegurar el turno
                            </p>
                        </div>
                    )}

                    {depositReached && !isFullPaid && (
                        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl text-center space-y-1">
                            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                                Cancha Reservada
                            </p>
                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Sigan juntando para cancelar el total</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 transition-transform hover:scale-[1.02]">
                            <span className="block text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Acumulado</span>
                            <span className="text-2xl font-black text-primary tracking-tighter">${grandTotalPaid}</span>
                        </div>
                        <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 transition-transform hover:scale-[1.02]">
                            <span className="block text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Pendiente</span>
                            <span className="text-2xl font-black text-rose-500 tracking-tighter">${remaining}</span>
                        </div>
                    </div>
                </div>

                {/* Cliente Interactivo */}
                <SplitPaymentForm
                    booking={booking}
                    remaining={remaining}
                    isCompleted={isFullPaid}
                    depositGoal={depositGoal}
                    depositReached={depositReached}
                />

                {/* Lista de Pagos Recientes */}
                {(booking as any).payments.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 pl-2">Últimos Pagos</h3>
                        <div className="space-y-3">
                            {(booking as any).payments.map((p: any) => (
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
