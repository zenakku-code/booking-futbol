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

    if (isConnected) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden p-2">
                        {/* Logo MP Placeholder Seguro */}
                        <svg viewBox="0 0 24 24" fill="#009EE3" className="w-10 h-10">
                            <path d="M14.6 12.8c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5-1.5.7-1.5 1.5.7 1.5 1.5 1.5zm-5.2 0c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5-1.5.7-1.5 1.5.7 1.5 1.5 1.5z" />
                            <path d="M21 11c0-5.5-4.5-10-10-10S1 5.5 1 11c0 4.1 2.5 7.6 6 9.2V22l4-2 4 2v-1.8c3.5-1.6 6-5.1 6-9.2zM8 11.3c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7-2.7-1.2-2.7-2.7zm9.3 2.7c-1.1 0-2 .9-2 2v2c0 .6-.4 1-1 1H9.7c-.6 0-1-.4-1-1v-2c0-1.1-.9-2-2-2-.6 0-1 .4-1 1v2c0 1.7 1.3 3 3 3h4.6c1.7 0 3-1.3 3-3v-2c0-.6-.4-1-1-1z" />
                        </svg>
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-emerald-400 font-bold text-lg">Mercado Pago Conectado</h3>
                        <p className="text-emerald-200/70 text-xs font-mono">ID Vendedor: {mpUserId || '***************'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold text-xs bg-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        Activo
                    </span>
                    {/* Botón de actualizar token si fuera necesario en el futuro */}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 group hover:border-blue-500/30 transition-all">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                        <span className="text-2xl">🤝</span>
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
