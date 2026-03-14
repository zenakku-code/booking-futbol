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
            <div className="glass-card bg-emerald-500/[0.03] border border-emerald-500/20 rounded-full p-8 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in shadow-[0_0_40px_rgba(16,185,129,0.05)]">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden p-3 border border-white/5 relative group">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img src="/mercadopago.png" alt="Mercado Pago" className="w-full h-full object-contain transform group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-emerald-400 font-black text-xl tracking-tight">Mercado Pago Conectado</h3>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center justify-center md:justify-start gap-2">
                             Vendedor: <span className="text-emerald-500/50 font-mono tracking-normal">{mpUserId || '***************'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-center md:items-end gap-3">
                    <span className="text-emerald-400 font-black text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 rounded-full uppercase tracking-[0.2em] flex items-center gap-2.5 shadow-lg shadow-emerald-500/5">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                        Pasarela Online Activa
                    </span>
                    <button
                        onClick={handleDisconnect}
                        disabled={loading}
                        className="text-gray-500 hover:text-red-400 text-[9px] uppercase font-black tracking-[0.25em] transition-all disabled:opacity-30 hover:underline"
                    >
                        {loading ? 'Sincronizando...' : 'Desvincular Cuenta'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="glass-card p-8 border border-white/[0.03] group hover:border-primary/30 transition-all duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden p-4 border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:rotate-3">
                        <img src="/mercadopago.png" alt="Conectar Mercado Pago" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <h3 className="text-white font-black text-2xl tracking-tight group-hover:text-primary transition-colors">Cobros Automatizados</h3>
                        <p className="text-gray-500 text-sm font-bold leading-relaxed max-w-lg">
                            Vincula tu cuenta oficial para recibir los pagos de las señas automáticamente. <span className="text-gray-400">Tus clientes podrán pagar con tarjeta, transferencia o saldo en cuenta.</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="btn btn-primary w-full md:w-auto px-12 py-5 text-xs font-black uppercase tracking-[0.25em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 rounded-full"
                >
                    {loading ? (
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Conectando...</span>
                        </div>
                    ) : (
                        <>Vincular Ahora ⚡</>
                    )}
                </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="text-primary/40">🔒</span> Seguridad Garantizada: Nunca accedemos a tus claves.
                </p>
                <div className="flex items-center gap-4 opacity-30 grayscale group-hover:opacity-60 group-hover:grayscale-0 transition-all duration-700">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Soportado por</span>
                    <img src="/mercadopago.png" className="h-3 w-auto object-contain" alt="MP Logo" />
                </div>
            </div>
        </div>
    )
}
