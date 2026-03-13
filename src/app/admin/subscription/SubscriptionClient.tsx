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
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <header>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">
                    Suscripción
                </h2>
                <p className="text-gray-400 text-base">Gestiona tu plan, pagos y estado del sistema</p>
            </header>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* State Card */}
                <div className="lg:col-span-2 glass-card p-8 border-2 border-primary/20">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-primary/20 rounded-xl">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Estado del Software</h3>
                            <p className="text-gray-400 text-sm">Licencia y acceso al sistema</p>
                        </div>
                    </div>

                    <div className="space-y-4 border-t border-slate-700 pt-6">
                        {hasActiveSubscription ? (
                            <>
                            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <p className="text-green-400 font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        Suscripción Activa
                                    </p>
                                    <p className="text-sm text-gray-300 mt-1">
                                        Plan <span className="font-bold text-white">
                                            {planType === 'ANNUAL' ? 'Anual' : planType === 'QUARTERLY' ? 'Trimestral' : 'Mensual'}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Vence el {new Date(subscriptionEndsAt!).toLocaleDateString('es-AR', { dateStyle: 'long' })}
                                    </p>
                                </div>
                                <span className="text-3xl">✅</span>
                            </div>

                            {/* WhatsApp Premium Support */}
                            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl mt-4">
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-7 h-7 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                    </div>
                                    <div className="text-center sm:text-left flex-1">
                                        <h4 className="text-green-400 font-bold text-sm mb-1">Soporte Premium por WhatsApp</h4>
                                        <p className="text-gray-400 text-xs">Consultas directas por tu membresía activa.</p>
                                    </div>
                                    <a
                                        href="https://wa.me/5491155898115?text=Hola%2C%20tengo%20una%20consulta%20sobre%20TikiTaka"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all text-sm whitespace-nowrap shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                    >
                                        💬 Contactar
                                    </a>
                                </div>
                            </div>
                            </>
                        ) : isOnTrial ? (
                            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <p className="text-blue-400 font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                                        En Periodo de Prueba
                                    </p>
                                    <p className="text-sm text-gray-300 mt-1">
                                        Quedan <span className="font-bold text-white">{daysRemaining} días</span>
                                    </p>
                                </div>
                                <span className="text-3xl">⏱️</span>
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
                                <p className="text-red-400 font-bold mb-2">Acceso Restringido</p>
                                <p className="text-sm text-gray-300">
                                    Tu suscripción o prueba ha finalizado. Selecciona un plan para continuar.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="lg:col-span-2 glass-card p-6 md:p-12 text-center text-white">
                        Cargando opciones...
                    </div>
                )}

                {!loading && (
                    <>
                        {/* Trial Activation */}
                        {!trialEndsAt && needsActivation && (
                            <div className="lg:col-span-2 glass-card p-6 md:p-8 border-2 border-blue-500/20 bg-blue-500/5">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-3xl">🎁</span>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            ¿Quieres probar antes de comprar?
                                        </h3>
                                        <p className="text-gray-400 mb-4 text-sm">
                                            Activa 7 días de acceso completo sin costo.
                                        </p>
                                        <button
                                            onClick={activateTrial}
                                            disabled={actionLoading}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all text-sm"
                                        >
                                            {actionLoading ? 'Activando...' : 'Comenzar Prueba Gratis'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pricing Plans */}
                        {showPricing && (
                            <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                                {/* Monthly Plan */}
                                <div className="glass-card p-8 border border-white/10 hover:border-primary/50 transition-all group relative overflow-hidden flex flex-col h-full">
                                    <div className="relative z-10 flex flex-col h-full">
                                        <h3 className="text-lg font-medium text-gray-400 uppercase tracking-wider mb-2">Mensual</h3>
                                        <div className="flex items-baseline gap-1 mb-6">
                                            <span className="text-4xl font-black text-white">${prices.monthly.toLocaleString()}</span>
                                            <span className="text-gray-500">/mes</span>
                                        </div>

                                        <ul className="space-y-3 mb-8 flex-1">
                                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                                <span className="text-green-400">✓</span> Acceso completo al sistema
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                                <span className="text-green-400">✓</span> Soporte prioritario
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                                <span className="text-green-400">✓</span> Cancelación en cualquier momento
                                            </li>
                                        </ul>

                                        <button
                                            onClick={() => subscribe('MONTHLY')}
                                            disabled={actionLoading}
                                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white transition-all group-hover:bg-primary group-hover:border-primary mt-auto"
                                        >
                                            {actionLoading ? 'Procesando...' : 'Elegir Mensual'}
                                        </button>
                                    </div>
                                </div>

                                {/* Quarterly Plan */}
                                <div className="glass-card p-8 border border-white/10 hover:border-primary/50 transition-all group relative overflow-hidden flex flex-col h-full">
                                    <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-1 rounded-bl-lg z-20">
                                        AHORRA {(monthlySavings / (prices.monthly * 3) * 100).toFixed(0)}%
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <h3 className="text-lg font-medium text-blue-400 uppercase tracking-wider mb-2">Trimestral</h3>
                                        <div className="flex items-baseline gap-1 mb-6">
                                            <span className="text-4xl font-black text-white">${prices.quarterly.toLocaleString()}</span>
                                            <span className="text-gray-500">/3 meses</span>
                                        </div>

                                        <ul className="space-y-3 mb-8 flex-1">
                                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                                <span className="text-green-400">✓</span> Todo lo del plan mensual
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                                <span className="text-green-400">✓</span> <span className="text-white font-bold">Ahorras ${monthlySavings.toLocaleString()}</span>
                                            </li>
                                        </ul>

                                        <button
                                            onClick={() => subscribe('QUARTERLY')}
                                            disabled={actionLoading}
                                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white transition-all group-hover:bg-primary/20 group-hover:border-primary/50 mt-auto"
                                        >
                                            {actionLoading ? 'Procesando...' : 'Elegir Trimestral'}
                                        </button>
                                    </div>
                                </div>

                                {/* Annual Plan - Featured */}
                                <div className="glass-card p-8 border-2 border-primary/50 relative overflow-hidden shadow-lg shadow-primary/10 bg-gradient-to-b from-primary/10 to-transparent flex flex-col h-full">
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-20 shadow-lg">
                                        MEJOR VALOR 🔥
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <h3 className="text-xl font-black text-amber-400 uppercase tracking-wider mb-2">Anual</h3>
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-4xl lg:text-5xl font-black text-white">${prices.annual.toLocaleString()}</span>
                                            <span className="text-gray-500">/año</span>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-6">
                                            Equivale a <span className="text-white font-bold">${Math.round(prices.annual / 12).toLocaleString()}/mes</span>
                                        </p>

                                        <ul className="space-y-4 mb-8 flex-1">
                                            <li className="flex items-center gap-3 text-sm text-gray-200">
                                                <span className="text-green-400">✓</span>
                                                <span>Ahorro total de <strong className="text-white">${annualSavings.toLocaleString()}</strong></span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-gray-200">
                                                <span className="text-green-400">✓</span>
                                                <span>Precio congelado por 12 meses</span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-gray-200">
                                                <span className="text-green-400">✓</span>
                                                <span>Soporte VIP Preferencial</span>
                                            </li>
                                        </ul>

                                        <button
                                            onClick={() => subscribe('ANNUAL')}
                                            disabled={actionLoading}
                                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-bold text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all text-lg mt-auto"
                                        >
                                            {actionLoading ? 'Procesando...' : 'Elegir Plan Anual'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Help Footer */}
            <div className="text-center text-gray-500 text-sm">
                ¿Necesitas ayuda? <a href="https://wa.me/5491155898115?text=Hola%2C%20necesito%20ayuda%20con%20TikiTaka" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Contacta con soporte</a>
            </div>
        </div>
    )
}
