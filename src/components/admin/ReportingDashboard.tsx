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
        <div className="space-y-12 animate-fade-in pb-32">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/[0.03] pb-12">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tighter">
                        Performance <span className="text-primary italic">Analytics</span>
                    </h2>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Análisis técnico y financiero de tu complejo</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white/[0.02] p-2 rounded-full border border-white/5 shadow-2xl backdrop-blur-xl">
                    <div className="flex flex-col px-6 py-2">
                        <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Desde</span>
                        <input
                            type="date"
                            className="bg-transparent text-white text-sm font-black outline-none cursor-pointer hover:text-primary transition-colors"
                            value={range.from}
                            onChange={(e) => setRange({ ...range, from: e.target.value })}
                        />
                    </div>
                    <div className="w-[1px] h-10 bg-white/5 hidden sm:block"></div>
                    <div className="flex flex-col px-6 py-2">
                        <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Hasta</span>
                        <input
                            type="date"
                            className="bg-transparent text-white text-sm font-black outline-none cursor-pointer hover:text-primary transition-colors"
                            value={range.to}
                            onChange={(e) => setRange({ ...range, to: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={fetchReport}
                        className="btn-primary h-14 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all ml-2"
                    >
                        Filtrar Reporte ⚡
                    </button>
                </div>
            </header>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Ingresos Totales"
                    value={data?.summary.totalRevenue || 0}
                    icon="Money"
                    isCurrency
                    color="from-emerald-500/10"
                    borderColor="border-emerald-500/10"
                />
                <StatCard
                    title="Cobro Real"
                    value={data?.summary.actualCollected || 0}
                    icon="Money"
                    isCurrency
                    color="from-blue-500/10"
                    borderColor="border-blue-500/10"
                />
                <StatCard
                    title="Reservas"
                    value={data?.summary.confirmedBookings || 0}
                    icon="Calendar"
                    trend={`${data?.summary.totalBookings} registros`}
                    color="from-indigo-500/10"
                    borderColor="border-indigo-500/10"
                />
                <StatCard
                    title="Ticket Promedio"
                    value={data?.summary.averageTicket || 0}
                    icon="Chart"
                    isCurrency
                    color="from-amber-500/10"
                    borderColor="border-orange-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Daily Revenue Chart */}
                <div className="lg:col-span-2 glass-card p-1 border border-white/[0.03] shadow-2xl">
                    <div className="p-8 md:p-10">
                        <h3 className="text-2xl font-black text-white tracking-tight mb-12 flex items-center justify-between">
                            Evolución de Ingresos
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full">Diario</span>
                        </h3>
                        <div className="h-72 flex items-end justify-between gap-2 w-full relative pt-12">
                            {/* Grid Lines */}
                            <div className="absolute inset-x-0 top-10 bottom-0 flex flex-col justify-between text-[8px] font-black text-white/5 pointer-events-none z-0 px-2 uppercase tracking-widest">
                                {[100, 75, 50, 25, 0].map((pct) => (
                                    <div key={pct} className="border-t border-white/[0.05] w-full h-0 relative flex items-center">
                                        <span className="absolute -left-2">{pct}%</span>
                                    </div>
                                ))}
                            </div>

                            {/* Bars */}
                            {Object.entries(data?.dailyRevenue || {}).map(([date, amount]: [string, any], i: number) => (
                                <div key={date} className="flex-1 flex flex-col items-center group relative h-full justify-end z-10 transition-all">
                                    <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-slate-950 text-white p-3 rounded-full border border-white/10 whitespace-nowrap z-20 pointer-events-none shadow-2xl transform translate-y-2 group-hover:translate-y-0">
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mb-1 tracking-widest">{date}</p>
                                        <p className="text-primary font-black text-sm tracking-tighter">${amount.toLocaleString()}</p>
                                    </div>
                                    <div className="w-full max-w-[12px] md:max-w-[20px] bg-white/[0.01] rounded-t-xl relative flex items-end h-full overflow-hidden border border-white/[0.03] group-hover:border-primary/20 transition-all duration-700">
                                        <div
                                            className="w-full bg-gradient-to-t from-emerald-600 to-primary shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all duration-1000 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                                            style={{ height: `${(amount / maxDaily) * 100}%`, minHeight: amount > 0 ? '4px' : '0' }}
                                        ></div>
                                    </div>
                                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-tighter mt-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden max-w-full">
                                        {date.split('-')[2]}
                                    </span>
                                </div>
                            ))}
                            {Object.keys(data?.dailyRevenue || {}).length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 uppercase font-black text-[10px] tracking-[0.2em] opacity-40">
                                    <span className="text-4xl mb-4 grayscale">📉</span>
                                    No hay transacciones registradas
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Field Performance */}
                <div className="glass-card p-1 border border-white/[0.03] shadow-2xl flex flex-col">
                    <div className="p-8 md:p-10 flex flex-col h-full">
                        <h3 className="text-2xl font-black text-white tracking-tight mb-10 pb-6 border-b border-white/5">Ranking Canchas</h3>
                        <div className="space-y-8 flex-1">
                            {data?.revenueByField.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 opacity-20">
                                    <span className="text-3xl mb-4">Stadium</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin datos</p>
                                </div>
                            ) : (
                                data?.revenueByField.sort((a: any, b: any) => b.amount - a.amount).map((field: any) => (
                                    <div key={field.name} className="space-y-3 group">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-white font-black text-sm tracking-tight group-hover:text-primary transition-colors">{field.name}</span>
                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{field.count} turnos confirmados</span>
                                            </div>
                                            <span className="text-white font-black text-lg tracking-tighter">${field.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2.5 bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.05]">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-1000"
                                                style={{ width: `${(field.amount / (data.summary.totalRevenue || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Breakdown */}
                <div className="lg:col-span-3 glass-card p-1 border border-white/[0.03] shadow-2xl overflow-hidden relative group">
                    <div className="p-8 md:p-10 relative z-10">
                        <h3 className="text-2xl font-black text-white tracking-tight mb-10 pb-6 border-b border-white/5 flex items-center justify-between">
                            Venta de Adicionales
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Complementos de alquiler</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {data?.itemsBreakdown.length === 0 ? (
                                <div className="col-span-full py-20 text-center opacity-30">
                                    <p className="text-[10px] font-black uppercase tracking-widest">No hay ventas registradas en adicionales</p>
                                </div>
                            ) : (
                                data?.itemsBreakdown.map((item: any) => (
                                    <div key={item.name} className="p-8 bg-black/20 rounded-[2rem] border border-white/5 hover:border-primary/20 hover:bg-black/30 transition-all duration-500 group/item relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                                        <p className="text-gray-600 text-[9px] font-black uppercase tracking-[0.3em] mb-4 relative z-10">{item.name}</p>
                                        <div className="flex justify-between items-end relative z-10">
                                            <div>
                                                <p className="text-3xl font-black text-white tracking-tighter mb-1">${item.amount.toLocaleString()}</p>
                                                <p className="text-xs text-primary font-black uppercase tracking-tight">{item.quantity} USOS</p>
                                            </div>
                                            <span className="text-4xl opacity-10 group-hover/item:opacity-40 group-hover/item:scale-125 group-hover/item:rotate-12 transition-all duration-500">⚽</span>
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
