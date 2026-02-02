'use client'
import { useState } from 'react'

interface OAuthConnectProps {
    isConnected: boolean
    mpUserId?: string
    complexId: string
}

export default function OAuthConnect({ isConnected, mpUserId, complexId }: OAuthConnectProps) {
    const [loading, setLoading] = useState(false)

    const handleConnect = () => {
        setLoading(true)
        window.location.href = `/api/auth/mercadopago/authorize?complexId=${complexId}`
    }

    const handleDisconnect = async () => {
        if (!confirm('¿Seguro que deseas desconectar Mercado Pago? Dejarás de recibir cobros automatizados.')) return

        setLoading(true)
        try {
            const res = await fetch('/api/auth/mercadopago/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ complexId })
            })

            if (res.ok) {
                // Remove param from URL first
                const url = new URL(window.location.href)
                url.searchParams.delete('status')
                window.history.replaceState({}, '', url.toString())
                window.location.reload()
            } else {
                alert('Error al desconectar')
            }
        } catch (e) {
            console.error(e)
            alert('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    if (isConnected) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden p-2">
                        <img src="/mercadopago.png" alt="Mercado Pago" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-emerald-400 font-bold text-lg">Mercado Pago Conectado</h3>
                        <p className="text-emerald-200/70 text-xs font-mono">ID Vendedor: {mpUserId || '***************'}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="text-emerald-400 font-bold text-xs bg-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        Activo
                    </span>
                    <button
                        onClick={handleDisconnect}
                        disabled={loading}
                        className="text-white/40 hover:text-red-400 text-[10px] uppercase font-bold tracking-wider transition-colors disabled:opacity-50"
                    >
                        {loading ? '...' : 'Desconectar'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 group hover:border-blue-500/30 transition-all">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden p-2 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                        <img src="/mercadopago.png" alt="Conectar Mercado Pago" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-white font-bold text-lg group-hover:text-[#009EE3] transition-colors">Conectar Mercado Pago</h3>
                        <p className="text-gray-400 text-sm max-w-md">
                            Vincula tu cuenta oficial para recibir los pagos de las señas automáticamente y de forma segura sin compartir contraseñas.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="btn bg-[#009EE3] hover:bg-[#0081B9] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all w-full md:w-auto justify-center disabled:opacity-70 disabled:scale-100"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Conectando...
                        </>
                    ) : (
                        'Vincular Ahora'
                    )}
                </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 text-center md:text-left">
                Serás redirigido al sitio seguro de Mercado Pago. Nosotros nunca veremos tus claves.
            </p>
        </div>
    )
}
