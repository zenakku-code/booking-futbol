'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SubscriptionStatus {
    hasAccess: boolean
    isActive: boolean
    trialExpired: boolean
    trialEndsAt: string | null
    subscriptionDate: string | null
}

export default function SubscriptionClient({ complex }: { complex: any }) {
    const router = useRouter()
    const [status, setStatus] = useState<SubscriptionStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchStatus()
    }, [])

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/saas/status')
            console.log('Status API Response:', res.status, res.statusText)

            if (res.ok) {
                const data = await res.json()
                console.log('Status API Data:', data)
                setStatus(data)
            } else {
                const errorData = await res.json()
                console.error('Status API Error:', errorData)
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

    const subscribe = async () => {
        setActionLoading(true)
        setError('')

        try {
            const res = await fetch('/api/subscription/subscribe', {
                method: 'POST'
            })

            const data = await res.json()

            if (res.ok) {
                router.refresh()
                fetchStatus()
            } else {
                setError(data.error || 'Error al activar la suscripción')
            }
        } catch (e) {
            setError('Error de conexión')
        } finally {
            setActionLoading(false)
        }
    }

    const daysRemaining = status?.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(status.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : complex?.trialEndsAt
            ? Math.max(0, Math.ceil((new Date(complex.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            : null

    // Use API status if available, otherwise fallback to complex data
    const trialEndsAt = status?.trialEndsAt || complex?.trialEndsAt
    const subscriptionDate = status?.subscriptionDate || complex?.subscriptionDate
    const now = new Date()
    const trialExpired = trialEndsAt ? new Date(trialEndsAt) < now : false

    const isOnTrial = trialEndsAt && !trialExpired
    const hasSubscription = !!subscriptionDate
    const needsActivation = !trialEndsAt && !hasSubscription

    // Debug logging
    console.log('Subscription Status:', {
        status,
        complex,
        isOnTrial,
        hasSubscription,
        needsActivation,
        daysRemaining,
        trialEndsAt,
        trialExpired
    })

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
                {/* Estado del Software */}
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
                        {complex.subscriptionActive || hasSubscription ? (
                            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="text-green-400 font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        Sistema Activo
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {hasSubscription ? 'Suscripción paga activa' : 'Acceso completo al sistema'}
                                    </p>
                                </div>
                                <span className="text-2xl">✅</span>
                            </div>
                        ) : (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                                <p className="text-amber-400 font-bold mb-2">Pago Pendiente</p>
                                <p className="text-sm text-gray-300">
                                    Activa tu prueba gratuita o suscríbete para acceder a todas las funciones.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Trial Status Card */}
                {loading ? (
                    <div className="lg:col-span-2 glass-card p-8 text-center">
                        <div className="text-white">Cargando estado...</div>
                    </div>
                ) : (
                    <>
                        {/* Need Activation */}
                        {needsActivation && (
                            <div className="lg:col-span-2 glass-card p-8 border-2 border-blue-500/20">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-4xl">🎁</span>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            Prueba Gratuita Disponible
                                        </h3>
                                        <p className="text-gray-400 mb-4">
                                            Activa 7 días de prueba sin compromisos ni tarjeta de crédito
                                        </p>
                                        <button
                                            onClick={activateTrial}
                                            disabled={actionLoading}
                                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {actionLoading ? 'Activando...' : '🚀 Activar Prueba Gratis'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* On Trial */}
                        {isOnTrial && (
                            <div className="lg:col-span-2 glass-card p-8 border-2 border-amber-500/20">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 ${daysRemaining! <= 2 ? 'bg-red-500/20' :
                                        daysRemaining! <= 5 ? 'bg-amber-500/20' :
                                            'bg-blue-500/20'
                                        }`}>
                                        <span className="text-4xl">⏱️</span>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            Período de Prueba Activo
                                        </h3>
                                        <p className="text-gray-400 mb-1">
                                            Te quedan <span className="text-white font-bold text-xl">{daysRemaining}</span> días de prueba
                                        </p>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Vence el {trialEndsAt && new Date(trialEndsAt).toLocaleDateString('es-AR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <button
                                            onClick={subscribe}
                                            disabled={actionLoading}
                                            className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {actionLoading ? 'Procesando...' : '💳 Cancelar Prueba y Pagar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Trial Expired */}
                        {status?.trialExpired && !hasSubscription && (
                            <div className="lg:col-span-2 glass-card p-8 border-2 border-red-500/20">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-4xl">⚠️</span>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            Prueba Expirada
                                        </h3>
                                        <p className="text-gray-400 mb-4">
                                            Tu período de prueba ha finalizado. Suscríbete para continuar.
                                        </p>
                                        <button
                                            onClick={subscribe}
                                            disabled={actionLoading}
                                            className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {actionLoading ? 'Procesando...' : '💳 Suscribirse Ahora'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Has Subscription */}
                        {hasSubscription && (
                            <div className="lg:col-span-2 glass-card p-8 border-2 border-green-500/20">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-4xl">✅</span>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            Suscripción Activa
                                        </h3>
                                        <p className="text-gray-400 mb-1">
                                            Tienes acceso completo al sistema
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Suscrito desde {subscriptionDate && new Date(subscriptionDate).toLocaleDateString('es-AR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Help Footer */}
            <div className="text-center text-gray-500 text-sm">
                ¿Necesitas ayuda? <a href="#" className="text-primary hover:underline">Contacta con soporte</a>
            </div>
        </div>
    )
}
