import { prisma } from "@/lib/prisma"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"
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

export default async function AdminDashboard() {
    const complexId = await getComplexId()
    if (!complexId) redirect('/admin/login')

    const [stats, complex] = await Promise.all([
        getStats(complexId),
        (prisma as any).complex.findUnique({ where: { id: complexId } })
    ])

    const maxRevenue = Math.max(...stats.chartData.map((d: any) => d.revenue), 1) // Avoid div by zero

    return (
        <div className="space-y-8 animate-fade-in w-full max-w-7xl mx-auto pb-20">
            {/* Header Section */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/5 pb-8 gap-6">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">
                        {complex?.name || 'Dashboard'}
                    </h2>
                    <p className="text-gray-400 text-base">Visión general del estado de tu complejo.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {complex?.slug && <ClientLink slug={complex.slug} />}

                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 self-start">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-sm font-medium text-white whitespace-nowrap">Sistema Operativo</span>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ingresos (Mes)"
                    value={stats.monthlyRevenue}
                    icon="Money"
                    trend="Este mes"
                    color="from-green-500/20 to-green-900/10"
                    borderColor="border-green-500/30"
                    isCurrency
                />
                <StatCard
                    title="Reservas Totales"
                    value={stats.totalBookings}
                    icon="Calendar"
                    trend="Histórico"
                    color="from-blue-500/20 to-blue-900/10"
                    borderColor="border-blue-500/30"
                />
                <StatCard
                    title="Canchas Activas"
                    value={stats.totalFields}
                    icon="Stadium"
                    trend="Capacidad"
                    color="from-purple-500/20 to-purple-900/10"
                    borderColor="border-purple-500/30"
                />
                <StatCard
                    title="Pendientes"
                    value={stats.pendingBookings}
                    icon="Clock"
                    trend="Requiere Acción"
                    color="from-amber-500/20 to-amber-900/10"
                    borderColor="border-amber-500/50"
                    highlight={stats.pendingBookings > 0}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart Section - Takes 2 cols on Desktop */}
                <div className="lg:col-span-2 glass-card p-6 md:p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary">●</span> Rendimiento Semanal
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">Ingresos de los últimos 7 días</p>
                        </div>
                        <div className="hidden sm:flex gap-4 text-xs font-bold text-gray-500 uppercase">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Ingresos
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 h-64 w-full relative pt-10">
                        {/* Grid Lines */}
                        <div className="absolute inset-x-0 top-10 bottom-0 flex flex-col justify-between text-[10px] text-gray-600 pointer-events-none z-0">
                            {[100, 75, 50, 25, 0].map((pct) => (
                                <div key={pct} className="border-t border-white/5 w-full h-0 relative">
                                    <span className="absolute -top-3 right-0 opacity-0">{pct}%</span>
                                </div>
                            ))}
                        </div>

                        {stats.chartData.map((d: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 z-10 group relative h-full justify-end">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] sm:text-xs py-1 px-2 rounded border border-white/10 whitespace-nowrap z-20 pointer-events-none shadow-xl transform translate-y-2 group-hover:translate-y-0">
                                    {d.fullDate}: <span className="text-primary font-bold">${d.revenue}</span>
                                </div>

                                {/* Bar Track (Background) ensures visibility even if empty */}
                                <div className="w-full max-w-[32px] sm:max-w-[40px] h-full bg-slate-800/50 rounded-t-lg relative flex items-end overflow-hidden border border-white/5 group-hover:border-white/20 transition-colors">
                                    {/* Solid Bar Value */}
                                    <div
                                        className="w-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-300 group-hover:bg-emerald-400 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.8)]"
                                        style={{ height: `${d.revenue > 0 ? (d.revenue / maxRevenue) * 100 : 0}%`, minHeight: d.revenue > 0 ? '4px' : '0px' }}
                                    ></div>
                                </div>

                                {/* Label */}
                                <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase group-hover:text-white transition-colors">
                                    {d.date}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Feed - Takes 1 col */}
                <div className="glass-card p-6 md:p-8 flex flex-col h-full min-h-[400px]">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="text-accent">●</span> Última Actividad
                    </h3>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar -mr-2 p-2">
                        {stats.recentActivity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-50">
                                <span className="text-4xl mb-2">💤</span>
                                <p className="text-sm text-gray-400">Sin actividad reciente.</p>
                            </div>
                        ) : (
                            stats.recentActivity.map((booking: any) => (
                                <div key={booking.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-default group border border-transparent hover:border-white/10">
                                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/5 shadow-lg
                                        ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                            booking.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}
                                    `}>
                                        <span className="text-lg">
                                            {booking.status === 'confirmed' ? '✓' : booking.status === 'pending' ? '⏳' : '✕'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{booking.clientName}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wide">
                                            <span>{booking.field.name}</span>
                                            <span>•</span>
                                            <span>${booking.totalPrice}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-mono text-gray-500 block">
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
    )
}


