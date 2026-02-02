'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type ComplexStats = {
    bookings: number,
    users: number,
    revenue: number
}

type Complex = {
    id: string
    name: string
    slug: string
    createdAt: string
    trialEndsAt: string | null
    subscriptionActive: boolean
    isActive: boolean
    stats?: ComplexStats
}

export default function SuperAdminDashboard() {
    const [complexes, setComplexes] = useState<Complex[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        revenue: 0,
        subscriptions: { monthly: 0, quarterly: 0, total: 0 }
    })
    const router = useRouter()

    // Pricing Config State
    const [prices, setPrices] = useState<{ monthly: number | string, quarterly: number | string }>({ monthly: 10000, quarterly: 27000 })
    const [savingPrices, setSavingPrices] = useState(false)

    useEffect(() => {
        fetchData()
        fetchStats()
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/saas/settings')
            if (res.ok) {
                const data = await res.json()
                setPrices({
                    monthly: data.monthlyPrice || 10000,
                    quarterly: data.quarterlyPrice || 27000
                })
            }
        } catch (e) {
            console.error('Failed to fetch settings', e)
        }
    }

    const handleSavePrices = async () => {
        setSavingPrices(true)
        try {
            const res = await fetch('/api/saas/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monthlyPrice: Number(prices.monthly) || 0,
                    quarterlyPrice: Number(prices.quarterly) || 0
                })
            })
            if (res.ok) {
                alert('Precios actualizados correctamente')
            } else {
                alert('Error al actualizar precios')
            }
        } catch (e) {
            alert('Error de conexión')
        } finally {
            setSavingPrices(false)
        }
    }

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/saas/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (e) {
            console.error('Failed to fetch stats', e)
        }
    }

    const fetchData = async () => {
        try {
            const res = await fetch('/api/saas/complexes')
            if (res.status === 401) {
                router.push('/admin/login')
                return
            }
            const data = await res.json()
            // Ensure data is an array
            if (Array.isArray(data)) {
                setComplexes(data)
            } else {
                console.error('API returned non-array data:', data)
                setComplexes([])
            }
        } catch (e) {
            console.error('Failed to fetch', e)
            setComplexes([])
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (complexId: string, action: string, value?: any) => {
        if (!confirm('¿Estás seguro de realizar esta acción?')) return

        try {
            const res = await fetch('/api/saas/complexes', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ complexId, action, value })
            })
            if (res.ok) {
                fetchData() // Refresh
            } else {
                alert('Action failed')
            }
        } catch (e) {
            alert('Error networking')
        }
    }

    const getDaysRemaining = (dateStr: string | null) => {
        if (!dateStr) return 'N/A'
        const end = new Date(dateStr)
        const now = new Date()
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diff
    }

    if (loading) return <div className="text-center p-20 text-gray-500">Cargando datos del imperio...</div>

    const complexRevenue = complexes.reduce((acc, c) => acc + (c.stats?.revenue || 0), 0)
    const totalBookings = complexes.reduce((acc, c) => acc + (c.stats?.bookings || 0), 0)

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Ganancia SaaS (Real Revenue) */}
                <div className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-900 to-slate-900 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">💰</span>
                    </div>
                    <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Ganancia Total (SaaS)</div>
                    <div className="text-4xl font-black text-white">${stats.revenue.toLocaleString()}</div>
                    <div className="text-indigo-300 text-sm mt-1">Ingresos por suscripciones</div>
                </div>

                {/* Subscripciones */}
                <div className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-blue-900 to-slate-900">
                    <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Suscripciones Activas</div>
                    <div className="text-4xl font-bold text-white mb-2">{stats.subscriptions.total}</div>
                    <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-white/10 rounded-full text-blue-200">
                            Mensual: <b>{stats.subscriptions.monthly}</b>
                        </span>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-purple-200">
                            Trimestral: <b>{stats.subscriptions.quarterly}</b>
                        </span>
                    </div>
                </div>

                {/* Complejos Activos */}
                <div className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-emerald-900/20">
                    <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Complejos Activos</div>
                    <div className="text-4xl font-bold text-white">{complexes.filter(c => c.isActive).length}</div>
                    <div className="text-emerald-400 text-sm mt-1">De {complexes.length} registrados</div>
                </div>

                {/* Configuración de Precios */}
                <div className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-amber-900/10 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-gray-400 text-xs uppercase tracking-widest font-bold">Precios de Suscripción</div>
                        <button
                            onClick={handleSavePrices}
                            disabled={savingPrices}
                            className="bg-primary/20 text-primary hover:bg-primary/30 text-xs px-3 py-1 rounded transition-colors"
                        >
                            {savingPrices ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Plan Mensual</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={prices.monthly}
                                    onChange={e => {
                                        const val = e.target.value
                                        const num = parseFloat(val)
                                        setPrices({
                                            monthly: val === '' ? '' : num,
                                            quarterly: val === '' ? '' : num * 3
                                        })
                                    }}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Plan Trimestral</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={prices.quarterly}
                                    onChange={e => setPrices({ ...prices, quarterly: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:border-primary outline-none transition-all"
                                />
                                <div className="flex gap-2 mt-2 justify-end">
                                    {[10, 20, 30].map(percent => (
                                        <button
                                            key={percent}
                                            onClick={() => {
                                                const monthly = Number(prices.monthly) || 0
                                                if (monthly > 0) {
                                                    const total = monthly * 3
                                                    const discounted = total * (1 - percent / 100)
                                                    setPrices(prev => ({ ...prev, quarterly: Math.round(discounted) }))
                                                }
                                            }}
                                            className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                            title={`Aplicar ${percent}% de descuento sobre el total (Mensual x 3)`}
                                        >
                                            -{percent}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Complexes Table */}
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Listado de Complejos</h2>
                    <button onClick={fetchData} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        🔄 Refrescar
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Complejo</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Prueba (Días)</th>
                                <th className="px-6 py-4">Métricas</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {complexes.map(complex => {
                                const days = getDaysRemaining(complex.trialEndsAt)
                                const isExpired = typeof days === 'number' && days < 0

                                return (
                                    <tr key={complex.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{complex.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">/{complex.slug}</div>
                                            <div className="text-[10px] text-gray-600 mt-1">{new Date(complex.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${complex.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                    {complex.isActive ? 'ACTIVO' : 'BANEADO'}
                                                </span>
                                                {complex.subscriptionActive ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">PREMIUM</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-gray-500/10 text-gray-400 border-gray-500/20">FREE</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {complex.trialEndsAt ? (
                                                <div className={`font-mono text-sm ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {isExpired ? 'VENCIDO' : `${days} días`}
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <div title="Reservas">📅 {complex.stats?.bookings || 0}</div>
                                                <div title="Ingresos">💰 ${complex.stats?.revenue?.toLocaleString() || 0}</div>
                                                <div title="Usuarios">👥 {complex.stats?.users || 0}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleAction(complex.id, 'TOGGLE_ACTIVE', !complex.isActive)}
                                                className={`text-[10px] px-2 py-1 rounded border transition-colors ${complex.isActive ? 'text-red-400 border-red-500/30 hover:bg-red-500/10' : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'}`}
                                            >
                                                {complex.isActive ? 'BANEAR' : 'ACTIVAR'}
                                            </button>
                                            <button
                                                onClick={() => handleAction(complex.id, 'EXTEND_TRIAL')}
                                                className="text-[10px] px-2 py-1 rounded border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                            >
                                                +7 DÍAS
                                            </button>
                                            <button
                                                onClick={() => handleAction(complex.id, 'DELETE_COMPLEX')}
                                                className="text-[10px] px-2 py-1 rounded border border-gray-500/30 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                                                title="Eliminar Complejo y Datos"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
