import { prisma } from "@/lib/prisma"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import ClientLink from "@/components/admin/ClientLink"
import StatCard from "@/components/admin/StatCard"

// Force dynamic to ensure stats are fresh on every request
export const dynamic = 'force-dynamic';

async function getStats(complexId: string) {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalFields = await (prisma as any).field.count({ where: { complexId } })

    // Fetch all confirmed bookings for revenue calculation
    const confirmedBookings = await (prisma as any).booking.findMany({
        where: {
            field: { complexId },
            status: 'confirmed'
        },
        select: { totalPrice: true, date: true }
    })

    const totalRevenue = confirmedBookings.reduce((acc: number, b: any) => acc + b.totalPrice, 0)

    const monthlyRevenue = confirmedBookings
        .filter((b: any) => new Date(b.date) >= firstDayOfMonth)
        .reduce((acc: number, b: any) => acc + b.totalPrice, 0)

    const totalBookings = await (prisma as any).booking.count({
        where: {
            field: { complexId }
        }
    })

    const pendingBookings = await (prisma as any).booking.count({
        where: {
            status: 'pending',
            field: { complexId }
        }
    })

    // Recent Activity Logic (Existing)
    const recentActivity = await (prisma as any).booking.findMany({
        where: { field: { complexId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { field: true }
    })

    // --- NEW: Calculate Last 7 Days Revenue ---
    const chartData = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)

        const nextDay = new Date(d)
        nextDay.setDate(d.getDate() + 1)

        // Sum revenue for this specific day
        const dayRevenue = confirmedBookings
            .filter((b: any) => {
                const bDate = new Date(b.date)
                return bDate >= d && bDate < nextDay
            })
            .reduce((acc: number, b: any) => acc + b.totalPrice, 0)

        chartData.push({
            date: d.toLocaleDateString('es-AR', { weekday: 'short' }), // "lun", "mar"
            fullDate: d.toLocaleDateString(),
            revenue: dayRevenue
        })
    }

    return {
        totalFields,
        totalBookings,
        pendingBookings,
        totalRevenue,
        monthlyRevenue,
        recentActivity,
        chartData // Return the new data
    }
}

import OnboardingFlow from "@/components/admin/OnboardingFlow"
import { getSession } from "@/lib/auth"

export default async function AdminDashboard() {
    const session = await getSession()
    if (!session) redirect('/admin/login')

    const complexId = session.complexId
    
    // Si no hay complejo vinculado, mostrar flujo de bienvenida
    if (!complexId) {
        return <OnboardingFlow userEmail={session.email} />
    }

    const [stats, complex] = await Promise.all([
        getStats(complexId),
        (prisma as any).complex.findUnique({ where: { id: complexId } })
    ])

    const maxRevenue = Math.max(...stats.chartData.map((d: any) => d.revenue), 1) // Avoid div by zero

    // Calculate remaining trial days
    const trialEndsAt = complex?.trialEndsAt ? new Date(complex.trialEndsAt) : null
    const now = new Date()
    const daysRemaining = trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null
    const isTrialActive = daysRemaining !== null && daysRemaining > 0

    return (
        <div className="space-y-12 animate-fade-in w-full max-w-7xl mx-auto pb-32">
            {/* Header Section */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/[0.03] pb-12 mb-4 gap-8 px-1 overflow-hidden relative group">
                <div className="relative z-10">
                    <p className="text-primary font-black uppercase text-[10px] tracking-[0.4em] mb-4 flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-primary/50"></span>
                        Dashboard Operativo
                    </p>
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-3 tracking-tighter leading-none">
                        {complex?.name || 'Mi Complejo'}
                    </h2>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Visión integral del rendimiento y flujo de caja</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 relative z-10">
                    {complex?.slug && <ClientLink slug={complex.slug} />}

                    <div className="flex items-center gap-4 bg-white/[0.02] px-6 py-4 rounded-full border border-white/5 self-start shadow-2xl backdrop-blur-md">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Canal Online</span>
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">Sincronizado</span>
                        </div>
                    </div>
                </div>
                
                {/* Background Accent */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            </header>

            {/* Trial Days Banner (Premium Redesign) */}
            {isTrialActive && (
                <div className={`glass-card p-1 border border-white/[0.03] overflow-hidden group shadow-2xl shadow-black/40`}>
                    <div className={`flex flex-col sm:flex-row items-center justify-between gap-8 p-8 ${daysRemaining <= 2 ? 'bg-red-500/[0.03]' : 'bg-primary/[0.02]'}`}>
                        <div className="flex items-center gap-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center relative ${daysRemaining <= 2 ? 'bg-red-500/10 text-red-400' : 'bg-primary/10 text-primary'}`}>
                                <div className={`absolute inset-0 rounded-full animate-pulse opacity-20 ${daysRemaining <= 2 ? 'bg-red-500' : 'bg-primary'}`}></div>
                                <span className="text-4xl relative z-10">⏳</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white mb-1 tracking-tight">
                                    {daysRemaining === 0 ? '¡Hoy finaliza tu prueba!' :
                                        daysRemaining === 1 ? '¡Último día de cortesía!' :
                                            `${daysRemaining} días de prueba activa`}
                                </h3>
                                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                                    {daysRemaining <= 2 ? 'Tu acceso profesional está a punto de expirar' : 'Disfrutando del plan profesional sin límites'}
                                </p>
                            </div>
                        </div>
                        {daysRemaining <= 5 && (
                            <Link 
                                href="/admin/subscription"
                                className="btn-primary py-5 px-10 text-[10px] font-black uppercase tracking-[0.25em] shadow-xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center"
                            >
                                Mantener Acceso Pro ⚡
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Stats Grid - Enhanced Scale */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-1">
                <StatCard
                    title="Ingresos (Mes)"
                    value={stats.monthlyRevenue}
                    icon="Money"
                    trend="Flujo Mensual"
                    color="from-emerald-500/10"
                    borderColor="border-emerald-500/10"
                    isCurrency
                />
                <StatCard
                    title="Reservas Totales"
                    value={stats.totalBookings}
                    icon="Calendar"
                    trend="Volumen"
                    color="from-blue-500/10"
                    borderColor="border-blue-500/10"
                />
                <StatCard
                    title="Canchas"
                    value={stats.totalFields}
                    icon="Stadium"
                    trend="Capacidad"
                    color="from-indigo-500/10"
                    borderColor="border-indigo-500/10"
                />
                <StatCard
                    title="Pendientes"
                    value={stats.pendingBookings}
                    icon="Clock"
                    trend="Acción Requerida"
                    color="from-amber-500/10"
                    borderColor="border-amber-500/20"
                    highlight={stats.pendingBookings > 0}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-1">
                {/* Revenue Chart Section */}
                <div className="lg:col-span-2 glass-card p-1 border border-white/[0.03] shadow-2xl flex flex-col min-h-[500px]">
                    <div className="p-8 md:p-10 flex-1 flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-4">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                                    Desempeño <span className="text-primary italic">Financiero</span>
                                </h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-2">Monitoreo de ingresos últimos 7 días</p>
                            </div>
                            <div className="flex gap-6 text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                    Ventas Directas
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex items-end justify-between gap-4 sm:gap-8 h-80 w-full relative pt-10">
                            {/* Grid Lines */}
                            <div className="absolute inset-x-0 top-10 bottom-0 flex flex-col justify-between text-[9px] font-black text-white/5 pointer-events-none z-0 px-2 uppercase tracking-widest">
                                {[100, 75, 50, 25, 0].map((pct) => (
                                    <div key={pct} className="border-t border-white/[0.05] w-full h-0 relative flex items-center">
                                        <span className="absolute -left-10 opacity-30">{pct}%</span>
                                    </div>
                                ))}
                            </div>

                            {stats.chartData.map((d: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 z-10 group relative h-full justify-end">
                                    {/* Tooltip (Premium Design) */}
                                    <div className="absolute bottom-full mb-5 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-slate-950 text-white p-4 rounded-2xl border border-white/10 whitespace-nowrap z-20 pointer-events-none shadow-[0_20px_40px_rgba(0,0,0,0.4)] transform translate-y-4 group-hover:translate-y-0 min-w-[140px]">
                                        <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-2 border-b border-white/5 pb-2">{d.fullDate}</p>
                                        <p className="text-primary font-black text-xl tracking-tighter">${d.revenue.toLocaleString()}</p>
                                        <p className="text-[9px] text-emerald-400 font-bold uppercase mt-1">✓ Confirmado</p>
                                    </div>

                                    {/* Bar Track */}
                                    <div className="w-full max-w-[40px] sm:max-w-[60px] h-full bg-white/[0.01] rounded-t-[1.5rem] relative flex items-end overflow-hidden border border-white/[0.03] group-hover:border-primary/20 group-hover:bg-primary/[0.02] transition-all duration-700">
                                        <div
                                            className="w-full bg-gradient-to-t from-emerald-600 to-primary shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-1000 ease-out group-hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] group-hover:translate-y-[-2px] relative"
                                            style={{ height: `${d.revenue > 0 ? (d.revenue / maxRevenue) * 100 : 0}%`, minHeight: d.revenue > 0 ? '10px' : '0px' }}
                                        >
                                            <div className="absolute inset-0 bg-[url('/grain.png')] opacity-20 mix-blend-overlay"></div>
                                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
                                        </div>
                                    </div>

                                    {/* Label */}
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-white group-hover:scale-110 transition-all duration-500">
                                        {d.date}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="glass-card p-1 border border-white/[0.03] shadow-2xl flex flex-col h-full min-h-[500px] overflow-hidden">
                    <div className="p-8 md:p-10 flex flex-col h-full">
                        <h3 className="text-2xl font-black text-white mb-10 tracking-tight flex items-center justify-between">
                            Actividad
                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">En Vivo</span>
                        </h3>
                        <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            {stats.recentActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-30">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-3xl">🏟️</div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Esperando interacciones...</p>
                                </div>
                            ) : (
                                stats.recentActivity.map((booking: any) => (
                                    <div key={booking.id} className="flex items-center gap-6 p-5 rounded-3xl bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-500 cursor-default group border border-white/[0.02] hover:border-white/10 shadow-sm relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        
                                        <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/5 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 relative z-10
                                            ${booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}
                                        `}>
                                            <span className="text-2xl font-black">
                                                {booking.status === 'confirmed' ? '✓' : booking.status === 'pending' ? '⏳' : '✕'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0 relative z-10">
                                            <p className="text-white font-black text-lg truncate leading-none group-hover:text-primary transition-colors tracking-tight">{booking.clientName}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-lg border border-white/5">{booking.field.name}</span>
                                                <span className="text-xs font-black text-primary tracking-tighter">${booking.totalPrice.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <span className="text-[10px] font-black text-gray-600 group-hover:text-white transition-colors uppercase tracking-widest font-mono">
                                                {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


