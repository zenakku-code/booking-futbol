'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscriptionStatus({ complex }: { complex: any }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handlePaySubscription = async () => {
        setIsLoading(true)
        try {
            // In a real scenario, this would create a Mercado Pago preference 
            // specifically for the SaaS platform owner.
            // For now, we simulate the activation.
            const res = await fetch('/api/admin/complex/subscribe', {
                method: 'POST'
            })

            if (res.ok) {
                const data = await res.json()
                if (data.init_point) {
                    window.location.href = data.init_point
                } else {
                    alert('Suscripción activada (Modo simulación)')
                    router.refresh()
                }
            }
        } catch (error) {
            console.error(error)
            alert('Error al procesar el pago')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="glass p-8 rounded-full max-w-2xl border-2 border-primary/20">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/20 rounded-full">
                    <span className="text-2xl">🚀</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Estado del Software</h3>
                    <p className="text-gray-400 text-sm">Gestiona tu licencia de uso del sistema.</p>
                </div>
            </div>

            <div className="space-y-6 border-t border-slate-700 pt-6">
                {complex.subscriptionActive ? (
                    <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-full flex items-center justify-between">
                        <div>
                            <p className="text-green-400 font-bold flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Licencia Activa
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Gracias por confiar en nuestra plataforma.
                            </p>
                        </div>
                        <span className="text-2xl">✅</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-full">
                            <p className="text-amber-400 font-bold mb-2">Pago Pendiente</p>
                            <p className="text-sm text-gray-300">
                                Tu complejo está registrado pero las funciones de reserva y gestión de canchas están bloqueadas hasta que se complete el pago inicial.
                            </p>
                            <div className="mt-4 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">$15.000</span>
                                <span className="text-xs text-gray-500">pago único / inicial</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePaySubscription}
                            disabled={isLoading}
                            className="btn btn-primary w-full py-4 rounded-full font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {isLoading ? 'Procesando...' : 'PAGAR AHORA Y ACTIVAR'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
