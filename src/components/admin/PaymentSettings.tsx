'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentSettings({ initialComplex }: { initialComplex: any }) {
    const [enabled, setEnabled] = useState(initialComplex.downPaymentEnabled || false)
    const [amount, setAmount] = useState(initialComplex.downPaymentFixed || 0)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        setLoading(true)
        console.log('Sending update:', { downPaymentEnabled: enabled, downPaymentFixed: amount })
        try {
            const res = await fetch('/api/admin/complex', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    downPaymentEnabled: enabled,
                    downPaymentFixed: amount
                })
            })
            if (res.ok) {
                alert('✓ Configuración de pagos actualizada')
                router.refresh()
            } else {
                const errData = await res.json()
                alert(`Error al guardar: ${errData.details || errData.error || 'Desconocido'}`)
            }
        } catch (e) {
            alert('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass-card p-8 border border-white/[0.03]">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-xl shadow-inner border border-emerald-500/20">
                    💰
                </div>
                <div>
                    <h3 className="text-white font-black text-xl tracking-tight">Configuración de Seña</h3>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Control de pagos anticipados</p>
                </div>
            </div>

            <div className="space-y-8">
                <div 
                    className={`p-6 rounded-full border transition-all cursor-pointer group flex items-center justify-between ${enabled ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}
                    onClick={() => setEnabled(!enabled)}
                >
                    <div className="max-w-[70%]">
                        <label className="text-white font-black text-sm block cursor-pointer tracking-tight">Habilitar Seña Obrigatória</label>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 tracking-wide leading-relaxed">Pide un adelanto fijo para confirmar la reserva. Esto evita reservas falsas y asegura tu ingreso.</p>
                    </div>
                    <div className="relative inline-flex items-center">
                        <div className={`w-14 h-7 rounded-full transition-all duration-500 border relative ${enabled ? 'bg-emerald-500 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 border-white/5'}`}>
                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl ${enabled ? 'translate-x-7' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                </div>

                <div className={`transition-all duration-500 space-y-3 ${enabled ? 'opacity-100 translate-y-0' : 'opacity-20 pointer-events-none grayscale translate-y-2'}`}>
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1">Monto Fijo de Seña</label>
                    <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-lg">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                            className="w-full p-5 pl-10 bg-black/20 border border-white/5 rounded-full text-white font-black text-2xl outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-mono tracking-tighter"
                            placeholder="Ej: 5000"
                        />
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-full border border-white/5 flex gap-3 items-start">
                        <span className="text-sm opacity-50 mt-0.5">💡</span>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            IMPORTANTE: SI LA CANCHA CUESTA MENOS QUE LA SEÑA (ej. promo), EL SISTEMA COBRARÁ AUTOMÁTICAMENTE EL VALOR TOTAL DE LA CANCHA.
                        </p>
                    </div>
                </div>

                <div className="pt-8 mt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Cambios pendientes de guardado</p>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn-primary w-full sm:w-auto px-10 py-4 text-xs font-black uppercase tracking-[0.2em] disabled:opacity-30 transition-all shadow-xl shadow-primary/10"
                    >
                        {loading ? 'Procesando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>
        </div>
    )
}
