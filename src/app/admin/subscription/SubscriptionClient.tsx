'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SubscriptionStatus {
    hasAccess: boolean
    isActive: boolean
    trialExpired: boolean
    trialEndsAt: string | null
    subscriptionDate: string | null
    subscriptionEndsAt: string | null
    planType: string | null
}

export default function SubscriptionClient({ complex }: { complex: any }) {
    const router = useRouter()
    const [status, setStatus] = useState<SubscriptionStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState('')

    const [prices, setPrices] = useState({ monthly: 10000, quarterly: 27000, annual: 100000 })

    useEffect(() => {
        fetchStatus()
        fetchPrices()
    }, [])

    const fetchPrices = async () => {
        try {
            const res = await fetch('/api/saas/settings', { cache: 'no-store' })

            if (res.ok) {
                const data = await res.json()
                setPrices({
                    monthly: data.monthlyPrice || 10000,
                    quarterly: data.quarterlyPrice || 27000,
                    annual: data.annualPrice || 100000
                })
            }
        } catch (e) {
            console.error('Failed to fetch prices', e)
        }
    }

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/subscription/status')

            if (res.ok) {
                const data = await res.json()
                setStatus(data)
            } else {
                const errorData = await res.json()
                setError(`Error al cargar estado: ${errorData.error || 'Error desconocido'}`)
            }
        } catch (e) {
            console.error('Failed to fetch status', e)
            setError('Error de conexión al cargar estado')
        } finally {
            setLoading(false)
        }
    }

    const activateTrial = async () => {
        setActionLoading(true)
        setError('')

        try {
            const res = await fetch('/api/subscription/activate-trial', {
                method: 'POST'
            })

            const data = await res.json()

            if (res.ok) {
                router.refresh()
                fetchStatus()
            } else {
                setError(data.error || 'Error al activar el trial')
            }
        } catch (e) {
            setError('Error de conexión')
        } finally {
            setActionLoading(false)
        }
    }

    const subscribe = async (planType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL') => {
        setActionLoading(true)
        setError('')

        try {
            const res = await fetch('/api/subscription/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType })
            })

            const data = await res.json()

            if (res.ok && data.init_point) {
                // Redirect to MercadoPago
                window.location.href = data.init_point
            } else {
                setError(data.error || 'Error al iniciar el pago')
                setActionLoading(false) // Only stop loading if we didn't redirect
            }
        } catch (e) {
            setError('Error de conexión')
            setActionLoading(false)
        }
    }

    // Use API status if available, otherwise fallback to complex data
    const trialEndsAt = status?.trialEndsAt || complex?.trialEndsAt
    const subscriptionEndsAt = status?.subscriptionEndsAt || complex?.subscriptionEndsAt
    const planType = status?.planType || complex?.planType
    const now = new Date()
    const trialExpired = trialEndsAt ? new Date(trialEndsAt) < now : false
    const isOnTrial = trialEndsAt && !trialExpired
    const hasActiveSubscription = !!subscriptionEndsAt && new Date(subscriptionEndsAt) > now
    const needsActivation = !trialEndsAt && !hasActiveSubscription
    const showPricing = !hasActiveSubscription

    const daysRemaining = trialEndsAt
        ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : null

    const monthlySavings = (prices.monthly * 3) - prices.quarterly
    const annualSavings = (prices.monthly * 12) - prices.annual

    return (
        <div className="space-y-12 animate-fade-in pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tighter">
                        Membresía <span className="text-primary italic">Pro</span>
                    </h2>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Gestión centralizada de tu licencia comercial</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Estado:</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${hasActiveSubscription ? 'text-emerald-400' : isOnTrial ? 'text-blue-400' : 'text-red-400'}`}>
                        {hasActiveSubscription ? 'Premium' : isOnTrial ? 'Prueba' : 'Inactivo'}
                    </span>
                </div>
            </header>

            {/* Error Message */}
            {error && (
                <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-200 text-xs font-bold flex items-center gap-3">
                    <span className="text-xl">⚠️</span> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* State Card - Unified */}
                <div className="lg:col-span-12 glass-card p-1 border border-white/[0.03] overflow-hidden">
                    <div className="p-8 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-xl shadow-inner border border-primary/20">
                                🚀
                            </div>
                            <div>
                                <h3 className="text-white font-black text-xl tracking-tight">Estado de Licencia</h3>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Control de acceso al ecosistema TikiTaka</p>
                            </div>
                        </div>

                        {hasActiveSubscription ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-emerald-500/[0.03] border border-emerald-500/20 p-8 rounded-[2rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                                            <span className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em]">Suscripción Activa</span>
                                        </div>
                                        <h4 className="text-white font-black text-3xl tracking-tighter mb-1">
                                            Plan {planType === 'ANNUAL' ? 'Anual' : planType === 'QUARTERLY' ? 'Trimestral' : 'Mensual'}
                                        </h4>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                            Próxima renovación: <span className="text-gray-300 ml-1">{new Date(subscriptionEndsAt!).toLocaleDateString('es-AR', { dateStyle: 'long' })}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Support Section Integrated */}
                                <div className="glass-card bg-white/[0.01] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="space-y-1">
                                            <h4 className="text-white font-black text-lg tracking-tight group-hover:text-emerald-400 transition-colors">Soporte Concierge</h4>
                                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Atención VIP para miembros Pro</p>
                                        </div>
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <a
                                        href="https://wa.me/5491155898115?text=Hola%2C%20tengo%20una%20consulta%20sobre%20TikiTaka"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-full font-black text-[10px] uppercase tracking-[0.25em] transition-all text-center flex items-center justify-center gap-2"
                                    >
                                        Chat Directo 💬
                                    </a>
                                </div>
                            </div>
                        ) : isOnTrial ? (
                            <div className="bg-blue-500/[0.03] border border-blue-500/20 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full -ml-32 -mt-32 blur-3xl pointer-events-none"></div>
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-4xl shadow-inner border border-blue-500/20 transform group-hover:rotate-6 transition-transform">
                                        ⏱️
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]"></span>
                                            <span className="text-blue-400 font-black text-xs uppercase tracking-[0.2em]">En Periodo de Prueba</span>
                                        </div>
                                        <h4 className="text-white font-black text-3xl tracking-tighter">
                                            {daysRemaining} días restantes
                                        </h4>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                            Acceso total habilitado hasta el {new Date(trialEndsAt!).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative z-10 w-full md:w-auto h-2 md:h-20 md:w-1 bg-white/[0.03] rounded-full overflow-hidden">
                                     <div className="h-full w-full bg-blue-500/20 animate-pulse"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-500/[0.02] border border-red-500/10 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="text-center md:text-left">
                                    <h4 className="text-red-400 font-black text-2xl tracking-tighter mb-1">Acceso Restringido</h4>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-lg">
                                        Tu periodo de prueba ha finalizado. Tus datos están a salvo, pero las funcionalidades administrativas han sido pausadas.
                                    </p>
                                </div>
                                <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                                    Status: Offline
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Loading State Skeleton */}
                {loading && (
                    <div className="lg:col-span-12 glass-card p-12 text-center text-gray-500 font-black uppercase tracking-[0.3em] opacity-30">
                        Sincronizando Planes...
                    </div>
                )}

                {!loading && (
                    <div className="lg:col-span-12 space-y-12">
                        {/* Trial Activation - Large Callout */}
                        {!trialEndsAt && needsActivation && (
                            <div className="glass-card p-1 border border-blue-500/30 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-50"></div>
                                <div className="p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
                                    <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl border border-blue-500/20 transform group-hover:scale-110 transition-transform duration-700">
                                        🎁
                                    </div>
                                    <div className="flex-1 text-center md:text-left space-y-3">
                                        <h3 className="text-white font-black text-4xl tracking-tighter">
                                            ¡El software es tuyo por 7 días!
                                        </h3>
                                        <p className="text-gray-400 text-sm font-bold leading-relaxed max-w-xl">
                                            Sin tarjetas de crédito, sin compromiso. Prueba el sistema completo, sube tus canchas, recibe cobros y vive la experiencia TikiTaka antes de decidir.
                                        </p>
                                        <div className="pt-4">
                                            <button
                                                onClick={activateTrial}
                                                disabled={actionLoading}
                                                className="btn-primary px-10 py-5 text-sm font-black uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-blue-500/50 transition-all active:scale-95 rounded-full"
                                            >
                                                {actionLoading ? 'Activando...' : 'Comenzar Mi Prueba Gratis ⚡'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pricing Plans Grid */}
                        {showPricing && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Monthly Plan */}
                                <div className="glass-card p-1 border border-white/5 hover:border-white/10 transition-all group h-full">
                                    <div className="p-8 flex flex-col h-full bg-white/[0.01]">
                                        <div className="mb-10">
                                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Mensual</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-gray-500 text-xl font-black">$</span>
                                                <span className="text-5xl font-black text-white tracking-tighter">{prices.monthly.toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Acceso recurrente</p>
                                        </div>

                                        <div className="space-y-4 mb-10 flex-1">
                                            {[
                                                'Gestión total de reservas',
                                                'Link de pago personalizado',
                                                'Reportes de facturación',
                                                'Soporte Estándar'
                                            ].map(item => (
                                                <div key={item} className="flex items-center gap-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <span className="text-emerald-500 shadow-sm">✓</span> {item}
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => subscribe('MONTHLY')}
                                            disabled={actionLoading}
                                            className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-black text-[10px] uppercase tracking-[0.3em] text-white transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-30"
                                        >
                                            {actionLoading ? '...' : 'Elegir Mensual'}
                                        </button>
                                    </div>
                                </div>

                                {/* Quarterly Plan */}
                                <div className="glass-card p-1 border border-primary/20 hover:border-primary/40 transition-all group h-full relative overflow-hidden">
                                     <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[9px] font-black px-4 py-2 rounded-bl-2xl uppercase tracking-[0.2em] shadow-xl border-l border-b border-primary/20 z-20">
                                        AHORRA {(monthlySavings / (prices.monthly * 3) * 100).toFixed(0)}%
                                    </div>
                                    <div className="p-8 flex flex-col h-full bg-primary/[0.02]">
                                        <div className="mb-10">
                                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Trimestral</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-gray-500 text-xl font-black">$</span>
                                                <span className="text-5xl font-black text-white tracking-tighter">{prices.quarterly.toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Facturado cada 3 meses</p>
                                        </div>

                                        <div className="space-y-4 mb-10 flex-1">
                                            {[
                                                'Todo lo del plan mensual',
                                                'Ahorro estratégico',
                                                'Soporte Prioritario',
                                                'Consultoría de Onboarding'
                                            ].map(item => (
                                                <div key={item} className="flex items-center gap-3 text-[11px] font-black text-gray-300 uppercase tracking-widest">
                                                    <span className="text-primary shadow-sm group-hover:scale-125 transition-transform">✦</span> {item}
                                                </div>
                                            ))}
                                            <div className="pt-4 border-t border-white/5">
                                                <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em]">Bonificación: -${monthlySavings.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => subscribe('QUARTERLY')}
                                            disabled={actionLoading}
                                            className="w-full py-5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-full font-black text-[10px] uppercase tracking-[0.3em] text-white transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-primary/5 disabled:opacity-30"
                                        >
                                            {actionLoading ? '...' : 'Elegir Trimestral'}
                                        </button>
                                    </div>
                                </div>

                                {/* Annual Plan - Premium Featured */}
                                <div className="glass-card p-1 border-2 border-amber-500/50 relative group h-full shadow-[0_0_50px_rgba(245,158,11,0.1)] hover:shadow-[0_0_80px_rgba(245,158,11,0.2)] transition-all duration-700">
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black px-6 py-3 rounded-bl-3xl z-30 uppercase tracking-[0.3em] shadow-2xl">
                                        RECOMENDADO 🔥
                                    </div>
                                    <div className="absolute -inset-1 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-600/10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="p-8 flex flex-col h-full bg-gradient-to-b from-amber-500/[0.05] to-transparent relative z-10 rounded-[1.5rem] overflow-hidden">
                                        <div className="mb-8">
                                            <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4">Elite Anual</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-gray-500 text-2xl font-black">$</span>
                                                <span className="text-6xl font-black text-white tracking-tighter">{prices.annual.toLocaleString()}</span>
                                            </div>
                                            <div className="mt-2 inline-flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                                                <span className="text-white font-black text-[10px] uppercase tracking-widest">${Math.round(prices.annual / 12).toLocaleString()} / mes</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-10 flex-1">
                                            {[
                                                'Soporte VIP 24/7 WhatsApp',
                                                'Ahorro Masivo de 12 meses',
                                                'Actualizaciones Beta prioritarias',
                                                'Gestión avanzada de stock',
                                                'Reportes financieros exportables'
                                            ].map(item => (
                                                <div key={item} className="flex items-center gap-3 text-[11px] font-black text-white uppercase tracking-widest leading-relaxed">
                                                    <span className="text-amber-500 text-base shadow-sm group-hover:animate-bounce">👑</span> {item}
                                                </div>
                                            ))}
                                            <div className="pt-6 border-t border-white/10 mt-6 bg-white/[0.02] p-4 rounded-2xl">
                                                <p className="text-emerald-400 font-black text-xs uppercase tracking-tighter">AHORRAS TOTAL: ${annualSavings.toLocaleString()}</p>
                                                <p className="text-gray-500 text-[9px] font-bold uppercase mt-1 tracking-widest">Equivale a 2 meses gratis</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => subscribe('ANNUAL')}
                                            disabled={actionLoading}
                                            className="w-full py-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full font-black text-xs uppercase tracking-[0.4em] text-white shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/60 hover:scale-[1.03] transition-all transform active:scale-[0.97] border-t border-white/30 disabled:opacity-30"
                                        >
                                            {actionLoading ? '...' : 'Activar Plan Elite'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Help Footer */}
            <div className="pt-20 border-t border-white/5 flex flex-col items-center gap-6 text-center">
                <div className="flex -space-x-4 mb-2">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-950 bg-slate-800 flex items-center justify-center text-sm ring-2 ring-white/5 shadow-2xl">
                             👤
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <p className="text-white font-black text-lg tracking-tight">¿Alguna duda sobre los planes?</p>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-sm leading-relaxed">
                        Nuestro equipo está en línea para ayudarte a elegir la mejor opción para tu negocio.
                    </p>
                </div>
                <a 
                    href="https://wa.me/5491155898115?text=Hola%2C%20necesito%20ayuda%20con%20TikiTaka" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white transition-all"
                >
                    Hablar con un asesor 🛡️
                </a>
                <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.5em] mt-8">TikiTaka Sports Software © 2024</p>
            </div>
        </div>
    )
}
