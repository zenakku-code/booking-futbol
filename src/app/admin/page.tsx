import { prisma } from "@/lib/prisma"
import Link from 'next/link'

// Force dynamic to ensure stats are fresh on every request
export const dynamic = 'force-dynamic';

async function getStats() {
    const totalFields = await prisma.field.count()
    const totalBookings = await prisma.booking.count()
    const pendingBookings = await prisma.booking.count({ where: { status: 'pending' } })
    return { totalFields, totalBookings, pendingBookings }
}

export default async function AdminDashboard() {
    const stats = await getStats()

    return (
        <div className="space-y-8 animate-fade-in w-full max-w-7xl mx-auto">
            {/* Header Section - Stack on mobile, Row on Desktop */}
            <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-6 gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Dashboard</h2>
                    <p className="text-gray-400 text-base">Visión general del estado de tu complejo.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 self-start md:self-auto">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]"></div>
                    <span className="text-sm font-medium text-white">Sistema Operativo</span>
                </div>
            </header>

            {/* Stats Grid - 1 Col Mobile, 2 Col Tablet, 3 Col Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Canchas Activas"
                    value={stats.totalFields}
                    icon="Stadium"
                    trend="+ Estable"
                    color="from-emerald-500/20 to-emerald-900/10"
                    borderColor="border-emerald-500/30"
                />
                <StatCard
                    title="Reservas Totales"
                    value={stats.totalBookings}
                    icon="Calendar"
                    trend="+ Actividad reciente"
                    color="from-blue-500/20 to-blue-900/10"
                    borderColor="border-blue-500/30"
                />
                <StatCard
                    title="Pendientes"
                    value={stats.pendingBookings}
                    icon="Clock"
                    trend="Requiere Revisión"
                    color="from-amber-500/20 to-amber-900/10"
                    borderColor="border-amber-500/50"
                    highlight
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section - Takes 2 cols on Desktop */}
                <div className="lg:col-span-2 glass-card p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="text-primary">●</span> Estadísticas de Ocupación
                        </h3>
                        <div className="flex gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                            <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                        </div>
                    </div>

                    <div className="h-64 w-full flex items-center justify-center rounded-2xl bg-slate-950/50 border border-dashed border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-gray-700 mb-2">Coming Soon</p>
                            <p className="text-sm text-gray-500">Gráfico de rendimiento semanal</p>
                        </div>
                    </div>
                </div>

                {/* Activity Feed - Takes 1 col */}
                <div className="glass-card p-6 md:p-8 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="text-accent">●</span> Última Actividad
                    </h3>
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all cursor-default group border border-transparent hover:border-white/5">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-colors">
                                    <span className="text-lg">👤</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm truncate">Nueva reserva #204{i}</p>
                                    <p className="text-xs text-gray-500">Hace {i * 12 + 2} minutos</p>
                                </div>
                                <Link href="/admin/bookings" className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                                    Ver
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, trend, color, borderColor, highlight }: { title: string, value: number, icon: string, trend?: string, color?: string, borderColor?: string, highlight?: boolean }) {
    // Icon mapping simple
    const icons: any = {
        'Stadium': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>,
        'Calendar': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
        'Clock': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    }

    return (
        <div className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 transition-all hover:-translate-y-1 hover:shadow-2xl group ${borderColor || 'border-white/5'} ${highlight ? 'ring-1 ring-amber-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)] bg-amber-950/10' : 'bg-slate-900/40'}`}>
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color || 'from-slate-800/20 to-slate-900/20'} z-0 opacity-100`} />
            <div className="absolute right-0 top-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-6">
                    <span className="p-3 bg-slate-950/50 rounded-2xl border border-white/10 text-white group-hover:scale-110 transition-transform shadow-lg">
                        {icons[icon] || icon}
                    </span>
                    {highlight && <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>}
                </div>

                <div>
                    <div className="flex items-end gap-3 mb-1">
                        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{value}</h3>
                    </div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{title}</p>
                </div>

                {trend && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${highlight ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                            {trend}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
