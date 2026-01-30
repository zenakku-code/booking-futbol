'use client'
import { useState, useEffect } from 'react'
import StatCard from './StatCard'

export default function ReportingDashboard() {
    const today = new Date().toLocaleDateString('en-CA')
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthStr = lastMonth.toLocaleDateString('en-CA')

    const [range, setRange] = useState({ from: lastMonthStr, to: today })
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchReport = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/reports?from=${range.from}&to=${range.to}`)
            const json = await res.json()
            setData(json)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReport()
    }, [])

    if (loading && !data) return <div className="text-white">Cargando reportes...</div>

    const maxDaily = Math.max(...Object.values(data?.dailyRevenue || {}).map((v: any) => v), 1)

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white mb-1">Reportes Financieros</h2>
                    <p className="text-gray-400 text-sm">Analiza el rendimiento de tu complejo en el tiempo.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-white/5 shadow-xl">
                    <div className="flex flex-col px-3">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Desde</span>
                        <input
                            type="date"
                            className="bg-transparent text-white text-sm outline-none"
                            value={range.from}
                            onChange={(e) => setRange({ ...range, from: e.target.value })}
                        />
                    </div>
                    <div className="w-[1px] h-8 bg-white/10 hidden sm:block"></div>
                    <div className="flex flex-col px-3">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Hasta</span>
                        <input
                            type="date"
                            className="bg-transparent text-white text-sm outline-none"
                            value={range.to}
                            onChange={(e) => setRange({ ...range, to: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={fetchReport}
                        className="bg-primary text-slate-900 h-10 px-6 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 ml-2"
                    >
                        Filtrar
                    </button>
                </div>
            </header>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ingresos Totales"
                    value={data?.summary.totalRevenue || 0}
                    icon="Money"
                    isCurrency
                    color="from-emerald-500/20 to-emerald-900/10"
                    borderColor="border-emerald-500/30"
                />
                <StatCard
                    title="Cobrado (MP + Manual)"
                    value={data?.summary.actualCollected || 0}
                    icon="Money"
                    isCurrency
                    color="from-blue-500/20 to-blue-900/10"
                    borderColor="border-blue-500/30"
                />
                <StatCard
                    title="Reservas Confirmadas"
                    value={data?.summary.confirmedBookings || 0}
                    icon="Calendar"
                    trend={`${data?.summary.totalBookings} totales`}
                    color="from-purple-500/20 to-purple-900/10"
                    borderColor="border-purple-500/30"
                />
                <StatCard
                    title="Ticket Promedio"
                    value={data?.summary.averageTicket || 0}
                    icon="Chart"
                    isCurrency
                    color="from-orange-500/20 to-orange-900/10"
                    borderColor="border-orange-500/30"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Revenue Chart */}
                <div className="lg:col-span-2 glass-card p-6 md:p-8">
                    <h3 className="text-xl font-bold text-white mb-8 border-b border-white/5 pb-4">Evolución de Ingresos</h3>
                    <div className="h-64 flex items-end justify-between gap-1 w-full relative pt-10 px-2">
                        {/* Bars */}
                        {Object.entries(data?.dailyRevenue || {}).map(([date, amount]: [string, any], i: number) => (
                            <div key={date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded border border-white/10 whitespace-nowrap z-20 pointer-events-none">
                                    {date}: <span className="text-primary font-bold">${amount}</span>
                                </div>
                                <div className="w-full max-w-[12px] bg-slate-800/50 rounded-t-sm relative flex items-end h-full">
                                    <div
                                        className="w-full bg-primary shadow-[0_0_10px_var(--primary)] transition-all duration-500 rounded-t-sm"
                                        style={{ height: `${(amount / maxDaily) * 100}%`, minHeight: amount > 0 ? '2px' : '0' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {Object.keys(data?.dailyRevenue || {}).length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                                No hay datos para este período
                            </div>
                        )}
                    </div>
                </div>

                {/* Field Performance */}
                <div className="glass-card p-6 md:p-8 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">Ingresos por Cancha</h3>
                    <div className="space-y-4 flex-1">
                        {data?.revenueByField.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-10">Sin datos de canchas</p>
                        ) : (
                            data?.revenueByField.sort((a: any, b: any) => b.amount - a.amount).map((field: any) => (
                                <div key={field.name} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300 font-medium">{field.name} ({field.count})</span>
                                        <span className="text-white font-bold">${field.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent rounded-full shadow-[0_0_10px_var(--accent)]"
                                            style={{ width: `${(field.amount / (data.summary.totalRevenue || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Items Breakdown */}
                <div className="lg:col-span-3 glass-card p-6 md:p-8">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">Venta de Adicionales</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {data?.itemsBreakdown.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4">No se vendieron adicionales en este período.</p>
                        ) : (
                            data?.itemsBreakdown.map((item: any) => (
                                <div key={item.name} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{item.name}</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-2xl font-black text-white">${item.amount.toLocaleString()}</p>
                                            <p className="text-xs text-primary font-bold">{item.quantity} unidades</p>
                                        </div>
                                        <span className="text-2xl opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all">🎒</span>
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
